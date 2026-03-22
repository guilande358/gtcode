// GcodeForce Interpreter - Converts AST to 3D scene data

import { Parser, ProjectNode, SceneNode, EntityNode, LightNode, CameraNode, ScriptNode } from './gcodeforce-parser';
import { MaterialConfig, DEFAULT_MATERIAL } from '@/components/three/AdvancedMaterial';

export interface Scene3D {
  name: string;
  camera: Camera3D;
  lights: Light3D[];
  entities: Entity3D[];
}

export interface Camera3D {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
}

export interface Light3D {
  type: 'ambient' | 'directional' | 'point' | 'spot';
  color: string;
  intensity: number;
  position?: [number, number, number];
}

export interface ScriptEvent {
  type: 'onInit' | 'onFrame' | 'onCollide';
  target?: string;
  body: string;
}

export interface Entity3D {
  id: string;
  name: string;
  primitive: 'box' | 'sphere' | 'cylinder' | 'cone' | 'plane' | 'torus';
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  material: MaterialConfig;
  physics: {
    active: boolean;
    mass: number;
    gravity: boolean;
    isStatic: boolean;
  };
  control: {
    enabled: boolean;
    input: string;
    keys: string;
    speed: number;
  };
  scripts: ScriptEvent[];
}

export interface InterpreterResult {
  scene: Scene3D | null;
  errors: string[];
  logs: string[];
}

export class Interpreter {
  private logs: string[] = [];
  private errors: string[] = [];
  private entityCounter: number = 0;

  interpret(source: string): InterpreterResult {
    this.logs = [];
    this.errors = [];
    this.entityCounter = 0;

    const parser = new Parser();
    const { ast, errors: parseErrors } = parser.parse(source);

    if (parseErrors.length > 0) {
      this.errors = parseErrors.map(e => `Line ${e.line}: ${e.message}`);
    }

    if (!ast || ast.scenes.length === 0) {
      return {
        scene: this.createDefaultScene(),
        errors: this.errors,
        logs: this.logs
      };
    }

    this.logs.push(`Project: ${ast.name} v${ast.version}`);
    const scene = this.interpretScene(ast.scenes[0]);

    return { scene, errors: this.errors, logs: this.logs };
  }

  private createDefaultScene(): Scene3D {
    return {
      name: 'Default',
      camera: { position: [0, 5, 10], lookAt: [0, 0, 0], fov: 75 },
      lights: [
        { type: 'ambient', color: '#404040', intensity: 0.4 },
        { type: 'directional', color: '#ffffff', intensity: 1, position: [5, 10, 5] }
      ],
      entities: []
    };
  }

  private interpretScene(sceneNode: SceneNode): Scene3D {
    const scene: Scene3D = {
      name: sceneNode.name,
      camera: this.interpretCamera(sceneNode.camera),
      lights: this.interpretLights(sceneNode.lights),
      entities: []
    };

    this.logs.push(`Scene: ${sceneNode.name}`);

    for (const entityNode of sceneNode.entities) {
      const entity = this.interpretEntity(entityNode);
      if (entity) {
        scene.entities.push(entity);
        this.logs.push(`  Entity: ${entity.name} (${entity.primitive})`);
      }
    }

    return scene;
  }

  private interpretCamera(cameraNode?: CameraNode): Camera3D {
    return {
      position: cameraNode?.position || [0, 5, 10],
      lookAt: [0, 0, 0],
      fov: 75
    };
  }

  private interpretLights(lightNodes: LightNode[]): Light3D[] {
    const lights: Light3D[] = [
      { type: 'ambient', color: '#404040', intensity: 0.4 }
    ];

    if (lightNodes.length === 0) {
      lights.push({ type: 'directional', color: '#ffffff', intensity: 1, position: [5, 10, 5] });
    }

    for (const lightNode of lightNodes) {
      lights.push({
        type: this.mapLightType(lightNode.lightType),
        color: lightNode.color || '#ffffff',
        intensity: lightNode.intensity || 1,
        position: lightNode.position
      });
    }

    return lights;
  }

