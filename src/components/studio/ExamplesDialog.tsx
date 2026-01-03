import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Box, Gamepad2, Mountain, Zap } from 'lucide-react';

interface Example {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  code: string;
}

const EXAMPLES: Example[] = [
  {
    id: 'hello-world',
    name: 'Olá Mundo 3D',
    description: 'Um cubo simples no centro da cena',
    icon: <Box className="h-6 w-6" />,
    code: `// Olá Mundo 3D em GcodeForce
projeto "Olá Mundo" versao "1.0"

cena Principal {
  camera posicao(0, 5, 10)
  luz tipo("direcional") cor(#FFFFFF)
  
  entidade Cubo {
    modelo primitivo("cubo") tamanho(2, 2, 2) cor(#4A90D9)
  }
}`
  },
  {
    id: 'controllable-cube',
    name: 'Cubo Controlável',
    description: 'Use WASD para mover o cubo pela cena',
    icon: <Gamepad2 className="h-6 w-6" />,
    code: `// Cubo Controlável com WASD
projeto "Cubo Controlável" versao "1.0"

cena Principal {
  camera posicao(0, 8, 12)
  luz tipo("direcional") cor(#FFFFFF)
  
  entidade Jogador {
    modelo primitivo("cubo") tamanho(1, 1, 1) cor(#FF6B6B) posicao(0, 0.5, 0)
    fisica ativo(true) massa(1) gravidade(false)
    controle teclado("WASD") velocidade(8)
  }
  
  entidade Chao {
    modelo primitivo("plano") tamanho(20, 1, 20) cor(#4ECDC4)
    fisica estatico(true)
  }
}`
  },
  {
    id: 'obstacles',
    name: 'Cenário com Obstáculos',
    description: 'Cena com múltiplos objetos e um jogador controlável',
    icon: <Mountain className="h-6 w-6" />,
    code: `// Cenário com Obstáculos
projeto "Obstáculos" versao "1.0"

cena Principal {
  camera posicao(0, 15, 20)
  luz tipo("direcional") cor(#FFE4B5) posicao(10, 20, 10)
  
  entidade Jogador {
    modelo primitivo("esfera") tamanho(1, 1, 1) cor(#FF6B6B) posicao(0, 0.5, 0)
    fisica ativo(true) massa(1) gravidade(false)
    controle teclado("WASD") velocidade(6)
  }
  
  entidade Chao {
    modelo primitivo("plano") tamanho(30, 1, 30) cor(#2D5016)
    fisica estatico(true)
  }
  
  entidade Obstaculo1 {
    modelo primitivo("cubo") tamanho(2, 3, 2) cor(#8B4513) posicao(5, 1.5, 3)
    fisica estatico(true)
  }
  
  entidade Obstaculo2 {
    modelo primitivo("cilindro") tamanho(1.5, 4, 1.5) cor(#8B4513) posicao(-4, 2, -2)
    fisica estatico(true)
  }
  
  entidade Obstaculo3 {
    modelo primitivo("cubo") tamanho(3, 1, 3) cor(#8B4513) posicao(0, 0.5, -6)
    fisica estatico(true)
  }
  
  entidade Meta {
    modelo primitivo("esfera") tamanho(1.5, 1.5, 1.5) cor(#FFD700) posicao(-5, 1, 7)
  }
}`
  },
  {
    id: 'shapes',
    name: 'Galeria de Formas',
    description: 'Demonstração de todas as primitivas disponíveis',
    icon: <Zap className="h-6 w-6" />,
    code: `// Galeria de Formas 3D
projeto "Galeria" versao "1.0"

cena Principal {
  camera posicao(0, 10, 20)
  luz tipo("direcional") cor(#FFFFFF) posicao(5, 15, 10)
  luz tipo("ambiente") cor(#404080)
  
  entidade Cubo {
    modelo primitivo("cubo") tamanho(2, 2, 2) cor(#FF6B6B) posicao(-8, 1, 0)
  }
  
  entidade Esfera {
    modelo primitivo("esfera") tamanho(2, 2, 2) cor(#4ECDC4) posicao(-4, 1, 0)
  }
  
  entidade Cilindro {
    modelo primitivo("cilindro") tamanho(1.5, 3, 1.5) cor(#45B7D1) posicao(0, 1.5, 0)
  }
  
  entidade Cone {
    modelo primitivo("cone") tamanho(2, 3, 2) cor(#96CEB4) posicao(4, 1.5, 0)
  }
  
  entidade Torus {
    modelo primitivo("torus") tamanho(2, 2, 2) cor(#DDA0DD) posicao(8, 1.5, 0)
  }
  
  entidade Chao {
    modelo primitivo("plano") tamanho(25, 1, 15) cor(#333344)
    fisica estatico(true)
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
  const handleSelect = (example: Example) => {
    onSelectExample(example.code, example.name);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Exemplos de Projetos</DialogTitle>
          <DialogDescription>
            Selecione um exemplo para começar. O código será carregado no editor.
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
                  <h4 className="font-medium text-foreground">{example.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {example.description}
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
