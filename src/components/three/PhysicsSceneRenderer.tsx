import { useRef, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { RapierRigidBody } from '@react-three/rapier';
import { Scene3D, Entity3D } from '@/lib/gcodeforce-interpreter';
import { PhysicsWorld, PhysicsPrimitive, PhysicsGround } from './PhysicsWorld';
import { GridHelper } from './Primitives';
import { ParticleRenderer, useParticleEmitter } from './ParticleSystem';
import { useGameInput } from '@/hooks/useGameInput';
import { playProceduralSound } from '@/lib/procedural-audio';
import { scriptExecutor } from '@/lib/script-executor';

interface PhysicsSceneRendererProps {
  scene: Scene3D;
  isRunning: boolean;
  onConsoleMessage?: (message: string, type: 'log' | 'error' | 'info' | 'success') => void;
}

export function PhysicsSceneRenderer({ scene, isRunning, onConsoleMessage }: PhysicsSceneRendererProps) {
  const rigidBodyRefs = useRef<Map<string, RapierRigidBody>>(new Map());
  const { getMovementVector, isJumpPressed, resetInput } = useGameInput({ enabled: isRunning });
  const jumpCooldownRef = useRef<Map<string, number>>(new Map());
  const initialized = useRef(false);
  const { emissionsRef, emit } = useParticleEmitter();

  useEffect(() => {
    if (isRunning && !initialized.current) {
      scriptExecutor.initialize(scene);
      scriptExecutor.executeOnInit(scene);
      initialized.current = true;
      onConsoleMessage?.('Game started', 'success');
    }
    
    if (!isRunning) {
      resetInput();
      initialized.current = false;
      scriptExecutor.cleanup();
    }
  }, [isRunning, scene, resetInput, onConsoleMessage]);

  const handleCollision = useCallback((entityId: string, otherId: string) => {
    if (!isRunning) return;
    scriptExecutor.executeOnCollide(entityId, otherId, scene);
    
    // Spawn collision particles
    const entity = scene.entities.find(e => e.id === entityId);
    if (entity) {
      emit('spark', entity.position);
    }
    
    onConsoleMessage?.(`Collision: ${entityId} → ${otherId}`, 'info');
  }, [isRunning, scene, onConsoleMessage, emit]);

  useFrame((_, delta) => {
    if (!isRunning) return;
    scriptExecutor.executeOnFrame(scene, delta);

    const now = Date.now();

    scene.entities.forEach(entity => {
      if (entity.control.enabled && entity.physics.active) {
        const rigidBody = rigidBodyRefs.current.get(entity.id);
        if (!rigidBody) return;

        const movement = getMovementVector(entity.control.keys);
        const speed = entity.control.speed;
        const currentVel = rigidBody.linvel();

        const forceX = movement.x * speed * 10;
        const forceZ = movement.z * speed * 10;

        rigidBody.setLinvel({ x: forceX, y: currentVel.y, z: forceZ }, true);

        if (isJumpPressed()) {
          const lastJump = jumpCooldownRef.current.get(entity.id) || 0;
          if (Math.abs(currentVel.y) < 0.5 && now - lastJump > 300) {
            rigidBody.applyImpulse({ x: 0, y: entity.physics.mass * 8, z: 0 }, true);
            jumpCooldownRef.current.set(entity.id, now);
            playProceduralSound('jump');
            
            // Dust particles on jump
            const pos = rigidBody.translation();
            emit('dust', [pos.x, pos.y - entity.scale[1] / 2, pos.z]);
          }
        }
      }
    });
  });

  const setRigidBodyRef = useCallback((id: string, ref: RapierRigidBody | null) => {
    if (ref) rigidBodyRefs.current.set(id, ref);
    else rigidBodyRefs.current.delete(id);
  }, []);

  const staticEntities = scene.entities.filter(e => e.physics.isStatic || !e.physics.active);
  const dynamicEntities = scene.entities.filter(e => !e.physics.isStatic && e.physics.active);

  return (
    <PhysicsWorld gravity={[0, -9.81, 0]}>
      {scene.lights.map((light, index) => {
        switch (light.type) {
          case 'ambient':
            return <ambientLight key={`light-${index}`} color={light.color} intensity={light.intensity} />;
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
            return <pointLight key={`light-${index}`} color={light.color} intensity={light.intensity} position={light.position || [0, 5, 0]} castShadow />;
          case 'spot':
            return <spotLight key={`light-${index}`} color={light.color} intensity={light.intensity} position={light.position || [0, 10, 0]} angle={Math.PI / 4} penumbra={0.5} castShadow />;
          default:
            return null;
        }
      })}

      <GridHelper />
      <PhysicsGround />

      {staticEntities.map(entity => (
        <PhysicsPrimitive
          key={entity.id}
          entity={entity}
          isSelected={false}
          isRunning={isRunning}
          onCollide={(otherId) => handleCollision(entity.id, otherId)}
        />
      ))}

      {dynamicEntities.map(entity => (
        <PhysicsPrimitive
          key={entity.id}
          entity={entity}
          isSelected={entity.control.enabled && isRunning}
          isRunning={isRunning}
          onCollide={(otherId) => handleCollision(entity.id, otherId)}
        />
      ))}

      {/* Particle system */}
      <ParticleRenderer emissionsRef={emissionsRef} />
    </PhysicsWorld>
  );
}
