import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Terminal, AlertCircle, Info, CheckCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ConsoleMessage {
  id: string;
  type: 'log' | 'error' | 'info' | 'success';
  message: string;
  timestamp: Date;
}

interface ConsolePanelProps {
  messages: ConsoleMessage[];
  onClear: () => void;
  className?: string;
}

export function ConsolePanel({ messages, onClear, className }: ConsolePanelProps) {
  const getIcon = (type: ConsoleMessage['type']) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-400" />;
      case 'info':
        return <Info className="h-3 w-3 text-blue-400" />;
      case 'success':
        return <CheckCircle className="h-3 w-3 text-green-400" />;
      default:
        return <Terminal className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getTextColor = (type: ConsoleMessage['type']) => {
    switch (type) {
      case 'error':
        return 'text-red-400';
      case 'info':
        return 'text-blue-400';
      case 'success':
        return 'text-green-400';
      default:
        return 'text-foreground';
    }
  };

  return (
    <div className={cn("flex flex-col bg-editor-bg border-t border-border", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Console</span>
          <span className="text-xs text-muted-foreground/60">({messages.length})</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-6 w-6 p-0"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1 font-mono text-xs">
          {messages.length === 0 ? (
            <div className="text-muted-foreground/50 italic">
              Nenhuma mensagem no console
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex items-start gap-2 py-0.5 px-1 rounded hover:bg-muted/20",
                  getTextColor(msg.type)
                )}
              >
                <span className="mt-0.5">{getIcon(msg.type)}</span>
                <span className="text-muted-foreground/50">
                  [{msg.timestamp.toLocaleTimeString()}]
                </span>
                <span className="flex-1 break-all">{msg.message}</span>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
