import { useRef, useEffect, useCallback } from 'react';
import { Scene3D, Entity3D } from '@/lib/gcodeforce-interpreter';
import { Primitive, PrimitiveHandle, GridHelper } from './Primitives';
import { useGameInput } from '@/hooks/useGameInput';
import { useFrame } from '@react-three/fiber';

interface SceneRendererProps {
  scene: Scene3D;
  isRunning: boolean;
}

export function SceneRenderer({ scene, isRunning }: SceneRendererProps) {
  const entityRefs = useRef<Map<string, PrimitiveHandle>>(new Map());
  const { getMovementVector, isJumpPressed, resetInput } = useGameInput({ enabled: isRunning });

  // Reset input when stopping
  useEffect(() => {
    if (!isRunning) {
      resetInput();
    }
  }, [isRunning, resetInput]);

  // Game loop for controlled entities
  useFrame((_, delta) => {
    if (!isRunning) return;

    scene.entities.forEach(entity => {
      if (entity.control.enabled) {
        const ref = entityRefs.current.get(entity.id);
        if (ref) {
          const movement = getMovementVector(entity.control.keys);
          const speed = entity.control.speed * delta;
          
          ref.move(movement.x * speed, 0, movement.z * speed);

          // Simple jump (if space pressed and on ground)
          if (isJumpPressed()) {
            const pos = ref.getPosition();
            if (pos[1] <= entity.position[1] + 0.1) {
              // Simple upward impulse
              ref.move(0, 0.2, 0);
            }
          }
        }
      }
    });
  });

  const setRef = useCallback((id: string, handle: PrimitiveHandle | null) => {
    if (handle) {
      entityRefs.current.set(id, handle);
    } else {
      entityRefs.current.delete(id);
    }
  }, []);

  return (
    <>
      {/* Lights */}
      {scene.lights.map((light, index) => {
        switch (light.type) {
          case 'ambient':
            return (
              <ambientLight
                key={`light-${index}`}
                color={light.color}
                intensity={light.intensity}
              />
            );
          case 'directional':
            return (
              <directionalLight
                key={`light-${index}`}
                color={light.color}
                intensity={light.intensity}
                position={light.position || [5, 10, 5]}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
              />
            );
          case 'point':
            return (
              <pointLight
                key={`light-${index}`}
                color={light.color}
                intensity={light.intensity}
                position={light.position || [0, 5, 0]}
                castShadow
              />
            );
          case 'spot':
            return (
              <spotLight
                key={`light-${index}`}
                color={light.color}
                intensity={light.intensity}
                position={light.position || [0, 10, 0]}
                angle={Math.PI / 4}
                penumbra={0.5}
                castShadow
              />
            );
          default:
            return null;
        }
      })}

      {/* Grid */}
      <GridHelper />

      {/* Entities */}
      {scene.entities.map(entity => (
        <Primitive
          key={entity.id}
          ref={(handle) => setRef(entity.id, handle)}
          entity={entity}
          isSelected={entity.control.enabled && isRunning}
        />
      ))}
    </>
  );
}
