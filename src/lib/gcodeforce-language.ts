// GcodeForce Language Definition for Monaco Editor

export const GCODEFORCE_LANGUAGE_ID = 'gcodeforce';

// Keywords da linguagem GcodeForce
export const keywords = [
  // Estrutura
  'projeto', 'versao', 'cena', 'entidade', 'modelo', 'biblioteca',
  // Propriedades
  'fisica', 'controle', 'script', 'interface', 'audio',
  // Tipos de modelo
  'primitivo', 'operacao', 'terreno', 'mesh',
  // Primitivas
  'cubo', 'esfera', 'cilindro', 'cone', 'plano', 'torus', 'capsula',
  // Operações CSG
  'uniao', 'subtracao', 'intersecao',
  // Câmera e Luz
  'camera', 'luz', 'ambiente', 'direcional', 'ponto', 'spot',
  // Física
  'ativo', 'massa', 'gravidade', 'estatico', 'dinamico', 'colisao',
  // Controle
  'teclado', 'mouse', 'touch', 'velocidade', 'sensibilidade',
  // Script
  'ao_iniciar', 'a_cada_frame', 'ao_colidir', 'ao_destruir',
  // Variáveis e controle de fluxo
  'variavel', 'constante', 'se', 'senao', 'enquanto', 'para', 'retornar',
  // Funções
  'funcao', 'chamar', 'criar', 'destruir', 'mover', 'rotacionar', 'escalar',
  // Áudio
  'som', 'musica', 'tocar', 'pausar', 'parar', 'volume', 'loop',
  // UI
  'texto', 'botao', 'imagem', 'barra', 'painel',
  // Propriedades comuns
  'posicao', 'rotacao', 'escala', 'tamanho', 'cor', 'textura', 'opacidade',
  'visivel', 'ativado', 'nome', 'tag', 'camada',
  // Valores
  'verdadeiro', 'falso', 'nulo',
];

export const typeKeywords = [
  'numero', 'texto', 'booleano', 'vetor2', 'vetor3', 'cor', 'lista', 'objeto',
];

export const operators = [
  '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
  '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^', '%',
  '<<', '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=', '^=',
  '%=', '<<=', '>>=', '>>>='
];

export const builtinFunctions = [
  // Matemática
  'abs', 'min', 'max', 'sqrt', 'pow', 'sin', 'cos', 'tan', 'atan2',
  'aleatorio', 'arredondar', 'piso', 'teto', 'lerp', 'clamp',
  // Vetores
  'distancia', 'normalizar', 'magnitude', 'angulo', 'direcao',
  // Tempo
  'tempo', 'delta_tempo', 'esperar',
  // Debug
  'log', 'aviso', 'erro',
  // Carregamento
  'carregar', 'carregar_textura', 'carregar_modelo', 'carregar_som',
  // Jogo
  'pausar_jogo', 'retomar_jogo', 'reiniciar_cena', 'carregar_cena', 'sair',
  // Input
  'tecla_pressionada', 'tecla_solta', 'mouse_posicao', 'mouse_botao',
];

// Configuração do Monaco Language
export const languageConfiguration = {
  comments: {
    lineComment: '//',
    blockComment: ['/*', '*/'],
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')'],
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
  folding: {
    markers: {
      start: /^\s*\/\/\s*#region\b/,
      end: /^\s*\/\/\s*#endregion\b/,
    },
  },
};

