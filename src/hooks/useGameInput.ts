import { useState, useEffect, useCallback, useRef } from 'react';

export interface InputState {
  keys: Record<string, boolean>;
  mouse: {
    x: number;
    y: number;
    buttons: Record<number, boolean>;
  };
}

export interface GameInputConfig {
  enabled: boolean;
}

export function useGameInput(config: GameInputConfig = { enabled: true }) {
  const [inputState, setInputState] = useState<InputState>({
    keys: {},
    mouse: { x: 0, y: 0, buttons: {} }
  });

  const keysRef = useRef<Record<string, boolean>>({});
  const mouseRef = useRef({ x: 0, y: 0, buttons: {} as Record<number, boolean> });

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!config.enabled) return;
    
    keysRef.current[e.key.toLowerCase()] = true;
    keysRef.current[e.code] = true;
    
    setInputState(prev => ({
      ...prev,
      keys: { ...keysRef.current }
    }));
  }, [config.enabled]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (!config.enabled) return;
    
    keysRef.current[e.key.toLowerCase()] = false;
    keysRef.current[e.code] = false;
    
    setInputState(prev => ({
      ...prev,
      keys: { ...keysRef.current }
    }));
  }, [config.enabled]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!config.enabled) return;
    
    mouseRef.current.x = e.clientX;
    mouseRef.current.y = e.clientY;
    
    setInputState(prev => ({
      ...prev,
      mouse: { ...mouseRef.current }
    }));
  }, [config.enabled]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (!config.enabled) return;
    
    mouseRef.current.buttons[e.button] = true;
    
    setInputState(prev => ({
      ...prev,
      mouse: { ...mouseRef.current }
    }));
  }, [config.enabled]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!config.enabled) return;
    
    mouseRef.current.buttons[e.button] = false;
    
    setInputState(prev => ({
      ...prev,
      mouse: { ...mouseRef.current }
    }));
  }, [config.enabled]);

  useEffect(() => {
    if (!config.enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [config.enabled, handleKeyDown, handleKeyUp, handleMouseMove, handleMouseDown, handleMouseUp]);

  const isKeyPressed = useCallback((key: string): boolean => {
    return keysRef.current[key.toLowerCase()] || keysRef.current[key] || false;
  }, []);

  const getMovementVector = useCallback((keys: string = 'WASD'): { x: number; z: number } => {
    let x = 0;
    let z = 0;

    const keyMap = keys.toUpperCase();
    
    // WASD or Arrow keys
    if (keyMap === 'WASD' || keyMap === 'ARROWS') {
      if (isKeyPressed('w') || isKeyPressed('ArrowUp')) z -= 1;
      if (isKeyPressed('s') || isKeyPressed('ArrowDown')) z += 1;
      if (isKeyPressed('a') || isKeyPressed('ArrowLeft')) x -= 1;
      if (isKeyPressed('d') || isKeyPressed('ArrowRight')) x += 1;
    } else {
      // Custom key mapping (e.g., "WASD")
      if (keyMap.length >= 4) {
        if (isKeyPressed(keyMap[0])) z -= 1; // Forward
        if (isKeyPressed(keyMap[2])) z += 1; // Backward
        if (isKeyPressed(keyMap[1])) x -= 1; // Left
        if (isKeyPressed(keyMap[3])) x += 1; // Right
      }
    }

    // Normalize diagonal movement
    const length = Math.sqrt(x * x + z * z);
    if (length > 0) {
      x /= length;
      z /= length;
    }

    return { x, z };
  }, [isKeyPressed]);

  const isJumpPressed = useCallback((): boolean => {
    return isKeyPressed(' ') || isKeyPressed('Space');
  }, [isKeyPressed]);

  const resetInput = useCallback(() => {
    keysRef.current = {};
    mouseRef.current = { x: 0, y: 0, buttons: {} };
    setInputState({
      keys: {},
      mouse: { x: 0, y: 0, buttons: {} }
    });
  }, []);

  return {
    inputState,
    isKeyPressed,
    getMovementVector,
    isJumpPressed,
    resetInput
  };
}
