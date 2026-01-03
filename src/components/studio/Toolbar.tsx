import { Play, Square, Download, Settings, Moon, Sun, Menu, FolderOpen, Eye, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { MobileView } from '@/hooks/useMobileLayout';

interface ToolbarProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  isRunning: boolean;
  onRun: () => void;
  onStop: () => void;
  projectName: string;
  isMobile: boolean;
  mobileView: MobileView;
  onChangeMobileView: (view: MobileView) => void;
}

export function Toolbar({
  theme,
  onToggleTheme,
  isRunning,
  onRun,
  onStop,
  projectName,
  isMobile,
  mobileView,
  onChangeMobileView,
}: ToolbarProps) {
  return (
    <header className="h-12 bg-card border-b border-border flex items-center justify-between px-3 gap-2">
      {/* Logo e Nome */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">G</span>
          </div>
          {!isMobile && (
            <span className="font-semibold text-foreground whitespace-nowrap">GcodeForce</span>
          )}
        </div>
        <span className="text-muted-foreground hidden sm:inline">|</span>
        <span className="text-sm text-foreground truncate max-w-[150px] sm:max-w-[200px]">
          {projectName}
        </span>
      </div>

      {/* Controles de Execução (Centro) */}
      <div className="flex items-center gap-1">
        {isRunning ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={onStop}
                className="gap-1.5"
              >
                <Square className="h-4 w-4" />
                {!isMobile && <span>Parar</span>}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Parar execução (F5)</TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                size="sm" 
                onClick={onRun}
                className="gap-1.5 bg-success hover:bg-success/90 text-success-foreground"
              >
                <Play className="h-4 w-4" />
                {!isMobile && <span>Executar</span>}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Executar jogo (F5)</TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Ações à Direita */}
      <div className="flex items-center gap-1">
        {/* Mobile View Switcher */}
        {isMobile && (
          <div className="flex items-center bg-secondary rounded-md p-0.5">
            <Button
              variant={mobileView === 'files' ? 'default' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => onChangeMobileView('files')}
            >
              <FolderOpen className="h-4 w-4" />
            </Button>
            <Button
              variant={mobileView === 'editor' ? 'default' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => onChangeMobileView('editor')}
            >
              <Code className="h-4 w-4" />
            </Button>
            <Button
              variant={mobileView === 'preview' ? 'default' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => onChangeMobileView('preview')}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Download className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Exportar projeto</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggleTheme}>
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Alternar tema</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Configurações</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
