import React, { useEffect, useMemo, useRef, useState } from 'react';

/* ============================================================================
   DADOS DE DOMÍNIO — DISTRITOS, MORADORES, CONSTRUÇÕES, MISSÕES E COLEÇÕES
   ============================================================================ */
const DISTRICTS = [
  {
    id: 'central',
    name: 'Núcleo Central',
    icon: '🏙️',
    desc: 'O coração da cidade. Cada tarefa concluída mantém suas luzes acesas.',
    metric: 'tasks',
    threshold: 0,
    color: 'cyan',
  },
  {
    id: 'academy',
    name: 'Distrito Acadêmico',
    icon: '🎓',
    desc: 'Laboratórios, bibliotecas e centros de pesquisa alimentados pelo conhecimento.',
    metric: 'minutes',
    threshold: 60,
    color: 'violet',
  },
  {
    id: 'green',
    name: 'Jardins BioTech',
    icon: '🌿',
    desc: 'Um refúgio vivo que floresce com hábitos consistentes.',
    metric: 'habits',
    threshold: 3,
    color: 'green',
  },
  {
    id: 'innovation',
    name: 'Distrito de Inovação',
    icon: '🧬',
    desc: 'Oficinas e startups que crescem junto com seus projetos.',
    metric: 'projects',
    threshold: 1,
    color: 'blue',
  },
  {
    id: 'commerce',
    name: 'Mercado Neon',
    icon: '🛍️',
    desc: 'Lojas, personalização e itens para sua vida na cidade.',
    metric: 'goals',
    threshold: 1,
    color: 'pink',
  },
  {
    id: 'arcade',
    name: 'Arcade 88',
    icon: '🕹️',
    desc: 'Desafios de lógica e habilidade para jogar com os moradores.',
    metric: 'xp',
    threshold: 0,
    color: 'orange',
  },
];

const RESIDENTS = [
  {
    id: 'luna',
    name: 'Luna',
    role: 'Estudante de cibernética',
    avatar: '👩🏻‍🎓',
    district: 'academy',
    focus: 'study',
    spriteRow: 0,
    schedule: {
      morning: { x: 11, y: 4, label: 'Caminho da Universidade' },
      afternoon: { x: 10, y: 4, label: 'Pátio Acadêmico' },
      sunset: { x: 8, y: 6, label: 'Praça Central' },
      night: { x: 11, y: 3, label: 'Observatório' },
    },
    storyChapters: [
      {
        affinity: 15,
        title: 'Cap. 1 — Notas à Luz Dourada',
        text: 'Luna revelou que está mapeando como pequenas sessões diárias de estudo estabilizam a rede energética da Universidade.',
      },
      {
        affinity: 45,
        title: 'Cap. 2 — O Protótipo Empático',
        text: 'Ela desenvolveu um visor que traduz progresso real em harmonia sonora para toda a vizinhança, sem jamais punir pausas.',
      },
      {
        affinity: 80,
        title: 'Cap. 3 — Biblioteca Aberta',
        text: 'Graças à sua parceria, Luna inaugurou o arquivo comunitário do Vale Neo, dedicado ao aprendizado contínuo.',
      },
    ],
  },
  {
    id: 'kai',
    name: 'Kai',
    role: 'Engenheiro de sistemas',
    avatar: '🧑🏽‍💻',
    district: 'innovation',
    focus: 'tasks',
    spriteRow: 1,
    schedule: {
      morning: { x: 5, y: 7, label: 'Oficina Sul' },
      afternoon: { x: 4, y: 8, label: 'Laboratório de Inovação' },
      sunset: { x: 7, y: 6, label: 'Avenida Central' },
      night: { x: 5, y: 5, label: 'Poste de Calibração' },
    },
    storyChapters: [
      {
        affinity: 15,
        title: 'Cap. 1 — Engrenagens Silenciosas',
        text: 'Kai prefere pontes de madeira e sensores discretos a torres barulhentas: "Tecnologia boa é a que deixa espaço para respirar."',
      },
      {
        affinity: 45,
        title: 'Cap. 2 — Rede de Micro-Tarefas',
        text: 'Ele conectou o painel de tarefas do Núcleo Central às lanternas das ruas: cada entrega acende um trecho do caminho.',
      },
      {
        affinity: 80,
        title: 'Cap. 3 — Arquitetura Viva',
        text: 'Kai convidou você para coassinar o plano diretor dos novos bairros sustentáveis do Vale Neo.',
      },
    ],
  },
  {
    id: 'maya',
    name: 'Maya',
    role: 'Comerciante do Mercado Neon',
    avatar: '👩🏽‍🔧',
    district: 'commerce',
    focus: 'coins',
    spriteRow: 2,
    schedule: {
      morning: { x: 10, y: 7, label: 'Banca do Mercado' },
      afternoon: { x: 9, y: 8, label: 'Mercado Neon' },
      sunset: { x: 11, y: 7, label: 'Alameda das Lanternas' },
      night: { x: 8, y: 7, label: 'Feira Noturna' },
    },
    storyChapters: [
      {
        affinity: 15,
        title: 'Cap. 1 — Comércio Justo',
        text: 'Maya restaura móveis de madeira e módulos holográficos antigos para que cada casa tenha personalidade própria.',
      },
      {
        affinity: 45,
        title: 'Cap. 2 — Rotas Artesanais',
        text: 'Ela firmou parceria com a Estufa BioTech para trocar colheitas frescas por peças de decoração exclusivas.',
      },
      {
        affinity: 80,
        title: 'Cap. 3 — Coração do Mercado',
        text: 'Maya reservou uma vitrine especial no Mercado Neon em homenagem às suas conquistas na cidade.',
      },
    ],
  },
  {
    id: 'nox',
    name: 'Nox',
    role: 'Treinador de rotina',
    avatar: '🧑🏻‍🚀',
    district: 'green',
    focus: 'habits',
    spriteRow: 3,
    schedule: {
      morning: { x: 14, y: 5, label: 'Trilha dos Jardins' },
      afternoon: { x: 13, y: 4, label: 'Horta Comunitária' },
      sunset: { x: 15, y: 5, label: 'Mirante Verde' },
      night: { x: 12, y: 6, label: 'Ronda Noturna' },
    },
    storyChapters: [
      {
        affinity: 15,
        title: 'Cap. 1 — Ritmo Orgânico',
        text: 'Nox cuida dos canteiros da Estufa e lembra sempre: "Plantas não crescem puxando as folhas, e sim regando aos poucos."',
      },
      {
        affinity: 45,
        title: 'Cap. 2 — Sementes Raras',
        text: 'Ele compartilhou mudas bio-luminescentes que respondem diretamente às suas sessões de foco.',
      },
      {
        affinity: 80,
        title: 'Cap. 3 — Guardião do Bosque',
        text: 'Com sua constância, Nox transformou o setor leste em um santuário botânico aberto a todos os moradores.',
      },
    ],
  },
  {
    id: 'iris',
    name: 'Íris',
    role: 'Bibliotecária de dados',
    avatar: '🧝🏻‍♀️',
    district: 'academy',
    focus: 'reading',
    spriteRow: 4,
    schedule: {
      morning: { x: 6, y: 4, label: 'Alameda Oeste' },
      afternoon: { x: 9, y: 4, label: 'Jardim de Leitura' },
      sunset: { x: 4, y: 5, label: 'Praça do Núcleo' },
      night: { x: 9, y: 3, label: 'Arquivo Silencioso' },
    },
    storyChapters: [
      {
        affinity: 15,
        title: 'Cap. 1 — Cristais de Memória',
        text: 'Íris cataloga livros, artigos e descobertas em pequenos cristais lilás que flutuam pela biblioteca.',
      },
      {
        affinity: 45,
        title: 'Cap. 2 — Crônicas do Vale',
        text: 'Ela reuniu relatos sobre como o Vale Neo nasceu da união entre artesãos, botânicos e programadores.',
      },
      {
        affinity: 80,
        title: 'Cap. 3 — Arquivo Vivo',
        text: 'Íris nomeou você Curador Honorário da Coleção de Conhecimento da cidade.',
      },
    ],
  },
];

const WORLD_BUILDINGS = [
  {
    id: 'player-home',
    name: 'Minha Casa',
    district: 'central',
    icon: '🏡',
    x: 1,
    y: 4,
    w: 3,
    h: 2,
    door: { x: 2, y: 6 },
    spriteCol: 0,
    spriteRow: 2,
    isHome: true,
    description: 'Seu refúgio pessoal no Vale Neo com cômodos decoráveis.',
    rooms: ['Sala de Estar', 'Estúdio & Quarto', 'Varanda Botânica'],
  },
  {
    id: 'central-hub',
    name: 'Núcleo Central',
    district: 'central',
    icon: '🏢',
    x: 4,
    y: 1,
    w: 3,
    h: 2,
    door: { x: 5, y: 3 },
    spriteCol: 0,
    spriteRow: 0,
    description: 'Central de operações, tarefas reais e ponto de encontro.',
    rooms: ['Painel de tarefas', 'Central de missões', 'Terminal cívico'],
  },
  {
    id: 'university',
    name: 'Universidade Neon',
    district: 'academy',
    icon: '🎓',
    x: 9,
    y: 1,
    w: 3,
    h: 2,
    door: { x: 10, y: 3 },
    spriteCol: 1,
    spriteRow: 0,
    description: 'Salas de estudo, biblioteca e laboratório de foco.',
    rooms: [
      'Biblioteca holográfica',
      'Cabine de foco profundo',
      'Arquivo de leituras',
    ],
  },
  {
    id: 'greenhouse',
    name: 'Estufa BioTech',
    district: 'green',
    icon: '🌿',
    x: 15,
    y: 1,
    w: 3,
    h: 2,
    door: { x: 16, y: 3 },
    spriteCol: 2,
    spriteRow: 0,
    description: 'Um refúgio verde alimentado por seus hábitos e foco.',
    rooms: ['Jardim de hábitos', 'Laboratório botânico', 'Banco de sementes'],
  },
  {
    id: 'innovation-lab',
    name: 'Laboratório de Inovação',
    district: 'innovation',
    icon: '🧬',
    x: 3,
    y: 9,
    w: 3,
    h: 2,
    door: { x: 4, y: 8 },
    spriteCol: 0,
    spriteRow: 1,
    description: 'Oficinas, protótipos e incubadoras de projetos.',
    rooms: ['Oficina de protótipos', 'Sala de projetos', 'Núcleo de robótica'],
  },
  {
    id: 'neon-market',
    name: 'Mercado Neon',
    district: 'commerce',
    icon: '🛍️',
    x: 8,
    y: 9,
    w: 3,
    h: 2,
    door: { x: 9, y: 8 },
    spriteCol: 1,
    spriteRow: 1,
    description: 'Lojas, móveis para sua casa e equipamentos.',
    rooms: ['Loja de móveis', 'Ateliê de roupas', 'Balcão de trocas'],
  },
  {
    id: 'arcade-88',
    name: 'Arcade 88',
    district: 'arcade',
    icon: '🕹️',
    x: 15,
    y: 9,
    w: 3,
    h: 2,
    door: { x: 16, y: 8 },
    spriteCol: 2,
    spriteRow: 1,
    description: 'Salão de jogos, corrida hoverboard e desafios lógicos.',
    rooms: ['Arena de memória', 'Pista Hoverboard', 'Circuito lógico'],
  },
];

// Canteiros cultiváveis no jardim (sincronizados com foco real e ciclos)
const GARDEN_PLOTS = [
  { id: 'plot-1', x: 13, y: 2, label: 'Canteiro Norte 1' },
  { id: 'plot-2', x: 14, y: 2, label: 'Canteiro Norte 2' },
  { id: 'plot-3', x: 13, y: 3, label: 'Canteiro Central 1' },
  { id: 'plot-4', x: 14, y: 3, label: 'Canteiro Central 2' },
  { id: 'plot-5', x: 12, y: 9, label: 'Canteiro Sul 1' },
  { id: 'plot-6', x: 13, y: 9, label: 'Canteiro Sul 2' },
  { id: 'plot-7', x: 12, y: 10, label: 'Canteiro Sul 3' },
  { id: 'plot-8', x: 13, y: 10, label: 'Canteiro Sul 4' },
];

const SEED_SPECIES = [
  {
    id: 'mint-lumen',
    name: 'Hortelã-Lúmen',
    icon: '🌱',
    color: 'G4',
    focusMinutesNeeded: 15,
    sellPrice: 14,
    xpReward: 15,
    desc: 'Folhas verde-claras que brilham suavemente após sessões de estudo.',
  },
  {
    id: 'lilac-fern',
    name: 'Samambaia Lilás',
    icon: '🪻',
    color: 'L3',
    focusMinutesNeeded: 30,
    sellPrice: 24,
    xpReward: 25,
    desc: 'Espécie híbrida cultivada pela Luna e pelo Nox nos jardins.',
  },
  {
    id: 'sun-berry',
    name: 'Fruta-Dourada',
    icon: '🍋',
    color: 'Y3',
    focusMinutesNeeded: 45,
    sellPrice: 36,
    xpReward: 35,
    desc: 'Fruto energético doce apreciado por todos os moradores.',
  },
  {
    id: 'teal-lotus',
    name: 'Lótus Petróleo',
    icon: '🪷',
    color: 'T4',
    focusMinutesNeeded: 60,
    sellPrice: 50,
    xpReward: 50,
    desc: 'Flor rara que desabrocha apenas com foco profundo e constância.',
  },
];

const FISH_SPECIES = [
  {
    id: 'carpa-dourada',
    name: 'Carpa-Dourada do Vale',
    rarity: 'Comum',
    icon: '🐟',
    coins: 12,
    xp: 12,
    desc: 'Nada perto das lanternas do cais ao entardecer.',
  },
  {
    id: 'tetra-petroleo',
    name: 'Tetra Azul-Petróleo',
    rarity: 'Comum',
    icon: '🐠',
    coins: 16,
    xp: 16,
    desc: 'Escamas refletem a cor das águas limpas do canal.',
  },
  {
    id: 'enguia-lilas',
    name: 'Enguia Bio-Lilás',
    rarity: 'Incomum',
    icon: '🐡',
    coins: 26,
    xp: 24,
    desc: 'Emite pulsos suaves de bioluminescência rítmica.',
  },
  {
    id: 'koi-solar',
    name: 'Koi Circuito-Solar',
    rarity: 'Raro',
    icon: '🎏',
    coins: 42,
    xp: 38,
    desc: 'Padrões geométricos dourados lembram trilhas de microchip.',
  },
  {
    id: 'arraia-cristal',
    name: 'Arraia de Cristal',
    rarity: 'Épico',
    icon: '🦈',
    coins: 65,
    xp: 55,
    desc: 'Desliza silenciosamente sob a superfície do lago oeste.',
  },
];

const STORE_ITEMS = [
  {
    id: 'wood-sofa',
    name: 'Sofá de Madeira & Linho',
    category: 'Decoração',
    type: 'Móvel',
    icon: '🛋️',
    price: 30,
    spriteTile: { col: 4, row: 3 },
    description: 'Assento confortável em madeira natural para sua sala.',
  },
  {
    id: 'holo-plant',
    name: 'Planta Holográfica',
    category: 'Decoração',
    type: 'Móvel',
    icon: '🪴',
    price: 35,
    spriteTile: { col: 7, row: 3 },
    description: 'Um toque de natureza bio-luminescente para seu lar.',
  },
  {
    id: 'study-desk',
    name: 'Mesa de Estudo & Terminal',
    category: 'Decoração',
    type: 'Móvel',
    icon: '🖥️',
    price: 50,
    spriteTile: { col: 6, row: 3 },
    description: 'Bancada de madeira com visor integrado para sua casa.',
  },
  {
    id: 'cozy-bed',
    name: 'Cama Artesanal Lilás',
    category: 'Decoração',
    type: 'Móvel',
    icon: '🛏️',
    price: 60,
    spriteTile: { col: 5, row: 3 },
    description: 'Cama de madeira acolhedora com manta lilás e dourada.',
  },
  {
    id: 'neon-sign',
    name: 'Luminária Dourada de Parede',
    category: 'Decoração',
    type: 'Móvel',
    icon: '💡',
    price: 45,
    spriteTile: { col: 7, row: 3 },
    description: 'Ilumina seu cômodo com luz quente acolhedora.',
  },
  {
    id: 'drone-pet',
    name: 'Drone Companheiro',
    category: 'Companheiros',
    type: 'Companheiro',
    icon: '🤖',
    price: 90,
    equipSlot: 'companion',
    description:
      'Um pequeno robô amigável que acompanha seus passos na cidade.',
  },
  {
    id: 'streetwear',
    name: 'Jaqueta Explorador Lilás',
    category: 'Roupas',
    type: 'Traje',
    icon: '🧥',
    price: 85,
    equipSlot: 'outfit',
    outfitKey: 'lilac',
    description: 'Traje cotidiano lilás com acabamento dourado.',
  },
  {
    id: 'botanist-coat',
    name: 'Túnica Botânica Verde',
    category: 'Roupas',
    type: 'Traje',
    icon: '🦺',
    price: 85,
    equipSlot: 'outfit',
    outfitKey: 'green',
    description: 'Ideal para cuidar dos jardins e explorar trilhas.',
  },
  {
    id: 'skyboard',
    name: 'Hoverboard Urbano',
    category: 'Equipamentos',
    type: 'Mobilidade',
    icon: '🛹',
    price: 140,
    equipSlot: 'mobility',
    description: 'Deslize pelas ruas com velocidade dobrada e trilha dourada.',
  },
  {
    id: 'bio-rod',
    name: 'Vara de Pesca Bio-Tech',
    category: 'Equipamentos',
    type: 'Ferramenta',
    icon: '🎣',
    price: 65,
    equipSlot: 'tool',
    description: 'Aumenta a janela de captura no cais de pesca do lago.',
  },
];

const SEASONAL_FESTIVALS = [
  {
    id: 'lantern-festival',
    season: 'Primavera',
    months: [8, 9, 10], // Set, Out, Nov
    name: 'Festival das Lanternas Douradas',
    icon: '🏮',
    bannerColor: 'Y3',
    desc: 'As ruas recebem lanternas de madeira e luzes douradas celebrando novos começos e metas.',
    bonusText: '+20% moedas em colheitas e pesca durante o festival.',
    giftItem: 'holo-plant',
  },
  {
    id: 'solstice-market',
    season: 'Verão',
    months: [11, 0, 1], // Dez, Jan, Fev
    name: 'Feira Solar & Copa Hoverboard',
    icon: '☀️',
    bannerColor: 'T4',
    desc: 'Competições amistosas na pista oeste e barracas artesanais na praça central.',
    bonusText: 'Entrada gratuita na Corrida de Hoverboard.',
    giftItem: 'skyboard',
  },
  {
    id: 'harvest-bio',
    season: 'Outono',
    months: [2, 3, 4], // Mar, Abr, Mai
    name: 'Colheita BioTech',
    icon: '🍂',
    bannerColor: 'G4',
    desc: 'Nox e Maya organizam a troca comunitária de sementes raras e receitas.',
    bonusText: 'Crescimento acelerado nos canteiros do jardim.',
    giftItem: 'wood-sofa',
  },
  {
    id: 'starlight-academy',
    season: 'Inverno',
    months: [5, 6, 7], // Jun, Jul, Ago
    name: 'Noite das Estrelas Acadêmicas',
    icon: '✨',
    bannerColor: 'L3',
    desc: 'Luna e Íris abrem o observatório para sessões coletivas de leitura e estudo.',
    bonusText: '+10 XP bônus por sessão de foco registrada.',
    giftItem: 'study-desk',
  },
];

const WORLD_PROPS = [
  { id: 'lamp-1', type: 'lamp', x: 7, y: 4, solid: true },
  { id: 'lamp-2', type: 'lamp', x: 11, y: 4, solid: true },
  { id: 'lamp-3', type: 'lamp', x: 7, y: 8, solid: true },
  { id: 'lamp-4', type: 'lamp', x: 11, y: 8, solid: true },
  { id: 'bench-1', type: 'bench', x: 8, y: 5, solid: true },
  { id: 'bench-2', type: 'bench', x: 9, y: 5, solid: false },
  { id: 'holo-1', type: 'holo', x: 7, y: 6, solid: true },
  { id: 'holo-2', type: 'holo', x: 12, y: 6, solid: true },
  { id: 'terminal-1', type: 'terminal', x: 6, y: 3, solid: true },
  { id: 'dock-sign', type: 'fishing-spot', x: 2, y: 2, solid: false },
  { id: 'track-sign', type: 'race-spot', x: 1, y: 8, solid: false },
  { id: 'crystal-1', type: 'crystal', x: 3, y: 2, solid: true },
  { id: 'crystal-2', type: 'crystal', x: 18, y: 4, solid: true },
  { id: 'crystal-3', type: 'crystal', x: 1, y: 11, solid: true },
  { id: 'tree-1', type: 'tree-lantern', x: 7, y: 1, solid: true },
  { id: 'tree-2', type: 'tree', x: 8, y: 2, solid: true },
  { id: 'tree-3', type: 'tree', x: 12, y: 1, solid: true },
  { id: 'tree-4', type: 'tree-lantern', x: 14, y: 9, solid: true },
  { id: 'tree-5', type: 'tree', x: 7, y: 10, solid: true },
  { id: 'bush-1', type: 'bush', x: 1, y: 3, solid: false },
  { id: 'bush-2', type: 'bush', x: 8, y: 3, solid: false },
  { id: 'bush-3', type: 'bush', x: 11, y: 10, solid: false },
  { id: 'bush-4', type: 'bush', x: 6, y: 11, solid: false },
];

/* ============================================================================
   SPRITE FORGE 16-BIT — GERADOR PROCEDURAL DE SPRITESHEETS PNG TRANSPARENTES
   Paleta: Verde natural, Madeira, Azul-petróleo, Lilás e Luzes Douradas
   ============================================================================ */
const PALETTE = {
  O: '#1c262b',
  W1: '#523422',
  W2: '#7d5136',
  W3: '#a8734d',
  W4: '#cfa074',
  G1: '#234736',
  G2: '#376e4d',
  G3: '#53995f',
  G4: '#7ec272',
  G5: '#b2de8e',
  T1: '#163d4a',
  T2: '#236373',
  T3: '#388e99',
  T4: '#6ec2c9',
  T5: '#b6ebed',
  L1: '#463669',
  L2: '#6b5399',
  L3: '#957bc7',
  L4: '#c7b3eb',
  Y1: '#94601c',
  Y2: '#cf9132',
  Y3: '#f5c451',
  Y4: '#fff0a6',
  S1: '#b57860',
  S2: '#e0a587',
  S3: '#f5ccb5',
  P1: '#85513f',
  P2: '#ad725b',
  P3: '#d49980',
  H1: '#262236',
  H2: '#413a57',
  R1: '#5c6670',
  R2: '#84909c',
  R3: '#aeb8c2',
  C1: '#d8e2e6',
  C2: '#f4f8fa',
};

function createPixelCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return {
    canvas,
    ctx,
    px(x, y, colorKey) {
      if (!colorKey) return;
      ctx.fillStyle = PALETTE[colorKey] || colorKey;
      ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
    },
    rect(x, y, w, h, colorKey) {
      if (!colorKey || w <= 0 || h <= 0) return;
      ctx.fillStyle = PALETTE[colorKey] || colorKey;
      ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
    },
    box(x, y, w, h, fillKey, borderKey = 'O') {
      this.rect(x, y, w, h, borderKey);
      if (w > 2 && h > 2) {
        this.rect(x + 1, y + 1, w - 2, h - 2, fillKey);
      }
    },
  };
}

// 1. Jogador 32x32 px customizável — 4 direções x 4 quadros de caminhada (128x128 px)
function generatePlayerSheet(appearance = {}) {
  const g = createPixelCanvas(128, 128);
  const dirs = ['down', 'up', 'left', 'right'];

  const skinMap = {
    light: 'S3',
    warm: 'S2',
    tan: 'P3',
    deep: 'P2',
  };
  const hairMap = {
    dark: ['H1', 'H2'],
    wood: ['W1', 'W3'],
    lilac: ['L1', 'L3'],
    gold: ['Y1', 'Y3'],
    teal: ['T1', 'T3'],
  };
  const outfitMap = {
    teal: ['T3', 'T4', 'T2', 'Y3'],
    lilac: ['L2', 'L3', 'L1', 'Y3'],
    green: ['G3', 'G4', 'G2', 'Y3'],
    gold: ['Y2', 'Y3', 'W2', 'T4'],
  };

  const skin = skinMap[appearance.skin] || 'S2';
  const [hairMain, hairHi] = hairMap[appearance.hairColor] || ['H1', 'H2'];
  const [coatMain, coatHi, coatDark, coatTrim] = outfitMap[
    appearance.outfitColor
  ] || ['T3', 'T4', 'T2', 'Y3'];
  const packMain = appearance.packStyle === 'tech' ? 'T2' : 'W3';
  const packCore = appearance.packStyle === 'gold' ? 'Y3' : 'L3';

  dirs.forEach((dir, row) => {
    for (let frame = 0; frame < 4; frame++) {
      const ox = frame * 32;
      const oy = row * 32;
      const walkBob = frame === 1 || frame === 3 ? -1 : 0;
      const leftStep = frame === 1 ? -2 : frame === 3 ? 1 : 0;
      const rightStep = frame === 3 ? -2 : frame === 1 ? 1 : 0;

      g.rect(ox + 10, oy + 29, 12, 2, 'rgba(20, 32, 34, 0.38)');

      if (dir === 'down' || dir === 'up') {
        g.box(ox + 11, oy + 23 + leftStep, 4, 6, 'T1');
        g.box(ox + 17, oy + 23 + rightStep, 4, 6, 'T1');
        g.rect(ox + 11, oy + 27 + leftStep, 4, 2, 'W2');
        g.rect(ox + 17, oy + 27 + rightStep, 4, 2, 'W2');
        g.px(ox + 12, oy + 27 + leftStep, 'Y3');
        g.px(ox + 18, oy + 27 + rightStep, 'Y3');

        if (dir === 'down') {
          g.box(ox + 7, oy + 14 + walkBob, 3, 8, packMain);
          g.box(ox + 22, oy + 14 + walkBob, 3, 8, packMain);
          g.px(ox + 8, oy + 15 + walkBob, packCore);
          g.px(ox + 23, oy + 15 + walkBob, packCore);
        }

        g.box(ox + 9, oy + 14 + walkBob, 14, 10, coatMain);
        g.rect(ox + 10, oy + 15 + walkBob, 12, 3, coatHi);
        g.rect(ox + 10, oy + 21 + walkBob, 12, 2, coatDark);
        g.rect(ox + 12, oy + 14 + walkBob, 8, 2, coatTrim);
        if (dir === 'down') {
          g.rect(ox + 15, oy + 16 + walkBob, 2, 6, 'Y2');
          g.px(ox + 12, oy + 17 + walkBob, 'L4');
        }

        const armSwing = frame === 1 ? 1 : frame === 3 ? -1 : 0;
        g.box(ox + 6, oy + 15 + walkBob + armSwing, 3, 7, coatDark);
        g.box(ox + 23, oy + 15 + walkBob - armSwing, 3, 7, coatDark);
        g.px(ox + 7, oy + 21 + walkBob + armSwing, skin);
        g.px(ox + 24, oy + 21 + walkBob - armSwing, skin);

        if (dir === 'up') {
          g.box(ox + 10, oy + 13 + walkBob, 12, 10, packMain);
          g.rect(ox + 11, oy + 14 + walkBob, 10, 2, 'W4');
          g.box(ox + 12, oy + 16 + walkBob, 8, 5, 'T2');
          g.rect(
            ox + 14,
            oy + 17 + walkBob,
            4,
            3,
            frame % 2 === 0 ? packCore : 'L4',
          );
          g.px(ox + 13, oy + 15 + walkBob, 'Y3');
          g.px(ox + 18, oy + 15 + walkBob, 'Y3');
          g.rect(ox + 20, oy + 9 + walkBob, 1, 4, 'R3');
          g.px(ox + 20, oy + 8 + walkBob, 'Y4');
        }

        g.box(
          ox + 9,
          oy + 4 + walkBob,
          14,
          11,
          dir === 'down' ? skin : hairMain,
        );
        if (dir === 'down') {
          g.rect(ox + 9, oy + 4 + walkBob, 14, 4, hairMain);
          g.rect(ox + 10, oy + 5 + walkBob, 12, 2, hairHi);
          if (appearance.hairStyle === 'long') {
            g.rect(ox + 8, oy + 7 + walkBob, 2, 7, hairMain);
            g.rect(ox + 22, oy + 7 + walkBob, 2, 7, hairMain);
          } else if (appearance.hairStyle === 'spiky') {
            g.px(ox + 11, oy + 3 + walkBob, hairHi);
            g.px(ox + 15, oy + 2 + walkBob, hairMain);
            g.px(ox + 19, oy + 3 + walkBob, hairHi);
          }
          g.rect(ox + 8, oy + 8 + walkBob, 2, 3, 'T3');
          g.px(ox + 8, oy + 9 + walkBob, 'Y3');
          g.rect(ox + 12, oy + 9 + walkBob, 2, 2, 'O');
          g.rect(ox + 18, oy + 9 + walkBob, 2, 2, 'O');
          g.px(ox + 12, oy + 9 + walkBob, 'C2');
          g.px(ox + 18, oy + 9 + walkBob, 'C2');
        } else {
          g.rect(ox + 10, oy + 5 + walkBob, 12, 8, hairHi);
          g.rect(ox + 12, oy + 7 + walkBob, 8, 2, coatMain);
        }
      } else {
        const isLeft = dir === 'left';
        const stepOffset = frame === 1 ? -2 : frame === 3 ? 2 : 0;

        g.box(ox + 13 - stepOffset, oy + 23, 4, 6, 'T1');
        g.box(ox + 15 + stepOffset, oy + 23, 4, 6, 'T2');
        g.rect(ox + 13 - stepOffset, oy + 27, 4, 2, 'W2');
        g.rect(ox + 15 + stepOffset, oy + 27, 4, 2, 'W3');

        const packX = isLeft ? ox + 19 : ox + 7;
        g.box(packX, oy + 13 + walkBob, 6, 10, packMain);
        g.rect(packX + 1, oy + 15 + walkBob, 4, 4, 'T2');
        g.rect(
          packX + 2,
          oy + 16 + walkBob,
          2,
          2,
          frame % 2 === 0 ? packCore : 'Y3',
        );
        g.rect(packX + 2, oy + 9 + walkBob, 1, 4, 'R3');
        g.px(packX + 2, oy + 8 + walkBob, 'Y4');

        const bodyX = isLeft ? ox + 10 : ox + 11;
        g.box(bodyX, oy + 14 + walkBob, 11, 10, coatMain);
        g.rect(bodyX + 1, oy + 14 + walkBob, 9, 2, coatTrim);

        const armX = ox + 14 + Math.round(stepOffset * 0.6);
        g.box(armX, oy + 16 + walkBob, 4, 6, coatHi);
        g.px(armX + 1, oy + 21 + walkBob, skin);

        const headX = isLeft ? ox + 9 : ox + 11;
        g.box(headX, oy + 4 + walkBob, 12, 11, skin);
        g.rect(headX, oy + 4 + walkBob, 12, 4, hairMain);
        if (isLeft) {
          g.rect(headX + 7, oy + 6 + walkBob, 5, 7, hairMain);
          g.rect(headX + 2, oy + 9 + walkBob, 2, 2, 'O');
          g.px(headX + 2, oy + 9 + walkBob, 'C2');
          g.rect(headX + 6, oy + 8 + walkBob, 3, 3, 'T3');
          g.px(headX + 7, oy + 9 + walkBob, 'Y3');
        } else {
          g.rect(headX, oy + 6 + walkBob, 5, 7, hairMain);
          g.rect(headX + 8, oy + 9 + walkBob, 2, 2, 'O');
          g.px(headX + 9, oy + 9 + walkBob, 'C2');
          g.rect(headX + 3, oy + 8 + walkBob, 3, 3, 'T3');
          g.px(headX + 4, oy + 9 + walkBob, 'Y3');
        }
      }
    }
  });

  return g.canvas.toDataURL('image/png');
}

// 2. Moradores 32x48 px — Luna, Kai, Maya, Nox e Íris (128x240 px)
function generateResidentsSheet() {
  const g = createPixelCanvas(128, 240);
  const configs = [
    {
      skin: 'S2',
      hair: 'L1',
      hairHi: 'L3',
      coat: 'L2',
      accent: 'Y3',
      pants: 'T1',
      prop: 'tablet',
    },
    {
      skin: 'P2',
      hair: 'H1',
      hairHi: 'H2',
      coat: 'W3',
      accent: 'T3',
      pants: 'T1',
      prop: 'visor',
    },
    {
      skin: 'P3',
      hair: 'H2',
      hairHi: 'Y3',
      coat: 'T3',
      accent: 'W3',
      pants: 'W1',
      prop: 'lantern',
    },
    {
      skin: 'S2',
      hair: 'H1',
      hairHi: 'G4',
      coat: 'G3',
      accent: 'Y3',
      pants: 'T1',
      prop: 'band',
    },
    {
      skin: 'S3',
      hair: 'L3',
      hairHi: 'L4',
      coat: 'T2',
      accent: 'L3',
      pants: 'L1',
      prop: 'crystal',
    },
  ];

  configs.forEach((cfg, row) => {
    for (let frame = 0; frame < 4; frame++) {
      const ox = frame * 32;
      const oy = row * 48;
      const breath = frame === 1 || frame === 2 ? -1 : 0;
      const floatY = frame === 0 ? 0 : frame === 1 ? -1 : frame === 2 ? -2 : -1;

      g.rect(ox + 9, oy + 44, 14, 2, 'rgba(18, 30, 32, 0.38)');
      g.box(ox + 11, oy + 34, 4, 10, cfg.pants);
      g.box(ox + 17, oy + 34, 4, 10, cfg.pants);
      g.rect(ox + 11, oy + 41, 4, 3, 'W2');
      g.rect(ox + 17, oy + 41, 4, 3, 'W2');

      g.box(ox + 9, oy + 20 + breath, 14, 15, cfg.coat);
      g.rect(ox + 11, oy + 21 + breath, 10, 3, cfg.accent);
      g.rect(ox + 14, oy + 24 + breath, 4, 9, cfg.accent);

      g.box(ox + 6, oy + 21 + breath, 3, 11, cfg.coat);
      g.box(ox + 23, oy + 21 + breath, 3, 11, cfg.coat);
      g.rect(ox + 6, oy + 30 + breath, 3, 2, cfg.skin);
      g.rect(ox + 23, oy + 30 + breath, 3, 2, cfg.skin);

      if (row === 0 || row === 4) {
        g.box(ox + 8, oy + 9 + breath, 16, 17, cfg.hair);
      }

      g.box(ox + 9, oy + 7 + breath, 14, 13, cfg.skin);
      g.rect(ox + 9, oy + 7 + breath, 14, 5, cfg.hair);
      g.rect(ox + 10, oy + 8 + breath, 12, 2, cfg.hairHi);

      g.rect(ox + 12, oy + 13 + breath, 2, 2, 'O');
      g.rect(ox + 18, oy + 13 + breath, 2, 2, 'O');
      g.px(ox + 12, oy + 13 + breath, 'C2');
      g.px(ox + 18, oy + 13 + breath, 'C2');

      if (cfg.prop === 'tablet') {
        g.box(ox + 21, oy + 25 + breath, 6, 5, 'T2');
        g.rect(ox + 22, oy + 26 + breath, 4, 3, frame % 2 === 0 ? 'L4' : 'T5');
      } else if (cfg.prop === 'visor') {
        g.rect(ox + 10, oy + 10 + breath, 12, 2, 'T4');
        g.px(ox + 15, oy + 10 + breath, 'Y4');
      } else if (cfg.prop === 'lantern') {
        g.rect(ox + 11, oy + 5 + breath, 10, 2, 'Y3');
        g.box(ox + 23, oy + 27 + breath, 4, 5, 'Y3');
        g.rect(ox + 24, oy + 28 + breath, 2, 3, 'Y4');
      } else if (cfg.prop === 'band') {
        g.rect(ox + 9, oy + 10 + breath, 14, 2, 'Y3');
        g.rect(ox + 6, oy + 28 + breath, 3, 2, 'T4');
      } else if (cfg.prop === 'crystal') {
        g.px(ox + 26, oy + 14 + floatY, 'L4');
        g.rect(ox + 25, oy + 15 + floatY, 3, 4, 'L3');
        g.px(ox + 26, oy + 16 + floatY, 'Y4');
        g.px(ox + 26, oy + 19 + floatY, 'L2');
      }
    }
  });

  return g.canvas.toDataURL('image/png');
}

// 3. Terrenos, 4 estágios de plantas e móveis de casa (128x112 px)
function generateTerrainSheet() {
  const g = createPixelCanvas(128, 112);

  // Row 0 (y = 0): Grama (5), Arbusto, Cristais (2)
  for (let i = 0; i < 5; i++) {
    const ox = i * 16;
    g.rect(ox, 0, 16, 16, i === 4 ? 'G2' : 'G3');
    g.px(ox + 3, 3, 'G4');
    g.px(ox + 4, 2, 'G4');
    g.px(ox + 11, 6, 'G4');
    g.px(ox + 12, 5, 'G5');
    g.px(ox + 6, 12, 'G2');
    g.px(ox + 13, 13, 'G4');
    if (i === 1) {
      g.rect(ox + 2, 8, 1, 3, 'G5');
      g.rect(ox + 4, 7, 1, 4, 'G4');
      g.rect(ox + 10, 10, 1, 3, 'G5');
    } else if (i === 2) {
      g.px(ox + 4, 4, 'Y3');
      g.px(ox + 5, 4, 'Y4');
      g.px(ox + 11, 10, 'Y3');
    } else if (i === 3) {
      g.px(ox + 5, 5, 'L3');
      g.px(ox + 6, 5, 'L4');
      g.px(ox + 10, 4, 'L3');
    } else if (i === 4) {
      g.rect(ox + 3, 4, 2, 2, 'G4');
      g.rect(ox + 10, 9, 2, 2, 'G4');
    }
  }

  const bx = 80;
  g.rect(bx + 3, 13, 10, 2, 'G1');
  g.box(bx + 2, 4, 12, 10, 'G2');
  g.rect(bx + 3, 5, 10, 6, 'G3');
  g.rect(bx + 4, 5, 7, 3, 'G4');
  g.px(bx + 5, 7, 'Y3');
  g.px(bx + 10, 8, 'L4');

  for (let f = 0; f < 2; f++) {
    const cx = (6 + f) * 16;
    g.rect(cx + 3, 12, 10, 3, 'R1');
    g.box(cx + 6, 3, 4, 9, 'T3');
    g.rect(cx + 7, 4, 1, 6, f === 0 ? 'T5' : 'Y4');
    g.box(cx + 3, 6, 3, 6, 'L2');
    g.box(cx + 10, 7, 3, 5, 'L3');
  }

  // Row 1 (y = 16): Terra (2), Pedra (2), Calçada madeira, Piso casa, Parede casa, Tapete
  g.rect(0, 16, 16, 16, 'W3');
  g.px(3, 19, 'W4');
  g.px(11, 21, 'W2');
  g.rect(16, 16, 16, 16, 'W3');
  g.rect(19, 20, 2, 2, 'W2');
  g.rect(26, 25, 2, 1, 'W4');

  g.rect(32, 16, 16, 16, 'R1');
  g.rect(33, 17, 6, 6, 'R2');
  g.rect(40, 17, 7, 6, 'R2');
  g.rect(33, 24, 8, 7, 'R2');
  g.rect(42, 24, 5, 7, 'R2');

  g.rect(48, 16, 16, 16, 'R1');
  g.rect(49, 17, 14, 14, 'R2');
  g.rect(54, 22, 4, 4, 'T2');
  g.rect(55, 23, 2, 2, 'Y3');

  g.rect(64, 16, 16, 16, 'W1');
  for (let py = 17; py < 31; py += 4) {
    g.rect(65, py, 14, 3, 'W3');
    g.rect(65, py, 14, 1, 'W4');
  }

  g.rect(80, 16, 16, 16, 'W2');
  g.rect(80, 16, 8, 7, 'W3');
  g.rect(81, 17, 6, 2, 'W4');
  g.rect(88, 24, 8, 7, 'W3');

  g.rect(96, 16, 16, 16, 'T1');
  g.rect(96, 17, 16, 8, 'T2');
  g.rect(96, 25, 16, 1, 'Y3');
  g.rect(96, 26, 16, 6, 'W2');

  g.rect(112, 16, 16, 16, 'L1');
  g.rect(113, 17, 14, 14, 'Y3');
  g.rect(114, 18, 12, 12, 'L2');
  g.rect(116, 20, 8, 8, 'L3');

  // Row 2 (y = 32): 6 frames Água Animada + Andaime Construção (col 6) + Canteiro Vazio (col 7)
  for (let f = 0; f < 6; f++) {
    const wx = f * 16;
    g.rect(wx, 32, 16, 16, 'T2');
    g.rect(wx, 32, 16, 3, 'T1');
    const shift = (f * 3) % 14;
    g.rect(wx + ((2 + shift) % 11), 36, 5, 1, 'T4');
    g.rect(wx + ((7 + shift) % 10), 40, 6, 1, 'T5');
    g.rect(wx + ((4 + shift) % 11), 44, 4, 1, 'T4');
  }

  // (6, 2) Andaime de construção de bairro
  g.rect(97, 34, 2, 13, 'W3');
  g.rect(109, 34, 2, 13, 'W3');
  g.rect(96, 37, 16, 2, 'W4');
  g.rect(96, 43, 16, 2, 'W4');
  g.rect(99, 33, 10, 3, 'Y3');

  // (7, 2) Canteiro arado vazio
  g.box(113, 33, 14, 14, 'W2', 'W1');
  g.rect(115, 35, 10, 2, 'W1');
  g.rect(115, 39, 10, 2, 'W1');
  g.rect(115, 43, 10, 2, 'W1');

  // Row 3 (y = 48): 4 Estágios de Plantas (cols 0..3) + 4 Móveis de Casa (cols 4..7)
  for (let stage = 0; stage < 4; stage++) {
    const sx = stage * 16;
    g.box(sx + 1, 49, 14, 14, 'W2', 'W1');
    if (stage === 0) {
      // Sementes
      [4, 8, 11].forEach((pxX) => {
        g.rect(sx + pxX, 53, 2, 2, 'Y3');
        g.rect(sx + pxX, 58, 2, 2, 'Y3');
      });
    } else if (stage === 1) {
      // Brotos verdes
      [4, 8, 11].forEach((pxX) => {
        g.rect(sx + pxX, 52, 2, 3, 'G4');
        g.rect(sx + pxX, 57, 2, 3, 'G4');
      });
    } else if (stage === 2) {
      // Folhagem cheia
      [3, 7, 10].forEach((pxX) => {
        g.rect(sx + pxX, 51, 3, 4, 'G3');
        g.px(sx + pxX + 1, 51, 'G5');
        g.rect(sx + pxX, 56, 3, 4, 'G3');
      });
    } else {
      // Pronta para colheita com flores douradas e lilás
      [3, 7, 10].forEach((pxX) => {
        g.rect(sx + pxX, 50, 3, 5, 'G4');
        g.rect(sx + pxX, 50, 2, 2, 'Y3');
        g.rect(sx + pxX, 56, 3, 5, 'G4');
        g.rect(sx + pxX + 1, 56, 2, 2, 'L4');
      });
    }
  }

  // (4, 3) Sofá de madeira e linho
  g.box(65, 51, 14, 11, 'W3');
  g.rect(67, 54, 10, 6, 'L3');
  g.rect(67, 54, 10, 2, 'L4');

  // (5, 3) Cama artesanal lilás
  g.box(81, 49, 14, 14, 'W2');
  g.rect(82, 50, 12, 4, 'C2');
  g.rect(82, 54, 12, 8, 'L2');
  g.rect(82, 54, 12, 2, 'Y3');

  // (6, 3) Mesa de estudo & terminal
  g.box(97, 53, 14, 9, 'W3');
  g.box(100, 49, 8, 5, 'T2');
  g.rect(101, 50, 6, 3, 'T4');
  g.px(103, 51, 'Y4');

  // (7, 3) Planta holográfica / luminária
  g.box(116, 56, 8, 6, 'W3');
  g.rect(117, 51, 6, 5, 'G4');
  g.rect(118, 49, 4, 3, 'Y3');
  g.px(119, 50, 'Y4');

  // Rows 4..6 (y = 64..111): Árvore 1 (0,64), Árvore Lanterna (32,64), Mini-Estufa (64,64)
  g.rect(10, 104, 12, 4, 'rgba(20, 38, 30, 0.35)');
  g.box(12, 90, 8, 16, 'W2');
  g.box(4, 70, 24, 22, 'G1');
  g.rect(5, 71, 22, 19, 'G2');
  g.box(7, 66, 18, 18, 'G3');
  g.rect(9, 67, 14, 10, 'G4');

  g.rect(42, 104, 12, 4, 'rgba(20, 38, 30, 0.35)');
  g.box(44, 90, 8, 16, 'W2');
  g.box(36, 70, 24, 22, 'G1');
  g.rect(37, 71, 22, 19, 'G2');
  g.box(39, 66, 18, 18, 'G3');
  g.rect(41, 67, 14, 10, 'G4');
  g.rect(55, 88, 1, 3, 'W1');
  g.box(54, 91, 3, 4, 'Y3');
  g.px(55, 92, 'Y4');

  g.box(66, 70, 28, 22, 'T3');
  g.rect(68, 72, 24, 18, 'T4');
  g.rect(70, 78, 20, 10, 'G3');
  g.rect(66, 70, 28, 2, 'W3');
  g.rect(79, 70, 2, 22, 'W3');

  return g.canvas.toDataURL('image/png');
}

