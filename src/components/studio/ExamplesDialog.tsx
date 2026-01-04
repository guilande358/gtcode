import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Box, Gamepad2, Mountain, Zap, Volume2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Example {
  id: string;
  nameKey: string;
  descriptionKey: string;
  icon: React.ReactNode;
  code: string;
}

const EXAMPLES: Example[] = [
  {
    id: 'hello-world',
    nameKey: 'examples.helloWorld',
    descriptionKey: 'A simple cube in the center of the scene',
    icon: <Box className="h-6 w-6" />,
    code: `// Hello World 3D in GcodeForce
project "Hello World" version "1.0"

scene Main {
  camera position(0, 5, 10)
  light type("directional") color(#FFFFFF)
  
  entity Cube {
    model primitive("box") size(2, 2, 2) color(#4A90D9)
  }
}`
  },
  {
    id: 'controllable-cube',
    nameKey: 'examples.controllableCube',
    descriptionKey: 'Use WASD to move the cube',
    icon: <Gamepad2 className="h-6 w-6" />,
    code: `// Controllable Cube with Physics
project "Controllable Cube" version "1.0"

scene Main {
  camera position(0, 8, 12)
  light type("directional") color(#FFFFFF)
  
  entity Player {
    model primitive("box") size(1, 1, 1) color(#FF6B6B) position(0, 2, 0)
    physics active(true) mass(1) gravity(true)
    control keyboard("WASD") speed(8)
  }
  
  entity Ground {
    model primitive("plane") size(20, 1, 20) color(#4ECDC4)
    physics static(true)
  }
}`
  },
  {
    id: 'platformer',
    nameKey: 'examples.platformer',
    descriptionKey: 'Platform game with gravity and jump (Space)',
    icon: <Mountain className="h-6 w-6" />,
    code: `// Platform Game with Physics
project "Platformer" version "1.0"

scene Main {
  camera position(0, 10, 20)
  light type("directional") color(#FFE4B5) position(10, 20, 10)
  
  entity Player {
    model primitive("box") size(1, 2, 1) color(#FF6B6B) position(0, 5, 0)
    physics active(true) mass(1) gravity(true)
    control keyboard("WASD") speed(6)
  }
  
  entity Ground {
    model primitive("plane") size(30, 1, 30) color(#2D5016)
    physics static(true)
  }
  
  entity Platform1 {
    model primitive("box") size(5, 0.5, 3) color(#8B4513) position(5, 2, 0)
    physics static(true)
  }
  
  entity Platform2 {
    model primitive("box") size(4, 0.5, 4) color(#8B4513) position(-4, 4, -3)
    physics static(true)
  }
  
  entity Platform3 {
    model primitive("box") size(6, 0.5, 3) color(#8B4513) position(0, 6, 5)
    physics static(true)
  }
  
  entity Goal {
    model primitive("sphere") size(1, 1, 1) color(#FFD700) position(0, 7.5, 5)
  }
}`
  },
  {
    id: 'audio-demo',
    nameKey: 'examples.audioDemo',
    descriptionKey: 'Demo with collision sounds and procedural audio',
    icon: <Volume2 className="h-6 w-6" />,
    code: `// Audio Demo with Physics
project "Audio Demo" version "1.0"

scene Main {
  camera position(0, 10, 15)
  light type("directional") color(#FFFFFF)
  
  entity Player {
    model primitive("sphere") size(1, 1, 1) color(#FF6B6B) position(0, 5, 0)
    physics active(true) mass(1) gravity(true)
    control keyboard("WASD") speed(5)
  }
  
  entity Ball1 {
    model primitive("sphere") size(0.8, 0.8, 0.8) color(#4ECDC4) position(3, 8, 2)
    physics active(true) mass(0.5) gravity(true)
  }
  
  entity Ball2 {
    model primitive("sphere") size(1.2, 1.2, 1.2) color(#45B7D1) position(-2, 10, -1)
    physics active(true) mass(0.8) gravity(true)
  }
  
  entity Box1 {
    model primitive("box") size(1.5, 1.5, 1.5) color(#96CEB4) position(4, 6, -3)
    physics active(true) mass(1) gravity(true)
  }
  
  entity Ground {
    model primitive("plane") size(25, 1, 25) color(#333344)
    physics static(true)
  }
  
  entity Ramp {
    model primitive("box") size(8, 0.3, 4) color(#8B4513) position(-5, 1, 0) rotation(0, 0, -15)
    physics static(true)
  }
}`
  },
  {
    id: 'shapes',
    nameKey: 'shapes.gallery',
    descriptionKey: 'All available 3D primitives',
    icon: <Zap className="h-6 w-6" />,
    code: `// 3D Shapes Gallery
project "Gallery" version "1.0"

scene Main {
  camera position(0, 10, 20)
  light type("directional") color(#FFFFFF) position(5, 15, 10)
  light type("ambient") color(#404080)
  
  entity Cube {
    model primitive("box") size(2, 2, 2) color(#FF6B6B) position(-8, 1, 0)
  }
  
  entity Sphere {
    model primitive("sphere") size(2, 2, 2) color(#4ECDC4) position(-4, 1, 0)
  }
  
  entity Cylinder {
    model primitive("cylinder") size(1.5, 3, 1.5) color(#45B7D1) position(0, 1.5, 0)
  }
  
  entity Cone {
    model primitive("cone") size(2, 3, 2) color(#96CEB4) position(4, 1.5, 0)
  }
  
  entity Torus {
    model primitive("torus") size(2, 2, 2) color(#DDA0DD) position(8, 1.5, 0)
  }
  
  entity Ground {
    model primitive("plane") size(25, 1, 15) color(#333344)
    physics static(true)
  }
}`
  }
];

interface ExamplesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectExample: (code: string, name: string) => void;
}

export function ExamplesDialog({ open, onOpenChange, onSelectExample }: ExamplesDialogProps) {
  const { t } = useTranslation();
  
  const handleSelect = (example: Example) => {
    const name = t(example.nameKey, { defaultValue: example.nameKey });
    onSelectExample(example.code, name);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('examples.title')}</DialogTitle>
          <DialogDescription>
            {t('examples.description')}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[400px]">
          <div className="grid gap-3 py-4">
            {EXAMPLES.map((example) => (
              <button
                key={example.id}
                onClick={() => handleSelect(example)}
                className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors text-left"
              >
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {example.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">
                    {t(example.nameKey, { defaultValue: example.nameKey })}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {example.descriptionKey}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
