import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, FileCode, Gamepad2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Scene3D } from '@/lib/gcodeforce-interpreter';
import { GameExporter } from '@/lib/game-exporter';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scene: Scene3D;
  sourceCode: string;
  onConsoleMessage?: (message: string, type: 'log' | 'error' | 'info' | 'success') => void;
}

export function ExportDialog({ open, onOpenChange, scene, sourceCode, onConsoleMessage }: ExportDialogProps) {
  const { t } = useTranslation();
  const [includePhysics, setIncludePhysics] = useState(true);
  const [includeAudio, setIncludeAudio] = useState(true);
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    setExporting(true);
    try {
      const exporter = new GameExporter(scene, sourceCode, {
        includePhysics,
        includeAudio,
        title: scene.name || 'GcodeForce Game',
      });
      exporter.download();
      onConsoleMessage?.(`${t('export.success', 'Game exported successfully!')}`, 'success');
      onOpenChange(false);
    } catch (err) {
      onConsoleMessage?.(`${t('export.error', 'Export error')}: ${err}`, 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {t('export.title', 'Export Game')}
          </DialogTitle>
          <DialogDescription>
            {t('export.description', 'Download your game as a standalone HTML file')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="physics" className="flex items-center gap-2">
              <Gamepad2 className="h-4 w-4 text-muted-foreground" />
              {t('export.includePhysics', 'Include Physics')}
            </Label>
            <Switch id="physics" checked={includePhysics} onCheckedChange={setIncludePhysics} />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="audio" className="flex items-center gap-2">
              <FileCode className="h-4 w-4 text-muted-foreground" />
              {t('export.includeAudio', 'Include Audio')}
            </Label>
            <Switch id="audio" checked={includeAudio} onCheckedChange={setIncludeAudio} />
          </div>

          <div className="bg-muted rounded-lg p-3 text-sm text-muted-foreground space-y-1">
            <p>📦 {t('export.info1', 'Standalone HTML — works offline')}</p>
            <p>🎮 {scene.entities.length} {t('preview.entities', 'entities')}</p>
            <p>💡 {scene.lights.length} {t('export.lights', 'lights')}</p>
          </div>
        </div>

        <Button onClick={handleExport} disabled={exporting} className="w-full gap-2">
          <Download className="h-4 w-4" />
          {exporting ? t('export.exporting', 'Exporting...') : t('export.download', 'Download HTML')}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