// 4. Construções 96x64 px (3 cols x 3 rows = 288x192 px)
function generateBuildingsSheet() {
  const g = createPixelCanvas(288, 192);

  const drawBaseStructure = (ox, oy, wallMain, wallTrim, roofMain, roofHi) => {
    g.rect(ox + 4, oy + 60, 88, 3, 'rgba(18, 30, 32, 0.35)');
    g.box(ox + 6, oy + 52, 84, 9, 'R2');
    g.rect(ox + 7, oy + 53, 82, 2, 'R3');
    g.box(ox + 8, oy + 24, 80, 30, wallMain);
    g.rect(ox + 8, oy + 24, 5, 30, wallTrim);
    g.rect(ox + 83, oy + 24, 5, 30, wallTrim);
    g.box(ox + 4, oy + 10, 88, 16, roofMain);
    g.rect(ox + 6, oy + 11, 84, 4, roofHi);
    g.rect(ox + 4, oy + 24, 88, 2, 'Y3');
  };

  // (0, 0) Núcleo Central
  {
    const ox = 0;
    const oy = 0;
    drawBaseStructure(ox, oy, 'W3', 'W2', 'T2', 'T3');
    g.box(ox + 34, oy + 2, 28, 22, 'T3');
    g.box(ox + 41, oy + 6, 14, 14, 'W2');
    g.rect(ox + 43, oy + 8, 10, 10, 'Y3');
    g.rect(ox + 47, oy + 10, 1, 4, 'O');
    g.rect(ox + 47, oy + 13, 3, 1, 'O');
    [16, 26, 60, 70].forEach((wx) => {
      g.box(ox + wx, oy + 31, 8, 11, 'Y3');
      g.rect(ox + wx + 1, oy + 32, 6, 4, 'Y4');
    });
    g.box(ox + 41, oy + 37, 14, 17, 'W1');
    g.rect(ox + 43, oy + 39, 4, 14, 'W3');
    g.rect(ox + 49, oy + 39, 4, 14, 'W3');
  }

  // (96, 0) Universidade Neon
  {
    const ox = 96;
    const oy = 0;
    drawBaseStructure(ox, oy, 'R3', 'W3', 'L2', 'L3');
    g.box(ox + 36, oy + 2, 24, 12, 'T3');
    g.rect(ox + 39, oy + 4, 18, 6, 'T4');
    [17, 29, 59, 71].forEach((wx) => {
      g.box(ox + wx, oy + 29, 7, 15, 'L3');
      g.rect(ox + wx + 1, oy + 30, 5, 6, 'Y4');
    });
    g.box(ox + 40, oy + 36, 16, 18, 'W2');
    g.rect(ox + 43, oy + 38, 10, 15, 'T1');
    g.rect(ox + 44, oy + 39, 8, 4, 'L4');
  }

  // (192, 0) Estufa BioTech
  {
    const ox = 192;
    const oy = 0;
    g.rect(ox + 4, oy + 60, 88, 3, 'rgba(18, 30, 32, 0.35)');
    g.box(ox + 6, oy + 52, 84, 9, 'W2');
    g.box(ox + 8, oy + 12, 80, 42, 'T3');
    g.rect(ox + 10, oy + 14, 76, 38, 'T4');
    g.rect(ox + 12, oy + 28, 72, 22, 'G2');
    g.rect(ox + 15, oy + 24, 22, 18, 'G3');
    g.rect(ox + 38, oy + 21, 24, 20, 'G4');
    g.rect(ox + 62, oy + 25, 19, 17, 'G3');
    [8, 28, 47, 66, 86].forEach((vx) => g.rect(ox + vx, oy + 12, 2, 42, 'W3'));
    g.rect(ox + 8, oy + 12, 80, 2, 'W3');
    g.box(ox + 42, oy + 38, 12, 16, 'W3');
    g.rect(ox + 44, oy + 40, 8, 12, 'G4');
  }

  // (0, 64) Laboratório de Inovação
  {
    const ox = 0;
    const oy = 64;
    drawBaseStructure(ox, oy, 'T2', 'W3', 'W2', 'W3');
    g.box(ox + 14, oy + 12, 24, 10, 'T3');
    g.rect(ox + 16, oy + 14, 20, 6, 'T4');
    g.rect(ox + 72, oy + 2, 2, 12, 'R3');
    g.rect(ox + 68, oy + 4, 10, 2, 'Y3');
    [16, 62].forEach((wx) => {
      g.box(ox + wx, oy + 31, 16, 10, 'T4');
      g.rect(ox + wx + 2, oy + 33, 6, 3, 'L4');
      g.rect(ox + wx + 10, oy + 33, 4, 5, 'Y3');
    });
    g.box(ox + 41, oy + 37, 14, 17, 'R2');
    g.rect(ox + 43, oy + 39, 10, 14, 'T3');
  }

  // (96, 64) Mercado Neon
  {
    const ox = 96;
    const oy = 64;
    drawBaseStructure(ox, oy, 'W3', 'W2', 'W2', 'W4');
    for (let sx = 10; sx < 86; sx += 8) {
      const isLilac = ((sx - 10) / 8) % 2 === 0;
      g.rect(ox + sx, oy + 24, 8, 7, isLilac ? 'L3' : 'Y3');
    }
    g.box(ox + 14, oy + 42, 18, 10, 'W2');
    g.rect(ox + 16, oy + 40, 6, 3, 'G4');
    g.rect(ox + 24, oy + 40, 6, 3, 'Y3');
    g.box(ox + 64, oy + 42, 18, 10, 'W2');
    g.rect(ox + 66, oy + 40, 6, 3, 'L4');
    g.box(ox + 41, oy + 36, 14, 18, 'W1');
    g.rect(ox + 43, oy + 38, 10, 15, 'Y3');
  }

  // (192, 64) Arcade 88
  {
    const ox = 192;
    const oy = 64;
    drawBaseStructure(ox, oy, 'T1', 'L2', 'L1', 'L2');
    g.box(ox + 30, oy + 4, 36, 14, 'O');
    g.rect(ox + 31, oy + 5, 34, 12, 'L2');
    [38, 50].forEach((dx) => {
      g.rect(ox + dx, oy + 7, 6, 8, 'Y3');
      g.rect(ox + dx + 2, oy + 9, 2, 1, 'L2');
      g.rect(ox + dx + 2, oy + 12, 2, 1, 'L2');
    });
    [16, 64].forEach((wx) => {
      g.box(ox + wx, oy + 32, 16, 10, 'L3');
      g.rect(ox + wx + 2, oy + 34, 12, 6, 'T4');
    });
    g.box(ox + 41, oy + 36, 14, 18, 'W2');
    g.rect(ox + 43, oy + 38, 10, 15, 'T3');
  }

  // (0, 128) Minha Casa (Chalé de madeira acolhedor com telhado verde-petróleo e floreiras)
  {
    const ox = 0;
    const oy = 128;
    drawBaseStructure(ox, oy, 'W4', 'W2', 'G2', 'G3');
    // Chaminé de pedra
    g.box(ox + 68, oy + 2, 10, 14, 'R2');
    g.rect(ox + 67, oy + 2, 12, 3, 'R3');
    // Janelas com floreiras
    [18, 62].forEach((wx) => {
      g.box(ox + wx, oy + 30, 12, 12, 'Y3');
      g.rect(ox + wx + 1, oy + 31, 10, 5, 'Y4');
      g.box(ox + wx - 1, oy + 41, 14, 4, 'W2');
      g.rect(ox + wx + 1, oy + 39, 10, 2, 'G4');
      g.px(ox + wx + 3, oy + 39, 'L4');
      g.px(ox + wx + 8, oy + 39, 'Y3');
    });
    // Porta da casa
    g.box(ox + 41, oy + 35, 14, 19, 'W1');
    g.rect(ox + 43, oy + 37, 10, 16, 'W3');
    g.px(ox + 50, oy + 45, 'Y4');
  }

  return g.canvas.toDataURL('image/png');
}

// 5. Objetos e Decoração (128x96 px)
function generatePropsSheet() {
  const g = createPixelCanvas(128, 96);

  // Banco de madeira (32x16)
  g.rect(3, 13, 26, 2, 'rgba(20, 32, 34, 0.3)');
  g.box(3, 4, 26, 5, 'W3');
  g.rect(4, 5, 24, 1, 'W4');
  g.box(2, 9, 28, 4, 'W2');
  g.rect(5, 13, 2, 3, 'W1');
  g.rect(25, 13, 2, 3, 'W1');

  // Poste com luminária dourada (2 frames)
  for (let f = 0; f < 2; f++) {
    const ox = 32 + f * 16;
    g.rect(ox + 6, 29, 4, 2, 'rgba(20, 32, 34, 0.35)');
    g.rect(ox + 7, 11, 2, 19, 'W1');
    g.rect(ox + 6, 27, 4, 3, 'R2');
    g.box(ox + 5, 4, 6, 7, 'Y2');
    g.rect(ox + 6, 5, 4, 5, f === 0 ? 'Y3' : 'Y4');
    g.rect(ox + 4, 3, 8, 2, 'T2');
  }

  // Placa holográfica (2 frames)
  for (let f = 0; f < 2; f++) {
    const ox = 64 + f * 16;
    g.box(ox + 5, 24, 6, 6, 'W2');
    g.rect(ox + 7, 19, 2, 5, 'R2');
    g.box(ox + 2, 5, 12, 14, 'T2');
    g.rect(ox + 3, 6, 10, 12, f === 0 ? 'T3' : 'L3');
    g.rect(ox + 4, 8, 8, 2, 'Y4');
    g.rect(ox + 4, 12, 5, 2, 'L4');
  }

  // Vaso botânico
  g.box(100, 9, 8, 6, 'W3');
  g.rect(101, 5, 6, 5, 'G3');
  g.rect(102, 3, 4, 3, 'G4');
  g.px(103, 4, 'Y3');

  // Terminal
  g.box(114, 9, 12, 6, 'W2');
  g.box(115, 2, 10, 8, 'R2');
  g.rect(116, 3, 8, 6, 'T3');
  g.rect(117, 4, 5, 2, 'Y4');

  // Estante
  g.box(97, 17, 14, 14, 'W2');
  g.rect(98, 18, 12, 5, 'W1');
  g.rect(98, 25, 12, 5, 'W1');
  g.rect(99, 19, 2, 4, 'T3');
  g.rect(102, 19, 2, 4, 'Y3');
  g.rect(105, 19, 2, 4, 'L3');
  g.rect(100, 26, 2, 4, 'G3');

  // Bancada
  g.box(113, 22, 14, 8, 'W3');
  g.box(117, 18, 6, 4, 'L2');
  g.px(119, 19, 'Y4');

  // Drone (4 frames)
  for (let f = 0; f < 4; f++) {
    const ox = f * 16;
    const hover = f === 1 || f === 2 ? -1 : 0;
    g.rect(ox + (f % 2 === 0 ? 2 : 4), 35 + hover, 4, 1, 'T5');
    g.rect(ox + (f % 2 === 0 ? 10 : 8), 35 + hover, 4, 1, 'T5');
    g.box(ox + 4, 36 + hover, 8, 6, 'C1');
    g.rect(ox + 5, 38 + hover, 6, 2, 'T3');
    g.px(ox + 7, 38 + hover, 'Y4');
  }

  // Robô Jardineiro (4 frames)
  for (let f = 0; f < 4; f++) {
    const ox = 64 + f * 16;
    const bob = f % 2 === 1 ? -1 : 0;
    g.box(ox + 4, 36 + bob, 8, 9, 'T3');
    g.rect(ox + 5, 37 + bob, 6, 4, 'C2');
    g.rect(ox + 6, 38 + bob, 4, 2, 'L3');
    g.rect(ox + 7, 34 + bob, 2, 2, 'G4');
  }

  return g.canvas.toDataURL('image/png');
}

/* ============================================================================
   HELPERS DE TEMPO, HORÁRIO, ESTAÇÕES E ESTADO
   ============================================================================ */
const localDay = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};
const safeArray = (value) => (Array.isArray(value) ? value : []);
const completed = (task) =>
  task?.done === true || task?.status === 'done' || task?.completed === true;

function getPeriodFromHour(hour) {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 20) return 'sunset';
  return 'night';
}

const PERIOD_LABELS = {
  morning: { name: 'Manhã', icon: '🌅', light: 'Criativa' },
  afternoon: { name: 'Tarde', icon: '☀️', light: 'Plena' },
  sunset: { name: 'Entardecer', icon: '🌇', light: 'Dourada' },
  night: { name: 'Noite', icon: '🌙', light: 'Lanternas Acesas' },
};

function getCurrentFestival() {
  const month = new Date().getMonth();
  return (
    SEASONAL_FESTIVALS.find((f) => f.months.includes(month)) ||
    SEASONAL_FESTIVALS[0]
  );
}

function cityWorldStart(data) {
  const saved = data?.neoCity?.world?.player;
  return saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)
    ? { x: saved.x, y: saved.y }
    : { x: 8, y: 6 };
}

/* ============================================================================
   COMPONENTE PRINCIPAL — NEO-LIFE CITY (EXPANSÃO COMPLETA)
   ============================================================================ */
