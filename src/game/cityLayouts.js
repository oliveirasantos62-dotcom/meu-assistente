const BUILDING_VISUALS = {
  'player-home': {
    architecture: 'residence',
    spriteTile: { x: 0, y: 128 },
    interiorArt: '/assets/pixel-art/interiors/residence.png',
  },
  'central-hub': {
    architecture: 'civic',
    spriteTile: { x: 0, y: 64 },
    interiorArt: '/assets/pixel-art/interiors/civic.png',
  },
  university: {
    architecture: 'academy',
    spriteTile: { x: 96, y: 0 },
    interiorArt: '/assets/pixel-art/interiors/library.png',
  },
  greenhouse: {
    architecture: 'greenhouse',
    spriteTile: { x: 192, y: 0 },
    interiorArt: '/assets/pixel-art/interiors/greenhouse.png',
  },
  'innovation-lab': {
    architecture: 'laboratory',
    spriteTile: { x: 192, y: 64 },
    interiorArt: '/assets/pixel-art/interiors/laboratory.png',
  },
  'neon-market': {
    architecture: 'market',
    spriteTile: { x: 96, y: 64 },
    interiorArt: '/assets/pixel-art/interiors/market.png',
  },
};

const base = (id, name, icon, district, x, y, w, h, door, openHour, closeHour, description, rooms) => ({
  id, name, icon, district, x, y, w, h, door, openHour, closeHour, description, rooms,
  ...BUILDING_VISUALS[id],
  isHome: id === 'player-home',
});

const CITY_LAYOUT_DEFINITIONS = {
  neolife: [
    base('player-home','Casa NeoLife','⌂','central',1,1,3,2,{x:2,y:3},0,24,'Residência central cyberpunk',['Sala','Estúdio','Varanda']),
    base('central-hub','Prefeitura NeoLife','◇','central',8,4,3,2,{x:9,y:6},0,24,'Centro administrativo',['Prefeitura','Missões','Terminal']),
    base('university','Universidade Neon','▣','academy',8,0,3,2,{x:9,y:2},7,22,'Campus acadêmico',['Biblioteca','Foco','Arquivo']),
    base('greenhouse','Estufa BioTech','♧','green',15,3,3,2,{x:16,y:5},6,19,'Jardim tecnológico',['Estufa','Laboratório','Sementes']),
    base('innovation-lab','Laboratório Central','⌬','innovation',3,8,3,2,{x:4,y:10},8,21,'Núcleo de inovação',['Protótipos','Projetos','Robótica']),
    base('neon-market','Mercado Neon','▤','commerce',14,7,3,2,{x:15,y:9},9,21,'Mercado da capital',['Loja','Ateliê','Trocas']),
  ],
  fortaleza: [
    base('player-home','Casarão Azul','⌂','central',2,2,3,2,{x:3,y:4},0,24,'Residência costeira',['Sala náutica','Estúdio','Deck']),
    base('central-hub','Câmara Azul','◇','central',9,4,3,2,{x:10,y:6},0,24,'Centro comercial costeiro',['Bolsas','Docas','Mercadorias']),
    base('neon-market','Feira da Fortaleza','▤','commerce',14,7,3,2,{x:15,y:9},7,22,'Feira artesanal',['Mariscos','Artesanato','Trocas']),
    base('innovation-lab','Estaleiro Tecnológico','⌬','innovation',4,8,3,2,{x:5,y:10},7,20,'Reparos e navegação',['Oficina','Simulador','Docas']),
  ],
  nova: [
    base('player-home','Casa Verde','⌂','central',2,2,3,2,{x:3,y:4},0,24,'Casa em vale tecnológico',['Sala','Laboratório','Jardim']),
    base('central-hub','Concórdia Nova','◇','central',9,4,3,2,{x:10,y:6},0,24,'Centro administrativo verde',['Plano','Missões','Dados']),
    base('innovation-lab','Incubadora Aurora','⌬','innovation',3,8,4,2,{x:5,y:10},6,22,'Aceleradora de startups',['Prototipagem','IA','Teste']),
    base('university','Campus da Aurora','▣','academy',13,1,4,2,{x:15,y:3},7,21,'Tecnologia e sustentabilidade',['Pesquisa','Estúdio','Biblioteca']),
  ],
  serra: [
    base('player-home','Refúgio da Serra','⌂','central',2,1,3,2,{x:3,y:3},0,24,'Cabana acadêmica',['Sala','Estudo','Observação']),
    base('central-hub','Observatório Principal','◇','central',9,4,3,2,{x:10,y:6},0,24,'Centro de conhecimento',['Observatório','Arquivo','Auditório']),
    base('university','Instituto das Nuvens','▣','academy',12,0,4,2,{x:14,y:2},6,23,'Universidade elevada',['Torre','Biblioteca','Simulação']),
    base('greenhouse','Jardim de Altitude','♧','green',15,8,3,2,{x:16,y:10},6,20,'Estufa fria',['Orquídeas','Hidroponia','Banco']),
  ],
  litoral: [
    base('player-home','Bangalô Estelar','⌂','central',2,2,3,2,{x:3,y:4},0,24,'Residência oceânica',['Sala','Observação','Deck']),
    base('central-hub','Centro Estelar','◇','central',9,4,3,2,{x:10,y:6},0,24,'Operações oceano-espaço',['Radar','Missões','Ponte']),
    base('innovation-lab','Laboratório Tidal','⌬','innovation',13,1,4,2,{x:15,y:3},7,23,'Pesquisa oceânica',['Aquário','Rovers','Simulação']),
    base('neon-market','Portão Orbital','▤','commerce',14,7,3,2,{x:15,y:9},8,22,'Comércio espacial',['Equipamentos','Suprimentos','Trocas']),
  ],
  porto: [
    base('player-home','Casa Portuária','⌂','central',2,2,3,2,{x:3,y:4},0,24,'Moradia industrial',['Sala','Oficina','Pátio']),
    base('central-hub','Terminal Dourado','◇','central',9,4,3,2,{x:10,y:6},0,24,'Logística da cidade',['Carga','Rotas','Pátio']),
    base('innovation-lab','Oficina Ferrovia','⌬','innovation',3,8,4,2,{x:5,y:10},5,22,'Manufatura pesada',['Metal','Transportes','Controle']),
    base('neon-market','Mercado de Carga','▤','commerce',14,7,3,2,{x:15,y:9},6,23,'Comércio industrial',['Ferramentas','Peças','Trocas']),
  ],
  ilhada: [
    base('player-home','Cabana das Ilhas','⌂','central',2,2,3,2,{x:3,y:4},0,24,'Cabana sustentável',['Sala','Terraço','Jardim']),
    base('central-hub','Mirante Comunitário','◇','central',9,4,3,2,{x:10,y:6},0,24,'Centro turístico',['Festival','Guias','Conservação']),
    base('greenhouse','Bioma Insular','♧','green',14,1,4,2,{x:16,y:3},5,21,'Reserva viva',['Mangue','Viveiro','Reciclagem']),
    base('neon-market','Mercado Solar','▤','commerce',14,8,3,2,{x:15,y:10},6,22,'Hospitalidade sustentável',['Alimentos','Artesanato','Dives']),
  ],
};