// Monarch Tokenizer para syntax highlighting
export const monarchTokensProvider = {
  keywords,
  typeKeywords,
  operators,
  builtinFunctions,

  symbols: /[=><!~?:&|+\-*\/\^%]+/,
  escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
  digits: /\d+(_+\d+)*/,

  tokenizer: {
    root: [
      // Identificadores e keywords
      [/[a-zA-Z_áàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][\w_áàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]*/, {
        cases: {
          '@keywords': 'keyword',
          '@typeKeywords': 'type',
          '@builtinFunctions': 'function.builtin',
          '@default': 'identifier',
        },
      }],

      // Whitespace
      { include: '@whitespace' },

      // Delimiters e operadores
      [/[{}()\[\]]/, '@brackets'],
      [/[<>](?!@symbols)/, '@brackets'],
      [/@symbols/, {
        cases: {
          '@operators': 'operator',
          '@default': '',
        },
      }],

      // Números com cor hex
      [/#[0-9A-Fa-f]{6}/, 'number.hex'],
      [/#[0-9A-Fa-f]{3}/, 'number.hex'],

      // Números
      [/(@digits)[eE]([\-+]?(@digits))?/, 'number.float'],
      [/(@digits)\.(@digits)([eE][\-+]?(@digits))?/, 'number.float'],
      [/(@digits)/, 'number'],

      // Delimitador
      [/[;,.]/, 'delimiter'],

      // Strings
      [/"([^"\\]|\\.)*$/, 'string.invalid'],
      [/'([^'\\]|\\.)*$/, 'string.invalid'],
      [/"/, 'string', '@string_double'],
      [/'/, 'string', '@string_single'],
    ],

    whitespace: [
      [/[ \t\r\n]+/, ''],
      [/\/\*/, 'comment', '@comment'],
      [/\/\/.*$/, 'comment'],
    ],

    comment: [
      [/[^\/*]+/, 'comment'],
      [/\*\//, 'comment', '@pop'],
      [/[\/*]/, 'comment'],
    ],

    string_double: [
      [/[^\\"]+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/"/, 'string', '@pop'],
    ],

    string_single: [
      [/[^\\']+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/'/, 'string', '@pop'],
    ],
  },
};

// Completions provider
export const completionItems = [
  // Estrutura básica
  {
    label: 'projeto',
    kind: 'Keyword',
    insertText: 'projeto "${1:MeuJogo}" versao "${2:1.0}"',
    insertTextRules: 4, // InsertAsSnippet
    documentation: 'Define um novo projeto GcodeForce',
  },
  {
    label: 'cena',
    kind: 'Keyword',
    insertText: 'cena ${1:Principal} {\n\t$0\n}',
    insertTextRules: 4,
    documentation: 'Cria uma nova cena',
  },
  {
    label: 'entidade',
    kind: 'Keyword',
    insertText: 'entidade ${1:Nome} {\n\tmodelo primitivo("${2:cubo}") tamanho(${3:1}, ${4:1}, ${5:1}) cor(${6:#FF0000})\n\t$0\n}',
    insertTextRules: 4,
    documentation: 'Cria uma nova entidade na cena',
  },
  {
    label: 'camera',
    kind: 'Keyword',
    insertText: 'camera posicao(${1:0}, ${2:5}, ${3:-10})',
    insertTextRules: 4,
    documentation: 'Define a câmera da cena',
  },
  {
    label: 'luz',
    kind: 'Keyword',
    insertText: 'luz tipo("${1:direcional}") cor(${2:#FFFFFF})',
    insertTextRules: 4,
    documentation: 'Adiciona uma luz à cena',
  },
  {
    label: 'fisica',
    kind: 'Keyword',
    insertText: 'fisica ativo(${1:true}) massa(${2:1}) gravidade(${3:true})',
    insertTextRules: 4,
    documentation: 'Configura física para a entidade',
  },
  {
    label: 'controle',
    kind: 'Keyword',
    insertText: 'controle teclado("${1:WASD}") velocidade(${2:5})',
    insertTextRules: 4,
    documentation: 'Configura controles para a entidade',
  },
  {
    label: 'script',
    kind: 'Keyword',
    insertText: 'script {\n\tao_iniciar {\n\t\t$0\n\t}\n\t\n\ta_cada_frame {\n\t\t\n\t}\n}',
    insertTextRules: 4,
    documentation: 'Adiciona comportamento scriptado',
  },
  // Primitivas
  ...['cubo', 'esfera', 'cilindro', 'cone', 'plano', 'torus', 'capsula'].map(p => ({
    label: `primitivo("${p}")`,
    kind: 'Value',
    insertText: `primitivo("${p}")`,
    documentation: `Cria um modelo ${p}`,
  })),
  // Funções
  ...builtinFunctions.map(fn => ({
    label: fn,
    kind: 'Function',
    insertText: `${fn}($0)`,
    insertTextRules: 4,
    documentation: `Função ${fn}`,
  })),
];

// Exemplo de código inicial
export const defaultCode = `// 🎮 GcodeForce Studio - Meu Primeiro Jogo
// Use as keywords em português para criar jogos!

projeto "MeuPrimeiroJogo" versao "1.0"

cena Principal {
  // Configuração da câmera
  camera posicao(0, 5, -10) olhar_para(0, 0, 0)
  
  // Iluminação
  luz tipo("ambiente") cor(#404040) intensidade(0.5)
  luz tipo("direcional") cor(#FFFFFF) posicao(5, 10, -5)
  
  // Jogador - cubo vermelho controlável
  entidade Jogador {
    modelo primitivo("cubo") tamanho(1, 1, 1) cor(#E74C3C)
    fisica ativo(true) massa(1) gravidade(true)
    controle teclado("WASD") velocidade(5)
    
    script {
      ao_iniciar {
        log("Jogador criado!")
      }
      
      a_cada_frame {
        // Rotaciona suavemente
        rotacionar(0, 45 * delta_tempo, 0)
      }
      
      ao_colidir(com: "Moeda") {
        pontos = pontos + 10
        destruir(outro)
      }
    }
  }
  
  // Chão - plano verde
  entidade Chao {
    modelo primitivo("plano") tamanho(20, 1, 20) cor(#27AE60)
    fisica estatico(true)
  }
  
  // Algumas moedas para coletar
  entidade Moeda {
    modelo primitivo("cilindro") tamanho(0.5, 0.1, 0.5) cor(#F1C40F)
    posicao(3, 0.5, 3)
    tag("Moeda")
    
    script {
      a_cada_frame {
        rotacionar(0, 90 * delta_tempo, 0)
      }
    }
  }
  
  // Obstáculo
  entidade Obstaculo {
    modelo primitivo("esfera") raio(1) cor(#9B59B6)
    posicao(-3, 1, 2)
    fisica estatico(true)
  }
}

// Interface do usuário
interface HUD {
  texto pontuacao {
    posicao(20, 20)
    fonte("Arial", 24)
    cor(#FFFFFF)
    conteudo("Pontos: " + pontos)
  }
}
`;
