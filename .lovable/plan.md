

# GcodeForce Studio - Sistema de Partículas, Exportação HTML e Texturas

## Visão Geral

Implementação completa de três sistemas principais para tornar o GcodeForce Studio totalmente funcional:

1. **Sistema de Partículas** - Efeitos visuais de explosões, fogo e fumaça
2. **Exportação HTML Standalone** - Download de jogos jogáveis offline
3. **Suporte a Texturas e Materiais** - Customização visual avançada das entidades

---

## 1. Sistema de Partículas

### Arquitetura do Sistema

```
ParticleSystem
├── ParticleEmitter - Gerencia emissão de partículas
├── ParticlePool - Pool de partículas reutilizáveis
├── ParticlePresets - Configurações pré-definidas
└── ParticleRenderer - Renderização com Three.js Points/Sprites
```

### Tipos de Partículas

| Efeito | Uso | Propriedades |
|--------|-----|--------------|
| `explosion` | Colisões fortes | Velocidade alta, vida curta, cor laranja→vermelho |
| `fire` | Objetos em chamas | Direção ascendente, cor amarelo→vermelho |
| `smoke` | Rastro, destruição | Direção ascendente, cor cinza, fade out |
| `spark` | Colisões leves | Velocidade rápida, vida muito curta |
| `dust` | Impacto no chão | Expansão horizontal, cor marrom |
| `trail` | Movimento rápido | Segue objeto, fade rápido |

### Componentes a Criar

```tsx
// src/components/three/ParticleSystem.tsx
interface ParticleEmitter {
  position: [number, number, number];
  type: 'explosion' | 'fire' | 'smoke' | 'spark' | 'dust' | 'trail';
  count: number;
  lifetime: number;
  spread: number;
  velocity: [number, number, number];
  color: string;
  size: number;
  gravity: number;
}

// Usando Three.js Points para performance
<points>
  <bufferGeometry>
    <bufferAttribute attach="attributes-position" ... />
    <bufferAttribute attach="attributes-color" ... />
    <bufferAttribute attach="attributes-size" ... />
  </bufferGeometry>
  <pointsMaterial 
    vertexColors 
    transparent 
    sizeAttenuation 
    depthWrite={false}
  />
</points>
```

### Integração com Colisões

```tsx
// PhysicsSceneRenderer.tsx
const handleCollision = (entityId, otherId, velocity) => {
  const impactForce = Math.sqrt(velocity.x**2 + velocity.y**2 + velocity.z**2);
  
  if (impactForce > 5) {
    spawnParticles('explosion', collisionPoint, { count: 20 });
  } else if (impactForce > 2) {
    spawnParticles('spark', collisionPoint, { count: 10 });
  } else {
    spawnParticles('dust', collisionPoint, { count: 5 });
  }
};
```

### Sintaxe GcodeForce para Partículas

```gcodeforce
entidade Foguete {
  modelo primitivo("cone") cor(#FF4444)
  
  particulas tipo("fire") {
    posicao_relativa(0, -1, 0)
    direcao(0, -1, 0)
    velocidade(3)
    quantidade(20)
    vida(0.5)
    cor_inicio(#FFFF00)
    cor_fim(#FF0000)
  }
}
```

---

## 2. Exportação HTML Standalone

### Arquitetura

```
GameExporter
├── CodeBundler - Empacota código do jogo
├── AssetInliner - Inclui assets como base64
├── RuntimeGenerator - Gera runtime mínimo
└── HTMLBuilder - Monta HTML final
```

### Estrutura do HTML Exportado

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Meu Jogo - GcodeForce</title>
  <style>
    /* CSS mínimo inline */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { overflow: hidden; }
    #game-canvas { width: 100vw; height: 100vh; }
  </style>