const CITY_INTERIOR_VARIANTS = {
  neolife: {
    'player-home': 'residence',
    'central-hub': 'civic',
    university: 'library',
    greenhouse: 'greenhouse',
    'innovation-lab': 'laboratory',
    'neon-market': 'market',
  },
  fortaleza: {
    'player-home': 'residence',
    'central-hub': 'cafe',
    'neon-market': 'market',
    'innovation-lab': 'workshop',
  },
  nova: {
    'player-home': 'residence',
    'central-hub': 'garden',
    'innovation-lab': 'laboratory',
    university: 'library',
  },
  serra: {
    'player-home': 'residence',
    'central-hub': 'library',
    university: 'library',
    greenhouse: 'garden',
  },
  litoral: {
    'player-home': 'residence',
    'central-hub': 'cafe',
    'innovation-lab': 'laboratory',
    'neon-market': 'diner',
  },
  porto: {
    'player-home': 'residence',
    'central-hub': 'workshop',
    'innovation-lab': 'workshop',
    'neon-market': 'market',
  },
  ilhada: {
    'player-home': 'residence',
    'central-hub': 'garden',
    greenhouse: 'greenhouse',
    'neon-market': 'diner',
  },
};

const CITY_HOME_SPRITES = {
  neolife: { x: 0, y: 128 },
  fortaleza: { x: 96, y: 128 },
  nova: { x: 192, y: 128 },
  serra: { x: 192, y: 128 },
  litoral: { x: 96, y: 128 },
  porto: { x: 0, y: 128 },
  ilhada: { x: 96, y: 128 },
};

export const CITY_LAYOUTS = Object.fromEntries(
  Object.entries(CITY_LAYOUT_DEFINITIONS).map(([cityId, buildings]) => [
    cityId,
    buildings.map((building) => ({
      ...building,
      ...(building.isHome ? { spriteTile: CITY_HOME_SPRITES[cityId] } : {}),
      interiorArt: `/assets/pixel-art/interiors/${
        CITY_INTERIOR_VARIANTS[cityId]?.[building.id] ||
        building.interiorArt?.split('/').pop()?.replace('.png', '') ||
        'civic'
      }.png`,
    })),
  ]),
);

