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

export interface EntityNode extends ASTNode {
  type: 'Entity';
  name: string;
  model?: ModelNode;
  physics?: PhysicsNode;
  control?: ControlNode;
  scripts?: ScriptNode[];
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
      name: 'Sem nome',
      version: '1.0',
      scenes: []
    };

    // Skip to find project declaration or scenes
    while (!this.isEnd()) {
      this.skipNewlines();
      
      if (this.check('KEYWORD', 'projeto')) {
        this.advance();
        if (this.check('STRING')) {
          project.name = this.advance().value.replace(/"/g, '');
        }
        if (this.check('KEYWORD', 'versao')) {
          this.advance();
          if (this.check('STRING')) {
            project.version = this.advance().value.replace(/"/g, '');
          }
        }
      } else if (this.check('KEYWORD', 'cena')) {
        const scene = this.parseScene();
        if (scene) {
          project.scenes.push(scene);
        }
      } else {
        this.advance();
      }
    }

    return project;
  }

  private parseScene(): SceneNode | null {
    if (!this.consume('KEYWORD', 'cena')) return null;

    const scene: SceneNode = {
      type: 'Scene',
      name: 'Principal',
      lights: [],
      entities: []
    };

    if (this.check('IDENTIFIER')) {
      scene.name = this.advance().value;
    }

    if (!this.consume('PUNCTUATION', '{')) {
      this.error('Esperado "{" após nome da cena');
      return scene;
    }

    while (!this.isEnd() && !this.check('PUNCTUATION', '}')) {
      this.skipNewlines();

      if (this.check('KEYWORD', 'camera')) {
        scene.camera = this.parseCamera();
      } else if (this.check('KEYWORD', 'luz')) {
        const light = this.parseLight();
        if (light) scene.lights.push(light);
      } else if (this.check('KEYWORD', 'entidade')) {
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
    const camera: CameraNode = {
      type: 'Camera',
      position: [0, 5, 10]
    };

    this.advance(); // consume 'camera'

    while (!this.isEnd() && !this.check('NEWLINE') && !this.check('KEYWORD') && !this.check('PUNCTUATION', '}')) {
      if (this.check('IDENTIFIER', 'posicao') || this.check('KEYWORD', 'posicao')) {
        this.advance();
        camera.position = this.parseVector3() || [0, 5, 10];
      } else {
        this.advance();
      }
    }

    return camera;
  }

  private parseLight(): LightNode {
    const light: LightNode = {
      type: 'Light',
      lightType: 'direcional',
      color: '#FFFFFF'
    };

    this.advance(); // consume 'luz'

    while (!this.isEnd() && !this.check('NEWLINE') && !this.check('KEYWORD') && !this.check('PUNCTUATION', '}')) {
      if (this.check('KEYWORD', 'tipo') || this.check('IDENTIFIER', 'tipo')) {
        this.advance();
        if (this.consume('PUNCTUATION', '(')) {
          if (this.check('STRING')) {
            light.lightType = this.advance().value.replace(/"/g, '');
          }
          this.consume('PUNCTUATION', ')');
        }
      } else if (this.check('KEYWORD', 'cor') || this.check('IDENTIFIER', 'cor')) {
        this.advance();
        if (this.consume('PUNCTUATION', '(')) {
          if (this.check('COLOR')) {
            light.color = this.advance().value;
          }
          this.consume('PUNCTUATION', ')');
        }
      } else if (this.check('KEYWORD', 'posicao') || this.check('IDENTIFIER', 'posicao')) {
        this.advance();
        light.position = this.parseVector3() || undefined;
      } else {
        this.advance();
      }
    }

    return light;
  }

  private parseEntity(): EntityNode | null {
    if (!this.consume('KEYWORD', 'entidade')) return null;

    const entity: EntityNode = {
      type: 'Entity',
      name: 'Entidade'
    };

    if (this.check('IDENTIFIER')) {
      entity.name = this.advance().value;
    }

    if (!this.consume('PUNCTUATION', '{')) {
      return entity;
    }

    while (!this.isEnd() && !this.check('PUNCTUATION', '}')) {
      this.skipNewlines();

      if (this.check('KEYWORD', 'modelo')) {
        entity.model = this.parseModel();
      } else if (this.check('KEYWORD', 'fisica')) {
        entity.physics = this.parsePhysics();
      } else if (this.check('KEYWORD', 'controle')) {
        entity.control = this.parseControl();
      } else if (this.check('PUNCTUATION', '}')) {
        break;
      } else {
        this.advance();
      }
    }

    this.consume('PUNCTUATION', '}');
    return entity;
  }

  private parseModel(): ModelNode {
    const model: ModelNode = {
      type: 'Model',
      primitive: 'cubo',
      color: '#888888'
    };

    this.advance(); // consume 'modelo'

    while (!this.isEnd() && !this.check('NEWLINE') && !this.check('KEYWORD', 'fisica') && !this.check('KEYWORD', 'controle') && !this.check('PUNCTUATION', '}')) {
      if (this.check('KEYWORD', 'primitivo') || this.check('IDENTIFIER', 'primitivo')) {
        this.advance();
        if (this.consume('PUNCTUATION', '(')) {
          if (this.check('STRING')) {
            model.primitive = this.advance().value.replace(/"/g, '');
          }
          this.consume('PUNCTUATION', ')');
        }
      } else if (this.check('KEYWORD', 'tamanho') || this.check('IDENTIFIER', 'tamanho')) {
        this.advance();
        model.size = this.parseVector3() || [1, 1, 1];
      } else if (this.check('KEYWORD', 'cor') || this.check('IDENTIFIER', 'cor')) {
        this.advance();
        if (this.consume('PUNCTUATION', '(')) {
          if (this.check('COLOR')) {
            model.color = this.advance().value;
          }
          this.consume('PUNCTUATION', ')');
        }
      } else if (this.check('KEYWORD', 'posicao') || this.check('IDENTIFIER', 'posicao')) {
        this.advance();
        model.position = this.parseVector3() || undefined;
      } else if (this.check('KEYWORD', 'rotacao') || this.check('IDENTIFIER', 'rotacao')) {
        this.advance();
        model.rotation = this.parseVector3() || undefined;
      } else if (this.check('KEYWORD', 'raio') || this.check('IDENTIFIER', 'raio')) {
        this.advance();
        if (this.consume('PUNCTUATION', '(')) {
          if (this.check('NUMBER')) {
            model.radius = parseFloat(this.advance().value);
          }
          this.consume('PUNCTUATION', ')');
        }
      } else if (this.check('KEYWORD', 'altura') || this.check('IDENTIFIER', 'altura')) {
        this.advance();
        if (this.consume('PUNCTUATION', '(')) {
          if (this.check('NUMBER')) {
            model.height = parseFloat(this.advance().value);
          }
          this.consume('PUNCTUATION', ')');
        }
      } else {
        this.advance();
      }
    }

    return model;
  }

  private parsePhysics(): PhysicsNode {
    const physics: PhysicsNode = {
      type: 'Physics',
      active: true,
      mass: 1,
      gravity: true,
      static: false
    };

    this.advance(); // consume 'fisica'

    while (!this.isEnd() && !this.check('NEWLINE') && !this.check('KEYWORD', 'controle') && !this.check('KEYWORD', 'modelo') && !this.check('PUNCTUATION', '}')) {
      if (this.check('KEYWORD', 'ativo') || this.check('IDENTIFIER', 'ativo')) {
        this.advance();
        if (this.consume('PUNCTUATION', '(')) {
          if (this.check('KEYWORD', 'verdadeiro') || this.check('KEYWORD', 'true')) {
            physics.active = true;
            this.advance();
          } else if (this.check('KEYWORD', 'falso') || this.check('KEYWORD', 'false')) {
            physics.active = false;
            this.advance();
          }
          this.consume('PUNCTUATION', ')');
        }
      } else if (this.check('KEYWORD', 'massa') || this.check('IDENTIFIER', 'massa')) {
        this.advance();
        if (this.consume('PUNCTUATION', '(')) {
          if (this.check('NUMBER')) {
            physics.mass = parseFloat(this.advance().value);
          }
          this.consume('PUNCTUATION', ')');
        }
      } else if (this.check('KEYWORD', 'gravidade') || this.check('IDENTIFIER', 'gravidade')) {
        this.advance();
        if (this.consume('PUNCTUATION', '(')) {
          if (this.check('KEYWORD', 'verdadeiro') || this.check('KEYWORD', 'true')) {
            physics.gravity = true;
            this.advance();
          } else if (this.check('KEYWORD', 'falso') || this.check('KEYWORD', 'false')) {
            physics.gravity = false;
            this.advance();
          }
          this.consume('PUNCTUATION', ')');
        }
      } else if (this.check('KEYWORD', 'estatico') || this.check('IDENTIFIER', 'estatico')) {
        this.advance();
        if (this.consume('PUNCTUATION', '(')) {
          if (this.check('KEYWORD', 'verdadeiro') || this.check('KEYWORD', 'true')) {
            physics.static = true;
            this.advance();
          } else if (this.check('KEYWORD', 'falso') || this.check('KEYWORD', 'false')) {
            physics.static = false;
            this.advance();
          }
          this.consume('PUNCTUATION', ')');
        }
      } else {
        this.advance();
      }
    }

    return physics;
  }

  private parseControl(): ControlNode {
    const control: ControlNode = {
      type: 'Control',
      input: 'teclado',
      keys: 'WASD',
      speed: 5
    };

    this.advance(); // consume 'controle'

    while (!this.isEnd() && !this.check('NEWLINE') && !this.check('KEYWORD', 'fisica') && !this.check('KEYWORD', 'modelo') && !this.check('PUNCTUATION', '}')) {
      if (this.check('KEYWORD', 'teclado') || this.check('IDENTIFIER', 'teclado')) {
        this.advance();
        control.input = 'teclado';
        if (this.consume('PUNCTUATION', '(')) {
          if (this.check('STRING')) {
            control.keys = this.advance().value.replace(/"/g, '');
          }
          this.consume('PUNCTUATION', ')');
        }
      } else if (this.check('KEYWORD', 'velocidade') || this.check('IDENTIFIER', 'velocidade')) {
        this.advance();
        if (this.consume('PUNCTUATION', '(')) {
          if (this.check('NUMBER')) {
            control.speed = parseFloat(this.advance().value);
          }
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
        if (this.check('NUMBER')) {
          values.push(-parseFloat(this.advance().value));
        }
      } else {
        break;
      }
    }

    this.consume('PUNCTUATION', ')');

    if (values.length >= 3) {
      return [values[0], values[1], values[2]];
    } else if (values.length === 1) {
      return [values[0], values[0], values[0]];
    }

    return null;
  }

  private skipNewlines(): void {
    while (this.check('NEWLINE')) {
      this.advance();
    }
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
    if (!this.isEnd()) {
      this.pos++;
    }
    return token;
  }

  private consume(type: string, value?: string): boolean {
    if (this.check(type, value)) {
      this.advance();
      return true;
    }
    return false;
  }

  private isEnd(): boolean {
    return this.current().type === 'EOF';
  }

  private error(message: string): void {
    const token = this.current();
    this.errors.push({
      message,
      line: token.line,
      column: token.column
    });
  }
}
