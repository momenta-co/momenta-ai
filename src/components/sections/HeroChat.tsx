'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mic, Send, Square, Clock, MapPin } from 'lucide-react';
import { useAIChat, type ChatMessage } from '@/hooks/useAIChat';
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
// ROTATING TITLE WORDS
// ============================================
const titleWords = ["auténtica", "especial", "curada", "memorable", "perfecta"];

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

    // Light blue tones
    const colorEdge = new THREE.Color('#B3E5FC');
    const colorMid = new THREE.Color('#81D4FA');
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
// ROTATING TITLE WORD COMPONENT
// ============================================
function RotatingTitleWord() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % titleWords.length);
        setIsAnimating(false);
      }, 400);
    }, 5000); // Synchronized with carousel

    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className={`
        relative inline-block px-5 py-2 mx-1 rounded-xl bg-[#F5EFE0] text-neutral-1000
        transition-all duration-400
        ${isAnimating ? 'opacity-0 translate-y-2 scale-95' : 'opacity-100 translate-y-0 scale-100'}
      `}
    >
      {titleWords[currentIndex]}
    </span>
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
        text-neutral-700/40 text-base sm:text-lg font-light transition-all duration-300 pointer-events-none
        ${isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}
      `}
    >
      {suggestions[currentIndex]}
    </span>
  );
}

// ============================================
// MESSAGE COMPONENTS - Floating Design
// ============================================
function UserMessage({ content }: { content: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20, y: 10 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex justify-end mb-6"
    >
      <div className="max-w-[80%] bg-primary-700 text-white px-6 py-4 rounded-3xl rounded-br-lg shadow-lg shadow-primary-700/20">
        <p className="text-base leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
    </motion.div>
  );
}

function AssistantMessage({ content }: { content: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20, y: 10 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex justify-start mb-6"
    >
      <div className="max-w-[80%] bg-white/90 backdrop-blur-sm text-neutral-1000 px-6 py-4 rounded-3xl rounded-bl-lg shadow-lg shadow-neutral-900/10 border border-neutral-200/50">
        <p className="text-base leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
    </motion.div>
  );
}

function LoadingMessage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex justify-start mb-6"
    >
      <div className="bg-white/90 backdrop-blur-sm px-6 py-4 rounded-3xl rounded-bl-lg shadow-lg shadow-neutral-900/10 border border-neutral-200/50">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2.5 h-2.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2.5 h-2.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </motion.div>
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

  const ExperienceCard = ({ recommendation, index }: { recommendation: RecommendationData; index: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      className="flex flex-col"
    >
      <Link
        href={recommendation.url}
        target="_blank"
        className="group block bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden border border-neutral-200/60 hover:border-primary-700/40 transition-all duration-700 hover:shadow-2xl hover:shadow-primary-700/15 hover:scale-[1.02] mb-3 shadow-lg shadow-neutral-900/10"
      >
        {/* Image with overlay */}
        <div className="relative h-[120px] sm:h-[100px] md:h-[120px] overflow-hidden">
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
        <div className="p-3 sm:p-4">
          <h3 className="font-serif text-sm sm:text-base md:text-lg text-neutral-900 leading-snug line-clamp-2 group-hover:text-primary-700 transition-colors duration-500 mb-2 sm:mb-3">
            {recommendation.title}
          </h3>

          <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-neutral-500 flex-wrap">
            {recommendation.duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden xs:inline">{recommendation.duration}</span>
                <span className="xs:hidden">{recommendation.duration.split(' ')[0]}</span>
              </span>
            )}
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              {recommendation.location}
            </span>
          </div>
        </div>
      </Link>

      {/* AI Reasoning - Why Momenta chose this - Hidden on very small screens */}
      <div className="px-2 sm:px-3 hidden sm:block">
        <p className="text-xs text-neutral-600 leading-relaxed italic font-light line-clamp-2">
          "{recommendation.reasons}"
        </p>
      </div>
    </motion.div>
  );

  return (
    <div className="w-full mb-6 sm:mb-8 mt-6 sm:mt-8">
      {/* Title for recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-4 sm:mb-6"
      >
        <h2 className="text-xl sm:text-2xl md:text-3xl font-serif text-neutral-900 mb-1 sm:mb-2">
          Experiencias perfectas para ti
        </h2>
        <p className="text-xs sm:text-sm text-neutral-600 font-light">
          Seleccionadas especialmente por Momenta AI
        </p>
      </motion.div>

      {/* Responsive grid: 1 col on mobile, 2 on sm, 3 on md+ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {recommendations.map((recommendation, index) => (
          <ExperienceCard key={recommendation.url} recommendation={recommendation} index={index} />
        ))}
      </div>
    </div>
  );
}

// ============================================
// CAROUSEL DATA
// ============================================
const carouselExperiences = [
  {
    title: "Taller de pintura",
    description: "Creatividad artística · 2-4 personas · Fin de semana",
    image: "https://d3p3fw3rutb1if.cloudfront.net/photos/f065395e-683c-4686-9213-81ebacd1c014",
  },
  {
    title: "Cena clandestina",
    description: "Experiencia culinaria única · 8-12 personas · Viernes",
    image: "https://d3p3fw3rutb1if.cloudfront.net/photos/d4f65285-17ed-4e65-a2a2-21dddbc09e84",
  },
  {
    title: "Vuelo en parapente",
    description: "Aventura extrema · 1 persona · Día soleado",
    image: "https://d3p3fw3rutb1if.cloudfront.net/photos/9a332c9e-19e3-444a-8249-72c1651f615b",
  },
  {
    title: "Taller de scrapbook",
    description: "Arte y recuerdos · 3-6 personas · Tarde",
    image: "https://d3p3fw3rutb1if.cloudfront.net/photos/59e7ec82-5a94-4cc1-8675-d2c2277544c0",
  },
  {
    title: "Sesión de Spa",
    description: "Relajación total · 2 personas · Sábado",
    image: "https://d3p3fw3rutb1if.cloudfront.net/photos/5d973ac0-5852-4218-a546-23f2043b28d8",
  },
  {
    title: "Taller de pasta fresca",
    description: "Cocina italiana · 4-8 personas · Domingo",
    image: "https://d3p3fw3rutb1if.cloudfront.net/photos/ff6930dc-ad0f-4f54-b281-ca30ea5c2fe4",
  },
];

// ============================================
// MAIN HERO CHAT COMPONENT
// ============================================
export default function HeroChat() {
  // Custom AI chat hook - handles all conversation state
  const { messages, input, setInput, handleSubmit, isLoading, error } = useAIChat({
    api: '/api/chat',
  });

  // Log for debugging
  useEffect(() => {
    console.log('Messages:', messages);
    console.log('isLoading:', isLoading);
    if (error) console.error('Chat error:', error);
  }, [messages, isLoading, error]);

  // UI state
  const [isListening, setIsListening] = useState(false);
  const [audioData, setAudioData] = useState<AudioVisualizerData>({ volume: 0, frequencies: [] });
  const [isFocused, setIsFocused] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

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

  // Carousel auto-rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselExperiences.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, []);

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
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    handleSubmit(e);
  };

  // Extract recommendations from tool calls in messages
  const extractRecommendations = (): RecommendationData[] | null => {
    // Look for the last message with tool results
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.role === 'assistant' && message.toolInvocations) {
        for (const toolInvocation of message.toolInvocations) {
          if (
            toolInvocation.toolName === 'getRecommendations' &&
            toolInvocation.state === 'result' &&
            toolInvocation.result?.success
          ) {
            return toolInvocation.result.recommendations as RecommendationData[];
          }
        }
      }
    }
    return null;
  };

  const recommendations = extractRecommendations();

  return (
    <section className="relative min-h-screen h-screen-safe flex flex-col bg-neutral-100 pt-16 sm:pt-20">
      {/* Two Column Layout - Always Visible */}
      <div className="flex-1 flex items-stretch px-4 sm:px-6 lg:px-16 max-w-[1400px] mx-auto w-full h-full py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-16 w-full h-full">
          {/* Left Column - Chat Interface */}
          <div className="flex flex-col h-full w-full max-h-[75vh] sm:max-h-[83vh]">
            {/* Title and Sphere - Only show when no messages */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center flex-1 gap-4 sm:gap-8">
                {/* Title */}
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="text-2xl sm:text-4xl lg:text-[52px] text-neutral-1000 leading-[1.25] tracking-tight font-serif font-normal text-center max-w-[90%] sm:max-w-[70%]"
                >
                  La manera más{' '}
                  <RotatingTitleWord />
                  <br className="hidden sm:block" />
                  <span className="sm:hidden"> </span>
                  de vivir
                  <br className="hidden sm:block" />
                  <span className="sm:hidden"> </span>
                  tu tiempo libre
                </motion.h1>

                {/* 3D Sphere */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="relative w-48 h-48 sm:w-72 sm:h-72 -ml-0 sm:-ml-4"
                >
                  <VoiceSphere isListening={isListening} audioData={audioData} />
                </motion.div>
              </div>
            )}

            {/* Chat Messages Area - Scrollable */}
            {messages.length > 0 && (
              <div className="flex-1 overflow-hidden mb-6">
                <div
                  ref={messagesContainerRef}
                  className="h-full overflow-y-auto px-2 custom-scrollbar"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#CBD5E1 transparent'
                  }}
                >
                  {messages.map((message: ChatMessage) => {
                    // Only render user and assistant messages
                    if (message.role === 'user') {
                      return <UserMessage key={message.id} content={message.content} />;
                    }

                    if (message.role === 'assistant') {
                      return <AssistantMessage key={message.id} content={message.content} />;
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

            {/* Chat Input Bar - Always at bottom of left column */}
            <motion.form
              onSubmit={onSubmit}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="w-full"
            >
              <div
                className={`
                    bg-white/95 backdrop-blur-xl rounded-3xl
                    border transition-all duration-500
                    ${isFocused
                    ? 'border-primary-700/40 shadow-2xl shadow-primary-700/20 scale-[1.01]'
                    : 'border-neutral-300/50 shadow-xl shadow-neutral-900/8'
                  }
                  `}
                style={{
                  boxShadow: isFocused
                    ? '0 20px 60px -15px rgba(30, 58, 95, 0.25), 0 10px 30px -10px rgba(30, 58, 95, 0.15)'
                    : '0 15px 45px -10px rgba(31, 41, 55, 0.12), 0 8px 20px -5px rgba(31, 41, 55, 0.08)',
                }}
              >
                {/* Textarea row */}
                <div className="relative px-6 pt-5 pb-3">
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
                        text-neutral-1000 text-base leading-relaxed
                        focus:outline-none
                        resize-none overflow-hidden
                        disabled:opacity-50
                        font-light min-h-[28px]
                      "
                  />
                  {/* Rotating placeholder overlay */}
                  {!input && !isFocused && (
                    <div className="absolute inset-x-6 top-5 pointer-events-none">
                      <RotatingPlaceholder />
                    </div>
                  )}
                </div>

                {/* Buttons row */}
                <div className="flex items-center justify-end gap-3 px-4 pb-3">
                  {/* Microphone button */}
                  <button
                    type="button"
                    onClick={toggleVoice}
                    disabled={isLoading}
                    className={`
                        flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center
                        transition-all duration-300
                        disabled:opacity-50
                        ${isListening
                        ? 'bg-primary-700 text-white shadow-lg shadow-primary-700/30 scale-105'
                        : 'bg-neutral-200/80 text-neutral-600 hover:bg-neutral-300/80 hover:scale-105'
                      }
                      `}
                    aria-label={isListening ? 'Detener' : 'Hablar'}
                  >
                    {isListening ? (
                      <Square className="w-4 h-4" strokeWidth={2} fill="currentColor" />
                    ) : (
                      <Mic className="w-4 h-4" strokeWidth={2} />
                    )}
                  </button>

                  {/* Send button */}
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="
                        flex-shrink-0 w-11 h-11 rounded-full
                        bg-neutral-300/80 text-neutral-600
                        flex items-center justify-center
                        hover:bg-neutral-400/80 hover:scale-105
                        disabled:opacity-30 disabled:cursor-not-allowed
                        transition-all duration-300
                        active:scale-95
                      "
                    aria-label="Enviar"
                  >
                    <Send className="w-4 h-4" strokeWidth={2} />
                  </button>
                </div>
              </div>
            </motion.form>
          </div>

          {/* Right Column - Featured Experience Carousel */}
          {/* Desktop: Full height carousel */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="hidden lg:flex items-center h-full"
          >
            <div className="relative w-full h-full rounded-[32px] overflow-hidden shadow-2xl">
              {/* Carousel Images */}
              {carouselExperiences.map((experience, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: index === currentSlide ? 1 : 0 }}
                  transition={{ duration: 0.7, ease: 'easeInOut' }}
                  className="absolute inset-0"
                  style={{ pointerEvents: index === currentSlide ? 'auto' : 'none' }}
                >
                  {/* Hero Image */}
                  <Image
                    src={experience.image}
                    alt={experience.title}
                    fill
                    className="object-cover"
                    priority={index === 0}
                    unoptimized
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

                  {/* Content Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-10 text-white">
                    <h2 className="text-[32px] font-serif font-normal mb-4 leading-tight">
                      {experience.title}
                    </h2>
                    <p className="text-base mb-7 opacity-90 font-light">
                      {experience.description}
                    </p>
                    <button className="px-10 py-3.5 bg-primary-700/90 hover:bg-primary-700 backdrop-blur-sm rounded-full text-white font-medium transition-all duration-300 hover:scale-105 text-base">
                      Descubrir
                    </button>
                  </div>
                </motion.div>
              ))}

              {/* Pagination Dots */}
              <div className="absolute bottom-10 right-10 flex gap-2">
                {carouselExperiences.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentSlide ? 'bg-white w-8' : 'bg-white/40 hover:bg-white/60'
                      }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Mobile: Horizontal scroll carousel - Only visible when no messages on mobile */}
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="lg:hidden -mx-4 sm:-mx-6 px-4 sm:px-6"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-neutral-600 uppercase tracking-wide">
                  Experiencias destacadas
                </h3>
                <div className="flex gap-1">
                  {carouselExperiences.slice(0, 4).map((_, index) => (
                    <div
                      key={index}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        index === currentSlide % 4 ? 'bg-primary-700 w-4' : 'bg-neutral-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 overflow-x-auto scroll-container-x pb-2">
                {carouselExperiences.map((experience, index) => (
                  <div
                    key={index}
                    className="relative flex-shrink-0 w-[200px] h-[140px] rounded-2xl overflow-hidden shadow-lg"
                  >
                    <Image
                      src={experience.image}
                      alt={experience.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                      <h4 className="text-sm font-medium line-clamp-1">{experience.title}</h4>
                      <p className="text-xs opacity-80 line-clamp-1 mt-0.5">{experience.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
