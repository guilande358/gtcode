import { useRef, forwardRef, useImperativeHandle } from 'react';
import { Mesh, MeshStandardMaterial } from 'three';
import { Entity3D } from '@/lib/gcodeforce-interpreter';

interface PrimitiveProps {
  entity: Entity3D;
  isSelected?: boolean;
}

export interface PrimitiveHandle {
  mesh: Mesh | null;
  move: (dx: number, dy: number, dz: number) => void;
  setPosition: (x: number, y: number, z: number) => void;
  getPosition: () => [number, number, number];
}

function hexToHsl(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse hex
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

export const Primitive = forwardRef<PrimitiveHandle, PrimitiveProps>(({ entity, isSelected }, ref) => {
  const meshRef = useRef<Mesh>(null);

  useImperativeHandle(ref, () => ({
    mesh: meshRef.current,
    move: (dx: number, dy: number, dz: number) => {
      if (meshRef.current) {
        meshRef.current.position.x += dx;
        meshRef.current.position.y += dy;
        meshRef.current.position.z += dz;
      }
    },
    setPosition: (x: number, y: number, z: number) => {
      if (meshRef.current) {
        meshRef.current.position.set(x, y, z);
      }
    },
    getPosition: () => {
      if (meshRef.current) {
        return [meshRef.current.position.x, meshRef.current.position.y, meshRef.current.position.z];
      }
      return [0, 0, 0];
    }
  }), []);

  const renderGeometry = () => {
    switch (entity.primitive) {
      case 'box':
        return <boxGeometry args={entity.scale} />;
      case 'sphere':
        return <sphereGeometry args={[entity.scale[0] / 2, 32, 32]} />;
      case 'cylinder':
        return <cylinderGeometry args={[entity.scale[0] / 2, entity.scale[0] / 2, entity.scale[1], 32]} />;
      case 'cone':
        return <coneGeometry args={[entity.scale[0] / 2, entity.scale[1], 32]} />;
      case 'plane':
        return <planeGeometry args={[entity.scale[0], entity.scale[2]]} />;
      case 'torus':
        return <torusGeometry args={[entity.scale[0] / 2, entity.scale[0] / 6, 16, 48]} />;
      default:
        return <boxGeometry args={entity.scale} />;
    }
  };

  const rotation: [number, number, number] = entity.primitive === 'plane' 
    ? [-Math.PI / 2, 0, 0] 
    : [
        (entity.rotation[0] * Math.PI) / 180,
        (entity.rotation[1] * Math.PI) / 180,
        (entity.rotation[2] * Math.PI) / 180
      ];

  return (
    <mesh
      ref={meshRef}
      position={entity.position}
      rotation={rotation}
      castShadow
      receiveShadow
    >
      {renderGeometry()}
      <meshStandardMaterial 
        color={entity.color}
        emissive={isSelected ? entity.color : '#000000'}
        emissiveIntensity={isSelected ? 0.2 : 0}
      />
    </mesh>
  );
});

Primitive.displayName = 'Primitive';

// Grid helper component
export function GridHelper() {
  return (
    <gridHelper args={[50, 50, '#444444', '#333333']} />
  );
}

// Axes helper component
export function AxesHelper() {
  return <axesHelper args={[5]} />;
}
