import { ThreeCanvas } from '@/components/three/ThreeCanvas';
import { Scene3D } from '@/lib/gcodeforce-interpreter';

interface PreviewPanelProps {
  scene: Scene3D;
  isRunning: boolean;
}

export function PreviewPanel({ scene, isRunning }: PreviewPanelProps) {
  return (
    <div className="h-full w-full bg-[#1a1a2e]">
      <ThreeCanvas
        scene={scene}
        isRunning={isRunning}
        className="h-full w-full"
      />
    </div>
  );
}