</head>
<body>
  <div id="game-canvas"></div>
  
  <!-- Three.js + Rapier CDN ou inline -->
  <script src="https://unpkg.com/three@0.160.0/build/three.min.js"></script>
  <script src="https://unpkg.com/@dimforge/rapier3d-compat@0.11.2/rapier.js"></script>
  
  <!-- Runtime do GcodeForce (mínimo) -->
  <script>
    // Código do jogo compilado
    const GAME_DATA = { /* scene, entities, scripts */ };
    
    // Runtime simplificado
    class GcodeForceRuntime {
      constructor(container, gameData) { /* ... */ }
      init() { /* Setup Three.js + Rapier */ }
      start() { /* Game loop */ }
    }
    
    // Inicialização
    const game = new GcodeForceRuntime(
      document.getElementById('game-canvas'),
      GAME_DATA
    );
    game.init().then(() => game.start());
  </script>
</body>
</html>
```

### Componente de Exportação

```typescript
// src/lib/game-exporter.ts
export class GameExporter {
  private scene: Scene3D;
  private code: string;

  constructor(scene: Scene3D, sourceCode: string) {
    this.scene = scene;
    this.code = sourceCode;
  }

  export(): string {
    const gameData = this.serializeScene();
    const runtime = this.generateRuntime();
    const html = this.buildHTML(gameData, runtime);
    return html;
  }

  download(filename: string = 'game.html'): void {
    const html = this.export();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
  }
}
```

### Dialog de Exportação

```tsx
// src/components/studio/ExportDialog.tsx
export function ExportDialog({ scene, code, open, onOpenChange }) {
  const [exportOptions, setExportOptions] = useState({
    includePhysics: true,
    includeAudio: true,
    minify: true,
    embedAssets: true
  });

  const handleExport = () => {
    const exporter = new GameExporter(scene, code);
    exporter.setOptions(exportOptions);
    exporter.download(`${scene.name || 'game'}.html`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Options UI */}
      <Button onClick={handleExport}>
        <Download /> Baixar HTML
      </Button>
    </Dialog>
  );
}
```

---

## 3. Suporte a Texturas e Materiais

### Tipos de Materiais

| Material | Propriedades | Uso |
|----------|-------------|-----|
| `standard` | color, roughness, metalness | Padrão |
| `basic` | color, wireframe | Performance |
| `phong` | shininess, specular | Brilho |
| `physical` | clearcoat, transmission | Realismo |
| `toon` | gradientMap | Cartoon |

### Texturas Procedurais

Gerar texturas sem arquivos externos:

```typescript
// src/lib/procedural-textures.ts
export function generateCheckerTexture(
  color1: string, 
  color2: string, 
  size: number = 8
): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size * 2;
  const ctx = canvas.getContext('2d')!;
  
  for (let y = 0; y < 2; y++) {
    for (let x = 0; x < 2; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? color1 : color2;
      ctx.fillRect(x * size, y * size, size, size);
    }
  }
  
  const texture = new CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

export function generateNoiseTexture(
  baseColor: string,
  noiseIntensity: number = 0.2
): CanvasTexture { /* ... */ }

