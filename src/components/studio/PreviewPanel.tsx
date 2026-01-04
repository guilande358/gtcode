import { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Scene3D } from '@/lib/gcodeforce-interpreter';
import { PhysicsSceneRenderer } from '@/components/three/PhysicsSceneRenderer';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface PreviewPanelProps {
  scene: Scene3D;
  isRunning: boolean;
  onConsoleMessage?: (message: string, type: 'log' | 'error' | 'info' | 'success') => void;
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#666666" wireframe />
    </mesh>
  );
}

export function PreviewPanel({ scene, isRunning, onConsoleMessage }: PreviewPanelProps) {
  const { t } = useTranslation();
  const controlsRef = useRef<any>(null);
  const [fps, setFps] = useState(0);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  // FPS counter
  useEffect(() => {
    let animationId: number;
    
    const countFrames = () => {
      frameCountRef.current++;
      const now = performance.now();
      
      if (now - lastTimeRef.current >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
      
      animationId = requestAnimationFrame(countFrames);
    };
    
    animationId = requestAnimationFrame(countFrames);
    
    return () => cancelAnimationFrame(animationId);
  }, []);

  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div className="relative w-full h-full bg-[#1a1a2e]">
      <Canvas
        shadows
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#1a1a2e']} />
        
        <PerspectiveCamera
          makeDefault
          position={scene.camera.position}
          fov={scene.camera.fov}
        />
        
        <OrbitControls
          ref={controlsRef}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={2}
          maxDistance={100}
          target={scene.camera.lookAt}
        />
        
        <Suspense fallback={<LoadingFallback />}>
          <PhysicsSceneRenderer 
            scene={scene} 
            isRunning={isRunning}
            onConsoleMessage={onConsoleMessage}
          />
        </Suspense>
        
        <fog attach="fog" args={['#1a1a2e', 30, 100]} />
      </Canvas>

      {/* FPS Counter */}
      <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 rounded text-xs text-green-400 font-mono">
        {fps} {t('preview.fps')}
      </div>

      {/* Entity count */}
      <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 rounded text-xs text-blue-400 font-mono">
        {scene.entities.length} {t('preview.entities')}
      </div>

      {/* Running indicator */}
      {isRunning && (
        <div className="absolute bottom-2 left-2 flex items-center gap-2 px-2 py-1 bg-green-500/20 border border-green-500/50 rounded text-xs text-green-400">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          {t('preview.running')} - {t('preview.moveHint')}
        </div>
      )}

      {/* Camera reset button */}
      <button
        onClick={resetCamera}
        className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 hover:bg-black/70 rounded text-xs text-white transition-colors"
      >
        {t('toolbar.resetCamera')}
      </button>
    </div>
  );
}
