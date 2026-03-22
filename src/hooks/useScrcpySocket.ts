import { useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export interface LogEntry {
  type: 'stdout' | 'stderr' | 'info' | 'command';
  text: string;
  timestamp: Date;
}

export function useScrcpySocket() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const addLog = useCallback((type: LogEntry['type'], text: string) => {
    setLogs(prev => [...prev, { type, text, timestamp: new Date() }]);
  }, []);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const url = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    const socket = io(url, { transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      setIsConnected(true);
      addLog('info', `Connected to server: ${url}`);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setIsRunning(false);
      addLog('info', 'Disconnected from server');
    });

    socket.on('output', (data: { type: 'stdout' | 'stderr'; text: string }) => {
      addLog(data.type, data.text);
    });

    socket.on('command-end', (data: { code: number }) => {
      setIsRunning(false);
      addLog('info', `Process exited with code ${data.code}`);
    });

    socket.on('clear-terminal', () => {
      setLogs([]);
    });

    socket.on('connect_error', (err) => {
      addLog('stderr', `Connection error: ${err.message}`);
    });

    socketRef.current = socket;
  }, [addLog]);

  const sendCommand = useCallback((command: string) => {
    if (!socketRef.current?.connected) {
      addLog('stderr', 'Not connected to server. Connect first.');
      return;
    }
    addLog('command', `$ ${command}`);
    setIsRunning(true);
    socketRef.current.emit('execute', { command });
  }, [addLog]);

  const interrupt = useCallback(() => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('interrupt');
    addLog('info', 'Sent interrupt signal (Ctrl+C)');
    setIsRunning(false);
  }, [addLog]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setIsConnected(false);
    setIsRunning(false);
  }, []);

  return { logs, isConnected, isRunning, connect, sendCommand, interrupt, clearLogs, disconnect };
}
