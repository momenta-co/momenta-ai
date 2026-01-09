'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mic, Send, Square, Clock, MapPin } from 'lucide-react';
import { useChat } from '@ai-sdk/react';
import type { Experience } from '@/types/experience';

// ============================================
// TYPES
// ============================================
interface AudioVisualizerData {
  volume: number;
  frequencies: number[];
}

interface RecommendationData {
  title: string;
  description: string;
  url: string;
  image: string;
  price: Experience['price'];
  location: string;
  duration: string | null;
  categories: string[];
  scoreBreakdown: {
    occasion: number;
    relation: number;
    mood: number;
    budget: number;
    total: number;
  };
  reasons: string;
}

// ============================================
// ROTATING SUGGESTIONS
// ============================================
const suggestions = [
  "Somos un grupo de 6 amigos buscando algo divertido",
  "Quiero sorprender a mi pareja con algo romántico",
  "Necesito una actividad de team building para mi equipo",
  "Busco un taller de cocina para principiantes",
  "Quiero regalar una experiencia de bienestar",
  "Organizamos un cumpleaños especial",
];

// ============================================
// VOICE-REACTIVE 3D SPHERE SHADERS
// ============================================
const monsteraVertexShader = `
  uniform float uTime;
  uniform float uAmplitude;
  uniform float uBreathing;
  uniform float uVoiceAmplitude;
  uniform float uVoiceBass;
  uniform float uVoiceMid;
  uniform float uVoiceHigh;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying float vDisplacement;

  #define PI 3.14159265359

  vec3 getWaveSource(int index, float time) {
    float angle1 = time * 0.15 + float(index) * 2.094;
    float angle2 = time * 0.1 + float(index) * 1.571;
    return normalize(vec3(
      sin(angle1) * cos(angle2),
      sin(angle2) * 0.7,
      cos(angle1) * cos(angle2)
    ));
  }

  float sphericalDistance(vec3 p1, vec3 p2) {
    return acos(clamp(dot(normalize(p1), normalize(p2)), -1.0, 1.0));
  }

  float rippleWave(vec3 pos, vec3 source, float time, float frequency, float speed, float decay) {
    float dist = sphericalDistance(pos, source);
    float phase = dist * frequency - time * speed;
    float wave = sin(phase) * 0.7 + sin(phase * 0.5 + 0.5) * 0.3;
    float envelope = smoothstep(PI, 0.0, dist) * exp(-dist * decay * 0.5);
    return wave * envelope;
  }

  float organicNoise(vec3 p, float time) {
    float n = sin(p.x * 2.3 + time * 0.3) * sin(p.y * 2.1 - time * 0.4) * sin(p.z * 1.9 + time * 0.2);
    n += sin(p.x * 1.1 - p.y * 1.3 + time * 0.5) * 0.5;
    return n * 0.5 + 0.5;
  }

  vec3 deformToLeaf(vec3 pos) {
    vec3 p = pos;
    p.y *= 1.18;
    float topFade = smoothstep(0.5, 0.9, p.y);
    p.y -= topFade * 0.08 * (1.0 - abs(p.x) * 1.2);
    float bottomFade = smoothstep(-0.3, -0.85, p.y);
    float taper = bottomFade * 0.35;
    p.x *= (1.0 - taper);
    p.z *= (1.0 - taper * 0.5);
    return normalize(p);
  }

  void main() {
    vec3 leafPos = deformToLeaf(position);
    vec3 pos = normalize(leafPos);
    vPosition = leafPos;

    float displacement = 0.0;

    vec3 source1 = getWaveSource(0, uTime);
    vec3 source2 = getWaveSource(1, uTime);
    vec3 source3 = getWaveSource(2, uTime);

    displacement += rippleWave(pos, source1, uTime, 1.8, 0.4, 1.2) * 0.12;
    displacement += rippleWave(pos, source2, uTime, 1.4, 0.35, 1.0) * 0.10;
    displacement += rippleWave(pos, source3, uTime, 2.0, 0.5, 1.4) * 0.08;

    vec3 bassSource = vec3(0.0, -1.0, 0.0);
    float bassWave = rippleWave(pos, bassSource, uTime * 1.5, 1.2, 0.8, 0.8);
    displacement += bassWave * uVoiceBass * 0.15;

    vec3 midSource1 = vec3(sin(uTime * 0.5), 0.0, cos(uTime * 0.5));
    vec3 midSource2 = vec3(-sin(uTime * 0.5), 0.0, -cos(uTime * 0.5));
    float midWave = rippleWave(pos, midSource1, uTime * 2.0, 2.5, 1.2, 1.0);
    midWave += rippleWave(pos, midSource2, uTime * 2.0, 2.5, 1.2, 1.0);
    displacement += midWave * uVoiceMid * 0.12;

    vec3 highSource = vec3(0.0, 1.0, 0.0);
    float highWave = rippleWave(pos, highSource, uTime * 3.0, 4.0, 2.0, 1.5);
    highWave += sin(pos.x * 8.0 + uTime * 4.0) * sin(pos.z * 8.0 - uTime * 3.5) * 0.5;
    displacement += highWave * uVoiceHigh * 0.08;

    if (uVoiceAmplitude > 0.05) {
      displacement *= (1.0 + uVoiceAmplitude * 1.2);
    }

    float noise = organicNoise(pos, uTime);
    displacement += (noise - 0.5) * 0.03;

    float breathing = sin(uTime * 0.8) * 0.5 + 0.5;
    breathing = breathing * breathing;
    float breathScale = 1.0 + breathing * uBreathing * 0.10;

    displacement *= uAmplitude;
    vDisplacement = displacement;

    vec3 leafNormal = normalize(leafPos);
    vec3 newPosition = leafPos * breathScale + leafNormal * displacement;

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

    float fresnel = dot(viewDir, normal);
    fresnel = clamp(fresnel, 0.0, 1.0);

    float centerIntensity = pow(fresnel, 0.8);
    float edgeIntensity = 1.0 - fresnel;

    float innerGlow = pow(fresnel, 1.5);
    float coreGlow = pow(fresnel, 3.0);

    float gradientPos = pow(fresnel, 0.6);

    vec3 baseColor;
    if (gradientPos < 0.5) {
      baseColor = mix(uColorEdge, uColorMid, gradientPos * 2.0);
    } else {
      baseColor = mix(uColorMid, uColorCenter, (gradientPos - 0.5) * 2.0);
    }

    vec3 lightDir = normalize(vec3(1.0, 2.0, 3.0));
    float diffuse = max(dot(normal, lightDir), 0.0) * 0.3 + 0.7;

    vec3 halfDir = normalize(lightDir + viewDir);
    float specular = pow(max(dot(normal, halfDir), 0.0), 60.0) * 0.5;

    vec3 color = baseColor * diffuse;
    color += uColorCenter * innerGlow * 0.7;
    color += vec3(1.0) * coreGlow * 0.5;
    color += vec3(1.0) * specular;

    float shimmer = sin(vDisplacement * 20.0 + uTime * 2.5) * 0.5 + 0.5;
    shimmer *= innerGlow;
    color += uColorCenter * shimmer * 0.1;

    float alpha = smoothstep(0.0, 0.3, fresnel);

    gl_FragColor = vec4(color, alpha);
  }
`;

