import { useMemo } from 'react';
import { generateCheckerTexture, generateNoiseTexture, generateGradientTexture, generateBrickTexture } from '@/lib/procedural-textures';

export interface MaterialConfig {
  type: 'standard' | 'basic' | 'phong' | 'physical' | 'toon';
  color: string;
  roughness: number;
  metalness: number;
  opacity: number;
  transparent: boolean;
  emissive?: string;
  emissiveIntensity?: number;
  wireframe?: boolean;
  texture?: {
    type: 'checker' | 'noise' | 'gradient' | 'brick';
    params?: Record<string, any>;
    repeat?: [number, number];
  };
}

export const DEFAULT_MATERIAL: MaterialConfig = {
  type: 'standard',
  color: '#888888',
  roughness: 0.5,
  metalness: 0,
  opacity: 1,
  transparent: false,
};

interface AdvancedMaterialProps {
  material: MaterialConfig;
  isSelected?: boolean;
}

export function AdvancedMaterial({ material, isSelected }: AdvancedMaterialProps) {
  const texture = useMemo(() => {
    if (!material.texture) return null;

    switch (material.texture.type) {
      case 'checker':
        return generateCheckerTexture(
          material.texture.params?.color1 || '#FFFFFF',
          material.texture.params?.color2 || '#000000'
        );
      case 'noise':
        return generateNoiseTexture(material.color, material.texture.params?.intensity || 0.2);
      case 'gradient':
        return generateGradientTexture(material.texture.params?.colors || ['#FF0000', '#0000FF']);
      case 'brick':
        return generateBrickTexture(
          material.texture.params?.mortarColor || '#999999',
          material.texture.params?.brickColor || material.color
        );
      default:
        return null;
    }
  }, [material.texture, material.color]);

  const emissive = isSelected ? material.color : (material.emissive || '#000000');
  const emissiveIntensity = isSelected ? 0.2 : (material.emissiveIntensity || 0);

  const commonProps = {
    color: material.color,
    transparent: material.transparent || material.opacity < 1,
    opacity: material.opacity,
    wireframe: material.wireframe,
    map: texture,
  };

  switch (material.type) {
    case 'basic':
      return <meshBasicMaterial {...commonProps} />;

    case 'phong':
      return (
        <meshPhongMaterial
          {...commonProps}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          shininess={material.metalness * 100}
        />
      );

    case 'physical':
      return (
        <meshPhysicalMaterial
          {...commonProps}
          roughness={material.roughness}
          metalness={material.metalness}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          clearcoat={material.metalness > 0.5 ? 0.5 : 0}
          clearcoatRoughness={0.1}
        />
      );

    case 'toon':
      return <meshToonMaterial {...commonProps} emissive={emissive} emissiveIntensity={emissiveIntensity} />;

    case 'standard':
    default:
      return (
        <meshStandardMaterial
          {...commonProps}
          roughness={material.roughness}
          metalness={material.metalness}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      );
  }
}
