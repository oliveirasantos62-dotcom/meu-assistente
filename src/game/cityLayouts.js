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
    base('player-home','Casa NeoLife','⌂','central',1,1,3,2,{x:2,y:3},0,24,'Residência no centro tecnológico',['Sala','Estúdio','Varanda']),
    base('central-hub','Central de Investigações','◇','central',8,4,3,2,{x:9,y:6},0,24,'Central de Investigações e missões',['Prefeitura','Missões','Terminal']),
    base('university','Centro de Programação','▣','academy',8,0,3,2,{x:9,y:2},7,22,'Laboratório de programação e dados',['Biblioteca','Foco','Arquivo']),
    base('greenhouse','Jardim de Circuitos','♧','green',15,3,3,2,{x:16,y:5},6,19,'Jardim urbano experimental',['Estufa','Laboratório','Sementes']),
    base('innovation-lab','Núcleo de Segurança Digital','⌬','innovation',3,8,3,2,{x:4,y:10},8,21,'Núcleo de inovação',['Protótipos','Projetos','Robótica']),
    base('neon-market','Mercado de Equipamentos','▤','commerce',14,7,3,2,{x:15,y:9},9,21,'Loja de equipamentos e mercado local',['Loja','Ateliê','Trocas']),
  ],
  fortaleza: [
    base('player-home','Casa do Cais','⌂','central',2,2,3,2,{x:3,y:4},0,24,'Residência costeira',['Sala náutica','Estúdio','Deck']),
    base('central-hub','Terminal das Balsas','◇','central',9,4,3,2,{x:10,y:6},0,24,'Terminal marítimo e transporte',['Bolsas','Docas','Mercadorias']),
    base('neon-market','Mercado das Marés','▤','commerce',14,7,3,2,{x:15,y:9},7,22,'Mercado de criaturas aquáticas',['Mariscos','Artesanato','Trocas']),
    base('innovation-lab','Estaleiro Cibernético','⌬','innovation',4,8,3,2,{x:5,y:10},7,20,'Reparos e navegação',['Oficina','Simulador','Docas']),
    base('university','Escola de Navegação','▣','academy',13,1,4,2,{x:14,y:3},7,22,'Centro de formação náutica e tecnologia costeira',['Navegação','Cartografia','Biblioteca']),
    base('greenhouse','Viveiro Marinho','♧','green',6,1,3,2,{x:7,y:3},6,19,'Estufa costeira de espécies bioluminescentes',['Viveiro','Sementes','Pesquisa']),
  ],
  nova: [
    base('player-home','Casa do Jardim','⌂','central',2,2,3,2,{x:3,y:4},0,24,'Casa em vale tecnológico',['Sala','Laboratório','Jardim']),
    base('central-hub','Centro de Conservação','◇','central',9,4,3,2,{x:10,y:6},0,24,'Central de Investigações e missões verde',['Plano','Missões','Dados']),
    base('innovation-lab','Laboratório de Bioengenharia','⌬','innovation',3,8,4,2,{x:5,y:10},6,22,'Pesquisa de espécies e cultivo',['Prototipagem','IA','Teste']),
    base('university','Instituto Ecológico','▣','academy',13,1,4,2,{x:15,y:3},7,21,'Tecnologia e sustentabilidade',['Pesquisa','Estúdio','Biblioteca']),
    base('greenhouse','Grande Estufa','♧','green',6,1,3,2,{x:7,y:3},6,20,'Cultivo inteligente alimentado por luz solar',['Hidroponia','Banco de sementes','Clima']),
    base('neon-market','Mercado Verde','▤','commerce',14,8,3,2,{x:15,y:10},8,22,'Vitrine de invenções e comércio local',['Protótipos','Peças','Trocas']),
  ],
  serra: [
    base('player-home','Abrigo das Dunas','⌂','central',2,1,3,2,{x:3,y:3},0,24,'Cabana acadêmica',['Sala','Estudo','Observação']),
    base('central-hub','Centro de Mineração','◇','central',9,4,3,2,{x:10,y:6},0,24,'Base de exploração e mineração',['Observatório','Arquivo','Auditório']),
    base('university','Escola de Engenharia Industrial','▣','academy',12,0,4,2,{x:14,y:2},6,23,'Treinamento de mineração e segurança',['Torre','Biblioteca','Simulação']),
    base('greenhouse','Oásis Tecnológico','♧','green',15,8,3,2,{x:16,y:10},6,20,'Estufa fria',['Orquídeas','Hidroponia','Banco']),
    base('innovation-lab','Oficina das Dunas','⌬','innovation',3,8,3,2,{x:4,y:10},7,21,'Oficina de equipamentos resistentes ao calor',['Instrumentos','Protótipos','Robótica']),
    base('neon-market','Mercado Industrial','▤','commerce',6,8,3,2,{x:7,y:10},8,20,'Livraria e comércio de equipamentos de pesquisa',['Livros','Equipamentos','Trocas']),
  ],
  litoral: [
    base('player-home','Residência Prisma','⌂','central',2,2,3,2,{x:3,y:4},0,24,'Residência oceânica',['Sala','Observação','Deck']),
    base('central-hub','Laboratório de Energia','◇','central',9,4,3,2,{x:10,y:6},0,24,'Centro de pesquisa e energia',['Radar','Missões','Ponte']),
    base('innovation-lab','Laboratório Prisma','⌬','innovation',13,1,4,2,{x:15,y:3},7,23,'Pesquisa de cristais e energia',['Aquário','Rovers','Simulação']),
    base('neon-market','Mercado de Cristais','▤','commerce',14,7,3,2,{x:15,y:9},8,22,'Comércio espacial',['Equipamentos','Suprimentos','Trocas']),
    base('university','Academia Oceânica','▣','academy',3,1,3,2,{x:4,y:3},7,22,'Centro de estudos dos oceanos e do espaço',['Oceanografia','Astronomia','Biblioteca']),
    base('greenhouse','Jardim de Cristais','♧','green',6,8,3,2,{x:7,y:10},6,20,'Cultivo sustentável de algas e corais artificiais',['Algas','Corais','Pesquisa']),
  ],
  porto: [
    base('player-home','Casa de Mirage','⌂','central',2,2,3,2,{x:3,y:4},0,24,'Moradia industrial',['Sala','Oficina','Pátio']),
    base('central-hub','Museu de Mirage','◇','central',9,4,3,2,{x:10,y:6},0,24,'Centro de arqueologia e exploração',['Carga','Rotas','Pátio']),
    base('innovation-lab','Centro de Escavação','⌬','innovation',3,8,4,2,{x:5,y:10},5,22,'Oficina de exploração e equipamentos',['Metal','Transportes','Controle']),
    base('neon-market','Mercado de Relíquias','▤','commerce',14,7,3,2,{x:15,y:9},6,23,'Comércio industrial',['Ferramentas','Peças','Trocas']),
    base('university','Instituto de Arqueologia','▣','academy',3,1,3,2,{x:4,y:3},7,21,'Formação em logística, energia e manufatura',['Logística','Eletrônica','Biblioteca']),
    base('greenhouse','Reserva Insular','♧','green',7,8,3,2,{x:8,y:10},6,19,'Estufa comunitária que reaproveita calor industrial',['Hidroponia','Composto','Sementes']),
  ],
  ilhada: [
    base('player-home','Residência Aurora','⌂','central',2,2,3,2,{x:3,y:4},0,24,'Cabana sustentável',['Sala','Terraço','Jardim']),
    base('central-hub','Palácio Aurora','◇','central',9,4,3,2,{x:10,y:6},0,24,'Capital e centro de missões',['Festival','Guias','Conservação']),
    base('greenhouse','Arena de Torneios','♧','green',14,1,4,2,{x:16,y:3},5,21,'Centro de eventos globais',['Mangue','Viveiro','Reciclagem']),
    base('neon-market','Mercado da Capital','▤','commerce',14,8,3,2,{x:15,y:10},6,22,'Hospitalidade sustentável',['Alimentos','Artesanato','Dives']),
    base('university','Arquivo Histórico','▣','academy',3,1,3,2,{x:4,y:3},7,21,'História principal e arquivos das regiões',['Biodiversidade','Energia','Biblioteca']),
    base('innovation-lab','Centro de Desafios','⌬','innovation',6,8,3,2,{x:7,y:10},7,20,'Oficina de mobilidade e tecnologias sustentáveis',['Barcos','Reciclagem','Protótipos']),
  ],
};

