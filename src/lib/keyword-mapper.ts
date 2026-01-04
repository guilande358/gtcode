// Keyword Mapper - Maps Portuguese keywords to English for internal compilation

export const KEYWORD_MAP: Record<string, string> = {
  // Project structure
  'projeto': 'project',
  'versao': 'version',
  'cena': 'scene',
  'entidade': 'entity',
  'modelo': 'model',
  'primitivo': 'primitive',
  'fisica': 'physics',
  'controle': 'control',
  'script': 'script',
  'interface': 'interface',
  'biblioteca': 'library',
  
  // Camera & Lighting
  'camera': 'camera',
  'luz': 'light',
  'ambiente': 'ambient',
  'direcional': 'directional',
  'ponto': 'point',
  'holofote': 'spot',
  
  // Geometry
  'cubo': 'box',
  'esfera': 'sphere',
  'cilindro': 'cylinder',
  'cone': 'cone',
  'plano': 'plane',
  'rosca': 'torus',
  'torus': 'torus',
  
  // Properties
  'tipo': 'type',
  'cor': 'color',
  'posicao': 'position',
  'rotacao': 'rotation',
  'escala': 'scale',
  'tamanho': 'size',
  'raio': 'radius',
  'altura': 'height',
  'largura': 'width',
  
  // Physics
  'ativo': 'active',
  'massa': 'mass',
  'gravidade': 'gravity',
  'estatico': 'static',
  'dinamico': 'dynamic',
  'cinematico': 'kinematic',
  'colisor': 'collider',
  'sensor': 'sensor',
  'friccao': 'friction',
  'restituicao': 'restitution',
  
  // Control
  'teclado': 'keyboard',
  'mouse': 'mouse',
  'touch': 'touch',
  'velocidade': 'velocity',
  'pulo': 'jump',
  'teclas': 'keys',
  
  // Scripts / Events
  'ao_iniciar': 'onInit',
  'a_cada_frame': 'onFrame',
  'ao_colidir': 'onCollide',
  'ao_clicar': 'onClick',
  'ao_pressionar': 'onKeyPress',
  'ao_soltar': 'onKeyRelease',
  
  // Variables & Control flow
  'variavel': 'variable',
  'constante': 'constant',
  'funcao': 'function',
  'se': 'if',
  'senao': 'else',
  'enquanto': 'while',
  'para': 'for',
  'retornar': 'return',
  'verdadeiro': 'true',
  'falso': 'false',
  
  // Audio
  'som': 'sound',
  'musica': 'music',
  'tocar': 'play',
  'pausar': 'pause',
  'parar': 'stop',
  'loop': 'loop',
  'volume': 'volume',
  
  // Built-in functions
  'carregar': 'load',
  'destruir': 'destroy',
  'mover_para': 'moveTo',
  'olhar_para': 'lookAt',
  'distancia': 'distance',
  'aleatorio': 'random',
  'log': 'log',
  'tocar_som': 'playSound',
  'tocar_musica': 'playMusic',
  
  // UI
  'texto': 'text',
  'botao': 'button',
  'imagem': 'image',
  'fonte': 'font',
  'conteudo': 'content',
  'icone': 'icon',
  
  // Target specifier
  'com': 'with',
  'alvo': 'target',
  'outro': 'other'
};

// Reverse map for English to Portuguese
export const REVERSE_KEYWORD_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(KEYWORD_MAP).map(([pt, en]) => [en, pt])
);

/**
 * Maps a Portuguese keyword to its English equivalent
 */
export function mapKeyword(keyword: string): string {
  const lower = keyword.toLowerCase();
  return KEYWORD_MAP[lower] || keyword;
}

/**
 * Maps an English keyword back to Portuguese
 */
export function reverseMapKeyword(keyword: string): string {
  const lower = keyword.toLowerCase();
  return REVERSE_KEYWORD_MAP[lower] || keyword;
}

/**
 * Check if a word is a known keyword (in any language)
 */
export function isKeyword(word: string): boolean {
  const lower = word.toLowerCase();
  return lower in KEYWORD_MAP || lower in REVERSE_KEYWORD_MAP;
}
