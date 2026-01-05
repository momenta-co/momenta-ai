'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

// ============================================
// TYPES
// ============================================
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AudioVisualizerData {
  volume: number;
  frequencies: number[];
}

// ============================================
// MONSTERA LEAF - Living Digital Voice
// Original sphere animation deformed into leaf shape
// Luminous center, soft edges, ethereal glow
// ============================================

// MONSTERA - Vertex Shader (original sphere waves + leaf deformation + voice reactivity)
const monsteraVertexShader = `
  uniform float uTime;
  uniform float uAmplitude;
  uniform float uBreathing;
  uniform float uVoiceAmplitude;    // Voice volume (0-1)
  uniform float uVoiceBass;         // Low frequencies
  uniform float uVoiceMid;          // Mid frequencies
  uniform float uVoiceHigh;         // High frequencies
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying float vDisplacement;

  #define PI 3.14159265359

  // Wave source points that slowly move around
  vec3 getWaveSource(int index, float time) {
    float angle1 = time * 0.15 + float(index) * 2.094;
    float angle2 = time * 0.1 + float(index) * 1.571;
    return normalize(vec3(
      sin(angle1) * cos(angle2),
      sin(angle2) * 0.7,
      cos(angle1) * cos(angle2)
    ));
  }

  // Geodesic distance on sphere
  float sphericalDistance(vec3 p1, vec3 p2) {
    return acos(clamp(dot(normalize(p1), normalize(p2)), -1.0, 1.0));
  }

  // Organic curved ripple wave - smoother, no linear artifacts
  float rippleWave(vec3 pos, vec3 source, float time, float frequency, float speed, float decay) {
    float dist = sphericalDistance(pos, source);

    // Use smoothstep-based wave instead of pure sin for softer curves
    float phase = dist * frequency - time * speed;
    float wave = sin(phase) * 0.7 + sin(phase * 0.5 + 0.5) * 0.3;

    // Smooth envelope with gradual falloff
    float envelope = smoothstep(PI, 0.0, dist) * exp(-dist * decay * 0.5);

    return wave * envelope;
  }

  // Organic noise for natural variation
  float organicNoise(vec3 p, float time) {
    float n = sin(p.x * 2.3 + time * 0.3) * sin(p.y * 2.1 - time * 0.4) * sin(p.z * 1.9 + time * 0.2);
    n += sin(p.x * 1.1 - p.y * 1.3 + time * 0.5) * 0.5;
    return n * 0.5 + 0.5;
  }

  // Subtle leaf silhouette deformation
  // Keeps ethereal sphere quality with hint of leaf shape
  vec3 deformToLeaf(vec3 pos) {
    vec3 p = pos;

    // Gentle vertical stretch (oval shape)
    p.y *= 1.18;

    // Soft heart indent at top
    float topFade = smoothstep(0.5, 0.9, p.y);
    p.y -= topFade * 0.08 * (1.0 - abs(p.x) * 1.2);

    // Gentle point at bottom
    float bottomFade = smoothstep(-0.3, -0.85, p.y);
    float taper = bottomFade * 0.35;
    p.x *= (1.0 - taper);
    p.z *= (1.0 - taper * 0.5);

    return normalize(p);
  }

  void main() {
    // Deform to leaf shape first
    vec3 leafPos = deformToLeaf(position);
    vec3 pos = normalize(leafPos);
    vPosition = leafPos;

    // ========================================
    // WAVE DISPLACEMENT (with voice reactivity)
    // ========================================
    float displacement = 0.0;

    vec3 source1 = getWaveSource(0, uTime);
    vec3 source2 = getWaveSource(1, uTime);
    vec3 source3 = getWaveSource(2, uTime);

    // Base organic curved waves - INCREASED INTENSITY for more visible movement
    displacement += rippleWave(pos, source1, uTime, 1.8, 0.4, 1.2) * 0.12;
    displacement += rippleWave(pos, source2, uTime, 1.4, 0.35, 1.0) * 0.10;
    displacement += rippleWave(pos, source3, uTime, 2.0, 0.5, 1.4) * 0.08;

    // ========================================
    // VOICE-REACTIVE WAVES
    // ========================================
    // Bass frequencies - slow, large waves from bottom
    vec3 bassSource = vec3(0.0, -1.0, 0.0);
    float bassWave = rippleWave(pos, bassSource, uTime * 1.5, 1.2, 0.8, 0.8);
    displacement += bassWave * uVoiceBass * 0.15;

    // Mid frequencies - medium waves from sides
    vec3 midSource1 = vec3(sin(uTime * 0.5), 0.0, cos(uTime * 0.5));
    vec3 midSource2 = vec3(-sin(uTime * 0.5), 0.0, -cos(uTime * 0.5));
    float midWave = rippleWave(pos, midSource1, uTime * 2.0, 2.5, 1.2, 1.0);
    midWave += rippleWave(pos, midSource2, uTime * 2.0, 2.5, 1.2, 1.0);
    displacement += midWave * uVoiceMid * 0.12;

    // High frequencies - fast, small ripples from top
    vec3 highSource = vec3(0.0, 1.0, 0.0);
    float highWave = rippleWave(pos, highSource, uTime * 3.0, 4.0, 2.0, 1.5);
    highWave += sin(pos.x * 8.0 + uTime * 4.0) * sin(pos.z * 8.0 - uTime * 3.5) * 0.5;
    displacement += highWave * uVoiceHigh * 0.08;

    // Voice amplitude boost - only when actually speaking
    if (uVoiceAmplitude > 0.05) {
      displacement *= (1.0 + uVoiceAmplitude * 1.2);
    }

    // Organic noise for natural curved variation
    float noise = organicNoise(pos, uTime);
    displacement += (noise - 0.5) * 0.03;

    // Breathing animation
    float breathing = sin(uTime * 0.8) * 0.5 + 0.5;
    breathing = breathing * breathing;
    float breathScale = 1.0 + breathing * uBreathing * 0.10;

    displacement *= uAmplitude;
    vDisplacement = displacement;

    vec3 leafNormal = normalize(leafPos);
    vec3 newPosition = leafPos * breathScale + leafNormal * displacement;

    // Calculate normal
    float epsilon = 0.02;
    vec3 tangent = normalize(cross(leafNormal, vec3(0.0, 1.0, 0.0)));
    if (length(tangent) < 0.01) tangent = normalize(cross(leafNormal, vec3(1.0, 0.0, 0.0)));
    vec3 bitangent = normalize(cross(leafNormal, tangent));

    vec3 p1 = deformToLeaf(normalize(position + tangent * epsilon));
    vec3 p2 = deformToLeaf(normalize(position + bitangent * epsilon));

    float d1 = rippleWave(normalize(p1), source1, uTime, 1.8, 0.4, 1.2) * 0.06;
    d1 += rippleWave(normalize(p1), source2, uTime, 1.4, 0.35, 1.0) * 0.05;

    float d2 = rippleWave(normalize(p2), source1, uTime, 1.8, 0.4, 1.2) * 0.06;
    d2 += rippleWave(normalize(p2), source2, uTime, 1.4, 0.35, 1.0) * 0.05;

    d1 *= uAmplitude;
    d2 *= uAmplitude;

    vec3 neighbor1 = p1 * breathScale + normalize(p1) * d1;
    vec3 neighbor2 = p2 * breathScale + normalize(p2) * d2;

    vNormal = normalize(cross(neighbor1 - newPosition, neighbor2 - newPosition));
    vWorldPosition = (modelMatrix * vec4(newPosition, 1.0)).xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

// MONSTERA - Fragment Shader (same ethereal effect as sphere)
const monsteraFragmentShader = `
  uniform vec3 uColorEdge;
  uniform vec3 uColorMid;
  uniform vec3 uColorCenter;
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying float vDisplacement;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);

    // Fresnel - same as original sphere
    float fresnel = dot(viewDir, normal);
    fresnel = clamp(fresnel, 0.0, 1.0);

    float centerIntensity = pow(fresnel, 0.8);
    float edgeIntensity = 1.0 - fresnel;

    // Luminous center
    float innerGlow = pow(fresnel, 1.5);
    float coreGlow = pow(fresnel, 3.0);

    // Color gradient
    float gradientPos = pow(fresnel, 0.6);

    vec3 baseColor;
    if (gradientPos < 0.5) {
      baseColor = mix(uColorEdge, uColorMid, gradientPos * 2.0);
    } else {
      baseColor = mix(uColorMid, uColorCenter, (gradientPos - 0.5) * 2.0);
    }

    // Lighting
    vec3 lightDir = normalize(vec3(1.0, 2.0, 3.0));
    float diffuse = max(dot(normal, lightDir), 0.0) * 0.3 + 0.7;

    vec3 halfDir = normalize(lightDir + viewDir);
    float specular = pow(max(dot(normal, halfDir), 0.0), 60.0) * 0.5;

    // Final color
    vec3 color = baseColor * diffuse;
    color += uColorCenter * innerGlow * 0.7;
    color += vec3(1.0) * coreGlow * 0.5;
    color += vec3(1.0) * specular;

    // Shimmer
    float shimmer = sin(vDisplacement * 20.0 + uTime * 2.5) * 0.5 + 0.5;
    shimmer *= innerGlow;
    color += uColorCenter * shimmer * 0.1;

    // Soft alpha - same as original sphere
    float alpha = smoothstep(0.0, 0.3, fresnel);

    gl_FragColor = vec4(color, alpha);
  }
