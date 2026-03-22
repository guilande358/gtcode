import * as THREE from 'three';

export function generateCheckerTexture(
  color1: string = '#FFFFFF',
  color2: string = '#000000',
  size: number = 64
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size * 2;
  const ctx = canvas.getContext('2d')!;

  for (let y = 0; y < 2; y++) {
    for (let x = 0; x < 2; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? color1 : color2;
      ctx.fillRect(x * size, y * size, size, size);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.magFilter = THREE.NearestFilter;
  return texture;
}

export function generateNoiseTexture(
  baseColor: string = '#888888',
  intensity: number = 0.2,
  resolution: number = 128
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = resolution;
  const ctx = canvas.getContext('2d')!;

  const base = new THREE.Color(baseColor);
  const imageData = ctx.createImageData(resolution, resolution);

  for (let i = 0; i < imageData.data.length; i += 4) {
    const noise = (Math.random() - 0.5) * intensity;
    imageData.data[i] = Math.max(0, Math.min(255, (base.r + noise) * 255));
    imageData.data[i + 1] = Math.max(0, Math.min(255, (base.g + noise) * 255));
    imageData.data[i + 2] = Math.max(0, Math.min(255, (base.b + noise) * 255));
    imageData.data[i + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function generateGradientTexture(
  colors: string[] = ['#FF0000', '#0000FF'],
  direction: 'horizontal' | 'vertical' = 'vertical',
  resolution: number = 256
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = resolution;
  const ctx = canvas.getContext('2d')!;

  const gradient = direction === 'vertical'
    ? ctx.createLinearGradient(0, 0, 0, resolution)
    : ctx.createLinearGradient(0, 0, resolution, 0);

  colors.forEach((color, i) => {
    gradient.addColorStop(i / (colors.length - 1), color);
  });

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, resolution, resolution);

  return new THREE.CanvasTexture(canvas);
}

export function generateBrickTexture(
  mortarColor: string = '#999999',
  brickColor: string = '#AA4444',
  resolution: number = 256
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = resolution;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = mortarColor;
  ctx.fillRect(0, 0, resolution, resolution);

  const brickW = resolution / 4;
  const brickH = resolution / 8;
  const gap = 2;

  ctx.fillStyle = brickColor;
  for (let row = 0; row < 8; row++) {
    const offset = row % 2 === 0 ? 0 : brickW / 2;
    for (let col = -1; col < 5; col++) {
      const x = col * brickW + offset;
      const y = row * brickH;
      const noise = (Math.random() - 0.5) * 20;
      const c = new THREE.Color(brickColor);
      c.r = Math.max(0, Math.min(1, c.r + noise / 255));
      c.g = Math.max(0, Math.min(1, c.g + noise / 255));
      c.b = Math.max(0, Math.min(1, c.b + noise / 255));
      ctx.fillStyle = `#${c.getHexString()}`;
      ctx.fillRect(x + gap, y + gap, brickW - gap * 2, brickH - gap * 2);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}
