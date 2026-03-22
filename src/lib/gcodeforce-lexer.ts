// GcodeForce Lexer - Tokenizes source code

export type TokenType =
  | 'KEYWORD'
  | 'IDENTIFIER'
  | 'NUMBER'
  | 'STRING'
  | 'COLOR'
  | 'OPERATOR'
  | 'PUNCTUATION'
  | 'COMMENT'
  | 'WHITESPACE'
  | 'NEWLINE'
  | 'EOF'
  | 'UNKNOWN';

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

// Keywords in both Portuguese and English
const KEYWORDS = [
  // Portuguese
  'projeto', 'versao', 'cena', 'entidade', 'modelo', 'primitivo',
  'fisica', 'controle', 'script', 'interface', 'biblioteca',
  'camera', 'luz', 'som', 'textura', 'ao_iniciar', 'a_cada_frame',
  'ao_colidir', 'ao_clicar', 'variavel', 'constante', 'funcao',
  'se', 'senao', 'enquanto', 'para', 'retornar', 'verdadeiro', 'falso',
  'tipo', 'cor', 'posicao', 'rotacao', 'escala', 'tamanho',
  'ativo', 'massa', 'gravidade', 'estatico', 'velocidade',
  'teclado', 'mouse', 'touch', 'texto', 'botao', 'imagem',
  'fonte', 'conteudo', 'icone', 'raio', 'altura', 'largura',
  'operacao', 'uniao', 'subtracao', 'intersecao',
  'terreno', 'noise', 'perlin', 'gradiente', 'resolucao', 'amplitude',
  'tocar', 'pausar', 'parar', 'loop', 'volume',
  'carregar', 'destruir', 'mover_para', 'olhar_para', 'distancia',
  'material', 'rugosidade', 'metalico', 'transparencia', 'aramado',
  'textura_padrao', 'textura_repetir', 'intensidade', 'reflexo', 'refracao',
  'particulas', 'quantidade', 'vida', 'cor_inicio', 'cor_fim',
  'posicao_relativa', 'direcao', 'com',
  // English equivalents
  'project', 'version', 'scene', 'entity', 'model', 'primitive',
  'physics', 'control', 'library',
  'light', 'sound', 'texture', 'onInit', 'onFrame',
  'onCollide', 'onClick', 'variable', 'constant', 'function',
  'if', 'else', 'while', 'for', 'return', 'true', 'false',
  'type', 'color', 'position', 'rotation', 'scale', 'size',
  'active', 'mass', 'gravity', 'static', 'dynamic', 'kinematic', 'speed',
  'keyboard', 'text', 'button', 'image',
  'font', 'content', 'icon', 'radius', 'height', 'width',
  'operation', 'union', 'subtraction', 'intersection',
  'terrain', 'resolution', 'play', 'pause', 'stop',
  'load', 'destroy', 'moveTo', 'lookAt',
  'roughness', 'metalness', 'opacity', 'wireframe', 'emissive',
  'texture_pattern', 'texture_repeat', 'intensity', 'with',
  'particles', 'count', 'lifetime', 'color_start', 'color_end'
];

const OPERATORS = ['+', '-', '*', '/', '%', '=', '==', '!=', '<', '>', '<=', '>=', '&&', '||', '!', '+=', '-=', '*=', '/='];
const PUNCTUATION = ['(', ')', '{', '}', '[', ']', ',', ':', '.', ';'];

export class Lexer {
  private source: string;
  private pos: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];

  constructor(source: string) {
    this.source = source;
  }

  tokenize(): Token[] {
    this.tokens = [];
    this.pos = 0;
    this.line = 1;
    this.column = 1;

    while (this.pos < this.source.length) {
      const token = this.nextToken();
      if (token.type !== 'WHITESPACE' && token.type !== 'COMMENT') {
        this.tokens.push(token);
      }
    }

    this.tokens.push({ type: 'EOF', value: '', line: this.line, column: this.column });
    return this.tokens;
  }

  private nextToken(): Token {
    const startLine = this.line;
    const startColumn = this.column;

    // Skip whitespace
    if (/\s/.test(this.current())) {
      let value = '';
      while (this.pos < this.source.length && /[ \t]/.test(this.current())) {
        value += this.advance();
      }
      if (this.current() === '\n') {
        this.advance();
        this.line++;
        this.column = 1;
        return { type: 'NEWLINE', value: '\n', line: startLine, column: startColumn };
      }
      return { type: 'WHITESPACE', value, line: startLine, column: startColumn };
    }

    // Newline
    if (this.current() === '\n') {
      this.advance();
      this.line++;
      this.column = 1;
      return { type: 'NEWLINE', value: '\n', line: startLine, column: startColumn };
    }

    // Comment
    if (this.current() === '/' && this.peek() === '/') {
      let value = '';
      while (this.pos < this.source.length && this.current() !== '\n') {
        value += this.advance();
      }
      return { type: 'COMMENT', value, line: startLine, column: startColumn };
    }

    // String
    if (this.current() === '"') {
      let value = this.advance();
      while (this.pos < this.source.length && this.current() !== '"') {
        if (this.current() === '\\') {
          value += this.advance();
        }
        value += this.advance();
      }
      if (this.current() === '"') {
        value += this.advance();
      }
      return { type: 'STRING', value, line: startLine, column: startColumn };
    }

    // Color (hex)
    if (this.current() === '#') {
      let value = this.advance();
      while (this.pos < this.source.length && /[0-9A-Fa-f]/.test(this.current())) {
        value += this.advance();
      }
      return { type: 'COLOR', value, line: startLine, column: startColumn };
    }

    // Number
    if (/[0-9]/.test(this.current()) || (this.current() === '-' && /[0-9]/.test(this.peek()))) {
      let value = '';
      if (this.current() === '-') {
        value += this.advance();
      }
      while (this.pos < this.source.length && /[0-9.]/.test(this.current())) {
        value += this.advance();
      }
      return { type: 'NUMBER', value, line: startLine, column: startColumn };
    }

    // Identifier or Keyword
    if (/[a-zA-Z_áàâãéèêíìîóòôõúùûçÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ]/.test(this.current())) {
      let value = '';
      while (this.pos < this.source.length && /[a-zA-Z0-9_áàâãéèêíìîóòôõúùûçÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ]/.test(this.current())) {
        value += this.advance();
      }
      const type: TokenType = KEYWORDS.includes(value.toLowerCase()) ? 'KEYWORD' : 'IDENTIFIER';
      return { type, value, line: startLine, column: startColumn };
    }

    // Multi-char operators
    const twoChar = this.current() + this.peek();
    if (OPERATORS.includes(twoChar)) {
      const value = this.advance() + this.advance();
      return { type: 'OPERATOR', value, line: startLine, column: startColumn };
    }

    // Single-char operators
    if (OPERATORS.includes(this.current())) {
      const value = this.advance();
      return { type: 'OPERATOR', value, line: startLine, column: startColumn };
    }

    // Punctuation
    if (PUNCTUATION.includes(this.current())) {
      const value = this.advance();
      return { type: 'PUNCTUATION', value, line: startLine, column: startColumn };
    }

    // Unknown
    const value = this.advance();
    return { type: 'UNKNOWN', value, line: startLine, column: startColumn };
  }

  private current(): string {
    return this.source[this.pos] || '';
  }

  private peek(): string {
    return this.source[this.pos + 1] || '';
  }

  private advance(): string {
    const char = this.current();
    this.pos++;
    this.column++;
    return char;
  }
}