export function generateGradientTexture(
  colors: string[],
  direction: 'horizontal' | 'vertical' = 'vertical'
): CanvasTexture { /* ... */ }
```

### Sintaxe GcodeForce para Materiais

```gcodeforce
entidade Parede {
  modelo primitivo("cubo") tamanho(10, 5, 0.5)
  
  material tipo("standard") {
    cor(#8B4513)
    rugosidade(0.8)
    metalico(0.1)
    textura_padrao("checker", #8B4513, #A0522D)
    textura_repetir(4, 2)
  }
}

entidade EsferaMetal {
  modelo primitivo("esfera") raio(1)
  
  material tipo("physical") {
    cor(#C0C0C0)
    rugosidade(0.1)
    metalico(1.0)
    reflexo(0.9)
  }
}

entidade Cristal {
  modelo primitivo("cubo") tamanho(1, 2, 1)
  
  material tipo("physical") {
    cor(#87CEEB)
    transparencia(0.7)
    refracao(1.5)
  }
}
```

### Atualização do Interpreter

```typescript
// Entity3D atualizado
interface Entity3D {
  // ... existing fields
  material: {
    type: 'standard' | 'basic' | 'phong' | 'physical' | 'toon';
    color: string;
    roughness: number;
    metalness: number;
    opacity: number;
    transparent: boolean;
    texture?: {
      type: 'checker' | 'noise' | 'gradient' | 'url';
      params: any;
      repeat: [number, number];
    };
    emissive?: string;
    emissiveIntensity?: number;
  };
}
```

### Componente de Material Avançado

```tsx
// src/components/three/AdvancedMaterial.tsx
export function AdvancedMaterial({ material }: { material: MaterialConfig }) {
  const texture = useMemo(() => {
    if (!material.texture) return null;
    
    switch (material.texture.type) {
      case 'checker':
        return generateCheckerTexture(
          material.texture.params.color1,
          material.texture.params.color2
        );
      case 'noise':
        return generateNoiseTexture(material.color);
      case 'gradient':
        return generateGradientTexture(material.texture.params.colors);
      default:
        return null;
    }
  }, [material.texture]);

  switch (material.type) {
    case 'physical':
      return (
        <meshPhysicalMaterial
          color={material.color}
          roughness={material.roughness}
          metalness={material.metalness}
          transparent={material.transparent}
          opacity={material.opacity}
          map={texture}
        />
      );
    // ... outros tipos
  }
}
```

---

## 4. Correções e Melhorias Gerais

### Tratamento de WebGL Fallback

```tsx
// Fallback para dispositivos sem WebGL
function WebGLErrorBoundary({ children }) {
  const [hasWebGL, setHasWebGL] = useState(true);
  
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      setHasWebGL(!!gl);
    } catch {
      setHasWebGL(false);
    }
  }, []);
  
  if (!hasWebGL) {
    return (
      <div className="flex items-center justify-center h-full bg-muted">
        <p>WebGL não suportado. Tente outro navegador.</p>
      </div>
    );
  }
  
  return children;
}
```

### Atualização das Traduções

Adicionar novas chaves para:
- Sistema de partículas
- Dialog de exportação
- Configurações de material
- Mensagens de erro/sucesso

---

## 5. Arquivos a Criar/Modificar

### Novos Arquivos

```
src/
├── components/
│   ├── three/
│   │   ├── ParticleSystem.tsx      # Sistema de partículas
│   │   └── AdvancedMaterial.tsx    # Materiais customizados
│   └── studio/
│       └── ExportDialog.tsx        # Dialog de exportação
├── lib/
│   ├── game-exporter.ts            # Exportador HTML
│   ├── procedural-textures.ts      # Texturas procedurais
│   └── particle-presets.ts         # Presets de partículas
```

### Arquivos a Modificar

```
src/
├── components/
│   ├── three/
│   │   ├── PhysicsWorld.tsx        # Integrar materiais
│   │   └── PhysicsSceneRenderer.tsx # Integrar partículas
│   └── studio/
│       ├── Toolbar.tsx             # Botão exportar funcional
│       └── GcodeForceStudio.tsx    # Dialog de exportação
├── lib/
│   ├── gcodeforce-parser.ts        # Parse material/particulas
│   └── gcodeforce-interpreter.ts   # Interpretar novos nodes
└── i18n/
    └── locales/*.json              # Novas traduções
```

---

## 6. Fluxo de Implementação

```
┌──────────────────┐
│ 1. Partículas    │ → ParticleSystem, presets, integração colisões
└────────┬─────────┘
         ▼
┌──────────────────┐
│ 2. Texturas      │ → Procedural textures, parser, materiais avançados
└────────┬─────────┘
         ▼
┌──────────────────┐
│ 3. Exportação    │ → GameExporter, runtime, dialog
└────────┬─────────┘
         ▼
┌──────────────────┐
│ 4. Correções     │ → WebGL fallback, traduções, polish
└──────────────────┘
```

---

## 7. Resultado Final

O GcodeForce Studio terá:

- **Partículas**: Explosões, fogo, fumaça e efeitos visuais nas colisões
- **Exportação HTML**: Jogos baixáveis que funcionam offline em qualquer navegador
- **Materiais Avançados**: Texturas procedurais, metalness, roughness, transparência
- **WebGL Fallback**: Mensagem amigável em dispositivos incompatíveis
- **Interface Completa**: Todos os botões funcionais com traduções

