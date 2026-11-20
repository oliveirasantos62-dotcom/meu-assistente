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
    metric: 'studyMinutes',
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

// Grade oficial dos sprites: todos os quadros são alinhados à mesma origem.
const SPRITE_SHEET_LAYOUT = Object.freeze({
  player: Object.freeze({
    frameWidth: 32,
    frameHeight: 32,
    columns: 4,
    rows: 4,
    width: 128,
    height: 128,
  }),
  residents: Object.freeze({
    frameWidth: 32,
    frameHeight: 48,
    columns: 4,
    rows: 5,
    width: 128,
    height: 240,
  }),
  directions: Object.freeze({ down: 0, up: 1, left: 2, right: 3 }),
});

const RESIDENTS = [
  {
    id: 'luna',
    name: 'Luna',
    role: 'Estudante de cibernética',
    avatar: '👩🏻‍🎓',
    district: 'academy',
    workBuilding: 'university',
    focus: 'study',
    spriteRow: 0,
    schedule: {
      morning: {
        x: 9,
        y: 3,
        label: 'Entrada da Universidade',
        activity: 'working',
      },
      afternoon: { x: 11, y: 4, label: 'Pátio Acadêmico', activity: 'working' },
      sunset: { x: 9, y: 5, label: 'Praça Central', activity: 'chatting' },
      night: { x: 8, y: 5, label: 'Banco da Praça', activity: 'resting' },
    },
    roamPoints: [
      { x: 9, y: 3 },
      { x: 11, y: 4 },
      { x: 9, y: 5 },
      { x: 8, y: 5 },
      { x: 12, y: 5 },
    ],
    relations: [
      { targetId: 'iris', label: 'Parceiras de Pesquisa', bond: 88 },
      { targetId: 'nox', label: 'Estudo Bio-Luminescente', bond: 74 },
    ],
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
    workBuilding: 'innovation-lab',
    focus: 'tasks',
    spriteRow: 1,
    schedule: {
      morning: { x: 4, y: 10, label: 'Oficina Sul', activity: 'working' },
      afternoon: {
        x: 6,
        y: 8,
        label: 'Corredor de Inovação',
        activity: 'working',
      },
      sunset: { x: 7, y: 5, label: 'Avenida Central', activity: 'strolling' },
      night: { x: 5, y: 8, label: 'Poste de Calibração', activity: 'resting' },
    },
    roamPoints: [
      { x: 4, y: 10 },
      { x: 6, y: 8 },
      { x: 7, y: 5 },
      { x: 5, y: 8 },
      { x: 8, y: 8 },
    ],
    relations: [
      { targetId: 'maya', label: 'Logística & Protótipos', bond: 82 },
      { targetId: 'luna', label: 'Rede Energética', bond: 76 },
    ],
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
    workBuilding: 'neon-market',
    focus: 'coins',
    spriteRow: 2,
    schedule: {
      morning: { x: 15, y: 9, label: 'Banca do Mercado', activity: 'working' },
      afternoon: { x: 14, y: 9, label: 'Mercado Neon', activity: 'working' },
      sunset: {
        x: 15,
        y: 8,
        label: 'Alameda das Lanternas',
        activity: 'chatting',
      },
      night: { x: 13, y: 8, label: 'Calçadão Noturno', activity: 'strolling' },
    },
    roamPoints: [
      { x: 15, y: 9 },
      { x: 14, y: 9 },
      { x: 15, y: 8 },
      { x: 13, y: 8 },
      { x: 12, y: 8 },
    ],
    relations: [
      { targetId: 'nox', label: 'Parceria Orgânica', bond: 85 },
      { targetId: 'kai', label: 'Restauração de Módulos', bond: 82 },
    ],
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
    role: 'Treinador de rotina & botânico',
    avatar: '🧑🏻‍🚀',
    district: 'green',
    workBuilding: 'greenhouse',
    focus: 'habits',
    spriteRow: 3,
    schedule: {
      morning: {
        x: 16,
        y: 5,
        label: 'Trilha dos Jardins',
        activity: 'working',
      },
      afternoon: {
        x: 15,
        y: 5,
        label: 'Horta Comunitária',
        activity: 'working',
      },
      sunset: { x: 17, y: 5, label: 'Mirante Verde', activity: 'resting' },
      night: { x: 15, y: 6, label: 'Ronda Botânica', activity: 'strolling' },
    },
    roamPoints: [
      { x: 16, y: 5 },
      { x: 15, y: 5 },
      { x: 17, y: 5 },
      { x: 15, y: 6 },
      { x: 13, y: 5 },
    ],
    relations: [
      { targetId: 'maya', label: 'Colheitas & Feira', bond: 85 },
      { targetId: 'luna', label: 'Flora Sensorial', bond: 74 },
    ],
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
    workBuilding: 'university',
    focus: 'reading',
    spriteRow: 4,
    schedule: {
      morning: { x: 7, y: 3, label: 'Alameda Oeste', activity: 'strolling' },
      afternoon: {
        x: 10,
        y: 3,
        label: 'Jardim de Leitura',
        activity: 'working',
      },
      sunset: { x: 9, y: 5, label: 'Praça do Núcleo', activity: 'chatting' },
      night: { x: 11, y: 3, label: 'Arquivo Silencioso', activity: 'working' },
    },
    roamPoints: [
      { x: 7, y: 3 },
      { x: 10, y: 3 },
      { x: 9, y: 5 },
      { x: 11, y: 3 },
      { x: 8, y: 4 },
    ],
    relations: [
      { targetId: 'luna', label: 'Arquivo & Pesquisa', bond: 88 },
      { targetId: 'kai', label: 'Catalogação Digital', bond: 70 },
    ],
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

// Cidadãos autônomos que caminham livremente pelas calçadas, passeiam, trabalham e descansam
const INITIAL_CITIZENS = [
  {
    id: 'cit-alex',
    name: 'Alex',
    role: 'Entregador Eco',
    color: '#6ec2c9',
    hat: '#f5c451',
    x: 4,
    y: 5,
    activity: 'strolling',
    waypoints: [
      { x: 4, y: 5 },
      { x: 10, y: 5 },
      { x: 15, y: 5 },
      { x: 15, y: 8 },
      { x: 6, y: 8 },
    ],
    wpIndex: 1,
    quote: 'As calçadas arborizadas deixam qualquer entrega mais leve!',
  },
  {
    id: 'cit-sora',
    name: 'Sora',
    role: 'Artista Urbana',
    color: '#c7b3eb',
    hat: '#6b5399',
    x: 12,
    y: 5,
    activity: 'strolling',
    waypoints: [
      { x: 12, y: 5 },
      { x: 8, y: 5 },
      { x: 8, y: 8 },
      { x: 12, y: 8 },
    ],
    wpIndex: 1,
    quote: 'Estou desenhando o pôr do sol refletido nos canais do Vale Neo.',
  },
  {
    id: 'cit-teo',
    name: 'Téo',
    role: 'Técnico Solar',
    color: '#7ec272',
    hat: '#236373',
    x: 5,
    y: 8,
    activity: 'working',
    waypoints: [
      { x: 5, y: 8 },
      { x: 5, y: 5 },
      { x: 8, y: 5 },
      { x: 8, y: 10 },
    ],
    wpIndex: 1,
    quote: 'Os painéis solares da cidade carregam com cada meta concluída!',
  },
  {
    id: 'cit-bia',
    name: 'Bia',
    role: 'Pesquisadora Júnior',
    color: '#f5c451',
    hat: '#388e99',
    x: 11,
    y: 3,
    activity: 'resting',
    waypoints: [
      { x: 11, y: 3 },
      { x: 9, y: 5 },
      { x: 6, y: 5 },
      { x: 6, y: 3 },
    ],
    wpIndex: 1,
    quote: 'Pausa rápida na calçada antes de voltar para a biblioteca.',
  },
];

const ACTIVITY_META = {
  working: { icon: '💼', label: 'Trabalhando', color: '#7ec272' },
  chatting: { icon: '💬', label: 'Conversando', color: '#f5c451' },
  strolling: { icon: '🚶', label: 'Passeando', color: '#6ec2c9' },
  resting: { icon: '☕', label: 'Descansando', color: '#c7b3eb' },
};

const WORLD_BUILDINGS = [
  {
    id: 'player-home',
    name: 'Minha Casa',
    district: 'central',
    icon: '🏡',
    x: 1,
    y: 1,
    w: 3,
    h: 2,
    door: { x: 2, y: 3 },
    spriteCol: 0,
    spriteRow: 2,
    openHour: 0,
    closeHour: 24,
    isHome: true,
    description: 'Seu refúgio pessoal no Vale Neo com cômodos decoráveis.',
    rooms: ['Sala de Estar', 'Estúdio & Quarto', 'Varanda Botânica'],
  },
  {
    id: 'central-hub',
    name: 'Núcleo Central',
    district: 'central',
    icon: '🏢',
    x: 8,
    y: 4,
    w: 3,
    h: 2,
    door: { x: 9, y: 6 },
    spriteCol: 0,
    spriteRow: 0,
    openHour: 0,
    closeHour: 24,
    description:
      'Central cívica 24h, painel de tarefas reais e ponto de encontro.',
    rooms: ['Painel de tarefas', 'Central de missões', 'Terminal cívico'],
  },
  {
    id: 'university',
    name: 'Universidade Neon',
    district: 'academy',
    icon: '🎓',
    x: 8,
    y: 0,
    w: 3,
    h: 2,
    door: { x: 9, y: 2 },
    spriteCol: 1,
    spriteRow: 0,
    openHour: 7,
    closeHour: 22,
    description: 'Salas de estudo, biblioteca e laboratório de foco (07h–22h).',
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
    y: 3,
    w: 3,
    h: 2,
    door: { x: 16, y: 5 },
    spriteCol: 2,
    spriteRow: 0,
    openHour: 6,
    closeHour: 19,
    description: 'Um refúgio verde alimentado por seus hábitos (06h–19h).',
    rooms: ['Jardim de hábitos', 'Laboratório botânico', 'Banco de sementes'],
  },
  {
    id: 'innovation-lab',
    name: 'Laboratório de Inovação',
    district: 'innovation',
    icon: '🧬',
    x: 3,
    y: 8,
    w: 3,
    h: 2,
    door: { x: 4, y: 10 },
    spriteCol: 0,
    spriteRow: 1,
    openHour: 8,
    closeHour: 21,
    description: 'Oficinas, protótipos e incubadoras de projetos (08h–21h).',
    rooms: ['Oficina de protótipos', 'Sala de projetos', 'Núcleo de robótica'],
  },
  {
    id: 'neon-market',
    name: 'Mercado Neon',
    district: 'commerce',
    icon: '🛍️',
    x: 14,
    y: 7,
    w: 3,
    h: 2,
    door: { x: 15, y: 9 },
    spriteCol: 1,
    spriteRow: 1,
    openHour: 9,
    closeHour: 21,
    description: 'Lojas, móveis para sua casa e equipamentos (09h–21h).',
    rooms: ['Loja de móveis', 'Ateliê de roupas', 'Balcão de trocas'],
  },
  {
    id: 'arcade-88',
    name: 'Arcade 88',
    district: 'arcade',
    icon: '🕹️',
    x: 13,
    y: 0,
    w: 3,
    h: 2,
    door: { x: 14, y: 2 },
    spriteCol: 2,
    spriteRow: 1,
    openHour: 12,
    closeHour: 24,
    description:
      'Salão de jogos, corrida hoverboard e desafios lógicos (12h–00h).',
    rooms: ['Arena de memória', 'Pista Hoverboard', 'Circuito lógico'],
  },
];

// Estações de transporte público (VLT / Expresso Urbano)
const TRANSIT_STOPS = [
  { id: 'stop-west', x: 3, y: 6, name: 'Estação Oeste' },
  { id: 'stop-central', x: 9, y: 6, name: 'Estação Central' },
  { id: 'stop-market', x: 15, y: 6, name: 'Estação Mercado' },
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
    months: [8, 9, 10],
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
    months: [11, 0, 1],
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
    months: [2, 3, 4],
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
    months: [5, 6, 7],
    name: 'Noite das Estrelas Acadêmicas',
    icon: '✨',
    bannerColor: 'L3',
    desc: 'Luna e Íris abrem o observatório para sessões coletivas de leitura e estudo.',
    bonusText: '+10 XP bônus por sessão de foco registrada.',
    giftItem: 'study-desk',
  },
];

const CITY_EVENTS = [
  {
    id: 'lantern-parade',
    name: 'Desfile das Lanternas Flutuantes',
    icon: '🏮',
    effect: 'Mercado Neon aberto até 23h · +20% moedas',
    extendedMarket: true,
  },
  {
    id: 'tech-expo',
    name: 'Mostra de Drones & Mobilidade',
    icon: '🛸',
    effect: 'Drones extra no céu · VLT expresso gratuito',
    extendedMarket: false,
  },
  {
    id: 'botanical-bloom',
    name: 'Florada Bio-Luminescente',
    icon: '🌸',
    effect: 'Pétalas douradas pelas ruas · Canteiros energizados',
    extendedMarket: false,
  },
  {
    id: 'night-bazaar',
    name: 'Bazar Noturno da Comunidade',
    icon: '🎪',
    effect: 'Comércio estendido até 23h · Moradores na praça',
    extendedMarket: true,
  },
];

const WEATHER_TYPES = [
  {
    id: 'clear',
    label: 'Céu Limpo',
    icon: '☀️',
    desc: 'Visibilidade total e energia solar plena nos distritos.',
  },
  {
    id: 'breeze',
    label: 'Brisa Urbana',
    icon: '🍃',
    desc: 'Folhas e partículas douradas flutuam pelas alamedas.',
  },
  {
    id: 'rain',
    label: 'Chuva Neon',
    icon: '🌧️',
    desc: 'Rega automaticamente todos os canteiros plantados na cidade!',
  },
  {
    id: 'mist',
    label: 'Neblina BioTech',
    icon: '🌫️',
    desc: 'Névoa suave azul-petróleo envolve os parques e o lago.',
  },
  {
    id: 'storm',
    label: 'Tempestade Elétrica',
    icon: '⛈️',
    desc: 'Sobrecarga limpa na rede: +15% XP em sessões e desafios!',
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

function generatePlayerSheet(appearance = {}) {
  const g = createPixelCanvas(
    SPRITE_SHEET_LAYOUT.player.width,
    SPRITE_SHEET_LAYOUT.player.height,
  );
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

function generateResidentsSheet() {
  const g = createPixelCanvas(
    SPRITE_SHEET_LAYOUT.residents.width,
    SPRITE_SHEET_LAYOUT.residents.height,
  );
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

function generateTerrainSheet() {
  const g = createPixelCanvas(128, 112);

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

  for (let f = 0; f < 6; f++) {
    const wx = f * 16;
    g.rect(wx, 32, 16, 16, 'T2');
    g.rect(wx, 32, 16, 3, 'T1');
    const shift = (f * 3) % 14;
    g.rect(wx + ((2 + shift) % 11), 36, 5, 1, 'T4');
    g.rect(wx + ((7 + shift) % 10), 40, 6, 1, 'T5');
    g.rect(wx + ((4 + shift) % 11), 44, 4, 1, 'T4');
  }

  g.rect(97, 34, 2, 13, 'W3');
  g.rect(109, 34, 2, 13, 'W3');
  g.rect(96, 37, 16, 2, 'W4');
  g.rect(96, 43, 16, 2, 'W4');
  g.rect(99, 33, 10, 3, 'Y3');

  g.box(113, 33, 14, 14, 'W2', 'W1');
  g.rect(115, 35, 10, 2, 'W1');
  g.rect(115, 39, 10, 2, 'W1');
  g.rect(115, 43, 10, 2, 'W1');

  for (let stage = 0; stage < 4; stage++) {
    const sx = stage * 16;
    g.box(sx + 1, 49, 14, 14, 'W2', 'W1');
    if (stage === 0) {
      [4, 8, 11].forEach((pxX) => {
        g.rect(sx + pxX, 53, 2, 2, 'Y3');
        g.rect(sx + pxX, 58, 2, 2, 'Y3');
      });
    } else if (stage === 1) {
      [4, 8, 11].forEach((pxX) => {
        g.rect(sx + pxX, 52, 2, 3, 'G4');
        g.rect(sx + pxX, 57, 2, 3, 'G4');
      });
    } else if (stage === 2) {
      [3, 7, 10].forEach((pxX) => {
        g.rect(sx + pxX, 51, 3, 4, 'G3');
        g.px(sx + pxX + 1, 51, 'G5');
        g.rect(sx + pxX, 56, 3, 4, 'G3');
      });
    } else {
      [3, 7, 10].forEach((pxX) => {
        g.rect(sx + pxX, 50, 3, 5, 'G4');
        g.rect(sx + pxX, 50, 2, 2, 'Y3');
        g.rect(sx + pxX, 56, 3, 5, 'G4');
        g.rect(sx + pxX + 1, 56, 2, 2, 'L4');
      });
    }
  }

  g.box(65, 51, 14, 11, 'W3');
  g.rect(67, 54, 10, 6, 'L3');
  g.rect(67, 54, 10, 2, 'L4');

  g.box(81, 49, 14, 14, 'W2');
  g.rect(82, 50, 12, 4, 'C2');
  g.rect(82, 54, 12, 8, 'L2');
  g.rect(82, 54, 12, 2, 'Y3');

  g.box(97, 53, 14, 9, 'W3');
  g.box(100, 49, 8, 5, 'T2');
  g.rect(101, 50, 6, 3, 'T4');
  g.px(103, 51, 'Y4');

  g.box(116, 56, 8, 6, 'W3');
  g.rect(117, 51, 6, 5, 'G4');
  g.rect(118, 49, 4, 3, 'Y3');
  g.px(119, 50, 'Y4');

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

  {
    const ox = 0;
    const oy = 128;
    drawBaseStructure(ox, oy, 'W4', 'W2', 'G2', 'G3');
    g.box(ox + 68, oy + 2, 10, 14, 'R2');
    g.rect(ox + 67, oy + 2, 12, 3, 'R3');
    [18, 62].forEach((wx) => {
      g.box(ox + wx, oy + 30, 12, 12, 'Y3');
      g.rect(ox + wx + 1, oy + 31, 10, 5, 'Y4');
      g.box(ox + wx - 1, oy + 41, 14, 4, 'W2');
      g.rect(ox + wx + 1, oy + 39, 10, 2, 'G4');
      g.px(ox + wx + 3, oy + 39, 'L4');
      g.px(ox + wx + 8, oy + 39, 'Y3');
    });
    g.box(ox + 41, oy + 35, 14, 19, 'W1');
    g.rect(ox + 43, oy + 37, 10, 16, 'W3');
    g.px(ox + 50, oy + 45, 'Y4');
  }

  return g.canvas.toDataURL('image/png');
}

function generatePropsSheet() {
  const g = createPixelCanvas(128, 96);

  g.rect(3, 13, 26, 2, 'rgba(20, 32, 34, 0.3)');
  g.box(3, 4, 26, 5, 'W3');
  g.rect(4, 5, 24, 1, 'W4');
  g.box(2, 9, 28, 4, 'W2');
  g.rect(5, 13, 2, 3, 'W1');
  g.rect(25, 13, 2, 3, 'W1');

  for (let f = 0; f < 2; f++) {
    const ox = 32 + f * 16;
    g.rect(ox + 6, 29, 4, 2, 'rgba(20, 32, 34, 0.35)');
    g.rect(ox + 7, 11, 2, 19, 'W1');
    g.rect(ox + 6, 27, 4, 3, 'R2');
    g.box(ox + 5, 4, 6, 7, 'Y2');
    g.rect(ox + 6, 5, 4, 5, f === 0 ? 'Y3' : 'Y4');
    g.rect(ox + 4, 3, 8, 2, 'T2');
  }

  for (let f = 0; f < 2; f++) {
    const ox = 64 + f * 16;
    g.box(ox + 5, 24, 6, 6, 'W2');
    g.rect(ox + 7, 19, 2, 5, 'R2');
    g.box(ox + 2, 5, 12, 14, 'T2');
    g.rect(ox + 3, 6, 10, 12, f === 0 ? 'T3' : 'L3');
    g.rect(ox + 4, 8, 8, 2, 'Y4');
    g.rect(ox + 4, 12, 5, 2, 'L4');
  }

  g.box(100, 9, 8, 6, 'W3');
  g.rect(101, 5, 6, 5, 'G3');
  g.rect(102, 3, 4, 3, 'G4');
  g.px(103, 4, 'Y3');

  g.box(114, 9, 12, 6, 'W2');
  g.box(115, 2, 10, 8, 'R2');
  g.rect(116, 3, 8, 6, 'T3');
  g.rect(117, 4, 5, 2, 'Y4');

  g.box(97, 17, 14, 14, 'W2');
  g.rect(98, 18, 12, 5, 'W1');
  g.rect(98, 25, 12, 5, 'W1');
  g.rect(99, 19, 2, 4, 'T3');
  g.rect(102, 19, 2, 4, 'Y3');
  g.rect(105, 19, 2, 4, 'L3');
  g.rect(100, 26, 2, 4, 'G3');

  g.box(113, 22, 14, 8, 'W3');
  g.box(117, 18, 6, 4, 'L2');
  g.px(119, 19, 'Y4');

  for (let f = 0; f < 4; f++) {
    const ox = f * 16;
    const hover = f === 1 || f === 2 ? -1 : 0;
    g.rect(ox + (f % 2 === 0 ? 2 : 4), 35 + hover, 4, 1, 'T5');
    g.rect(ox + (f % 2 === 0 ? 10 : 8), 35 + hover, 4, 1, 'T5');
    g.box(ox + 4, 36 + hover, 8, 6, 'C1');
    g.rect(ox + 5, 38 + hover, 6, 2, 'T3');
    g.px(ox + 7, 38 + hover, 'Y4');
  }

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
   HELPERS DE TEMPO, HORÁRIO, CLIMA, ESTAÇÕES E ESTADO
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

function formatClock(totalMinutes) {
  const normalized = ((Math.floor(totalMinutes) % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
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

function getRelationshipTier(aff) {
  if (aff >= 80) return 'Confidente do Vale';
  if (aff >= 55) return 'Amigo Próximo';
  if (aff >= 30) return 'Aliado';
  if (aff >= 12) return 'Colega';
  return 'Conhecido';
}

function cityWorldStart(data) {
  const saved = data?.neoCity?.world?.player;
  return saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)
    ? { x: saved.x, y: saved.y }
    : { x: 8, y: 6 };
}

/* ============================================================================
   COMPONENTE PRINCIPAL — NEO-LIFE CITY (VIDA URBANA COMPLETA)
   ============================================================================ */
export default function NeoLifeCity({ data = {}, save, onNavigate }) {
  const [activeTab, setActiveTab] = useState('explore');
  const [selectedResident, setSelectedResident] = useState(null);
  const [dialogueStep, setDialogueStep] = useState('root');
  const [worldBubble, setWorldBubble] = useState(null);
  const [citizenBubble, setCitizenBubble] = useState(null);
  const [notice, setNotice] = useState('');

  // Sincronização automática local
  const [lifeSync, setLifeSync] = useState(() => {
    try {
      const saved = window.localStorage.getItem('neolifecity_life_sync_v1');
      return saved
        ? JSON.parse(saved)
        : { snapshot: null, affinity: {}, lastReaction: '' };
    } catch {
      return { snapshot: null, affinity: {}, lastReaction: '' };
    }
  });

  // Posição e navegação no mundo & casa
  const [player, setPlayer] = useState(() => cityWorldStart(data));
  const [insideBuilding, setInsideBuilding] = useState(null);
  const [homeRoomIndex, setHomeRoomIndex] = useState(0);
  const [decorateMode, setDecorateMode] = useState(false);
  const [selectedFurnItem, setSelectedFurnItem] = useState(null);
  const [furnFlipped, setFurnFlipped] = useState(false);
  const [interiorPlayer, setInteriorPlayer] = useState({ x: 5, y: 4 });
  const [lastDirection, setLastDirection] = useState('down');

  // 1. CICLO DE DIA E NOITE (relógio simulado + auto/manual)
  const [timeMode, setTimeMode] = useState('cycle'); // 'cycle' | 'realtime' | 'manual'
  const [simMinutes, setSimMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  const currentHour = useMemo(() => {
    if (timeMode === 'realtime') return new Date().getHours();
    return Math.floor((((simMinutes % 1440) + 1440) % 1440) / 60);
  }, [timeMode, simMinutes]);

  const currentPeriod = useMemo(
    () => getPeriodFromHour(currentHour),
    [currentHour],
  );

  // 2. CLIMA DINÂMICO
  const [weatherMode, setWeatherMode] = useState('auto'); // 'auto' | 'manual'
  const [weatherId, setWeatherId] = useState('clear');
  const [lightningFlash, setLightningFlash] = useState(false);

  // 3. EVENTOS URBANOS & FESTIVAIS
  const [cityEventIndex, setCityEventIndex] = useState(0);
  const activeCityEvent = CITY_EVENTS[cityEventIndex % CITY_EVENTS.length];

  // 4. NPCs ANDANDO LIVREMENTE PELAS RUAS E CALÇADAS + ATIVIDADES
  const [npcState, setNpcState] = useState(() => {
    const init = {};
    RESIDENTS.forEach((r) => {
      const start = r.schedule[getPeriodFromHour(new Date().getHours())];
      init[r.id] = {
        x: start.x,
        y: start.y,
        activity: start.activity || 'strolling',
        waypointIdx: 0,
        chatPartner: null,
      };
    });
    return init;
  });

  const [citizens, setCitizens] = useState(INITIAL_CITIZENS);

  // 5. VEÍCULOS: CARROS, BICICLETAS, DRONES E TRANSPORTE PÚBLICO (VLT)
  const [vehicles, setVehicles] = useState([
    {
      id: 'car-1',
      type: 'car',
      lane: 'east',
      pos: 8,
      speed: 1.4,
      color: '#6ec2c9',
    },
    {
      id: 'car-2',
      type: 'car',
      lane: 'west',
      pos: 88,
      speed: 1.2,
      color: '#f5c451',
    },
    {
      id: 'car-3',
      type: 'car',
      lane: 'east',
      pos: 54,
      speed: 1.5,
      color: '#c7b3eb',
    },
    {
      id: 'bike-1',
      type: 'bike',
      lane: 'bike-east',
      pos: 20,
      speed: 0.75,
      color: '#7ec272',
    },
    {
      id: 'bike-2',
      type: 'bike',
      lane: 'bike-west',
      pos: 72,
      speed: 0.7,
      color: '#f5c451',
    },
    { id: 'drone-1', type: 'drone', route: 0, phase: 0 },
    { id: 'drone-2', type: 'drone', route: 1, phase: 45 },
  ]);

  const [transitState, setTransitState] = useState({
    x: 3,
    dir: 1,
    dwellTicks: 0,
    atStop: 'Estação Oeste',
  });

  // Jardim — semente selecionada
  const [selectedSeedId, setSelectedSeedId] = useState('mint-lumen');

  // Inventário — filtro de categoria
  const [invCategory, setInvCategory] = useState('Todos');

  // Minijogos
  const [minigameMode, setMinigameMode] = useState('memory');
  const [sequence, setSequence] = useState([]);
  const [playerSequence, setPlayerSequence] = useState([]);
  const [gameState, setGameState] = useState('idle');
  const [gameSeed, setGameSeed] = useState(0);
  const [fishPhase, setFishPhase] = useState('idle');
  const [fishBarPos, setFishBarPos] = useState(50);
  const [fishDir, setFishDir] = useState(1);
  const [lastCaughtFish, setLastCaughtFish] = useState(null);
  const [raceActive, setRaceActive] = useState(false);
  const [raceLane, setRaceLane] = useState(1);
  const [raceScore, setRaceScore] = useState(0);
  const [raceObstacles, setRaceObstacles] = useState([]);
  const [circuitGrid, setCircuitGrid] = useState([1, 0, 2, 1, 2, 0, 2, 1, 0]);

  const [quickInput, setQuickInput] = useState('');
  const [animTick, setAnimTick] = useState(0);
  const [walkFrame, setWalkFrame] = useState(0);
  const [isWalking, setIsWalking] = useState(false);
  const walkTimeoutRef = useRef(null);

  // Estado persistente de neoCity
  const city =
    data.neoCity && typeof data.neoCity === 'object' ? data.neoCity : {};
  const inventory = safeArray(city.inventory);
  const talks = city.talks && typeof city.talks === 'object' ? city.talks : {};
  const storedAffinity =
    city.affinity && typeof city.affinity === 'object' ? city.affinity : {};
  const affinity = { ...storedAffinity, ...(lifeSync.affinity || {}) };
  const npcMemories =
    city.npcMemories && typeof city.npcMemories === 'object'
      ? city.npcMemories
      : {};
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
      projectProgress: projects.reduce(
        (sum, project) =>
          sum +
          (project.status === 'completed'
            ? 100
            : Math.max(0, Number(project.progress) || 0)),
        0,
      ),
      coins,
      xp,
    }),
    [tasks, sessions, habits, readings, goals, projects, coins, xp],
  );

  // EVOLUÇÃO REAL DA CIDADE CONFORME PROGRESSO DO JOGADOR
  const cityEvolution = useMemo(() => {
    const score =
      stats.tasks * 10 +
      Math.floor(stats.studyMinutes / 5) * 4 +
      stats.habits * 12 +
      stats.readings * 8 +
      stats.goals * 25 +
      stats.projects * 20 +
      Math.floor(stats.xp / 25);

    if (score >= 350) {
      return {
        tier: 4,
        name: 'Metrópole Neo-Viva',
        score,
        nextThreshold: 500,
        perks:
          'Cúpula solar ativa · Monotrilho pleno · Jardins bioluminescentes',
      };
    }
    if (score >= 150) {
      return {
        tier: 3,
        name: 'Distrito Florescente',
        score,
        nextThreshold: 350,
        perks: 'Alamedas iluminadas · Rede de drones · Cristais energizados',
      };
    }
    if (score >= 50) {
      return {
        tier: 2,
        name: 'Vila Conectada',
        score,
        nextThreshold: 150,
        perks: 'Postes solares ativos · Transporte VLT regular · Praças vivas',
      };
    }
    return {
      tier: 1,
      name: 'Assentamento Inicial',
      score,
      nextThreshold: 50,
      perks: 'Conclua tarefas, hábitos e estudos reais para expandir a cidade',
    };
  }, [stats]);

  const districtValue = (district) => stats[district.metric] || 0;
  const districtOpen = (district) =>
    districtValue(district) >= district.threshold;
  const openCount = DISTRICTS.filter(districtOpen).length;
  const today = localDay();
  const attemptedToday = arcade.lastAttemptDate === today;
  const activeFestival = useMemo(() => getCurrentFestival(), []);
  const activeWeather = useMemo(
    () => WEATHER_TYPES.find((w) => w.id === weatherId) || WEATHER_TYPES[0],
    [weatherId],
  );

  const persistCity = (nextCity, extra = {}) =>
    save?.({ ...data, ...extra, neoCity: nextCity });

  // Registra memória nos NPCs
  const recordNpcMemory = (currentMemories, residentId, entryText) => {
    const existing = safeArray(currentMemories[residentId]);
    const entry = {
      text: entryText,
      time: formatClock(simMinutes),
      weather: activeWeather.label,
      date: today,
    };
    return {
      ...currentMemories,
      [residentId]: [entry, ...existing].slice(0, 6),
    };
  };

  // Verifica se loja/prédio está aberto no horário atual
  const getBuildingOpenStatus = (building) => {
    if (building.openHour === 0 && building.closeHour === 24) {
      return { isOpen: true, hoursText: '24h', badge: 'ABERTO 24H' };
    }
    const effectiveClose =
      building.id === 'neon-market' && activeCityEvent.extendedMarket
        ? 23
        : building.closeHour;
    const isOpen =
      currentHour >= building.openHour && currentHour < effectiveClose;
    const hoursText = `${String(building.openHour).padStart(2, '0')}h–${String(effectiveClose).padStart(2, '0')}h`;
    return {
      isOpen,
      hoursText,
      badge: isOpen
        ? `ABERTO (${hoursText})`
        : `FECHADO (Abre ${String(building.openHour).padStart(2, '0')}h)`,
    };
  };

  // Observa automaticamente mudanças nos dados reais já registrados no app
  useEffect(() => {
    const snapshot = {
      tasks: stats.tasks,
      studyMinutes: stats.studyMinutes,
      habits: stats.habits,
      readings: stats.readings,
      goals: stats.goals,
      projects: stats.projects,
      projectProgress: stats.projectProgress,
    };
    if (!lifeSync.snapshot) {
      const baseline = {
        ...lifeSync,
        snapshot,
        lastReaction:
          'Sincronização local ativada. Seu progresso registrado começa a transformar o Vale Neo.',
      };
      setLifeSync(baseline);
      try {
        window.localStorage.setItem(
          'neolifecity_life_sync_v1',
          JSON.stringify(baseline),
        );
      } catch {}
      return;
    }
    const previous = lifeSync.snapshot;
    const delta = Object.keys(snapshot).reduce(
      (sum, key) =>
        sum + Math.max(0, snapshot[key] - (Number(previous[key]) || 0)),
      0,
    );
    if (delta <= 0) return;

    const nextAffinity = { ...(lifeSync.affinity || {}) };
    const reactions = [];
    const addAffinity = (id, amount, message) => {
      nextAffinity[id] = Math.min(
        100,
        (Number(nextAffinity[id] ?? storedAffinity[id]) || 0) + amount,
      );
      reactions.push(message);
    };
    if (
      snapshot.studyMinutes > (previous.studyMinutes || 0) ||
      snapshot.readings > (previous.readings || 0)
    )
      addAffinity('luna', 2, 'Luna percebeu sua dedicação ao conhecimento.');
    if (
      snapshot.tasks > (previous.tasks || 0) ||
      snapshot.projects > (previous.projects || 0) ||
      snapshot.projectProgress > (previous.projectProgress || 0)
    )
      addAffinity('kai', 2, 'Kai viu você transformar planos em entregas.');
    if (snapshot.habits > (previous.habits || 0))
      addAffinity('nox', 2, 'Nox notou sua constância e celebrou seu ritmo.');
    if (snapshot.goals > (previous.goals || 0))
      addAffinity(
        'maya',
        2,
        'Maya preparou uma novidade para celebrar sua meta concluída.',
      );

    const updated = {
      snapshot,
      affinity: nextAffinity,
      lastReaction:
        reactions[0] || 'A cidade registrou um novo passo da sua jornada.',
    };
    setLifeSync(updated);
    try {
      window.localStorage.setItem(
        'neolifecity_life_sync_v1',
        JSON.stringify(updated),
      );
    } catch {}
    setNotice(
      `Vida real sincronizada neste dispositivo. ${reactions.join(' ')}`,
    );
  }, [
    stats.tasks,
    stats.studyMinutes,
    stats.habits,
    stats.readings,
    stats.goals,
    stats.projects,
    stats.projectProgress,
  ]);

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

  // Avanço do ciclo de Dia e Noite
  useEffect(() => {
    if (timeMode !== 'cycle') return;
    const clockTimer = window.setInterval(() => {
      setSimMinutes((prev) => (prev + 5) % 1440);
    }, 2200);
    return () => window.clearInterval(clockTimer);
  }, [timeMode]);

  // Clima dinâmico automático
  useEffect(() => {
    if (weatherMode !== 'auto') return;
    const weatherTimer = window.setInterval(() => {
      setWeatherId((prev) => {
        const idx = WEATHER_TYPES.findIndex((w) => w.id === prev);
        const nextIdx =
          (idx + 1 + Math.floor(Math.random() * 2)) % WEATHER_TYPES.length;
        return WEATHER_TYPES[nextIdx].id;
      });
    }, 38000);
    return () => window.clearInterval(weatherTimer);
  }, [weatherMode]);

  // Relâmpago ocasional durante tempestade
  useEffect(() => {
    if (weatherId !== 'storm') {
      setLightningFlash(false);
      return;
    }
    const boltTimer = window.setInterval(() => {
      setLightningFlash(true);
      window.setTimeout(() => setLightningFlash(false), 180);
    }, 6500);
    return () => window.clearInterval(boltTimer);
  }, [weatherId]);

  // Chuva rega os canteiros automaticamente
  useEffect(() => {
    if (weatherId !== 'rain' && weatherId !== 'storm') return;
    const plantedKeys = Object.keys(garden);
    if (!plantedKeys.length) return;
    const nextGarden = { ...garden };
    let wateredAny = false;
    plantedKeys.forEach((key) => {
      if ((Number(nextGarden[key]?.waterCount) || 0) < 3) {
        nextGarden[key] = {
          ...nextGarden[key],
          waterCount: (Number(nextGarden[key]?.waterCount) || 0) + 1,
        };
        wateredAny = true;
      }
    });
    if (wateredAny) {
      persistCity({ ...city, garden: nextGarden });
    }
  }, [weatherId]);

  /* ==========================================================================
     COLISÕES E CAMINHABILIDADE (JOGADOR + NPCs LIVRES NAS RUAS E CALÇADAS)
     ========================================================================== */
  const isWaterTile = (x, y) =>
    (x >= 0 && x <= 2 && y >= 0 && y <= 2) ||
    (x >= 17 && x <= 19 && y >= 9 && y <= 11);

  const isSidewalkOrStreet = (x, y) => {
    if (x < 0 || x > 19 || y < 0 || y > 11) return false;
    if (isWaterTile(x, y)) return false;
    const hitBuilding = WORLD_BUILDINGS.some(
      (b) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h,
    );
    if (hitBuilding) return false;
    const hitSolidProp = WORLD_PROPS.some(
      (p) => p.solid && p.x === x && p.y === y,
    );
    if (hitSolidProp) return false;
    return true;
  };

  // Movimentação autônoma dos NPCs residentes e cidadãos pelas ruas e calçadas
  useEffect(() => {
    const npcMoveTimer = window.setInterval(() => {
      setNpcState((prev) => {
        const next = { ...prev };
        RESIDENTS.forEach((res, idx) => {
          const cur = prev[res.id] || {
            x: res.schedule[currentPeriod].x,
            y: res.schedule[currentPeriod].y,
            activity: 'strolling',
            waypointIdx: 0,
            chatPartner: null,
          };

          const sched = res.schedule[currentPeriod];
          const bld = WORLD_BUILDINGS.find((b) => b.id === res.workBuilding);
          const bldOpen = bld ? getBuildingOpenStatus(bld).isOpen : true;

          const points = res.roamPoints || [sched];
          const target =
            sched.activity === 'working' && bldOpen && (animTick + idx) % 6 < 4
              ? { x: sched.x, y: sched.y }
              : points[cur.waypointIdx % points.length];

          let nx = cur.x;
          let ny = cur.y;
          let nextWpIdx = cur.waypointIdx;

          if (cur.x === target.x && cur.y === target.y) {
            nextWpIdx = (cur.waypointIdx + 1) % points.length;
          } else {
            const dx = target.x > cur.x ? 1 : target.x < cur.x ? -1 : 0;
            const dy = target.y > cur.y ? 1 : target.y < cur.y ? -1 : 0;
            const candidates =
              dx !== 0 && dy !== 0
                ? [
                    { x: cur.x + dx, y: cur.y },
                    { x: cur.x, y: cur.y + dy },
                  ]
                : [
                    { x: cur.x + dx, y: cur.y + dy },
                    {
                      x: cur.x + (dy !== 0 ? 1 : 0),
                      y: cur.y + (dx !== 0 ? 1 : 0),
                    },
                  ];

            const validMove = candidates.find(
              (c) =>
                isSidewalkOrStreet(c.x, c.y) &&
                !(c.x === player.x && c.y === player.y),
            );
            if (validMove) {
              nx = validMove.x;
              ny = validMove.y;
            } else {
              nextWpIdx = (cur.waypointIdx + 1) % points.length;
            }
          }

          const nearbyOther = RESIDENTS.find((other) => {
            if (other.id === res.id) return false;
            const oPos = next[other.id] || prev[other.id];
            return oPos && Math.abs(oPos.x - nx) + Math.abs(oPos.y - ny) <= 1;
          });

          const nearBench = WORLD_PROPS.some(
            (p) =>
              p.type === 'bench' &&
              Math.abs(p.x - nx) + Math.abs(p.y - ny) <= 1,
          );

          let activity = 'strolling';
          if (nearbyOther) {
            activity = 'chatting';
          } else if (
            sched.activity === 'working' &&
            bldOpen &&
            Math.abs(nx - sched.x) + Math.abs(ny - sched.y) <= 1
          ) {
            activity = 'working';
          } else if (
            (currentPeriod === 'night' || nearBench) &&
            nx === target.x &&
            ny === target.y
          ) {
            activity = 'resting';
          }

          next[res.id] = {
            x: nx,
            y: ny,
            activity,
            waypointIdx: nextWpIdx,
            chatPartner: nearbyOther ? nearbyOther.name : null,
          };
        });
        return next;
      });

      setCitizens((prev) =>
        prev.map((cit, i) => {
          const target = cit.waypoints[cit.wpIndex % cit.waypoints.length];
          if (cit.x === target.x && cit.y === target.y) {
            const nextIdx = (cit.wpIndex + 1) % cit.waypoints.length;
            const actPool = ['strolling', 'resting', 'working', 'chatting'];
            return {
              ...cit,
              wpIndex: nextIdx,
              activity:
                currentPeriod === 'night'
                  ? 'resting'
                  : actPool[(nextIdx + i) % actPool.length],
            };
          }
          const dx = target.x > cit.x ? 1 : target.x < cit.x ? -1 : 0;
          const dy = target.y > cit.y ? 1 : target.y < cit.y ? -1 : 0;
          const step =
            dx !== 0 && isSidewalkOrStreet(cit.x + dx, cit.y)
              ? { x: cit.x + dx, y: cit.y }
              : dy !== 0 && isSidewalkOrStreet(cit.x, cit.y + dy)
                ? { x: cit.x, y: cit.y + dy }
                : { x: cit.x, y: cit.y };
          if (step.x === player.x && step.y === player.y) return cit;
          return {
            ...cit,
            x: step.x,
            y: step.y,
            activity: currentPeriod === 'night' ? 'resting' : 'strolling',
          };
        }),
      );
    }, 1150);

    return () => window.clearInterval(npcMoveTimer);
  }, [
    currentPeriod,
    player.x,
    player.y,
    animTick,
    activeCityEvent.extendedMarket,
  ]);

  // Movimentação de Carros, Bicicletas, Drones e Transporte Público (VLT)
  useEffect(() => {
    const trafficTimer = window.setInterval(() => {
      setVehicles((prev) =>
        prev.map((v) => {
          if (v.type === 'drone') {
            return { ...v, phase: (v.phase + 2.5) % 100 };
          }
          if (v.lane === 'east' || v.lane === 'bike-east') {
            const nextPos = v.pos + v.speed;
            return { ...v, pos: nextPos > 103 ? -4 : nextPos };
          }
          const nextPos = v.pos - v.speed;
          return { ...v, pos: nextPos < -4 ? 103 : nextPos };
        }),
      );

      setTransitState((prev) => {
        if (prev.dwellTicks > 0) {
          return { ...prev, dwellTicks: prev.dwellTicks - 1 };
        }
        const nextX = prev.x + prev.dir * 0.5;
        let nextDir = prev.dir;
        if (nextX >= 17) nextDir = -1;
        if (nextX <= 2) nextDir = 1;

        const stopHit = TRANSIT_STOPS.find((s) => Math.abs(s.x - nextX) < 0.26);
        return {
          x: nextX,
          dir: nextDir,
          dwellTicks: stopHit ? 5 : 0,
          atStop: stopHit ? stopHit.name : null,
        };
      });
    }, 260);

    return () => window.clearInterval(trafficTimer);
  }, []);

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
      const pos = npcState[r.id];
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
      setCitizenBubble(null);
    }
  };

  /* ==========================================================================
     JARDIM — CICLOS DE CRESCIMENTO SINCRONIZADOS COM SESSÕES REAIS DE FOCO
     ========================================================================== */
  const getPlotStage = (plotData) => {
    if (!plotData) return -1;
    const focusAtPlant = Number(plotData.focusMinutesAtPlant) || 0;
    const gainedFocus = Math.max(0, stats.studyMinutes - focusAtPlant);
    const waterBonus = (Number(plotData.waterCount) || 0) * 10;
    const totalProgress = gainedFocus + waterBonus;
    const species =
      SEED_SPECIES.find((s) => s.id === plotData.seedId) || SEED_SPECIES[0];
    const ratio = totalProgress / species.focusMinutesNeeded;
    if (ratio >= 1) return 3;
    if (ratio >= 0.6) return 2;
    if (ratio >= 0.25) return 1;
    return 0;
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
          waterCount: weatherId === 'rain' || weatherId === 'storm' ? 1 : 0,
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

    const sp =
      SEED_SPECIES.find((s) => s.id === existing.seedId) || SEED_SPECIES[0];
    const festivalBonus =
      activeFestival.id === 'lantern-festival' ||
      activeCityEvent.id === 'lantern-parade'
        ? Math.round(sp.sellPrice * 1.2)
        : sp.sellPrice;
    const stormXpBonus =
      weatherId === 'storm' ? Math.round(sp.xpReward * 1.15) : sp.xpReward;
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
      { coins: coins + festivalBonus, xp: xp + stormXpBonus },
    );
    setNotice(
      `Colheita concluída: ${sp.name}! +${festivalBonus} moedas, +${stormXpBonus} XP e item guardado na mochila.`,
    );
  };

  /* ==========================================================================
     INTERAÇÕES NO MAPA, DIÁLOGOS COM MEMÓRIA E RELACIONAMENTOS
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
    const act = npcState[resident.id]?.activity || 'strolling';
    const actLabel = ACTIVITY_META[act]?.label.toLowerCase() || 'passeando';
    const nextMemories = recordNpcMemory(
      npcMemories,
      resident.id,
      `Conversamos enquanto eu estava ${actLabel} (${activeWeather.label}).`,
    );

    persistCity({
      ...city,
      talks: nextTalks,
      affinity: nextAffinity,
      npcMemories: nextMemories,
    });
    setDialogueStep('root');
    setCitizenBubble(null);

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
    let nextMemories = npcMemories;
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
      const giftId = inventory[giftIdx];
      const nextInv = [...inventory];
      nextInv.splice(giftIdx, 1);
      nextMemories = recordNpcMemory(
        npcMemories,
        resident.id,
        `Você me presenteou com ${giftId.replace('harvest-', '').replace('fish-', '')}!`,
      );
      nextCity = {
        ...nextCity,
        inventory: nextInv,
        affinity: { ...affinity, [resident.id]: Math.min(100, curAff + 12) },
        npcMemories: nextMemories,
      };
      setNotice(
        `${resident.name} adorou o presente artesanal e guardou na memória! (+12 de afinidade)`,
      );
    } else if (choice.action === 'sync-task') {
      const pendingTask = tasks.find((t) => !completed(t));
      if (pendingTask) {
        const taskTitle = pendingTask.title || pendingTask.text || 'Tarefa';
        const nextTasks = tasks.map((t) =>
          t === pendingTask
            ? { ...t, done: true, completed: true, status: 'done' }
            : t,
        );
        nextMemories = recordNpcMemory(
          npcMemories,
          resident.id,
          `Concluímos juntos a tarefa real "${taskTitle}".`,
        );
        nextCity = { ...nextCity, npcMemories: nextMemories };
        extraRoot = { tasks: nextTasks, coins: coins + 15, xp: xp + 20 };
        setNotice(
          `Tarefa real "${taskTitle}" concluída com ${resident.name}! +15 moedas e +20 XP.`,
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
      nextMemories = recordNpcMemory(
        npcMemories,
        resident.id,
        'Registramos 25 minutos de foco profundo na cidade.',
      );
      nextCity = { ...nextCity, npcMemories: nextMemories };
      extraRoot = {
        studySessions: [...sessions, newSession],
        coins: coins + 15,
        xp: xp + 25,
      };
      setNotice(
        'Sessão de foco de 25 min registrada! Seus canteiros cresceram e você ganhou +25 XP.',
      );
    } else if (choice.action === 'sync-habit') {
      const firstHabit = habits[0];
      if (firstHabit) {
        const hTitle = firstHabit.name || firstHabit.title || 'Hábito';
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
        nextMemories = recordNpcMemory(
          npcMemories,
          resident.id,
          `Celebramos a constância no hábito "${hTitle}".`,
        );
        nextCity = { ...nextCity, npcMemories: nextMemories };
        extraRoot = { habits: nextHabits, coins: coins + 12, xp: xp + 18 };
        setNotice(
          `Hábito "${hTitle}" registrado para hoje! +12 moedas e +18 XP.`,
        );
      } else {
        setNotice('Crie um hábito no Meu Assistente para sincronizar com Nox.');
      }
    } else {
      nextMemories = recordNpcMemory(
        npcMemories,
        resident.id,
        `Trocamos ideias sobre a evolução da cidade (${cityEvolution.name}).`,
      );
      nextCity = { ...nextCity, npcMemories: nextMemories };
    }

    persistCity(nextCity, extraRoot);
    setDialogueStep(choice.nextStep || 'farewell');
  };

  const interactInWorld = () => {
    const nearbyDoor = WORLD_BUILDINGS.find(
      (b) => Math.abs(b.door.x - player.x) + Math.abs(b.door.y - player.y) <= 1,
    );
    if (nearbyDoor) {
      enterBuilding(nearbyDoor);
      return;
    }

    const nearbyResident = RESIDENTS.find((r) => {
      const pos = npcState[r.id];
      return (
        pos && Math.abs(pos.x - player.x) + Math.abs(pos.y - player.y) <= 1
      );
    });
    if (nearbyResident) {
      openResidentDialogue(nearbyResident, true);
      return;
    }

    const nearbyCitizen = citizens.find(
      (c) => Math.abs(c.x - player.x) + Math.abs(c.y - player.y) <= 1,
    );
    if (nearbyCitizen) {
      setCitizenBubble(nearbyCitizen);
      return;
    }

    const nearbyStop = TRANSIT_STOPS.find(
      (s) => Math.abs(s.x - player.x) + Math.abs(s.y - player.y) <= 1,
    );
    if (nearbyStop) {
      const idx = TRANSIT_STOPS.indexOf(nearbyStop);
      const nextStop = TRANSIT_STOPS[(idx + 1) % TRANSIT_STOPS.length];
      setPlayer({ x: nextStop.x, y: nextStop.y });
      setNotice(
        `🚆 Expresso VLT: você embarcou na ${nearbyStop.name} e desembarcou na ${nextStop.name}!`,
      );
      return;
    }

    const nearbyPlot = GARDEN_PLOTS.find(
      (p) => Math.abs(p.x - player.x) + Math.abs(p.y - player.y) <= 1,
    );
    if (nearbyPlot) {
      handlePlotAction(nearbyPlot);
      return;
    }

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
        `Painel Urbano (${cityEvolution.name}): ${openCount}/${DISTRICTS.length} distritos ativos · Clima: ${activeWeather.label} · Hora: ${formatClock(simMinutes)}.`,
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
        else if (citizenBubble) setCitizenBubble(null);
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

    const openStatus = getBuildingOpenStatus(building);
    if (!openStatus.isOpen) {
      setNotice(
        `🔒 ${building.name} está fechado agora (horário de funcionamento: ${openStatus.hoursText}). Ajuste o relógio ou aguarde amanhecer!`,
      );
      return;
    }

    setWorldBubble(null);
    setCitizenBubble(null);
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
    if (x === 5 && y === 4) return;

    const currentRoomItems = safeArray(homeLayouts[homeRoomIndex]);
    const existingIdx = currentRoomItems.findIndex(
      (item) => item.x === x && item.y === y,
    );

    if (existingIdx !== -1) {
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
      const stormXp = weatherId === 'storm' ? 5 : 0;
      persistCity(city, {
        studySessions: [...sessions, newSession],
        coins: coins + Math.round(mins / 2),
        xp: xp + mins + festivalXp + stormXp,
      });
      setNotice(
        `Sessão real de ${mins} min salva! +${Math.round(mins / 2)} moedas, +${mins + festivalXp + stormXp} XP e crescimento nas plantas.`,
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
     MISSÕES VERIFICÁVEIS
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
    if (next[0] === 2 && next[4] === 2 && next[8] === 2) {
      persistCity(city, { coins: coins + 15, xp: xp + 25 });
      setNotice('Circuito Bio-Energético estabilizado! +15 moedas e +25 XP.');
      setCircuitGrid([1, 0, 2, 0, 1, 2, 2, 1, 0]);
    }
  };

  /* ==========================================================================
     LOJA, INVENTÁRIO E EQUIPAMENTOS
     ========================================================================== */
  const marketBuilding = WORLD_BUILDINGS.find((b) => b.id === 'neon-market');
  const marketOpenStatus = getBuildingOpenStatus(marketBuilding);

  const buyItem = (item) => {
    if (!marketOpenStatus.isOpen) {
      setNotice(
        `🔒 O Mercado Neon está fechado agora (${marketOpenStatus.hoursText}). Avance o relógio para o horário comercial!`,
      );
      return;
    }
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

  const dirRowMap = SPRITE_SHEET_LAYOUT.directions;
  const activeWalkCol = isWalking ? walkFrame : 0;
  const dronePos = {
    x: Math.max(0, player.x - 1),
    y: Math.max(0, player.y - 1),
  };

  const tabs = [
    ['explore', '🕹️ Cidade & Casa'],
    ['residents', '💬 Moradores'],
    ['quests', '📜 Missões & Evolução'],
    ['market', `🛍️ Mercado ${marketOpenStatus.isOpen ? '🟢' : '🔴'}`],
    ['inventory', '🎒 Inventário'],
    ['arcade', '🎮 Minijogos'],
    ['collections', '📖 Coleções & Festivais'],
    ['avatar', '🧑 Personagem'],
  ];

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
            {activeFestival.name.toUpperCase()} · {activeCityEvent.icon}{' '}
            {activeCityEvent.name.toUpperCase()}
          </span>
          <h1>
            Sua vida real. <em>Sua cidade viva.</em>
          </h1>
          <p>
            Explore o Vale Neo em tempo real: moradores caminham pelas calçadas,
            lojas abrem e fecham conforme o horário, veículos cruzam as avenidas
            e a cidade evolui com suas conquistas reais.
          </p>
          <div className='neo-hero-actions'>
            <button onClick={() => onNavigate?.('tasks')}>
              ＋ Registrar no Meu Assistente
            </button>
            <span>
              🏛️ Nível {cityEvolution.tier}: <b>{cityEvolution.name}</b> (
              {cityEvolution.score} pts) · {openCount}/{DISTRICTS.length}{' '}
              distritos
            </span>
          </div>
        </div>

        <div className='neo-hero-right'>
          <div className='neo-wallet'>
            <span>CARTEIRA & EVOLUÇÃO DA CIDADE</span>
            <strong>
              🪙 {coins.toLocaleString('pt-BR')} · ⚡{' '}
              {xp.toLocaleString('pt-BR')} XP
            </strong>
            <small>
              {stats.tasks} tarefas · {stats.studyMinutes}m foco ·{' '}
              {stats.habits} hábitos · {cityEvolution.name}
            </small>
          </div>

          <div className='neo-life-sync-card' aria-live='polite'>
            <strong>↻ VIDA REAL · EVOLUÇÃO URBANA ATIVA</strong>
            <span>{cityEvolution.perks}</span>
            {lifeSync.lastReaction && (
              <small className='neo-life-sync-reaction'>
                {lifeSync.lastReaction}
              </small>
            )}
          </div>

          {/* Controles de Ciclo Dia/Noite */}
          <div
            className='neo-time-switcher'
            role='group'
            aria-label='Ciclo de dia e noite'
          >
            <span className='neo-clock-pill'>
              {PERIOD_LABELS[currentPeriod].icon} {formatClock(simMinutes)}
            </span>
            <button
              type='button'
              className={timeMode === 'cycle' ? 'active' : ''}
              onClick={() => setTimeMode('cycle')}
              title='Relógio dinâmico acelerado'
            >
              🔄 Ciclo
            </button>
            <button
              type='button'
              className={timeMode === 'realtime' ? 'active' : ''}
              onClick={() => setTimeMode('realtime')}
              title='Sincronizado com o relógio real'
            >
              🕒 Real
            </button>
            {[
              ['morning', 510, '🌅 08:30'],
              ['afternoon', 870, '☀️ 14:30'],
              ['sunset', 1095, '🌇 18:15'],
              ['night', 1350, '🌙 22:30'],
            ].map(([periodKey, mins, label]) => (
              <button
                key={periodKey}
                type='button'
                className={
                  timeMode === 'manual' && currentPeriod === periodKey
                    ? 'active'
                    : ''
                }
                onClick={() => {
                  setTimeMode('manual');
                  setSimMinutes(mins);
                }}
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
          ABA 1: EXPLORAR CIDADE VIVA, TRÂNSITO, CLIMA, LOJAS E MINHA CASA
          ====================================================================== */}
      {activeTab === 'explore' && (
        <>
          <section className='neo-section-heading'>
            <div>
              <span>
                {insideBuilding
                  ? `INTERIOR // ${insideBuilding.name.toUpperCase()}`
                  : `CIDADE VIVA // ${PERIOD_LABELS[currentPeriod].name.toUpperCase()} (${formatClock(simMinutes)}) · ${activeWeather.icon} ${activeWeather.label.toUpperCase()}`}
              </span>
              <h2>
                {insideBuilding
                  ? insideBuilding.isHome
                    ? `Minha Casa — ${insideBuilding.rooms[homeRoomIndex]}`
                    : insideBuilding.name
                  : `Vale Neo — ${cityEvolution.name}`}
              </h2>
              <p>
                {insideBuilding
                  ? insideBuilding.isHome
                    ? 'Explore os 3 cômodos e ative o Modo Decoração para posicionar móveis livremente na grade.'
                    : insideBuilding.description
                  : 'Use WASD/setas para andar, E para entrar em lojas abertas, conversar com moradores nas calçadas ou embarcar no Expresso VLT.'}
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
              {/* BARRA DE CLIMA DINÂMICO, EVENTO ATIVO E ATALHOS URBANOS */}
              <div className='neo-world-toolbar'>
                <div className='neo-weather-controls'>
                  <span>Clima:</span>
                  <button
                    type='button'
                    className={weatherMode === 'auto' ? 'active' : ''}
                    onClick={() => setWeatherMode('auto')}
                  >
                    🔄 Auto
                  </button>
                  {WEATHER_TYPES.map((w) => (
                    <button
                      key={w.id}
                      type='button'
                      className={weatherId === w.id ? 'active' : ''}
                      onClick={() => {
                        setWeatherMode('manual');
                        setWeatherId(w.id);
                      }}
                      title={w.desc}
                    >
                      {w.icon} {w.label}
                    </button>
                  ))}
                </div>

                <div className='neo-toolbar-btns'>
                  <button
                    type='button'
                    onClick={() =>
                      setCityEventIndex((i) => (i + 1) % CITY_EVENTS.length)
                    }
                    title={activeCityEvent.effect}
                  >
                    {activeCityEvent.icon} Evento: {activeCityEvent.name}
                  </button>
                  <button
                    type='button'
                    onClick={() => enterBuilding(WORLD_BUILDINGS[0])}
                  >
                    🏡 Minha Casa
                  </button>
                  <button
                    type='button'
                    onClick={() => {
                      setPlayer({ x: 8, y: 6 });
                      setWorldBubble(null);
                      setCitizenBubble(null);
                    }}
                  >
                    🧭 Praça Central
                  </button>
                </div>
              </div>

              {/* FAIXA DE STATUS DE LOJAS E ATIVIDADE DOS MORADORES */}
              <div className='neo-city-telemetry'>
                <div className='neo-telemetry-group'>
                  <b>🏪 Horário das Lojas:</b>
                  {WORLD_BUILDINGS.filter((b) => !b.isHome).map((b) => {
                    const st = getBuildingOpenStatus(b);
                    return (
                      <button
                        key={b.id}
                        type='button'
                        className={`neo-store-pill ${st.isOpen ? 'open' : 'closed'}`}
                        onClick={() => enterBuilding(b)}
                        title={`${b.name}: ${st.badge}`}
                      >
                        {b.icon} {b.name.split(' ')[0]} ·{' '}
                        {st.isOpen ? 'Aberto' : 'Fechado'}
                      </button>
                    );
                  })}
                </div>
                <div className='neo-telemetry-group'>
                  <b>👥 Moradores ao Vivo:</b>
                  {RESIDENTS.map((r) => {
                    const st = npcState[r.id];
                    const act = ACTIVITY_META[st?.activity || 'strolling'];
                    return (
                      <button
                        key={r.id}
                        type='button'
                        className='neo-npc-pill'
                        onClick={() => openResidentDialogue(r, true)}
                      >
                        {act.icon} {r.name}: {act.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className='neo-world-scroll'>
                <div
                  className={`neo-world-map period-${currentPeriod} weather-${weatherId} evo-tier-${cityEvolution.tier} ${lightningFlash ? 'lightning-flash' : ''}`}
                  role='application'
                  aria-label='Mapa 16-bit do Vale Neo'
                >
                  {/* CAMADA DE TRÂNSITO URBANO: CARROS, BICICLETAS, DRONES E VLT */}
                  <div className='neo-city-life' aria-hidden='true'>
                    {TRANSIT_STOPS.map((stop) => (
                      <div
                        key={stop.id}
                        className='neo-transit-stop-marker'
                        style={{
                          left: `${(stop.x + 0.5) * 50.4}px`,
                          top: `${stop.y * 47.25 - 6}px`,
                        }}
                      >
                        🚏 {stop.name.replace('Estação ', '')}
                      </div>
                    ))}

                    <div
                      className={`neo-public-transit ${transitState.dwellTicks > 0 ? 'stopped' : ''}`}
                      style={{
                        left: `${transitState.x * 50.4}px`,
                        top: `${6 * 47.25 + 10}px`,
                        transform: transitState.dir < 0 ? 'scaleX(-1)' : 'none',
                      }}
                    >
                      <div className='neo-vlt-car'>
                        <span>🚆</span>
                      </div>
                      <div className='neo-vlt-car trailer' />
                      {transitState.atStop && (
                        <b
                          style={{
                            transform:
                              transitState.dir < 0 ? 'scaleX(-1)' : 'none',
                          }}
                        >
                          PARADA
                        </b>
                      )}
                    </div>

                    {vehicles.map((v) => {
                      if (v.type === 'car') {
                        const topPx =
                          v.lane === 'east' ? 7 * 47.25 + 14 : 6 * 47.25 + 26;
                        return (
                          <div
                            key={v.id}
                            className={`neo-vehicle-car ${v.lane}`}
                            style={{
                              left: `${v.pos}%`,
                              top: `${topPx}px`,
                              '--veh-color': v.color,
                            }}
                          />
                        );
                      }
                      if (v.type === 'bike') {
                        const topPx =
                          v.lane === 'bike-east'
                            ? 5 * 47.25 + 34
                            : 8 * 47.25 + 4;
                        return (
                          <div
                            key={v.id}
                            className={`neo-vehicle-bike ${v.lane}`}
                            style={{
                              left: `${v.pos}%`,
                              top: `${topPx}px`,
                            }}
                          >
                            🚲
                          </div>
                        );
                      }
                      const rad = (v.phase / 100) * Math.PI * 2 + v.route;
                      const dx =
                        v.route === 0
                          ? 460 + Math.cos(rad) * 260
                          : 620 + Math.sin(rad) * 220;
                      const dy =
                        v.route === 0
                          ? 180 + Math.sin(rad) * 95
                          : 340 + Math.cos(rad) * 85;
                      return (
                        <div
                          key={v.id}
                          className='neo-city-drone-unit'
                          style={{ left: `${dx}px`, top: `${dy}px` }}
                        >
                          🛸
                        </div>
                      );
                    })}

                    {cityEvolution.tier >= 2 && (
                      <span className='neo-city-glow city-glow-one' />
                    )}
                    {cityEvolution.tier >= 3 && (
                      <span className='neo-city-glow city-glow-two' />
                    )}
                    {cityEvolution.tier >= 4 && (
                      <span className='neo-city-glow city-glow-three' />
                    )}
                  </div>

                  {/* CAMADA DE CLIMA E FESTIVAIS */}
                  <div className='neo-weather-overlay' aria-hidden='true'>
                    {(weatherId === 'rain' || weatherId === 'storm') &&
                      Array.from({ length: 28 }, (_, i) => (
                        <span
                          key={i}
                          className='neo-rain-drop'
                          style={{
                            left: `${(i * 3.7) % 100}%`,
                            animationDelay: `${(i % 7) * 0.14}s`,
                          }}
                        />
                      ))}
                    {(weatherId === 'breeze' ||
                      activeCityEvent.id === 'botanical-bloom' ||
                      activeCityEvent.id === 'lantern-parade') &&
                      Array.from({ length: 14 }, (_, i) => (
                        <span
                          key={i}
                          className={`neo-ambient-mote ${activeCityEvent.id === 'lantern-parade' ? 'lantern' : ''}`}
                          style={{
                            left: `${(i * 7.3) % 96}%`,
                            top: `${(i * 13) % 88}%`,
                            animationDelay: `${i * 0.35}s`,
                          }}
                        >
                          {activeCityEvent.id === 'lantern-parade' ? '🏮' : '✦'}
                        </span>
                      ))}
                  </div>

                  {/* GRADE DO MAPA 20×12 */}
                  {Array.from({ length: 20 * 12 }, (_, index) => {
                    const x = index % 20;
                    const y = Math.floor(index / 20);

                    const building = WORLD_BUILDINGS.find(
                      (b) =>
                        x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h,
                    );
                    const isBuildingAnchor =
                      building && x === building.x && y === building.y;
                    const bOpenStatus = building
                      ? getBuildingOpenStatus(building)
                      : null;

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
                      const pos = npcState[r.id];
                      return pos && pos.x === x && pos.y === y;
                    });

                    const citizenHere = citizens.find(
                      (c) => c.x === x && c.y === y,
                    );

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

                    const playerHere = player.x === x && player.y === y;
                    const companionHere =
                      equipped.companion === 'drone-pet' &&
                      dronePos.x === x &&
                      dronePos.y === y;
                    const plotStage = plot ? getPlotStage(garden[plot.id]) : -1;

                    return (
                      <div
                        key={`${x}-${y}`}
                        className={`neo-world-tile ${isRoad ? 'city-road' : ''} ${isWater ? 'city-water' : ''}`}
                        style={{
                          gridColumn: x + 1,
                          gridRow: y + 1,
                        }}
                      >
                        {isBuildingAnchor && bOpenStatus ? (
                          <button
                            type='button'
                            className={`neo-building-hours-badge ${bOpenStatus.isOpen ? 'open' : 'closed'}`}
                            onClick={() => enterBuilding(building)}
                          >
                            {building.icon} {building.name} ·{' '}
                            {bOpenStatus.isOpen ? 'ABERTO' : 'FECHADO'}
                          </button>
                        ) : null}

                        {plot && sprites?.terrain ? (
                          <button
                            type='button'
                            className={`neo-plot-btn ${plotStage === 3 ? 'ready' : ''}`}
                            title={`${plot.label}: ${
                              plotStage === -1
                                ? 'Clique para plantar'
                                : plotStage === 3
                                  ? 'Pronto para colher!'
                                  : `Estágio ${plotStage + 1}/4`
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

                        {door ? (
                          <button
                            className='neo-door'
                            title={`Entrar em ${door.name}`}
                            onClick={() => enterBuilding(door)}
                          >
                            <span className='neo-door-marker'>▲</span>
                          </button>
                        ) : null}

                        {residentHere ? (
                          <button
                            type='button'
                            className={`neo-map-resident resident-${residentHere.id}`}
                            title={`Conversar com ${residentHere.name} (${ACTIVITY_META[npcState[residentHere.id]?.activity || 'strolling'].label})`}
                            aria-label={`Conversar com ${residentHere.name}`}
                            onClick={() =>
                              openResidentDialogue(residentHere, true)
                            }
                          >
                            <span className='neo-npc-activity-chip'>
                              {
                                ACTIVITY_META[
                                  npcState[residentHere.id]?.activity ||
                                    'strolling'
                                ].icon
                              }
                            </span>
                            <span
                              className='neo-resident-sprite neo-authentic-sprite'
                              style={{
                                backgroundImage: `url('/assets/characters/runtime/${residentHere.id}.png')`,
                                backgroundPosition: `${((Math.floor(animTick / 4) + 1) % 4) * 33.333}% 0`,
                              }}
                            />
                            <b>{residentHere.name}</b>
                          </button>
                        ) : null}

                        {!residentHere && citizenHere ? (
                          <button
                            type='button'
                            className='neo-ambient-citizen'
                            title={`${citizenHere.name} — ${ACTIVITY_META[citizenHere.activity]?.label}`}
                            onClick={() => setCitizenBubble(citizenHere)}
                          >
                            <span className='neo-cit-status'>
                              {ACTIVITY_META[citizenHere.activity]?.icon}
                            </span>
                            <span
                              className='neo-cit-body'
                              style={{
                                '--cit-coat': citizenHere.color,
                                '--cit-hat': citizenHere.hat,
                              }}
                            />
                            <small>{citizenHere.name}</small>
                          </button>
                        ) : null}

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

                        {playerHere && sprites?.player ? (
                          <span
                            className='neo-player-sprite'
                            aria-label='Jogador'
                            style={tileSpriteStyle(
                              sprites.player,
                              SPRITE_SHEET_LAYOUT.player.width,
                              SPRITE_SHEET_LAYOUT.player.height,
                              activeWalkCol *
                                SPRITE_SHEET_LAYOUT.player.frameWidth,
                              dirRowMap[lastDirection] *
                                SPRITE_SHEET_LAYOUT.player.frameHeight,
                              SPRITE_SHEET_LAYOUT.player.frameWidth,
                              SPRITE_SHEET_LAYOUT.player.frameHeight,
                              1.65,
                            )}
                          />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>

              {citizenBubble && (
                <div className='neo-world-bubble' role='dialog'>
                  <div className='neo-bubble-portrait'>
                    <span style={{ fontSize: '28px' }}>
                      {ACTIVITY_META[citizenBubble.activity]?.icon || '🚶'}
                    </span>
                  </div>
                  <div className='neo-bubble-body'>
                    <div className='neo-bubble-header'>
                      <span>
                        {citizenBubble.name.toUpperCase()} ·{' '}
                        {citizenBubble.role}
                      </span>
                      <b>
                        {ACTIVITY_META[citizenBubble.activity]?.label} na
                        calçada
                      </b>
                    </div>
                    <p>“{citizenBubble.quote}”</p>
                  </div>
                  <button
                    className='neo-close-x'
                    onClick={() => setCitizenBubble(null)}
                    aria-label='Fechar'
                  >
                    ×
                  </button>
                </div>
              )}

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
                        {
                          ACTIVITY_META[
                            npcState[worldBubble.id]?.activity || 'strolling'
                          ].icon
                        }{' '}
                        {
                          ACTIVITY_META[
                            npcState[worldBubble.id]?.activity || 'strolling'
                          ].label
                        }
                        {npcState[worldBubble.id]?.chatPartner
                          ? ` com ${npcState[worldBubble.id].chatPartner}`
                          : ''}
                      </span>
                      <b>
                        ❤️ {Number(affinity[worldBubble.id]) || 0}/100 ·{' '}
                        {getRelationshipTier(
                          Number(affinity[worldBubble.id]) || 0,
                        )}
                      </b>
                    </div>

                    {safeArray(npcMemories[worldBubble.id])[0] && (
                      <div className='neo-memory-callout'>
                        🧠 Memória recente:{' '}
                        <em>
                          “{safeArray(npcMemories[worldBubble.id])[0].text}”
                        </em>
                      </div>
                    )}

                    <p>
                      {dialogueStep === 'farewell'
                        ? `“Guardei nosso encontro na memória! Nos vemos pelas ruas do Vale Neo.”`
                        : weatherId === 'rain' || weatherId === 'storm'
                          ? `“Essa ${activeWeather.label.toLowerCase()} está deixando os jardins radiantes! Como posso ajudar você hoje?”`
                          : `“Oi! Estava ${ACTIVITY_META[npcState[worldBubble.id]?.activity || 'strolling'].label.toLowerCase()} por aqui. O que vamos fazer?”`}
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
                  Clique nos moradores e cidadãos nas calçadas, embarque nas
                  estações 🚏 do VLT ou entre nas lojas durante o horário de
                  funcionamento.
                </p>
              </div>
            </>
          ) : (
            /* ================================================================
               INTERIORES EXPLORÁVEIS (MINHA CASA + PRÉDIOS)
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
                              SPRITE_SHEET_LAYOUT.player.width,
                              SPRITE_SHEET_LAYOUT.player.height,
                              activeWalkCol *
                                SPRITE_SHEET_LAYOUT.player.frameWidth,
                              dirRowMap[lastDirection] *
                                SPRITE_SHEET_LAYOUT.player.frameHeight,
                              SPRITE_SHEET_LAYOUT.player.frameWidth,
                              SPRITE_SHEET_LAYOUT.player.frameHeight,
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
          ABA 2: MORADORES, MEMÓRIAS, RELACIONAMENTOS E ROTINAS
          ====================================================================== */}
      {activeTab === 'residents' && (
        <>
          <section className='neo-section-heading'>
            <div>
              <span>COMUNIDADE, MEMÓRIA & RELACIONAMENTOS</span>
              <h2>Moradores do Vale Neo</h2>
              <p>
                Os moradores lembram das suas conversas, presentes e tarefas
                concluídas juntos, além de manterem laços entre si.
              </p>
            </div>
            <div className='neo-level-chip'>
              {PERIOD_LABELS[currentPeriod].icon} Agora:{' '}
              {formatClock(simMinutes)} ({PERIOD_LABELS[currentPeriod].name})
            </div>
          </section>

          <section className='neo-resident-grid'>
            {RESIDENTS.map((resident) => {
              const aff = Number(affinity[resident.id]) || 0;
              const hearts = Math.min(5, Math.floor(aff / 20));
              const curNpc = npcState[resident.id];
              const actMeta = ACTIVITY_META[curNpc?.activity || 'strolling'];
              const memories = safeArray(npcMemories[resident.id]);

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
                      {actMeta.icon} {actMeta.label} ·{' '}
                      {'❤️'.repeat(hearts) || '🤍'} ({aff}/100 ·{' '}
                      {getRelationshipTier(aff)})
                    </span>
                    <h3>{resident.name}</h3>
                    <p>{resident.role}</p>
                    <small>
                      🤝 Vínculos:{' '}
                      {resident.relations
                        .map(
                          (rel) =>
                            `${rel.targetId.toUpperCase()} (${rel.label})`,
                        )
                        .join(' · ')}
                    </small>
                    {memories[0] && (
                      <small className='neo-card-memory'>
                        🧠 Última memória: “{memories[0].text}”
                      </small>
                    )}
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
                    (
                    {getRelationshipTier(
                      Number(affinity[selectedResident.id]) || 0,
                    )}
                    ) · {selectedResident.role}
                  </span>
                  <h3>{selectedResident.name}</h3>
                </div>
              </div>

              <p>
                {dialogueStep === 'farewell'
                  ? `“Registrei esse momento no meu diário! Quando quiser, me encontre caminhando pelas ruas do Vale Neo.”`
                  : `“Seu progresso real está transformando nossa vizinhança (${cityEvolution.name}). O que gostaria de fazer agora?”`}
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

              <div className='neo-story-unlocks'>
                <h4>🧠 Memórias com {selectedResident.name}</h4>
                {safeArray(npcMemories[selectedResident.id]).length ? (
                  safeArray(npcMemories[selectedResident.id]).map((mem, i) => (
                    <div key={i} className='neo-story-chap'>
                      <b>
                        🕒 {mem.time} · {mem.weather}
                      </b>
                      <p>{mem.text}</p>
                    </div>
                  ))
                ) : (
                  <p>Nenhuma memória registrada ainda — converse acima!</p>
                )}

                <h4>🤝 Relacionamentos na Cidade</h4>
                <div className='neo-col-chips'>
                  {selectedResident.relations.map((rel) => {
                    const other = RESIDENTS.find((r) => r.id === rel.targetId);
                    return (
                      <span key={rel.targetId} className='found'>
                        {other?.avatar} {other?.name}: {rel.label} ({rel.bond}%)
                      </span>
                    );
                  })}
                </div>

                <h4>📖 Histórias de {selectedResident.name}</h4>
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
          ABA 3: MISSÕES E EVOLUÇÃO REAL DA CIDADE
          ====================================================================== */}
      {activeTab === 'quests' && (
        <>
          <section className='neo-section-heading'>
            <div>
              <span>EVOLUÇÃO REAL DA CIDADE // NÍVEL {cityEvolution.tier}</span>
              <h2>{cityEvolution.name}</h2>
              <p>{cityEvolution.perks}</p>
            </div>
            <div className='neo-level-chip'>
              🏙️ Índice Urbano: {cityEvolution.score}/
              {cityEvolution.nextThreshold} pts
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
          ABA 4: MERCADO NEON (COM HORÁRIO DE FUNCIONAMENTO)
          ====================================================================== */}
      {activeTab === 'market' && (
        <>
          <section className='neo-section-heading'>
            <div>
              <span>
                MERCADO NEON · {marketOpenStatus.badge} · RELÓGIO:{' '}
                {formatClock(simMinutes)}
              </span>
              <h2>Móveis, Roupas e Equipamentos</h2>
              <p>
                {marketOpenStatus.isOpen
                  ? 'A loja está aberta! Adquira itens com suas moedas conquistadas.'
                  : `O Mercado Neon funciona das ${marketOpenStatus.hoursText}. Avance o relógio para comprar.`}
              </p>
            </div>
            <div className='neo-toolbar-btns'>
              {!marketOpenStatus.isOpen && (
                <button
                  type='button'
                  className='neo-interact-btn'
                  onClick={() => {
                    setTimeMode('manual');
                    setSimMinutes(600);
                    setNotice(
                      'Relógio ajustado para 10:00 — Mercado Neon aberto!',
                    );
                  }}
                >
                  ⏩ Abrir Loja (10:00)
                </button>
              )}
              <div className='neo-level-chip'>🪙 {coins} moedas</div>
            </div>
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
                      disabled={
                        !marketOpenStatus.isOpen ||
                        isUniqueEquip ||
                        coins < item.price
                      }
                      onClick={() => buyItem(item)}
                    >
                      {!marketOpenStatus.isOpen
                        ? '🔒 Fechado'
                        : isUniqueEquip
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
          ABA 6: MINIJOGOS
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
          ABA 7: FESTIVAIS SAZONAIS, EVENTOS E COLEÇÕES
          ====================================================================== */}
      {activeTab === 'collections' && (
        <>
          <section className='neo-section-heading'>
            <div>
              <span>CALENDÁRIO SAZONAL & EVENTOS URBANOS</span>
              <h2>Festivais e Celebrações do Vale Neo</h2>
              <p>
                Celebrações sazonais e eventos urbanos trazem bônus, horário
                noturno estendido e lembranças para sua casa.
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
                    <b>{isCurrent ? 'FESTIVAL ATIVO' : 'CALENDÁRIO'}</b>
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
              <span>EVENTOS DINÂMICOS DA CIDADE</span>
              <h2>Programação Urbana</h2>
            </div>
          </section>

          <section className='neo-festivals-grid'>
            {CITY_EVENTS.map((ev, idx) => {
              const isCurrent = idx === cityEventIndex;
              return (
                <article
                  key={ev.id}
                  className={`neo-festival-card ${isCurrent ? 'current' : ''}`}
                >
                  <div className='neo-fest-top'>
                    <span>{ev.icon} Evento Urbano</span>
                    <b>{isCurrent ? 'EM ANDAMENTO' : 'DISPONÍVEL'}</b>
                  </div>
                  <h3>{ev.name}</h3>
                  <p>{ev.effect}</p>
                  <button
                    type='button'
                    onClick={() => {
                      setCityEventIndex(idx);
                      setNotice(`Evento ativado na cidade: ${ev.name}!`);
                    }}
                  >
                    {isCurrent ? '✓ Ativo na Cidade' : 'Ativar Evento'}
                  </button>
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
        <span>
          NEO-LIFE / {cityEvolution.name.toUpperCase()} ·{' '}
          {formatClock(simMinutes)}
        </span>
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
   ESTILOS — PALETA ACOLHEDORA, VIDA URBANA, CLIMA, DIA/NOITE E SPRITES
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
  gap:18px;
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
  padding:24px 26px;
  display:grid;grid-template-columns:1.1fr .9fr;align-items:center;gap:20px;
  box-shadow:0 6px 0 #1b302d;
}
.neo-hero-grid{
  position:absolute;inset:0;z-index:-1;opacity:.14;
  background-image:linear-gradient(rgba(255,240,166,.25) 1px,transparent 1px),linear-gradient(90deg,rgba(255,240,166,.25) 1px,transparent 1px);
  background-size:24px 24px;
}
.neo-kicker,.neo-section-heading>div>span{font-size:10px;font-weight:900;letter-spacing:2px;color:#f5c451}
.neo-hero h1{font-size:clamp(26px,3.6vw,42px);line-height:1.08;margin:8px 0;color:#fff8e3;text-shadow:3px 3px 0 #1c383a}
.neo-hero h1 em{font-style:normal;color:#b2de8e}
.neo-hero-copy>p{color:#eef0d8;max-width:540px;line-height:1.6;font-size:13px;margin:0}
.neo-hero-actions{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-top:16px}
.neo-hero-actions button,.neo-empty-inventory button,.neo-minigame-actions button{
  border:2px solid #fff0a6;border-radius:6px;
  background:linear-gradient(180deg,#f5c451,#cf9132);
  color:#253028;padding:9px 14px;font-weight:900;cursor:pointer;
  box-shadow:0 3px 0 #7d5136;font-size:12px;
}
.neo-hero-actions span{font-size:11px;color:#e5ebd0}

.neo-hero-right{display:flex;flex-direction:column;gap:9px;align-items:flex-end}
.neo-life-sync-card{max-width:360px;padding:10px 13px;border:1px solid rgba(126,194,114,.65);border-radius:9px;background:rgba(16,39,36,.88);display:flex;flex-direction:column;gap:4px;color:#e8efda;font-size:10px;line-height:1.45}
.neo-life-sync-card strong{color:#9ee59a;font-size:10px;letter-spacing:.06em}
.neo-life-sync-card .neo-life-sync-reaction{color:#fff0a6}

.neo-wallet{
  background:#233b38;border:2px solid #a8734d;border-radius:8px;
  padding:11px 15px;display:flex;flex-direction:column;gap:3px;width:100%;max-width:360px;
  box-shadow:0 4px 0 #152624;
}
.neo-wallet span{font-size:8px;letter-spacing:1.4px;color:#c7b3eb;font-weight:800}
.neo-wallet strong{font-size:16px;color:#f5c451}
.neo-wallet small{font-size:10px;color:#cbd6be}

.neo-time-switcher{display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end;align-items:center}
.neo-clock-pill{
  padding:5px 9px;border-radius:5px;background:#132423;border:1px solid #f5c451;
  color:#fff0a6;font-size:11px;font-weight:900;font-variant-numeric:tabular-nums;
}
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
  padding:11px 15px;border:2px solid #f5c451;border-radius:6px;
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

/* BARRA DE CLIMA, EVENTOS E TELEMETRIA DE LOJAS / MORADORES */
.neo-world-toolbar{
  display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;
  padding:10px 14px;border:2px solid #7d5136;border-radius:6px;
  background:#27403b;color:#f5e9c6;font-size:11px;font-weight:800;
}
.neo-weather-controls,.neo-toolbar-btns{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.neo-weather-controls button{
  border:1px solid #6b856b;border-radius:4px;padding:5px 8px;
  background:#1c302e;color:#dce5cf;font-size:10px;font-weight:800;cursor:pointer;
}
.neo-weather-controls button.active{background:#388e99;border-color:#fff0a6;color:#fff}
.neo-world-toolbar .neo-toolbar-btns button,.neo-interior-header button{
  border:2px solid #fff0a6;border-radius:5px;padding:6px 11px;
  background:#cf9132;color:#232e26;font-weight:900;cursor:pointer;font-size:10px;
}

.neo-city-telemetry{
  display:flex;flex-direction:column;gap:8px;padding:10px 12px;
  border:2px solid #48635a;border-radius:7px;background:#1b2f2d;font-size:11px;
}
.neo-telemetry-group{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.neo-telemetry-group b{color:#f5c451;font-size:10px;margin-right:4px}
.neo-store-pill,.neo-npc-pill{
  border:1px solid #5c755d;border-radius:4px;padding:3px 7px;
  background:#233d3a;color:#eef4e2;font-size:10px;font-weight:700;cursor:pointer;
}
.neo-store-pill.open{border-color:#7ec272;color:#b2de8e}
.neo-store-pill.closed{border-color:#cf9132;color:#f5c451;opacity:.85}
.neo-npc-pill:hover,.neo-store-pill:hover{border-color:#fff0a6}

/* MAPA 16-BIT, ILUMINAÇÃO DINÂMICA E CENÁRIO WEBP */
.neo-world-scroll{
  overflow:auto;padding:12px;border:3px solid #53618f;border-radius:8px;
  background:radial-gradient(ellipse at 50% 40%,#20264d,#101629 72%);
  box-shadow:inset 0 0 24px rgba(61,104,255,.18);
}
.neo-world-map{
  position:relative;display:grid;
  grid-template-columns:repeat(20,50.4px);
  grid-template-rows:repeat(12,47.25px);
  gap:0;width:1008px;height:567px;aspect-ratio:1672 / 941;margin:auto;
  border:4px solid #52618f;border-radius:4px;
  background-color:#10152d;
  background-image:url('/maps/cyberpunk-metropolis.webp');
  background-size:100% 100%;
  background-position:center;
  background-repeat:no-repeat;
  box-shadow:0 0 0 3px #171d3c,0 0 28px rgba(70,105,255,.28);
  image-rendering:pixelated;
  transition:filter .5s ease,box-shadow .5s ease;
  overflow:hidden;
}
.neo-world-map.period-morning{filter:brightness(1.04) saturate(1.06)}
.neo-world-map.period-afternoon{filter:brightness(1) saturate(1)}
.neo-world-map.period-sunset{filter:sepia(.2) saturate(1.18) brightness(.94)}
.neo-world-map.period-night{
  filter:brightness(.76) contrast(1.08) hue-rotate(-8deg);
  box-shadow:0 0 0 3px #171d3c,0 0 36px rgba(105,155,255,.38);
}
.neo-world-map.weather-rain{filter:brightness(.88) saturate(.92) contrast(1.05)}
.neo-world-map.weather-mist{filter:brightness(.94) saturate(.82) contrast(.94)}
.neo-world-map.weather-storm{filter:brightness(.74) contrast(1.14) saturate(.88)}
.neo-world-map.lightning-flash{filter:brightness(1.48) contrast(1.18)!important}

/* CAMADA DE TRÂNSITO, VLT, DRONES E BRILHOS DE EVOLUÇÃO */
.neo-city-life{position:absolute;inset:0;pointer-events:none;z-index:4}
.neo-transit-stop-marker{
  position:absolute;transform:translate(-50%,-100%);
  padding:2px 6px;border-radius:4px;
  background:rgba(16,28,44,.88);border:1px solid #6ec2c9;
  color:#b6ebed;font-size:9px;font-weight:900;white-space:nowrap;
  box-shadow:0 2px 4px rgba(0,0,0,.45);
}
.neo-public-transit{
  position:absolute;display:flex;align-items:center;gap:2px;
  transition:left .26s linear;z-index:5;
}
.neo-vlt-car{
  width:28px;height:14px;border-radius:3px;
  background:linear-gradient(180deg,#6ec2c9,#236373);
  border:1.5px solid #fff0a6;
  display:flex;align-items:center;justify-content:center;
  font-size:9px;box-shadow:0 2px 5px rgba(0,0,0,.5);
}
.neo-vlt-car.trailer{background:linear-gradient(180deg,#957bc7,#463669)}
.neo-public-transit.stopped .neo-vlt-car{border-color:#7ec272}
.neo-public-transit b{
  margin-left:4px;padding:1px 4px;border-radius:3px;
  background:#234736;border:1px solid #7ec272;
  color:#b2de8e;font-size:8px;letter-spacing:.5px;
}

.neo-vehicle-car{
  position:absolute;width:24px;height:11px;border-radius:3px;
  background:var(--veh-color,#6ec2c9);
  border:1.5px solid #16232b;
  box-shadow:0 2px 4px rgba(0,0,0,.5);
  transition:left .26s linear;
}
.neo-vehicle-car::before{
  content:"";position:absolute;top:2px;left:5px;right:5px;height:4px;
  background:#1c313d;border-radius:1px;
}
.neo-vehicle-car.east::after{
  content:"";position:absolute;right:-3px;top:3px;width:4px;height:5px;
  background:#fff0a6;border-radius:50%;box-shadow:4px 0 8px #f5c451;
}
.neo-vehicle-car.west::after{
  content:"";position:absolute;left:-3px;top:3px;width:4px;height:5px;
  background:#fff0a6;border-radius:50%;box-shadow:-4px 0 8px #f5c451;
}

.neo-vehicle-bike{
  position:absolute;font-size:13px;line-height:1;
  transition:left .26s linear;
  filter:drop-shadow(0 2px 2px rgba(0,0,0,.55));
}
.neo-vehicle-bike.bike-east{transform:scaleX(-1)}

.neo-city-drone-unit{
  position:absolute;font-size:14px;line-height:1;
  transition:left .26s linear,top .26s linear;
  filter:drop-shadow(0 4px 6px rgba(110,194,201,.65));
}

.neo-city-glow{
  position:absolute;border-radius:50%;pointer-events:none;
  background:radial-gradient(circle,rgba(245,196,81,.22),transparent 68%);
}
.city-glow-one{width:220px;height:220px;left:380px;top:170px}
.city-glow-two{width:240px;height:240px;left:640px;top:110px;background:radial-gradient(circle,rgba(126,194,114,.2),transparent 68%)}
.city-glow-three{width:280px;height:280px;left:150px;top:310px;background:radial-gradient(circle,rgba(199,179,235,.22),transparent 68%)}

/* CAMADA DE CLIMA E PARTÍCULAS AMBIENTAIS */
.neo-weather-overlay{position:absolute;inset:0;pointer-events:none;z-index:8;overflow:hidden}
.neo-rain-drop{
  position:absolute;top:-16px;width:1.5px;height:14px;
  background:linear-gradient(180deg,transparent,#b6ebed);
  opacity:.72;animation:neoRainFall .85s linear infinite;
}
@keyframes neoRainFall{
  0%{transform:translate(0,0) rotate(12deg)}
  100%{transform:translate(-18px,590px) rotate(12deg)}
}
.neo-ambient-mote{
  position:absolute;font-size:11px;color:#fff0a6;
  text-shadow:0 0 6px #f5c451;
  animation:neoMoteFloat 4.2s ease-in-out infinite alternate;
}
.neo-ambient-mote.lantern{font-size:14px}
@keyframes neoMoteFloat{
  0%{transform:translate(0,0) scale(.9);opacity:.55}
  100%{transform:translate(12px,-16px) scale(1.12);opacity:1}
}

/* TILES DO MUNDO, PORTAS, CANTEIROS E ENTIDADES */
.neo-world-tile{
  position:relative;width:100%;height:100%;
  display:flex;align-items:center;justify-content:center;
}
.neo-world-tile.city-road{background:rgba(20,30,48,.12)}
.neo-world-tile.city-water{background:rgba(22,61,74,.14)}

.neo-building-hours-badge{
  position:absolute;top:4px;left:4px;z-index:7;
  padding:3px 7px;border-radius:4px;
  border:1.5px solid #fff0a6;
  background:rgba(18,32,42,.92);color:#fff8e3;
  font-size:9px;font-weight:900;white-space:nowrap;cursor:pointer;
  box-shadow:0 2px 6px rgba(0,0,0,.55);
}
.neo-building-hours-badge.open{border-color:#7ec272;color:#b2de8e}
.neo-building-hours-badge.closed{border-color:#cf9132;color:#f5c451}

.neo-plot-btn{
  position:relative;border:0;padding:0;background-color:transparent;
  cursor:pointer;z-index:3;border-radius:4px;
  box-shadow:0 2px 4px rgba(0,0,0,.45);
}
.neo-plot-btn.ready{outline:2px solid #fff0a6;animation:neoDoorPulse 1.3s ease-in-out infinite}
.neo-harvest-badge{
  position:absolute;top:-8px;right:-6px;font-size:12px;
  filter:drop-shadow(0 1px 2px #000);
}

.neo-spot-tag{
  z-index:5;padding:3px 6px;border-radius:4px;
  border:1.5px solid #6ec2c9;background:rgba(16,38,48,.92);
  color:#b6ebed;font-size:9px;font-weight:900;white-space:nowrap;cursor:pointer;
}

.neo-door{
  width:28px;height:24px;border-radius:4px;
  border:1.5px solid #fff0a6;background:rgba(245,196,81,.28);
  color:#fff0a6;display:flex;align-items:center;justify-content:center;
  cursor:pointer;z-index:5;animation:neoDoorPulse 1.6s ease-in-out infinite;
}
.neo-door-marker{font-size:10px;line-height:1;text-shadow:0 1px 3px #000}
@keyframes neoDoorPulse{
  0%,100%{transform:translateY(0);box-shadow:0 0 6px rgba(245,196,81,.45)}
  50%{transform:translateY(-2px);box-shadow:0 0 12px rgba(255,240,166,.85)}
}

.neo-map-resident{
  position:relative;z-index:6;border:0;padding:0;background:transparent;
  display:flex;flex-direction:column;align-items:center;cursor:pointer;
  transition:transform .25s ease;
}
.neo-map-resident:hover{transform:translateY(-2px) scale(1.05)}
.neo-npc-activity-chip{
  position:absolute;top:-12px;right:-6px;font-size:11px;
  background:rgba(16,28,34,.9);border:1px solid rgba(255,240,166,.55);
  border-radius:999px;padding:1px 3px;line-height:1;
}
.neo-resident-sprite.neo-authentic-sprite{
  width:34px;height:46px;display:block;
  background-size:400% 100%;background-repeat:no-repeat;
  image-rendering:pixelated;
  filter:drop-shadow(0 3px 3px rgba(0,0,0,.6));
}
.neo-map-resident b{
  margin-top:-4px;padding:1px 5px;border-radius:3px;
  background:rgba(16,26,34,.9);border:1px solid rgba(199,179,235,.55);
  color:#fff8e3;font-size:8px;font-weight:900;letter-spacing:.3px;
}

.neo-ambient-citizen{
  position:relative;z-index:5;border:0;padding:0;background:transparent;
  display:flex;flex-direction:column;align-items:center;cursor:pointer;
}
.neo-cit-status{font-size:9px;margin-bottom:1px;filter:drop-shadow(0 1px 2px #000)}
.neo-cit-body{
  position:relative;width:14px;height:20px;border-radius:3px;
  background:var(--cit-coat,#6ec2c9);border:1.5px solid #162228;
  box-shadow:0 2px 3px rgba(0,0,0,.55);
}
.neo-cit-body::before{
  content:"";position:absolute;top:-5px;left:1px;width:9px;height:5px;
  border-radius:2px;background:var(--cit-hat,#f5c451);border:1px solid #162228;
}
.neo-ambient-citizen small{
  margin-top:1px;padding:0 4px;border-radius:2px;
  background:rgba(15,24,30,.82);color:#dce5cf;font-size:7.5px;font-weight:800;
}

.neo-npc-drone{
  z-index:6;pointer-events:none;
  filter:drop-shadow(0 3px 5px rgba(110,194,201,.7));
}
.neo-player-sprite{
  z-index:7;pointer-events:none;display:block;
  filter:drop-shadow(0 3px 4px rgba(0,0,0,.65));
}
.neo-player-sprite.interior{position:relative;z-index:6}

/* BALÃO DE DIÁLOGO NO MAPA */
.neo-world-bubble{
  display:flex;align-items:flex-start;gap:14px;
  padding:14px 16px;border:2px solid #f5c451;border-radius:8px;
  background:#1c312f;box-shadow:0 6px 0 #122120;
}
.neo-bubble-portrait{
  width:54px;height:68px;flex:0 0 auto;border-radius:6px;
  background:#152524;border:1.5px solid #6ec2c9;
  display:flex;align-items:center;justify-content:center;overflow:hidden;
}
.neo-bubble-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:8px}
.neo-bubble-header{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.neo-bubble-header span{font-size:10px;font-weight:900;letter-spacing:1px;color:#6ec2c9}
.neo-bubble-header b{font-size:11px;color:#f5c451}
.neo-memory-callout{
  padding:6px 10px;border-radius:5px;
  background:rgba(70,54,105,.36);border:1px solid rgba(199,179,235,.4);
  color:#e6dcfa;font-size:11px;
}
.neo-bubble-body p{margin:0;color:#f6f1dc;font-size:13px;line-height:1.5}
.neo-branch-choices{display:flex;gap:8px;flex-wrap:wrap}
.neo-branch-choices button{
  border:1.5px solid #7ec272;border-radius:5px;padding:7px 11px;
  background:#23443b;color:#eef7df;font-size:11px;font-weight:800;cursor:pointer;
}
.neo-branch-choices button:hover{background:#2f594d;border-color:#fff0a6}
.neo-close-x{
  border:0;background:transparent;color:#cbd5bd;font-size:22px;line-height:1;cursor:pointer;
}

/* CONTROLES D-PAD E INTERAÇÃO */
.neo-world-controls{
  display:flex;align-items:center;gap:16px;flex-wrap:wrap;
  padding:12px 14px;border:2px solid #48635a;border-radius:8px;background:#1b2f2d;
}
.neo-dpad{display:flex;flex-direction:column;align-items:center;gap:4px}
.neo-dpad div{display:flex;gap:4px}
.neo-dpad button{
  width:36px;height:34px;border:2px solid #6b856b;border-radius:5px;
  background:#243e3b;color:#fff8e3;font-size:13px;font-weight:900;cursor:pointer;
}
.neo-dpad button:active{background:#388e99;border-color:#fff0a6}
.neo-interact-btn{
  border:2px solid #fff0a6;border-radius:6px;padding:10px 15px;
  background:linear-gradient(180deg,#388e99,#236373);
  color:#fff8e3;font-size:12px;font-weight:900;cursor:pointer;
  box-shadow:0 3px 0 #163d4a;
}
.neo-world-controls p{margin:0;flex:1;min-width:220px;color:#c5d1b8;font-size:12px;line-height:1.5}

/* INTERIORES DE PRÉDIOS E MINHA CASA */
.neo-interior{
  display:flex;flex-direction:column;gap:14px;
  padding:16px;border:2px solid #7d5136;border-radius:8px;background:#1b2f2d;
}
.neo-interior-header{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.neo-interior-header span{font-size:11px;font-weight:900;letter-spacing:1.5px;color:#f5c451}
.neo-interior-room{display:flex;flex-direction:column;gap:14px}
.neo-interior-map{
  display:grid;
  grid-template-columns:repeat(10,52.8px);
  grid-template-rows:repeat(6,52.8px);
  width:fit-content;max-width:100%;margin:0 auto;overflow:auto;
  border:4px solid #523422;border-radius:6px;
  box-shadow:0 6px 0 #142220;
}
.neo-interior-tile{
  position:relative;display:flex;align-items:center;justify-content:center;
}
.neo-interior-tile.wall{filter:brightness(.78)}
.neo-interior-tile.grid-editable{outline:1px dashed rgba(255,240,166,.38);cursor:pointer}
.neo-interior-tile.grid-editable:hover{outline:2px solid #fff0a6}
.neo-placed-furniture{display:block;pointer-events:none;z-index:3}
.neo-station-btn{
  z-index:4;padding:3px 5px;border-radius:4px;
  border:1.5px solid #6ec2c9;background:rgba(16,36,46,.92);
  color:#fff8e3;display:flex;flex-direction:column;align-items:center;
  font-size:8px;cursor:pointer;text-align:center;line-height:1.15;
}
.neo-station-btn small{color:#7ec272;font-size:7px}
.neo-interior-door{
  z-index:5;border:1.5px solid #fff0a6;border-radius:4px;
  background:#523422;padding:3px 6px;font-size:14px;cursor:pointer;
}

.neo-deco-dock{
  display:flex;flex-direction:column;gap:10px;
  padding:12px 14px;border:2px solid #a8734d;border-radius:6px;background:#243a36;
}
.neo-deco-dock-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;font-size:12px}
.neo-deco-dock-head button{
  border:1.5px solid #fff0a6;border-radius:4px;padding:5px 10px;
  background:#388e99;color:#fff;font-size:11px;font-weight:800;cursor:pointer;
}
.neo-deco-items{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.neo-deco-items button{
  border:1.5px solid #6b856b;border-radius:5px;padding:6px 10px;
  background:#1c302e;color:#eef4e2;font-size:11px;font-weight:800;cursor:pointer;
}
.neo-deco-items button.active{background:#cf9132;border-color:#fff0a6;color:#232e26}
.neo-deco-items small{color:#c5d1b8;font-size:12px}

.neo-building-sync-form{
  display:flex;flex-direction:column;gap:8px;
  padding:12px 14px;border:2px solid #388e99;border-radius:6px;background:#172b2e;
}
.neo-building-sync-form label{font-size:12px;font-weight:800;color:#b6ebed}
.neo-building-sync-form div{display:flex;gap:8px;flex-wrap:wrap}
.neo-building-sync-form input{
  flex:1;min-width:200px;padding:8px 11px;border-radius:5px;
  border:1.5px solid #6ec2c9;background:#102022;color:#fff8e3;font-size:13px;
}
.neo-building-sync-form button{
  border:2px solid #fff0a6;border-radius:5px;padding:8px 14px;
  background:#7ec272;color:#17281e;font-weight:900;font-size:12px;cursor:pointer;
}

/* MORADORES & MODAL DE HISTÓRIA */
.neo-resident-grid{
  display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:12px;
}
.neo-resident-card{
  display:grid;grid-template-columns:56px 1fr auto;align-items:center;gap:12px;
  padding:14px;border:2px solid #4c6654;border-radius:8px;background:#1f3431;
}
.neo-resident-avatar{
  width:52px;height:62px;border-radius:6px;background:#152524;
  border:1.5px solid #6b856b;display:flex;align-items:center;justify-content:center;
  font-size:26px;overflow:hidden;
}
.neo-resident-card span{font-size:10px;font-weight:800;color:#f5c451}
.neo-resident-card h3{margin:2px 0;font-size:16px;color:#fff8e3}
.neo-resident-card p{margin:0 0 4px;font-size:12px;color:#cbd5bd}
.neo-resident-card small{display:block;font-size:10px;color:#9eb39c;line-height:1.4}
.neo-card-memory{margin-top:4px;color:#c7b3eb!important}
.neo-resident-card button{
  border:2px solid #fff0a6;border-radius:5px;padding:8px 11px;
  background:#388e99;color:#fff;font-size:11px;font-weight:900;cursor:pointer;
}

.neo-dialogue{
  position:relative;padding:18px;border:2px solid #f5c451;border-radius:8px;
  background:#1b2f2d;display:flex;flex-direction:column;gap:12px;
}
.neo-dialogue-close{
  position:absolute;top:12px;right:14px;border:0;background:none;
  color:#cbd5bd;font-size:22px;cursor:pointer;
}
.neo-dialogue-top{display:flex;align-items:center;gap:14px}
.neo-dialogue-top span{font-size:10px;font-weight:900;letter-spacing:1px;color:#6ec2c9}
.neo-dialogue-top h3{margin:3px 0 0;font-size:20px;color:#fff8e3}
.neo-dialogue>p{margin:0;font-size:13px;line-height:1.55;color:#eef4e2}

.neo-story-unlocks{display:flex;flex-direction:column;gap:8px;margin-top:4px}
.neo-story-unlocks h4{margin:6px 0 2px;font-size:12px;letter-spacing:.8px;color:#f5c451;text-transform:uppercase}
.neo-story-chap{
  padding:10px 12px;border-radius:6px;
  border:1.5px solid #5c755d;background:#233b38;
}
.neo-story-chap.locked{opacity:.65;border-style:dashed}
.neo-story-chap b{display:block;font-size:12px;color:#fff0a6;margin-bottom:3px}
.neo-story-chap p{margin:0;font-size:12px;color:#dce5cf;line-height:1.45}

/* MISSÕES E DISTRITOS */
.neo-quests-grid,.neo-district-grid,.neo-shop-grid,.neo-festivals-grid,.neo-collections-grid{
  display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:12px;
}
.neo-quest-card,.neo-district,.neo-shop-item,.neo-festival-card,.neo-col-box{
  padding:15px;border:2px solid #4c6654;border-radius:8px;background:#1f3431;
  display:flex;flex-direction:column;gap:9px;
}
.neo-quest-card.claimed{opacity:.72;border-color:#7ec272}
.neo-quest-card>span{font-size:10px;font-weight:900;letter-spacing:1px;color:#6ec2c9}
.neo-quest-card h3,.neo-district h3,.neo-shop-item h3,.neo-festival-card h3{margin:0;font-size:16px;color:#fff8e3}
.neo-quest-card p,.neo-district p,.neo-shop-item p,.neo-festival-card p{margin:0;font-size:12px;color:#cbd5bd;line-height:1.45}

.neo-district-progress{display:flex;flex-direction:column;gap:4px}
.neo-district-progress div{display:flex;justify-content:space-between;font-size:11px;color:#dce5cf}
.neo-district-progress i{display:block;height:7px;border-radius:999px;background:#132220;overflow:hidden}
.neo-district-progress u{display:block;height:100%;background:linear-gradient(90deg,#388e99,#7ec272,#f5c451)}

.neo-quest-footer{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:auto}
.neo-quest-footer small{font-size:11px;font-weight:800;color:#f5c451}
.neo-quest-footer button,.neo-shop-item button,.neo-festival-card button{
  border:2px solid #fff0a6;border-radius:5px;padding:7px 11px;
  background:#388e99;color:#fff;font-size:11px;font-weight:900;cursor:pointer;
}
.neo-quest-footer button:disabled,.neo-shop-item button:disabled,.neo-festival-card button:disabled{
  opacity:.5;cursor:not-allowed;border-color:#6b856b;background:#243835;
}

.neo-district-top{display:flex;align-items:center;justify-content:space-between}
.neo-district-icon{font-size:24px}
.neo-status{
  padding:3px 7px;border-radius:4px;font-size:9px;font-weight:900;
  background:#234736;border:1px solid #7ec272;color:#b2de8e;
}
.neo-district.locked{opacity:.78}
.neo-district.locked .neo-status{background:#3b311c;border-color:#cf9132;color:#f5c451}

/* LOJA / MERCADO NEON */
.neo-item-art{
  display:flex;align-items:center;justify-content:space-between;
  padding:10px 12px;border-radius:6px;background:#162725;font-size:26px;
}
.neo-item-art span{font-size:10px;font-weight:900;letter-spacing:.8px;color:#c7b3eb;text-transform:uppercase}
.neo-shop-item>div:last-child{
  display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:auto;
}
.neo-shop-item b{font-size:13px;color:#f5c451}

/* INVENTÁRIO */
.neo-inventory-grid{
  display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;
}
.neo-inv-card{
  display:grid;grid-template-columns:40px 1fr auto;align-items:center;gap:12px;
  padding:12px 14px;border:2px solid #4c6654;border-radius:8px;background:#1f3431;
}
.neo-inv-card>span{font-size:24px;text-align:center}
.neo-inv-card b{display:block;font-size:13px;color:#fff8e3}
.neo-inv-card small{display:block;font-size:11px;color:#cbd5bd;line-height:1.35}
.neo-inv-card i{font-style:normal;color:#7ec272;font-weight:900}
.neo-equip-btn{
  border:1.5px solid #fff0a6;border-radius:5px;padding:6px 10px;
  background:#388e99;color:#fff;font-size:11px;font-weight:900;cursor:pointer;
}
.neo-equip-btn.equipped{background:#7ec272;color:#17281e}

.neo-empty-inventory{
  padding:30px 20px;border:2px dashed #5c755d;border-radius:8px;
  background:#1b2f2d;text-align:center;display:flex;flex-direction:column;align-items:center;gap:8px;
}
.neo-empty-inventory span{font-size:32px}
.neo-empty-inventory h3{margin:0;color:#fff8e3}
.neo-empty-inventory p{margin:0 0 6px;color:#cbd5bd;font-size:13px}

/* MINIJOGOS & ARCADE 88 */
.neo-minigame-panel{
  padding:18px;border:2px solid #53618f;border-radius:8px;
  background:#192836;display:flex;flex-direction:column;gap:12px;
}
.neo-minigame-panel h3{margin:0;font-size:18px;color:#fff8e3}
.neo-minigame-panel p{margin:0;font-size:13px;color:#cbd5bd}
.neo-minigame-actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap}

.neo-fishing-meter{
  position:relative;height:28px;max-width:440px;border-radius:999px;
  background:#0f1d26;border:2px solid #388e99;overflow:hidden;
}
.neo-fishing-zone{
  position:absolute;top:0;bottom:0;left:50%;transform:translateX(-50%);
  background:rgba(110,194,201,.36);border-left:2px solid #7ec272;border-right:2px solid #7ec272;
}
.neo-fishing-needle{
  position:absolute;top:2px;bottom:2px;width:8px;margin-left:-4px;
  border-radius:4px;background:#f5c451;box-shadow:0 0 8px #fff0a6;
}
.neo-bite-btn{background:linear-gradient(180deg,#7ec272,#376e4d)!important;color:#fff!important}

.neo-catch-card{
  display:flex;align-items:center;gap:12px;padding:12px;
  border-radius:6px;background:#163d4a;border:1.5px solid #6ec2c9;
}
.neo-catch-card span{font-size:28px}
.neo-catch-card b{color:#fff0a6;font-size:14px}
.neo-catch-card p{margin:2px 0 0;font-size:12px;color:#e6f4f5}

.neo-race-track{
  display:grid;grid-template-columns:repeat(3,1fr);
  height:230px;max-width:340px;border:3px solid #6ec2c9;border-radius:8px;
  background:linear-gradient(180deg,#12202c,#1c3442);overflow:hidden;
}
.neo-race-lane{position:relative;border-right:1px dashed rgba(110,194,201,.3)}
.neo-race-lane:last-child{border-right:0}
.neo-race-entity{position:absolute;left:50%;transform:translateX(-50%);font-size:20px}
.neo-race-player{position:absolute;bottom:12px;left:50%;transform:translateX(-50%);font-size:24px}

.neo-circuit-grid{
  display:grid;grid-template-columns:repeat(3,88px);gap:10px;
}
.neo-circuit-node{
  height:78px;border-radius:8px;border:2px solid #5c755d;
  background:#13242b;color:#dce5cf;font-size:22px;font-weight:900;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer;
}
.neo-circuit-node small{font-size:10px}
.neo-circuit-node.state-1{border-color:#6ec2c9;color:#6ec2c9}
.neo-circuit-node.state-2{border-color:#f5c451;background:#3a3119;color:#fff0a6}

.neo-arcade-card{
  display:grid;grid-template-columns:1.1fr .9fr;gap:16px;
  padding:18px;border:2px solid #6b5399;border-radius:8px;background:#1a2234;
}
.neo-arcade-screen{
  padding:16px;border-radius:8px;background:#101624;border:2px solid #957bc7;
  display:flex;flex-direction:column;gap:12px;
}
.neo-arcade-top{display:flex;justify-content:space-between;font-size:11px;font-weight:900;color:#c7b3eb}
.neo-sequence-preview{min-height:34px;display:flex;gap:10px;justify-content:center;align-items:center;font-size:22px;color:#fff0a6}
.neo-pad-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
.neo-pad{
  height:68px;border-radius:8px;border:2px solid rgba(255,255,255,.25);
  font-size:24px;color:#fff;cursor:pointer;background:#222c44;
}
.neo-pad.pad-0{border-color:#6ec2c9}
.neo-pad.pad-1{border-color:#f5c451}
.neo-pad.pad-2{border-color:#7ec272}
.neo-pad.pad-3{border-color:#c7b3eb}
.neo-pad.selected{background:#388e99;border-color:#fff0a6}
.neo-game-start{
  border:2px solid #fff0a6;border-radius:6px;padding:10px;
  background:linear-gradient(180deg,#f5c451,#cf9132);
  color:#232e26;font-weight:900;cursor:pointer;
}
.neo-game-start:disabled{opacity:.5;cursor:not-allowed}
.neo-arcade-info{display:flex;flex-direction:column;gap:8px;justify-content:center}
.neo-arcade-info span{font-size:10px;font-weight:900;letter-spacing:1.5px;color:#f5c451}
.neo-arcade-info h3{margin:0;font-size:20px;color:#fff8e3}
.neo-arcade-info ol{margin:0;padding-left:18px;color:#cbd5bd;font-size:13px;line-height:1.6}

/* FESTIVAIS E COLEÇÕES */
.neo-festival-card.current{border-color:#f5c451;background:#243a33}
.neo-fest-top{display:flex;justify-content:space-between;align-items:center;font-size:10px;font-weight:900;color:#f5c451}
.neo-festival-card small{color:#b2de8e;font-size:11px;font-weight:700}

.neo-col-box h3{margin:0 0 4px;font-size:15px;color:#fff8e3}
.neo-col-chips{display:flex;flex-wrap:wrap;gap:6px}
.neo-col-chips span{
  padding:5px 9px;border-radius:5px;font-size:11px;font-weight:800;
  border:1px solid #5c755d;background:#162725;color:#cbd5bd;
}
.neo-col-chips span.found{border-color:#7ec272;background:#23443b;color:#eef7df}
.neo-col-chips span.missing{opacity:.65}

/* EDITOR DE PERSONAGEM */
.neo-avatar-editor{
  display:grid;grid-template-columns:300px 1fr;gap:16px;
  padding:18px;border:2px solid #4c6654;border-radius:8px;background:#1f3431;
}
.neo-avatar-preview-card{
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;
  padding:16px;border-radius:8px;background:#152524;border:1.5px solid #6b856b;
}
.neo-avatar-turntable{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.neo-turn-box{
  display:flex;flex-direction:column;align-items:center;gap:4px;
  padding:8px 12px;border-radius:6px;background:#1f3431;border:1px solid #4c6654;
}
.neo-turn-box small{font-size:9px;font-weight:900;color:#f5c451}
.neo-download-btn{
  display:inline-block;text-decoration:none;
  border:2px solid #fff0a6;border-radius:6px;padding:8px 12px;
  background:#388e99;color:#fff8e3;font-size:11px;font-weight:900;
}

.neo-avatar-controls{display:flex;flex-direction:column;gap:12px}
.neo-avatar-controls label{display:block;font-size:11px;font-weight:900;color:#f5c451;margin-bottom:5px;text-transform:uppercase;letter-spacing:.8px}
.neo-option-row{display:flex;gap:7px;flex-wrap:wrap}
.neo-option-row button{
  border:1.5px solid #6b856b;border-radius:5px;padding:7px 11px;
  background:#162725;color:#dce5cf;font-size:11px;font-weight:800;cursor:pointer;
}
.neo-option-row button.active{background:#388e99;border-color:#fff0a6;color:#fff}

/* RODAPÉ */
.neo-footer{
  display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;
  padding:14px 16px;border-top:2px solid #4c6654;
  color:#bdc8ae;font-size:11px;
}
.neo-footer span{font-weight:900;color:#f5c451;letter-spacing:.8px}
.neo-footer p{margin:0}

@media (max-width:860px){
  .neo-hero{grid-template-columns:1fr}
  .neo-hero-right{align-items:flex-start}
  .neo-arcade-card,.neo-avatar-editor{grid-template-columns:1fr}
}
`;
