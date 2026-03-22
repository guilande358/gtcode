import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
import { useProjects } from '@/hooks/useProjects';
import { useMobileLayout } from '@/hooks/useMobileLayout';
import { Toolbar } from './Toolbar';
import { FileExplorer } from './FileExplorer';
import { CodeEditor } from './CodeEditor';
import { PreviewPanel } from './PreviewPanel';
import { ConsolePanel, ConsoleMessage } from './ConsolePanel';
import { ExamplesDialog } from './ExamplesDialog';
import { ExportDialog } from './ExportDialog';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { interpretGcodeForce, Scene3D } from '@/lib/gcodeforce-interpreter';
import { resumeAudioContext } from '@/lib/procedural-audio';

export function GcodeForceStudio() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { isMobile, mobileView, setMobileView } = useMobileLayout();
  const [isRunning, setIsRunning] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);

  const {
    projects, activeProject, activeFile,
    setActiveProjectId, setActiveFileId,
    createProject, deleteProject, createFile, deleteFile, updateFileContent,
  } = useProjects();

  const interpretedScene = useMemo((): Scene3D => {
    const code = activeFile?.content || '';
    const result = interpretGcodeForce(code);
    return result.scene || {
      name: 'Empty',
      camera: { position: [0, 5, 10], lookAt: [0, 0, 0], fov: 75 },
      lights: [
        { type: 'ambient', color: '#404040', intensity: 0.4 },
        { type: 'directional', color: '#ffffff', intensity: 1, position: [5, 10, 5] }
      ],
      entities: []
    };
  }, [activeFile?.content]);

  const addConsoleMessage = useCallback((type: ConsoleMessage['type'], message: string) => {
    setConsoleMessages(prev => [...prev, {
      id: `msg-${Date.now()}-${Math.random()}`,
      type, message, timestamp: new Date()
    }]);
  }, []);

  const clearConsole = useCallback(() => setConsoleMessages([]), []);

  const handleRun = useCallback(async () => {
    await resumeAudioContext();
    setIsRunning(true);
    clearConsole();
    
    const code = activeFile?.content || '';
    const result = interpretGcodeForce(code);
    result.logs.forEach(log => addConsoleMessage('info', log));
    result.errors.forEach(err => addConsoleMessage('error', err));
    
    if (result.errors.length === 0) {
      addConsoleMessage('success', t('console.gameStarted', '✓ Game started successfully!'));
      addConsoleMessage('info', t('preview.moveHint'));
    }
    
    if (isMobile) setMobileView('preview');
  }, [activeFile?.content, isMobile, setMobileView, addConsoleMessage, clearConsole, t]);

  const handleStop = useCallback(() => {
    setIsRunning(false);
    addConsoleMessage('info', t('console.gameStopped', '■ Game stopped'));
  }, [addConsoleMessage, t]);

  const handleCodeChange = useCallback((value: string) => {
    if (activeProject && activeFile) {
      updateFileContent(activeProject.id, activeFile.id, value);
    }
  }, [activeProject, activeFile, updateFileContent]);

  const handleSelectExample = useCallback((code: string, name: string) => {
    const project = createProject(name);
    if (project && project.files[0]) {
      updateFileContent(project.id, project.files[0].id, code);
      addConsoleMessage('success', `Example "${name}" loaded!`);
    }
  }, [createProject, updateFileContent, addConsoleMessage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F5') {
        e.preventDefault();
        if (isRunning) handleStop(); else handleRun();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, handleRun, handleStop]);

  const toolbarProps = {
    theme, onToggleTheme: toggleTheme,
    isRunning, onRun: handleRun, onStop: handleStop,
    projectName: activeProject?.name || 'No project',
    isMobile, mobileView, onChangeMobileView: setMobileView,
    onShowExamples: () => setShowExamples(true),
    onExport: () => setShowExport(true),
  };

  if (isMobile) {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <Toolbar {...toolbarProps} />
        <div className="flex-1 overflow-hidden">
          {mobileView === 'files' && (
            <FileExplorer projects={projects} activeProject={activeProject} activeFileId={activeFile?.id || null}
              onSelectProject={setActiveProjectId}
              onSelectFile={(fileId) => { setActiveFileId(fileId); setMobileView('editor'); }}
              onCreateProject={createProject} onCreateFile={createFile}
              onDeleteProject={deleteProject} onDeleteFile={deleteFile}
            />
          )}
          {mobileView === 'editor' && (
            <CodeEditor value={activeFile?.content || '// Select a file'} onChange={handleCodeChange} theme={theme} />
          )}
          {mobileView === 'preview' && (
            <PreviewPanel scene={interpretedScene} isRunning={isRunning} onConsoleMessage={addConsoleMessage} />
          )}
        </div>
        <ExamplesDialog open={showExamples} onOpenChange={setShowExamples} onSelectExample={handleSelectExample} />
        <ExportDialog open={showExport} onOpenChange={setShowExport} scene={interpretedScene} sourceCode={activeFile?.content || ''} onConsoleMessage={addConsoleMessage} />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Toolbar {...toolbarProps} />
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={15} minSize={12} maxSize={25}>
            <FileExplorer projects={projects} activeProject={activeProject} activeFileId={activeFile?.id || null}
              onSelectProject={setActiveProjectId} onSelectFile={setActiveFileId}
              onCreateProject={createProject} onCreateFile={createFile}
              onDeleteProject={deleteProject} onDeleteFile={deleteFile}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={45} minSize={30}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={75} minSize={40}>
                <CodeEditor value={activeFile?.content || '// Select a file'} onChange={handleCodeChange} theme={theme} />
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={25} minSize={15}>
                <ConsolePanel messages={consoleMessages} onClear={clearConsole} className="h-full" />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={40} minSize={25}>
            <PreviewPanel scene={interpretedScene} isRunning={isRunning} onConsoleMessage={addConsoleMessage} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      <ExamplesDialog open={showExamples} onOpenChange={setShowExamples} onSelectExample={handleSelectExample} />
      <ExportDialog open={showExport} onOpenChange={setShowExport} scene={interpretedScene} sourceCode={activeFile?.content || ''} onConsoleMessage={addConsoleMessage} />
    </div>
  );
}
