// GcodeForce Parser - Converts tokens to AST

import { Token, Lexer } from './gcodeforce-lexer';

export interface ASTNode {
  type: string;
  [key: string]: unknown;
}

export interface ProjectNode extends ASTNode {
  type: 'Project';
  name: string;
  version: string;
  scenes: SceneNode[];
}

export interface SceneNode extends ASTNode {
  type: 'Scene';
  name: string;
  camera?: CameraNode;
  lights: LightNode[];
  entities: EntityNode[];
}

export interface CameraNode extends ASTNode {
  type: 'Camera';
  position: [number, number, number];
}

export interface LightNode extends ASTNode {
  type: 'Light';
  lightType: string;
  color: string;
  position?: [number, number, number];
  intensity?: number;
}

export interface MaterialData {
  type?: string;
  roughness?: number;
  metalness?: number;
  opacity?: number;
  wireframe?: boolean;
  texture?: {
    type: string;
    params?: Record<string, any>;
    repeat?: [number, number];
  };
}

export interface EntityNode extends ASTNode {
  type: 'Entity';
  name: string;
  model?: ModelNode;
  physics?: PhysicsNode;
  control?: ControlNode;
  scripts?: ScriptNode[];
  materialData?: MaterialData;
}

export interface ModelNode extends ASTNode {
  type: 'Model';
  primitive: string;
  size?: [number, number, number];
  radius?: number;
  height?: number;
  color: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

export interface PhysicsNode extends ASTNode {
  type: 'Physics';
  active: boolean;
  mass: number;
  gravity: boolean;
  static: boolean;
}

export interface ControlNode extends ASTNode {
  type: 'Control';
  input: string;
  keys: string;
  speed: number;
}

export interface ScriptNode extends ASTNode {
  type: 'Script';
  event: string;
  target?: string;
  body: string;
}

export interface ParseError {
  message: string;
  line: number;
  column: number;
}

export class Parser {
  private tokens: Token[] = [];
  private pos: number = 0;
  private errors: ParseError[] = [];

  parse(source: string): { ast: ProjectNode | null; errors: ParseError[] } {
    const lexer = new Lexer(source);
    this.tokens = lexer.tokenize();
    this.pos = 0;
    this.errors = [];

    try {
      const ast = this.parseProject();
      return { ast, errors: this.errors };
    } catch (e) {
      return { ast: null, errors: this.errors };
    }
  }

