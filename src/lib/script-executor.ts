// Script Executor - Runs custom game logic defined in GcodeForce scripts

import { Entity3D, Scene3D } from './gcodeforce-interpreter';
import { audioManager } from './audio-manager';
import { playProceduralSound, SoundType } from './procedural-audio';

export interface ScriptEvent {
  type: 'onInit' | 'onFrame' | 'onCollide';
  target?: string; // For onCollide events
  body: string;
}

export interface RuntimeEntity {
  entity: Entity3D;
  scripts: ScriptEvent[];
  variables: Map<string, any>;
  initialized: boolean;
}

export interface ScriptContext {
  entity: RuntimeEntity;
  scene: Scene3D;
  delta: number;
  other?: string; // The entity we collided with
}

export class ScriptExecutor {
  private entities: Map<string, RuntimeEntity> = new Map();
  private globalVariables: Map<string, any> = new Map();
  private logs: string[] = [];
  private onLog: (message: string, type: 'log' | 'error' | 'info') => void;

  constructor(onLog?: (message: string, type: 'log' | 'error' | 'info') => void) {
    this.onLog = onLog || ((msg) => console.log(msg));
  }

  /**
   * Initialize the executor with scene data
   */
  initialize(scene: Scene3D): void {
    this.entities.clear();
    this.globalVariables.clear();
    this.logs = [];

    scene.entities.forEach(entity => {
      const runtimeEntity: RuntimeEntity = {
        entity,
        scripts: this.parseScripts(entity),
        variables: new Map(),
        initialized: false
      };
      this.entities.set(entity.id, runtimeEntity);
    });
  }

  /**
   * Parse scripts from entity (placeholder - actual parsing happens in parser)
   */
  private parseScripts(entity: Entity3D): ScriptEvent[] {
    // Scripts will be parsed from the AST and attached to Entity3D
    return entity.scripts || [];
  }

  /**
   * Execute onInit for all entities
   */
  executeOnInit(scene: Scene3D): void {
    this.entities.forEach(runtimeEntity => {
      if (!runtimeEntity.initialized) {
        const initScripts = runtimeEntity.scripts.filter(s => s.type === 'onInit');
        initScripts.forEach(script => {
          this.executeScript(script.body, {
            entity: runtimeEntity,
            scene,
            delta: 0
          });
        });
        runtimeEntity.initialized = true;
      }
    });
  }

  /**
   * Execute onFrame for all entities
   */
  executeOnFrame(scene: Scene3D, delta: number): void {
    this.entities.forEach(runtimeEntity => {
      const frameScripts = runtimeEntity.scripts.filter(s => s.type === 'onFrame');
      frameScripts.forEach(script => {
        this.executeScript(script.body, {
          entity: runtimeEntity,
          scene,
          delta
        });
      });
    });
  }

  /**
   * Execute onCollide for specific entities
   */
  executeOnCollide(entityId: string, otherEntityId: string, scene: Scene3D): void {
    const runtimeEntity = this.entities.get(entityId);
    if (!runtimeEntity) return;

    const collideScripts = runtimeEntity.scripts.filter(
      s => s.type === 'onCollide' && (s.target === otherEntityId || s.target === '*' || !s.target)
    );

    collideScripts.forEach(script => {
      this.executeScript(script.body, {
        entity: runtimeEntity,
        scene,
        delta: 0,
        other: otherEntityId
      });
    });
  }

  /**
   * Execute a script body (simplified interpreter)
   */
  private executeScript(body: string, context: ScriptContext): void {
    const lines = body.split('\n').map(l => l.trim()).filter(l => l);

    for (const line of lines) {
      try {
        this.executeLine(line, context);
      } catch (e) {
        this.onLog(`Script error: ${e}`, 'error');
      }
    }
  }