const CITY_INTERIOR_VARIANTS = {
  neolife: {
    'player-home': 'residence', 'central-hub': 'civic', university: 'laboratory',
    greenhouse: 'garden', 'innovation-lab': 'laboratory', 'neon-market': 'market',
  },
  fortaleza: {
    'player-home': 'residence', 'central-hub': 'workshop', 'neon-market': 'market',
    'innovation-lab': 'workshop', university: 'library', greenhouse: 'greenhouse',
  },
  nova: {
    'player-home': 'residence', 'central-hub': 'garden', 'innovation-lab': 'greenhouse',
    university: 'library', greenhouse: 'greenhouse', 'neon-market': 'market',
  },
  serra: {
    'player-home': 'residence', 'central-hub': 'workshop', university: 'library',
    greenhouse: 'garden', 'innovation-lab': 'workshop', 'neon-market': 'market',
  },
  litoral: {
    'player-home': 'residence', 'central-hub': 'laboratory', 'innovation-lab': 'laboratory',
    'neon-market': 'market', university: 'library', greenhouse: 'laboratory',
  },
  porto: {
    'player-home': 'residence', 'central-hub': 'library', greenhouse: 'greenhouse',
    'neon-market': 'market', university: 'library', 'innovation-lab': 'workshop',
  },
  ilhada: {
    'player-home': 'residence', 'central-hub': 'civic', greenhouse: 'garden',
    'neon-market': 'market', university: 'library', 'innovation-lab': 'workshop',
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

