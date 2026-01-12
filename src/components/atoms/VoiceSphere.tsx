'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { AudioVisualizerData } from '@/types/chat';

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

interface VoiceSphereProps {
  isListening?: boolean;
  audioData?: AudioVisualizerData;
}

export default function VoiceSphere({ isListening = false, audioData }: VoiceSphereProps) {
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

    // Pale yellow tones
    const colorEdge = new THREE.Color('#E8D4A8');
    const colorMid = new THREE.Color('#F5ECD7');
    const colorCenter = new THREE.Color('#FFFEF5');

    const leafGeometry = new THREE.IcosahedronGeometry(1, 64);
    const leafMaterial = new THREE.ShaderMaterial({
      vertexShader: monsteraVertexShader,
      fragmentShader: monsteraFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: 0.6 },
        uBreathing: { value: 1.4 },
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
    const smoothingFactor = 0.18;
    const decayFactor = 0.90;

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      time += 0.018;

      if (leafRef.current) {
        const mat = leafRef.current.material as THREE.ShaderMaterial;
        mat.uniforms.uTime.value = time;

        const listening = isListeningRef.current;
        const targetAmplitude = listening ? 0.8 : 0.6;
        const currentAmplitude = mat.uniforms.uAmplitude.value;
        mat.uniforms.uAmplitude.value += (targetAmplitude - currentAmplitude) * 0.04;

        const targetBreathing = listening ? 1.8 : 1.4;
        const currentBreathing = mat.uniforms.uBreathing.value;
        mat.uniforms.uBreathing.value += (targetBreathing - currentBreathing) * 0.03;

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