export default function NeoLifeCity({ data = {}, save, onNavigate }) {
  const [activeTab, setActiveTab] = useState('explore');
  const [selectedResident, setSelectedResident] = useState(null);
  const [dialogueStep, setDialogueStep] = useState('root');
  const [worldBubble, setWorldBubble] = useState(null);
  const [notice, setNotice] = useState('');

  // Posição e navegação no mundo & casa
  const [player, setPlayer] = useState(() => cityWorldStart(data));
  const [insideBuilding, setInsideBuilding] = useState(null);
  const [homeRoomIndex, setHomeRoomIndex] = useState(0);
  const [decorateMode, setDecorateMode] = useState(false);
  const [selectedFurnItem, setSelectedFurnItem] = useState(null);
  const [furnFlipped, setFurnFlipped] = useState(false);
  const [interiorPlayer, setInteriorPlayer] = useState({ x: 5, y: 4 });
  const [lastDirection, setLastDirection] = useState('down');

  // Horário dinâmico (auto = relógio real, ou manual para testar rotinas e iluminação)
  const [timeOverride, setTimeOverride] = useState('auto');
  const currentPeriod = useMemo(() => {
    if (timeOverride !== 'auto') return timeOverride;
    return getPeriodFromHour(new Date().getHours());
  }, [timeOverride]);

  // Posições dinâmicas dos NPCs que caminham até o ponto da rotina atual
  const [npcPositions, setNpcPositions] = useState(() => {
    const init = {};
    RESIDENTS.forEach((r) => {
      init[r.id] = { ...r.schedule[getPeriodFromHour(new Date().getHours())] };
    });
    return init;
  });

  // Jardim — semente selecionada
  const [selectedSeedId, setSelectedSeedId] = useState('mint-lumen');

  // Inventário — filtro de categoria
  const [invCategory, setInvCategory] = useState('Todos');

  // Minijogos
  const [minigameMode, setMinigameMode] = useState('memory'); // 'memory' | 'fishing' | 'hoverboard' | 'circuit'
  // 1. Memory
  const [sequence, setSequence] = useState([]);
  const [playerSequence, setPlayerSequence] = useState([]);
  const [gameState, setGameState] = useState('idle');
  const [gameSeed, setGameSeed] = useState(0);
  // 2. Pesca Tecnológica
  const [fishPhase, setFishPhase] = useState('idle'); // 'idle' | 'casting' | 'bite'
  const [fishBarPos, setFishBarPos] = useState(50);
  const [fishDir, setFishDir] = useState(1);
  const [lastCaughtFish, setLastCaughtFish] = useState(null);
  // 3. Corrida de Hoverboard
  const [raceActive, setRaceActive] = useState(false);
  const [raceLane, setRaceLane] = useState(1); // 0, 1, 2
  const [raceScore, setRaceScore] = useState(0);
  const [raceObstacles, setRaceObstacles] = useState([]); // { id, lane, y, isOrb }
  // 4. Circuito Bio-Energético (3x3 rotações)
  const [circuitGrid, setCircuitGrid] = useState([1, 0, 2, 1, 2, 0, 2, 1, 0]);

  // Input rápido de integração bidirecional nos interiores
  const [quickInput, setQuickInput] = useState('');

  // Animações 16-bit
  const [animTick, setAnimTick] = useState(0);
  const [walkFrame, setWalkFrame] = useState(0);
  const [isWalking, setIsWalking] = useState(false);
  const walkTimeoutRef = useRef(null);

  // Estado persistente de neoCity
  const city =
    data.neoCity && typeof data.neoCity === 'object' ? data.neoCity : {};
  const inventory = safeArray(city.inventory);
  const talks = city.talks && typeof city.talks === 'object' ? city.talks : {};
  const affinity =
    city.affinity && typeof city.affinity === 'object' ? city.affinity : {};
  const arcade =
    city.arcade && typeof city.arcade === 'object' ? city.arcade : {};
  const garden =
    city.garden && typeof city.garden === 'object' ? city.garden : {};
  const homeLayouts =
    city.homeLayouts && typeof city.homeLayouts === 'object'
      ? city.homeLayouts
      : {
          0: [
            { id: 'init-1', itemId: 'wood-sofa', x: 2, y: 2, flip: false },
            { id: 'init-2', itemId: 'holo-plant', x: 7, y: 2, flip: false },
          ],
          1: [{ id: 'init-3', itemId: 'cozy-bed', x: 2, y: 2, flip: false }],
          2: [{ id: 'init-4', itemId: 'holo-plant', x: 3, y: 2, flip: false }],
        };
  const equipped =
    city.equipped && typeof city.equipped === 'object'
      ? city.equipped
      : { outfit: null, mobility: null, companion: null, tool: null };
  const appearance =
    city.appearance && typeof city.appearance === 'object'
      ? city.appearance
      : {
          skin: 'warm',
          hairStyle: 'default',
          hairColor: 'dark',
          outfitColor: 'teal',
          packStyle: 'wood',
        };
  const claimedQuests = safeArray(city.claimedQuests);
  const claimedFestivals = safeArray(city.claimedFestivals);
  const collections =
    city.collections && typeof city.collections === 'object'
      ? city.collections
      : {
          locations: ['central-hub', 'player-home'],
          plants: [],
          fish: [],
          items: [],
        };

  // Spritesheets regenerados dinamicamente quando a aparência ou roupa equipada muda
  const effectiveOutfitColor = useMemo(() => {
    if (equipped.outfit === 'streetwear') return 'lilac';
    if (equipped.outfit === 'botanist-coat') return 'green';
    return appearance.outfitColor || 'teal';
  }, [equipped.outfit, appearance.outfitColor]);

  const sprites = useMemo(() => {
    if (typeof document === 'undefined') return null;
    return {
      player: generatePlayerSheet({
        ...appearance,
        outfitColor: effectiveOutfitColor,
      }),
      residents: generateResidentsSheet(),
      terrain: generateTerrainSheet(),
      buildings: generateBuildingsSheet(),
      props: generatePropsSheet(),
    };
  }, [appearance, effectiveOutfitColor]);

  // Dados reais do app
  const coins = Math.max(0, Number(data.coins) || 0);
  const xp = Math.max(0, Number(data.xp) || 0);
  const tasks = safeArray(data.tasks);
  const habits = safeArray(data.habits);
  const sessions = safeArray(data.studySessions);
  const readings = safeArray(data.readings).concat(
    safeArray(data.knowledgeItems),
  );
  const goals = safeArray(data.goals);
  const projects = safeArray(data.projects);

  const stats = useMemo(
    () => ({
      tasks: tasks.filter(completed).length,
      studyMinutes: sessions.reduce(
        (sum, item) => sum + Math.max(0, Number(item.minutes) || 0),
        0,
      ),
      habits: habits.reduce(
        (sum, habit) =>
          sum +
          new Set([
            ...Object.entries(habit.history || {})
              .filter(([, done]) => done)
              .map(([day]) => day),
            ...safeArray(habit.completedDates),
          ]).size,
        0,
      ),
      readings: readings.length,
      goals: goals.filter(
        (goal) => goal.status === 'completed' || Number(goal.progress) >= 100,
      ).length,
      projects: projects.length,
      coins,
      xp,
    }),
    [tasks, sessions, habits, readings, goals, projects, coins, xp],
  );

  const districtValue = (district) => stats[district.metric] || 0;
  const districtOpen = (district) =>
    districtValue(district) >= district.threshold;
  const openCount = DISTRICTS.filter(districtOpen).length;
  const today = localDay();
  const attemptedToday = arcade.lastAttemptDate === today;
  const ownedIds = new Set(inventory);
  const activeFestival = useMemo(() => getCurrentFestival(), []);

  const persistCity = (nextCity, extra = {}) =>
    save?.({ ...data, ...extra, neoCity: nextCity });

  // Tick global de animação 16-bit
  useEffect(() => {
    const timer = window.setInterval(() => {
      setAnimTick((prev) => (prev + 1) % 48);
    }, 280);
    return () => {
      window.clearInterval(timer);
      if (walkTimeoutRef.current) window.clearTimeout(walkTimeoutRef.current);
    };
  }, []);

  // Rotinas diárias e deslocamento gradual dos NPCs pelo mapa
  useEffect(() => {
    const moveTimer = window.setInterval(() => {
      setNpcPositions((prev) => {
        const next = { ...prev };
        RESIDENTS.forEach((res) => {
          const target = res.schedule[currentPeriod] || res.worldPos;
          const cur = prev[res.id] || target;
          if (cur.x === target.x && cur.y === target.y) return;
          const stepX = cur.x < target.x ? 1 : cur.x > target.x ? -1 : 0;
          const stepY =
            stepX === 0
              ? cur.y < target.y
                ? 1
                : cur.y > target.y
                  ? -1
                  : 0
              : 0;
          const nx = cur.x + stepX;
          const ny = cur.y + stepY;
          if (!(nx === player.x && ny === player.y)) {
            next[res.id] = { x: nx, y: ny };
          }
        });
        return next;
      });
    }, 1400);
    return () => window.clearInterval(moveTimer);
  }, [currentPeriod, player.x, player.y]);

  // Loop da Pesca Tecnológica
  useEffect(() => {
    if (fishPhase !== 'bite') return;
    const interval = window.setInterval(() => {
      setFishBarPos((pos) => {
        const speed = equipped.tool === 'bio-rod' ? 4 : 6;
        let next = pos + fishDir * speed;
        if (next >= 92) {
          next = 92;
          setFishDir(-1);
        } else if (next <= 8) {
          next = 8;
          setFishDir(1);
        }
        return next;
      });
    }, 45);
    return () => window.clearInterval(interval);
  }, [fishPhase, fishDir, equipped.tool]);

  // Loop da Corrida de Hoverboard
  useEffect(() => {
    if (!raceActive) return;
    const interval = window.setInterval(() => {
      setRaceScore((s) => s + 1);
      setRaceObstacles((prev) => {
        const moved = prev
          .map((o) => ({ ...o, y: o.y + 12 }))
          .filter((o) => o.y <= 105);

        // Colisão com jogador em y ~ 82..94
        const hitObstacle = moved.find(
          (o) => !o.isOrb && o.lane === raceLane && o.y >= 78 && o.y <= 92,
        );
        if (hitObstacle) {
          setRaceActive(false);
          const earned = Math.max(4, Math.floor(raceScore / 6));
          persistCity(city, { coins: coins + earned, xp: xp + earned });
          setNotice(
            `Corrida encerrada! Você marcou ${raceScore} pts e ganhou +${earned} moedas.`,
          );
          return [];
        }

        const collectedOrb = moved.find(
          (o) => o.isOrb && o.lane === raceLane && o.y >= 76 && o.y <= 94,
        );
        if (collectedOrb) {
          setRaceScore((s) => s + 10);
        }

        const filtered = moved.filter((o) => o !== collectedOrb);
        if (Math.random() < 0.45) {
          filtered.push({
            id: `${Date.now()}-${Math.random()}`,
            lane: Math.floor(Math.random() * 3),
            y: 0,
            isOrb: Math.random() < 0.35,
          });
        }
        return filtered;
      });
    }, 150);
    return () => window.clearInterval(interval);
  }, [raceActive, raceLane, raceScore]);

  /* ==========================================================================
     COLISÕES E MOVIMENTAÇÃO (MUNDO 20x12 E INTERIORES 10x6)
     ========================================================================== */
  const isWaterTile = (x, y) =>
    (x >= 0 && x <= 2 && y >= 0 && y <= 2) ||
    (x >= 17 && x <= 19 && y >= 9 && y <= 11);

  const isBlocked = (x, y) => {
    if (x < 0 || x > 19 || y < 0 || y > 11) return true;
    if (isWaterTile(x, y)) return true;

    const hitBuilding = WORLD_BUILDINGS.some(
      (b) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h,
    );
    if (hitBuilding) return true;

    const hitProp = WORLD_PROPS.some((p) => p.solid && p.x === x && p.y === y);
    if (hitProp) return true;

    const hitNpc = RESIDENTS.some((r) => {
      const pos = npcPositions[r.id];
      return pos && pos.x === x && pos.y === y;
    });
    if (hitNpc) return true;

    return false;
  };

  const isInteriorBlocked = (x, y) => {
    if (x < 1 || x > 8 || y < 1 || y > 4) {
      if (x === 5 && y === 5) return false;
      return true;
    }
    if (!insideBuilding?.isHome) {
      if (y === 2 && [1, 4, 8].includes(x)) return true;
      if ((x === 1 && y === 1) || (x === 8 && y === 1)) return true;
    } else {
      const roomItems = safeArray(homeLayouts[homeRoomIndex]);
      if (roomItems.some((item) => item.x === x && item.y === y)) return true;
    }
    return false;
  };

  const triggerWalkAnimation = (dx, dy) => {
    setLastDirection(
      dx < 0 ? 'left' : dx > 0 ? 'right' : dy < 0 ? 'up' : 'down',
    );
    setWalkFrame((prev) => (prev + 1) % 4);
    setIsWalking(true);
    if (walkTimeoutRef.current) window.clearTimeout(walkTimeoutRef.current);
    walkTimeoutRef.current = window.setTimeout(() => {
      setIsWalking(false);
      setWalkFrame(0);
    }, 240);
  };

  const movePlayer = (dx, dy) => {
    triggerWalkAnimation(dx, dy);

    if (insideBuilding) {
      const nx = interiorPlayer.x + dx;
      const ny = interiorPlayer.y + dy;
      if (!isInteriorBlocked(nx, ny)) {
        setInteriorPlayer({ x: nx, y: ny });
      }
      return;
    }

    const stepMultiplier = equipped.mobility === 'skyboard' ? 2 : 1;
    let targetX = player.x;
    let targetY = player.y;

    for (let s = 1; s <= stepMultiplier; s++) {
      const nx = Math.max(0, Math.min(19, player.x + dx * s));
      const ny = Math.max(0, Math.min(11, player.y + dy * s));
      const isDoor = WORLD_BUILDINGS.some(
        (b) => b.door.x === nx && b.door.y === ny,
      );
      if (!isBlocked(nx, ny) || isDoor) {
        targetX = nx;
        targetY = ny;
      } else {
        break;
      }
    }

    if (targetX !== player.x || targetY !== player.y) {
      setPlayer({ x: targetX, y: targetY });
      setWorldBubble(null);
    }
  };

  /* ==========================================================================
     JARDIM — CICLOS DE CRESCIMENTO SINCRONIZADOS COM SESSÕES REAIS DE FOCO
     ========================================================================== */
  const getPlotStage = (plotData) => {
    if (!plotData) return -1; // vazio
    const focusAtPlant = Number(plotData.focusMinutesAtPlant) || 0;
    const gainedFocus = Math.max(0, stats.studyMinutes - focusAtPlant);
    const waterBonus = (Number(plotData.waterCount) || 0) * 10;
    const totalProgress = gainedFocus + waterBonus;
    const species =
      SEED_SPECIES.find((s) => s.id === plotData.seedId) || SEED_SPECIES[0];
    const ratio = totalProgress / species.focusMinutesNeeded;
    if (ratio >= 1) return 3; // colheita pronta
    if (ratio >= 0.6) return 2; // florescendo
    if (ratio >= 0.25) return 1; // broto
    return 0; // semente
  };

  const handlePlotAction = (plot) => {
    const existing = garden[plot.id];
    const stage = getPlotStage(existing);

    if (!existing) {
      const nextGarden = {
        ...garden,
        [plot.id]: {
          seedId: selectedSeedId,
          focusMinutesAtPlant: stats.studyMinutes,
          waterCount: 0,
          plantedAt: today,
        },
      };
      persistCity({ ...city, garden: nextGarden });
      const sp = SEED_SPECIES.find((s) => s.id === selectedSeedId);
      setNotice(
        `Semente de ${sp?.name} plantada em ${plot.label}! Regue ou conclua sessões de foco para fazê-la crescer.`,
      );
      return;
    }

    if (stage < 3) {
      const nextGarden = {
        ...garden,
        [plot.id]: {
          ...existing,
          waterCount: (Number(existing.waterCount) || 0) + 1,
        },
      };
      persistCity({ ...city, garden: nextGarden });
      setNotice(
        `Você regou ${plot.label}! (+10 min equivalentes de crescimento botânico)`,
      );
      return;
    }

    // Colher planta madura
    const sp =
      SEED_SPECIES.find((s) => s.id === existing.seedId) || SEED_SPECIES[0];
    const festivalBonus =
      activeFestival.id === 'lantern-festival'
        ? Math.round(sp.sellPrice * 1.2)
        : sp.sellPrice;
    const nextGarden = { ...garden };
    delete nextGarden[plot.id];
    const nextPlants = Array.from(
      new Set([...safeArray(collections.plants), sp.id]),
    );
    const harvestItemId = `harvest-${sp.id}`;

    persistCity(
      {
        ...city,
        garden: nextGarden,
        inventory: [...inventory, harvestItemId],
        collections: { ...collections, plants: nextPlants },
      },
      { coins: coins + festivalBonus, xp: xp + sp.xpReward },
    );
    setNotice(
      `Colheita concluída: ${sp.name}! +${festivalBonus} moedas, +${sp.xpReward} XP e item guardado na mochila.`,
    );
  };

  /* ==========================================================================
     INTERAÇÕES NO MAPA, DIÁLOGOS RAMIFICADOS E INTEGRAÇÃO BIDIRECIONAL
     ========================================================================== */
  const openResidentDialogue = (resident, inWorld = false) => {
    const nextTalks = {
      ...talks,
      [resident.id]: (Number(talks[resident.id]) || 0) + 1,
    };
    const nextAffinity = {
      ...affinity,
      [resident.id]: Math.min(100, (Number(affinity[resident.id]) || 0) + 3),
    };
    persistCity({ ...city, talks: nextTalks, affinity: nextAffinity });
    setDialogueStep('root');

    if (inWorld) {
      setWorldBubble(resident);
    } else {
      setSelectedResident(resident);
    }
  };

  const applyDialogueChoice = (resident, choice) => {
    const curAff = Number(affinity[resident.id]) || 0;
    const nextAff = Math.min(100, Math.max(0, curAff + choice.affinityDelta));
    let extraRoot = {};
    let nextCity = {
      ...city,
      affinity: { ...affinity, [resident.id]: nextAff },
    };

    if (choice.action === 'gift') {
      const giftIdx = inventory.findIndex(
        (id) => id.startsWith('harvest-') || id.startsWith('fish-'),
      );
      if (giftIdx === -1) {
        setNotice(
          'Você precisa ter uma planta colhida ou peixe no inventário para presentear!',
        );
        return;
      }
      const nextInv = [...inventory];
      nextInv.splice(giftIdx, 1);
      nextCity = {
        ...nextCity,
        inventory: nextInv,
        affinity: { ...affinity, [resident.id]: Math.min(100, curAff + 12) },
      };
      setNotice(
        `${resident.name} adorou o presente artesanal! (+12 de afinidade)`,
      );
    } else if (choice.action === 'sync-task') {
      const pendingTask = tasks.find((t) => !completed(t));
      if (pendingTask) {
        const nextTasks = tasks.map((t) =>
          t === pendingTask
            ? { ...t, done: true, completed: true, status: 'done' }
            : t,
        );
        extraRoot = { tasks: nextTasks, coins: coins + 15, xp: xp + 20 };
        setNotice(
          `Tarefa real "${pendingTask.title || pendingTask.text || 'Tarefa'}" concluída com ${resident.name}! +15 moedas e +20 XP.`,
        );
      } else {
        setNotice('Todas as suas tarefas atuais já estão concluídas!');
      }
    } else if (choice.action === 'sync-focus') {
      const newSession = {
        id: `neo-focus-${Date.now()}`,
        subject: 'Sessão no Vale Neo',
        minutes: 25,
        date: today,
      };
      extraRoot = {
        studySessions: [...sessions, newSession],
        coins: coins + 15,
        xp: xp + 25,
      };
      setNotice(
        'Sessão de foco de 25 min registrada no Meu Assistente! Seus canteiros cresceram e você ganhou +25 XP.',
      );
    } else if (choice.action === 'sync-habit') {
      const firstHabit = habits[0];
      if (firstHabit) {
        const nextHabits = habits.map((h, i) =>
          i === 0
            ? {
                ...h,
                history: { ...(h.history || {}), [today]: true },
                completedDates: Array.from(
                  new Set([...safeArray(h.completedDates), today]),
                ),
              }
            : h,
        );
        extraRoot = { habits: nextHabits, coins: coins + 12, xp: xp + 18 };
        setNotice(
          `Hábito "${firstHabit.name || firstHabit.title || 'Hábito'}" registrado para hoje! +12 moedas e +18 XP.`,
        );
      } else {
        setNotice('Crie um hábito no Meu Assistente para sincronizar com Nox.');
      }
    }

    persistCity(nextCity, extraRoot);
    setDialogueStep(choice.nextStep || 'farewell');
  };

  const interactInWorld = () => {
    // 1. Porta adjacente
    const nearbyDoor = WORLD_BUILDINGS.find(
      (b) => Math.abs(b.door.x - player.x) + Math.abs(b.door.y - player.y) <= 1,
    );
    if (nearbyDoor) {
      enterBuilding(nearbyDoor);
      return;
    }

    // 2. Morador adjacente (posição dinâmica)
    const nearbyResident = RESIDENTS.find((r) => {
      const pos = npcPositions[r.id];
      return (
        pos && Math.abs(pos.x - player.x) + Math.abs(pos.y - player.y) <= 1
      );
    });
    if (nearbyResident) {
      openResidentDialogue(nearbyResident, true);
      return;
    }

    // 3. Canteiro de jardim adjacente
    const nearbyPlot = GARDEN_PLOTS.find(
      (p) => Math.abs(p.x - player.x) + Math.abs(p.y - player.y) <= 1,
    );
    if (nearbyPlot) {
      handlePlotAction(nearbyPlot);
      return;
    }

    // 4. Ponto de Pesca ou Pista Hoverboard ou Placa Holográfica
    const nearbyProp = WORLD_PROPS.find(
      (p) => Math.abs(p.x - player.x) + Math.abs(p.y - player.y) <= 1,
    );
    if (nearbyProp?.type === 'fishing-spot') {
      setActiveTab('arcade');
      setMinigameMode('fishing');
      setNotice('Você chegou ao Cais de Pesca Bio-Tech!');
      return;
    }
    if (nearbyProp?.type === 'race-spot') {
      setActiveTab('arcade');
      setMinigameMode('hoverboard');
      setNotice('Você entrou na Pista de Hoverboard do Vale!');
      return;
    }
    if (nearbyProp?.type === 'holo' || nearbyProp?.type === 'terminal') {
      setNotice(
        `Painel da Cidade: ${openCount}/${DISTRICTS.length} distritos ativos · ${stats.tasks} tarefas · ${stats.studyMinutes} min de foco.`,
      );
    }
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target?.tagName) ||
        event.target?.isContentEditable
      )
        return;

      const key = event.key.toLowerCase();

      // Controles da Corrida Hoverboard
      if (
        activeTab === 'arcade' &&
        minigameMode === 'hoverboard' &&
        raceActive
      ) {
        if (key === 'arrowleft' || key === 'a') {
          event.preventDefault();
          setRaceLane((l) => Math.max(0, l - 1));
        } else if (key === 'arrowright' || key === 'd') {
          event.preventDefault();
          setRaceLane((l) => Math.min(2, l + 1));
        }
        return;
      }

      if (activeTab !== 'explore') return;

      const directions = {
        arrowup: [0, -1],
        w: [0, -1],
        arrowdown: [0, 1],
        s: [0, 1],
        arrowleft: [-1, 0],
        a: [-1, 0],
        arrowright: [1, 0],
        d: [1, 0],
      };
      if (directions[key]) {
        event.preventDefault();
        movePlayer(...directions[key]);
      }
      if (key === 'e' && !insideBuilding) {
        interactInWorld();
      } else if (key === 'e' && insideBuilding) {
        if (Math.abs(interiorPlayer.x - 5) <= 1 && interiorPlayer.y >= 4) {
          leaveBuilding();
        } else if (!insideBuilding.isHome) {
          const stations = [
            { x: 1, y: 2, index: 0 },
            { x: 4, y: 2, index: 1 },
            { x: 8, y: 2, index: 2 },
          ];
          const hit = stations.find(
            (st) =>
              Math.abs(st.x - interiorPlayer.x) +
                Math.abs(st.y - interiorPlayer.y) <=
              1,
          );
          if (hit) {
            setNotice(
              `Estação ${insideBuilding.rooms[hit.index]} ativada! Use o painel abaixo para registrar progresso real.`,
            );
          }
        }
      }
      if (key === 'escape') {
        if (worldBubble) setWorldBubble(null);
        else if (insideBuilding) leaveBuilding();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  useEffect(() => {
    if (activeTab === 'explore' && !insideBuilding) {
      persistCity({ ...city, world: { ...(city.world || {}), player } });
    }
  }, [player.x, player.y]);

  const enterBuilding = (building) => {
    const district = DISTRICTS.find((item) => item.id === building.district);
    if (!building.isHome && district && !districtOpen(district)) {
      setNotice(
        `O ${building.name} ainda está em construção. Conclua a meta do distrito no Meu Assistente para inaugurar.`,
      );
      return;
    }
    setWorldBubble(null);
    setDecorateMode(false);
    setHomeRoomIndex(0);
    setInteriorPlayer({ x: 5, y: 4 });
    setInsideBuilding(building);

    const nextLocs = Array.from(
      new Set([...safeArray(collections.locations), building.id]),
    );
    persistCity({
      ...city,
      world: { ...(city.world || {}), player },
      collections: { ...collections, locations: nextLocs },
    });
  };

  const leaveBuilding = () => {
    setInsideBuilding(null);
    setDecorateMode(false);
  };

  /* ==========================================================================
     POSICIONAMENTO DE MÓVEIS EM GRADE NA CASA DO JOGADOR
     ========================================================================== */
  const handleHomeTileClick = (x, y) => {
    if (!decorateMode) return;
    if (x < 1 || x > 8 || y < 1 || y > 4) return;
    if (x === 5 && y === 4) return; // mantém entrada livre

    const currentRoomItems = safeArray(homeLayouts[homeRoomIndex]);
    const existingIdx = currentRoomItems.findIndex(
      (item) => item.x === x && item.y === y,
    );

    if (existingIdx !== -1) {
      // Recolhe o móvel de volta ao inventário
      const removed = currentRoomItems[existingIdx];
      const nextRoomItems = currentRoomItems.filter(
        (_, i) => i !== existingIdx,
      );
      persistCity({
        ...city,
        inventory: [...inventory, removed.itemId],
        homeLayouts: { ...homeLayouts, [homeRoomIndex]: nextRoomItems },
      });
      setNotice('Móvel recolhido para seu inventário.');
      return;
    }

    if (!selectedFurnItem) {
      setNotice('Selecione um móvel na barra abaixo para posicionar na grade.');
      return;
    }

    const invIdx = inventory.indexOf(selectedFurnItem);
    if (invIdx === -1) {
      setNotice('Você não possui unidades disponíveis deste móvel na mochila.');
      return;
    }

    const nextInv = [...inventory];
    nextInv.splice(invIdx, 1);
    const nextRoomItems = [
      ...currentRoomItems,
      {
        id: `furn-${Date.now()}`,
        itemId: selectedFurnItem,
        x,
        y,
        flip: furnFlipped,
      },
    ];
    persistCity({
      ...city,
      inventory: nextInv,
      homeLayouts: { ...homeLayouts, [homeRoomIndex]: nextRoomItems },
    });
    setNotice('Móvel posicionado na grade da sua casa!');
  };

  /* ==========================================================================
     INTEGRAÇÃO BIDIRECIONAL NOS INTERIORES DOS PRÉDIOS
     ========================================================================== */
  const handleBuildingRealAction = (e) => {
    e.preventDefault();
    const text = quickInput.trim();
    if (!text) return;

    if (insideBuilding.id === 'central-hub') {
      const newTask = {
        id: `task-${Date.now()}`,
        title: text,
        text,
        done: false,
        status: 'pending',
        createdAt: today,
      };
      persistCity(city, { tasks: [...tasks, newTask], xp: xp + 5 });
      setNotice(`Nova tarefa real criada: "${text}" (+5 XP).`);
    } else if (insideBuilding.id === 'university') {
      const mins = Math.max(5, Math.min(180, Number(text) || 25));
      const newSession = {
        id: `session-${Date.now()}`,
        subject: 'Estudo no Vale Neo',
        minutes: mins,
        date: today,
      };
      const festivalXp = activeFestival.id === 'starlight-academy' ? 10 : 0;
      persistCity(city, {
        studySessions: [...sessions, newSession],
        coins: coins + Math.round(mins / 2),
        xp: xp + mins + festivalXp,
      });
      setNotice(
        `Sessão real de ${mins} min salva! +${Math.round(mins / 2)} moedas, +${mins + festivalXp} XP e crescimento nas plantas.`,
      );
    } else if (insideBuilding.id === 'innovation-lab') {
      const newProj = {
        id: `proj-${Date.now()}`,
        name: text,
        title: text,
        status: 'active',
        createdAt: today,
      };
      persistCity(city, { projects: [...projects, newProj], xp: xp + 20 });
      setNotice(`Novo projeto real registrado: "${text}" (+20 XP).`);
    } else {
      const newReading = {
        id: `read-${Date.now()}`,
        title: text,
        date: today,
      };
      persistCity(city, { readings: [...readings, newReading], xp: xp + 15 });
      setNotice(`Leitura/nota registrada no acervo: "${text}" (+15 XP).`);
    }
    setQuickInput('');
  };

  /* ==========================================================================
     MISSÕES VERIFICÁVEIS (CAMPANHA PRINCIPAL + SECUNDÁRIAS)
     ========================================================================== */
  const questsList = useMemo(() => {
    const totalAffinity = Object.values(affinity).reduce(
      (sum, val) => sum + (Number(val) || 0),
      0,
    );
    const placedFurnitureCount = Object.values(homeLayouts).reduce(
      (sum, arr) => sum + safeArray(arr).length,
      0,
    );

    return [
      {
        id: 'main-1',
        type: 'Principal · Ato I',
        title: 'Primeiros Passos no Vale',
        desc: 'Conclua 2 tarefas reais e converse com pelo menos 2 moradores.',
        progress:
          Math.min(2, stats.tasks) + Math.min(2, Object.keys(talks).length),
        target: 4,
        rewardCoins: 40,
        rewardXp: 50,
      },
      {
        id: 'main-2',
        type: 'Principal · Ato II',
        title: 'Raízes do Conhecimento',
        desc: 'Acumule 45 minutos de estudo real e colha 1 planta no jardim.',
        progress:
          Math.min(45, stats.studyMinutes) +
          (safeArray(collections.plants).length > 0 ? 15 : 0),
        target: 60,
        rewardCoins: 65,
        rewardXp: 80,
      },
      {
        id: 'main-3',
        type: 'Principal · Ato III',
        title: 'Lar Acolhedor & Comunidade',
        desc: 'Posicione 3 móveis na sua casa e alcance 30 pts de afinidade total.',
        progress:
          Math.min(3, placedFurnitureCount) * 10 + Math.min(30, totalAffinity),
        target: 60,
        rewardCoins: 90,
        rewardXp: 110,
      },
      {
        id: 'side-luna',
        type: 'Secundária · Luna',
        title: 'Calibração Acadêmica',
        desc: 'Registre 60 minutos de foco para abrir a Universidade Neon.',
        progress: Math.min(60, stats.studyMinutes),
        target: 60,
        rewardCoins: 45,
        rewardXp: 60,
      },
      {
        id: 'side-nox',
        type: 'Secundária · Nox',
        title: 'Ciclo de Consistência',
        desc: 'Mantenha 3 registros de hábitos para florescer os Jardins BioTech.',
        progress: Math.min(3, stats.habits),
        target: 3,
        rewardCoins: 45,
        rewardXp: 60,
      },
      {
        id: 'side-fisher',
        type: 'Secundária · Cais',
        title: 'Catalogador das Águas',
        desc: 'Capture 2 espécies diferentes de peixes bio-tech no lago.',
        progress: Math.min(2, safeArray(collections.fish).length),
        target: 2,
        rewardCoins: 55,
        rewardXp: 70,
      },
    ];
  }, [stats, talks, affinity, homeLayouts, collections]);

  const claimQuest = (quest) => {
    if (claimedQuests.includes(quest.id) || quest.progress < quest.target)
      return;
    persistCity(
      { ...city, claimedQuests: [...claimedQuests, quest.id] },
      { coins: coins + quest.rewardCoins, xp: xp + quest.rewardXp },
    );
    setNotice(
      `Missão "${quest.title}" concluída! +${quest.rewardCoins} moedas e +${quest.rewardXp} XP.`,
    );
  };

  /* ==========================================================================
     MINIJOGOS — PESCA, HOVERBOARD, MEMÓRIA E CIRCUITO LÓGICO
     ========================================================================== */
  const castFishingLine = () => {
    setLastCaughtFish(null);
    setFishPhase('casting');
    window.setTimeout(() => {
      setFishPhase('bite');
      setFishBarPos(20);
    }, 900);
  };

  const reelFish = () => {
    if (fishPhase !== 'bite') return;
    const hitWindow = equipped.tool === 'bio-rod' ? 22 : 14;
    const distance = Math.abs(fishBarPos - 50);
    setFishPhase('idle');

    if (distance <= hitWindow) {
      const fish =
        FISH_SPECIES[Math.floor(Math.random() * FISH_SPECIES.length)];
      const bonusCoins =
        activeFestival.id === 'lantern-festival'
          ? Math.round(fish.coins * 1.2)
          : fish.coins;
      const nextFishCol = Array.from(
        new Set([...safeArray(collections.fish), fish.id]),
      );
      setLastCaughtFish(fish);
      persistCity(
        {
          ...city,
          inventory: [...inventory, `fish-${fish.id}`],
          collections: { ...collections, fish: nextFishCol },
        },
        { coins: coins + bonusCoins, xp: xp + fish.xp },
      );
      setNotice(
        `Você pescou ${fish.name} (${fish.rarity})! +${bonusCoins} moedas e +${fish.xp} XP.`,
      );
    } else {
      setNotice(
        'O peixe escapou! Pressione Puxar quando o indicador dourado cruzar o centro.',
      );
    }
  };

  const startHoverboardRace = () => {
    const isFree = activeFestival.id === 'solstice-market';
    if (!isFree && coins < 3) {
      setNotice(
        'Você precisa de 3 moedas para correr (grátis no Festival de Verão).',
      );
      return;
    }
    if (!isFree) {
      persistCity(city, { coins: coins - 3 });
    }
    setRaceLane(1);
    setRaceScore(0);
    setRaceObstacles([]);
    setRaceActive(true);
  };

  const rotateCircuitNode = (idx) => {
    const next = [...circuitGrid];
    next[idx] = (next[idx] + 1) % 3;
    setCircuitGrid(next);
    // Vitória quando a diagonal principal está alinhada em estado 2
    if (next[0] === 2 && next[4] === 2 && next[8] === 2) {
      persistCity(city, { coins: coins + 15, xp: xp + 25 });
      setNotice('Circuito Bio-Energético estabilizado! +15 moedas e +25 XP.');
      setCircuitGrid([1, 0, 2, 0, 1, 2, 2, 1, 0]);
    }
  };

  /* ==========================================================================
     LOJA, INVENTÁRIO E EQUIPAMENTOS
     ========================================================================== */
  const buyItem = (item) => {
    if (coins < item.price) {
      setNotice(
        `Faltam ${item.price - coins} moedas para comprar ${item.name}.`,
      );
      return;
    }
    const nextItemsCol = Array.from(
      new Set([...safeArray(collections.items), item.id]),
    );
    persistCity(
      {
        ...city,
        inventory: [...inventory, item.id],
        collections: { ...collections, items: nextItemsCol },
      },
      { coins: coins - item.price },
    );
    setNotice(`${item.name} foi adicionado ao seu inventário!`);
  };

  const toggleEquipItem = (item) => {
    if (!item.equipSlot) return;
    const isEquipped = equipped[item.equipSlot] === item.id;
    const nextEquipped = {
      ...equipped,
      [item.equipSlot]: isEquipped ? null : item.id,
    };
    persistCity({ ...city, equipped: nextEquipped });
    setNotice(
      isEquipped ? `${item.name} desequipado.` : `${item.name} equipado!`,
    );
  };

  // Arcade Memory
  const startGame = () => {
    if (attemptedToday) {
      setNotice('Você já participou do desafio de memória hoje. Volte amanhã!');
      return;
    }
    if (coins < 5) {
      setNotice('Você precisa de 5 moedas para entrar no desafio.');
      return;
    }
    const nextSequence = Array.from({ length: 4 }, () =>
      Math.floor(Math.random() * 4),
    );
    setSequence(nextSequence);
    setPlayerSequence([]);
    setGameSeed((v) => v + 1);
    setGameState('preview');
    persistCity(
      { ...city, arcade: { ...arcade, lastAttemptDate: today } },
      { coins: coins - 5 },
    );
  };

  const choosePad = (value) => {
    if (gameState !== 'playing') return;
    const next = [...playerSequence, value];
    setPlayerSequence(next);
    if (next.some((item, index) => item !== sequence[index])) {
      setGameState('lost');
      setNotice('Sequência incorreta. Amanhã haverá uma nova rodada.');
      return;
    }
    if (next.length === sequence.length) {
      setGameState('won');
      persistCity(
        {
          ...city,
          arcade: { ...arcade, lastAttemptDate: today, lastWinDate: today },
        },
        { coins: coins + 12, xp: xp + 20 },
      );
      setNotice('Sequência perfeita! +12 moedas e +20 XP.');
    }
  };

  /* ==========================================================================
     RENDER HELPER DE SPRITES 16-BIT
     ========================================================================== */
  const tileSpriteStyle = (
    sheetUrl,
    sheetW,
    sheetH,
    sx,
    sy,
    sw = 16,
    sh = 16,
    scale = 3,
  ) => {
    if (!sheetUrl) return {};
    return {
      width: `${sw * scale}px`,
      height: `${sh * scale}px`,
      backgroundImage: `url("${sheetUrl}")`,
      backgroundPosition: `-${sx * scale}px -${sy * scale}px`,
      backgroundSize: `${sheetW * scale}px ${sheetH * scale}px`,
      backgroundRepeat: 'no-repeat',
      imageRendering: 'pixelated',
    };
  };

  const dirRowMap = { down: 0, up: 1, left: 2, right: 3 };
  const activeWalkCol = isWalking ? walkFrame : 0;
  const dronePos = {
    x: Math.max(0, player.x - 1),
    y: Math.max(0, player.y - 1),
  };

  const tabs = [
    ['explore', '🕹️ Cidade & Casa'],
    ['residents', '💬 Moradores'],
    ['quests', '📜 Missões & História'],
    ['market', '🛍️ Mercado'],
    ['inventory', '🎒 Inventário'],
    ['arcade', '🎮 Minijogos'],
    ['collections', '📖 Coleções & Eventos'],
    ['avatar', '🧑 Personagem'],
  ];

  // Agrupamento do inventário
  const inventoryEntries = useMemo(() => {
    const counts = {};
    inventory.forEach((id) => {
      counts[id] = (counts[id] || 0) + 1;
    });
    return Object.entries(counts).map(([id, qty]) => {
      const storeMatch = STORE_ITEMS.find((i) => i.id === id);
      if (storeMatch) return { ...storeMatch, qty };
      if (id.startsWith('harvest-')) {
        const sp = SEED_SPECIES.find((s) => `harvest-${s.id}` === id);
        return {
          id,
          name: sp?.name || 'Colheita Botânica',
          category: 'Colheitas & Pesca',
          type: 'Botânica',
          icon: sp?.icon || '🌿',
          qty,
          description: sp?.desc || 'Cultivada nos jardins do Vale Neo.',
        };
      }
      if (id.startsWith('fish-')) {
        const fs = FISH_SPECIES.find((f) => `fish-${f.id}` === id);
        return {
          id,
          name: fs?.name || 'Peixe Bio-Tech',
          category: 'Colheitas & Pesca',
          type: fs?.rarity || 'Pesca',
          icon: fs?.icon || '🐟',
          qty,
          description: fs?.desc || 'Capturado no cais do Vale Neo.',
        };
      }
      return {
        id,
        name: id,
        category: 'Decoração',
        type: 'Item',
        icon: '📦',
        qty,
        description: 'Item guardado na mochila.',
      };
    });
  }, [inventory]);

  return (
    <main className='neo-city-page'>
      <style>{styles}</style>

      {/* HERO & STATUS GERAL */}
      <section className='neo-hero'>
        <div className='neo-hero-grid' />
        <div className='neo-hero-copy'>
          <span className='neo-kicker'>
            NEO-LIFE // {activeFestival.icon}{' '}
            {activeFestival.name.toUpperCase()}
          </span>
          <h1>
            Sua vida real. <em>Sua cidade.</em>
          </h1>
          <p>
            Explore o Vale Neo em pixel art 16-bit, decore sua casa, cultive
            jardins sincronizados com seu foco e acompanhe as rotinas dos
            moradores.
          </p>
          <div className='neo-hero-actions'>
            <button onClick={() => onNavigate?.('tasks')}>
              ＋ Registrar no Meu Assistente
            </button>
            <span>
              {PERIOD_LABELS[currentPeriod].icon}{' '}
              {PERIOD_LABELS[currentPeriod].name} · {openCount}/
              {DISTRICTS.length} distritos ativos
            </span>
          </div>
        </div>

        <div className='neo-hero-right'>
          <div className='neo-wallet'>
            <span>CARTEIRA & EVOLUÇÃO</span>
            <strong>
              🪙 {coins.toLocaleString('pt-BR')} · ⚡{' '}
              {xp.toLocaleString('pt-BR')} XP
            </strong>
            <small>
              {stats.tasks} tarefas · {stats.studyMinutes}m foco ·{' '}
              {stats.habits} hábitos
            </small>
          </div>
          <div
            className='neo-time-switcher'
            role='group'
            aria-label='Período do dia'
          >
            {[
              ['auto', '🕒 Auto'],
              ['morning', '🌅 Manhã'],
              ['afternoon', '☀️ Tarde'],
              ['sunset', '🌇 Tarde-Fim'],
              ['night', '🌙 Noite'],
            ].map(([val, label]) => (
              <button
                key={val}
                type='button'
                className={timeOverride === val ? 'active' : ''}
                onClick={() => setTimeOverride(val)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* BARRA DE ABAS */}
      <nav
        className='neo-tabs'
        role='tablist'
        aria-label='Navegação do Vale Neo'
      >
        {tabs.map(([id, label]) => (
          <button
            key={id}
            role='tab'
            aria-selected={activeTab === id}
            className={activeTab === id ? 'active' : ''}
            onClick={() => setActiveTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {notice && (
        <div className='neo-notice' role='status' aria-live='polite'>
          <span>✨ {notice}</span>
          <button onClick={() => setNotice('')} aria-label='Fechar aviso'>
            ×
          </button>
        </div>
      )}

      {/* ======================================================================
          ABA 1: EXPLORAR CIDADE, JARDIM, BAIRROS EM CONSTRUÇÃO E MINHA CASA
          ====================================================================== */}
      {activeTab === 'explore' && (
        <>
          <section className='neo-section-heading'>
            <div>
              <span>
                {insideBuilding
                  ? `INTERIOR // ${insideBuilding.name.toUpperCase()}`
                  : `MUNDO ABERTO 16-BIT // ${PERIOD_LABELS[currentPeriod].name.toUpperCase()}`}
              </span>
              <h2>
                {insideBuilding
                  ? insideBuilding.isHome
                    ? `Minha Casa — ${insideBuilding.rooms[homeRoomIndex]}`
                    : insideBuilding.name
                  : 'Vale Neo'}
              </h2>
              <p>
                {insideBuilding
                  ? insideBuilding.isHome
                    ? 'Explore os 3 cômodos e ative o Modo Decoração para posicionar móveis livremente na grade.'
                    : insideBuilding.description
                  : 'Use WASD/setas para caminhar, E para interagir com portas, canteiros, moradores, cais de pesca e pista hoverboard.'}
              </p>
            </div>

            {!insideBuilding ? (
              <div
                className='neo-seed-bar'
                aria-label='Semente selecionada para o jardim'
              >
                <span>🌱 Semente:</span>
                {SEED_SPECIES.map((sp) => (
                  <button
                    key={sp.id}
                    type='button'
                    className={selectedSeedId === sp.id ? 'active' : ''}
                    onClick={() => setSelectedSeedId(sp.id)}
                    title={`${sp.name} (${sp.focusMinutesNeeded} min foco)`}
                  >
                    {sp.icon} {sp.name.split('-')[0]}
                  </button>
                ))}
              </div>
            ) : insideBuilding.isHome ? (
              <div className='neo-home-controls'>
                {insideBuilding.rooms.map((rName, idx) => (
                  <button
                    key={rName}
                    type='button'
                    className={homeRoomIndex === idx ? 'active' : ''}
                    onClick={() => setHomeRoomIndex(idx)}
                  >
                    {rName}
                  </button>
                ))}
                <button
                  type='button'
                  className={`neo-deco-toggle ${decorateMode ? 'active' : ''}`}
                  onClick={() => setDecorateMode((v) => !v)}
                >
                  🪑 {decorateMode ? 'Concluir Decoração' : 'Modo Decoração'}
                </button>
              </div>
            ) : null}
          </section>

          {!insideBuilding ? (
            <>
              <div className='neo-world-toolbar'>
                <span>
                  ✦ {PERIOD_LABELS[currentPeriod].icon} Luz{' '}
                  {PERIOD_LABELS[currentPeriod].light}
                  {equipped.mobility === 'skyboard'
                    ? ' · 🛹 Hoverboard Ativo (2×)'
                    : ''}
                </span>
                <div className='neo-toolbar-btns'>
                  <button
                    onClick={() => {
                      const home = WORLD_BUILDINGS[0];
                      enterBuilding(home);
                    }}
                  >
                    🏡 Entrar em Minha Casa
                  </button>
                  <button
                    onClick={() => {
                      setPlayer({ x: 8, y: 6 });
                      setWorldBubble(null);
                    }}
                  >
                    Praça Central
                  </button>
                </div>
              </div>

              <div className='neo-world-scroll'>
                <div
                  className={`neo-world-map period-${currentPeriod}`}
                  role='application'
                  aria-label='Mapa 16-bit do Vale Neo'
                >
                  {Array.from({ length: 20 * 12 }, (_, index) => {
                    const x = index % 20;
                    const y = Math.floor(index / 20);

                    const building = WORLD_BUILDINGS.find(
                      (b) =>
                        x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h,
                    );
                    const isBuildingAnchor =
                      building && x === building.x && y === building.y;
                    const buildingDistrict = building
                      ? DISTRICTS.find((d) => d.id === building.district)
                      : null;
                    const isBuildingBuilt =
                      !building ||
                      building.isHome ||
                      (buildingDistrict && districtOpen(buildingDistrict));

                    const door = WORLD_BUILDINGS.find(
                      (b) => b.door.x === x && b.door.y === y,
                    );
                    const prop = WORLD_PROPS.find(
                      (p) => p.x === x && p.y === y,
                    );
                    const plot = GARDEN_PLOTS.find(
                      (p) => p.x === x && p.y === y,
                    );
                    const residentHere = RESIDENTS.find((r) => {
                      const pos = npcPositions[r.id];
                      return pos && pos.x === x && pos.y === y;
                    });

                    // Malha urbana: avenidas principais, ruas secundárias e seis zonas
                    // inspiradas no mapa metropolitano neon.
                    const isRoad =
                      y === 6 ||
                      y === 7 ||
                      x === 8 ||
                      x === 12 ||
                      (y === 5 && x >= 3 && x <= 17) ||
                      (y === 10 && x >= 2 && x <= 17) ||
                      (x === 5 && y >= 1 && y <= 10) ||
                      (x === 15 && y >= 1 && y <= 10);
                    const isWater = isWaterTile(x, y);
                    const cityZone =
                      x <= 7 && y <= 5
                        ? 'central'
                        : x >= 8 && x <= 13 && y <= 5
                          ? 'academy'
                          : x >= 14 && y <= 7
                            ? 'green'
                            : x <= 6 && y >= 8
                              ? 'innovation'
                              : x >= 7 && x <= 13 && y >= 8
                                ? 'commerce'
                                : x >= 14 && y >= 8
                                  ? 'arcade'
                                  : 'boulevard';
                    const districtSign =
                      (x === 3 && y === 4) ||
                      (x === 10 && y === 4) ||
                      (x === 17 && y === 4) ||
                      (x === 3 && y === 11) ||
                      (x === 9 && y === 11) ||
                      (x === 17 && y === 11);
                    const isPark =
                      (x >= 7 && x <= 8 && y >= 1 && y <= 3) ||
                      (x >= 14 && x <= 14 && y >= 8 && y <= 10);
                    const isPath =
                      !isRoad &&
                      !building &&
                      !isWater &&
                      ((y === 3 && x >= 4 && x <= 16) ||
                        (y === 8 && x >= 3 && x <= 16) ||
                        (x === 2 && y >= 3 && y <= 7));

                    let terrainCol = (x * 3 + y * 5) % 4 === 0 ? 1 : 0;
                    let terrainRow = 0;
                    if (isWater) {
                      terrainCol = (animTick + x + y) % 6;
                      terrainRow = 2;
                    } else if (isRoad) {
                      terrainCol = (x + y) % 2 === 0 ? 2 : 3;
                      terrainRow = 1;
                    } else if (isPath) {
                      terrainCol = (x + y) % 2;
                      terrainRow = 1;
                    } else if (isPark) {
                      terrainCol = 4;
                      terrainRow = 0;
                    } else if ((x * 7 + y * 11) % 9 === 0) {
                      terrainCol = 2;
                      terrainRow = 0;
                    } else if ((x * 5 + y * 13) % 11 === 0) {
                      terrainCol = 3;
                      terrainRow = 0;
                    }

                    const playerHere = player.x === x && player.y === y;
                    const companionHere =
                      equipped.companion === 'drone-pet' &&
                      dronePos.x === x &&
                      dronePos.y === y;
                    const waterFrame = (animTick + x + y) % 2;

                    // Estágio do canteiro
                    const plotStage = plot ? getPlotStage(garden[plot.id]) : -1;

                    return (
                      <div
                        key={`${x}-${y}`}
                        className={`neo-world-tile zone-${cityZone} ${isRoad ? 'city-road' : ''} ${isWater ? 'city-water' : ''} ${isPark ? 'city-park' : ''}`}
                        style={{
                          gridColumn: x + 1,
                          gridRow: y + 1,
                          ...tileSpriteStyle(
                            sprites?.terrain,
                            128,
                            112,
                            terrainCol * 16,
                            terrainRow * 16,
                            16,
                            16,
                            3,
                          ),
                        }}
                      >
                        {districtSign && !building && !isWater ? (
                          <span
                            className={`neo-district-waypoint waypoint-${cityZone}`}
                          >
                            {
                              {
                                central: 'NÚCLEO',
                                academy: 'CAMPUS',
                                green: 'BIO PARQUE',
                                innovation: 'INOVAÇÃO',
                                commerce: 'MERCADO',
                                arcade: 'ARCADE',
                              }[cityZone]
                            }
                          </span>
                        ) : null}

                        {/* Construção 96x64 px (ou andaime se ainda estiver em construção!) */}
                        {isBuildingAnchor && sprites?.buildings ? (
                          <div
                            className={`neo-building-sprite-sheet ${isBuildingBuilt ? '' : 'under-construction'}`}
                            title={building.name}
                            onClick={() => enterBuilding(building)}
                            style={tileSpriteStyle(
                              sprites.buildings,
                              288,
                              192,
                              building.spriteCol * 96,
                              building.spriteRow * 64,
                              96,
                              64,
                              1.5,
                            )}
                          >
                            <span className='neo-building-tag'>
                              {isBuildingBuilt
                                ? building.name
                                : `🚧 ${building.name}`}
                            </span>
                          </div>
                        ) : null}

                        {/* Sobreposição visual de andaime nos tiles de prédio bloqueado */}
                        {building && !isBuildingBuilt && sprites?.terrain ? (
                          <span
                            className='neo-scaffold-overlay'
                            style={tileSpriteStyle(
                              sprites.terrain,
                              128,
                              112,
                              96,
                              32,
                              16,
                              16,
                              3,
                            )}
                          />
                        ) : null}

                        {/* Canteiros de jardim com 4 estágios de crescimento */}
                        {plot && sprites?.terrain ? (
                          <button
                            type='button'
                            className={`neo-plot-btn ${plotStage === 3 ? 'ready' : ''}`}
                            title={`${plot.label}: ${
                              plotStage === -1
                                ? 'Clique para plantar'
                                : plotStage === 3
                                  ? 'Pronto para colher!'
                                  : `Estágio ${plotStage + 1}/4 (clique para regar)`
                            }`}
                            onClick={() => handlePlotAction(plot)}
                            style={tileSpriteStyle(
                              sprites.terrain,
                              128,
                              112,
                              (plotStage === -1 ? 7 : plotStage) * 16,
                              plotStage === -1 ? 32 : 48,
                              16,
                              16,
                              3,
                            )}
                          >
                            {plotStage === 3 && (
                              <span className='neo-harvest-badge'>✨</span>
                            )}
                          </button>
                        ) : null}

                        {/* Natureza e objetos */}
                        {prop?.type === 'tree' && sprites?.terrain ? (
                          <span
                            className='neo-prop-sprite tall-tree'
                            style={tileSpriteStyle(
                              sprites.terrain,
                              128,
                              112,
                              0,
                              64,
                              32,
                              48,
                              1.6,
                            )}
                          />
                        ) : null}

                        {prop?.type === 'tree-lantern' && sprites?.terrain ? (
                          <span
                            className='neo-prop-sprite tall-tree'
                            style={tileSpriteStyle(
                              sprites.terrain,
                              128,
                              112,
                              32,
                              64,
                              32,
                              48,
                              1.6,
                            )}
                          />
                        ) : null}

                        {prop?.type === 'bush' && sprites?.terrain ? (
                          <span
                            className='neo-prop-sprite'
                            style={tileSpriteStyle(
                              sprites.terrain,
                              128,
                              112,
                              80,
                              0,
                              16,
                              16,
                              2.5,
                            )}
                          />
                        ) : null}

                        {prop?.type === 'crystal' && sprites?.terrain ? (
                          <span
                            className='neo-prop-sprite glow-node'
                            style={tileSpriteStyle(
                              sprites.terrain,
                              128,
                              112,
                              (6 + waterFrame) * 16,
                              0,
                              16,
                              16,
                              2.6,
                            )}
                          />
                        ) : null}

                        {prop?.type === 'bench' && sprites?.props ? (
                          <span
                            className='neo-prop-sprite bench'
                            style={tileSpriteStyle(
                              sprites.props,
                              128,
                              96,
                              0,
                              0,
                              32,
                              16,
                              2.8,
                            )}
                          />
                        ) : null}

                        {prop?.type === 'lamp' && sprites?.props ? (
                          <span
                            className='neo-prop-sprite tall-prop lamp-glow'
                            style={tileSpriteStyle(
                              sprites.props,
                              128,
                              96,
                              32 + waterFrame * 16,
                              0,
                              16,
                              32,
                              2.2,
                            )}
                          />
                        ) : null}

                        {prop?.type === 'holo' && sprites?.props ? (
                          <span
                            className='neo-prop-sprite tall-prop'
                            style={tileSpriteStyle(
                              sprites.props,
                              128,
                              96,
                              64 + waterFrame * 16,
                              0,
                              16,
                              32,
                              2.2,
                            )}
                          />
                        ) : null}

                        {prop?.type === 'terminal' && sprites?.props ? (
                          <span
                            className='neo-prop-sprite'
                            style={tileSpriteStyle(
                              sprites.props,
                              128,
                              96,
                              112,
                              0,
                              16,
                              16,
                              2.5,
                            )}
                          />
                        ) : null}

                        {prop?.type === 'fishing-spot' ? (
                          <button
                            type='button'
                            className='neo-spot-tag'
                            onClick={() => {
                              setActiveTab('arcade');
                              setMinigameMode('fishing');
                            }}
                          >
                            🎣 Pesca
                          </button>
                        ) : null}

                        {prop?.type === 'race-spot' ? (
                          <button
                            type='button'
                            className='neo-spot-tag'
                            onClick={() => {
                              setActiveTab('arcade');
                              setMinigameMode('hoverboard');
                            }}
                          >
                            🛹 Pista
                          </button>
                        ) : null}

                        {/* Porta interativa */}
                        {door ? (
                          <button
                            className='neo-door'
                            title={`Entrar em ${door.name}`}
                            onClick={() => enterBuilding(door)}
                          >
                            <span className='neo-door-marker'>▲</span>
                          </button>
                        ) : null}

                        {/* Moradores seguindo rotinas diárias */}
                        {residentHere && sprites?.residents ? (
                          <button
                            type='button'
                            className='neo-map-resident'
                            title={`Conversar com ${residentHere.name}`}
                            onClick={() =>
                              openResidentDialogue(residentHere, true)
                            }
                          >
                            <span
                              className='neo-resident-sprite'
                              style={tileSpriteStyle(
                                sprites.residents,
                                128,
                                240,
                                ((animTick + residentHere.spriteRow) % 4) * 32,
                                residentHere.spriteRow * 48,
                                32,
                                48,
                                1.35,
                              )}
                            />
                            <b>{residentHere.name}</b>
                          </button>
                        ) : null}

                        {/* Drone Companheiro equipado */}
                        {companionHere && sprites?.props ? (
                          <span
                            className='neo-npc-drone'
                            style={tileSpriteStyle(
                              sprites.props,
                              128,
                              96,
                              (animTick % 4) * 16,
                              32,
                              16,
                              16,
                              2.2,
                            )}
                          />
                        ) : null}

                        {/* Jogador 32x32 px */}
                        {playerHere && sprites?.player ? (
                          <span
                            className='neo-player-sprite'
                            aria-label='Jogador'
                            style={tileSpriteStyle(
                              sprites.player,
                              128,
                              128,
                              activeWalkCol * 32,
                              dirRowMap[lastDirection] * 32,
                              32,
                              32,
                              1.65,
                            )}
                          />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Diálogo ramificado rápido no mapa */}
              {worldBubble && (
                <div
                  className='neo-world-bubble'
                  role='dialog'
                  aria-label={`Conversa com ${worldBubble.name}`}
                >
                  <div className='neo-bubble-portrait'>
                    {sprites?.residents && (
                      <span
                        style={tileSpriteStyle(
                          sprites.residents,
                          128,
                          240,
                          (animTick % 4) * 32,
                          worldBubble.spriteRow * 48,
                          32,
                          48,
                          1.45,
                        )}
                      />
                    )}
                  </div>
                  <div className='neo-bubble-body'>
                    <div className='neo-bubble-header'>
                      <span>
                        {worldBubble.name.toUpperCase()} ·{' '}
                        {worldBubble.schedule[currentPeriod]?.label}
                      </span>
                      <b>
                        ❤️ Afinidade: {Number(affinity[worldBubble.id]) || 0}
                        /100
                      </b>
                    </div>
                    <p>
                      {dialogueStep === 'farewell'
                        ? `“Obrigado pela visita! Estarei sempre por perto se quiser trocar ideias.”`
                        : `“Olá! Que bom ver você por aqui. Como posso apoiar sua jornada hoje?”`}
                    </p>
                    <div className='neo-branch-choices'>
                      <button
                        type='button'
                        onClick={() =>
                          applyDialogueChoice(worldBubble, {
                            affinityDelta: 5,
                            nextStep: 'farewell',
                          })
                        }
                      >
                        💬 Conversar sobre o dia (+5 ❤️)
                      </button>
                      <button
                        type='button'
                        onClick={() =>
                          applyDialogueChoice(worldBubble, {
                            action: 'gift',
                            affinityDelta: 12,
                            nextStep: 'farewell',
                          })
                        }
                      >
                        🎁 Dar colheita/peixe (+12 ❤️)
                      </button>
                      {worldBubble.id === 'kai' && (
                        <button
                          type='button'
                          onClick={() =>
                            applyDialogueChoice(worldBubble, {
                              action: 'sync-task',
                              affinityDelta: 6,
                              nextStep: 'farewell',
                            })
                          }
                        >
                          ✅ Concluir tarefa real (+15 🪙)
                        </button>
                      )}
                      {worldBubble.id === 'luna' && (
                        <button
                          type='button'
                          onClick={() =>
                            applyDialogueChoice(worldBubble, {
                              action: 'sync-focus',
                              affinityDelta: 6,
                              nextStep: 'farewell',
                            })
                          }
                        >
                          ⏱️ Registrar 25m de foco (+25 XP)
                        </button>
                      )}
                      {worldBubble.id === 'nox' && (
                        <button
                          type='button'
                          onClick={() =>
                            applyDialogueChoice(worldBubble, {
                              action: 'sync-habit',
                              affinityDelta: 6,
                              nextStep: 'farewell',
                            })
                          }
                        >
                          🌿 Marcar hábito de hoje (+12 🪙)
                        </button>
                      )}
                    </div>
                  </div>
                  <button
                    className='neo-close-x'
                    onClick={() => setWorldBubble(null)}
                    aria-label='Fechar conversa'
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Controles Mobile e Acessibilidade */}
              <div className='neo-world-controls'>
                <div
                  className='neo-dpad'
                  role='group'
                  aria-label='Controles direcionais'
                >
                  <button
                    onClick={() => movePlayer(0, -1)}
                    aria-label='Mover para cima'
                  >
                    ▲
                  </button>
                  <div>
                    <button
                      onClick={() => movePlayer(-1, 0)}
                      aria-label='Mover para esquerda'
                    >
                      ◀
                    </button>
                    <button
                      onClick={() => movePlayer(0, 1)}
                      aria-label='Mover para baixo'
                    >
                      ▼
                    </button>
                    <button
                      onClick={() => movePlayer(1, 0)}
                      aria-label='Mover para direita'
                    >
                      ▶
                    </button>
                  </div>
                </div>
                <button
                  type='button'
                  className='neo-interact-btn'
                  onClick={interactInWorld}
                >
                  ✦ Interagir (E)
                </button>
                <p>
                  Clique nos canteiros para plantar/colher, nos moradores para
                  conversar ou nas portas para entrar nos edifícios e na sua
                  casa.
                </p>
              </div>
            </>
          ) : (
            /* ================================================================
               INTERIORES EXPLORÁVEIS (MINHA CASA COM GRADE DE DECORAÇÃO + PRÉDIOS)
               ================================================================ */
            <div className='neo-interior'>
              <div className='neo-interior-header'>
                <span>
                  {insideBuilding.isHome
                    ? `MINHA CASA · CÔMODO ${homeRoomIndex + 1}/3`
                    : `DISTRITO // ${insideBuilding.district.toUpperCase()}`}
                </span>
                <button onClick={leaveBuilding}>← Sair para a cidade</button>
              </div>

              <div className='neo-interior-room'>
                <div className='neo-interior-map'>
                  {Array.from({ length: 60 }, (_, index) => {
                    const x = index % 10;
                    const y = Math.floor(index / 10);
                    const isWall = y === 0 || y === 5 || x === 0 || x === 9;
                    const isRug = x >= 4 && x <= 6 && y >= 3 && y <= 4;
                    const isPlayer =
                      interiorPlayer.x === x && interiorPlayer.y === y;

                    const roomFurniture = insideBuilding.isHome
                      ? safeArray(homeLayouts[homeRoomIndex]).find(
                          (item) => item.x === x && item.y === y,
                        )
                      : null;
                    const furnMeta = roomFurniture
                      ? STORE_ITEMS.find((s) => s.id === roomFurniture.itemId)
                      : null;

                    const stationIndex =
                      !insideBuilding.isHome && y === 2
                        ? x < 3
                          ? 0
                          : x < 7
                            ? 1
                            : 2
                        : -1;
                    const station =
                      !insideBuilding.isHome && y === 2 && [1, 4, 8].includes(x)
                        ? insideBuilding.rooms[stationIndex]
                        : null;

                    const floorCol = isWall ? 6 : isRug ? 7 : 5;

                    return (
                      <div
                        key={index}
                        onClick={() =>
                          insideBuilding.isHome && handleHomeTileClick(x, y)
                        }
                        className={`neo-interior-tile ${isWall ? 'wall' : ''} ${
                          decorateMode && !isWall ? 'grid-editable' : ''
                        }`}
                        style={{
                          gridColumn: x + 1,
                          gridRow: y + 1,
                          ...tileSpriteStyle(
                            sprites?.terrain,
                            128,
                            112,
                            floorCol * 16,
                            16,
                            16,
                            16,
                            3.3,
                          ),
                        }}
                      >
                        {/* Móvel posicionado na grade da casa */}
                        {furnMeta?.spriteTile && sprites?.terrain ? (
                          <span
                            className='neo-placed-furniture'
                            title={`${furnMeta.name} (clique no Modo Decoração para guardar)`}
                            style={{
                              ...tileSpriteStyle(
                                sprites.terrain,
                                128,
                                112,
                                furnMeta.spriteTile.col * 16,
                                furnMeta.spriteTile.row * 16,
                                16,
                                16,
                                3,
                              ),
                              transform: roomFurniture.flip
                                ? 'scaleX(-1)'
                                : 'none',
                            }}
                          />
                        ) : null}

                        {/* Estações interativas dos prédios públicos */}
                        {station ? (
                          <button
                            type='button'
                            className='neo-station-btn'
                            onClick={() =>
                              setNotice(
                                `${station}: use o formulário abaixo para registrar progresso real no seu aplicativo.`,
                              )
                            }
                          >
                            <b>{station}</b>
                            <small>Ativo</small>
                          </button>
                        ) : null}

                        {isPlayer && sprites?.player ? (
                          <span
                            className='neo-player-sprite interior'
                            style={tileSpriteStyle(
                              sprites.player,
                              128,
                              128,
                              activeWalkCol * 32,
                              dirRowMap[lastDirection] * 32,
                              32,
                              32,
                              1.55,
                            )}
                          />
                        ) : null}

                        {x === 5 && y === 5 ? (
                          <button
                            type='button'
                            className='neo-interior-door'
                            onClick={leaveBuilding}
                            title='Sair'
                          >
                            🚪
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                {/* Barra de decoração da casa OU painel de integração real do prédio */}
                {insideBuilding.isHome ? (
                  <div className='neo-deco-dock'>
                    <div className='neo-deco-dock-head'>
                      <b>
                        {decorateMode
                          ? 'Clique em um quadrado livre para colocar ou em um móvel para recolher'
                          : 'Ative o Modo Decoração acima para reorganizar seus móveis'}
                      </b>
                      {decorateMode && (
                        <button
                          type='button'
                          onClick={() => setFurnFlipped((f) => !f)}
                        >
                          ↔ Girar ({furnFlipped ? 'Invertido' : 'Normal'})
                        </button>
                      )}
                    </div>
                    <div className='neo-deco-items'>
                      {inventoryEntries
                        .filter((i) => i.category === 'Decoração')
                        .map((item) => (
                          <button
                            key={item.id}
                            type='button'
                            className={
                              selectedFurnItem === item.id ? 'active' : ''
                            }
                            onClick={() => {
                              setDecorateMode(true);
                              setSelectedFurnItem(item.id);
                            }}
                          >
                            {item.icon} {item.name} (×{item.qty})
                          </button>
                        ))}
                      {inventoryEntries.filter(
                        (i) => i.category === 'Decoração',
                      ).length === 0 && (
                        <small>
                          Compre móveis no Mercado Neon para decorar todos os
                          cômodos!
                        </small>
                      )}
                    </div>
                  </div>
                ) : (
                  <form
                    className='neo-building-sync-form'
                    onSubmit={handleBuildingRealAction}
                  >
                    <label htmlFor='neo-sync-input'>
                      {insideBuilding.id === 'central-hub'
                        ? '＋ Adicionar nova tarefa real no Meu Assistente:'
                        : insideBuilding.id === 'university'
                          ? '⏱️ Registrar minutos reais de foco/estudo:'
                          : insideBuilding.id === 'innovation-lab'
                            ? '🧬 Criar novo projeto real no Meu Assistente:'
                            : '📖 Registrar leitura ou descoberta real:'}
                    </label>
                    <div>
                      <input
                        id='neo-sync-input'
                        value={quickInput}
                        onChange={(e) => setQuickInput(e.target.value)}
                        placeholder={
                          insideBuilding.id === 'university'
                            ? 'Ex: 25'
                            : 'Digite aqui para salvar no app...'
                        }
                      />
                      <button type='submit'>Salvar no App</button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ======================================================================
          ABA 2: MORADORES, ROTINAS, AFINIDADE E DIÁLOGOS RAMIFICADOS
          ====================================================================== */}
      {activeTab === 'residents' && (
        <>
          <section className='neo-section-heading'>
            <div>
              <span>COMUNIDADE & ROTINAS DIÁRIAS</span>
              <h2>Moradores do Vale Neo</h2>
              <p>
                Cada morador segue uma rotina própria ao longo do dia e
                desbloqueia capítulos pessoais conforme sua afinidade cresce.
              </p>
            </div>
            <div className='neo-level-chip'>
              {PERIOD_LABELS[currentPeriod].icon} Agora:{' '}
              {PERIOD_LABELS[currentPeriod].name}
            </div>
          </section>

          <section className='neo-resident-grid'>
            {RESIDENTS.map((resident) => {
              const aff = Number(affinity[resident.id]) || 0;
              const hearts = Math.min(5, Math.floor(aff / 20));
              const routineSpot = resident.schedule[currentPeriod];

              return (
                <article className='neo-resident-card' key={resident.id}>
                  <div className='neo-resident-avatar'>
                    {sprites?.residents ? (
                      <span
                        style={tileSpriteStyle(
                          sprites.residents,
                          128,
                          240,
                          (animTick % 4) * 32,
                          resident.spriteRow * 48,
                          32,
                          48,
                          1.15,
                        )}
                      />
                    ) : (
                      resident.avatar
                    )}
                  </div>
                  <div>
                    <span>
                      📍 {routineSpot?.label} · {'❤️'.repeat(hearts) || '🤍'} (
                      {aff}/100)
                    </span>
                    <h3>{resident.name}</h3>
                    <p>{resident.role}</p>
                    <small>
                      {Number(talks[resident.id]) || 0} conversas registradas
                    </small>
                  </div>
                  <button onClick={() => openResidentDialogue(resident, false)}>
                    Conversar ↗
                  </button>
                </article>
              );
            })}
          </section>

          {selectedResident && (
            <div
              className='neo-dialogue'
              role='dialog'
              aria-modal='true'
              aria-label={`Conversa com ${selectedResident.name}`}
            >
              <button
                className='neo-dialogue-close'
                onClick={() => setSelectedResident(null)}
                aria-label='Fechar'
              >
                ×
              </button>
              <div className='neo-dialogue-top'>
                {sprites?.residents && (
                  <span
                    style={tileSpriteStyle(
                      sprites.residents,
                      128,
                      240,
                      (animTick % 4) * 32,
                      selectedResident.spriteRow * 48,
                      32,
                      48,
                      1.4,
                    )}
                  />
                )}
                <div>
                  <span>
                    AFINIDADE: {Number(affinity[selectedResident.id]) || 0}/100
                    · {selectedResident.role}
                  </span>
                  <h3>{selectedResident.name}</h3>
                </div>
              </div>

              <p>
                {dialogueStep === 'farewell'
                  ? `“Fico feliz em caminhar lado a lado com você no Vale Neo. Quando quiser, passe na praça ou no meu setor!”`
                  : `“Seu progresso real está transformando nossa vizinhança. O que gostaria de fazer agora?”`}
              </p>

              <div className='neo-branch-choices'>
                <button
                  type='button'
                  onClick={() =>
                    applyDialogueChoice(selectedResident, {
                      affinityDelta: 5,
                      nextStep: 'farewell',
                    })
                  }
                >
                  💬 Trocar ideias sobre projetos (+5 ❤️)
                </button>
                <button
                  type='button'
                  onClick={() =>
                    applyDialogueChoice(selectedResident, {
                      action: 'gift',
                      affinityDelta: 12,
                      nextStep: 'farewell',
                    })
                  }
                >
                  🎁 Entregar presente colhido/pescado (+12 ❤️)
                </button>
                {selectedResident.id === 'kai' && (
                  <button
                    type='button'
                    onClick={() =>
                      applyDialogueChoice(selectedResident, {
                        action: 'sync-task',
                        affinityDelta: 6,
                        nextStep: 'farewell',
                      })
                    }
                  >
                    ✅ Concluir próxima tarefa real (+15 🪙)
                  </button>
                )}
                {selectedResident.id === 'luna' && (
                  <button
                    type='button'
                    onClick={() =>
                      applyDialogueChoice(selectedResident, {
                        action: 'sync-focus',
                        affinityDelta: 6,
                        nextStep: 'farewell',
                      })
                    }
                  >
                    ⏱️ Registrar sessão de foco 25m (+25 XP)
                  </button>
                )}
                {selectedResident.id === 'nox' && (
                  <button
                    type='button'
                    onClick={() =>
                      applyDialogueChoice(selectedResident, {
                        action: 'sync-habit',
                        affinityDelta: 6,
                        nextStep: 'farewell',
                      })
                    }
                  >
                    🌿 Registrar hábito diário (+12 🪙)
                  </button>
                )}
              </div>

              {/* Histórias desbloqueadas por afinidade */}
              <div className='neo-story-unlocks'>
                <h4>Histórias de {selectedResident.name}</h4>
                {selectedResident.storyChapters.map((chap) => {
                  const unlocked =
                    (Number(affinity[selectedResident.id]) || 0) >=
                    chap.affinity;
                  return (
                    <div
                      key={chap.title}
                      className={`neo-story-chap ${unlocked ? '' : 'locked'}`}
                    >
                      <b>
                        {unlocked ? '📖' : '🔒'} {chap.title} (Req.{' '}
                        {chap.affinity} ❤️)
                      </b>
                      <p>
                        {unlocked
                          ? chap.text
                          : 'Aumente sua afinidade conversando e presenteando para revelar este capítulo.'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ======================================================================
          ABA 3: MISSÕES VERIFICÁVEIS, EVOLUÇÃO DOS DISTRITOS E CAMPANHA
          ====================================================================== */}
      {activeTab === 'quests' && (
        <>
          <section className='neo-section-heading'>
            <div>
              <span>CAMPANHA NARRATIVA & OBJETIVOS VERIFICÁVEIS</span>
              <h2>Missões e Evolução dos Bairros</h2>
              <p>
                Missões conectadas aos seus hábitos, tarefas, estudos e
                exploração da cidade.
              </p>
            </div>
            <div className='neo-level-chip'>
              🏆 {claimedQuests.length}/{questsList.length} concluídas
            </div>
          </section>

          <section className='neo-quests-grid'>
            {questsList.map((q) => {
              const isClaimed = claimedQuests.includes(q.id);
              const isDone = q.progress >= q.target;
              const pct = Math.min(
                100,
                Math.round((q.progress / q.target) * 100),
              );
              return (
                <article
                  key={q.id}
                  className={`neo-quest-card ${isClaimed ? 'claimed' : ''}`}
                >
                  <span>{q.type}</span>
                  <h3>{q.title}</h3>
                  <p>{q.desc}</p>
                  <div className='neo-district-progress'>
                    <div>
                      <span>Progresso</span>
                      <b>
                        {q.progress}/{q.target}
                      </b>
                    </div>
                    <i>
                      <u style={{ width: `${pct}%` }} />
                    </i>
                  </div>
                  <div className='neo-quest-footer'>
                    <small>
                      Recompensa: 🪙 {q.rewardCoins} · ⚡ {q.rewardXp} XP
                    </small>
                    <button
                      disabled={isClaimed || !isDone}
                      onClick={() => claimQuest(q)}
                    >
                      {isClaimed
                        ? '✓ Resgatada'
                        : isDone
                          ? 'Resgatar'
                          : 'Em andamento'}
                    </button>
                  </div>
                </article>
              );
            })}
          </section>

          <section className='neo-section-heading'>
            <div>
              <span>CONSTRUÇÃO VISUAL DE BAIRROS</span>
              <h2>Status dos 6 Distritos</h2>
            </div>
          </section>
          <section className='neo-district-grid'>
            {DISTRICTS.map((district) => {
              const unlocked = districtOpen(district);
              const value = districtValue(district);
              const pct =
                district.threshold === 0
                  ? 100
                  : Math.min(
                      100,
                      Math.round((value / district.threshold) * 100),
                    );
              return (
                <article
                  key={district.id}
                  className={`neo-district ${district.color} ${unlocked ? '' : 'locked'}`}
                >
                  <div className='neo-district-top'>
                    <span className='neo-district-icon'>
                      {unlocked ? district.icon : '🚧'}
                    </span>
                    <span className='neo-status'>
                      {unlocked ? 'INAUGURADO' : 'EM CONSTRUÇÃO'}
                    </span>
                  </div>
                  <h3>{district.name}</h3>
                  <p>{district.desc}</p>
                  <div className='neo-district-progress'>
                    <div>
                      <span>Meta do setor</span>
                      <b>
                        {value}/{district.threshold || 'Ativo'}
                      </b>
                    </div>
                    <i>
                      <u style={{ width: `${pct}%` }} />
                    </i>
                  </div>
                </article>
              );
            })}
          </section>
        </>
      )}

      {/* ======================================================================
          ABA 4: MERCADO NEON
          ====================================================================== */}
      {activeTab === 'market' && (
        <>
          <section className='neo-section-heading'>
            <div>
              <span>MERCADO NEON</span>
              <h2>Móveis, Roupas e Equipamentos</h2>
              <p>
                Adquira itens com suas moedas conquistadas para decorar sua casa
                ou equipar seu personagem.
              </p>
            </div>
            <div className='neo-level-chip'>🪙 {coins} moedas</div>
          </section>
          <section className='neo-shop-grid'>
            {STORE_ITEMS.map((item) => {
              const ownedQty = inventory.filter((id) => id === item.id).length;
              const isUniqueEquip = Boolean(item.equipSlot) && ownedQty > 0;
              return (
                <article className='neo-shop-item' key={item.id}>
                  <div className='neo-item-art'>
                    {item.icon}
                    <span>{item.category}</span>
                  </div>
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <div>
                    <b>
                      🪙 {item.price}{' '}
                      {ownedQty > 0 ? `(Possui: ${ownedQty})` : ''}
                    </b>
                    <button
                      disabled={isUniqueEquip || coins < item.price}
                      onClick={() => buyItem(item)}
                    >
                      {isUniqueEquip
                        ? '✓ Adquirido'
                        : coins < item.price
                          ? 'Moedas insuficientes'
                          : 'Comprar'}
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        </>
      )}

      {/* ======================================================================
          ABA 5: INVENTÁRIO COM CATEGORIAS, EQUIPAMENTOS E ROUPAS
          ====================================================================== */}
      {activeTab === 'inventory' && (
        <>
          <section className='neo-section-heading'>
            <div>
              <span>MOCHILA & EQUIPAMENTOS</span>
              <h2>Inventário Categorizado</h2>
              <p>
                Equipe trajes, hoverboard ou drone companheiro, ou gerencie seus
                móveis e colheitas.
              </p>
            </div>
            <div className='neo-seed-bar'>
              {[
                'Todos',
                'Decoração',
                'Roupas',
                'Equipamentos',
                'Companheiros',
                'Colheitas & Pesca',
              ].map((cat) => (
                <button
                  key={cat}
                  type='button'
                  className={invCategory === cat ? 'active' : ''}
                  onClick={() => setInvCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </section>

          {inventoryEntries.filter(
            (i) => invCategory === 'Todos' || i.category === invCategory,
          ).length ? (
            <section className='neo-inventory-grid'>
              {inventoryEntries
                .filter(
                  (i) => invCategory === 'Todos' || i.category === invCategory,
                )
                .map((item) => {
                  const isEquipped =
                    item.equipSlot && equipped[item.equipSlot] === item.id;
                  return (
                    <article key={item.id} className='neo-inv-card'>
                      <span>{item.icon}</span>
                      <div>
                        <b>
                          {item.name} {item.qty > 1 ? `×${item.qty}` : ''}
                        </b>
                        <small>
                          {item.category} · {item.description}
                        </small>
                      </div>
                      {item.equipSlot ? (
                        <button
                          type='button'
                          className={`neo-equip-btn ${isEquipped ? 'equipped' : ''}`}
                          onClick={() => toggleEquipItem(item)}
                        >
                          {isEquipped ? '✓ Equipado' : 'Equipar'}
                        </button>
                      ) : item.category === 'Decoração' ? (
                        <button
                          type='button'
                          className='neo-equip-btn'
                          onClick={() => {
                            setActiveTab('explore');
                            enterBuilding(WORLD_BUILDINGS[0]);
                            setDecorateMode(true);
                            setSelectedFurnItem(item.id);
                          }}
                        >
                          Decorar ↗
                        </button>
                      ) : (
                        <i>✓</i>
                      )}
                    </article>
                  );
                })}
            </section>
          ) : (
            <div className='neo-empty-inventory'>
              <span>🎒</span>
              <h3>Nenhum item nesta categoria</h3>
              <p>
                Visite o Mercado Neon, cultive o jardim ou pesque no cais para
                ampliar sua mochila.
              </p>
              <button onClick={() => setActiveTab('market')}>
                Ir ao Mercado
              </button>
            </div>
          )}
        </>
      )}

      {/* ======================================================================
          ABA 6: MINIJOGOS (PESCA TECNOLÓGICA, HOVERBOARD, MEMÓRIA E CIRCUITO)
          ====================================================================== */}
      {activeTab === 'arcade' && (
        <>
          <section className='neo-section-heading'>
            <div>
              <span>ATIVIDADES & DESAFIOS</span>
              <h2>Minijogos do Vale Neo</h2>
              <p>
                Pesque espécies bio-tech, corra de hoverboard ou resolva os
                puzzles lógicos do Arcade 88.
              </p>
            </div>
            <div className='neo-seed-bar'>
              {[
                ['fishing', '🎣 Pesca Tecnológica'],
                ['hoverboard', '🛹 Corrida Hoverboard'],
                ['memory', '🧠 Neural Link'],
                ['circuit', '⚡ Circuito Lógico'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type='button'
                  className={minigameMode === id ? 'active' : ''}
                  onClick={() => setMinigameMode(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          {minigameMode === 'fishing' && (
            <section className='neo-minigame-panel'>
              <h3>🎣 Cais de Pesca Bio-Tech</h3>
              <p>
                Lance a linha e clique em <b>Puxar Linha</b> quando o marcador
                dourado estiver dentro da zona central azul-petróleo.
              </p>
              <div className='neo-fishing-meter'>
                <div
                  className='neo-fishing-zone'
                  style={{
                    width: equipped.tool === 'bio-rod' ? '44%' : '28%',
                  }}
                />
                <div
                  className='neo-fishing-needle'
                  style={{ left: `${fishBarPos}%` }}
                />
              </div>
              <div className='neo-minigame-actions'>
                {fishPhase === 'idle' && (
                  <button type='button' onClick={castFishingLine}>
                    🎣 Lançar Linha
                  </button>
                )}
                {fishPhase === 'casting' && (
                  <button type='button' disabled>
                    Aguardando fisgada...
                  </button>
                )}
                {fishPhase === 'bite' && (
                  <button
                    type='button'
                    className='neo-bite-btn'
                    onClick={reelFish}
                  >
                    ❗ FISGOU! Puxar Agora
                  </button>
                )}
              </div>
              {lastCaughtFish && (
                <div className='neo-catch-card'>
                  <span>{lastCaughtFish.icon}</span>
                  <div>
                    <b>
                      {lastCaughtFish.name} ({lastCaughtFish.rarity})
                    </b>
                    <p>{lastCaughtFish.desc}</p>
                  </div>
                </div>
              )}
            </section>
          )}

          {minigameMode === 'hoverboard' && (
            <section className='neo-minigame-panel'>
              <h3>🛹 Corrida de Hoverboard</h3>
              <p>
                Use as setas <b>◀ ▶</b> (ou botões abaixo) para desviar dos
                cones de energia e coletar orbes dourados.
              </p>
              <div className='neo-race-track' aria-label='Pista de Hoverboard'>
                {[0, 1, 2].map((lane) => (
                  <div key={lane} className='neo-race-lane'>
                    {raceObstacles
                      .filter((o) => o.lane === lane)
                      .map((o) => (
                        <span
                          key={o.id}
                          className={`neo-race-entity ${o.isOrb ? 'orb' : 'cone'}`}
                          style={{ top: `${o.y}%` }}
                        >
                          {o.isOrb ? '✨' : '🚧'}
                        </span>
                      ))}
                    {raceLane === lane && (
                      <span className='neo-race-player'>🛹</span>
                    )}
                  </div>
                ))}
              </div>
              <div className='neo-minigame-actions'>
                {!raceActive ? (
                  <button type='button' onClick={startHoverboardRace}>
                    🚀 Iniciar Corrida (
                    {activeFestival.id === 'solstice-market'
                      ? 'Grátis no Festival!'
                      : '3 moedas'}
                    )
                  </button>
                ) : (
                  <>
                    <button
                      type='button'
                      onClick={() => setRaceLane((l) => Math.max(0, l - 1))}
                    >
                      ◀ Esquerda
                    </button>
                    <b>Pontuação: {raceScore}</b>
                    <button
                      type='button'
                      onClick={() => setRaceLane((l) => Math.min(2, l + 1))}
                    >
                      Direita ▶
                    </button>
                  </>
                )}
              </div>
            </section>
          )}

          {minigameMode === 'circuit' && (
            <section className='neo-minigame-panel'>
              <h3>⚡ Circuito Bio-Energético</h3>
              <p>
                Clique nos nós para alternar a frequência até alinhar toda a
                diagonal principal em <b>Nível 3 (Dourado)</b>.
              </p>
              <div className='neo-circuit-grid'>
                {circuitGrid.map((val, idx) => (
                  <button
                    key={idx}
                    type='button'
                    className={`neo-circuit-node state-${val}`}
                    onClick={() => rotateCircuitNode(idx)}
                  >
                    {val === 0 ? '○' : val === 1 ? '◈' : '✦'}
                    <small>Nível {val + 1}</small>
                  </button>
                ))}
              </div>
            </section>
          )}

          {minigameMode === 'memory' && (
            <section className='neo-arcade-card'>
              <div className='neo-arcade-screen'>
                <div className='neo-arcade-top'>
                  <span>NEURAL LINK // MEMORY GRID</span>
                  <b>
                    {gameState === 'playing'
                      ? `${playerSequence.length}/4`
                      : gameState === 'preview'
                        ? 'MEMORIZE'
                        : gameState === 'won'
                          ? 'VITÓRIA'
                          : gameState === 'lost'
                            ? 'FIM DE JOGO'
                            : 'AGUARDANDO'}
                  </b>
                </div>
                <div className='neo-sequence-preview'>
                  {gameState === 'preview'
                    ? sequence.map((entry, index) => (
                        <span key={index}>{['✦', '◈', '⌁', '✧'][entry]}</span>
                      ))
                    : null}
                </div>
                <div className='neo-pad-grid' key={gameSeed}>
                  {[0, 1, 2, 3].map((value) => (
                    <button
                      key={value}
                      className={`neo-pad pad-${value} ${playerSequence.includes(value) && gameState === 'playing' ? 'selected' : ''}`}
                      disabled={gameState !== 'playing'}
                      onClick={() => choosePad(value)}
                      aria-label={`Botão ${value + 1}`}
                    >
                      {['✦', '◈', '⌁', '✧'][value]}
                    </button>
                  ))}
                </div>
                {gameState === 'preview' ? (
                  <button
                    className='neo-game-start'
                    onClick={() => setGameState('playing')}
                  >
                    Já memorizei · começar
                  </button>
                ) : (
                  <button
                    className='neo-game-start'
                    disabled={
                      attemptedToday || coins < 5 || gameState === 'playing'
                    }
                    onClick={startGame}
                  >
                    {gameState === 'won'
                      ? 'Desafio concluído'
                      : attemptedToday
                        ? 'Volte amanhã'
                        : 'Iniciar desafio · 5 moedas'}
                  </button>
                )}
              </div>
              <aside className='neo-arcade-info'>
                <span>COMO JOGAR</span>
                <h3>Teste sua memória</h3>
                <ol>
                  <li>Entre no desafio por 5 moedas.</li>
                  <li>Memorize os 4 símbolos exibidos.</li>
                  <li>
                    Repita na ordem correta para ganhar +12 moedas e +20 XP.
                  </li>
                </ol>
              </aside>
            </section>
          )}
        </>
      )}

      {/* ======================================================================
          ABA 7: FESTIVAIS SAZONAIS E COLEÇÕES
          ====================================================================== */}
      {activeTab === 'collections' && (
        <>
          <section className='neo-section-heading'>
            <div>
              <span>CALENDÁRIO SAZONAL</span>
              <h2>Festivais do Vale Neo</h2>
              <p>
                Celebrações ao longo das estações trazem bônus e lembranças
                especiais para sua casa.
              </p>
            </div>
          </section>

          <section className='neo-festivals-grid'>
            {SEASONAL_FESTIVALS.map((fest) => {
              const isCurrent = fest.id === activeFestival.id;
              const isClaimed = claimedFestivals.includes(fest.id);
              return (
                <article
                  key={fest.id}
                  className={`neo-festival-card ${isCurrent ? 'current' : ''}`}
                >
                  <div className='neo-fest-top'>
                    <span>
                      {fest.icon} {fest.season}
                    </span>
                    <b>{isCurrent ? 'ATIVO AGORA' : 'CALENDÁRIO'}</b>
                  </div>
                  <h3>{fest.name}</h3>
                  <p>{fest.desc}</p>
                  <small>✨ {fest.bonusText}</small>
                  {isCurrent && (
                    <button
                      type='button'
                      disabled={isClaimed}
                      onClick={() => {
                        persistCity({
                          ...city,
                          inventory: [...inventory, fest.giftItem],
                          claimedFestivals: [...claimedFestivals, fest.id],
                        });
                        setNotice(
                          `Lembrança do ${fest.name} adicionada ao seu inventário!`,
                        );
                      }}
                    >
                      {isClaimed
                        ? '✓ Lembrança Resgatada'
                        : '🎁 Resgatar Lembrança do Festival'}
                    </button>
                  )}
                </article>
              );
            })}
          </section>

          <section className='neo-section-heading'>
            <div>
              <span>COMPÊNDIO DO VALE</span>
              <h2>Coleções de Espécies, Locais e Itens</h2>
            </div>
          </section>

          <section className='neo-collections-grid'>
            <article className='neo-col-box'>
              <h3>
                🏛️ Locais Descobertos ({safeArray(collections.locations).length}
                /{WORLD_BUILDINGS.length})
              </h3>
              <div className='neo-col-chips'>
                {WORLD_BUILDINGS.map((b) => {
                  const found = safeArray(collections.locations).includes(b.id);
                  return (
                    <span key={b.id} className={found ? 'found' : 'missing'}>
                      {found ? `${b.icon} ${b.name}` : '❓ Local não visitado'}
                    </span>
                  );
                })}
              </div>
            </article>

            <article className='neo-col-box'>
              <h3>
                🌿 Espécies Botânicas ({safeArray(collections.plants).length}/
                {SEED_SPECIES.length})
              </h3>
              <div className='neo-col-chips'>
                {SEED_SPECIES.map((s) => {
                  const found = safeArray(collections.plants).includes(s.id);
                  return (
                    <span key={s.id} className={found ? 'found' : 'missing'}>
                      {found ? `${s.icon} ${s.name}` : '❓ Semente não colhida'}
                    </span>
                  );
                })}
              </div>
            </article>

            <article className='neo-col-box'>
              <h3>
                🐟 Peixes Bio-Tech ({safeArray(collections.fish).length}/
                {FISH_SPECIES.length})
              </h3>
              <div className='neo-col-chips'>
                {FISH_SPECIES.map((f) => {
                  const found = safeArray(collections.fish).includes(f.id);
                  return (
                    <span key={f.id} className={found ? 'found' : 'missing'}>
                      {found ? `${f.icon} ${f.name}` : '❓ Espécie não pescada'}
                    </span>
                  );
                })}
              </div>
            </article>

            <article className='neo-col-box'>
              <h3>
                🎒 Catálogo de Itens ({safeArray(collections.items).length}/
                {STORE_ITEMS.length})
              </h3>
              <div className='neo-col-chips'>
                {STORE_ITEMS.map((i) => {
                  const found = safeArray(collections.items).includes(i.id);
                  return (
                    <span key={i.id} className={found ? 'found' : 'missing'}>
                      {found ? `${i.icon} ${i.name}` : '❓ Item do Mercado'}
                    </span>
                  );
                })}
              </div>
            </article>
          </section>
        </>
      )}

      {/* ======================================================================
          ABA 8: EDITOR DE PERSONAGEM & SPRITESHEET 16-BIT EM TEMPO REAL
          ====================================================================== */}
      {activeTab === 'avatar' && (
        <>
          <section className='neo-section-heading'>
            <div>
              <span>EDITOR DE PERSONAGEM // SPRITESHEET 32×32 PX</span>
              <h2>Personalize seu Explorador</h2>
              <p>
                As alterações atualizam imediatamente o spritesheet PNG
                transparente de 4 direções usado no mapa e nos interiores.
              </p>
            </div>
          </section>

          <section className='neo-avatar-editor'>
            <div className='neo-avatar-preview-card'>
              <div className='neo-avatar-turntable'>
                {sprites?.player &&
                  ['down', 'left', 'right', 'up'].map((d, idx) => (
                    <div key={d} className='neo-turn-box'>
                      <span
                        style={tileSpriteStyle(
                          sprites.player,
                          128,
                          128,
                          (animTick % 4) * 32,
                          idx * 32,
                          32,
                          32,
                          2.2,
                        )}
                      />
                      <small>{d.toUpperCase()}</small>
                    </div>
                  ))}
              </div>
              {sprites?.player && (
                <a
                  href={sprites.player}
                  download='player-custom-32x32.png'
                  className='neo-download-btn'
                >
                  ⬇ Baixar Spritesheet PNG (128×128 px)
                </a>
              )}
            </div>

            <div className='neo-avatar-controls'>
              <div>
                <label>Tom de Pele</label>
                <div className='neo-option-row'>
                  {[
                    ['light', 'Claro'],
                    ['warm', 'Dourado'],
                    ['tan', 'Bronze'],
                    ['deep', 'Escuro'],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      type='button'
                      className={appearance.skin === id ? 'active' : ''}
                      onClick={() =>
                        persistCity({
                          ...city,
                          appearance: { ...appearance, skin: id },
                        })
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label>Corte de Cabelo</label>
                <div className='neo-option-row'>
                  {[
                    ['default', 'Curto'],
                    ['long', 'Longo'],
                    ['spiky', 'Repicado'],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      type='button'
                      className={appearance.hairStyle === id ? 'active' : ''}
                      onClick={() =>
                        persistCity({
                          ...city,
                          appearance: { ...appearance, hairStyle: id },
                        })
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label>Cor do Cabelo</label>
                <div className='neo-option-row'>
                  {[
                    ['dark', 'Noturno'],
                    ['wood', 'Castanho'],
                    ['lilac', 'Lilás'],
                    ['gold', 'Dourado'],
                    ['teal', 'Petróleo'],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      type='button'
                      className={appearance.hairColor === id ? 'active' : ''}
                      onClick={() =>
                        persistCity({
                          ...city,
                          appearance: { ...appearance, hairColor: id },
                        })
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label>Traje Cotidiano</label>
                <div className='neo-option-row'>
                  {[
                    ['teal', 'Azul-Petróleo'],
                    ['lilac', 'Lilás'],
                    ['green', 'Verde Natural'],
                    ['gold', 'Dourado'],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      type='button'
                      className={effectiveOutfitColor === id ? 'active' : ''}
                      onClick={() =>
                        persistCity({
                          ...city,
                          equipped: { ...equipped, outfit: null },
                          appearance: { ...appearance, outfitColor: id },
                        })
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label>Mochila Tecnológica</label>
                <div className='neo-option-row'>
                  {[
                    ['wood', 'Madeira & Núcleo Lilás'],
                    ['tech', 'Petróleo & Cristal'],
                    ['gold', 'Artesanal Dourada'],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      type='button'
                      className={appearance.packStyle === id ? 'active' : ''}
                      onClick={() =>
                        persistCity({
                          ...city,
                          appearance: { ...appearance, packStyle: id },
                        })
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      <footer className='neo-footer'>
        <span>NEO-LIFE / VALE 16-BIT COMPLETO</span>
        <p>
          Seu progresso real constrói a cidade. Seu descanso também faz parte da
          jornada.
        </p>
        <span>
          XP {xp.toLocaleString('pt-BR')} · 🪙 {coins}
        </span>
      </footer>
    </main>
  );
}

/* ============================================================================
   ESTILOS — PALETA ACOLHEDORA, ILUMINAÇÃO DINÂMICA POR HORÁRIO E ACESSIBILIDADE
   ============================================================================ */
const styles = `
.neo-city-page{
  --neo-bg:#142423;
  --neo-panel:#1f3431;
  --neo-line:rgba(216,208,162,.24);
  --neo-text:#f6f1dc;
  --neo-muted:#bdc8ae;
  display:flex;
  flex-direction:column;
  gap:20px;
  padding:4px 0 30px;
  min-width:0;
  color:var(--neo-text);
  font-family:ui-rounded,"Trebuchet MS",system-ui,sans-serif;
}
.neo-city-page *{box-sizing:border-box}
.neo-city-page button,.neo-city-page a,.neo-city-page input{font-family:inherit}
.neo-city-page button:focus-visible,.neo-city-page input:focus-visible{
  outline:2px solid #fff0a6;
  outline-offset:2px;
}

.neo-hero{
  position:relative;isolation:isolate;overflow:hidden;
  border:3px solid #637d62;border-radius:10px;
  background:
    radial-gradient(ellipse at 78% 24%,rgba(245,196,81,.26),transparent 28%),
    linear-gradient(155deg,#1b4652 0%,#295c5a 52%,#3d6e4d 100%);
  padding:26px 28px;
  display:grid;grid-template-columns:1.1fr .9fr;align-items:center;gap:20px;
  box-shadow:0 6px 0 #1b302d;
}
.neo-hero-grid{
  position:absolute;inset:0;z-index:-1;opacity:.14;
  background-image:linear-gradient(rgba(255,240,166,.25) 1px,transparent 1px),linear-gradient(90deg,rgba(255,240,166,.25) 1px,transparent 1px);
  background-size:24px 24px;
}
.neo-kicker,.neo-section-heading>div>span{font-size:10px;font-weight:900;letter-spacing:2px;color:#f5c451}
.neo-hero h1{font-size:clamp(28px,3.8vw,44px);line-height:1.08;margin:10px 0;color:#fff8e3;text-shadow:3px 3px 0 #1c383a}
.neo-hero h1 em{font-style:normal;color:#b2de8e}
.neo-hero-copy>p{color:#eef0d8;max-width:540px;line-height:1.6;font-size:13px;margin:0}
.neo-hero-actions{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-top:18px}
.neo-hero-actions button,.neo-empty-inventory button,.neo-minigame-actions button{
  border:2px solid #fff0a6;border-radius:6px;
  background:linear-gradient(180deg,#f5c451,#cf9132);
  color:#253028;padding:10px 15px;font-weight:900;cursor:pointer;
  box-shadow:0 3px 0 #7d5136;font-size:12px;
}
.neo-hero-actions span{font-size:11px;color:#e5ebd0}

.neo-hero-right{display:flex;flex-direction:column;gap:10px;align-items:flex-end}
.neo-wallet{
  background:#233b38;border:2px solid #a8734d;border-radius:8px;
  padding:12px 16px;display:flex;flex-direction:column;gap:3px;width:100%;max-width:320px;
  box-shadow:0 4px 0 #152624;
}
.neo-wallet span{font-size:8px;letter-spacing:1.4px;color:#c7b3eb;font-weight:800}
.neo-wallet strong{font-size:16px;color:#f5c451}
.neo-wallet small{font-size:10px;color:#cbd6be}

.neo-time-switcher{display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end}
.neo-time-switcher button{
  border:1px solid #6b856b;border-radius:5px;padding:5px 8px;
  background:#1c302e;color:#dce5cf;font-size:10px;font-weight:800;cursor:pointer;
}
.neo-time-switcher button.active{background:#388e99;border-color:#fff0a6;color:#fff}

.neo-tabs{
  display:flex;gap:6px;overflow:auto;padding:6px;
  border:2px solid #4c6654;background:#1c302e;border-radius:8px;
}
.neo-tabs button{
  flex:0 0 auto;border:2px solid transparent;border-radius:5px;
  padding:9px 13px;background:transparent;color:#cbd5bd;font-size:12px;font-weight:800;cursor:pointer;
}
.neo-tabs button.active{background:#388e99;border-color:#fff0a6;color:#fff8e3;box-shadow:0 3px 0 #163d4a}

.neo-notice{
  padding:12px 16px;border:2px solid #f5c451;border-radius:6px;
  background:#2b473e;color:#fff6d6;font-size:13px;
  display:flex;justify-content:space-between;align-items:center;gap:10px;
}
.neo-notice button{border:0;background:none;color:inherit;font-size:20px;cursor:pointer}

.neo-section-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap}
.neo-section-heading h2{font-size:22px;margin:4px 0;color:#fff7df}
.neo-section-heading p{margin:0;color:#c5d1b8;font-size:12px;line-height:1.5}
.neo-level-chip{
  border:2px solid #7ec272;background:#24443b;border-radius:6px;
  padding:8px 12px;color:#e9f5d5;font-size:11px;font-weight:800;
}

.neo-seed-bar,.neo-home-controls{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.neo-seed-bar span{font-size:11px;font-weight:800;color:#b2de8e}
.neo-seed-bar button,.neo-home-controls button{
  border:2px solid #5c755d;border-radius:5px;padding:6px 10px;
  background:#223b37;color:#e8efda;font-size:10px;font-weight:800;cursor:pointer;
}
.neo-seed-bar button.active,.neo-home-controls button.active{
  background:#388e99;border-color:#fff0a6;color:#fff;
}
.neo-deco-toggle.active{background:#cf9132!important;color:#232e26!important}

/* MAPA 16-BIT E ILUMINAÇÃO DINÂMICA POR HORÁRIO */
.neo-world-toolbar{
  display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;
  padding:10px 14px;border:2px solid #7d5136;border-radius:6px;
  background:#27403b;color:#f5e9c6;font-size:11px;font-weight:800;
}
.neo-toolbar-btns{display:flex;gap:8px;flex-wrap:wrap}
.neo-world-toolbar button,.neo-interior-header button{
  border:2px solid #fff0a6;border-radius:5px;padding:6px 11px;
  background:#cf9132;color:#232e26;font-weight:900;cursor:pointer;font-size:10px;
}
.neo-world-scroll{
  overflow:auto;padding:12px;border:3px solid #7d5136;border-radius:8px;
  background:radial-gradient(ellipse at 50% 40%,#20264d,#101629 72%);
  border-color:#53618f;box-shadow:inset 0 0 24px rgba(61,104,255,.18);
}
.neo-world-map{
  position:relative;display:grid;
  grid-template-columns:repeat(20,48px);
  grid-template-rows:repeat(12,48px);
  gap:0;width:max-content;margin:auto;
  border:4px solid #52618f;border-radius:4px;
  background:#10152d;box-shadow:0 0 0 3px #171d3c,0 0 28px rgba(70,105,255,.28);
  image-rendering:pixelated;
  transition:filter .4s ease;
}
.neo-world-map.period-morning{filter:brightness(1.03) saturate(1.05)}
.neo-world-map.period-afternoon{filter:brightness(1) saturate(1)}
.neo-world-map.period-sunset{filter:sepia(.18) saturate(1.15) brightness(.95)}
.neo-world-map.period-night{filter:brightness(.76) contrast(1.08) hue-rotate(-8deg)}
.neo-world-map.period-night .lamp-glow,
.neo-world-map.period-night .glow-node,
.neo-world-map.period-night .neo-player-sprite{
  filter:brightness(1.45) drop-shadow(0 0 10px rgba(245,196,81,.9));
}

.neo-world-tile{position:relative;width:48px;height:48px;overflow:visible;isolation:isolate}
.neo-world-tile::before{
  content:'';position:absolute;inset:0;z-index:1;pointer-events:none;opacity:.16;
  background:linear-gradient(135deg,transparent 46%,rgba(102,220,255,.42) 47%,transparent 50%),
    repeating-linear-gradient(0deg,transparent 0 11px,rgba(135,113,255,.16) 12px 13px);
}
.neo-world-tile.city-road::before{
  opacity:.8;background:
    linear-gradient(90deg,transparent 0 45%,rgba(78,220,255,.5) 47% 49%,transparent 52%),
    linear-gradient(0deg,transparent 0 45%,rgba(255,91,205,.42) 47% 49%,transparent 52%);
  box-shadow:inset 0 0 0 1px rgba(75,204,255,.18),inset 0 0 12px rgba(30,122,190,.22);
}
.neo-world-tile.city-water::before{
  opacity:.55;background:repeating-linear-gradient(135deg,transparent 0 8px,rgba(83,225,255,.38) 9px 11px);
}
.neo-world-tile.city-park::before{
  opacity:.28;background:radial-gradient(ellipse,rgba(83,255,177,.5),transparent 70%);
}
.neo-district-waypoint{
  position:absolute;left:50%;top:3px;transform:translateX(-50%);z-index:4;
  white-space:nowrap;padding:2px 5px;border:1px solid currentColor;border-radius:3px;
  background:rgba(9,17,42,.88);font:900 7px/1.2 monospace;letter-spacing:.5px;
  color:#74eaff;text-shadow:0 0 6px currentColor;pointer-events:none;
}
.waypoint-academy{color:#c8a0ff}.waypoint-green{color:#8affbd}
.waypoint-innovation{color:#7dbdff}.waypoint-commerce{color:#ff8bdc}
.waypoint-arcade{color:#ffc078}
.neo-building-sprite-sheet{
  position:absolute;left:0;top:0;z-index:5;cursor:pointer;
  filter:drop-shadow(0 4px 0 rgba(22,36,34,.45));
}
.neo-building-sprite-sheet.under-construction{filter:grayscale(.45) brightness(.85)}
.neo-scaffold-overlay{position:absolute;inset:0;z-index:6;pointer-events:none;opacity:.85}
.neo-building-tag{
  position:absolute;left:50%;top:-13px;transform:translateX(-50%);
  white-space:nowrap;padding:2px 7px;border-radius:4px;
  background:#233c3b;border:2px solid #f5c451;color:#fff5d6;font-size:9px;font-weight:900;
}
.neo-plot-btn{
  position:relative;border:0;padding:0;cursor:pointer;display:block;
}
.neo-plot-btn.ready{box-shadow:inset 0 0 0 2px #f5c451}
.neo-harvest-badge{
  position:absolute;top:-8px;right:-4px;font-size:12px;
  animation:neo-float .7s steps(2) infinite alternate;
}
.neo-prop-sprite{position:absolute;left:50%;bottom:2px;transform:translateX(-50%);z-index:4;pointer-events:none}
.neo-prop-sprite.tall-tree,.neo-prop-sprite.tall-prop{z-index:6}
.neo-prop-sprite.bench{left:0;transform:none}
.neo-spot-tag{
  position:absolute;left:50%;top:6px;transform:translateX(-50%);z-index:7;
  border:2px solid #fff0a6;border-radius:4px;background:#236373;color:#fff;
  font-size:9px;font-weight:900;padding:2px 6px;white-space:nowrap;cursor:pointer;
}
.neo-door{position:absolute;inset:0;z-index:7;border:0;background:transparent;cursor:pointer;display:grid;place-items:center}
.neo-door-marker{
  padding:1px 5px;border-radius:4px;background:rgba(35,60,59,.9);
  border:1px solid #f5c451;color:#fff0a6;font-size:9px;
}
.neo-map-resident{
  position:absolute;left:50%;bottom:2px;transform:translateX(-50%);z-index:8;
  border:0;padding:0;background:transparent;cursor:pointer;display:flex;flex-direction:column;align-items:center;
  transition:left .4s linear,top .4s linear;
}
.neo-map-resident b{
  position:absolute;top:-14px;padding:1px 5px;border-radius:3px;
  background:#463669;border:1px solid #c7b3eb;color:#fff8e8;font-size:8px;white-space:nowrap;
}
.neo-npc-drone{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);z-index:11;pointer-events:none}
.neo-player-sprite{position:absolute;left:50%;bottom:2px;transform:translateX(-50%);z-index:10;pointer-events:none}

/* DIÁLOGO RAMIFICADO NO MAPA */
.neo-world-bubble{
  display:grid;grid-template-columns:56px 1fr auto;gap:14px;align-items:start;
  padding:14px 16px;border:3px solid #f5c451;border-radius:8px;background:#233d3b;
}
.neo-bubble-portrait{
  width:52px;height:68px;display:grid;place-items:center;border-radius:6px;
  background:#463669;border:2px solid #c7b3eb;overflow:hidden;
}
.neo-bubble-header{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;font-size:10px;color:#f5c451}
.neo-bubble-body p{margin:6px 0 10px;font-size:13px;color:#f8f3de}
.neo-branch-choices{display:flex;gap:8px;flex-wrap:wrap}
.neo-branch-choices button{
  border:2px solid #7ec272;border-radius:5px;padding:7px 10px;
  background:#1b3230;color:#f4f8ea;font-size:11px;font-weight:800;cursor:pointer;
}
.neo-branch-choices button:hover{background:#2c4f49;border-color:#fff0a6}
.neo-close-x{border:0;background:none;color:#fff;font-size:22px;cursor:pointer}

.neo-world-controls{
  display:flex;align-items:center;gap:16px;flex-wrap:wrap;
  padding:12px 15px;border:2px solid #526e58;border-radius:8px;background:#213734;
}
.neo-world-controls p{margin:0;color:#c7d3ba;font-size:11px;flex:1;min-width:200px}
.neo-dpad{display:flex;flex-direction:column;align-items:center;gap:4px}
.neo-dpad>div{display:flex;gap:4px}
.neo-dpad button{
  width:40px;height:34px;border:2px solid #fff0a6;border-radius:5px;
  background:#388e99;color:#fff8e3;font-size:14px;cursor:pointer;
}
.neo-interact-btn{
  border:2px solid #fff0a6;border-radius:6px;background:#6b5399;color:#fff8e3;
  padding:10px 14px;font-size:11px;font-weight:900;cursor:pointer;
}

/* INTERIORES & MODO DECORAÇÃO EM GRADE */
.neo-interior{padding:16px;border:3px solid #7d5136;border-radius:8px;background:#213836}
.neo-interior-header{display:flex;justify-content:space-between;align-items:center;color:#f5c451;font-size:11px;font-weight:900}
.neo-interior-room{margin-top:14px;padding:18px;border:5px solid #7d5136;border-radius:6px;background:#1a2e2c}
.neo-interior-map{
  display:grid;grid-template-columns:repeat(10,52px);grid-template-rows:repeat(6,52px);
  width:max-content;margin:auto;border:4px solid #523422;overflow:auto;
}
.neo-interior-tile{position:relative;width:52px;height:52px;display:grid;place-items:center}
.neo-interior-tile.grid-editable{box-shadow:inset 0 0 0 1px rgba(255,240,166,.3);cursor:pointer}
.neo-interior-tile.grid-editable:hover{background-color:rgba(245,196,81,.25)}
.neo-placed-furniture{display:block;pointer-events:none}
.neo-station-btn{
  border:1px solid #f5c451;border-radius:4px;background:rgba(22,61,74,.9);
  color:#fff;font-size:7px;padding:3px;cursor:pointer;max-width:48px;text-align:center;
}
.neo-interior-door{border:0;background:none;font-size:20px;cursor:pointer}
.neo-deco-dock,.neo-building-sync-form{
  margin-top:14px;padding:12px;border-radius:6px;border:2px solid #6b856b;background:#243e3a;
}
.neo-deco-dock-head{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;font-size:11px;margin-bottom:8px}
.neo-deco-dock-head button,.neo-deco-items button{
  border:2px solid #6b856b;border-radius:5px;padding:6px 10px;background:#1b302e;color:#f4f8ea;font-size:11px;cursor:pointer;
}
.neo-deco-items{display:flex;gap:8px;flex-wrap:wrap}
.neo-deco-items button.active{border-color:#f5c451;background:#388e99}
.neo-building-sync-form{display:flex;flex-direction:column;gap:8px;font-size:12px}
.neo-building-sync-form>div{display:flex;gap:8px;flex-wrap:wrap}
.neo-building-sync-form input{
  flex:1;min-width:200px;padding:8px 11px;border-radius:5px;border:2px solid #6b856b;
  background:#162927;color:#fff;
}
.neo-building-sync-form button{
  border:2px solid #fff0a6;border-radius:5px;padding:8px 14px;
  background:#f5c451;color:#232e26;font-weight:900;cursor:pointer;
}

/* MORADORES & HISTÓRIAS */
.neo-resident-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.neo-resident-card{
  display:grid;grid-template-columns:64px 1fr auto;gap:12px;align-items:center;
  padding:14px;border:2px solid #5c755d;border-radius:8px;background:#233e3a;
}
.neo-resident-avatar{
  width:56px;height:66px;display:grid;place-items:center;border-radius:6px;
  background:#3a594d;border:2px solid #a8734d;overflow:hidden;
}
.neo-resident-card span{font-size:10px;color:#f5c451;font-weight:800}
.neo-resident-card h3{margin:3px 0;font-size:16px}
.neo-resident-card p{margin:0 0 3px;font-size:11px;color:#c5d1b8}
.neo-resident-card small{font-size:10px;color:#9fb098}
.neo-resident-card>button{
  border:2px solid #fff0a6;border-radius:6px;background:#388e99;color:#fff;
  padding:8px 12px;font-size:11px;font-weight:800;cursor:pointer;
}
.neo-dialogue{
  position:relative;border:3px solid #f5c451;border-radius:8px;padding:20px;background:#223c3a;
}
.neo-dialogue-top{display:flex;align-items:center;gap:14px;margin-bottom:10px}
.neo-dialogue-top span{font-size:10px;color:#f5c451;font-weight:900}
.neo-dialogue-top h3{margin:2px 0;font-size:20px}
.neo-dialogue-close{position:absolute;right:14px;top:10px;border:0;background:none;color:#fff;font-size:22px;cursor:pointer}
.neo-story-unlocks{margin-top:16px;padding-top:12px;border-top:1px solid var(--neo-line);display:grid;gap:8px}
.neo-story-unlocks h4{margin:0;font-size:13px;color:#c7b3eb}
.neo-story-chap{padding:10px;border-radius:6px;background:#1b302e;border:1px solid #6b5399}
.neo-story-chap.locked{opacity:.65}
.neo-story-chap b{font-size:12px;color:#fff0a6}
.neo-story-chap p{margin:4px 0 0;font-size:11px;color:#d6decb}

/* MISSÕES & DISTRITOS */
.neo-quests-grid,.neo-district-grid,.neo-shop-grid,.neo-inventory-grid{
  display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;
}
.neo-quest-card,.neo-district,.neo-shop-item,.neo-inv-card{
  padding:16px;border:2px solid #5c755d;border-radius:8px;background:#223b37;
  display:flex;flex-direction:column;gap:8px;
}
.neo-quest-card.claimed{opacity:.72}
.neo-quest-card>span{font-size:9px;font-weight:900;color:#f5c451;letter-spacing:1px}
.neo-quest-card h3,.neo-district h3,.neo-shop-item h3{margin:0;font-size:15px}
.neo-quest-card p,.neo-district p,.neo-shop-item p{margin:0;font-size:11px;color:#c5d1b8;line-height:1.5}
.neo-district-progress>div{display:flex;justify-content:space-between;font-size:10px;margin-bottom:4px}
.neo-district-progress i{height:8px;display:block;background:#142624;border-radius:4px;overflow:hidden}
.neo-district-progress u{height:100%;display:block;background:#7ec272}
.neo-quest-footer,.neo-shop-item>div:last-child{
  margin-top:auto;display:flex;justify-content:space-between;align-items:center;gap:8px;
}
.neo-quest-footer button,.neo-shop-item button,.neo-equip-btn{
  border:2px solid #fff0a6;border-radius:5px;padding:6px 10px;
  background:#f5c451;color:#232e26;font-size:10px;font-weight:900;cursor:pointer;
}
.neo-quest-footer button:disabled,.neo-shop-item button:disabled{
  background:#3e524a;color:#9fb09e;border-color:#566b60;cursor:not-allowed;
}
.neo-district-top{display:flex;justify-content:space-between;align-items:center}
.neo-status{font-size:9px;font-weight:900;color:#7ec272}
.neo-item-art{
  height:96px;border-radius:6px;background:linear-gradient(135deg,#236373,#463669);
  display:grid;place-items:center;position:relative;font-size:38px;
}
.neo-item-art span{position:absolute;top:6px;right:6px;font-size:9px;background:#523422;padding:3px 7px;border-radius:4px}
.neo-inv-card{flex-direction:row;align-items:center}
.neo-inv-card>span{font-size:28px}
.neo-inv-card>div{flex:1;display:flex;flex-direction:column;gap:2px}
.neo-equip-btn.equipped{background:#7ec272}

/* MINIJOGOS */
.neo-minigame-panel{
  padding:20px;border:3px solid #6b5399;border-radius:8px;background:#1d3133;
  display:flex;flex-direction:column;gap:14px;align-items:center;text-align:center;
}
.neo-minigame-panel h3{margin:0;font-size:19px;color:#fff0a6}
.neo-minigame-panel p{margin:0;font-size:12px;color:#d2dcc6;max-width:520px}
.neo-fishing-meter{
  position:relative;width:100%;max-width:420px;height:28px;
  border:3px solid #7d5136;border-radius:6px;background:#142423;overflow:hidden;
}
.neo-fishing-zone{
  position:absolute;left:50%;top:0;bottom:0;transform:translateX(-50%);
  background:#388e99;border-left:2px solid #b6ebed;border-right:2px solid #b6ebed;
}
.neo-fishing-needle{
  position:absolute;top:0;bottom:0;width:6px;transform:translateX(-50%);
  background:#f5c451;box-shadow:0 0 8px #fff0a6;
}
.neo-bite-btn{background:#7ec272!important}
.neo-catch-card{
  display:flex;align-items:center;gap:12px;padding:12px 16px;
  border-radius:6px;background:#25423d;border:2px solid #f5c451;text-align:left;
}
.neo-catch-card span{font-size:32px}
.neo-minigame-actions{display:flex;gap:12px;align-items:center;flex-wrap:wrap;justify-content:center}

.neo-race-track{
  display:grid;grid-template-columns:repeat(3,84px);height:240px;
  border:3px solid #7d5136;border-radius:6px;background:#23323d;overflow:hidden;
}
.neo-race-lane{position:relative;border-right:1px dashed rgba(255,240,166,.2)}
.neo-race-lane:last-child{border-right:0}
.neo-race-entity{position:absolute;left:50%;transform:translateX(-50%);font-size:22px}
.neo-race-player{position:absolute;bottom:14px;left:50%;transform:translateX(-50%);font-size:26px}

.neo-circuit-grid{display:grid;grid-template-columns:repeat(3,84px);gap:10px}
.neo-circuit-node{
  height:78px;border:2px solid #fff0a6;border-radius:8px;cursor:pointer;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;
  font-size:24px;color:#fff;
}
.neo-circuit-node small{font-size:9px}
.neo-circuit-node.state-0{background:#236373}
.neo-circuit-node.state-1{background:#6b5399}
.neo-circuit-node.state-2{background:#cf9132;color:#1c262b}

.neo-arcade-card{display:grid;grid-template-columns:1.2fr .8fr;gap:14px}
.neo-arcade-screen{padding:20px;border:3px solid #6b5399;border-radius:8px;background:#1b2e33;text-align:center}
.neo-arcade-top{display:flex;justify-content:space-between;font-size:10px;color:#78cbd1;font-weight:800}
.neo-sequence-preview{display:flex;justify-content:center;gap:12px;min-height:26px;margin:12px 0}
.neo-sequence-preview span{font-size:22px;color:#fff0a6}
.neo-pad-grid{display:grid;grid-template-columns:repeat(2,88px);justify-content:center;gap:10px;margin:16px auto}
.neo-pad{height:76px;border:3px solid #1c262b;border-radius:8px;font-size:28px;cursor:pointer}
.pad-0{background:#6ec2c9}.pad-1{background:#957bc7}.pad-2{background:#7ec272}.pad-3{background:#f5c451}
.neo-game-start{
  border:2px solid #fff0a6;border-radius:6px;padding:10px 15px;
  background:#f5c451;color:#232e26;font-weight:900;cursor:pointer;
}
.neo-arcade-info{padding:18px;border:2px solid #5c755d;border-radius:8px;background:#223b37}
.neo-arcade-info ol{padding-left:18px;font-size:12px;line-height:1.9;color:#cbd5be}

/* FESTIVAIS E COLEÇÕES */
.neo-festivals-grid,.neo-collections-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.neo-festival-card,.neo-col-box{
  padding:16px;border:2px solid #5c755d;border-radius:8px;background:#223b37;
  display:flex;flex-direction:column;gap:8px;
}
.neo-festival-card.current{border-color:#f5c451;background:#28463f}
.neo-fest-top{display:flex;justify-content:space-between;font-size:10px;font-weight:900;color:#f5c451}
.neo-festival-card button{
  align-self:flex-start;border:2px solid #fff0a6;border-radius:5px;padding:7px 12px;
  background:#f5c451;color:#232e26;font-size:11px;font-weight:900;cursor:pointer;
}
.neo-col-chips{display:flex;gap:8px;flex-wrap:wrap}
.neo-col-chips span{padding:6px 10px;border-radius:5px;font-size:11px;font-weight:700}
.neo-col-chips span.found{background:#2d544b;border:1px solid #7ec272;color:#f6f1dc}
.neo-col-chips span.missing{background:#182927;border:1px dashed #556b60;color:#8fa196}

/* EDITOR DE PERSONAGEM */
.neo-avatar-editor{display:grid;grid-template-columns:320px 1fr;gap:16px}
.neo-avatar-preview-card{
  padding:18px;border:2px solid #6b856b;border-radius:8px;background:#203633;
  display:flex;flex-direction:column;align-items:center;gap:14px;
}
.neo-avatar-turntable{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;width:100%}
.neo-turn-box{
  padding:10px;border-radius:6px;background:#172826;border:1px solid #526e58;
  display:flex;flex-direction:column;align-items:center;gap:4px;
}
.neo-turn-box small{font-size:9px;color:#b2de8e;font-weight:800}
.neo-download-btn{
  text-decoration:none;border:2px solid #fff0a6;border-radius:5px;
  background:#f5c451;color:#232e26;padding:8px 12px;font-size:11px;font-weight:900;
}
.neo-avatar-controls{
  padding:18px;border:2px solid #6b856b;border-radius:8px;background:#203633;
  display:flex;flex-direction:column;gap:14px;
}
.neo-avatar-controls label{display:block;font-size:11px;font-weight:900;color:#f5c451;margin-bottom:6px}
.neo-option-row{display:flex;gap:8px;flex-wrap:wrap}
.neo-option-row button{
  border:2px solid #5c755d;border-radius:5px;padding:7px 12px;
  background:#172826;color:#e8efda;font-size:11px;font-weight:800;cursor:pointer;
}
.neo-option-row button.active{background:#388e99;border-color:#fff0a6;color:#fff}

.neo-empty-inventory{text-align:center;padding:36px 16px;border:2px dashed #7d5136;border-radius:8px;background:#1e3431}
.neo-footer{display:flex;justify-content:space-between;align-items:center;gap:10px;border-top:2px solid #445e4c;padding-top:14px;color:#a5b59b;font-size:10px;flex-wrap:wrap}

@keyframes neo-float{from{transform:translateY(0)}to{transform:translateY(-2px)}}

@media(max-width:900px){
  .neo-hero,.neo-arcade-card,.neo-avatar-editor{grid-template-columns:1fr}
  .neo-hero-right{align-items:flex-start}
  .neo-quests-grid,.neo-district-grid,.neo-shop-grid,.neo-inventory-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media(max-width:650px){
  .neo-quests-grid,.neo-district-grid,.neo-shop-grid,.neo-inventory-grid,.neo-resident-grid,.neo-festivals-grid,.neo-collections-grid{grid-template-columns:1fr}
  .neo-world-bubble{grid-template-columns:1fr}
}
`;