  /**
   * Execute a single line of script
   */
  private executeLine(line: string, context: ScriptContext): void {
    // Variable assignment: variavel nome = valor
    const varMatch = line.match(/^(?:variavel|variable|var)\s+(\w+)\s*=\s*(.+)$/i);
    if (varMatch) {
      const [, name, value] = varMatch;
      context.entity.variables.set(name, this.evaluateExpression(value, context));
      return;
    }

    // Function call: funcao(args)
    const funcMatch = line.match(/^(\w+)\s*\(([^)]*)\)$/);
    if (funcMatch) {
      const [, funcName, argsStr] = funcMatch;
      const args = argsStr.split(',').map(a => a.trim()).filter(a => a);
      this.executeFunction(funcName, args, context);
      return;
    }

    // Assignment: nome = valor
    const assignMatch = line.match(/^(\w+)\s*=\s*(.+)$/);
    if (assignMatch) {
      const [, name, value] = assignMatch;
      context.entity.variables.set(name, this.evaluateExpression(value, context));
      return;
    }
  }

  /**
   * Execute a built-in function
   */
  private executeFunction(name: string, args: string[], context: ScriptContext): void {
    const funcMap: Record<string, () => void> = {
      'log': () => {
        const message = args.map(a => this.evaluateExpression(a, context)).join(' ');
        this.onLog(message, 'log');
      },
      'tocar_som': () => {
        const soundType = args[0]?.replace(/"/g, '') as SoundType;
        playProceduralSound(soundType || 'collision');
      },
      'playSound': () => {
        const soundType = args[0]?.replace(/"/g, '') as SoundType;
        playProceduralSound(soundType || 'collision');
      },
      'tocar_musica': () => {
        const src = args[0]?.replace(/"/g, '');
        if (src) audioManager.playMusic(src);
      },
      'playMusic': () => {
        const src = args[0]?.replace(/"/g, '');
        if (src) audioManager.playMusic(src);
      },
      'parar_musica': () => audioManager.stopMusic(),
      'stopMusic': () => audioManager.stopMusic(),
      'destruir': () => {
        const targetId = args[0]?.replace(/"/g, '') || context.other;
        if (targetId) {
          // Mark entity for destruction
          this.onLog(`Destroy: ${targetId}`, 'info');
        }
      },
      'destroy': () => {
        const targetId = args[0]?.replace(/"/g, '') || context.other;
        if (targetId) {
          this.onLog(`Destroy: ${targetId}`, 'info');
        }
      }
    };

    const func = funcMap[name] || funcMap[name.toLowerCase()];
    if (func) {
      func();
    } else {
      this.onLog(`Unknown function: ${name}`, 'error');
    }
  }

  /**
   * Evaluate an expression
   */
  private evaluateExpression(expr: string, context: ScriptContext): any {
    expr = expr.trim();

    // Number
    if (/^-?\d+(\.\d+)?$/.test(expr)) {
      return parseFloat(expr);
    }

    // String
    if (/^".*"$/.test(expr)) {
      return expr.slice(1, -1);
    }

    // Boolean
    if (expr === 'true' || expr === 'verdadeiro') return true;
    if (expr === 'false' || expr === 'falso') return false;

    // Variable lookup
    if (context.entity.variables.has(expr)) {
      return context.entity.variables.get(expr);
    }

    // Global variable
    if (this.globalVariables.has(expr)) {
      return this.globalVariables.get(expr);
    }

    // Special variables
    if (expr === 'delta') return context.delta;
    if (expr === 'outro' || expr === 'other') return context.other;

    // Simple arithmetic
    const mathMatch = expr.match(/^(.+)\s*([+\-*/])\s*(.+)$/);
    if (mathMatch) {
      const [, left, op, right] = mathMatch;
      const leftVal = this.evaluateExpression(left, context);
      const rightVal = this.evaluateExpression(right, context);
      
      switch (op) {
        case '+': return leftVal + rightVal;
        case '-': return leftVal - rightVal;
        case '*': return leftVal * rightVal;
        case '/': return rightVal !== 0 ? leftVal / rightVal : 0;
      }
    }

    return expr;
  }

  /**
   * Get all logs
   */
  getLogs(): string[] {
    return [...this.logs];
  }

  /**
   * Clear state
   */
  cleanup(): void {
    this.entities.clear();
    this.globalVariables.clear();
    this.logs = [];
  }
}

// Singleton for use across components
export const scriptExecutor = new ScriptExecutor();
