import React, { useEffect, useMemo, useRef, useState } from 'react';

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
    worldPos: { x: 11, y: 4 },
  },
  {
    id: 'kai',
    name: 'Kai',
    role: 'Engenheiro de sistemas',
    avatar: '🧑🏽‍💻',
    district: 'innovation',
    focus: 'tasks',
    spriteRow: 1,
    worldPos: { x: 5, y: 7 },
  },
  {
    id: 'maya',
    name: 'Maya',
    role: 'Comerciante do Mercado Neon',
    avatar: '👩🏽‍🔧',
    district: 'commerce',
    focus: 'coins',
    spriteRow: 2,
    worldPos: { x: 10, y: 7 },
  },
  {
    id: 'nox',
    name: 'Nox',
    role: 'Treinador de rotina',
    avatar: '🧑🏻‍🚀',
    district: 'green',
    focus: 'habits',
    spriteRow: 3,
    worldPos: { x: 14, y: 5 },
  },
  {
    id: 'iris',
    name: 'Íris',
    role: 'Bibliotecária de dados',
    avatar: '🧝🏻‍♀️',
    district: 'academy',
    focus: 'reading',
    spriteRow: 4,
    worldPos: { x: 6, y: 4 },
  },
];

const WORLD_BUILDINGS = [
  {
    id: 'central-hub',
    name: 'Núcleo Central',
    district: 'central',
    icon: '🏢',
    x: 3,
    y: 2,
    w: 3,
    h: 2,
    door: { x: 4, y: 4 },
    spriteCol: 0,
    spriteRow: 0,
    description: 'Central de operações e ponto de encontro da cidade.',
    rooms: ['Painel de evolução', 'Central de missões', 'Terminal de serviços'],
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
    description: 'Salas de aula, biblioteca e laboratórios de pesquisa.',
    rooms: [
      'Biblioteca holográfica',
      'Laboratório de cibernética',
      'Sala de estudos',
    ],
  },
  {
    id: 'greenhouse',
    name: 'Estufa BioTech',
    district: 'green',
    icon: '🌿',
    x: 14,
    y: 2,
    w: 3,
    h: 2,
    door: { x: 15, y: 4 },
    spriteCol: 2,
    spriteRow: 0,
    description: 'Um refúgio verde alimentado por energia limpa.',
    rooms: ['Jardim de foco', 'Laboratório botânico', 'Banco de sementes'],
  },
  {
    id: 'innovation-lab',
    name: 'Laboratório de Inovação',
    district: 'innovation',
    icon: '🧬',
    x: 2,
    y: 8,
    w: 3,
    h: 2,
    door: { x: 3, y: 7 },
    spriteCol: 0,
    spriteRow: 1,
    description: 'Oficinas, protótipos e incubadoras de projetos.',
    rooms: [
      'Oficina de protótipos',
      'Sala de planejamento',
      'Núcleo de robótica',
    ],
  },
  {
    id: 'neon-market',
    name: 'Mercado Neon',
    district: 'commerce',
    icon: '🛍️',
    x: 8,
    y: 8,
    w: 3,
    h: 2,
    door: { x: 9, y: 7 },
    spriteCol: 1,
    spriteRow: 1,
    description: 'Lojas, personalização e comércio local.',
    rooms: ['Loja de decoração', 'Ateliê de roupas', 'Balcão de trocas'],
  },
  {
    id: 'arcade-88',
    name: 'Arcade 88',
    district: 'arcade',
    icon: '🕹️',
    x: 14,
    y: 8,
    w: 3,
    h: 2,
    door: { x: 15, y: 7 },
    spriteCol: 2,
    spriteRow: 1,
    description: 'Salão de jogos e desafios de habilidade.',
    rooms: ['Arena de memória', 'Cabine de ritmo', 'Sala de enigmas'],
  },
];

// Objetos fixos e decorações cotidianas no mapa (18x12)
const WORLD_PROPS = [
  { id: 'lamp-1', type: 'lamp', x: 6, y: 5, solid: true },
  { id: 'lamp-2', type: 'lamp', x: 11, y: 5, solid: true },
  { id: 'lamp-3', type: 'lamp', x: 6, y: 6, solid: true },
  { id: 'lamp-4', type: 'lamp', x: 11, y: 6, solid: true },
  { id: 'bench-1', type: 'bench', x: 8, y: 5, solid: true },
  { id: 'bench-2', type: 'bench', x: 9, y: 5, solid: false }, // parte direita do banco
  { id: 'holo-1', type: 'holo', x: 7, y: 4, solid: true },
  { id: 'holo-2', type: 'holo', x: 12, y: 7, solid: true },
  { id: 'terminal-1', type: 'terminal', x: 2, y: 4, solid: true },
  { id: 'crop-1', type: 'crop', x: 13, y: 2, solid: false },
  { id: 'crop-2', type: 'crop', x: 13, y: 3, solid: false },
  { id: 'crop-3', type: 'crop', x: 12, y: 9, solid: false },
  { id: 'crop-4', type: 'crop', x: 13, y: 9, solid: false },
  { id: 'crystal-1', type: 'crystal', x: 1, y: 3, solid: true },
  { id: 'crystal-2', type: 'crystal', x: 16, y: 5, solid: true },
  { id: 'crystal-3', type: 'crystal', x: 1, y: 9, solid: true },
  { id: 'tree-1', type: 'tree-lantern', x: 5, y: 1, solid: true },
  { id: 'tree-2', type: 'tree', x: 6, y: 2, solid: true },
  { id: 'tree-3', type: 'tree', x: 13, y: 1, solid: true },
  { id: 'tree-4', type: 'tree-lantern', x: 13, y: 8, solid: true },
  { id: 'tree-5', type: 'tree', x: 6, y: 9, solid: true },
  { id: 'bush-1', type: 'bush', x: 3, y: 1, solid: false },
  { id: 'bush-2', type: 'bush', x: 8, y: 2, solid: false },
  { id: 'bush-3', type: 'bush', x: 11, y: 9, solid: false },
  { id: 'bush-4', type: 'bush', x: 5, y: 10, solid: false },
];

const STORE_ITEMS = [
  {
    id: 'holo-plant',
    name: 'Planta holográfica',
    type: 'Decoração',
    icon: '🪴',
    price: 35,
    description: 'Um toque de natureza sintética para seu apartamento.',
  },
  {
    id: 'neon-sign',
    name: 'Placa Neon',
    type: 'Decoração',
    icon: '💡',
    price: 55,
    description: 'Personalize seu espaço com luzes da cidade.',
  },
  {
    id: 'drone-pet',
    name: 'Drone companheiro',
    type: 'Companheiro',
    icon: '🤖',
    price: 90,
    description: 'Um pequeno robô para acompanhar suas explorações.',
  },
  {
    id: 'streetwear',
    name: 'Jaqueta Synthwave',
    type: 'Visual',
    icon: '🧥',
    price: 120,
    description: 'Estilo para atravessar a cidade à noite.',
  },
  {
    id: 'skyboard',
    name: 'Hoverboard',
    type: 'Mobilidade',
    icon: '🛹',
    price: 180,
    description: 'Deslize pelas avenidas suspensas.',
  },
  {
    id: 'neon-cat',
    name: 'Gato de plasma',
    type: 'Companheiro',
    icon: '🐈‍⬛',
    price: 240,
    description: 'Um felino luminoso que adora explorar.',
  },
];

/* ============================================================================
   SPRITE FORGE 16-BIT — GERADOR PROCEDURAL DE SPRITESHEETS PNG TRANSPARENTES
   Paleta: Verde natural, Madeira, Azul-petróleo, Lilás e Luzes Douradas
   ============================================================================ */
const PALETTE = {
  O: '#1c262b', // contorno escuro suave
  // Madeira
  W1: '#523422',
  W2: '#7d5136',
  W3: '#a8734d',
  W4: '#cfa074',
  // Verde natural
  G1: '#234736',
  G2: '#376e4d',
  G3: '#53995f',
  G4: '#7ec272',
  G5: '#b2de8e',
  // Azul-petróleo
  T1: '#163d4a',
  T2: '#236373',
  T3: '#388e99',
  T4: '#6ec2c9',
  T5: '#b6ebed',
  // Lilás
  L1: '#463669',
  L2: '#6b5399',
  L3: '#957bc7',
  L4: '#c7b3eb',
  // Luzes douradas
  Y1: '#94601c',
  Y2: '#cf9132',
  Y3: '#f5c451',
  Y4: '#fff0a6',
  // Neutros & Pele
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
    clear(x, y, w, h) {
      ctx.clearRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
    },
  };
}

