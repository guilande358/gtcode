export interface ParticlePreset {
  count: number;
  lifetime: number;
  speed: number;
  spread: number;
  gravity: number;
  sizeStart: number;
  sizeEnd: number;
  colorStart: string;
  colorEnd: string;
  fadeOut: boolean;
}

export const PARTICLE_PRESETS: Record<string, ParticlePreset> = {
  explosion: {
    count: 30,
    lifetime: 0.6,
    speed: 8,
    spread: 1,
    gravity: -2,
    sizeStart: 0.3,
    sizeEnd: 0.05,
    colorStart: '#FFA500',
    colorEnd: '#FF0000',
    fadeOut: true,
  },
  fire: {
    count: 15,
    lifetime: 0.8,
    speed: 3,
    spread: 0.3,
    gravity: 2,
    sizeStart: 0.2,
    sizeEnd: 0.05,
    colorStart: '#FFFF00',
    colorEnd: '#FF4400',
    fadeOut: true,
  },
  smoke: {
    count: 10,
    lifetime: 1.5,
    speed: 1.5,
    spread: 0.5,
    gravity: 1,
    sizeStart: 0.15,
    sizeEnd: 0.4,
    colorStart: '#888888',
    colorEnd: '#333333',
    fadeOut: true,
  },
  spark: {
    count: 20,
    lifetime: 0.3,
    speed: 12,
    spread: 1,
    gravity: -5,
    sizeStart: 0.1,
    sizeEnd: 0.02,
    colorStart: '#FFFFFF',
    colorEnd: '#FFAA00',
    fadeOut: true,
  },
  dust: {
    count: 8,
    lifetime: 0.5,
    speed: 2,
    spread: 1,
    gravity: -0.5,
    sizeStart: 0.1,
    sizeEnd: 0.2,
    colorStart: '#AA8866',
    colorEnd: '#665544',
    fadeOut: true,
  },
  trail: {
    count: 5,
    lifetime: 0.4,
    speed: 0.5,
    spread: 0.1,
    gravity: 0,
    sizeStart: 0.15,
    sizeEnd: 0.02,
    colorStart: '#44AAFF',
    colorEnd: '#0044FF',
    fadeOut: true,
  },
};