// ============================================
// THREE.JS SPHERE COMPONENT
// ============================================
function VoiceSphere({
  isListening = false,
  audioData
}: {
  isListening?: boolean;
  audioData?: AudioVisualizerData;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number>(0);
  const leafRef = useRef<THREE.Mesh | null>(null);

  const audioDataRef = useRef<AudioVisualizerData>({ volume: 0, frequencies: [] });
  const smoothedAudioRef = useRef({ volume: 0, bass: 0, mid: 0, high: 0 });
  const isListeningRef = useRef(isListening);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    if (rendererRef.current) {
      rendererRef.current.dispose();
      rendererRef.current = null;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.z = 3.5;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(300, 300);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 2, 4);
    scene.add(directionalLight);

    // Momenta soft cream/gold tones
    const colorEdge = new THREE.Color('#E8DFC0');
    const colorMid = new THREE.Color('#FFFAE8');
    const colorCenter = new THREE.Color('#FFFFFF');

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

    let time = 0;
    const smoothingFactor = 0.15;
    const decayFactor = 0.92;

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      time += 0.012;

      if (leafRef.current) {
        const mat = leafRef.current.material as THREE.ShaderMaterial;
        mat.uniforms.uTime.value = time;

        const listening = isListeningRef.current;
        const targetAmplitude = listening ? 0.6 : 0.4;
        const currentAmplitude = mat.uniforms.uAmplitude.value;
        mat.uniforms.uAmplitude.value += (targetAmplitude - currentAmplitude) * 0.03;

        const targetBreathing = listening ? 1.5 : 1.0;
        const currentBreathing = mat.uniforms.uBreathing.value;
        mat.uniforms.uBreathing.value += (targetBreathing - currentBreathing) * 0.02;

        const audio = audioDataRef.current;
        const smoothed = smoothedAudioRef.current;

        if (audio.frequencies && audio.frequencies.length > 0) {
          const freqCount = audio.frequencies.length;
          const bassEnd = Math.floor(freqCount / 4);
          let bassSum = 0;
          for (let i = 0; i < bassEnd; i++) bassSum += audio.frequencies[i] || 0;
          const targetBass = bassSum / bassEnd;

          const midStart = bassEnd;
          const midEnd = Math.floor(freqCount * 3 / 4);
          let midSum = 0;
          for (let i = midStart; i < midEnd; i++) midSum += audio.frequencies[i] || 0;
          const targetMid = midSum / (midEnd - midStart);

          let highSum = 0;
          for (let i = midEnd; i < freqCount; i++) highSum += audio.frequencies[i] || 0;
          const targetHigh = highSum / (freqCount - midEnd);

          smoothed.volume += (audio.volume - smoothed.volume) * smoothingFactor;
          smoothed.bass += (targetBass - smoothed.bass) * smoothingFactor;
          smoothed.mid += (targetMid - smoothed.mid) * smoothingFactor;
          smoothed.high += (targetHigh - smoothed.high) * smoothingFactor;
        } else {
          smoothed.volume *= decayFactor;
          smoothed.bass *= decayFactor;
          smoothed.mid *= decayFactor;
          smoothed.high *= decayFactor;
        }

        mat.uniforms.uVoiceAmplitude.value = smoothed.volume;
        mat.uniforms.uVoiceBass.value = smoothed.bass;
        mat.uniforms.uVoiceMid.value = smoothed.mid;
        mat.uniforms.uVoiceHigh.value = smoothed.high;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const size = Math.min(containerRef.current.offsetWidth, 300);
      renderer.setSize(size, size);
      camera.aspect = 1;
      camera.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameRef.current);
      leafGeometry.dispose();
      leafMaterial.dispose();
      renderer.dispose();
      rendererRef.current = null;
      leafRef.current = null;

      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    isListeningRef.current = isListening;
    if (audioData) {
      audioDataRef.current = audioData;
    }
    if (!isListening) {
      audioDataRef.current = { volume: 0, frequencies: [] };
    }
  }, [isListening, audioData]);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-[300px] aspect-square mx-auto"
      style={{
        transition: 'transform 0.5s ease',
        transform: isListening ? 'scale(1.05)' : 'scale(1)'
      }}
    />
  );
}