// 1. Jogador 32x32 px — 4 direções (down, up, left, right) x 4 quadros de caminhada
function generatePlayerSheet() {
  const g = createPixelCanvas(128, 128);
  const dirs = ['down', 'up', 'left', 'right'];

  dirs.forEach((dir, row) => {
    for (let frame = 0; frame < 4; frame++) {
      const ox = frame * 32;
      const oy = row * 32;
      const walkBob = frame === 1 || frame === 3 ? -1 : 0;
      const leftStep = frame === 1 ? -2 : frame === 3 ? 1 : 0;
      const rightStep = frame === 3 ? -2 : frame === 1 ? 1 : 0;

      // Sombra no chão
      g.rect(ox + 10, oy + 29, 12, 2, 'rgba(20, 32, 34, 0.38)');
      g.rect(ox + 11, oy + 28, 10, 1, 'rgba(20, 32, 34, 0.24)');

      if (dir === 'down' || dir === 'up') {
        // Pernas & Botas de madeira/couro
        g.box(ox + 11, oy + 23 + leftStep, 4, 6, 'T1');
        g.box(ox + 17, oy + 23 + rightStep, 4, 6, 'T1');
        g.rect(ox + 11, oy + 27 + leftStep, 4, 2, 'W2');
        g.rect(ox + 17, oy + 27 + rightStep, 4, 2, 'W2');
        g.px(ox + 12, oy + 27 + leftStep, 'Y3');
        g.px(ox + 18, oy + 27 + rightStep, 'Y3');

        // Mochila tecnológica (espiando nos ombros na frente; completa nas costas)
        if (dir === 'down') {
          g.box(ox + 7, oy + 14 + walkBob, 3, 8, 'W3');
          g.box(ox + 22, oy + 14 + walkBob, 3, 8, 'W3');
          g.px(ox + 8, oy + 15 + walkBob, 'L3');
          g.px(ox + 23, oy + 15 + walkBob, 'L3');
        }

        // Tronco / Jaqueta futurista cotidiana (azul-petróleo + dourado)
        g.box(ox + 9, oy + 14 + walkBob, 14, 10, 'T3');
        g.rect(ox + 10, oy + 15 + walkBob, 12, 3, 'T4');
        g.rect(ox + 10, oy + 21 + walkBob, 12, 2, 'T2');
        // Gola e faixa dourada
        g.rect(ox + 12, oy + 14 + walkBob, 8, 2, 'Y3');
        if (dir === 'down') {
          g.rect(ox + 15, oy + 16 + walkBob, 2, 6, 'Y2');
          g.px(ox + 12, oy + 17 + walkBob, 'L4'); // emblema lilás
        }

        // Braços animados
        const armSwing = frame === 1 ? 1 : frame === 3 ? -1 : 0;
        g.box(ox + 6, oy + 15 + walkBob + armSwing, 3, 7, 'T2');
        g.box(ox + 23, oy + 15 + walkBob - armSwing, 3, 7, 'T2');
        g.px(ox + 7, oy + 21 + walkBob + armSwing, 'S2');
        g.px(ox + 24, oy + 21 + walkBob - armSwing, 'S2');

        // Mochila tecnológica completa nas costas (dir === 'up')
        if (dir === 'up') {
          g.box(ox + 10, oy + 13 + walkBob, 12, 10, 'W3');
          g.rect(ox + 11, oy + 14 + walkBob, 10, 2, 'W4');
          g.box(ox + 12, oy + 16 + walkBob, 8, 5, 'T2');
          // Núcleo lilás e luz dourada da mochila
          g.rect(
            ox + 14,
            oy + 17 + walkBob,
            4,
            3,
            frame % 2 === 0 ? 'L3' : 'L4',
          );
          g.px(ox + 13, oy + 15 + walkBob, 'Y3');
          g.px(ox + 18, oy + 15 + walkBob, 'Y3');
          // Antena compacta com ponta dourada
          g.rect(ox + 20, oy + 9 + walkBob, 1, 4, 'R3');
          g.px(ox + 20, oy + 8 + walkBob, 'Y4');
        }

        // Cabeça (14x11)
        g.box(ox + 9, oy + 4 + walkBob, 14, 11, dir === 'down' ? 'S2' : 'H1');
        if (dir === 'down') {
          // Cabelo
          g.rect(ox + 9, oy + 4 + walkBob, 14, 4, 'H1');
          g.rect(ox + 10, oy + 5 + walkBob, 12, 2, 'H2');
          g.px(ox + 9, oy + 8 + walkBob, 'H1');
          g.px(ox + 22, oy + 8 + walkBob, 'H1');
          // Fone lateral dourado/petróleo
          g.rect(ox + 8, oy + 8 + walkBob, 2, 3, 'T3');
          g.px(ox + 8, oy + 9 + walkBob, 'Y3');
          // Olhos expressivos
          g.rect(ox + 12, oy + 9 + walkBob, 2, 2, 'O');
          g.rect(ox + 18, oy + 9 + walkBob, 2, 2, 'O');
          g.px(ox + 12, oy + 9 + walkBob, 'C2');
          g.px(ox + 18, oy + 9 + walkBob, 'C2');
          // Bochecha suave
          g.px(ox + 11, oy + 11 + walkBob, 'S1');
          g.px(ox + 20, oy + 11 + walkBob, 'S1');
        } else {
          // Cabelo traseiro com mecha petróleo
          g.rect(ox + 10, oy + 5 + walkBob, 12, 8, 'H2');
          g.rect(ox + 12, oy + 7 + walkBob, 8, 2, 'T3');
        }
      } else {
        // Perfil: left ou right
        const isLeft = dir === 'left';
        const stepOffset = frame === 1 ? -2 : frame === 3 ? 2 : 0;

        // Pernas em tesoura
        g.box(ox + 13 - stepOffset, oy + 23, 4, 6, 'T1');
        g.box(ox + 15 + stepOffset, oy + 23, 4, 6, 'T2');
        g.rect(ox + 13 - stepOffset, oy + 27, 4, 2, 'W2');
        g.rect(ox + 15 + stepOffset, oy + 27, 4, 2, 'W3');

        // Mochila tecnológica nas costas
        const packX = isLeft ? ox + 19 : ox + 7;
        g.box(packX, oy + 13 + walkBob, 6, 10, 'W3');
        g.rect(packX + 1, oy + 15 + walkBob, 4, 4, 'T2');
        g.rect(
          packX + 2,
          oy + 16 + walkBob,
          2,
          2,
          frame % 2 === 0 ? 'L3' : 'Y3',
        );
        g.rect(packX + 2, oy + 9 + walkBob, 1, 4, 'R3');
        g.px(packX + 2, oy + 8 + walkBob, 'Y4');

        // Corpo lateral
        const bodyX = isLeft ? ox + 10 : ox + 11;
        g.box(bodyX, oy + 14 + walkBob, 11, 10, 'T3');
        g.rect(bodyX + 1, oy + 14 + walkBob, 9, 2, 'Y3');

        // Braço lateral
        const armX = ox + 14 + Math.round(stepOffset * 0.6);
        g.box(armX, oy + 16 + walkBob, 4, 6, 'T4');
        g.px(armX + 1, oy + 21 + walkBob, 'S2');

        // Cabeça lateral
        const headX = isLeft ? ox + 9 : ox + 11;
        g.box(headX, oy + 4 + walkBob, 12, 11, 'S2');
        g.rect(headX, oy + 4 + walkBob, 12, 4, 'H1');
        if (isLeft) {
          g.rect(headX + 7, oy + 6 + walkBob, 5, 7, 'H1');
          g.rect(headX + 2, oy + 9 + walkBob, 2, 2, 'O');
          g.px(headX + 2, oy + 9 + walkBob, 'C2');
          g.rect(headX + 6, oy + 8 + walkBob, 3, 3, 'T3');
          g.px(headX + 7, oy + 9 + walkBob, 'Y3');
        } else {
          g.rect(headX, oy + 6 + walkBob, 5, 7, 'H1');
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

// 2. Moradores 32x48 px — Luna, Kai, Maya, Nox e Íris (4 frames cada = 128x240 px)
function generateResidentsSheet() {
  const g = createPixelCanvas(128, 240);
  const configs = [
    // Luna: Estudante de cibernética (lilás + dourado + tablet)
    {
      skin: 'S2',
      hair: 'L1',
      hairHi: 'L3',
      coat: 'L2',
      accent: 'Y3',
      pants: 'T1',
      prop: 'tablet',
    },
    // Kai: Engenheiro de sistemas (madeira + azul-petróleo + visor)
    {
      skin: 'P2',
      hair: 'H1',
      hairHi: 'H2',
      coat: 'W3',
      accent: 'T3',
      pants: 'T1',
      prop: 'visor',
    },
    // Maya: Comerciante do Mercado Neon (dourado + petróleo + avental madeira)
    {
      skin: 'P3',
      hair: 'H2',
      hairHi: 'Y3',
      coat: 'T3',
      accent: 'W3',
      pants: 'W1',
      prop: 'lantern',
    },
    // Nox: Treinador de rotina (verde natural + dourado)
    {
      skin: 'S2',
      hair: 'H1',
      hairHi: 'G4',
      coat: 'G3',
      accent: 'Y3',
      pants: 'T1',
      prop: 'band',
    },
    // Íris: Bibliotecária de dados (lilás claro + azul-petróleo + cristal flutuante)
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

      // Sombra no solo
      g.rect(ox + 9, oy + 44, 14, 2, 'rgba(18, 30, 32, 0.38)');

      // Botas e pernas (altura 32..44)
      g.box(ox + 11, oy + 34, 4, 10, cfg.pants);
      g.box(ox + 17, oy + 34, 4, 10, cfg.pants);
      g.rect(ox + 11, oy + 41, 4, 3, 'W2');
      g.rect(ox + 17, oy + 41, 4, 3, 'W2');

      // Tronco / Roupa estilizada (y = 20..35)
      g.box(ox + 9, oy + 20 + breath, 14, 15, cfg.coat);
      g.rect(ox + 11, oy + 21 + breath, 10, 3, cfg.accent);
      g.rect(ox + 14, oy + 24 + breath, 4, 9, cfg.accent);

      // Braços
      g.box(ox + 6, oy + 21 + breath, 3, 11, cfg.coat);
      g.box(ox + 23, oy + 21 + breath, 3, 11, cfg.coat);
      g.rect(ox + 6, oy + 30 + breath, 3, 2, cfg.skin);
      g.rect(ox + 23, oy + 30 + breath, 3, 2, cfg.skin);

      // Cabelo longo atrás (para Luna e Íris)
      if (row === 0 || row === 4) {
        g.box(ox + 8, oy + 9 + breath, 16, 17, cfg.hair);
      }

      // Cabeça (y = 7..20)
      g.box(ox + 9, oy + 7 + breath, 14, 13, cfg.skin);
      g.rect(ox + 9, oy + 7 + breath, 14, 5, cfg.hair);
      g.rect(ox + 10, oy + 8 + breath, 12, 2, cfg.hairHi);

      // Detalhes de rosto
      g.rect(ox + 12, oy + 13 + breath, 2, 2, 'O');
      g.rect(ox + 18, oy + 13 + breath, 2, 2, 'O');
      g.px(ox + 12, oy + 13 + breath, 'C2');
      g.px(ox + 18, oy + 13 + breath, 'C2');

      // Acessórios característicos de cada morador
      if (cfg.prop === 'tablet') {
        g.box(ox + 21, oy + 25 + breath, 6, 5, 'T2');
        g.rect(ox + 22, oy + 26 + breath, 4, 3, frame % 2 === 0 ? 'L4' : 'T5');
      } else if (cfg.prop === 'visor') {
        g.rect(ox + 10, oy + 10 + breath, 12, 2, 'T4');
        g.px(ox + 15, oy + 10 + breath, 'Y4');
      } else if (cfg.prop === 'lantern') {
        g.rect(ox + 11, oy + 5 + breath, 10, 2, 'Y3'); // faixa dourada
        g.box(ox + 23, oy + 27 + breath, 4, 5, 'Y3');
        g.rect(ox + 24, oy + 28 + breath, 2, 3, 'Y4');
      } else if (cfg.prop === 'band') {
        g.rect(ox + 9, oy + 10 + breath, 14, 2, 'Y3');
        g.rect(ox + 6, oy + 28 + breath, 3, 2, 'T4');
      } else if (cfg.prop === 'crystal') {
        // Cristal holográfico flutuando ao lado de Íris
        g.px(ox + 26, oy + 14 + floatY, 'L4');
        g.rect(ox + 25, oy + 15 + floatY, 3, 4, 'L3');
        g.px(ox + 26, oy + 16 + floatY, 'Y4');
        g.px(ox + 26, oy + 19 + floatY, 'L2');
      }
    }
  });

  return g.canvas.toDataURL('image/png');
}

// 3. Terrenos e Natureza (128x112 px — base 16x16 px)
function generateTerrainSheet() {
  const g = createPixelCanvas(128, 112);

  // Linha 0 (y = 0): Grama (4 variações), Parque, Arbusto, Cristal (2 frames)
  for (let i = 0; i < 5; i++) {
    const ox = i * 16;
    g.rect(ox, 0, 16, 16, i === 4 ? 'G2' : 'G3');
    // Textura pixel-art orgânica
    g.px(ox + 3, 3, 'G4');
    g.px(ox + 4, 2, 'G4');
    g.px(ox + 11, 6, 'G4');
    g.px(ox + 12, 5, 'G5');
    g.px(ox + 6, 12, 'G2');
    g.px(ox + 13, 13, 'G4');

    if (i === 1) {
      // Tufos de grama alta
      g.rect(ox + 2, 8, 1, 3, 'G5');
      g.rect(ox + 4, 7, 1, 4, 'G4');
      g.rect(ox + 10, 10, 1, 3, 'G5');
      g.rect(ox + 12, 9, 1, 4, 'G4');
    } else if (i === 2) {
      // Flores douradas
      g.px(ox + 4, 4, 'Y3');
      g.px(ox + 5, 4, 'Y4');
      g.px(ox + 4, 5, 'Y2');
      g.px(ox + 11, 10, 'Y3');
      g.px(ox + 12, 11, 'Y4');
    } else if (i === 3) {
      // Flores lilás
      g.px(ox + 5, 5, 'L3');
      g.px(ox + 6, 5, 'L4');
      g.px(ox + 10, 4, 'L3');
      g.px(ox + 3, 11, 'L4');
    } else if (i === 4) {
      // Grama parque com trevos
      g.rect(ox + 3, 4, 2, 2, 'G4');
      g.rect(ox + 10, 9, 2, 2, 'G4');
      g.px(ox + 7, 13, 'G5');
    }
  }

  // (5, 0) Arbusto 16x16
  const bx = 5 * 16;
  g.rect(bx + 3, 13, 10, 2, 'G1');
  g.box(bx + 2, 4, 12, 10, 'G2');
  g.rect(bx + 3, 5, 10, 6, 'G3');
  g.rect(bx + 4, 5, 7, 3, 'G4');
  g.px(bx + 5, 7, 'Y3');
  g.px(bx + 10, 8, 'L4');
  g.px(bx + 8, 6, 'Y4');

  // (6, 0) e (7, 0) Cristais bio-luminescentes (2 frames)
  for (let f = 0; f < 2; f++) {
    const cx = (6 + f) * 16;
    g.rect(cx + 3, 12, 10, 3, 'R1');
    g.rect(cx + 4, 11, 8, 2, 'R2');
    // Cristal principal azul-petróleo
    g.box(cx + 6, 3, 4, 9, 'T3');
    g.rect(cx + 7, 4, 1, 6, f === 0 ? 'T5' : 'Y4');
    // Cristal lateral lilás
    g.box(cx + 3, 6, 3, 6, 'L2');
    g.px(cx + 4, 7, 'L4');
    g.box(cx + 10, 7, 3, 5, 'L3');
    if (f === 1) {
      g.px(cx + 5, 2, 'Y4');
      g.px(cx + 11, 5, 'T5');
    }
  }

  // Linha 1 (y = 16): Caminhos de terra, pedra, piso interno e tapete
  // (0,1) Terra batida 1
  g.rect(0, 16, 16, 16, 'W3');
  g.px(3, 19, 'W4');
  g.px(11, 21, 'W2');
  g.px(6, 27, 'W4');
  g.px(13, 28, 'W2');

  // (1,1) Terra batida 2 com pedrinhas
  g.rect(16, 16, 16, 16, 'W3');
  g.rect(19, 20, 2, 2, 'W2');
  g.rect(26, 25, 2, 1, 'W4');
  g.px(22, 18, 'W4');
  g.px(28, 19, 'W2');

  // (2,1) Estrada de pedra 1
  g.rect(32, 16, 16, 16, 'R1');
  g.rect(33, 17, 6, 6, 'R2');
  g.rect(34, 17, 4, 2, 'R3');
  g.rect(40, 17, 7, 6, 'R2');
  g.rect(41, 17, 5, 2, 'R3');
  g.rect(33, 24, 8, 7, 'R2');
  g.rect(34, 24, 6, 2, 'R3');
  g.rect(42, 24, 5, 7, 'R2');
  g.px(39, 23, 'G3'); // musgo sutil entre pedras

  // (3,1) Estrada de pedra 2 com detalhe dourado
  g.rect(48, 16, 16, 16, 'R1');
  g.rect(49, 17, 14, 14, 'R2');
  g.rect(50, 18, 12, 12, 'R3');
  g.rect(54, 22, 4, 4, 'T2');
  g.rect(55, 23, 2, 2, 'Y3');

  // (4,1) Calçada de madeira
  g.rect(64, 16, 16, 16, 'W1');
  for (let py = 17; py < 31; py += 4) {
    g.rect(65, py, 14, 3, 'W3');
    g.rect(65, py, 14, 1, 'W4');
  }

  // (5,1) Piso de madeira interior
  g.rect(80, 16, 16, 16, 'W2');
  g.rect(80, 16, 8, 7, 'W3');
  g.rect(81, 17, 6, 2, 'W4');
  g.rect(88, 24, 8, 7, 'W3');
  g.rect(89, 25, 6, 2, 'W4');

  // (6,1) Parede interior (azul-petróleo + rodapé madeira + friso dourado)
  g.rect(96, 16, 16, 16, 'T1');
  g.rect(96, 17, 16, 8, 'T2');
  g.rect(96, 25, 16, 1, 'Y3');
  g.rect(96, 26, 16, 6, 'W2');
  g.rect(96, 27, 16, 2, 'W3');

  // (7,1) Tapete interior lilás e dourado
  g.rect(112, 16, 16, 16, 'L1');
  g.rect(113, 17, 14, 14, 'Y3');
  g.rect(114, 18, 12, 12, 'L2');
  g.rect(116, 20, 8, 8, 'L3');

  // Linha 2 (y = 32): 6 frames de Água Animada (x = 0..95) + 2 estágios de Plantação
  for (let f = 0; f < 6; f++) {
    const wx = f * 16;
    g.rect(wx, 32, 16, 16, 'T2');
    g.rect(wx, 32, 16, 3, 'T1');
    const shift = (f * 3) % 14;
    g.rect(wx + ((2 + shift) % 11), 36, 5, 1, 'T4');
    g.rect(wx + ((7 + shift) % 10), 40, 6, 1, 'T5');
    g.rect(wx + ((4 + shift) % 11), 44, 4, 1, 'T4');
    if (f % 2 === 0) {
      g.px(wx + ((5 + f * 2) % 13), 38, 'Y4');
    }
  }

  // (6,2) Canteiro de terra preparada
  g.rect(96, 32, 16, 16, 'G3');
  g.box(97, 33, 14, 14, 'W2', 'W1');
  g.rect(99, 35, 10, 2, 'W1');
  g.rect(99, 39, 10, 2, 'W1');
  g.rect(99, 43, 10, 2, 'W1');

  // (7,2) Plantação florescendo
  g.rect(112, 32, 16, 16, 'G3');
  g.box(113, 33, 14, 14, 'W2', 'W1');
  for (let rowCrop = 0; rowCrop < 3; rowCrop++) {
    const cy = 35 + rowCrop * 4;
    g.rect(115, cy, 10, 2, 'G4');
    g.px(116, cy, 'Y3');
    g.px(120, cy, 'L4');
    g.px(123, cy, 'Y4');
  }

  // Linhas 3..5 (y = 48..95):
  // Árvore 1 (32x48 em x=0, y=48)
  g.rect(10, 88, 12, 4, 'rgba(20, 38, 30, 0.35)');
  g.box(12, 74, 8, 16, 'W2');
  g.rect(14, 75, 3, 14, 'W3');
  // Copa em camadas de verde natural
  g.box(4, 54, 24, 22, 'G1');
  g.rect(5, 55, 22, 19, 'G2');
  g.box(7, 50, 18, 18, 'G3');
  g.rect(9, 51, 14, 10, 'G4');
  g.rect(11, 52, 8, 4, 'G5');

  // Árvore 2 com lanterna dourada (32x48 em x=32, y=48)
  g.rect(42, 88, 12, 4, 'rgba(20, 38, 30, 0.35)');
  g.box(44, 74, 8, 16, 'W2');
  g.rect(46, 75, 3, 14, 'W3');
  g.box(36, 54, 24, 22, 'G1');
  g.rect(37, 55, 22, 19, 'G2');
  g.box(39, 50, 18, 18, 'G3');
  g.rect(41, 51, 14, 10, 'G4');
  // Flores lilás na copa e lanterna dourada pendurada
  g.px(42, 56, 'L4');
  g.px(52, 54, 'L4');
  g.px(48, 61, 'L3');
  g.rect(55, 72, 1, 3, 'W1');
  g.box(54, 75, 3, 4, 'Y3');
  g.px(55, 76, 'Y4');

  // Mini-estufa de jardim (32x32 em x=64, y=48)
  g.box(66, 54, 28, 22, 'T3');
  g.rect(68, 56, 24, 18, 'T4');
  g.rect(70, 62, 20, 10, 'G3');
  g.rect(72, 60, 6, 8, 'G4');
  g.rect(81, 61, 7, 7, 'G4');
  g.px(75, 62, 'Y3');
  g.px(84, 62, 'L4');
  // Vigas de madeira
  g.rect(66, 54, 28, 2, 'W3');
  g.rect(79, 54, 2, 22, 'W3');
  g.rect(66, 74, 28, 2, 'W2');

  return g.canvas.toDataURL('image/png');
}

// 4. Construções 96x64 px cada (3 cols x 2 rows = 288x128 px)
function generateBuildingsSheet() {
  const g = createPixelCanvas(288, 128);

  const drawBaseStructure = (ox, oy, wallMain, wallTrim, roofMain, roofHi) => {
    // Sombra projetada no chão
    g.rect(ox + 4, oy + 60, 88, 3, 'rgba(18, 30, 32, 0.35)');
    // Alicerce de pedra
    g.box(ox + 6, oy + 52, 84, 9, 'R2');
    g.rect(ox + 7, oy + 53, 82, 2, 'R3');
    // Corpo principal
    g.box(ox + 8, oy + 24, 80, 30, wallMain);
    g.rect(ox + 8, oy + 24, 5, 30, wallTrim);
    g.rect(ox + 83, oy + 24, 5, 30, wallTrim);
    // Telhado principal
    g.box(ox + 4, oy + 10, 88, 16, roofMain);
    g.rect(ox + 6, oy + 11, 84, 4, roofHi);
    g.rect(ox + 4, oy + 24, 88, 2, 'Y3'); // beiral iluminado dourado
  };

  // (0, 0) 1. Núcleo Central — cívico azul-petróleo, madeira e torre com relógio dourado
  {
    const ox = 0;
    const oy = 0;
    drawBaseStructure(ox, oy, 'W3', 'W2', 'T2', 'T3');
    // Torre central elevada
    g.box(ox + 34, oy + 2, 28, 22, 'T3');
    g.rect(ox + 36, oy + 3, 24, 3, 'T4');
    g.box(ox + 41, oy + 6, 14, 14, 'W2');
    g.rect(ox + 43, oy + 8, 10, 10, 'Y3');
    g.rect(ox + 45, oy + 10, 6, 6, 'Y4');
    g.rect(ox + 47, oy + 10, 1, 4, 'O');
    g.rect(ox + 47, oy + 13, 3, 1, 'O');
    // Janelas quentes
    [16, 26, 60, 70].forEach((wx) => {
      g.box(ox + wx, oy + 31, 8, 11, 'Y3');
      g.rect(ox + wx + 1, oy + 32, 6, 4, 'Y4');
    });
    // Porta dupla central
    g.box(ox + 41, oy + 37, 14, 17, 'W1');
    g.rect(ox + 43, oy + 39, 4, 14, 'W3');
    g.rect(ox + 49, oy + 39, 4, 14, 'W3');
    g.rect(ox + 41, oy + 35, 14, 2, 'Y3');
  }

  // (96, 0) 2. Universidade Neon — telhado lilás, cúpula de vidro e vitrais
  {
    const ox = 96;
    const oy = 0;
    drawBaseStructure(ox, oy, 'R3', 'W3', 'L2', 'L3');
    // Cúpula observatório azul-petróleo
    g.box(ox + 36, oy + 2, 24, 12, 'T3');
    g.rect(ox + 39, oy + 4, 18, 6, 'T4');
    g.rect(ox + 43, oy + 5, 8, 2, 'T5');
    // Vitrais altos lilás e dourado
    [17, 29, 59, 71].forEach((wx) => {
      g.box(ox + wx, oy + 29, 7, 15, 'L3');
      g.rect(ox + wx + 1, oy + 30, 5, 6, 'Y4');
    });
    // Entrada com colunas de madeira
    g.box(ox + 40, oy + 36, 16, 18, 'W2');
    g.rect(ox + 43, oy + 38, 10, 15, 'T1');
    g.rect(ox + 44, oy + 39, 8, 4, 'L4');
  }

  // (192, 0) 3. Estufa BioTech — madeira clara, vidro azul-petróleo e jardim interno
  {
    const ox = 192;
    const oy = 0;
    g.rect(ox + 4, oy + 60, 88, 3, 'rgba(18, 30, 32, 0.35)');
    g.box(ox + 6, oy + 52, 84, 9, 'W2');
    // Estrutura abobadada de vidro
    g.box(ox + 8, oy + 12, 80, 42, 'T3');
    g.rect(ox + 10, oy + 14, 76, 38, 'T4');
    g.rect(ox + 12, oy + 15, 72, 6, 'T5');
    // Vegetação exuberante visível através do vidro
    g.rect(ox + 12, oy + 28, 72, 22, 'G2');
    g.rect(ox + 15, oy + 24, 22, 18, 'G3');
    g.rect(ox + 38, oy + 21, 24, 20, 'G4');
    g.rect(ox + 62, oy + 25, 19, 17, 'G3');
    // Flores douradas e lilás dentro da estufa
    g.rect(ox + 22, oy + 29, 3, 3, 'Y3');
    g.rect(ox + 48, oy + 26, 3, 3, 'L4');
    g.rect(ox + 69, oy + 31, 3, 3, 'Y4');
    // Vigas estruturais de madeira
    [8, 28, 47, 66, 86].forEach((vx) => {
      g.rect(ox + vx, oy + 12, 2, 42, 'W3');
    });
    g.rect(ox + 8, oy + 12, 80, 2, 'W3');
    g.rect(ox + 8, oy + 26, 80, 2, 'W3');
    // Porta da estufa
    g.box(ox + 42, oy + 38, 12, 16, 'W3');
    g.rect(ox + 44, oy + 40, 8, 12, 'G4');
  }

  // (0, 64) 4. Laboratório de Inovação — madeira, azul-petróleo e turbina eólica
  {
    const ox = 0;
    const oy = 64;
    drawBaseStructure(ox, oy, 'T2', 'W3', 'W2', 'W3');
    // Painéis solares azul-petróleo no telhado
    g.box(ox + 14, oy + 12, 24, 10, 'T3');
    g.rect(ox + 16, oy + 14, 20, 6, 'T4');
    // Pequena torre eólica / antena lilás
    g.rect(ox + 72, oy + 2, 2, 12, 'R3');
    g.rect(ox + 68, oy + 4, 10, 2, 'Y3');
    g.rect(ox + 72, oy + 0, 2, 10, 'Y4');
    // Bancada e visores externos
    [16, 62].forEach((wx) => {
      g.box(ox + wx, oy + 31, 16, 10, 'T4');
      g.rect(ox + wx + 2, oy + 33, 6, 3, 'L4');
      g.rect(ox + wx + 10, oy + 33, 4, 5, 'Y3');
    });
    // Porta tecnológica
    g.box(ox + 41, oy + 37, 14, 17, 'R2');
    g.rect(ox + 43, oy + 39, 10, 14, 'T3');
    g.rect(ox + 47, oy + 39, 2, 14, 'Y3');
  }

  // (96, 64) 5. Mercado Neon — madeira acolhedora, toldos lilás e dourado, caixotes
  {
    const ox = 96;
    const oy = 64;
    drawBaseStructure(ox, oy, 'W3', 'W2', 'W2', 'W4');
    // Toldo listrado lilás e dourado
    for (let sx = 10; sx < 86; sx += 8) {
      const isLilac = ((sx - 10) / 8) % 2 === 0;
      g.rect(ox + sx, oy + 24, 8, 7, isLilac ? 'L3' : 'Y3');
      g.rect(ox + sx, oy + 30, 8, 2, isLilac ? 'L2' : 'Y2');
    }
    // Bancas de frutas/itens na frente
    g.box(ox + 14, oy + 42, 18, 10, 'W2');
    g.rect(ox + 16, oy + 40, 6, 3, 'G4');
    g.rect(ox + 24, oy + 40, 6, 3, 'Y3');
    g.box(ox + 64, oy + 42, 18, 10, 'W2');
    g.rect(ox + 66, oy + 40, 6, 3, 'L4');
    g.rect(ox + 74, oy + 40, 6, 3, 'T4');
    // Entrada central com lanterna dourada
    g.box(ox + 41, oy + 36, 14, 18, 'W1');
    g.rect(ox + 43, oy + 38, 10, 15, 'Y3');
    g.rect(ox + 44, oy + 39, 8, 8, 'Y4');
  }

  // (192, 64) 6. Arcade 88 — madeira escura, azul-petróleo e letreiro dourado/lilás
  {
    const ox = 192;
    const oy = 64;
    drawBaseStructure(ox, oy, 'T1', 'L2', 'L1', 'L2');
    // Letreiro "88" dourado e lilás no topo
    g.box(ox + 30, oy + 4, 36, 14, 'O');
    g.rect(ox + 31, oy + 5, 34, 12, 'L2');
    // Dígitos "88" pixelados em luz dourada
    [38, 50].forEach((dx) => {
      g.rect(ox + dx, oy + 7, 6, 8, 'Y3');
      g.rect(ox + dx + 2, oy + 9, 2, 1, 'L2');
      g.rect(ox + dx + 2, oy + 12, 2, 1, 'L2');
    });
    // Janelas estilo fliperama acolhedor
    [16, 64].forEach((wx) => {
      g.box(ox + wx, oy + 32, 16, 10, 'L3');
      g.rect(ox + wx + 2, oy + 34, 12, 6, 'T4');
      g.px(ox + wx + 5, oy + 36, 'Y4');
      g.px(ox + wx + 10, oy + 37, 'Y3');
    });
    // Entrada
    g.box(ox + 41, oy + 36, 14, 18, 'W2');
    g.rect(ox + 43, oy + 38, 10, 15, 'T3');
    g.rect(ox + 45, oy + 40, 6, 5, 'Y4');
  }

  return g.canvas.toDataURL('image/png');
}

// 5. Objetos e Decoração (128x96 px) — Bancos, postes, robôs, drones, computadores, móveis e placas holográficas
function generatePropsSheet() {
  const g = createPixelCanvas(128, 96);

  // (0, 0) Banco de madeira (32x16 px)
  g.rect(3, 13, 26, 2, 'rgba(20, 32, 34, 0.3)');
  g.box(3, 4, 26, 5, 'W3');
  g.rect(4, 5, 24, 1, 'W4');
  g.box(2, 9, 28, 4, 'W2');
  g.rect(5, 13, 2, 3, 'W1');
  g.rect(25, 13, 2, 3, 'W1');

  // (32, 0) e (48, 0) Poste com luminária dourada (16x32 px, 2 frames)
  for (let f = 0; f < 2; f++) {
    const ox = 32 + f * 16;
    g.rect(ox + 6, 29, 4, 2, 'rgba(20, 32, 34, 0.35)');
    g.rect(ox + 7, 11, 2, 19, 'W1');
    g.rect(ox + 6, 27, 4, 3, 'R2');
    // Lanterna dourada no topo
    g.box(ox + 5, 4, 6, 7, 'Y2');
    g.rect(ox + 6, 5, 4, 5, f === 0 ? 'Y3' : 'Y4');
    g.rect(ox + 4, 3, 8, 2, 'T2');
    if (f === 1) {
      g.px(ox + 4, 7, 'Y4');
      g.px(ox + 11, 7, 'Y4');
    }
  }

  // (64, 0) e (80, 0) Placa holográfica cotidiana (16x32 px, 2 frames)
  for (let f = 0; f < 2; f++) {
    const ox = 64 + f * 16;
    g.box(ox + 5, 24, 6, 6, 'W2');
    g.rect(ox + 7, 19, 2, 5, 'R2');
    // Projeção holográfica lilás & azul-petróleo
    g.box(ox + 2, 5, 12, 14, 'T2');
    g.rect(ox + 3, 6, 10, 12, f === 0 ? 'T3' : 'L3');
    g.rect(ox + 4, 8, 8, 2, 'Y4');
    g.rect(ox + 4, 12, 5, 2, 'L4');
    g.rect(ox + 4, 15, 7, 1, 'T5');
  }

  // (96, 0) Vaso bio-botânico (16x16 px)
  g.box(100, 9, 8, 6, 'W3');
  g.rect(101, 5, 6, 5, 'G3');
  g.rect(102, 3, 4, 3, 'G4');
  g.px(103, 4, 'Y3');

  // (112, 0) Computador / Terminal de interior (16x16 px)
  g.box(114, 9, 12, 6, 'W2');
  g.box(115, 2, 10, 8, 'R2');
  g.rect(116, 3, 8, 6, 'T3');
  g.rect(117, 4, 5, 2, 'Y4');
  g.rect(117, 7, 6, 1, 'L4');

  // (96, 16) Estante de livros de madeira (16x16 px)
  g.box(97, 17, 14, 14, 'W2');
  g.rect(98, 18, 12, 5, 'W1');
  g.rect(98, 25, 12, 5, 'W1');
  g.rect(99, 19, 2, 4, 'T3');
  g.rect(102, 19, 2, 4, 'Y3');
  g.rect(105, 19, 2, 4, 'L3');
  g.rect(100, 26, 2, 4, 'G3');
  g.rect(103, 26, 3, 4, 'Y2');
  g.rect(107, 26, 2, 4, 'T4');

  // (112, 16) Mesa de madeira e protótipo (16x16 px)
  g.box(113, 22, 14, 8, 'W3');
  g.rect(114, 23, 12, 2, 'W4');
  g.box(117, 18, 6, 4, 'L2');
  g.px(119, 19, 'Y4');

  // Linha y = 32: Drone Companheiro (4 frames em x = 0..63)
  for (let f = 0; f < 4; f++) {
    const ox = f * 16;
    const hover = f === 1 || f === 2 ? -1 : 0;
    g.rect(ox + 5, 45, 6, 1, 'rgba(20, 32, 34, 0.25)');
    // Hélices
    g.rect(ox + (f % 2 === 0 ? 2 : 4), 35 + hover, 4, 1, 'T5');
    g.rect(ox + (f % 2 === 0 ? 10 : 8), 35 + hover, 4, 1, 'T5');
    // Corpo arredondado
    g.box(ox + 4, 36 + hover, 8, 6, 'C1');
    g.rect(ox + 5, 38 + hover, 6, 2, 'T3');
    g.px(ox + 7, 38 + hover, 'Y4');
  }

  // Linha y = 32: Robô Jardineiro / Assistente (4 frames em x = 64..127)
  for (let f = 0; f < 4; f++) {
    const ox = 64 + f * 16;
    const bob = f % 2 === 1 ? -1 : 0;
    g.rect(ox + 4, 46, 8, 2, 'rgba(20, 32, 34, 0.3)');
    g.box(ox + 4, 36 + bob, 8, 9, 'T3');
    g.rect(ox + 5, 37 + bob, 6, 4, 'C2');
    g.rect(ox + 6, 38 + bob, 4, 2, 'L3');
    g.px(ox + 7, 38 + bob, 'Y4');
    // Broto verde no topo do robô
    g.rect(ox + 7, 34 + bob, 2, 2, 'G4');
    g.px(ox + 6, 33 + bob, 'G5');
    g.px(ox + 9, 33 + bob, 'G5');
  }

  return g.canvas.toDataURL('image/png');
}

function buildNeoLifeSpritePack() {
  if (typeof document === 'undefined') {
    return null;
  }
  return {
    player: generatePlayerSheet(),
    residents: generateResidentsSheet(),
    terrain: generateTerrainSheet(),
    buildings: generateBuildingsSheet(),
    props: generatePropsSheet(),
  };
}

const localDay = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};
const safeArray = (value) => (Array.isArray(value) ? value : []);
const completed = (task) =>
  task?.done === true || task?.status === 'done' || task?.completed === true;

function residentLine(resident, stats, history = {}) {
  const count = Number(history[resident.id]) || 0;
  const hello =
    count > 0 ? 'Bom te ver de novo por aqui.' : 'Prazer em conhecer você!';
  if (resident.id === 'luna') {
    if (stats.studyMinutes >= 60)
      return `${hello} Vi que você já dedicou ${stats.studyMinutes} minutos aos estudos. O laboratório está avançando graças a pessoas curiosas como você.`;
    return `${hello} Estou pesquisando novas tecnologias. Uma sessão de estudo sua já seria uma ótima contribuição para nosso laboratório.`;
  }
  if (resident.id === 'kai') {
    if (stats.tasks >= 3)
      return `${hello} ${stats.tasks} tarefas concluídas registradas! Seu foco está ajudando a manter os sistemas do distrito funcionando.`;
    return `${hello} Estou calibrando os servidores da cidade. Cada tarefa concluída ajuda a manter tudo em ordem.`;
  }
  if (resident.id === 'maya')
    return `${hello} Você tem ${stats.coins} moedas no bolso. Passe na loja quando quiser; aqui os preços são claros e não existem compras com dinheiro real.`;
  if (resident.id === 'nox') {
    if (stats.habits >= 3)
      return `${hello} Já existem ${stats.habits} registros de hábitos no seu histórico. Consistência não é perfeição: é voltar quando puder.`;
    return `${hello} Que tal cuidar de um pequeno hábito hoje? O importante é escolher algo que caiba na sua rotina.`;
  }
  if (stats.readings > 0)
    return `${hello} Seu registro de leitura já soma ${stats.readings} item(ns). Conhecimento é uma das melhores formas de explorar novos mundos.`;
  return `${hello} Cada livro ou material que você registra amplia o acervo da cidade. Volte quando tiver uma nova descoberta.`;
}

function cityWorldStart(data) {
  const saved = data?.neoCity?.world?.player;
  return saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)
    ? { x: saved.x, y: saved.y }
    : { x: 8, y: 6 };
}

export default function NeoLifeCity({ data = {}, save, onNavigate }) {
  const [activeTab, setActiveTab] = useState('explore');
  const [selectedResident, setSelectedResident] = useState(null);
  const [worldBubble, setWorldBubble] = useState(null);
  const [notice, setNotice] = useState('');
  const [sequence, setSequence] = useState([]);
  const [playerSequence, setPlayerSequence] = useState([]);
  const [gameState, setGameState] = useState('idle');
  const [gameSeed, setGameSeed] = useState(0);
  const [player, setPlayer] = useState(() => cityWorldStart(data));
  const [insideBuilding, setInsideBuilding] = useState(null);
  const [interiorPlayer, setInteriorPlayer] = useState({ x: 5, y: 4 });
  const [lastDirection, setLastDirection] = useState('down');

  // Estados de animação 16-bit (água, cristais, drone, robô, caminhada 4 quadros)
  const [animTick, setAnimTick] = useState(0);
  const [walkFrame, setWalkFrame] = useState(0);
  const [isWalking, setIsWalking] = useState(false);
  const [sheetZoom, setSheetZoom] = useState(2);
  const [showSpriteGrid, setShowSpriteGrid] = useState(true);
  const walkTimeoutRef = useRef(null);

  const sprites = useMemo(() => buildNeoLifeSpritePack(), []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setAnimTick((prev) => (prev + 1) % 24);
    }, 280);
    return () => {
      window.clearInterval(timer);
      if (walkTimeoutRef.current) window.clearTimeout(walkTimeoutRef.current);
    };
  }, []);

  const city =
    data.neoCity && typeof data.neoCity === 'object' ? data.neoCity : {};
  const inventory = safeArray(city.inventory);
  const talks = city.talks && typeof city.talks === 'object' ? city.talks : {};
  const arcade =
    city.arcade && typeof city.arcade === 'object' ? city.arcade : {};
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

  const persistCity = (nextCity, extra = {}) =>
    save?.({ ...data, ...extra, neoCity: nextCity });

  const isWaterTile = (x, y) =>
    (x >= 0 && x <= 2 && y >= 0 && y <= 2) ||
    (x >= 15 && x <= 17 && y >= 9 && y <= 11);

  const isBlocked = (x, y) => {
    if (x < 0 || x > 17 || y < 0 || y > 11) return true;
    if ((x === 0 || x === 17) && y > 0 && y < 11) return true;
    if (isWaterTile(x, y)) return true;

    const hitBuilding = WORLD_BUILDINGS.some(
      (building) =>
        x >= building.x &&
        x < building.x + building.w &&
        y >= building.y &&
        y < building.y + building.h,
    );
    if (hitBuilding) return true;

    const hitProp = WORLD_PROPS.some(
      (prop) => prop.solid && prop.x === x && prop.y === y,
    );
    if (hitProp) return true;

    const hitResident = RESIDENTS.some(
      (res) => res.worldPos.x === x && res.worldPos.y === y,
    );
    if (hitResident) return true;

    return false;
  };

  const isInteriorBlocked = (x, y) => {
    if (x < 1 || x > 8 || y < 1 || y > 4) {
      // Permite pisar na porta de saída em (5, 5)
      if (x === 5 && y === 5) return false;
      return true;
    }
    // Estações na linha y === 2
    if (y === 2 && [1, 4, 8].includes(x)) return true;
    // Móveis decorativos nos cantos
    if ((x === 1 && y === 1) || (x === 8 && y === 1)) return true;
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
    }, 260);
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

    const nx = Math.max(0, Math.min(17, player.x + dx));
    const ny = Math.max(0, Math.min(11, player.y + dy));
    const blocked =
      isBlocked(nx, ny) &&
      !WORLD_BUILDINGS.some((b) => b.door.x === nx && b.door.y === ny);
    if (!blocked) {
      setPlayer({ x: nx, y: ny });
      setWorldBubble(null);
    }
  };

  const interactInWorld = () => {
    // 1. Verifica porta de construção adjacente
    const nearbyDoor = WORLD_BUILDINGS.find(
      (building) =>
        Math.abs(building.door.x - player.x) +
          Math.abs(building.door.y - player.y) <=
        1,
    );
    if (nearbyDoor) {
      enterBuilding(nearbyDoor);
      return;
    }

    // 2. Verifica morador adjacente no mapa
    const nearbyResident = RESIDENTS.find(
      (res) =>
        Math.abs(res.worldPos.x - player.x) +
          Math.abs(res.worldPos.y - player.y) <=
        1,
    );
    if (nearbyResident) {
      talkTo(nearbyResident, true);
      return;
    }

    // 3. Verifica placa holográfica ou terminal adjacente
    const nearbyProp = WORLD_PROPS.find(
      (p) =>
        (p.type === 'holo' || p.type === 'terminal') &&
        Math.abs(p.x - player.x) + Math.abs(p.y - player.y) <= 1,
    );
    if (nearbyProp) {
      setNotice(
        nearbyProp.type === 'holo'
          ? `Painel Comunitário: ${openCount} de ${DISTRICTS.length} distritos estão ativos hoje.`
          : `Terminal de Serviços: ${stats.tasks} tarefas concluídas e ${stats.studyMinutes} min de estudo registrados.`,
      );
    }
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if (activeTab !== 'explore') return;
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target?.tagName) ||
        event.target?.isContentEditable
      )
        return;
      const key = event.key.toLowerCase();
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
        if (Math.abs(interiorPlayer.x - 5) <= 1 && interiorPlayer.y >= 4)
          leaveBuilding();
        else {
          const stations = [
            { x: 1, y: 2, index: 0 },
            { x: 4, y: 2, index: 1 },
            { x: 8, y: 2, index: 2 },
          ];
          const nearbyStation = stations.find(
            (station) =>
              Math.abs(station.x - interiorPlayer.x) +
                Math.abs(station.y - interiorPlayer.y) <=
              1,
          );
          const room = nearbyStation
            ? insideBuilding.rooms[nearbyStation.index]
            : null;
          if (room)
            setNotice(
              `Você está explorando: ${room}. Em breve este espaço terá atividades interativas.`,
            );
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
    if (district && !districtOpen(district)) {
      setNotice(
        `O ${building.name} ainda está em construção. Continue evoluindo no Meu Assistente para liberar este local.`,
      );
      return;
    }
    setWorldBubble(null);
    setInteriorPlayer({ x: 5, y: 4 });
    setInsideBuilding(building);
    persistCity({ ...city, world: { ...(city.world || {}), player } });
  };

  const leaveBuilding = () => {
    setInsideBuilding(null);
    persistCity({ ...city, world: { ...(city.world || {}), player } });
  };

  const talkTo = (resident, inWorld = false) => {
    const nextTalks = {
      ...talks,
      [resident.id]: (Number(talks[resident.id]) || 0) + 1,
    };
    persistCity({ ...city, talks: nextTalks });
    const payload = {
      ...resident,
      dialogue: residentLine(resident, stats, talks),
    };
    if (inWorld) {
      setWorldBubble(payload);
    } else {
      setSelectedResident(payload);
    }
  };

  const buyItem = (item) => {
    if (ownedIds.has(item.id)) return;
    if (coins < item.price) {
      setNotice(
        `Faltam ${item.price - coins} moedas para comprar ${item.name}.`,
      );
      return;
    }
    persistCity(
      { ...city, inventory: [...inventory, item.id] },
      { coins: coins - item.price },
    );
    setNotice(`${item.name} foi adicionado ao seu inventário.`);
  };

  const startGame = () => {
    if (attemptedToday) {
      setNotice(
        'Você já participou do desafio de hoje. O Arcade terá uma nova rodada amanhã.',
      );
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
    setGameSeed((value) => value + 1);
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
      setNotice(
        'Quase! O desafio de hoje foi encerrado. Amanhã você pode tentar outra sequência.',
      );
      return;
    }
    if (next.length === sequence.length) {
      setGameState('won');
      const nextArcade = {
        ...arcade,
        lastAttemptDate: today,
        lastWinDate: today,
      };
      persistCity(
        { ...city, arcade: nextArcade },
        { coins: Math.max(0, Number(data.coins) || 0) + 12 },
      );
      setNotice('Sequência perfeita! Você ganhou 12 moedas.');
    }
  };

  // Helper de estilo sprite 16-bit escalado 3x (16px -> 48px)
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

  // Posições animadas do drone e do robô jardineiro no mapa
  const dronePath = [
    { x: 7, y: 5 },
    { x: 8, y: 5 },
    { x: 9, y: 5 },
    { x: 10, y: 5 },
    { x: 10, y: 6 },
    { x: 9, y: 6 },
    { x: 8, y: 6 },
    { x: 7, y: 6 },
  ];
  const dronePos = dronePath[animTick % dronePath.length];
  const robotPos = { x: 12 + (animTick % 2), y: 10 };

  const tabs = [
    ['explore', '🕹️ Explorar'],
    ['city', '🌆 Distritos'],
    ['residents', '🧑‍🤝‍🧑 Moradores'],
    ['market', '🛍️ Mercado'],
    ['arcade', '🕹️ Arcade'],
    ['inventory', '🎒 Inventário'],
    ['sprites', '🎨 Spritesheets'],
  ];

  const spriteManifest = [
    {
      id: 'player',
      name: 'player.png',
      title: 'Jogador (32 × 32 px)',
      spec: '4 direções × 4 quadros de caminhada • 128 × 128 px',
      url: sprites?.player,
      w: 128,
      h: 128,
      cellW: 32,
      cellH: 32,
    },
    {
      id: 'residents',
      name: 'residents.png',
      title: 'Moradores: Luna, Kai, Maya, Nox e Íris (32 × 48 px)',
      spec: '5 personagens × 4 quadros animados • 128 × 240 px',
      url: sprites?.residents,
      w: 128,
      h: 240,
      cellW: 32,
      cellH: 48,
    },
    {
      id: 'terrain',
      name: 'terrain.png',
      title: 'Terrenos e Natureza (Base 16 × 16 px)',
      spec: 'Grama, terra, pedra, 6 frames água, árvores e plantações • 128 × 112 px',
      url: sprites?.terrain,
      w: 128,
      h: 112,
      cellW: 16,
      cellH: 16,
    },
    {
      id: 'buildings',
      name: 'buildings.png',
      title: 'Construções da Cidade (96 × 64 px)',
      spec: '6 edifícios únicos em múltiplos de 16 px • 288 × 128 px',
      url: sprites?.buildings,
      w: 288,
      h: 128,
      cellW: 96,
      cellH: 64,
    },
    {
      id: 'props',
      name: 'props.png',
      title: 'Objetos, Robôs, Drones e Interiores (16 × 16 px)',
      spec: 'Bancos, luminárias, drones, robôs, terminais e placas • 128 × 96 px',
      url: sprites?.props,
      w: 128,
      h: 96,
      cellW: 16,
      cellH: 16,
    },
  ];

  return (
    <main className='neo-city-page'>
      <style>{styles}</style>
      <section className='neo-hero'>
        <div className='neo-hero-grid' />
        <div className='neo-hero-copy'>
          <span className='neo-kicker'>NEO-LIFE // SIMULADOR 16-BIT</span>
          <h1>
            Sua vida real. <em>Sua cidade.</em>
          </h1>
          <p>
            Uma comunidade acolhedora onde natureza e tecnologia convivem no
            cotidiano. Explore trilhas, jardins bio-botânicos, converse com
            moradores e evolua cada distrito com suas conquistas reais.
          </p>
          <div className='neo-hero-actions'>
            <button onClick={() => onNavigate?.('tasks')}>
              ＋ Registrar progresso
            </button>
            <span>Sem perder progresso por descansar.</span>
          </div>
        </div>
        <div
          className='neo-city-skyline'
          aria-label='Ilustração em pixel art de uma cidade acolhedora'
        >
          <div className='neo-moon' />
          <div className='neo-tower tower-a' />
          <div className='neo-tower tower-b' />
          <div className='neo-tower tower-c' />
          <div className='neo-tower tower-d' />
          <div className='neo-road' />
          <span className='skyline-label'>
            SETORES CONECTADOS{' '}
            <b>
              {openCount}/{DISTRICTS.length}
            </b>
          </span>
        </div>
        <div className='neo-wallet'>
          <span>CARTEIRA DIGITAL</span>
          <strong>🪙 {coins.toLocaleString('pt-BR')}</strong>
          <small>moedas disponíveis</small>
        </div>
      </section>

      <div className='neo-tabs' role='tablist' aria-label='Áreas da cidade'>
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
      </div>

      {notice && (
        <div className='neo-notice' role='status'>
          ✨ {notice}
          <button onClick={() => setNotice('')} aria-label='Fechar aviso'>
            ×
          </button>
        </div>
      )}

      {activeTab === 'explore' && (
        <>
          <section className='neo-section-heading'>
            <div>
              <span>NEO-LIFE // PACOTE PIXEL ART 16-BIT</span>
              <h2>
                {insideBuilding ? insideBuilding.name : 'Explore a cidade'}
              </h2>
              <p>
                {insideBuilding
                  ? insideBuilding.description
                  : 'Caminhe pelas trilhas de pedra, praças arborizadas e construções tecnológicas. Use WASD/setas para andar e E para entrar ou conversar com moradores.'}
              </p>
            </div>
            <div className='neo-level-chip'>
              📍{' '}
              {insideBuilding
                ? 'INTERIOR'
                : `SETOR ${player.x + 1} · ${player.y + 1}`}
            </div>
          </section>

          {!insideBuilding ? (
            <>
              <div className='neo-world-toolbar'>
                <span>✦ VALE NEO • PIXEL ART 16-BIT</span>
                <span>WASD / SETAS • E PARA INTERAGIR</span>
                <button
                  onClick={() => {
                    setPlayer({ x: 8, y: 6 });
                    setWorldBubble(null);
                  }}
                >
                  Voltar à praça central
                </button>
              </div>

              <div className='neo-world-scroll'>
                <div
                  className='neo-world-map'
                  role='application'
                  aria-label='Mapa explorável da cidade em pixel art'
                >
                  {Array.from({ length: 18 * 12 }, (_, index) => {
                    const x = index % 18;
                    const y = Math.floor(index / 18);

                    const building = WORLD_BUILDINGS.find(
                      (b) =>
                        x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h,
                    );
                    const isBuildingAnchor =
                      building && x === building.x && y === building.y;
                    const door = WORLD_BUILDINGS.find(
                      (b) => b.door.x === x && b.door.y === y,
                    );
                    const prop = WORLD_PROPS.find(
                      (p) => p.x === x && p.y === y,
                    );
                    const resident = RESIDENTS.find(
                      (r) => r.worldPos.x === x && r.worldPos.y === y,
                    );

                    const isRoad = y === 5 || y === 6 || x === 7 || x === 12;
                    const isPark =
                      (x >= 5 && x <= 6 && y >= 1 && y <= 3) ||
                      (x >= 12 && x <= 13 && y >= 8 && y <= 10);
                    const isWater = isWaterTile(x, y);
                    const isPath =
                      !isRoad &&
                      !building &&
                      !isWater &&
                      ((y === 4 && x > 2 && x < 16) ||
                        (y === 7 && x > 2 && x < 16) ||
                        (x === 4 && y > 2 && y < 10));

                    // Seleção do tile de terreno 16x16 px
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
                      terrainCol = 2; // flor dourada
                      terrainRow = 0;
                    } else if ((x * 5 + y * 13) % 11 === 0) {
                      terrainCol = 3; // flor lilás
                      terrainRow = 0;
                    }

                    const playerHere = player.x === x && player.y === y;
                    const droneHere = dronePos.x === x && dronePos.y === y;
                    const robotHere = robotPos.x === x && robotPos.y === y;
                    const waterFrame = (animTick + x + y) % 2;

                    return (
                      <div
                        key={`${x}-${y}`}
                        className='neo-world-tile'
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
                        {/* Construções 96x64 px escaladas para 144x96 px (3x2 tiles exatos) */}
                        {isBuildingAnchor && sprites?.buildings ? (
                          <div
                            className='neo-building-sprite-sheet'
                            title={building.name}
                            onClick={() => enterBuilding(building)}
                            style={tileSpriteStyle(
                              sprites.buildings,
                              288,
                              128,
                              building.spriteCol * 96,
                              building.spriteRow * 64,
                              96,
                              64,
                              1.5,
                            )}
                          >
                            <span className='neo-building-tag'>
                              {building.name}
                            </span>
                          </div>
                        ) : null}

                        {/* Objetos e natureza */}
                        {prop && prop.type === 'tree' && sprites?.terrain ? (
                          <span
                            className='neo-prop-sprite tall-tree'
                            style={tileSpriteStyle(
                              sprites.terrain,
                              128,
                              112,
                              0,
                              48,
                              32,
                              48,
                              1.6,
                            )}
                          />
                        ) : null}

                        {prop &&
                        prop.type === 'tree-lantern' &&
                        sprites?.terrain ? (
                          <span
                            className='neo-prop-sprite tall-tree'
                            style={tileSpriteStyle(
                              sprites.terrain,
                              128,
                              112,
                              32,
                              48,
                              32,
                              48,
                              1.6,
                            )}
                          />
                        ) : null}

                        {prop && prop.type === 'bush' && sprites?.terrain ? (
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

                        {prop && prop.type === 'crystal' && sprites?.terrain ? (
                          <span
                            className='neo-prop-sprite'
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

                        {prop && prop.type === 'crop' && sprites?.terrain ? (
                          <span
                            className='neo-prop-sprite'
                            style={tileSpriteStyle(
                              sprites.terrain,
                              128,
                              112,
                              112,
                              32,
                              16,
                              16,
                              3,
                            )}
                          />
                        ) : null}

                        {prop && prop.type === 'bench' && sprites?.props ? (
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

                        {prop && prop.type === 'lamp' && sprites?.props ? (
                          <span
                            className='neo-prop-sprite tall-prop'
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

                        {prop && prop.type === 'holo' && sprites?.props ? (
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

                        {prop && prop.type === 'terminal' && sprites?.props ? (
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

                        {/* Moradores no mapa (32x48 px animados) */}
                        {resident && sprites?.residents ? (
                          <button
                            type='button'
                            className='neo-map-resident'
                            title={`Conversar com ${resident.name}`}
                            onClick={() => talkTo(resident, true)}
                          >
                            <span
                              className='neo-resident-sprite'
                              style={tileSpriteStyle(
                                sprites.residents,
                                128,
                                240,
                                ((animTick + resident.spriteRow) % 4) * 32,
                                resident.spriteRow * 48,
                                32,
                                48,
                                1.35,
                              )}
                            />
                            <b>{resident.name}</b>
                          </button>
                        ) : null}

                        {/* Robô jardineiro animado */}
                        {robotHere && sprites?.props ? (
                          <span
                            className='neo-npc-bot'
                            title='Robô Jardineiro'
                            style={tileSpriteStyle(
                              sprites.props,
                              128,
                              96,
                              64 + (animTick % 4) * 16,
                              32,
                              16,
                              16,
                              2.4,
                            )}
                          />
                        ) : null}

                        {/* Drone companheiro animado */}
                        {droneHere && sprites?.props ? (
                          <span
                            className='neo-npc-drone'
                            title='Drone Urbano'
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

                        {/* Jogador 32x32 px com 4 direções e 4 quadros de caminhada */}
                        {playerHere && sprites?.player ? (
                          <span
                            className='neo-player-sprite'
                            aria-label='Você'
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

              {worldBubble && (
                <div className='neo-world-bubble' role='status'>
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
                          1.5,
                        )}
                      />
                    )}
                  </div>
                  <div>
                    <span>
                      {worldBubble.name.toUpperCase()} · {worldBubble.role}
                    </span>
                    <p>“{worldBubble.dialogue}”</p>
                  </div>
                  <button
                    onClick={() => setWorldBubble(null)}
                    aria-label='Fechar conversa'
                  >
                    ×
                  </button>
                </div>
              )}

              <div className='neo-world-controls'>
                <div className='neo-dpad'>
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
                  Aproxime-se de uma porta, painel holográfico ou morador e
                  pressione <b>E</b> (ou clique diretamente). Locais bloqueados
                  abrem conforme seu progresso real.
                </p>
              </div>

              <section className='neo-building-list'>
                <h3>Locais da cidade</h3>
                <div>
                  {WORLD_BUILDINGS.map((building) => {
                    const district = DISTRICTS.find(
                      (d) => d.id === building.district,
                    );
                    const unlocked = districtOpen(district);
                    return (
                      <button
                        key={building.id}
                        disabled={!unlocked}
                        onClick={() => enterBuilding(building)}
                      >
                        {sprites?.buildings ? (
                          <span
                            className='neo-building-thumb'
                            style={tileSpriteStyle(
                              sprites.buildings,
                              288,
                              128,
                              building.spriteCol * 96,
                              building.spriteRow * 64,
                              96,
                              64,
                              0.6,
                            )}
                          />
                        ) : (
                          <span>{building.icon}</span>
                        )}
                        <b>{building.name}</b>
                        <small>
                          {unlocked ? 'Entrar no prédio ↗' : '🔒 Em construção'}
                        </small>
                      </button>
                    );
                  })}
                </div>
              </section>
            </>
          ) : (
            <div className='neo-interior'>
              <div className='neo-interior-header'>
                <span>INTERIOR // {insideBuilding.district.toUpperCase()}</span>
                <button onClick={leaveBuilding}>← Sair para a cidade</button>
              </div>
              <div className='neo-interior-room'>
                <div className='neo-interior-window'>🌤️</div>
                <div className='neo-interior-sign'>
                  {insideBuilding.icon}
                  <h3>{insideBuilding.name}</h3>
                  <p>{insideBuilding.description}</p>
                </div>
                <div className='neo-interior-map'>
                  {Array.from({ length: 60 }, (_, index) => {
                    const x = index % 10;
                    const y = Math.floor(index / 10);
                    const isWall = y === 0 || y === 5 || x === 0 || x === 9;
                    const isRug = x >= 4 && x <= 6 && y >= 3 && y <= 4;
                    const stationIndex =
                      y === 2 ? (x < 3 ? 0 : x < 7 ? 1 : 2) : -1;
                    const station =
                      y === 2 && [1, 4, 8].includes(x)
                        ? insideBuilding.rooms[stationIndex]
                        : null;
                    const isPlayer =
                      interiorPlayer.x === x && interiorPlayer.y === y;

                    const floorCol = isWall ? 6 : isRug ? 7 : 5;
                    const floorRow = 1;

                    return (
                      <div
                        key={index}
                        className={`neo-interior-tile ${isWall ? 'wall' : ''} ${station ? 'station' : ''} ${isPlayer ? 'occupied' : ''}`}
                        style={{
                          gridColumn: x + 1,
                          gridRow: y + 1,
                          ...tileSpriteStyle(
                            sprites?.terrain,
                            128,
                            112,
                            floorCol * 16,
                            floorRow * 16,
                            16,
                            16,
                            3.3,
                          ),
                        }}
                      >
                        {/* Decorações internas nos cantos */}
                        {x === 1 && y === 1 && sprites?.props ? (
                          <span
                            className='neo-interior-prop'
                            style={tileSpriteStyle(
                              sprites.props,
                              128,
                              96,
                              96,
                              16,
                              16,
                              16,
                              2.6,
                            )}
                          />
                        ) : null}
                        {x === 8 && y === 1 && sprites?.props ? (
                          <span
                            className='neo-interior-prop'
                            style={tileSpriteStyle(
                              sprites.props,
                              128,
                              96,
                              96,
                              0,
                              16,
                              16,
                              2.6,
                            )}
                          />
                        ) : null}

                        {station ? (
                          <button
                            onClick={() =>
                              setNotice(
                                `${station}: área preparada para receber atividades e interações.`,
                              )
                            }
                          >
                            {sprites?.props ? (
                              <span
                                className='neo-station-sprite'
                                style={tileSpriteStyle(
                                  sprites.props,
                                  128,
                                  96,
                                  stationIndex === 0
                                    ? 112
                                    : stationIndex === 1
                                      ? 96
                                      : 112,
                                  stationIndex === 2 ? 16 : 0,
                                  16,
                                  16,
                                  2.2,
                                )}
                              />
                            ) : (
                              <span>{['🖥️', '📚', '🧪'][stationIndex]}</span>
                            )}
                            <b>{station}</b>
                            <small>Interagir</small>
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
                            className='neo-interior-door'
                            onClick={leaveBuilding}
                            title='Sair para a cidade'
                          >
                            🚪
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                <div className='neo-interior-help'>
                  Use WASD / setas para explorar este ambiente. Pressione E
                  perto de uma estação para interagir ou na saída para voltar.
                </div>
              </div>
              <div className='neo-world-controls'>
                <div className='neo-dpad'>
                  <button onClick={() => movePlayer(0, -1)}>▲</button>
                  <div>
                    <button onClick={() => movePlayer(-1, 0)}>◀</button>
                    <button onClick={() => movePlayer(0, 1)}>▼</button>
                    <button onClick={() => movePlayer(1, 0)}>▶</button>
                  </div>
                </div>
                <p>
                  Explore o interior e aproxime-se das estações para interagir.
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'city' && (
        <>
          <section className='neo-section-heading'>
            <div>
              <span>MAPA URBANO</span>
              <h2>Explore os distritos</h2>
              <p>
                O desenvolvimento de cada região é calculado a partir dos
                registros existentes no Meu Assistente.
              </p>
            </div>
            <div className='neo-level-chip'>
              ⚡ {xp.toLocaleString('pt-BR')} XP acumulados
            </div>
          </section>
          <section className='neo-district-grid'>
            {DISTRICTS.map((district, index) => {
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
                  style={{ '--delay': `${index * 55}ms` }}
                >
                  <div className='neo-district-top'>
                    <span className='neo-district-icon'>
                      {unlocked ? district.icon : '🔒'}
                    </span>
                    <span className='neo-status'>
                      {unlocked ? 'ACESSÍVEL' : 'EM CONSTRUÇÃO'}
                    </span>
                  </div>
                  <h3>{district.name}</h3>
                  <p>{district.desc}</p>
                  <div className='neo-district-progress'>
                    <div>
                      <span>
                        {district.metric === 'minutes'
                          ? 'Minutos estudados'
                          : district.metric === 'tasks'
                            ? 'Tarefas concluídas'
                            : district.metric === 'habits'
                              ? 'Registros de hábitos'
                              : district.metric === 'projects'
                                ? 'Projetos criados'
                                : district.metric === 'goals'
                                  ? 'Metas concluídas'
                                  : 'Experiência total'}
                      </span>
                      <b>
                        {value.toLocaleString('pt-BR')}
                        {district.metric === 'minutes' ? ' min' : ''}
                      </b>
                    </div>
                    <i>
                      <u style={{ width: `${pct}%` }} />
                    </i>
                  </div>
                  {!unlocked && (
                    <small>
                      Meta para abrir: {district.threshold}{' '}
                      {district.metric === 'minutes'
                        ? 'minutos'
                        : district.metric === 'habits'
                          ? 'registros'
                          : district.metric === 'projects' ||
                              district.metric === 'goals'
                            ? 'unidade(s)'
                            : 'pontos'}
                    </small>
                  )}
                </article>
              );
            })}
          </section>
          <section className='neo-city-bottom'>
            <div>
              <span>💬 VIDA NA CIDADE</span>
              <h2>Os moradores percebem sua evolução</h2>
              <p>
                Converse com personagens que reconhecem atividades realmente
                registradas. Eles não inventam conquistas nem cobram quando você
                tira um tempo para descansar.
              </p>
              <button onClick={() => setActiveTab('residents')}>
                Conhecer moradores →
              </button>
            </div>
            <div className='neo-resident-preview'>
              {RESIDENTS.slice(0, 4).map((resident) => (
                <button
                  key={resident.id}
                  onClick={() => {
                    setActiveTab('residents');
                    talkTo(resident);
                  }}
                >
                  {sprites?.residents ? (
                    <span
                      className='neo-resident-portrait-sm'
                      style={tileSpriteStyle(
                        sprites.residents,
                        128,
                        240,
                        (animTick % 4) * 32,
                        resident.spriteRow * 48,
                        32,
                        48,
                        1,
                      )}
                    />
                  ) : (
                    <span>{resident.avatar}</span>
                  )}
                  <b>{resident.name}</b>
                  <small>{resident.role}</small>
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      {activeTab === 'residents' && (
        <>
          <section className='neo-section-heading'>
            <div>
              <span>PERSONAGENS DA CIDADE</span>
              <h2>Gente que acompanha sua jornada</h2>
              <p>
                As conversas mudam conforme suas atividades e seu histórico de
                interação.
              </p>
            </div>
          </section>
          <section className='neo-resident-grid'>
            {RESIDENTS.map((resident) => (
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
                        1.1,
                      )}
                    />
                  ) : (
                    resident.avatar
                  )}
                </div>
                <div>
                  <span>
                    {
                      DISTRICTS.find((item) => item.id === resident.district)
                        ?.name
                    }
                  </span>
                  <h3>{resident.name}</h3>
                  <p>{resident.role}</p>
                  <small>{Number(talks[resident.id]) || 0} conversas</small>
                </div>
                <button onClick={() => talkTo(resident)}>
                  Conversar <span>↗</span>
                </button>
              </article>
            ))}
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
              <div className='neo-dialogue-avatar'>
                {sprites?.residents ? (
                  <span
                    style={tileSpriteStyle(
                      sprites.residents,
                      128,
                      240,
                      (animTick % 4) * 32,
                      selectedResident.spriteRow * 48,
                      32,
                      48,
                      1.5,
                    )}
                  />
                ) : (
                  selectedResident.avatar
                )}
              </div>
              <span>
                TRANSMISSÃO LOCAL // {selectedResident.name.toUpperCase()}
              </span>
              <h3>{selectedResident.name}</h3>
              <p>“{selectedResident.dialogue}”</p>
              <button onClick={() => setSelectedResident(null)}>
                Continuar explorando
              </button>
            </div>
          )}
        </>
      )}

      {activeTab === 'market' && (
        <>
          <section className='neo-section-heading'>
            <div>
              <span>MERCADO NEON</span>
              <h2>Personalize sua vida na cidade</h2>
              <p>
                Compre itens usando apenas as moedas conquistadas no aplicativo.
                Cada preço é fixo e aparece antes da compra.
              </p>
            </div>
            <div className='neo-level-chip'>🪙 {coins} moedas</div>
          </section>
          <section className='neo-shop-grid'>
            {STORE_ITEMS.map((item) => {
              const owned = ownedIds.has(item.id);
              return (
                <article className='neo-shop-item' key={item.id}>
                  <div className='neo-item-art'>
                    {item.icon}
                    <span>{item.type}</span>
                  </div>
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <div>
                    <b>🪙 {item.price}</b>
                    <button
                      disabled={owned || coins < item.price}
                      onClick={() => buyItem(item)}
                    >
                      {owned
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

      {activeTab === 'arcade' && (
        <>
          <section className='neo-section-heading'>
            <div>
              <span>ARCADE 88 // JOGO DE HABILIDADE</span>
              <h2>Desafio de sequência</h2>
              <p>
                Memorize a sequência de luzes e repita na ordem correta. Uma
                tentativa por dia, entrada de 5 moedas e recompensa fixa de 12
                moedas ao vencer.
              </p>
            </div>
            <div className='neo-level-chip'>🎟️ Entrada: 5 moedas</div>
          </section>
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
              <p>
                {gameState === 'preview'
                  ? 'Memorize a sequência exibida e depois comece.'
                  : gameState === 'playing'
                    ? 'Repita a sequência de quatro símbolos.'
                    : gameState === 'won'
                      ? 'Conexão estabelecida. +12 moedas adicionadas à carteira.'
                      : gameState === 'lost'
                        ? 'A sequência não correspondeu. Tente novamente amanhã.'
                        : attemptedToday
                          ? 'Você já usou sua tentativa de hoje.'
                          : 'Inicie o desafio para receber sua sequência.'}
              </p>
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
                      : coins < 5
                        ? 'Precisa de 5 moedas'
                        : 'Iniciar desafio · 5 moedas'}
                </button>
              )}
            </div>
            <aside className='neo-arcade-info'>
              <span>COMO JOGAR</span>
              <h3>Teste sua memória</h3>
              <ol>
                <li>Entre no desafio por 5 moedas.</li>
                <li>Observe os quatro símbolos que formam sua sequência.</li>
                <li>Toque nos símbolos na mesma ordem.</li>
                <li>Se acertar tudo, recebe 12 moedas.</li>
              </ol>
              <small>
                Sem apostas, sem compras com dinheiro real e sem recompensas
                aleatórias.
              </small>
            </aside>
          </section>
        </>
      )}

      {activeTab === 'inventory' && (
        <>
          <section className='neo-section-heading'>
            <div>
              <span>SEUS PERTENCES</span>
              <h2>Inventário pessoal</h2>
              <p>
                Itens que você comprou no Mercado Neon ficam guardados aqui.
              </p>
            </div>
            <div className='neo-level-chip'>🎒 {inventory.length} itens</div>
          </section>
          {inventory.length ? (
            <section className='neo-inventory-grid'>
              {STORE_ITEMS.filter((item) => ownedIds.has(item.id)).map(
                (item) => (
                  <article key={item.id}>
                    <span>{item.icon}</span>
                    <div>
                      <b>{item.name}</b>
                      <small>{item.type}</small>
                    </div>
                    <i>✓</i>
                  </article>
                ),
              )}
            </section>
          ) : (
            <div className='neo-empty-inventory'>
              <span>🎒</span>
              <h3>Sua mochila está esperando aventuras</h3>
              <p>Visite o Mercado Neon para comprar seu primeiro item.</p>
              <button onClick={() => setActiveTab('market')}>
                Explorar mercado
              </button>
            </div>
          )}
        </>
      )}

      {activeTab === 'sprites' && (
        <>
          <section className='neo-section-heading'>
            <div>
              <span>AGENT SPRITE FORGE // PNG 16-BIT</span>
              <h2>Pacote de spritesheets da cidade</h2>
              <p>
                Folhas PNG transparentes sem suavização (nearest-neighbor),
                seguindo o padrão 16×16 px base, 32×32 px jogador, 32×48 px
                moradores e múltiplos de 16 px para construções.
              </p>
            </div>
            <div className='neo-sprite-controls'>
              {[1, 2, 3].map((z) => (
                <button
                  key={z}
                  className={sheetZoom === z ? 'active' : ''}
                  onClick={() => setSheetZoom(z)}
                >
                  {z}×
                </button>
              ))}
              <button
                className={showSpriteGrid ? 'active' : ''}
                onClick={() => setShowSpriteGrid((v) => !v)}
              >
                Grade
              </button>
            </div>
          </section>

          <section className='neo-sheets-grid'>
            {spriteManifest.map((sheet) => (
              <article key={sheet.id} className='neo-sheet-card'>
                <div className='neo-sheet-head'>
                  <div>
                    <h3>{sheet.title}</h3>
                    <small>{sheet.spec}</small>
                  </div>
                  {sheet.url && (
                    <a
                      href={sheet.url}
                      download={sheet.name}
                      className='neo-download-btn'
                    >
                      ⬇ Baixar {sheet.name}
                    </a>
                  )}
                </div>
                <div className='neo-sheet-canvas-wrap'>
                  {sheet.url && (
                    <div
                      className='neo-sheet-stage'
                      style={{
                        width: sheet.w * sheetZoom,
                        height: sheet.h * sheetZoom,
                        backgroundImage: showSpriteGrid
                          ? `linear-gradient(to right, rgba(255,240,173,0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,240,173,0.18) 1px, transparent 1px)`
                          : 'none',
                        backgroundSize: `${sheet.cellW * sheetZoom}px ${sheet.cellH * sheetZoom}px`,
                      }}
                    >
                      <img
                        src={sheet.url}
                        alt={sheet.title}
                        width={sheet.w * sheetZoom}
                        height={sheet.h * sheetZoom}
                      />
                    </div>
                  )}
                </div>
              </article>
            ))}
          </section>
        </>
      )}

      <footer className='neo-footer'>
        <span>NEO-LIFE / PIXEL PACK 16-BIT</span>
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

const styles = `
.neo-city-page{
  --neo-bg:#142423;
  --neo-panel:#1f3431;
  --neo-line:rgba(216,208,162,.24);
  --neo-text:#f6f1dc;
  --neo-muted:#bdc8ae;
  display:flex;
  flex-direction:column;
  gap:22px;
  padding:4px 0 30px;
  min-width:0;
  color:var(--neo-text);
  font-family:ui-rounded,"Trebuchet MS",system-ui,sans-serif;
}
.neo-city-page *{box-sizing:border-box}
.neo-city-page button,.neo-city-page a{font-family:inherit}

/* Hero acolhedor: verde natural, madeira, azul-petróleo, lilás e dourado */
.neo-hero{
  position:relative;
  isolation:isolate;
  overflow:hidden;
  min-height:315px;
  border:3px solid #637d62;
  border-radius:10px;
  background:
    radial-gradient(ellipse at 78% 24%,rgba(245,196,81,.28),transparent 26%),
    radial-gradient(ellipse at 25% 80%,rgba(149,123,199,.18),transparent 42%),
    linear-gradient(155deg,#1b4652 0%,#295c5a 52%,#3d6e4d 100%);
  padding:30px;
  display:grid;
  grid-template-columns:1.05fr .95fr;
  align-items:center;
  gap:20px;
  box-shadow:0 6px 0 #1b302d,0 16px 36px rgba(0,0,0,.22);
}
.neo-hero-grid{
  position:absolute;inset:0;z-index:-1;opacity:.14;
  background-image:
    linear-gradient(rgba(255,240,166,.25) 1px,transparent 1px),
    linear-gradient(90deg,rgba(255,240,166,.25) 1px,transparent 1px);
  background-size:24px 24px;
  mask-image:linear-gradient(90deg,transparent,#000);
}
.neo-kicker,.neo-section-heading>div>span,.neo-city-bottom>div>span{
  font-size:10px;
  font-weight:900;
  letter-spacing:2px;
  color:#f5c451;
  text-shadow:1px 1px #1d3330;
}
.neo-hero h1{
  font-size:clamp(30px,4vw,46px);
  line-height:1.08;
  margin:12px 0;
  color:#fff8e3;
  text-shadow:3px 3px 0 #1c383a;
}
.neo-hero h1 em{
  font-style:normal;
  color:#b2de8e;
  text-shadow:3px 3px 0 #234736;
}
.neo-hero-copy>p{
  color:#eef0d8;
  max-width:560px;
  line-height:1.65;
  font-size:14px;
}
.neo-hero-actions{
  display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-top:22px;
}
.neo-hero-actions button,.neo-city-bottom button,.neo-dialogue>button:last-child,.neo-empty-inventory button{
  border:2px solid #fff0a6;
  border-radius:6px;
  background:linear-gradient(180deg,#f5c451,#cf9132);
  color:#253028;
  padding:11px 17px;
  font-weight:900;
  cursor:pointer;
  box-shadow:0 4px 0 #7d5136;
}
.neo-hero-actions button:active,.neo-city-bottom button:active{
  transform:translateY(2px);
  box-shadow:0 2px 0 #7d5136;
}
.neo-hero-actions span{font-size:11px;color:#e5ebd0}

.neo-city-skyline{
  height:205px;
  position:relative;
  align-self:stretch;
  overflow:hidden;
  border:2px solid rgba(255,240,166,.35);
  border-radius:6px;
  background:linear-gradient(180deg,rgba(22,61,74,.25),rgba(35,71,54,.65));
  image-rendering:pixelated;
}
.neo-moon{
  position:absolute;width:48px;height:48px;right:16%;top:12px;
  background:#fff0a6;border-radius:4px;
  box-shadow:0 0 0 5px rgba(245,196,81,.2),0 0 32px rgba(245,196,81,.45);
}
.neo-tower{
  position:absolute;bottom:0;
  border:3px solid #253638;border-bottom:0;
  background:
    repeating-linear-gradient(0deg,transparent 0 13px,rgba(245,196,81,.8) 14px 18px),
    repeating-linear-gradient(90deg,#236373 0 12px,#388e99 13px 20px);
}
.tower-a{height:54%;left:4%;width:22%}
.tower-b{height:82%;left:29%;width:20%;background:repeating-linear-gradient(0deg,transparent 0 13px,rgba(255,240,166,.85) 14px 18px),linear-gradient(90deg,#6b5399,#463669)}
.tower-c{height:66%;left:53%;width:18%}
.tower-d{height:44%;right:5%;width:20%;background:repeating-linear-gradient(0deg,transparent 0 13px,rgba(245,196,81,.8) 14px 18px),linear-gradient(90deg,#7d5136,#a8734d)}
.neo-road{position:absolute;bottom:0;left:0;right:0;height:8px;background:#7ec272;border-top:2px solid #b2de8e}
.skyline-label{position:absolute;top:10px;left:10px;font-size:9px;letter-spacing:1.5px;color:#f6f1dc;font-weight:800}
.skyline-label b{color:#f5c451;margin-left:6px}

.neo-wallet{
  position:absolute;right:24px;top:22px;
  background:#233b38;
  border:2px solid #a8734d;
  border-radius:6px;
  padding:10px 14px;
  display:flex;flex-direction:column;gap:2px;
  box-shadow:0 4px 0 #152624;
}
.neo-wallet span{font-size:8px;letter-spacing:1.4px;color:#c7b3eb}
.neo-wallet strong{font-size:17px;color:#f5c451}
.neo-wallet small{font-size:9px;color:#cbd6be}

/* Navegação em abas */
.neo-tabs{
  display:flex;gap:6px;overflow:auto;padding:6px;
  border:2px solid #4c6654;
  background:#1c302e;
  border-radius:8px;
  box-shadow:0 4px 0 #12201f;
}
.neo-tabs button{
  flex:0 0 auto;
  border:2px solid transparent;
  border-radius:5px;
  padding:10px 14px;
  background:transparent;
  color:#cbd5bd;
  font-size:12px;
  font-weight:800;
  cursor:pointer;
}
.neo-tabs button.active{
  background:#388e99;
  border-color:#fff0a6;
  color:#fff8e3;
  box-shadow:0 3px 0 #163d4a;
}

.neo-notice{
  padding:13px 16px;
  border:2px solid #f5c451;
  border-radius:6px;
  background:#2b473e;
  color:#fff6d6;
  font-size:13px;
  display:flex;justify-content:space-between;align-items:center;gap:10px;
}
.neo-notice button{border:0;background:none;color:inherit;font-size:20px;cursor:pointer}

.neo-section-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:18px}
.neo-section-heading h2,.neo-city-bottom h2{font-size:23px;margin:6px 0;color:#fff7df;text-shadow:2px 2px #1c3230}
.neo-section-heading p,.neo-city-bottom p{margin:0;color:#c5d1b8;font-size:12px;line-height:1.6}
.neo-level-chip{
  flex:0 0 auto;
  border:2px solid #7ec272;
  background:#24443b;
  border-radius:6px;
  padding:9px 13px;
  color:#e9f5d5;
  font-size:11px;
  font-weight:800;
  box-shadow:0 3px 0 #162b26;
}

/* =========================================================
   MAPA 16-BIT EXPLORÁVEL (Tiles 48x48 px = 3x de 16x16 px)
   ========================================================= */
.neo-world-toolbar{
  display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;
  padding:11px 15px;
  border:2px solid #7d5136;
  border-radius:6px;
  background:#27403b;
  color:#f5e9c6;
  font-size:10px;
  font-weight:800;
  letter-spacing:1px;
  box-shadow:0 4px 0 #172825;
}
.neo-world-toolbar button,.neo-interior-header button{
  border:2px solid #fff0a6;
  border-radius:5px;
  padding:7px 12px;
  background:#cf9132;
  color:#232e26;
  font-weight:900;
  cursor:pointer;
  font-size:10px;
  box-shadow:0 3px 0 #523422;
}
.neo-world-scroll{
  overflow:auto;
  padding:14px;
  border:3px solid #7d5136;
  border-radius:8px;
  background:radial-gradient(ellipse at 50% 45%,rgba(83,153,95,.22),transparent 70%),#1a2e2b;
  box-shadow:0 6px 0 #111f1d,inset 0 0 28px rgba(0,0,0,.35);
}
.neo-world-map{
  position:relative;
  display:grid;
  grid-template-columns:repeat(18,48px);
  grid-template-rows:repeat(12,48px);
  gap:0;
  width:max-content;
  margin:auto;
  border:4px solid #523422;
  border-radius:4px;
  background:#53995f;
  box-shadow:0 0 0 3px #f5c45144;
  image-rendering:pixelated;
}
.neo-world-tile{
  position:relative;
  width:48px;
  height:48px;
  overflow:visible;
  user-select:none;
}

/* Construções 96x64 px -> 144x96 px (3x2 tiles exatos) */
.neo-building-sprite-sheet{
  position:absolute;
  left:0;
  top:0;
  z-index:5;
  cursor:pointer;
  filter:drop-shadow(0 4px 0 rgba(22,36,34,.45));
  transition:filter .15s;
}
.neo-building-sprite-sheet:hover{
  filter:drop-shadow(0 4px 0 rgba(22,36,34,.45)) brightness(1.06);
}
.neo-building-tag{
  position:absolute;
  left:50%;
  top:-13px;
  transform:translateX(-50%);
  white-space:nowrap;
  padding:2px 7px;
  border-radius:4px;
  background:#233c3b;
  border:2px solid #f5c451;
  color:#fff5d6;
  font-size:9px;
  font-weight:900;
  box-shadow:0 2px 0 #152524;
  pointer-events:none;
}

/* Objetos e árvores */
.neo-prop-sprite{
  position:absolute;
  left:50%;
  bottom:2px;
  transform:translateX(-50%);
  z-index:4;
  pointer-events:none;
}
.neo-prop-sprite.tall-tree{
  bottom:2px;
  z-index:6;
  filter:drop-shadow(0 3px 0 rgba(22,42,32,.35));
}
.neo-prop-sprite.tall-prop{
  bottom:4px;
  z-index:6;
}
.neo-prop-sprite.bench{
  left:0;
  transform:none;
  bottom:4px;
  z-index:4;
}

/* Porta interativa */
.neo-door{
  position:absolute;
  inset:0;
  z-index:7;
  border:0;
  background:transparent;
  cursor:pointer;
  display:grid;
  place-items:center;
}
.neo-door-marker{
  padding:1px 5px;
  border-radius:4px;
  background:rgba(35,60,59,.88);
  border:1px solid #f5c451;
  color:#fff0a6;
  font-size:9px;
  animation:neo-float 1s steps(2) infinite alternate;
}

/* Moradores no mapa (32x48 px) */
.neo-map-resident{
  position:absolute;
  left:50%;
  bottom:2px;
  transform:translateX(-50%);
  z-index:8;
  border:0;
  padding:0;
  background:transparent;
  cursor:pointer;
  display:flex;
  flex-direction:column;
  align-items:center;
}
.neo-resident-sprite{
  display:block;
  filter:drop-shadow(0 3px 0 rgba(20,34,34,.45));
}
.neo-map-resident b{
  position:absolute;
  top:-14px;
  padding:1px 5px;
  border-radius:3px;
  background:#463669;
  border:1px solid #c7b3eb;
  color:#fff8e8;
  font-size:8px;
  white-space:nowrap;
}

/* Robô e Drone animados */
.neo-npc-bot,.neo-npc-drone{
  position:absolute;
  left:50%;
  bottom:4px;
  transform:translateX(-50%);
  z-index:7;
  pointer-events:none;
  transition:left .25s linear,top .25s linear;
}
.neo-npc-drone{
  bottom:12px;
  z-index:11;
  filter:drop-shadow(0 6px 2px rgba(20,34,34,.3));
}

/* Jogador 32x32 px */
.neo-player-sprite{
  position:absolute;
  left:50%;
  bottom:2px;
  transform:translateX(-50%);
  z-index:10;
  pointer-events:none;
  filter:drop-shadow(0 3px 0 rgba(20,34,34,.5));
}
.neo-player-sprite.interior{
  bottom:4px;
}

/* Balão de diálogo rápido no mapa */
.neo-world-bubble{
  display:grid;
  grid-template-columns:56px 1fr auto;
  align-items:center;
  gap:14px;
  padding:14px 16px;
  border:3px solid #f5c451;
  border-radius:8px;
  background:#233d3b;
  box-shadow:0 5px 0 #142423;
}
.neo-bubble-portrait{
  width:52px;height:68px;
  display:grid;place-items:center;
  border-radius:6px;
  background:#463669;
  border:2px solid #c7b3eb;
  overflow:hidden;
}
.neo-world-bubble span{
  font-size:9px;font-weight:900;letter-spacing:1.2px;color:#f5c451;
}
.neo-world-bubble p{
  margin:5px 0 0;font-size:13px;line-height:1.55;color:#f8f3de;
}
.neo-world-bubble button{
  border:0;background:none;color:#d8e2e6;font-size:22px;cursor:pointer;align-self:start;
}

/* Controles */
.neo-world-controls{
  display:flex;align-items:center;gap:16px;flex-wrap:wrap;
  padding:12px 15px;
  border:2px solid #526e58;
  border-radius:8px;
  background:#213734;
}
.neo-world-controls p{margin:0;color:#c7d3ba;font-size:11px;line-height:1.5;flex:1;min-width:220px}
.neo-dpad{display:flex;flex-direction:column;align-items:center;gap:4px;flex:0 0 auto}
.neo-dpad>div{display:flex;gap:4px}
.neo-dpad button{
  width:38px;height:32px;
  border:2px solid #fff0a6;
  border-radius:5px;
  background:#388e99;
  color:#fff8e3;
  font-size:13px;
  cursor:pointer;
  box-shadow:0 3px 0 #163d4a;
}
.neo-dpad button:active{transform:translateY(2px);box-shadow:0 1px 0 #163d4a}
.neo-interact-btn{
  border:2px solid #fff0a6;
  border-radius:6px;
  background:#6b5399;
  color:#fff8e3;
  padding:10px 14px;
  font-size:11px;
  font-weight:900;
  cursor:pointer;
  box-shadow:0 3px 0 #352752;
}

/* Lista rápida de prédios */
.neo-building-list{
  padding:16px;
  border:2px solid #526e58;
  border-radius:8px;
  background:#213734;
}
.neo-building-list h3{margin:0 0 12px;font-size:14px;color:#fff6dc}
.neo-building-list>div{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.neo-building-list button{
  display:grid;
  grid-template-columns:60px 1fr;
  align-items:center;
  text-align:left;
  gap:2px 10px;
  padding:10px;
  border:2px solid #6b856b;
  border-radius:6px;
  background:#294540;
  color:#f7f2dc;
  cursor:pointer;
  box-shadow:0 3px 0 #162926;
}
.neo-building-list button:disabled{opacity:.5;cursor:not-allowed}
.neo-building-thumb{grid-row:span 2;display:block;margin:auto}
.neo-building-list button b{font-size:11px}
.neo-building-list button small{font-size:9px;color:#c5d1b8}

/* Interiores com sprites 16-bit */
.neo-interior{
  padding:16px;
  border:3px solid #7d5136;
  border-radius:8px;
  background:linear-gradient(145deg,#213836,#283345);
}
.neo-interior-header{display:flex;justify-content:space-between;align-items:center;gap:10px;color:#f5c451;font-size:10px;font-weight:900;letter-spacing:1px}
.neo-interior-room{
  position:relative;
  min-height:410px;
  margin-top:14px;
  padding:22px;
  border:6px solid #7d5136;
  border-radius:6px;
  background:linear-gradient(180deg,#236373 0%,#163d4a 55%,#523422 55%);
  box-shadow:inset 0 0 32px rgba(0,0,0,.35);
}
.neo-interior-window{
  position:absolute;right:22px;top:18px;width:96px;height:56px;
  display:grid;place-items:center;
  border:4px solid #a8734d;border-radius:4px;
  background:linear-gradient(135deg,#6ec2c9,#f5c451);
  font-size:28px;
}
.neo-interior-sign{text-align:center;max-width:440px;margin:4px auto 18px}
.neo-interior-sign h3{margin:4px 0;font-size:21px;color:#fff7df}
.neo-interior-sign p{color:#dce3cf;font-size:11px;line-height:1.5}
.neo-interior-map{
  position:relative;
  display:grid;
  grid-template-columns:repeat(10,52px);
  grid-template-rows:repeat(6,52px);
  gap:0;
  width:max-content;
  margin:14px auto 0;
  border:5px solid #523422;
  border-radius:4px;
  background:#7d5136;
  overflow:auto;
}
.neo-interior-tile{
  display:grid;
  place-items:center;
  position:relative;
  width:52px;
  height:52px;
}
.neo-interior-tile.station button{
  display:flex;flex-direction:column;align-items:center;gap:1px;
  border:0;background:rgba(22,61,74,.82);border-radius:4px;
  color:#fff7df;cursor:pointer;padding:2px;max-width:50px;z-index:4;
}
.neo-interior-tile.station button b{font-size:7px;text-align:center;line-height:1.1}
.neo-interior-tile.station button small{font-size:6px;color:#f5c451}
.neo-interior-tile.occupied{z-index:5}
.neo-interior-door{border:0;background:none;font-size:20px;cursor:pointer}
.neo-interior-help{margin:12px auto 0;text-align:center;color:#e0e6d3;font-size:10px;line-height:1.5}

/* Distritos */
.neo-district-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.neo-district{
  --accent:#6ec2c9;
  min-height:215px;padding:18px;border-radius:8px;
  border:2px solid color-mix(in srgb,var(--accent),#2e4742 45%);
  background:linear-gradient(145deg,#25423d,#1b312f);
  animation:neo-rise .45s both;animation-delay:var(--delay);
  position:relative;overflow:hidden;
  box-shadow:0 5px 0 #132321;
}
.neo-district.violet{--accent:#c7b3eb}
.neo-district.green{--accent:#89c97b}
.neo-district.blue{--accent:#78cbd1}
.neo-district.pink{--accent:#f5c451}
.neo-district.orange{--accent:#cfa074}
.neo-district.locked{filter:saturate(.6);opacity:.76}
.neo-district-top{display:flex;align-items:center;justify-content:space-between}
.neo-district-icon{font-size:24px}
.neo-status{font-size:8px;letter-spacing:1.3px;color:var(--accent);font-weight:900}
.neo-district h3{font-size:16px;margin:14px 0 6px;color:#fff7df}
.neo-district p{min-height:38px;font-size:11px;line-height:1.55;color:#c3cfb6;margin:0 0 16px}
.neo-district-progress>div{display:flex;justify-content:space-between;gap:8px;font-size:9px;color:#c1ccb4;margin-bottom:6px}
.neo-district-progress b{color:var(--accent)}
.neo-district-progress i{height:8px;display:block;background:#142624;border:1px solid #55705c;border-radius:4px;overflow:hidden}
.neo-district-progress u{height:100%;display:block;text-decoration:none;background:var(--accent);border-radius:3px}
.neo-district>small{display:block;color:#b8c4ac;font-size:9px;margin-top:8px}

.neo-city-bottom{
  border:2px solid #5c755d;border-radius:8px;padding:22px;
  background:linear-gradient(110deg,#23423c,#2d3852);
  display:grid;grid-template-columns:.9fr 1.1fr;gap:22px;align-items:center;
  box-shadow:0 5px 0 #142423;
}
.neo-city-bottom h2{font-size:19px}
.neo-city-bottom button{margin-top:15px;font-size:11px;padding:10px 14px}
.neo-resident-preview{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.neo-resident-preview button{
  margin:0;background:#1b3230;border:2px solid #6b856b;border-radius:6px;
  padding:10px 7px;display:flex;flex-direction:column;align-items:center;gap:4px;
  color:#f7f2dc;cursor:pointer;box-shadow:0 3px 0 #122120;
}
.neo-resident-preview b{font-size:11px}
.neo-resident-preview small{font-size:8px;color:#bcc8b0;text-align:center}

/* Moradores */
.neo-resident-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.neo-resident-card{
  display:grid;grid-template-columns:64px 1fr auto;gap:13px;align-items:center;
  padding:16px;border:2px solid #5c755d;border-radius:8px;
  background:linear-gradient(130deg,#25423d,#1e3336);
  box-shadow:0 4px 0 #132321;
}
.neo-resident-avatar{
  width:58px;height:66px;display:grid;place-items:center;
  border-radius:6px;background:#3a594d;border:2px solid #a8734d;overflow:hidden;
}
.neo-resident-card>div:nth-child(2)>span{font-size:8px;letter-spacing:1px;color:#f5c451;font-weight:800}
.neo-resident-card h3{margin:4px 0;font-size:16px}
.neo-resident-card p{margin:0 0 4px;font-size:10px;color:#c5d1b8}
.neo-resident-card small{font-size:9px;color:#9fb098}
.neo-resident-card>button{
  border:2px solid #fff0a6;border-radius:6px;background:#388e99;color:#fff8e3;
  padding:9px 11px;font-size:10px;font-weight:800;cursor:pointer;box-shadow:0 3px 0 #163d4a;
}
.neo-dialogue{
  position:relative;border:3px solid #f5c451;border-radius:8px;padding:22px;
  background:linear-gradient(120deg,#23423f,#2c324d);box-shadow:0 6px 0 #142423;
}
.neo-dialogue-avatar{margin-bottom:6px}
.neo-dialogue>span{font-size:8px;letter-spacing:1.5px;color:#f5c451;font-weight:900}
.neo-dialogue h3{margin:6px 0}
.neo-dialogue p{color:#f2eed8;font-size:14px;line-height:1.7;max-width:850px}
.neo-dialogue-close{position:absolute;right:14px;top:12px;border:0;background:none;color:#d0dac4;font-size:22px;cursor:pointer}

/* Mercado */
.neo-shop-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px}
.neo-shop-item{
  padding:14px;border:2px solid #5c755d;border-radius:8px;background:#223b37;
  box-shadow:0 4px 0 #132321;
}
.neo-item-art{
  height:110px;border-radius:6px;border:2px solid #7d5136;
  background:radial-gradient(circle at 50% 55%,rgba(245,196,81,.2),transparent 60%),linear-gradient(135deg,#266373,#463669);
  display:grid;place-items:center;position:relative;font-size:44px;
}
.neo-item-art>span{position:absolute;top:8px;right:8px;font-size:8px;color:#fff5d6;background:#523422;border-radius:4px;padding:4px 8px}
.neo-shop-item h3{font-size:14px;margin:12px 0 5px}
.neo-shop-item p{height:34px;font-size:10px;color:#c2ceb6;line-height:1.5;margin:0 0 12px}
.neo-shop-item>div:last-child{display:flex;align-items:center;justify-content:space-between;gap:8px}
.neo-shop-item b{font-size:12px;color:#f5c451}
.neo-shop-item button{
  border:2px solid #fff0a6;border-radius:5px;background:#f5c451;color:#232e26;
  padding:7px 11px;font-size:10px;font-weight:900;cursor:pointer;box-shadow:0 3px 0 #7d5136;
}
.neo-shop-item button:disabled{background:#3e524a;color:#9fb09e;border-color:#566b60;box-shadow:none;cursor:not-allowed}

/* Arcade */
.neo-arcade-card{display:grid;grid-template-columns:1.2fr .8fr;gap:15px}
.neo-arcade-screen{
  padding:20px;border:3px solid #6b5399;border-radius:8px;
  background:radial-gradient(ellipse at 50% 20%,rgba(56,142,153,.24),transparent 60%),#1b2e33;
  box-shadow:0 5px 0 #122024;
}
.neo-arcade-top{display:flex;justify-content:space-between;gap:8px;font-size:9px;letter-spacing:1px;color:#78cbd1;font-weight:800}
.neo-arcade-top b{color:#f5c451}
.neo-sequence-preview{display:flex;justify-content:center;gap:12px;min-height:25px;margin:15px auto -12px}
.neo-sequence-preview span{font-size:20px;color:#fff0a6}
.neo-pad-grid{display:grid;grid-template-columns:repeat(2,92px);justify-content:center;gap:10px;margin:24px auto 17px}
.neo-pad{height:82px;border:3px solid #1c262b;border-radius:8px;font-size:30px;color:#1c262b;cursor:pointer;box-shadow:0 4px 0 #142024}
.neo-pad:disabled{cursor:default;opacity:.72}
.neo-pad:not(:disabled):active{transform:translateY(2px);box-shadow:0 2px 0 #142024}
.pad-0{background:#6ec2c9}
.pad-1{background:#957bc7}
.pad-2{background:#7ec272}
.pad-3{background:#f5c451}
.neo-pad.selected{filter:brightness(1.2);box-shadow:0 0 0 3px #fff0a6}
.neo-arcade-screen>p{text-align:center;color:#cfd9c4;font-size:11px;min-height:18px}
.neo-game-start{
  display:block;margin:15px auto 0;border:2px solid #fff0a6;border-radius:6px;padding:10px 16px;
  background:#f5c451;color:#232e26;font-size:11px;font-weight:900;cursor:pointer;box-shadow:0 3px 0 #7d5136;
}
.neo-game-start:disabled{opacity:.55;cursor:not-allowed}
.neo-arcade-info{padding:22px;border:2px solid #5c755d;border-radius:8px;background:#223b37}
.neo-arcade-info>span{font-size:9px;letter-spacing:1.5px;color:#f5c451;font-weight:800}
.neo-arcade-info h3{font-size:18px}
.neo-arcade-info ol{padding-left:18px;color:#c7d3ba;font-size:11px;line-height:2}
.neo-arcade-info small{display:block;border-top:1px solid var(--neo-line);padding-top:12px;color:#a5b59b;font-size:9px;line-height:1.5}

/* Inventário */
.neo-inventory-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.neo-inventory-grid article{display:flex;align-items:center;gap:12px;padding:14px;border:2px solid #5c755d;border-radius:8px;background:#223b37}
.neo-inventory-grid article>span{font-size:28px}
.neo-inventory-grid article>div{display:flex;flex-direction:column;gap:3px;flex:1}
.neo-inventory-grid b{font-size:12px}
.neo-inventory-grid small{font-size:9px;color:#bcc8b0}
.neo-inventory-grid i{font-style:normal;color:#7ec272;font-weight:900}
.neo-empty-inventory{text-align:center;padding:42px 15px;border:2px dashed #7d5136;border-radius:8px;background:#1e3431}
.neo-empty-inventory>span{font-size:42px}
.neo-empty-inventory h3{margin:10px 0 5px}
.neo-empty-inventory p{color:#bcc8b0;font-size:11px}

/* Visualizador & Download de Spritesheets */
.neo-sprite-controls{display:flex;gap:6px;flex-wrap:wrap}
.neo-sprite-controls button{
  border:2px solid #6b856b;border-radius:5px;padding:7px 11px;
  background:#223b37;color:#e6edd8;font-size:11px;font-weight:800;cursor:pointer;
}
.neo-sprite-controls button.active{
  background:#388e99;border-color:#fff0a6;color:#fff8e3;
}
.neo-sheets-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.neo-sheet-card{
  border:2px solid #6b856b;border-radius:8px;padding:16px;background:#203633;
  display:flex;flex-direction:column;gap:12px;box-shadow:0 4px 0 #132220;
}
.neo-sheet-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap}
.neo-sheet-head h3{margin:0 0 4px;font-size:14px;color:#fff7df}
.neo-sheet-head small{font-size:10px;color:#bcc8b0}
.neo-download-btn{
  text-decoration:none;border:2px solid #fff0a6;border-radius:5px;
  background:#f5c451;color:#232e26;padding:6px 10px;font-size:10px;font-weight:900;
  box-shadow:0 3px 0 #7d5136;
}
.neo-sheet-canvas-wrap{
  overflow:auto;padding:14px;border-radius:6px;border:2px solid #523422;
  background-color:#182927;
  background-image:
    linear-gradient(45deg,#1f3330 25%,transparent 25%),
    linear-gradient(-45deg,#1f3330 25%,transparent 25%),
    linear-gradient(45deg,transparent 75%,#1f3330 75%),
    linear-gradient(-45deg,transparent 75%,#1f3330 75%);
  background-size:16px 16px;
  background-position:0 0,0 8px,8px -8px,-8px 0;
}
.neo-sheet-stage{position:relative}
.neo-sheet-stage img{display:block;image-rendering:pixelated}

.neo-footer{display:flex;justify-content:space-between;align-items:center;gap:10px;border-top:2px solid #445e4c;padding-top:15px;color:#a5b59b}
.neo-footer span{font-size:8px;letter-spacing:1.4px;font-weight:800}
.neo-footer p{font-size:9px;margin:0;text-align:center}

@keyframes neo-float{from{transform:translateY(0)}to{transform:translateY(-2px)}}
@keyframes neo-rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

@media(max-width:900px){
  .neo-hero{grid-template-columns:1fr;padding:24px}
  .neo-city-skyline{height:150px}
  .neo-wallet{top:auto;bottom:18px;right:18px}
  .neo-district-grid,.neo-shop-grid,.neo-sheets-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .neo-city-bottom,.neo-arcade-card{grid-template-columns:1fr}
}
@media(max-width:650px){
  .neo-district-grid,.neo-resident-grid,.neo-shop-grid,.neo-inventory-grid,.neo-sheets-grid{grid-template-columns:1fr}
  .neo-building-list>div{grid-template-columns:1fr 1fr}
  .neo-world-bubble{grid-template-columns:1fr;text-align:center}
  .neo-bubble-portrait{margin:auto}
}
`;
