import { useRef, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PARTICLE_PRESETS, ParticlePreset } from '@/lib/particle-presets';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  color: THREE.Color;
}

interface ParticleEmission {
  id: string;
  position: [number, number, number];
  type: string;
  time: number;
  particles: Particle[];
}

const MAX_PARTICLES = 500;

function hexToColor(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

function lerpColor(a: THREE.Color, b: THREE.Color, t: number): THREE.Color {
  return new THREE.Color().lerpColors(a, b, t);
}

export function useParticleEmitter() {
  const emissionsRef = useRef<ParticleEmission[]>([]);
  let idCounter = 0;

  const emit = useCallback((type: string, position: [number, number, number], overrides?: Partial<ParticlePreset>) => {
    const preset = { ...(PARTICLE_PRESETS[type] || PARTICLE_PRESETS.spark), ...overrides };
    const particles: Particle[] = [];
    const colorStart = hexToColor(preset.colorStart);
    const colorEnd = hexToColor(preset.colorEnd);

    for (let i = 0; i < preset.count; i++) {
      const dir = new THREE.Vector3(
        (Math.random() - 0.5) * preset.spread,
        (Math.random() - 0.5) * preset.spread,
        (Math.random() - 0.5) * preset.spread
      ).normalize().multiplyScalar(preset.speed * (0.5 + Math.random() * 0.5));

      particles.push({
        position: new THREE.Vector3(...position),
        velocity: dir,
        life: preset.lifetime,
        maxLife: preset.lifetime,
        size: preset.sizeStart,
        color: colorStart.clone(),
      });
    }

    emissionsRef.current.push({
      id: `pe_${++idCounter}_${Date.now()}`,
      position,
      type,
      time: 0,
      particles,
    });

    // Cap total emissions
    if (emissionsRef.current.length > 20) {
      emissionsRef.current = emissionsRef.current.slice(-15);
    }
  }, []);

  return { emissionsRef, emit };
}

interface ParticleRendererProps {
  emissionsRef: React.MutableRefObject<ParticleEmission[]>;
}

export function ParticleRenderer({ emissionsRef }: ParticleRendererProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);

  const { positions, colors, sizes } = useMemo(() => {
    const positions = new Float32Array(MAX_PARTICLES * 3);
    const colors = new Float32Array(MAX_PARTICLES * 3);
    const sizes = new Float32Array(MAX_PARTICLES);
    return { positions, colors, sizes };
  }, []);

  useFrame((_, delta) => {
    const emissions = emissionsRef.current;
    let particleIndex = 0;

    for (let e = emissions.length - 1; e >= 0; e--) {
      const emission = emissions[e];
      const preset = PARTICLE_PRESETS[emission.type] || PARTICLE_PRESETS.spark;
      const colorStart = hexToColor(preset.colorStart);
      const colorEnd = hexToColor(preset.colorEnd);
      let allDead = true;

      for (const p of emission.particles) {
        p.life -= delta;
        if (p.life <= 0) continue;
        allDead = false;

        // Update position
        p.position.add(p.velocity.clone().multiplyScalar(delta));
        p.velocity.y += preset.gravity * delta;

        // Lerp properties
        const t = 1 - p.life / p.maxLife;
        const size = THREE.MathUtils.lerp(preset.sizeStart, preset.sizeEnd, t);
        const color = lerpColor(colorStart, colorEnd, t);

        if (particleIndex < MAX_PARTICLES) {
          const i3 = particleIndex * 3;
          positions[i3] = p.position.x;
          positions[i3 + 1] = p.position.y;
          positions[i3 + 2] = p.position.z;
          colors[i3] = color.r;
          colors[i3 + 1] = color.g;
          colors[i3 + 2] = color.b;
          sizes[particleIndex] = preset.fadeOut ? size * (p.life / p.maxLife) : size;
          particleIndex++;
        }
      }

      if (allDead) {
        emissions.splice(e, 1);
      }
    }

    // Zero out remaining
    for (let i = particleIndex; i < MAX_PARTICLES; i++) {
      sizes[i] = 0;
    }

    if (geometryRef.current) {
      geometryRef.current.attributes.position.needsUpdate = true;
      geometryRef.current.attributes.color.needsUpdate = true;
      geometryRef.current.attributes.size.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          count={MAX_PARTICLES}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={MAX_PARTICLES}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={MAX_PARTICLES}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        size={0.3}
      />
    </points>
  );
}