// ============================================
// ROTATING PLACEHOLDER COMPONENT
// ============================================
function RotatingPlaceholder() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % suggestions.length);
        setIsAnimating(false);
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className={`
        text-neutral-700/50 transition-all duration-300 pointer-events-none
        ${isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}
      `}
    >
      {suggestions[currentIndex]}
    </span>
  );
}

// ============================================
// MESSAGE COMPONENTS
// ============================================
function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-end mb-4">
      <div className="max-w-[80%] bg-primary-700 text-white px-4 py-3 rounded-2xl rounded-br-md">
        <p className="text-[15px] whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}

function AssistantMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[80%] bg-neutral-200 text-neutral-1000 px-4 py-3 rounded-2xl rounded-bl-md">
        <p className="text-[15px] whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}

function LoadingMessage() {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-neutral-200 px-4 py-3 rounded-2xl rounded-bl-md">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

// ============================================
// ELEGANT EXPERIENCE RECOMMENDATIONS - GRID LAYOUT WITH AI REASONING
// ============================================
function ExperienceRecommendations({ recommendations }: { recommendations: RecommendationData[] }) {
  const formatPrice = (price: RecommendationData['price']) => {
    if (!price) return 'Consultar';
    const amount = parseInt(price.amount).toLocaleString('es-CO');
    return `$${amount}`;
  };

  // Split recommendations into rows: first 3, then remaining 2
  const firstRow = recommendations.slice(0, 3);
  const secondRow = recommendations.slice(3, 5);

  const ExperienceCard = ({ recommendation, index }: { recommendation: RecommendationData; index: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      className="flex flex-col"
    >
      <Link
        href={recommendation.url}
        target="_blank"
        className="group block bg-white/80 backdrop-blur-sm rounded-xl overflow-hidden border border-neutral-200/60 hover:border-primary-700/30 transition-all duration-500 hover:shadow-lg hover:shadow-primary-700/5 mb-2"
      >
        {/* Image with overlay */}
        <div className="relative h-[100px] sm:h-[120px] overflow-hidden">
          <Image
            src={recommendation.image}
            alt={recommendation.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            unoptimized
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* Number indicator */}
          <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center">
            <span className="text-[10px] font-semibold text-neutral-800">{index + 1}</span>
          </div>

          {/* Price badge */}
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-white/95 backdrop-blur-sm rounded-full">
            <span className="text-xs font-semibold text-primary-700">
              {formatPrice(recommendation.price)}
            </span>
          </div>
        </div>

        {/* Content - Compact */}
        <div className="p-3">
          <h3 className="font-serif text-sm sm:text-base text-neutral-900 leading-tight line-clamp-2 group-hover:text-primary-700 transition-colors duration-300">
            {recommendation.title}
          </h3>

          <div className="flex items-center gap-2 mt-2 text-[10px] sm:text-xs text-neutral-500">
            {recommendation.duration && (
              <span className="flex items-center gap-0.5">
                <Clock className="w-3 h-3" />
                {recommendation.duration}
              </span>
            )}
            <span className="flex items-center gap-0.5">
              <MapPin className="w-3 h-3" />
              {recommendation.location}
            </span>
          </div>
        </div>
      </Link>

      {/* AI Reasoning - Why Momenta chose this */}
      <div className="px-2">
        <p className="text-xs text-neutral-700 leading-relaxed italic">
          "{recommendation.reasons}"
        </p>
      </div>
    </motion.div>
  );

  return (
    <div className="w-full mb-4 px-2">
      {/* First row - 3 cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-2 sm:mb-3">
        {firstRow.map((recommendation, index) => (
          <ExperienceCard key={recommendation.url} recommendation={recommendation} index={index} />
        ))}
      </div>

      {/* Second row - 2 cards centered */}
      {secondRow.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="col-start-1 col-span-1 sm:col-start-1">
            {secondRow[0] && (
              <ExperienceCard recommendation={secondRow[0]} index={3} />
            )}
          </div>
          <div className="col-start-2 col-span-1">
            {secondRow[1] && (
              <ExperienceCard recommendation={secondRow[1]} index={4} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN HERO CHAT COMPONENT
// ============================================
export default function HeroChat() {
  // Official AI SDK chat hook - handles streaming and tools automatically
  const { messages, status, error, sendMessage } = useChat();

  // Input state (managed separately in v6)
  const [input, setInput] = useState('');
  const isLoading = status === 'submitted' || status === 'streaming';

  // Log for debugging
  useEffect(() => {
    console.log('[HeroChat] Messages:', JSON.stringify(messages, null, 2));
    console.log('[HeroChat] Status:', status);
    // Log message parts for debugging tool invocations
    messages.forEach((msg, idx) => {
      if (msg.parts) {
        console.log(`[HeroChat] Message ${idx} parts:`, msg.parts);
      }
    });
    if (error) console.error('[HeroChat] Error:', error);
  }, [messages, status, error]);

  // UI state
  const [isListening, setIsListening] = useState(false);
  const [audioData, setAudioData] = useState<AudioVisualizerData>({ volume: 0, frequencies: [] });
  const [isFocused, setIsFocused] = useState(false);

  // Refs
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number>(0);
  const isListeningRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom within the messages container only
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current || !isListeningRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const sum = dataArray.reduce((a, b) => a + b, 0);
    const volume = sum / dataArray.length / 255;

    const frequencies: number[] = [];
    const step = Math.floor(dataArray.length / 32);
    for (let i = 0; i < 32; i++) {
      frequencies.push(dataArray[i * step] / 255);
    }

    setAudioData({ volume, frequencies });

    if (isListeningRef.current) {
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    }
  }, []);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      isListeningRef.current = true;
      setIsListening(true);
      analyzeAudio();
    } catch (error) {
      console.error('Microphone access denied:', error);
    }
  };

  const stopListening = () => {
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

    // TODO: Implement real voice-to-text
    // For now, voice recording just activates the microphone visualization
    // Users will need to type their message
  };

  const toggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Handle form submission
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput(''); // Clear input

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Send message using AI SDK
    await sendMessage({ text: message });
  };

  // Extract recommendations from tool calls in messages (AI SDK v6 format)
  const extractRecommendations = (): RecommendationData[] | null => {
    // Look for the last message with tool results
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.role === 'assistant' && message.parts) {
        for (const part of message.parts) {
          const partAny = part as any;

          // Comprehensive logging for debugging tool parts
          if (partAny.type?.includes('tool') || partAny.toolName || partAny.toolCallId) {
            console.log('[HeroChat] Tool-related part:', {
              type: partAny.type,
              state: partAny.state,
              toolName: partAny.toolName,
              toolCallId: partAny.toolCallId,
              hasResult: !!partAny.result,
              hasOutput: !!partAny.output,
              keys: Object.keys(partAny)
            });
          }

          // AI SDK v6 format: type is 'tool-{toolName}'
          // States: input-streaming -> input-available -> output-available
          if (partAny.type === 'tool-getRecommendations') {
            // Check for output-available state (tool execution completed)
            if (partAny.state === 'output-available') {
              // Result is in partAny.output (not partAny.result)
              const output = partAny.output;
              console.log('[HeroChat] Tool output-available, output:', output);
              if (output?.success && output?.recommendations) {
                console.log('[HeroChat] Found recommendations:', output.recommendations);
                return output.recommendations as RecommendationData[];
              }
            }
          }
        }
      }
    }
    return null;
  };

  const recommendations = extractRecommendations();

  // Check if in chat mode (has messages)
  const inChatMode = messages.length > 0;

  return (
    <section className={`
      relative h-screen flex flex-col bg-neutral-100
      ${inChatMode ? 'pt-20' : 'pt-20'}
    `}>
      {/* Initial Hero State */}
      {!inChatMode && (
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl text-neutral-1000 text-center leading-tight mb-8">
            Disfruta tu ciudad
            <br />
            <span className="text-primary-700">sin scrollear sin fin</span>
          </h1>

          {/* 3D Sphere */}
          <div className="my-8">
            <VoiceSphere isListening={isListening} audioData={audioData} />
          </div>
        </div>
      )}

      {/* Chat Messages Area */}
      {inChatMode && (
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto py-6">
          <div className="max-w-2xl mx-auto px-4">
            {messages.map((message) => {
              // Extract text content from parts (AI SDK v6 format)
              const textContent = message.parts
                ?.filter((part): part is { type: 'text'; text: string } => (part as any).type === 'text')
                .map((part) => part.text)
                .join('') || '';

              // Only render user and assistant messages
              if (message.role === 'user') {
                return <UserMessage key={message.id} content={textContent} />;
              }

              if (message.role === 'assistant') {
                // Only show assistant message if it has text content
                if (textContent) {
                  return <AssistantMessage key={message.id} content={textContent} />;
                }
              }

              return null;
            })}

            {/* Loading indicator */}
            {isLoading && <LoadingMessage />}

            {/* Error message */}
            {error && (
              <div className="flex justify-center mb-4">
                <div className="bg-red-100 text-red-700 px-4 py-3 rounded-xl">
                  <p className="text-sm">Error: {error.message}</p>
                </div>
              </div>
            )}

            {/* Show recommendations if available */}
            {recommendations && recommendations.length > 0 && (
              <div className="mt-4">
                <ExperienceRecommendations recommendations={recommendations} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Input Bar - Always at bottom */}
      <div className="bg-neutral-100 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={onSubmit}>
            <div
              className={`
                bg-white rounded-2xl
                border-2 transition-all duration-300
                shadow-lg shadow-neutral-1000/5
                ${isFocused ? 'border-primary-700 shadow-primary-700/10' : 'border-neutral-300'}
              `}
            >
              {/* Textarea row */}
              <div className="relative px-4 pt-3 pb-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    // Auto-resize textarea dynamically
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (input.trim() && !isLoading) {
                        onSubmit(e as any);
                      }
                    }
                  }}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  rows={1}
                  disabled={isLoading}
                  className="
                    w-full bg-transparent
                    text-neutral-1000 text-[15px] leading-relaxed
                    focus:outline-none
                    placeholder-transparent
                    resize-none overflow-hidden
                    disabled:opacity-50
                  "
                  style={{ minHeight: '28px' }}
                  placeholder="Escribe tu mensaje..."
                />
                {/* Rotating placeholder overlay */}
                {!input && !isFocused && !inChatMode && (
                  <div className="absolute inset-x-4 top-3 pointer-events-none">
                    <RotatingPlaceholder />
                  </div>
                )}
                {!input && !isFocused && inChatMode && (
                  <div className="absolute inset-x-4 top-3 pointer-events-none">
                    <span className="text-neutral-700/50">Escribe tu mensaje...</span>
                  </div>
                )}
              </div>

              {/* Buttons row */}
              <div className="flex items-center justify-end gap-2 px-2 pb-2">
                {/* Microphone button */}
                <button
                  type="button"
                  onClick={toggleVoice}
                  disabled={isLoading}
                  className={`
                    flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
                    transition-all duration-200
                    disabled:opacity-50
                    ${isListening
                      ? 'bg-primary-700 text-white'
                      : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                    }
                  `}
                  aria-label={isListening ? 'Detener' : 'Hablar'}
                >
                  {isListening ? (
                    <Square className="w-4 h-4" strokeWidth={2} fill="currentColor" />
                  ) : (
                    <Mic className="w-5 h-5" strokeWidth={2} />
                  )}
                </button>

                {/* Send button */}
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="
                    flex-shrink-0 w-10 h-10 rounded-xl
                    bg-primary-700 text-white
                    flex items-center justify-center
                    hover:bg-primary-800
                    disabled:opacity-30 disabled:cursor-not-allowed
                    transition-all duration-200
                  "
                  aria-label="Enviar"
                >
                  <Send className="w-5 h-5" strokeWidth={2} />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
