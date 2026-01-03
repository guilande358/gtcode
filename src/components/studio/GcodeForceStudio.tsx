import { useState, useCallback, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useProjects } from '@/hooks/useProjects';
import { useMobileLayout } from '@/hooks/useMobileLayout';
import { Toolbar } from './Toolbar';
import { FileExplorer } from './FileExplorer';
import { CodeEditor } from './CodeEditor';
import { PreviewPanel } from './PreviewPanel';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { cn } from '@/lib/utils';

export function GcodeForceStudio() {
  const { theme, toggleTheme } = useTheme();
  const { isMobile, mobileView, setMobileView } = useMobileLayout();
  const [isRunning, setIsRunning] = useState(false);

  const {
    projects,
    activeProject,
    activeFile,
    setActiveProjectId,
    setActiveFileId,
    createProject,
    deleteProject,
    createFile,
    deleteFile,
    updateFileContent,
  } = useProjects();

  const handleRun = useCallback(() => {
    setIsRunning(true);
    if (isMobile) {
      setMobileView('preview');
    }
  }, [isMobile, setMobileView]);

  const handleStop = useCallback(() => {
    setIsRunning(false);
  }, []);

  const handleCodeChange = useCallback((value: string) => {
    if (activeProject && activeFile) {
      updateFileContent(activeProject.id, activeFile.id, value);
    }
  }, [activeProject, activeFile, updateFileContent]);

  // Listen for F5 keyboard shortcut from editor
  useEffect(() => {
    const handleRunEvent = () => {
      if (isRunning) {
        handleStop();
      } else {
        handleRun();
      }
    };

    window.addEventListener('gcodeforce-run', handleRunEvent);
    return () => window.removeEventListener('gcodeforce-run', handleRunEvent);
  }, [isRunning, handleRun, handleStop]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F5') {
        e.preventDefault();
        if (isRunning) {
          handleStop();
        } else {
          handleRun();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, handleRun, handleStop]);

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <Toolbar
          theme={theme}
          onToggleTheme={toggleTheme}
          isRunning={isRunning}
          onRun={handleRun}
          onStop={handleStop}
          projectName={activeProject?.name || 'Sem projeto'}
          isMobile={isMobile}
          mobileView={mobileView}
          onChangeMobileView={setMobileView}
        />

        <div className="flex-1 overflow-hidden">
          {mobileView === 'files' && (
            <FileExplorer
              projects={projects}
              activeProject={activeProject}
              activeFileId={activeFile?.id || null}
              onSelectProject={setActiveProjectId}
              onSelectFile={(fileId) => {
                setActiveFileId(fileId);
                setMobileView('editor');
              }}
              onCreateProject={createProject}
              onCreateFile={createFile}
              onDeleteProject={deleteProject}
              onDeleteFile={deleteFile}
            />
          )}

          {mobileView === 'editor' && (
            <CodeEditor
              value={activeFile?.content || '// Selecione um arquivo'}
              onChange={handleCodeChange}
              theme={theme}
            />
          )}

          {mobileView === 'preview' && (
            <PreviewPanel
              isRunning={isRunning}
              code={activeFile?.content || ''}
            />
          )}
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Toolbar
        theme={theme}
        onToggleTheme={toggleTheme}
        isRunning={isRunning}
        onRun={handleRun}
        onStop={handleStop}
        projectName={activeProject?.name || 'Sem projeto'}
        isMobile={isMobile}
        mobileView={mobileView}
        onChangeMobileView={setMobileView}
      />

      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* File Explorer */}
          <ResizablePanel defaultSize={15} minSize={12} maxSize={25}>
            <FileExplorer
              projects={projects}
              activeProject={activeProject}
              activeFileId={activeFile?.id || null}
              onSelectProject={setActiveProjectId}
              onSelectFile={setActiveFileId}
              onCreateProject={createProject}
              onCreateFile={createFile}
              onDeleteProject={deleteProject}
              onDeleteFile={deleteFile}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Code Editor */}
          <ResizablePanel defaultSize={45} minSize={30}>
            <CodeEditor
              value={activeFile?.content || '// Selecione um arquivo'}
              onChange={handleCodeChange}
              theme={theme}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Preview Panel */}
          <ResizablePanel defaultSize={40} minSize={25}>
            <PreviewPanel
              isRunning={isRunning}
              code={activeFile?.content || ''}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
