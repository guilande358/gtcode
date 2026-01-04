// Audio Manager - Handles sound effects and background music using Howler.js

import { Howl, Howler } from 'howler';

export interface AudioConfig {
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
}

class AudioManager {
  private sounds: Map<string, Howl> = new Map();
  private music: Howl | null = null;
  private currentMusicId: string | null = null;
  private config: AudioConfig = {
    musicVolume: 0.5,
    sfxVolume: 1.0,
    muted: false
  };

  constructor() {
    // Load config from localStorage
    const saved = localStorage.getItem('gcodeforce-audio');
    if (saved) {
      try {
        this.config = { ...this.config, ...JSON.parse(saved) };
      } catch (e) {
        console.warn('Failed to load audio config');
      }
    }
  }

  private saveConfig(): void {
    localStorage.setItem('gcodeforce-audio', JSON.stringify(this.config));
  }

  /**
   * Load a sound effect from URL or base64
   */
  loadSound(id: string, src: string, options?: { loop?: boolean; volume?: number }): void {
    if (this.sounds.has(id)) {
      this.sounds.get(id)?.unload();
    }

    const sound = new Howl({
      src: [src],
      loop: options?.loop ?? false,
      volume: (options?.volume ?? 1.0) * this.config.sfxVolume,
      preload: true
    });

    this.sounds.set(id, sound);
  }

  /**
   * Play a loaded sound effect
   */
  playSound(id: string): number | undefined {
    const sound = this.sounds.get(id);
    if (sound && !this.config.muted) {
      sound.volume(this.config.sfxVolume);
      return sound.play();
    }
    return undefined;
  }

  /**
   * Stop a sound effect
   */
  stopSound(id: string): void {
    const sound = this.sounds.get(id);
    if (sound) {
      sound.stop();
    }
  }

  /**
   * Play background music
   */
  playMusic(src: string, options?: { loop?: boolean; volume?: number }): void {
    // Stop current music
    if (this.music) {
      this.music.stop();
      this.music.unload();
    }

    this.music = new Howl({
      src: [src],
      loop: options?.loop ?? true,
      volume: (options?.volume ?? 1.0) * this.config.musicVolume,
      preload: true
    });

    if (!this.config.muted) {
      this.music.play();
    }

    this.currentMusicId = src;
  }

  /**
   * Stop background music
   */
  stopMusic(): void {
    if (this.music) {
      this.music.stop();
      this.currentMusicId = null;
    }
  }

  /**
   * Pause background music
   */
  pauseMusic(): void {
    if (this.music) {
      this.music.pause();
    }
  }

  /**
   * Resume background music
   */
  resumeMusic(): void {
    if (this.music && !this.config.muted) {
      this.music.play();
    }
  }

  /**
   * Set music volume (0-1)
   */
  setMusicVolume(volume: number): void {
    this.config.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.music) {
      this.music.volume(this.config.musicVolume);
    }
    this.saveConfig();
  }

  /**
   * Set SFX volume (0-1)
   */
  setSfxVolume(volume: number): void {
    this.config.sfxVolume = Math.max(0, Math.min(1, volume));
    this.saveConfig();
  }

  /**
   * Toggle or set mute state
   */
  setMuted(muted: boolean): void {
    this.config.muted = muted;
    Howler.mute(muted);
    this.saveConfig();
  }

  /**
   * Get current audio config
   */
  getConfig(): AudioConfig {
    return { ...this.config };
  }

  /**
   * Unload all sounds
   */
  cleanup(): void {
    this.sounds.forEach(sound => sound.unload());
    this.sounds.clear();
    
    if (this.music) {
      this.music.unload();
      this.music = null;
    }
  }
}

// Singleton instance
export const audioManager = new AudioManager();
