import { ReactNode, useRef, useCallback } from 'react';
import { Physics, RigidBody, CuboidCollider, BallCollider, CylinderCollider, RapierRigidBody } from '@react-three/rapier';
import { Entity3D } from '@/lib/gcodeforce-interpreter';
import { playProceduralSound } from '@/lib/procedural-audio';

interface PhysicsWorldProps {
  children: ReactNode;
  gravity?: [number, number, number];
  debug?: boolean;
}

export function PhysicsWorld({ children, gravity = [0, -9.81, 0], debug = false }: PhysicsWorldProps) {
  return (
    <Physics gravity={gravity} debug={debug}>
      {children}
    </Physics>
  );
}

interface PhysicsPrimitiveProps {
  entity: Entity3D;
  isSelected?: boolean;
  onCollide?: (otherId: string) => void;
  isRunning?: boolean;
}

export interface PhysicsHandle {
  rigidBody: RapierRigidBody | null;
  applyImpulse: (impulse: { x: number; y: number; z: number }) => void;
  setLinvel: (velocity: { x: number; y: number; z: number }) => void;
  getLinvel: () => { x: number; y: number; z: number };
  getPosition: () => [number, number, number];
  isGrounded: () => boolean;
}

export function PhysicsPrimitive({ entity, isSelected, onCollide, isRunning }: PhysicsPrimitiveProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const isGroundedRef = useRef(false);
  const lastCollisionTime = useRef(0);

  // Determine rigid body type
  const bodyType = entity.physics.isStatic ? 'fixed' : 
                   entity.physics.active ? 'dynamic' : 'kinematicPosition';

  // Handle collision events
  const handleCollisionEnter = useCallback((event: any) => {
    const otherName = event.other.rigidBodyObject?.name || 'unknown';
    
    // Debounce collision sounds
    const now = Date.now();
    if (now - lastCollisionTime.current > 100) {
      playProceduralSound('collision', 0.5);
      lastCollisionTime.current = now;
    }

    // Check if we landed on something (for grounded state)
    if (event.other.rigidBodyObject) {
      const contactNormal = event.manifold?.normal?.();
      if (contactNormal && contactNormal.y > 0.5) {
        isGroundedRef.current = true;
      }
    }

    onCollide?.(otherName);
  }, [onCollide]);

  const handleCollisionExit = useCallback(() => {
    isGroundedRef.current = false;
  }, []);

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
        return <boxGeometry args={[entity.scale[0], 0.1, entity.scale[2]]} />;
      case 'torus':
        return <torusGeometry args={[entity.scale[0] / 2, entity.scale[0] / 6, 16, 48]} />;
      default:
        return <boxGeometry args={entity.scale} />;
    }
  };

  const renderCollider = () => {
    switch (entity.primitive) {
      case 'sphere':
        return <BallCollider args={[entity.scale[0] / 2]} />;
      case 'cylinder':
        return <CylinderCollider args={[entity.scale[1] / 2, entity.scale[0] / 2]} />;
      case 'plane':
        return <CuboidCollider args={[entity.scale[0] / 2, 0.05, entity.scale[2] / 2]} />;
      default:
        return <CuboidCollider args={[entity.scale[0] / 2, entity.scale[1] / 2, entity.scale[2] / 2]} />;
    }
  };

  const rotation: [number, number, number] = [
    (entity.rotation[0] * Math.PI) / 180,
    (entity.rotation[1] * Math.PI) / 180,
    (entity.rotation[2] * Math.PI) / 180
  ];

  return (
    <RigidBody
      ref={rigidBodyRef}
      name={entity.id}
      type={bodyType}
      position={entity.position}
      rotation={rotation}
      mass={entity.physics.mass}
      gravityScale={entity.physics.gravity ? 1 : 0}
      colliders={false}
      onCollisionEnter={handleCollisionEnter}
      onCollisionExit={handleCollisionExit}
      linearDamping={0.5}
      angularDamping={0.5}
      lockRotations={entity.control.enabled} // Lock rotation for controllable entities
    >
      {renderCollider()}
      <mesh castShadow receiveShadow>
        {renderGeometry()}
        <meshStandardMaterial 
          color={entity.color}
          emissive={isSelected ? entity.color : '#000000'}
          emissiveIntensity={isSelected ? 0.2 : 0}
        />
      </mesh>
    </RigidBody>
  );
}

// Ground plane with physics
export function PhysicsGround({ size = 50 }: { size?: number }) {
  return (
    <RigidBody type="fixed" position={[0, -0.5, 0]} name="ground">
      <CuboidCollider args={[size / 2, 0.5, size / 2]} />
      <mesh receiveShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[size, 0.1, size]} />
        <meshStandardMaterial color="#2a2a3e" transparent opacity={0.5} />
      </mesh>
    </RigidBody>
  );
}
