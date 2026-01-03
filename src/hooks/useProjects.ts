import { useState, useEffect, useCallback } from 'react';
import { defaultCode } from '@/lib/gcodeforce-language';

export interface ProjectFile {
  id: string;
  name: string;
  content: string;
  type: 'gcodeforce' | 'asset' | 'config';
}

export interface Project {
  id: string;
  name: string;
  files: ProjectFile[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'gcodeforce-projects';
const ACTIVE_PROJECT_KEY = 'gcodeforce-active-project';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function createDefaultProject(): Project {
  return {
    id: generateId(),
    name: 'Meu Primeiro Jogo',
    files: [
      {
        id: generateId(),
        name: 'principal.gcforce',
        content: defaultCode,
        type: 'gcodeforce',
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);

  // Load projects from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedActiveId = localStorage.getItem(ACTIVE_PROJECT_KEY);
    
    if (saved) {
      const parsed = JSON.parse(saved) as Project[];
      setProjects(parsed);
      
      if (savedActiveId && parsed.find(p => p.id === savedActiveId)) {
        setActiveProjectId(savedActiveId);
        const project = parsed.find(p => p.id === savedActiveId);
        if (project && project.files.length > 0) {
          setActiveFileId(project.files[0].id);
        }
      } else if (parsed.length > 0) {
        setActiveProjectId(parsed[0].id);
        if (parsed[0].files.length > 0) {
          setActiveFileId(parsed[0].files[0].id);
        }
      }
    } else {
      // Create default project
      const defaultProject = createDefaultProject();
      setProjects([defaultProject]);
      setActiveProjectId(defaultProject.id);
      setActiveFileId(defaultProject.files[0].id);
    }
  }, []);

  // Save projects to localStorage
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    }
  }, [projects]);

  // Save active project id
  useEffect(() => {
    if (activeProjectId) {
      localStorage.setItem(ACTIVE_PROJECT_KEY, activeProjectId);
    }
  }, [activeProjectId]);

  const activeProject = projects.find(p => p.id === activeProjectId) || null;
  const activeFile = activeProject?.files.find(f => f.id === activeFileId) || null;

  const createProject = useCallback((name: string) => {
    const newProject: Project = {
      id: generateId(),
      name,
      files: [
        {
          id: generateId(),
          name: 'principal.gcforce',
          content: defaultCode,
          type: 'gcodeforce',
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProject.id);
    setActiveFileId(newProject.files[0].id);
    
    return newProject;
  }, []);

  const deleteProject = useCallback((projectId: string) => {
    setProjects(prev => {
      const filtered = prev.filter(p => p.id !== projectId);
      if (activeProjectId === projectId && filtered.length > 0) {
        setActiveProjectId(filtered[0].id);
        setActiveFileId(filtered[0].files[0]?.id || null);
      }
      return filtered;
    });
  }, [activeProjectId]);

  const createFile = useCallback((projectId: string, name: string, type: ProjectFile['type'] = 'gcodeforce') => {
    const newFile: ProjectFile = {
      id: generateId(),
      name: name.endsWith('.gcforce') ? name : `${name}.gcforce`,
      content: '// Novo arquivo GcodeForce\n',
      type,
    };

    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          files: [...p.files, newFile],
          updatedAt: Date.now(),
        };
      }
      return p;
    }));

    setActiveFileId(newFile.id);
    return newFile;
  }, []);

  const deleteFile = useCallback((projectId: string, fileId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const filtered = p.files.filter(f => f.id !== fileId);
        if (activeFileId === fileId && filtered.length > 0) {
          setActiveFileId(filtered[0].id);
        }
        return {
          ...p,
          files: filtered,
          updatedAt: Date.now(),
        };
      }
      return p;
    }));
  }, [activeFileId]);

  const updateFileContent = useCallback((projectId: string, fileId: string, content: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          files: p.files.map(f => f.id === fileId ? { ...f, content } : f),
          updatedAt: Date.now(),
        };
      }
      return p;
    }));
  }, []);

  const renameFile = useCallback((projectId: string, fileId: string, newName: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          files: p.files.map(f => f.id === fileId ? { ...f, name: newName } : f),
          updatedAt: Date.now(),
        };
      }
      return p;
    }));
  }, []);

  const renameProject = useCallback((projectId: string, newName: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return { ...p, name: newName, updatedAt: Date.now() };
      }
      return p;
    }));
  }, []);

  return {
    projects,
    activeProject,
    activeFile,
    activeProjectId,
    activeFileId,
    setActiveProjectId,
    setActiveFileId,
    createProject,
    deleteProject,
    createFile,
    deleteFile,
    updateFileContent,
    renameFile,
    renameProject,
  };
}
