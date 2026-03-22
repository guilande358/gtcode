import { useState, useCallback } from 'react';

export interface DebugSession {
  id: string;
  date: string;
  connectionType: 'usb' | 'wireless';
  ip?: string;
  flags: string;
  preset: string;
  status: 'success' | 'fail' | 'running';
}

const STORAGE_KEY = 'gcodeforce-debug-sessions';
const MAX_SESSIONS = 20;

function loadSessions(): DebugSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: DebugSession[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, MAX_SESSIONS)));
}

export function useDebugSessions() {
  const [sessions, setSessions] = useState<DebugSession[]>(loadSessions);

  const addSession = useCallback((session: Omit<DebugSession, 'id' | 'date'>) => {
    const newSession: DebugSession = {
      ...session,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
    };
    setSessions(prev => {
      const updated = [newSession, ...prev].slice(0, MAX_SESSIONS);
      saveSessions(updated);
      return updated;
    });
    return newSession.id;
  }, []);

  const updateSessionStatus = useCallback((id: string, status: DebugSession['status']) => {
    setSessions(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, status } : s);
      saveSessions(updated);
      return updated;
    });
  }, []);

  const clearSessions = useCallback(() => {
    setSessions([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { sessions, addSession, updateSessionStatus, clearSessions };
}
