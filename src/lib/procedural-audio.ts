// Procedural Audio - Generate sounds using Web Audio API (no external files needed)

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

export type SoundType = 'collision' | 'jump' | 'pickup' | 'hit' | 'success' | 'error' | 'click';

interface SoundConfig {
  frequency: number;
  type: OscillatorType;
  duration: number;
  volume: number;
  decay?: number;
  frequencyEnd?: number;
}

const SOUND_PRESETS: Record<SoundType, SoundConfig> = {
  collision: {
    frequency: 150,
    type: 'triangle',
    duration: 0.1,
    volume: 0.3,
    decay: 0.1
  },
  jump: {
    frequency: 200,
    type: 'sine',
    duration: 0.15,
    volume: 0.2,
    frequencyEnd: 400
  },
  pickup: {
    frequency: 600,
    type: 'sine',
    duration: 0.1,
    volume: 0.2,
    frequencyEnd: 900
  },
  hit: {
    frequency: 100,
    type: 'sawtooth',
    duration: 0.15,
    volume: 0.3,
    decay: 0.1
  },
  success: {
    frequency: 440,
    type: 'sine',
    duration: 0.3,
    volume: 0.2,
    frequencyEnd: 880
  },
  error: {
    frequency: 200,
    type: 'square',
    duration: 0.2,
    volume: 0.2,
    frequencyEnd: 100
  },
  click: {
    frequency: 800,
    type: 'sine',
    duration: 0.05,
    volume: 0.1
  }
};

/**
 * Play a procedural sound by type
 */
export function playProceduralSound(soundType: SoundType, volumeMultiplier: number = 1): void {
  const config = SOUND_PRESETS[soundType];
  if (!config) return;

  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = config.type;
    oscillator.frequency.setValueAtTime(config.frequency, ctx.currentTime);

    if (config.frequencyEnd) {
      oscillator.frequency.exponentialRampToValueAtTime(
        config.frequencyEnd,
        ctx.currentTime + config.duration
      );
    }

    const volume = config.volume * volumeMultiplier;
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      ctx.currentTime + config.duration
    );

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + config.duration);
  } catch (e) {
    console.warn('Failed to play procedural sound:', e);
  }
}

/**
 * Play a custom collision beep
 */
export function playCollisionBeep(frequency: number = 150, duration: number = 0.1, volume: number = 0.3): void {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'triangle';

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn('Failed to play collision beep:', e);
  }
}

/**
 * Play a melodic sequence (for success/failure)
 */
export function playMelody(notes: number[], noteDuration: number = 0.1, volume: number = 0.2): void {
  try {
    const ctx = getAudioContext();
    let time = ctx.currentTime;

    notes.forEach((freq) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = freq;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(volume, time);
      gainNode.gain.exponentialRampToValueAtTime(0.01, time + noteDuration);

      oscillator.start(time);
      oscillator.stop(time + noteDuration);

      time += noteDuration;
    });
  } catch (e) {
    console.warn('Failed to play melody:', e);
  }
}

/**
 * Resume audio context (required after user interaction)
 */
export async function resumeAudioContext(): Promise<void> {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
}