  private parseProject(): ProjectNode {
    const project: ProjectNode = {
      type: 'Project',
      name: 'Unnamed',
      version: '1.0',
      scenes: []
    };

    while (!this.isEnd()) {
      this.skipNewlines();
      
      if (this.check('KEYWORD', 'projeto') || this.check('KEYWORD', 'project')) {
        this.advance();
        if (this.check('STRING')) {
          project.name = this.advance().value.replace(/"/g, '');
        }
        if (this.check('KEYWORD', 'versao') || this.check('KEYWORD', 'version')) {
          this.advance();
          if (this.check('STRING')) {
            project.version = this.advance().value.replace(/"/g, '');
          }
        }
      } else if (this.check('KEYWORD', 'cena') || this.check('KEYWORD', 'scene')) {
        const scene = this.parseScene();
        if (scene) project.scenes.push(scene);
      } else {
        this.advance();
      }
    }

    return project;
  }

  private parseScene(): SceneNode | null {
    if (!this.consume('KEYWORD', 'cena') && !this.consume('KEYWORD', 'scene')) return null;

    const scene: SceneNode = { type: 'Scene', name: 'Main', lights: [], entities: [] };

    if (this.check('IDENTIFIER')) scene.name = this.advance().value;
    if (!this.consume('PUNCTUATION', '{')) { this.error('Expected "{"'); return scene; }

    while (!this.isEnd() && !this.check('PUNCTUATION', '}')) {
      this.skipNewlines();
      if (this.check('KEYWORD', 'camera')) {
        scene.camera = this.parseCamera();
      } else if (this.check('KEYWORD', 'luz') || this.check('KEYWORD', 'light')) {
        const light = this.parseLight();
        if (light) scene.lights.push(light);
      } else if (this.check('KEYWORD', 'entidade') || this.check('KEYWORD', 'entity')) {
        const entity = this.parseEntity();
        if (entity) scene.entities.push(entity);
      } else if (this.check('PUNCTUATION', '}')) {
        break;
      } else {
        this.advance();
      }
    }

    this.consume('PUNCTUATION', '}');
    return scene;
  }

  private parseCamera(): CameraNode {
    const camera: CameraNode = { type: 'Camera', position: [0, 5, 10] };
    this.advance();

    while (!this.isEnd() && !this.check('NEWLINE') && !this.check('KEYWORD') && !this.check('PUNCTUATION', '}')) {
      if (this.checkAny(['posicao', 'position'])) {
        this.advance();
        camera.position = this.parseVector3() || [0, 5, 10];
      } else {
        this.advance();
      }
    }

    return camera;
  }

  private parseLight(): LightNode {
    const light: LightNode = { type: 'Light', lightType: 'directional', color: '#FFFFFF' };
    this.advance();

    while (!this.isEnd() && !this.check('NEWLINE') && !this.check('KEYWORD') && !this.check('PUNCTUATION', '}')) {
      if (this.checkAny(['tipo', 'type'])) {
        this.advance();
        if (this.consume('PUNCTUATION', '(')) {
          if (this.check('STRING')) light.lightType = this.advance().value.replace(/"/g, '');
          this.consume('PUNCTUATION', ')');
        }
      } else if (this.checkAny(['cor', 'color'])) {
        this.advance();
        if (this.consume('PUNCTUATION', '(')) {
          if (this.check('COLOR')) light.color = this.advance().value;
          this.consume('PUNCTUATION', ')');
        }
      } else if (this.checkAny(['posicao', 'position'])) {
        this.advance();
        light.position = this.parseVector3() || undefined;
      } else if (this.checkAny(['intensidade', 'intensity'])) {
        this.advance();
        if (this.consume('PUNCTUATION', '(')) {
          if (this.check('NUMBER')) light.intensity = parseFloat(this.advance().value);
          this.consume('PUNCTUATION', ')');
        }
      } else {
        this.advance();
      }
    }

    return light;
  }

  private parseEntity(): EntityNode | null {
    if (!this.consume('KEYWORD', 'entidade') && !this.consume('KEYWORD', 'entity')) return null;

    const entity: EntityNode = { type: 'Entity', name: 'Entity' };

    if (this.check('IDENTIFIER')) entity.name = this.advance().value;
    if (!this.consume('PUNCTUATION', '{')) return entity;

    while (!this.isEnd() && !this.check('PUNCTUATION', '}')) {
      this.skipNewlines();

      if (this.check('KEYWORD', 'modelo') || this.check('KEYWORD', 'model')) {
        entity.model = this.parseModel();
      } else if (this.check('KEYWORD', 'fisica') || this.check('KEYWORD', 'physics')) {
        entity.physics = this.parsePhysics();
      } else if (this.check('KEYWORD', 'controle') || this.check('KEYWORD', 'control')) {
        entity.control = this.parseControl();
      } else if (this.check('KEYWORD', 'material')) {
        entity.materialData = this.parseMaterial();
      } else if (this.check('KEYWORD', 'script')) {
        entity.scripts = this.parseScripts();
      } else if (this.check('PUNCTUATION', '}')) {
        break;
      } else {
        this.advance();
      }
    }

    this.consume('PUNCTUATION', '}');
    return entity;
  }

  private parseMaterial(): MaterialData {
    const mat: MaterialData = {};
    this.advance(); // consume 'material'

    // Check for inline properties or block
    if (this.consume('PUNCTUATION', '{')) {
      while (!this.isEnd() && !this.check('PUNCTUATION', '}')) {
        this.skipNewlines();
        if (this.checkAny(['tipo', 'type'])) {
          this.advance();
          if (this.consume('PUNCTUATION', '(')) {
            if (this.check('STRING')) mat.type = this.advance().value.replace(/"/g, '');
            this.consume('PUNCTUATION', ')');
          }
        } else if (this.checkAny(['rugosidade', 'roughness'])) {
          this.advance();
          if (this.consume('PUNCTUATION', '(')) {
            if (this.check('NUMBER')) mat.roughness = parseFloat(this.advance().value);
            this.consume('PUNCTUATION', ')');
          }
        } else if (this.checkAny(['metalico', 'metalness'])) {
          this.advance();
          if (this.consume('PUNCTUATION', '(')) {
            if (this.check('NUMBER')) mat.metalness = parseFloat(this.advance().value);
            this.consume('PUNCTUATION', ')');
          }
        } else if (this.checkAny(['transparencia', 'opacity'])) {
          this.advance();
          if (this.consume('PUNCTUATION', '(')) {
            if (this.check('NUMBER')) mat.opacity = parseFloat(this.advance().value);
            this.consume('PUNCTUATION', ')');
          }
        } else if (this.checkAny(['wireframe', 'aramado'])) {
          this.advance();
          if (this.consume('PUNCTUATION', '(')) {
            if (this.check('KEYWORD', 'verdadeiro') || this.check('KEYWORD', 'true')) {
              mat.wireframe = true; this.advance();
            } else if (this.check('KEYWORD', 'falso') || this.check('KEYWORD', 'false')) {
              mat.wireframe = false; this.advance();
            }
            this.consume('PUNCTUATION', ')');
          }
        } else if (this.checkAny(['textura_padrao', 'texture_pattern'])) {
          this.advance();
          if (this.consume('PUNCTUATION', '(')) {
            if (this.check('STRING')) {
              const texType = this.advance().value.replace(/"/g, '');
              const params: Record<string, any> = {};
              if (this.consume('PUNCTUATION', ',')) {
                if (this.check('COLOR')) params.color1 = this.advance().value;
                if (this.consume('PUNCTUATION', ',')) {
                  if (this.check('COLOR')) params.color2 = this.advance().value;
                }
              }
              mat.texture = { type: texType, params };
            }
            this.consume('PUNCTUATION', ')');
          }
        } else {
          this.advance();
        }
      }
      this.consume('PUNCTUATION', '}');
    } else {
      // Inline: material tipo("standard") rugosidade(0.5)
      while (!this.isEnd() && !this.check('NEWLINE') && !this.check('PUNCTUATION', '}') &&
             !this.check('KEYWORD', 'modelo') && !this.check('KEYWORD', 'model') &&
             !this.check('KEYWORD', 'fisica') && !this.check('KEYWORD', 'physics') &&
             !this.check('KEYWORD', 'controle') && !this.check('KEYWORD', 'control') &&
             !this.check('KEYWORD', 'script')) {
        if (this.checkAny(['tipo', 'type'])) {
          this.advance();
          if (this.consume('PUNCTUATION', '(')) {
            if (this.check('STRING')) mat.type = this.advance().value.replace(/"/g, '');
            this.consume('PUNCTUATION', ')');
          }
        } else if (this.checkAny(['rugosidade', 'roughness'])) {
          this.advance();
          if (this.consume('PUNCTUATION', '(')) {
            if (this.check('NUMBER')) mat.roughness = parseFloat(this.advance().value);
            this.consume('PUNCTUATION', ')');
          }
        } else if (this.checkAny(['metalico', 'metalness'])) {
          this.advance();
          if (this.consume('PUNCTUATION', '(')) {
            if (this.check('NUMBER')) mat.metalness = parseFloat(this.advance().value);
            this.consume('PUNCTUATION', ')');
          }
        } else {
          this.advance();
        }
      }
    }

    return mat;
  }

  private parseScripts(): ScriptNode[] {
    const scripts: ScriptNode[] = [];
    this.advance(); // consume 'script'

    if (!this.consume('PUNCTUATION', '{')) return scripts;

    while (!this.isEnd() && !this.check('PUNCTUATION', '}')) {
      this.skipNewlines();

      if (this.checkAny(['ao_iniciar', 'onInit'])) {
        const event = this.advance().value;
        const body = this.parseScriptBody();
        scripts.push({ type: 'Script', event, body });
      } else if (this.checkAny(['a_cada_frame', 'onFrame'])) {
        const event = this.advance().value;
        const body = this.parseScriptBody();
        scripts.push({ type: 'Script', event, body });
      } else if (this.checkAny(['ao_colidir', 'onCollide'])) {
        const event = this.advance().value;
        let target: string | undefined;
        // Parse target: ao_colidir(com: "Inimigo") or onCollide("Enemy")
        if (this.consume('PUNCTUATION', '(')) {
          // Skip optional "com:" or "with:"
          if (this.checkAny(['com', 'with'])) {
            this.advance();
            this.consume('PUNCTUATION', ':');
          }
          if (this.check('STRING')) {
            target = this.advance().value.replace(/"/g, '');
          }
          this.consume('PUNCTUATION', ')');
        }
        const body = this.parseScriptBody();
        scripts.push({ type: 'Script', event, target, body });
      } else if (this.check('PUNCTUATION', '}')) {
        break;
      } else {
        this.advance();
      }
    }

    this.consume('PUNCTUATION', '}');
    return scripts;
  }

  private parseScriptBody(): string {
    if (!this.consume('PUNCTUATION', '{')) return '';

    let depth = 1;
    let body = '';

    while (!this.isEnd() && depth > 0) {
      const token = this.current();
      if (token.value === '{') depth++;
      if (token.value === '}') {
        depth--;
        if (depth === 0) break;
      }
      body += token.value + ' ';
      this.advance();
    }

    this.consume('PUNCTUATION', '}');
    return body.trim();
  }

  // Helper to check multiple keyword variants
  private checkAny(values: string[]): boolean {
    for (const val of values) {
      if (this.check('KEYWORD', val) || this.check('IDENTIFIER', val)) return true;
    }
    return false;
  }

  private parseModel(): ModelNode {
    const model: ModelNode = { type: 'Model', primitive: 'cubo', color: '#888888' };
    this.advance();

    while (!this.isEnd() && !this.check('NEWLINE') && 
           !this.check('KEYWORD', 'fisica') && !this.check('KEYWORD', 'physics') &&
           !this.check('KEYWORD', 'controle') && !this.check('KEYWORD', 'control') &&
           !this.check('KEYWORD', 'material') && !this.check('KEYWORD', 'script') &&
           !this.check('PUNCTUATION', '}')) {
      if (this.checkAny(['primitivo', 'primitive'])) {
        this.advance();
        if (this.consume('PUNCTUATION', '(')) {
          if (this.check('STRING')) model.primitive = this.advance().value.replace(/"/g, '');
          this.consume('PUNCTUATION', ')');
        }
      } else if (this.checkAny(['tamanho', 'size'])) {
        this.advance();
        model.size = this.parseVector3() || [1, 1, 1];
      } else if (this.checkAny(['cor', 'color'])) {
        this.advance();
        if (this.consume('PUNCTUATION', '(')) {
          if (this.check('COLOR')) model.color = this.advance().value;
          this.consume('PUNCTUATION', ')');
        }
      } else if (this.checkAny(['posicao', 'position'])) {
        this.advance();
        model.position = this.parseVector3() || undefined;
      } else if (this.checkAny(['rotacao', 'rotation'])) {
        this.advance();
        model.rotation = this.parseVector3() || undefined;
      } else if (this.checkAny(['raio', 'radius'])) {
        this.advance();
        if (this.consume('PUNCTUATION', '(')) {
          if (this.check('NUMBER')) model.radius = parseFloat(this.advance().value);
          this.consume('PUNCTUATION', ')');
        }
      } else if (this.checkAny(['altura', 'height'])) {
        this.advance();
        if (this.consume('PUNCTUATION', '(')) {
          if (this.check('NUMBER')) model.height = parseFloat(this.advance().value);
          this.consume('PUNCTUATION', ')');
        }
      } else {
        this.advance();
      }
    }

    return model;
  }

  private parsePhysics(): PhysicsNode {
    const physics: PhysicsNode = { type: 'Physics', active: true, mass: 1, gravity: true, static: false };
    this.advance();

    while (!this.isEnd() && !this.check('NEWLINE') && 
           !this.check('KEYWORD', 'controle') && !this.check('KEYWORD', 'control') &&
           !this.check('KEYWORD', 'modelo') && !this.check('KEYWORD', 'model') &&
           !this.check('KEYWORD', 'material') && !this.check('KEYWORD', 'script') &&
           !this.check('PUNCTUATION', '}')) {
      if (this.checkAny(['ativo', 'active'])) {
        this.advance();
        if (this.consume('PUNCTUATION', '(')) {
          if (this.check('KEYWORD', 'verdadeiro') || this.check('KEYWORD', 'true')) { physics.active = true; this.advance(); }
          else if (this.check('KEYWORD', 'falso') || this.check('KEYWORD', 'false')) { physics.active = false; this.advance(); }
          this.consume('PUNCTUATION', ')');
        }
      } else if (this.checkAny(['massa', 'mass'])) {
        this.advance();
        if (this.consume('PUNCTUATION', '(')) {
          if (this.check('NUMBER')) physics.mass = parseFloat(this.advance().value);
          this.consume('PUNCTUATION', ')');
        }
      } else if (this.checkAny(['gravidade', 'gravity'])) {
        this.advance();
        if (this.consume('PUNCTUATION', '(')) {
          if (this.check('KEYWORD', 'verdadeiro') || this.check('KEYWORD', 'true')) { physics.gravity = true; this.advance(); }
          else if (this.check('KEYWORD', 'falso') || this.check('KEYWORD', 'false')) { physics.gravity = false; this.advance(); }
          this.consume('PUNCTUATION', ')');
        }
      } else if (this.checkAny(['estatico', 'static'])) {
        this.advance();
        if (this.consume('PUNCTUATION', '(')) {
          if (this.check('KEYWORD', 'verdadeiro') || this.check('KEYWORD', 'true')) { physics.static = true; this.advance(); }
          else if (this.check('KEYWORD', 'falso') || this.check('KEYWORD', 'false')) { physics.static = false; this.advance(); }
          this.consume('PUNCTUATION', ')');
        }
      } else {
        this.advance();
      }
    }

    return physics;
  }

  private parseControl(): ControlNode {
    const control: ControlNode = { type: 'Control', input: 'keyboard', keys: 'WASD', speed: 5 };
    this.advance();

    while (!this.isEnd() && !this.check('NEWLINE') && 
           !this.check('KEYWORD', 'fisica') && !this.check('KEYWORD', 'physics') &&
           !this.check('KEYWORD', 'modelo') && !this.check('KEYWORD', 'model') &&
           !this.check('KEYWORD', 'material') && !this.check('KEYWORD', 'script') &&
           !this.check('PUNCTUATION', '}')) {
      if (this.checkAny(['teclado', 'keyboard'])) {
        this.advance();
        control.input = 'keyboard';
        if (this.consume('PUNCTUATION', '(')) {
          if (this.check('STRING')) control.keys = this.advance().value.replace(/"/g, '');
          this.consume('PUNCTUATION', ')');
        }
      } else if (this.checkAny(['velocidade', 'speed'])) {
        this.advance();
        if (this.consume('PUNCTUATION', '(')) {
          if (this.check('NUMBER')) control.speed = parseFloat(this.advance().value);
          this.consume('PUNCTUATION', ')');
        }
      } else {
        this.advance();
      }
    }

    return control;
  }

  private parseVector3(): [number, number, number] | null {
    if (!this.consume('PUNCTUATION', '(')) return null;

    const values: number[] = [];
    
    while (!this.isEnd() && !this.check('PUNCTUATION', ')')) {
      if (this.check('NUMBER')) {
        values.push(parseFloat(this.advance().value));
      } else if (this.check('PUNCTUATION', ',')) {
        this.advance();
      } else if (this.check('OPERATOR', '-')) {
        this.advance();
        if (this.check('NUMBER')) values.push(-parseFloat(this.advance().value));
      } else {
        break;
      }
    }

    this.consume('PUNCTUATION', ')');

    if (values.length >= 3) return [values[0], values[1], values[2]];
    if (values.length === 1) return [values[0], values[0], values[0]];
    return null;
  }

  private skipNewlines(): void {
    while (this.check('NEWLINE')) this.advance();
  }

  private current(): Token {
    return this.tokens[this.pos] || { type: 'EOF', value: '', line: 0, column: 0 };
  }

  private check(type: string, value?: string): boolean {
    const token = this.current();
    if (token.type !== type) return false;
    if (value !== undefined && token.value.toLowerCase() !== value.toLowerCase()) return false;
    return true;
  }

  private advance(): Token {
    const token = this.current();
    if (!this.isEnd()) this.pos++;
    return token;
  }

  private consume(type: string, value?: string): boolean {
    if (this.check(type, value)) { this.advance(); return true; }
    return false;
  }

  private isEnd(): boolean {
    return this.current().type === 'EOF';
  }

  private error(message: string): void {
    const token = this.current();
    this.errors.push({ message, line: token.line, column: token.column });
  }
}