`;

// GLASS CONTAINER - Vertex Shader
const glassVertexShader = `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec2 vUv;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// GLASS CONTAINER - Fragment Shader (ethereal, barely visible)
const glassFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec2 vUv;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);

    // Fresnel - visible at grazing angles
    float fresnel = 1.0 - abs(dot(viewDir, normal));
    fresnel = pow(fresnel, 2.5);

    // Very subtle glass tint
    vec3 glassColor = vec3(0.92, 0.96, 0.94);

    // Soft specular
    vec3 lightDir = normalize(vec3(2.0, 3.0, 4.0));
    vec3 halfDir = normalize(lightDir + viewDir);
    float specular = pow(max(dot(normal, halfDir), 0.0), 120.0);

    // Combine
    vec3 color = glassColor * fresnel * 0.2;
    color += vec3(1.0) * specular * 0.5;

    // Very low opacity
    float alpha = fresnel * 0.15 + specular * 0.4;

    gl_FragColor = vec4(color, alpha);
  }
`;


// ============================================
// THREE.JS MONSTERA LEAF COMPONENT
// ============================================
function MonsteraLeaf({
  intensity = 0.3,
  isListening = false,
  audioData
}: {
  intensity?: number;
  isListening?: boolean;
  audioData?: AudioVisualizerData;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const leafRef = useRef<THREE.Mesh | null>(null);
  const frameRef = useRef<number>(0);
  const targetIntensity = useRef(intensity);

  // Audio data refs for smooth animation
  const audioDataRef = useRef<AudioVisualizerData>({ volume: 0, frequencies: [] });
  const smoothedAudioRef = useRef({
    volume: 0,
    bass: 0,
    mid: 0,
    high: 0
  });
  const isListeningRef = useRef(isListening);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera - front-facing
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.z = 3.5;
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(400, 400);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 2, 4);
    scene.add(directionalLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
    backLight.position.set(-1, -1, -2);
    scene.add(backLight);

    // ========================================
    // MOMENTA BRAND COLORS - Sage palette from website
    // ========================================
    const colorEdge = new THREE.Color('#8fb89a');   // sage-dark
    const colorMid = new THREE.Color('#b3d0bb');    // sage (main brand color)
    const colorCenter = new THREE.Color('#e8f4ec'); // Very light sage/cream center

    // ========================================
    // ICOSAHEDRON GEOMETRY - smooth with more subdivisions
    // ========================================
    const leafGeometry = new THREE.IcosahedronGeometry(1, 64);

    const leafMaterial = new THREE.ShaderMaterial({
      vertexShader: monsteraVertexShader,
      fragmentShader: monsteraFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: 0.4 },
        uBreathing: { value: 1.0 },
        uColorEdge: { value: colorEdge },
        uColorMid: { value: colorMid },
        uColorCenter: { value: colorCenter },
        // Voice reactive uniforms
        uVoiceAmplitude: { value: 0 },
        uVoiceBass: { value: 0 },
        uVoiceMid: { value: 0 },
        uVoiceHigh: { value: 0 },
      },
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
    });

    const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
    scene.add(leaf);
    leafRef.current = leaf;

    // ========================================
    // ANIMATION LOOP
    // ========================================
    let time = 0;
    const smoothingFactor = 0.15; // How quickly values respond (higher = faster)
    const decayFactor = 0.92;     // How quickly values decay when voice stops

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);

      time += 0.012; // Same speed as original sphere

      if (leafRef.current) {
        const mat = leafRef.current.material as THREE.ShaderMaterial;
        mat.uniforms.uTime.value = time;

        // Smooth amplitude transitions - gentler waves
        const listening = isListeningRef.current;
        const targetAmplitude = listening ? 0.6 : 0.4;
        const currentAmplitude = mat.uniforms.uAmplitude.value;
        mat.uniforms.uAmplitude.value += (targetAmplitude - currentAmplitude) * 0.03;

        // Breathing intensity
        const targetBreathing = listening ? 1.5 : 1.0;
        const currentBreathing = mat.uniforms.uBreathing.value;
        mat.uniforms.uBreathing.value += (targetBreathing - currentBreathing) * 0.02;

        // ========================================
        // VOICE REACTIVE ANIMATION
        // ========================================
        const audio = audioDataRef.current;
        const smoothed = smoothedAudioRef.current;

        if (audio.frequencies && audio.frequencies.length > 0) {
          // Calculate frequency bands from audio data
          const freqCount = audio.frequencies.length;

          // Bass: first 1/4 of frequencies
          const bassEnd = Math.floor(freqCount / 4);
          let bassSum = 0;
          for (let i = 0; i < bassEnd; i++) {
            bassSum += audio.frequencies[i] || 0;
          }
          const targetBass = bassSum / bassEnd;

          // Mid: middle 1/2 of frequencies
          const midStart = bassEnd;
          const midEnd = Math.floor(freqCount * 3 / 4);
          let midSum = 0;
          for (let i = midStart; i < midEnd; i++) {
            midSum += audio.frequencies[i] || 0;
          }
          const targetMid = midSum / (midEnd - midStart);

          // High: last 1/4 of frequencies
          let highSum = 0;
          for (let i = midEnd; i < freqCount; i++) {
            highSum += audio.frequencies[i] || 0;
          }
          const targetHigh = highSum / (freqCount - midEnd);

          // Smooth transitions for all values
          smoothed.volume += (audio.volume - smoothed.volume) * smoothingFactor;
          smoothed.bass += (targetBass - smoothed.bass) * smoothingFactor;
          smoothed.mid += (targetMid - smoothed.mid) * smoothingFactor;
          smoothed.high += (targetHigh - smoothed.high) * smoothingFactor;
        } else {
          // Decay values when no audio
          smoothed.volume *= decayFactor;
          smoothed.bass *= decayFactor;
          smoothed.mid *= decayFactor;
          smoothed.high *= decayFactor;
        }

        // Update shader uniforms
        mat.uniforms.uVoiceAmplitude.value = smoothed.volume;
        mat.uniforms.uVoiceBass.value = smoothed.bass;
        mat.uniforms.uVoiceMid.value = smoothed.mid;
        mat.uniforms.uVoiceHigh.value = smoothed.high;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const size = Math.min(containerRef.current.offsetWidth, 400);
      renderer.setSize(size, size);
      camera.aspect = 1;
      camera.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameRef.current);
      renderer.dispose();
      leafGeometry.dispose();
      leafMaterial.dispose();
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update refs for the animation loop (refs allow animation loop to access current values)
  useEffect(() => {
    isListeningRef.current = isListening;

    if (audioData) {
      audioDataRef.current = audioData;
    }

    if (isListening && audioData) {
      targetIntensity.current = 0.3 + audioData.volume * 0.8;
    } else if (isListening) {
      targetIntensity.current = 0.5;
    } else {
      targetIntensity.current = intensity;
      // Clear audio data when not listening
      audioDataRef.current = { volume: 0, frequencies: [] };
    }
  }, [isListening, audioData, intensity]);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-[400px] aspect-square mx-auto"
      style={{
        transition: 'transform 0.5s ease',
        transform: isListening ? 'scale(1.02)' : 'scale(1)'
      }}
    />
  );
}

// ============================================
// AUDIO WAVEFORM VISUALIZER
// ============================================
function AudioWaveform({ audioData, isActive }: { audioData?: AudioVisualizerData; isActive: boolean }) {
  const bars = 32;

  return (
    <div className="flex items-center justify-center gap-[2px] h-8">
      {Array.from({ length: bars }).map((_, i) => {
        const frequency = audioData?.frequencies?.[i] || 0;
        const height = isActive ? Math.max(4, frequency * 32) : 4;

        return (
          <div
            key={i}
            className="w-[3px] rounded-full transition-all duration-75"
            style={{
              height: `${height}px`,
              backgroundColor: `rgba(143, 184, 154, ${0.4 + (frequency || 0) * 0.6})`,
              transform: `scaleY(${isActive ? 1 : 0.3})`,
            }}
          />
        );
      })}
    </div>
  );
}

// ============================================
// CHAT MESSAGE COMPONENT
// ============================================
function ChatMessage({ message, index }: { message: Message; index: number }) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
    >
      <div
        className={`
          max-w-[85%] px-5 py-3.5 rounded-2xl
          ${isUser
            ? 'bg-sage text-charcoal rounded-br-md'
            : 'bg-white text-charcoal rounded-bl-md shadow-sm border border-sage-light/30'
          }
        `}
      >
        <p className="text-[15px] leading-relaxed font-sans">{message.content}</p>
        <span className="text-[11px] text-warm-gray mt-1.5 block opacity-60">
          {message.timestamp.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

// ============================================
// TYPING INDICATOR
// ============================================
function TypingIndicator() {
  return (
    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2">
      <div className="bg-white px-5 py-4 rounded-2xl rounded-bl-md shadow-sm border border-sage-light/30">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-sage-dark rounded-full animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function AIChatVoice() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hola, soy tu asistente de Momenta. Puedo ayudarte a encontrar experiencias únicas, planificar eventos especiales o responder cualquier pregunta. ¿En qué puedo ayudarte hoy?',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [audioData, setAudioData] = useState<AudioVisualizerData>({ volume: 0, frequencies: [] });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number>(0);
  const isListeningRef = useRef(false); // Ref for animation loop access

  // Scroll to bottom when messages change (only within chat container)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, isTyping]);

  // Audio analysis for visualization
  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current || !isListeningRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate volume
    const sum = dataArray.reduce((a, b) => a + b, 0);
    const volume = sum / dataArray.length / 255;

    // Get frequency bars
    const frequencies: number[] = [];
    const step = Math.floor(dataArray.length / 32);
    for (let i = 0; i < 32; i++) {
      frequencies.push(dataArray[i * step] / 255);
    }

    setAudioData({ volume, frequencies });

    // Use ref to check if still listening (ref is always current)
    if (isListeningRef.current) {
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    }
  }, []);

  // Start voice recording
  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      // Set ref BEFORE starting analysis loop (ref is synchronous)
      isListeningRef.current = true;
      setIsListening(true);
      analyzeAudio();
    } catch (error) {
      console.error('Microphone access denied:', error);
    }
  };

  // Stop voice recording
  const stopListening = () => {
    // Set ref FIRST to stop the analysis loop
    isListeningRef.current = false;

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    cancelAnimationFrame(animationFrameRef.current);
    setIsListening(false);
    setAudioData({ volume: 0, frequencies: [] });

    // Simulate voice input (in production, this would send to speech-to-text)
    simulateVoiceMessage();
  };

  // Toggle voice recording
  const toggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Simulate voice message (demo purposes)
  const simulateVoiceMessage = () => {
    const voiceMessages = [
      '¿Qué experiencias románticas tienen disponibles?',
      'Me gustaría organizar un evento corporativo',
      'Busco algo especial para un cumpleaños',
    ];
    const randomMessage = voiceMessages[Math.floor(Math.random() * voiceMessages.length)];
    handleSendMessage(randomMessage);
  };

  // Send message
  const handleSendMessage = (text: string = inputValue) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      setIsTyping(false);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getAIResponse(text),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 1500 + Math.random() * 1000);
  };

  // Demo AI responses
  const getAIResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('romántic') || lowerInput.includes('pareja')) {
      return 'Tenemos experiencias románticas increíbles: desde cenas privadas con chef personal, hasta paseos en globo al amanecer. ¿Te gustaría que te cuente más sobre alguna en particular?';
    }
    if (lowerInput.includes('corporativ') || lowerInput.includes('empresa') || lowerInput.includes('equipo')) {
      return 'Nuestras experiencias corporativas están diseñadas para fortalecer equipos. Ofrecemos talleres de cocina colaborativa, escape rooms exclusivos y actividades de bienestar. ¿Cuántas personas conforman tu equipo?';
    }
    if (lowerInput.includes('cumpleaños') || lowerInput.includes('celebra')) {
      return 'Para celebraciones especiales, puedo recomendarte desde experiencias gastronómicas exclusivas hasta aventuras únicas. ¿Me cuentas más sobre quién es el homenajeado y qué le gusta?';
    }
    return 'Excelente pregunta. En Momenta nos especializamos en crear momentos inolvidables. Tenemos experiencias de gastronomía, bienestar, aventura y mucho más. ¿Qué tipo de experiencia te interesa explorar?';
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <section className="relative min-h-screen bg-cream overflow-hidden">
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' fill='%232d2d2d' fill-opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: '30px 30px',
        }}
      />

      {/* Gradient orbs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-sage/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-sage-light/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 bg-sage-light/40 text-sage-dark text-sm font-medium rounded-full mb-4">
            Asistente Inteligente
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl text-charcoal mb-4 font-serif">
            Habla con Momenta
          </h1>
          <p className="text-warm-gray text-lg max-w-2xl mx-auto font-sans">
            Tu concierge personal para descubrir experiencias extraordinarias.
            Escribe o usa tu voz para comenzar.
          </p>
        </div>

        {/* Main chat container */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: Monstera Leaf */}
          <div className="order-2 lg:order-1 flex flex-col items-center">
            <MonsteraLeaf
              intensity={isListening ? 0.5 : 0.3}
              isListening={isListening}
              audioData={audioData}
            />

            {/* Voice controls */}
            <div className="mt-6 flex flex-col items-center gap-4">
              {/* Waveform visualizer */}
              <div className={`transition-all duration-300 ${isListening ? 'opacity-100' : 'opacity-0'}`}>
                <AudioWaveform audioData={audioData} isActive={isListening} />
              </div>

              {/* Microphone button */}
              <button
                onClick={toggleVoice}
                className={`
                  relative w-16 h-16 rounded-full flex items-center justify-center
                  transition-all duration-300 ease-out
                  ${isListening
                    ? 'bg-sage-dark text-white shadow-lg shadow-sage/30 scale-110'
                    : 'bg-white text-sage-dark hover:bg-sage-light/30 shadow-md hover:shadow-lg border border-sage-light/50'
                  }
                `}
              >
                {/* Pulsing ring when listening */}
                {isListening && (
                  <>
                    <span className="absolute inset-0 rounded-full bg-sage-dark/30 animate-ping" />
                    <span className="absolute -inset-2 rounded-full border-2 border-sage/40 animate-pulse" />
                  </>
                )}

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-7 h-7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </svg>
              </button>

              <span className={`text-sm transition-all duration-300 ${isListening ? 'text-sage-dark font-medium' : 'text-warm-gray'}`}>
                {isListening ? 'Escuchando...' : 'Toca para hablar'}
              </span>
            </div>
          </div>

          {/* Right: Chat interface */}
          <div className="order-1 lg:order-2">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-charcoal/5 border border-sage-light/30 overflow-hidden">
              {/* Chat header */}
              <div className="px-6 py-4 border-b border-sage-light/30 bg-gradient-to-r from-sage-light/20 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sage to-sage-dark flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-charcoal font-medium font-sans">Momenta Friend</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-sage rounded-full animate-pulse" />
                      <span className="text-xs text-warm-gray">Siempre disponible</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages area */}
              <div className="h-[400px] overflow-y-auto p-6 space-y-4 scrollbar-thin">
                {messages.map((message, index) => (
                  <ChatMessage key={message.id} message={message} index={index} />
                ))}
                {isTyping && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="px-6 py-4 border-t border-sage-light/30 bg-beige/30">
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Pregúntame cualquier cosa..."
                      className="
                        w-full px-5 py-3.5 bg-white rounded-2xl
                        text-charcoal placeholder:text-warm-gray/60
                        border border-sage-light/40
                        focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20
                        transition-all duration-200
                        font-sans text-[15px]
                      "
                    />
                  </div>

                  {/* Voice button (mobile) */}
                  <button
                    onClick={toggleVoice}
                    className={`
                      lg:hidden w-12 h-12 rounded-xl flex items-center justify-center
                      transition-all duration-200
                      ${isListening
                        ? 'bg-sage-dark text-white'
                        : 'bg-sage-light/40 text-sage-dark hover:bg-sage-light'
                      }
                    `}
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" x2="12" y1="19" y2="22" />
                    </svg>
                  </button>

                  {/* Send button */}
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputValue.trim()}
                    className="
                      w-12 h-12 rounded-xl bg-charcoal text-white
                      flex items-center justify-center
                      hover:bg-charcoal/90 disabled:opacity-40 disabled:cursor-not-allowed
                      transition-all duration-200
                      hover:scale-105 active:scale-95
                    "
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2">
                      <path d="m22 2-7 20-4-9-9-4Z" />
                      <path d="M22 2 11 13" />
                    </svg>
                  </button>
                </div>

                {/* Quick suggestions */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {['Experiencias románticas', 'Eventos corporativos', 'Talleres de cocina'].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSendMessage(suggestion)}
                      className="
                        px-4 py-2 rounded-full text-sm
                        bg-sage-light/30 text-sage-dark
                        hover:bg-sage-light/50
                        transition-all duration-200
                        border border-sage-light/40
                        font-sans
                      "
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
