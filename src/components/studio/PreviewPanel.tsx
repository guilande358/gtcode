import { Play, RotateCcw, Maximize2, ZoomIn, ZoomOut, Move3D } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface PreviewPanelProps {
  isRunning: boolean;
  code: string;
}

export function PreviewPanel({ isRunning, code }: PreviewPanelProps) {
  return (
    <div className="h-full flex flex-col bg-card">
      {/* Preview Toolbar */}
      <div className="h-10 border-b border-border flex items-center justify-between px-3">
        <span className="text-sm font-medium text-foreground">Preview 3D</span>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Move3D className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Modo orbitar</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom in</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom out</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Resetar câmera</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Tela cheia</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* 3D Canvas Placeholder */}
      <div className="flex-1 relative bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        {/* Grid pattern for depth */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            transform: 'perspective(500px) rotateX(60deg)',
            transformOrigin: 'center center',
          }}
        />

        {/* Placeholder content */}
        <div className="relative z-10 text-center p-6">
          <div className="w-20 h-20 mx-auto mb-4 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Play className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {isRunning ? 'Executando...' : 'Preview 3D'}
          </h3>
          <p className="text-sm text-slate-400 max-w-xs">
            {isRunning 
              ? 'Seu jogo está rodando. Use o código para controlar a cena.'
              : 'Pressione "Executar" ou F5 para visualizar seu jogo em tempo real.'
            }
          </p>
          
          {/* Status indicator */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-success animate-pulse' : 'bg-muted'}`} />
            <span className="text-xs text-slate-500">
              {isRunning ? 'Em execução' : 'Parado'}
            </span>
          </div>
        </div>

        {/* Corner decorations */}
        <div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-primary/30 rounded-tl-lg" />
        <div className="absolute top-4 right-4 w-12 h-12 border-r-2 border-t-2 border-primary/30 rounded-tr-lg" />
        <div className="absolute bottom-4 left-4 w-12 h-12 border-l-2 border-b-2 border-primary/30 rounded-bl-lg" />
        <div className="absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-primary/30 rounded-br-lg" />
      </div>

      {/* Status Bar */}
      <div className="h-6 border-t border-border bg-muted/50 flex items-center px-3 text-xs text-muted-foreground">
        <span>Câmera: Perspectiva</span>
        <span className="mx-2">•</span>
        <span>Entidades: 0</span>
        <span className="mx-2">•</span>
        <span>FPS: --</span>
      </div>
    </div>
  );
}