  private mapLightType(type: string): Light3D['type'] {
    const typeMap: Record<string, Light3D['type']> = {
      'ambiente': 'ambient', 'ambient': 'ambient',
      'direcional': 'directional', 'directional': 'directional',
      'ponto': 'point', 'point': 'point',
      'spot': 'spot', 'holofote': 'spot'
    };
    return typeMap[type.toLowerCase()] || 'directional';
  }

  private interpretEntity(entityNode: EntityNode): Entity3D | null {
    this.entityCounter++;

    const model = entityNode.model;
    const physics = entityNode.physics;
    const control = entityNode.control;
    const color = model?.color || '#888888';

    // Build material config from entity data
    const material: MaterialConfig = {
      ...DEFAULT_MATERIAL,
      color,
      roughness: entityNode.materialData?.roughness ?? 0.5,
      metalness: entityNode.materialData?.metalness ?? 0,
      opacity: entityNode.materialData?.opacity ?? 1,
      transparent: (entityNode.materialData?.opacity ?? 1) < 1,
      type: (entityNode.materialData?.type as MaterialConfig['type']) || 'standard',
      wireframe: entityNode.materialData?.wireframe ?? false,
      texture: entityNode.materialData?.texture as MaterialConfig['texture'],
    };

    return {
      id: `entity_${this.entityCounter}`,
      name: entityNode.name,
      primitive: this.mapPrimitive(model?.primitive || 'cubo'),
      position: model?.position || [0, 0, 0],
      rotation: model?.rotation || [0, 0, 0],
      scale: this.calculateScale(model),
      color,
      material,
      physics: {
        active: physics?.active ?? false,
        mass: physics?.mass ?? 1,
        gravity: physics?.gravity ?? false,
        isStatic: physics?.static ?? false
      },
      control: {
        enabled: !!control,
        input: control?.input || 'teclado',
        keys: control?.keys || 'WASD',
        speed: control?.speed || 5
      },
      scripts: this.interpretScripts(entityNode.scripts)
    };
  }

  private interpretScripts(scriptNodes?: ScriptNode[]): ScriptEvent[] {
    if (!scriptNodes) return [];
    return scriptNodes.map(script => ({
      type: this.mapEventType(script.event),
      target: script.target,
      body: script.body
    }));
  }

  private mapEventType(event: string): 'onInit' | 'onFrame' | 'onCollide' {
    const eventMap: Record<string, 'onInit' | 'onFrame' | 'onCollide'> = {
      'ao_iniciar': 'onInit', 'onInit': 'onInit',
      'a_cada_frame': 'onFrame', 'onFrame': 'onFrame',
      'ao_colidir': 'onCollide', 'onCollide': 'onCollide'
    };
    return eventMap[event] || 'onInit';
  }

  private mapPrimitive(primitive: string): Entity3D['primitive'] {
    const primitiveMap: Record<string, Entity3D['primitive']> = {
      'cubo': 'box', 'box': 'box',
      'esfera': 'sphere', 'sphere': 'sphere',
      'cilindro': 'cylinder', 'cylinder': 'cylinder',
      'cone': 'cone',
      'plano': 'plane', 'plane': 'plane',
      'torus': 'torus', 'rosca': 'torus'
    };
    return primitiveMap[primitive.toLowerCase()] || 'box';
  }

  private calculateScale(model?: { size?: [number, number, number]; radius?: number; height?: number }): [number, number, number] {
    if (model?.size) return model.size;
    if (model?.radius) {
      const r = model.radius;
      return [r, model.height || r, r];
    }
    return [1, 1, 1];
  }
}

export function interpretGcodeForce(source: string): InterpreterResult {
  const interpreter = new Interpreter();
  return interpreter.interpret(source);
}
