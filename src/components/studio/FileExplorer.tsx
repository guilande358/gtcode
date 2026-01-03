import { useState } from 'react';
import { 
  File, 
  FolderOpen, 
  Plus, 
  Trash2, 
  MoreHorizontal,
  FileCode,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { Project, ProjectFile } from '@/hooks/useProjects';
import { cn } from '@/lib/utils';

interface FileExplorerProps {
  projects: Project[];
  activeProject: Project | null;
  activeFileId: string | null;
  onSelectProject: (projectId: string) => void;
  onSelectFile: (fileId: string) => void;
  onCreateProject: (name: string) => void;
  onCreateFile: (projectId: string, name: string) => void;
  onDeleteProject: (projectId: string) => void;
  onDeleteFile: (projectId: string, fileId: string) => void;
}

export function FileExplorer({
  projects,
  activeProject,
  activeFileId,
  onSelectProject,
  onSelectFile,
  onCreateProject,
  onCreateFile,
  onDeleteProject,
  onDeleteFile,
}: FileExplorerProps) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(activeProject ? [activeProject.id] : [])
  );
  const [newProjectName, setNewProjectName] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [createFileForProject, setCreateFileForProject] = useState<string | null>(null);

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      onCreateProject(newProjectName.trim());
      setNewProjectName('');
      setIsCreateProjectOpen(false);
    }
  };

  const handleCreateFile = () => {
    if (newFileName.trim() && createFileForProject) {
      onCreateFile(createFileForProject, newFileName.trim());
      setNewFileName('');
      setCreateFileForProject(null);
    }
  };

  const getFileIcon = (file: ProjectFile) => {
    if (file.type === 'gcodeforce') {
      return <FileCode className="h-4 w-4 text-primary" />;
    }
    return <File className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="h-full flex flex-col bg-sidebar-background border-r border-sidebar-border">
      {/* Header */}
      <div className="p-3 border-b border-sidebar-border flex items-center justify-between">
        <span className="text-sm font-medium text-sidebar-foreground">Projetos</span>
        <Dialog open={isCreateProjectOpen} onOpenChange={setIsCreateProjectOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Projeto</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <Input
                placeholder="Nome do projeto"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
              />
              <Button onClick={handleCreateProject}>Criar Projeto</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* File Tree */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {projects.map((project) => (
            <div key={project.id} className="mb-1">
              {/* Project Header */}
              <div
                className={cn(
                  "flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer group",
                  "hover:bg-sidebar-accent",
                  activeProject?.id === project.id && "bg-sidebar-accent"
                )}
                onClick={() => {
                  toggleProject(project.id);
                  onSelectProject(project.id);
                }}
              >
                {expandedProjects.has(project.id) ? (
                  <ChevronDown className="h-4 w-4 text-sidebar-foreground/60" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-sidebar-foreground/60" />
                )}
                <FolderOpen className="h-4 w-4 text-warning" />
                <span className="flex-1 text-sm text-sidebar-foreground truncate">
                  {project.name}
                </span>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setCreateFileForProject(project.id)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo arquivo
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onDeleteProject(project.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir projeto
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Files */}
              {expandedProjects.has(project.id) && (
                <div className="ml-4 mt-1">
                  {project.files.map((file) => (
                    <div
                      key={file.id}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer group",
                        "hover:bg-sidebar-accent",
                        activeFileId === file.id && "bg-sidebar-primary text-sidebar-primary-foreground"
                      )}
                      onClick={() => onSelectFile(file.id)}
                    >
                      {getFileIcon(file)}
                      <span className="flex-1 text-sm truncate">{file.name}</span>
                      
                      {project.files.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteFile(project.id, file.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Create File Dialog */}
      <Dialog 
        open={createFileForProject !== null} 
        onOpenChange={(open) => !open && setCreateFileForProject(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Arquivo</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <Input
              placeholder="nome_do_arquivo.gcforce"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFile()}
            />
            <Button onClick={handleCreateFile}>Criar Arquivo</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
