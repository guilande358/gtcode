import { useRef, useCallback, useEffect } from 'react';

export interface GameLoopCallbacks {
  onUpdate: (deltaTime: number, elapsedTime: number) => void;
  onFixedUpdate?: (fixedDeltaTime: number) => void;
}

export function useGameLoop(callbacks: GameLoopCallbacks, isRunning: boolean) {
  const frameIdRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const elapsedTimeRef = useRef<number>(0);
  const accumulatorRef = useRef<number>(0);
  
  const FIXED_DELTA_TIME = 1 / 60; // 60 FPS physics

  const loop = useCallback((currentTime: number) => {
    if (!isRunning) return;

    const deltaTime = Math.min((currentTime - lastTimeRef.current) / 1000, 0.1); // Cap at 100ms
    lastTimeRef.current = currentTime;
    elapsedTimeRef.current += deltaTime;

    // Fixed update for physics (if provided)
    if (callbacks.onFixedUpdate) {
      accumulatorRef.current += deltaTime;
      while (accumulatorRef.current >= FIXED_DELTA_TIME) {
        callbacks.onFixedUpdate(FIXED_DELTA_TIME);
        accumulatorRef.current -= FIXED_DELTA_TIME;
      }
    }

    // Variable update for rendering
    callbacks.onUpdate(deltaTime, elapsedTimeRef.current);

    frameIdRef.current = requestAnimationFrame(loop);
  }, [isRunning, callbacks]);

  const start = useCallback(() => {
    if (frameIdRef.current) return;
    
    lastTimeRef.current = performance.now();
    elapsedTimeRef.current = 0;
    accumulatorRef.current = 0;
    frameIdRef.current = requestAnimationFrame(loop);
  }, [loop]);

  const stop = useCallback(() => {
    if (frameIdRef.current) {
      cancelAnimationFrame(frameIdRef.current);
      frameIdRef.current = 0;
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    elapsedTimeRef.current = 0;
    accumulatorRef.current = 0;
  }, [stop]);

  useEffect(() => {
    if (isRunning) {
      start();
    } else {
      stop();
    }

    return () => stop();
  }, [isRunning, start, stop]);

  return {
    start,
    stop,
    reset,
    getElapsedTime: () => elapsedTimeRef.current
  };
}
