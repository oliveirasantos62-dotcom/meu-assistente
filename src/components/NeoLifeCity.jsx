import React, { useEffect, useMemo, useState } from 'react';

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
  },
  {
    id: 'kai',
    name: 'Kai',
    role: 'Engenheiro de sistemas',
    avatar: '🧑🏽‍💻',
    district: 'innovation',
    focus: 'tasks',
  },
  {
    id: 'maya',
    name: 'Maya',
    role: 'Comerciante do Mercado Neon',
    avatar: '👩🏽‍🔧',
    district: 'commerce',
    focus: 'coins',
  },
  {
    id: 'nox',
    name: 'Nox',
    role: 'Treinador de rotina',
    avatar: '🧑🏻‍🚀',
    district: 'green',
    focus: 'habits',
  },
  {
    id: 'iris',
    name: 'Íris',
    role: 'Bibliotecária de dados',
    avatar: '🧝🏻‍♀️',
    district: 'academy',
    focus: 'reading',
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
    description: 'Salão de jogos e desafios de habilidade.',
    rooms: ['Arena de memória', 'Cabine de ritmo', 'Sala de enigmas'],
  },
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
  const [activeTab, setActiveTab] = useState('city');
  const [selectedResident, setSelectedResident] = useState(null);
  const [notice, setNotice] = useState('');
  const [sequence, setSequence] = useState([]);
  const [playerSequence, setPlayerSequence] = useState([]);
  const [gameState, setGameState] = useState('idle');
  const [gameSeed, setGameSeed] = useState(0);
  const [player, setPlayer] = useState(() => cityWorldStart(data));
  const [insideBuilding, setInsideBuilding] = useState(null);
  const [interiorPlayer, setInteriorPlayer] = useState({ x: 5, y: 4 });
  const [lastDirection, setLastDirection] = useState('down');

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

  const isBlocked = (x, y) => {
    if (x < 0 || x > 17 || y < 0 || y > 11) return true;
    if ((x === 0 || x === 17) && y > 0 && y < 11) return true;
    return WORLD_BUILDINGS.some(
      (building) =>
        x >= building.x &&
        x < building.x + building.w &&
        y >= building.y &&
        y < building.y + building.h,
    );
  };
  const movePlayer = (dx, dy) => {
    if (insideBuilding) {
      setInteriorPlayer((current) => ({
        x: Math.max(0, Math.min(9, current.x + dx)),
        y: Math.max(0, Math.min(5, current.y + dy)),
      }));
      setLastDirection(
        dx < 0 ? 'left' : dx > 0 ? 'right' : dy < 0 ? 'up' : 'down',
      );
      return;
    }
    const nx = Math.max(0, Math.min(17, player.x + dx));
    const ny = Math.max(0, Math.min(11, player.y + dy));
    const blocked =
      isBlocked(nx, ny) &&
      !WORLD_BUILDINGS.some((b) => b.door.x === nx && b.door.y === ny);
    if (!blocked) {
      setPlayer({ x: nx, y: ny });
      setLastDirection(
        dx < 0 ? 'left' : dx > 0 ? 'right' : dy < 0 ? 'up' : 'down',
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
        const nearby = WORLD_BUILDINGS.find(
          (building) =>
            Math.abs(building.door.x - player.x) +
              Math.abs(building.door.y - player.y) <=
            1,
        );
        if (nearby) enterBuilding(nearby);
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
      if (key === 'escape' && insideBuilding) leaveBuilding();
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
    setInteriorPlayer({ x: 5, y: 4 });
    setInsideBuilding(building);
    persistCity({ ...city, world: { ...(city.world || {}), player } });
  };
  const leaveBuilding = () => {
    setInsideBuilding(null);
    persistCity({ ...city, world: { ...(city.world || {}), player } });
  };

  const talkTo = (resident) => {
    const nextTalks = {
      ...talks,
      [resident.id]: (Number(talks[resident.id]) || 0) + 1,
    };
    persistCity({ ...city, talks: nextTalks });
    setSelectedResident({
      ...resident,
      dialogue: residentLine(resident, stats, talks),
    });
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

  const tabs = [
    ['explore', '🕹️ Explorar'],
    ['city', '🌆 Distritos'],
    ['residents', '🧑‍🤝‍🧑 Moradores'],
    ['market', '🛍️ Mercado'],
    ['arcade', '🕹️ Arcade'],
    ['inventory', '🎒 Inventário'],
  ];

  return (
    <main className='neo-city-page'>
      <style>{styles}</style>
      <section className='neo-hero'>
        <div className='neo-hero-grid' />
        <div className='neo-hero-copy'>
          <span className='neo-kicker'>NEO-LIFE // SIMULADOR DE EVOLUÇÃO</span>
          <h1>
            Sua vida real. <em>Sua cidade.</em>
          </h1>
          <p>
            Uma metrópole futurista que cresce com seus estudos, tarefas,
            hábitos e conquistas. Explore, converse com moradores e construa seu
            próprio canto da cidade.
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
          aria-label='Ilustração de uma cidade futurista'
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
              <span>NEO-LIFE // MUNDO ABERTO</span>
              <h2>
                {insideBuilding ? insideBuilding.name : 'Explore a cidade'}
              </h2>
              <p>
                {insideBuilding
                  ? insideBuilding.description
                  : 'Caminhe livremente, descubra os distritos e entre nos prédios. Use WASD ou as setas do teclado; no celular, use os controles direcionais.'}
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
                <span>🌙 NEO-CITY • CICLO NOTURNO</span>
                <span>WASD / SETAS • E PARA ENTRAR</span>
                <button onClick={() => setPlayer({ x: 8, y: 6 })}>
                  Voltar à praça central
                </button>
              </div>
              <div className='neo-world-scroll'>
                <div
                  className='neo-world-map'
                  role='application'
                  aria-label='Mapa explorável da cidade'
                >
                  {Array.from({ length: 18 * 12 }, (_, index) => {
                    const x = index % 18;
                    const y = Math.floor(index / 18);
                    const building = WORLD_BUILDINGS.find(
                      (b) =>
                        x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h,
                    );
                    const door = WORLD_BUILDINGS.find(
                      (b) => b.door.x === x && b.door.y === y,
                    );
                    const isRoad = y === 5 || y === 6 || x === 7 || x === 12;
                    const isPark =
                      (x >= 5 && x <= 6 && y >= 1 && y <= 3) ||
                      (x >= 12 && x <= 13 && y >= 8 && y <= 10);
                    const playerHere = player.x === x && player.y === y;
                    return (
                      <div
                        key={`${x}-${y}`}
                        className={`neo-world-tile ${isRoad ? 'road' : isPark ? 'park' : 'ground'} ${building ? 'building-tile' : ''} ${door ? 'door-tile' : ''} ${playerHere ? 'player-tile' : ''}`}
                        style={{ gridColumn: x + 1, gridRow: y + 1 }}
                      >
                        {building &&
                        x === building.x + 1 &&
                        y === building.y ? (
                          <span className='neo-building-label'>
                            {building.icon} {building.name}
                          </span>
                        ) : null}
                        {isPark && !building && (x + y) % 2 === 0 ? (
                          <span className='neo-tree'>🌳</span>
                        ) : null}
                        {door ? (
                          <button
                            className='neo-door'
                            title={`Entrar em ${door.name}`}
                            onClick={() => enterBuilding(door)}
                          >
                            🚪
                          </button>
                        ) : null}
                        {playerHere ? (
                          <span
                            className={`neo-player ${lastDirection}`}
                            aria-label='Você'
                          >
                            🧑‍🚀
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
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
                <p>
                  Aproxime-se de uma porta e pressione E, ou clique nela. Os
                  locais bloqueados serão liberados conforme seu progresso.
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
                        <span>{building.icon}</span>
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
                <div className='neo-interior-window'>🌃</div>
                <div className='neo-interior-sign'>
                  {insideBuilding.icon}
                  <h3>{insideBuilding.name}</h3>
                  <p>{insideBuilding.description}</p>
                </div>
                <div className='neo-interior-map'>
                  {Array.from({ length: 60 }, (_, index) => {
                    const x = index % 10;
                    const y = Math.floor(index / 10);
                    const stationIndex =
                      y === 2 ? (x < 3 ? 0 : x < 7 ? 1 : 2) : -1;
                    const station =
                      y === 2 && [1, 4, 8].includes(x)
                        ? insideBuilding.rooms[stationIndex]
                        : null;
                    const isPlayer =
                      interiorPlayer.x === x && interiorPlayer.y === y;
                    return (
                      <div
                        key={index}
                        className={`neo-interior-tile ${y === 0 || y === 5 || x === 0 || x === 9 ? 'wall' : ''} ${station ? 'station' : ''} ${isPlayer ? 'occupied' : ''}`}
                        style={{ gridColumn: x + 1, gridRow: y + 1 }}
                      >
                        {station ? (
                          <button
                            onClick={() =>
                              setNotice(
                                `${station}: área preparada para receber atividades e interações.`,
                              )
                            }
                          >
                            <span>{['🖥️', '📚', '🧪'][stationIndex]}</span>
                            <b>{station}</b>
                            <small>Interagir</small>
                          </button>
                        ) : null}
                        {isPlayer ? (
                          <span className={`neo-player ${lastDirection}`}>
                            🧑‍🚀
                          </span>
                        ) : null}
                        {x === 5 && y === 5 ? (
                          <button
                            className='neo-interior-door'
                            onClick={leaveBuilding}
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
                  <span>{resident.avatar}</span>
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
                <div className='neo-resident-avatar'>{resident.avatar}</div>
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
              <div>{selectedResident.avatar}</div>
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

      <footer className='neo-footer'>
        <span>NEO-LIFE / BUILD 01</span>
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
.neo-city-page{--neo-bg:#080d19;--neo-panel:#101a2b;--neo-line:rgba(124,190,220,.16);--neo-text:#eaf5ff;--neo-muted:#8ea4ba;color:var(--neo-text);display:flex;flex-direction:column;gap:24px;padding:4px 0 30px;min-width:0}
.neo-city-page *{box-sizing:border-box}.neo-hero{position:relative;isolation:isolate;overflow:hidden;min-height:300px;border:1px solid rgba(61,226,220,.2);border-radius:24px;background:radial-gradient(ellipse at 78% 35%,rgba(28,111,148,.27),transparent 36%),linear-gradient(115deg,#0c1728 0%,#11182c 56%,#17142d 100%);padding:32px;display:grid;grid-template-columns:1.05fr .95fr;align-items:center;gap:20px;box-shadow:0 20px 60px rgba(0,0,0,.18)}
.neo-hero-grid{position:absolute;inset:0;z-index:-1;opacity:.17;background-image:linear-gradient(rgba(93,214,225,.2) 1px,transparent 1px),linear-gradient(90deg,rgba(93,214,225,.2) 1px,transparent 1px);background-size:38px 38px;mask-image:linear-gradient(90deg,transparent,#000)}
.neo-kicker,.neo-section-heading>div>span,.neo-city-bottom>div>span{font-size:10px;font-weight:900;letter-spacing:2px;color:#55e4dc}.neo-hero h1{font-size:clamp(30px,4vw,48px);line-height:1.08;margin:14px 0;color:#f4fbff;max-width:570px}.neo-hero h1 em{font-style:normal;color:#62e9df;text-shadow:0 0 24px rgba(70,228,218,.24)}.neo-hero-copy>p{color:#a8bbcf;max-width:560px;line-height:1.7;font-size:14px}.neo-hero-actions{display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-top:24px}.neo-hero-actions button,.neo-city-bottom button,.neo-dialogue>button:last-child,.neo-empty-inventory button{border:0;border-radius:10px;background:linear-gradient(100deg,#32cfc5,#68e2c5);color:#061a22;padding:12px 17px;font-weight:900;cursor:pointer}.neo-hero-actions span{font-size:11px;color:#9ab0c4}.neo-city-skyline{height:205px;position:relative;align-self:stretch;overflow:hidden;border-bottom:2px solid rgba(67,229,220,.6);background:linear-gradient(180deg,rgba(15,30,53,.1),rgba(6,13,25,.75));clip-path:polygon(0 0,100% 0,100% 100%,0 100%)}.neo-moon{position:absolute;width:58px;height:58px;border-radius:50%;right:16%;top:8px;background:#a6f4ec;box-shadow:0 0 45px #4dd9d2}.neo-tower{position:absolute;bottom:0;width:18%;border:1px solid rgba(73,225,224,.5);background:repeating-linear-gradient(0deg,transparent 0 13px,rgba(68,224,223,.5) 14px 16px),linear-gradient(90deg,#142f4b,#1b2546);box-shadow:0 0 24px rgba(36,200,202,.12)}.tower-a{height:54%;left:4%;width:22%}.tower-b{height:82%;left:29%;width:20%}.tower-c{height:66%;left:53%;width:18%}.tower-d{height:44%;right:5%;width:20%}.neo-road{position:absolute;bottom:0;left:0;right:0;height:7px;background:#4ee5d9;box-shadow:0 0 20px #4ee5d9}.skyline-label{position:absolute;top:8px;left:8px;font-size:8px;letter-spacing:1.5px;color:#8caec5}.skyline-label b{color:#64f2df;margin-left:7px}.neo-wallet{position:absolute;right:24px;top:22px;background:rgba(5,12,25,.7);border:1px solid rgba(83,222,216,.3);border-radius:12px;padding:10px 14px;display:flex;flex-direction:column;gap:3px;backdrop-filter:blur(8px)}.neo-wallet span{font-size:8px;letter-spacing:1.4px;color:#7fa1b8}.neo-wallet strong{font-size:17px;color:#7af0d8}.neo-wallet small{font-size:9px;color:#9aafc1}
.neo-tabs{display:flex;gap:7px;overflow:auto;padding:5px;border:1px solid var(--neo-line);background:rgba(12,21,36,.8);border-radius:14px}.neo-tabs button{flex:0 0 auto;border:1px solid transparent;border-radius:10px;padding:11px 15px;background:transparent;color:#9eb2c7;font-size:12px;font-weight:800;cursor:pointer}.neo-tabs button.active{background:rgba(60,214,205,.13);border-color:rgba(72,225,214,.3);color:#7cf0df}.neo-notice{padding:13px 16px;border:1px solid rgba(81,220,195,.28);border-radius:12px;background:rgba(27,103,93,.16);color:#baf7e9;font-size:13px;display:flex;justify-content:space-between;gap:10px}.neo-notice button{border:0;background:none;color:inherit;font-size:20px;cursor:pointer}.neo-section-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:18px}.neo-section-heading h2,.neo-city-bottom h2{font-size:23px;margin:7px 0;color:#eaf6ff}.neo-section-heading p,.neo-city-bottom p{margin:0;color:#91a8be;font-size:12px;line-height:1.6}.neo-level-chip{flex:0 0 auto;border:1px solid rgba(77,218,213,.23);background:rgba(42,151,150,.1);border-radius:99px;padding:9px 13px;color:#9cece0;font-size:11px;font-weight:800}
.neo-district-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.neo-district{--accent:#5ce4dc;min-height:220px;padding:18px;border-radius:16px;border:1px solid color-mix(in srgb,var(--accent),transparent 76%);background:linear-gradient(145deg,rgba(20,34,53,.96),rgba(11,19,34,.96));animation:neo-rise .45s both;animation-delay:var(--delay);position:relative;overflow:hidden}.neo-district:after{content:'';position:absolute;width:120px;height:120px;right:-60px;top:-60px;border-radius:50%;background:var(--accent);opacity:.07;filter:blur(4px)}.neo-district.violet{--accent:#bd9aff}.neo-district.green{--accent:#8be5a5}.neo-district.blue{--accent:#7abaff}.neo-district.pink{--accent:#ff9fce}.neo-district.orange{--accent:#ffc27c}.neo-district.locked{filter:saturate(.55);opacity:.72}.neo-district-top{display:flex;align-items:center;justify-content:space-between}.neo-district-icon{font-size:25px}.neo-status{font-size:8px;letter-spacing:1.3px;color:var(--accent);font-weight:900}.neo-district h3{font-size:16px;margin:15px 0 6px}.neo-district p{min-height:38px;font-size:11px;line-height:1.55;color:#93a9bf;margin:0 0 17px}.neo-district-progress>div{display:flex;justify-content:space-between;gap:8px;font-size:9px;color:#8fa6bc;margin-bottom:7px}.neo-district-progress b{color:var(--accent)}.neo-district-progress i{height:5px;display:block;background:rgba(180,210,230,.12);border-radius:9px;overflow:hidden}.neo-district-progress u{height:100%;display:block;text-decoration:none;background:var(--accent);box-shadow:0 0 12px var(--accent);border-radius:9px}.neo-district>small{display:block;color:#839ab0;font-size:9px;margin-top:9px}
.neo-city-bottom{border:1px solid var(--neo-line);border-radius:17px;padding:22px;background:linear-gradient(110deg,rgba(17,39,55,.9),rgba(25,23,48,.9));display:grid;grid-template-columns:.9fr 1.1fr;gap:22px;align-items:center}.neo-city-bottom h2{font-size:19px}.neo-city-bottom button{margin-top:15px;font-size:11px;padding:10px 14px}.neo-resident-preview{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.neo-resident-preview button{margin:0;background:rgba(5,13,27,.55);border:1px solid var(--neo-line);border-radius:12px;padding:12px 7px;display:flex;flex-direction:column;align-items:center;gap:4px;color:#e7f4ff;cursor:pointer}.neo-resident-preview button>span{font-size:25px}.neo-resident-preview b{font-size:11px}.neo-resident-preview small{font-size:8px;color:#8da4ba;text-align:center}
.neo-resident-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.neo-resident-card{display:grid;grid-template-columns:64px 1fr auto;gap:13px;align-items:center;padding:16px;border:1px solid var(--neo-line);border-radius:15px;background:linear-gradient(130deg,#132239,#101a2c)}.neo-resident-avatar{width:58px;height:58px;display:grid;place-items:center;border-radius:15px;background:rgba(65,213,202,.1);font-size:32px}.neo-resident-card>div:nth-child(2)>span{font-size:8px;letter-spacing:1px;color:#5fe4d9}.neo-resident-card h3{margin:4px 0;font-size:16px}.neo-resident-card p{margin:0 0 4px;font-size:10px;color:#a0b4c8}.neo-resident-card small{font-size:9px;color:#7890a8}.neo-resident-card>button{border:1px solid rgba(84,224,213,.3);border-radius:9px;background:rgba(54,194,188,.1);color:#86eee1;padding:9px 11px;font-size:10px;font-weight:800;cursor:pointer}.neo-dialogue{position:relative;border:1px solid rgba(78,224,211,.35);border-radius:17px;padding:22px;background:linear-gradient(120deg,#142b40,#171b35);box-shadow:0 15px 40px rgba(0,0,0,.2)}.neo-dialogue>div{font-size:40px}.neo-dialogue>span{font-size:8px;letter-spacing:1.5px;color:#65e7da}.neo-dialogue h3{margin:6px 0}.neo-dialogue p{color:#c3d6e7;font-size:14px;line-height:1.7;max-width:850px}.neo-dialogue-close{position:absolute;right:14px;top:12px;border:0;background:none;color:#9bb2c8;font-size:22px;cursor:pointer}
.neo-shop-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px}.neo-shop-item{padding:14px;border:1px solid var(--neo-line);border-radius:15px;background:#111d30}.neo-item-art{height:115px;border-radius:11px;background:radial-gradient(circle at 50% 55%,rgba(72,222,207,.15),transparent 58%),linear-gradient(135deg,#172d44,#211e3a);display:grid;place-items:center;position:relative;font-size:48px}.neo-item-art>span{position:absolute;top:8px;right:8px;font-size:8px;color:#a8c4d6;background:rgba(4,12,25,.6);border-radius:20px;padding:5px 8px}.neo-shop-item h3{font-size:14px;margin:13px 0 5px}.neo-shop-item p{height:34px;font-size:10px;color:#91a8bd;line-height:1.5;margin:0 0 13px}.neo-shop-item>div:last-child{display:flex;align-items:center;justify-content:space-between;gap:8px}.neo-shop-item b{font-size:12px;color:#82edda}.neo-shop-item button{border:0;border-radius:8px;background:#56ddc8;color:#09202a;padding:8px 10px;font-size:9px;font-weight:900;cursor:pointer}.neo-shop-item button:disabled{background:#26394a;color:#8194a7;cursor:not-allowed}
.neo-arcade-card{display:grid;grid-template-columns:1.2fr .8fr;gap:15px}.neo-arcade-screen{padding:20px;border:1px solid rgba(93,226,216,.3);border-radius:17px;background:radial-gradient(ellipse at 50% 20%,rgba(39,111,136,.2),transparent 60%),#0b1425}.neo-arcade-top{display:flex;justify-content:space-between;gap:8px;font-size:9px;letter-spacing:1px;color:#73e7dc}.neo-arcade-top b{color:#f0c67d}.neo-sequence-preview{display:flex;justify-content:center;gap:12px;min-height:25px;margin:15px auto -12px}.neo-sequence-preview span{font-size:20px;color:#9cf5e7;text-shadow:0 0 12px #5de3d7}.neo-pad-grid{display:grid;grid-template-columns:repeat(2,92px);justify-content:center;gap:10px;margin:24px auto 17px}.neo-pad{height:82px;border:1px solid rgba(255,255,255,.15);border-radius:16px;font-size:30px;color:#071725;cursor:pointer;transition:transform .12s,filter .12s}.neo-pad:disabled{cursor:default;opacity:.7}.neo-pad:not(:disabled):active{transform:scale(.94)}.pad-0{background:#65e8dc}.pad-1{background:#b59bff}.pad-2{background:#ff9fce}.pad-3{background:#ffd17c}.neo-pad.selected{filter:brightness(1.4);box-shadow:0 0 22px currentColor}.neo-arcade-screen>p{text-align:center;color:#a4b9cc;font-size:11px;min-height:18px}.neo-game-start{display:block;margin:15px auto 0;border:0;border-radius:9px;padding:11px 16px;background:linear-gradient(100deg,#48d9d0,#9ce8bd);color:#0b2026;font-size:11px;font-weight:900;cursor:pointer}.neo-game-start:disabled{opacity:.55;cursor:not-allowed}.neo-arcade-info{padding:22px;border:1px solid var(--neo-line);border-radius:17px;background:#121d30}.neo-arcade-info>span{font-size:9px;letter-spacing:1.5px;color:#6de8db}.neo-arcade-info h3{font-size:18px}.neo-arcade-info ol{padding-left:18px;color:#a7bbce;font-size:11px;line-height:2}.neo-arcade-info small{display:block;border-top:1px solid var(--neo-line);padding-top:12px;color:#7f9ab0;font-size:9px;line-height:1.5}
.neo-inventory-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.neo-inventory-grid article{display:flex;align-items:center;gap:12px;padding:14px;border:1px solid var(--neo-line);border-radius:13px;background:#111d30}.neo-inventory-grid article>span{font-size:28px}.neo-inventory-grid article>div{display:flex;flex-direction:column;gap:3px;flex:1}.neo-inventory-grid b{font-size:12px}.neo-inventory-grid small{font-size:9px;color:#91a8bd}.neo-inventory-grid i{font-style:normal;color:#6de3c8}.neo-empty-inventory{text-align:center;padding:42px 15px;border:1px dashed rgba(103,194,205,.25);border-radius:16px;background:rgba(15,29,47,.55)}.neo-empty-inventory>span{font-size:42px}.neo-empty-inventory h3{margin:10px 0 5px}.neo-empty-inventory p{color:#91a8bd;font-size:11px}.neo-footer{display:flex;justify-content:space-between;align-items:center;gap:10px;border-top:1px solid var(--neo-line);padding-top:15px;color:#7189a1}.neo-footer span{font-size:8px;letter-spacing:1.4px}.neo-footer p{font-size:9px;margin:0;text-align:center}

.neo-world-toolbar{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:12px 15px;border:1px solid rgba(95,220,213,.2);border-radius:12px;background:#101b2b;color:#9edbd7;font-size:10px;letter-spacing:1px}.neo-world-toolbar button,.neo-interior-header button{border:1px solid rgba(95,220,213,.3);border-radius:8px;padding:8px 11px;background:rgba(67,195,185,.12);color:#a7f3e8;cursor:pointer;font-size:10px}.neo-world-scroll{overflow:auto;padding:12px;border:1px solid rgba(94,210,214,.22);border-radius:18px;background:radial-gradient(ellipse at 50% 45%,rgba(32,93,103,.2),transparent 65%),#07111d}.neo-world-map{display:grid;grid-template-columns:repeat(18, minmax(34px,1fr));grid-template-rows:repeat(12,48px);gap:2px;min-width:690px;max-width:1100px;margin:auto;padding:10px;border-radius:12px;background:#101d2a;box-shadow:inset 0 0 45px rgba(0,0,0,.55)}.neo-world-tile{position:relative;display:grid;place-items:center;min-width:0;border-radius:4px;overflow:visible}.neo-world-tile.ground{background:linear-gradient(145deg,#1b3540,#17313b)}.neo-world-tile.road{background:linear-gradient(135deg,#263044,#1c293b);border:1px solid rgba(134,172,198,.08)}.neo-world-tile.park{background:linear-gradient(135deg,#17483f,#123b37);box-shadow:inset 0 0 12px rgba(91,235,173,.08)}.neo-world-tile.building-tile{background:linear-gradient(145deg,#32445c,#182b42);border:1px solid rgba(83,224,222,.55);box-shadow:inset 0 0 15px rgba(64,207,210,.15)}.neo-world-tile.door-tile{background:#263c4b;border:1px dashed #74e9d9}.neo-building-label{position:absolute;z-index:2;top:3px;left:4px;width:max-content;max-width:140px;padding:3px 5px;border-radius:4px;background:rgba(5,13,25,.82);color:#e2fbff;font-size:9px;font-weight:800;white-space:nowrap}.neo-tree{font-size:19px;filter:drop-shadow(0 0 5px rgba(94,244,168,.45))}.neo-door{border:0;background:transparent;font-size:19px;cursor:pointer;filter:drop-shadow(0 0 7px #65e9d9)}.neo-player{font-size:26px;z-index:4;filter:drop-shadow(0 0 9px #5df5eb);animation:neo-player-bob .5s infinite alternate}.neo-player.left{transform:scaleX(-1)}.neo-player.up{filter:drop-shadow(0 0 9px #bd9aff)}.neo-world-controls{display:flex;align-items:center;gap:18px;padding:12px 15px;border:1px solid var(--neo-line);border-radius:14px;background:#101b2b}.neo-world-controls p{margin:0;color:#92a9bd;font-size:11px;line-height:1.6}.neo-dpad{display:flex;flex-direction:column;align-items:center;gap:4px;flex:0 0 auto}.neo-dpad>div{display:flex;gap:4px}.neo-dpad button{width:37px;height:32px;border:1px solid rgba(95,220,213,.3);border-radius:8px;background:#1b3548;color:#b5fff1;font-size:13px;cursor:pointer}.neo-dpad button:active{background:#327c78}.neo-building-list{padding:16px;border:1px solid var(--neo-line);border-radius:15px;background:#101b2b}.neo-building-list h3{margin:0 0 12px;font-size:14px}.neo-building-list>div{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.neo-building-list button{display:grid;grid-template-columns:35px 1fr;align-items:center;text-align:left;gap:2px 8px;padding:11px;border:1px solid rgba(116,190,212,.16);border-radius:10px;background:#14253a;color:#e7f7ff;cursor:pointer}.neo-building-list button:disabled{opacity:.48;cursor:not-allowed}.neo-building-list button>span{grid-row:span 2;font-size:25px}.neo-building-list button b{font-size:10px}.neo-building-list button small{font-size:9px;color:#8caabd}.neo-interior{padding:15px;border:1px solid rgba(97,222,216,.25);border-radius:17px;background:linear-gradient(145deg,#101c30,#15152d)}.neo-interior-header{display:flex;justify-content:space-between;align-items:center;gap:10px;color:#83e9dc;font-size:10px;letter-spacing:1px}.neo-interior-room{position:relative;min-height:390px;margin-top:14px;padding:25px;border:8px solid #35445b;border-radius:13px;background:linear-gradient(180deg,#273d54 0%,#1a2d43 60%,#152338 60%);box-shadow:inset 0 0 45px rgba(0,0,0,.35)}.neo-interior-window{position:absolute;right:25px;top:20px;width:140px;height:75px;display:grid;place-items:center;border:5px solid #53677d;border-radius:5px;background:linear-gradient(135deg,#182c55,#533b78);font-size:35px;box-shadow:0 0 22px rgba(103,105,255,.3)}.neo-interior-sign{text-align:center;max-width:420px;margin:5px auto 24px}.neo-interior-sign>span,.neo-interior-sign{color:#e9f8ff}.neo-interior-sign h3{margin:5px 0;font-size:23px}.neo-interior-sign p{color:#a9bfd1;font-size:11px;line-height:1.5}.neo-interior-furniture{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;max-width:800px;margin:35px auto 0}.neo-interior-furniture article{min-height:115px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;border:1px solid rgba(104,222,218,.3);border-radius:12px;background:linear-gradient(145deg,#1b344b,#15253b);box-shadow:0 10px 18px rgba(0,0,0,.18);text-align:center}.neo-interior-furniture article span{font-size:27px}.neo-interior-furniture b{font-size:11px}.neo-interior-furniture small{color:#8ba8bd;font-size:9px}.neo-interior-exit{width:max-content;margin:25px auto 0;padding:8px 13px;border:1px dashed #6ee9d7;border-radius:8px;color:#8ff2df;font-size:9px;letter-spacing:1px}

.neo-interior-map{position:relative;display:grid;grid-template-columns:repeat(10,minmax(42px,1fr));grid-template-rows:repeat(6,54px);gap:3px;max-width:850px;margin:18px auto 0;padding:9px;border:5px solid #52657c;border-radius:9px;background:#14283b;box-shadow:inset 0 0 25px rgba(0,0,0,.4)}.neo-interior-tile{display:grid;place-items:center;position:relative;border-radius:4px;background:linear-gradient(145deg,#31485a,#263b50)}.neo-interior-tile.wall{background:linear-gradient(145deg,#45566b,#293d55);border:1px solid rgba(128,202,218,.25)}.neo-interior-tile.station{background:linear-gradient(145deg,#244b5b,#1a374c);border:1px solid rgba(96,229,217,.45)}.neo-interior-tile.station button{display:flex;flex-direction:column;align-items:center;gap:2px;border:0;background:none;color:#e8fbff;cursor:pointer;padding:2px;max-width:100%}.neo-interior-tile.station button span{font-size:19px}.neo-interior-tile.station button b{font-size:8px;text-align:center}.neo-interior-tile.station button small{font-size:7px;color:#8fe9dc}.neo-interior-tile.occupied{z-index:2;box-shadow:0 0 12px rgba(88,236,222,.65)}.neo-interior-door{border:0;background:none;font-size:18px;cursor:pointer}.neo-interior-help{margin:12px auto 0;text-align:center;color:#9bb2c6;font-size:10px;line-height:1.5}
@media(max-width:650px){.neo-interior-map{grid-template-rows:repeat(6,44px);grid-template-columns:repeat(10,minmax(34px,1fr));overflow:auto}.neo-interior-tile.station button b{font-size:7px}}

@keyframes neo-player-bob{from{transform:translateY(0)}to{transform:translateY(-3px)}}
@media(max-width:650px){.neo-world-controls{align-items:flex-start;flex-direction:column}.neo-building-list>div{grid-template-columns:1fr 1fr}.neo-interior-room{padding:16px;min-height:420px}.neo-interior-window{width:85px;height:55px;right:12px;font-size:24px}.neo-interior-furniture{grid-template-columns:1fr;margin-top:25px}.neo-interior-furniture article{min-height:80px}.neo-interior-sign{margin-top:65px}}

@keyframes neo-rise{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:translateY(0)}}
@media(max-width:900px){.neo-hero{grid-template-columns:1fr;padding:24px}.neo-city-skyline{height:150px}.neo-wallet{top:auto;bottom:18px;right:18px}.neo-district-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.neo-shop-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.neo-city-bottom{grid-template-columns:1fr}.neo-arcade-card{grid-template-columns:1fr}}
@media(max-width:600px){.neo-city-page{gap:17px}.neo-hero{padding:20px;min-height:0}.neo-hero h1{font-size:31px}.neo-hero-copy>p{font-size:12px}.neo-city-skyline{height:125px}.neo-wallet{padding:7px 10px}.neo-tabs{gap:3px}.neo-tabs button{padding:9px 11px;font-size:10px}.neo-section-heading{align-items:flex-start;flex-direction:column}.neo-section-heading h2{font-size:20px}.neo-district-grid,.neo-resident-grid,.neo-shop-grid,.neo-inventory-grid{grid-template-columns:1fr}.neo-district{min-height:195px}.neo-resident-card{grid-template-columns:50px 1fr}.neo-resident-avatar{width:48px;height:48px;font-size:27px}.neo-resident-card>button{grid-column:2;justify-self:start}.neo-resident-preview{grid-template-columns:repeat(2,minmax(0,1fr))}.neo-city-bottom{padding:17px}.neo-footer{flex-wrap:wrap}.neo-footer p{order:3;width:100%;text-align:left}.neo-pad-grid{grid-template-columns:repeat(2,76px)}.neo-pad{height:70px}}

/* =========================================================
   NEO-LIFE — COZY PIXEL WORLD REFRESH
   Direção: farming RPG acolhedor + tecnologia futurista
   ========================================================= */
.neo-city-page{
  --neo-bg:#101b20;
  --neo-panel:#1c2c2c;
  --neo-line:rgba(190,211,160,.22);
  --neo-text:#f5f0d8;
  --neo-muted:#b4c2a1;
  gap:22px;
  color:var(--neo-text);
  font-family:ui-rounded,"Trebuchet MS",system-ui,sans-serif;
}
.neo-city-page button{font-family:inherit}
.neo-hero{
  min-height:330px;
  border:3px solid #526b59;
  border-radius:8px;
  background:
    radial-gradient(ellipse at 78% 24%,rgba(255,224,151,.25),transparent 20%),
    linear-gradient(180deg,#263e59 0%,#42677a 48%,#647e68 100%);
  padding:30px;
  box-shadow:0 7px 0 #263b35,0 15px 35px rgba(0,0,0,.24);
}
.neo-hero-grid{
  opacity:.13;
  background-image:
    linear-gradient(rgba(232,224,173,.25) 1px,transparent 1px),
    linear-gradient(90deg,rgba(232,224,173,.25) 1px,transparent 1px);
  background-size:24px 24px;
  mask-image:linear-gradient(90deg,transparent,#000);
}
.neo-kicker,.neo-section-heading>div>span,.neo-city-bottom>div>span{
  color:#d7df9b;
  font-size:10px;
  letter-spacing:2px;
  text-shadow:1px 2px #334a43;
}
.neo-hero h1{
  color:#fff5d8;
  text-shadow:3px 3px 0 #354e4b,5px 5px 0 rgba(20,35,34,.4);
  letter-spacing:-1px;
}
.neo-hero h1 em{
  color:#d5e6a2;
  text-shadow:3px 3px 0 #405c50;
}
.neo-hero-copy>p{color:#f0e9cf;text-shadow:1px 1px 2px #263d42}
.neo-hero-actions button,.neo-city-bottom button,.neo-dialogue>button:last-child,.neo-empty-inventory button{
  border:2px solid #f1d99b;
  border-radius:5px;
  background:linear-gradient(#f3d98f,#d7ae63);
  color:#394638;
  box-shadow:0 4px 0 #8e7048;
  padding:12px 17px;
}
.neo-hero-actions button:active,.neo-city-bottom button:active{
  transform:translateY(3px);box-shadow:0 1px 0 #8e7048;
}
.neo-hero-actions span{color:#f5edce}
.neo-city-skyline{
  height:215px;
  border:2px solid rgba(228,222,164,.3);
  border-radius:5px;
  background:
    linear-gradient(180deg,rgba(27,46,64,.05),rgba(21,43,39,.35)),
    repeating-linear-gradient(90deg,transparent 0 22px,rgba(255,226,151,.06) 23px 24px);
  image-rendering:pixelated;
}
.neo-moon{
  width:48px;height:48px;
  background:#f5e5a7;
  border-radius:3px;
  box-shadow:0 0 0 5px rgba(245,229,167,.08),0 0 35px rgba(255,226,151,.35);
}
.neo-tower{
  border:3px solid #344b4b;
  border-bottom:0;
  background:
    repeating-linear-gradient(0deg,transparent 0 13px,rgba(245,222,151,.75) 14px 18px),
    repeating-linear-gradient(90deg,#45666a 0 12px,#36545c 13px 20px);
  box-shadow:inset 4px 0 rgba(255,255,255,.08);
}
.tower-a{height:54%;left:4%;width:22%}
.tower-b{height:82%;left:29%;width:20%}
.tower-c{height:66%;left:53%;width:18%}
.tower-d{height:44%;right:5%;width:20%}
.neo-road{height:8px;background:#e7c77e;box-shadow:0 0 0 3px #4a6151}
.skyline-label{color:#f0e9c8}
.skyline-label b{color:#f7dc91}
.neo-wallet{
  background:#263d3a;
  border:2px solid #81956b;
  border-radius:5px;
  box-shadow:0 4px 0 rgba(20,35,30,.45);
}
.neo-wallet span{color:#c5d2a7}
.neo-wallet strong{color:#f4d98e}
.neo-wallet small{color:#d0d7b9}

.neo-tabs{
  gap:6px;padding:7px;
  border:2px solid #405a4d;
  border-radius:6px;
  background:#1b2c2b;
  box-shadow:0 4px 0 #101e1e;
}
.neo-tabs button{
  border-radius:4px;
  color:#c2cbaa;
  font-size:12px;
  border:1px solid transparent;
}
.neo-tabs button.active{
  color:#293b35;
  background:#d6df9c;
  border:2px solid #f0e5b6;
  box-shadow:0 3px 0 #879568;
}
.neo-notice{
  border:2px solid #a5b77b;
  border-radius:5px;
  background:#344b3d;
  color:#f4edc9;
}
.neo-section-heading h2,.neo-city-bottom h2{color:#f2edcf;text-shadow:2px 2px #253b35}
.neo-section-heading p,.neo-city-bottom p{color:#b8c7ad}
.neo-level-chip{
  border:2px solid #718b69;
  background:#2b443b;
  border-radius:5px;
  color:#e4e9b9;
  box-shadow:0 3px 0 #172923;
}

.neo-district{
  min-height:220px;
  border:2px solid color-mix(in srgb,var(--accent),#33483b 48%);
  border-radius:6px;
  background:
    linear-gradient(145deg,rgba(54,77,62,.97),rgba(31,52,47,.98));
  box-shadow:0 5px 0 #142622,0 9px 18px rgba(0,0,0,.16);
}
.neo-district:after{
  width:100px;height:100px;right:-35px;top:-35px;
  opacity:.13;filter:none;border-radius:8px;
}
.neo-district.violet{--accent:#d0b5ed}
.neo-district.green{--accent:#c0d98d}
.neo-district.blue{--accent:#a7d5d2}
.neo-district.pink{--accent:#efb8bd}
.neo-district.orange{--accent:#f1d18c}
.neo-district.locked{filter:saturate(.6);opacity:.76}
.neo-district-icon{
  width:46px;height:46px;display:grid;place-items:center;
  border:2px solid rgba(231,226,181,.24);
  border-radius:5px;background:rgba(13,30,26,.28);
}
.neo-status{font-size:8px;color:var(--accent)}
.neo-district h3{color:#f4edcf}
.neo-district p{color:#c1cbb1}
.neo-district-progress>div{color:#c2cbae}
.neo-district-progress b{color:var(--accent)}
.neo-district-progress i{height:9px;background:#1a3029;border:1px solid #61775a;border-radius:2px}
.neo-district-progress u{background:var(--accent);box-shadow:none;border-radius:1px}
.neo-district>small{color:#c0c8a9}

.neo-city-bottom{
  border:2px solid #536d54;border-radius:6px;
  background:linear-gradient(120deg,#344f43,#293f43);
  box-shadow:0 5px 0 #182b27;
}
.neo-city-bottom button{font-size:11px}
.neo-resident-preview button{
  background:#253d37;border:2px solid #526d55;border-radius:5px;
  color:#f1edcf;box-shadow:0 3px 0 #172923;
}
.neo-resident-preview button>span{filter:drop-shadow(2px 2px 0 rgba(0,0,0,.25))}
.neo-resident-preview small{color:#c1c9a9}

.neo-resident-card{
  border:2px solid #526b54;border-radius:6px;
  background:linear-gradient(130deg,#344e42,#263e3b);
  box-shadow:0 4px 0 #172a25;
}
.neo-resident-avatar{
  border:2px solid #8a9d6c;border-radius:5px;
  background:#526b50;
  box-shadow:inset 0 -5px rgba(0,0,0,.12);
}
.neo-resident-card>div:nth-child(2)>span{color:#d8df9d}
.neo-resident-card p{color:#c3cbb1}
.neo-resident-card small{color:#aebd9f}
.neo-resident-card>button{
  border:2px solid #87996a;border-radius:4px;
  background:#d4dc9b;color:#344538;
  box-shadow:0 3px 0 #74845b;
}
.neo-dialogue{
  border:3px solid #82976c;border-radius:6px;
  background:#2b443b;box-shadow:0 7px 0 #142822;
}
.neo-dialogue>span{color:#d9e3a0}
.neo-dialogue p{color:#eee9ce}

.neo-shop-item{
  padding:13px;border:2px solid #536c54;border-radius:6px;
  background:#2c453b;box-shadow:0 4px 0 #172923;
}
.neo-item-art{
  border:2px solid #6e8760;border-radius:4px;
  background:
    radial-gradient(circle at 50% 55%,rgba(222,220,151,.2),transparent 58%),
    linear-gradient(135deg,#46634e,#304d4c);
  image-rendering:pixelated;
}
.neo-item-art>span{background:#21382f;color:#e5e6bf;border:1px solid #758960}
.neo-shop-item h3{color:#f1edcf}
.neo-shop-item p{color:#c1cbb1}
.neo-shop-item b{color:#f2d58c}
.neo-shop-item button{
  border:2px solid #f1dfa8;border-radius:4px;
  background:#d7df9d;color:#344637;
  box-shadow:0 3px 0 #829365;
}
.neo-shop-item button:disabled{background:#526354;color:#c1c8ad;box-shadow:none;border-color:#68785d}

.neo-arcade-screen{
  border:3px solid #708c69;border-radius:6px;
  background:radial-gradient(ellipse at 50% 20%,rgba(198,217,143,.13),transparent 60%),#1c302d;
  box-shadow:0 5px 0 #12231f;
}
.neo-arcade-top{color:#d5e29d}
.neo-arcade-top b{color:#f2d58e}
.neo-sequence-preview span{color:#e5e7a9;text-shadow:2px 2px #546c4a}
.neo-pad{border:3px solid rgba(30,48,37,.65);border-radius:5px;box-shadow:0 4px 0 rgba(10,22,18,.45)}
.pad-0{background:#a9d5a0}
.pad-1{background:#c7b0e3}
.pad-2{background:#e7aeb2}
.pad-3{background:#efd18a}
.neo-pad.selected{filter:brightness(1.18);box-shadow:0 0 0 3px #f5edc8,0 0 20px currentColor}
.neo-arcade-screen>p{color:#c7d0b2}
.neo-game-start{
  border:2px solid #f0dda5;border-radius:4px;
  background:#d7df9d;color:#344637;box-shadow:0 4px 0 #819265;
}
.neo-arcade-info{
  border:2px solid #536c54;border-radius:6px;
  background:#2b443b;box-shadow:0 4px 0 #172923;
}
.neo-arcade-info>span{color:#d6e29b}
.neo-arcade-info ol{color:#c8d0b7}
.neo-arcade-info small{border-color:#526a53;color:#b2c1a5}

.neo-inventory-grid article{
  border:2px solid #536c54;border-radius:5px;
  background:#2c453b;box-shadow:0 4px 0 #172923;
}
.neo-inventory-grid b{color:#f1edcf}
.neo-inventory-grid small{color:#c0cbb0}
.neo-inventory-grid i{color:#d5e39a}
.neo-empty-inventory{
  border:2px dashed #82976c;border-radius:6px;
  background:#253d35;
}
.neo-empty-inventory p{color:#c0cbb0}
.neo-footer{border-color:#405b49;color:#9eaf91}
.neo-footer p{color:#b4c1a5}

/* Mapa: terreno orgânico, trilhas e edifícios com leitura de pixel art */
.neo-world-toolbar{
  border:2px solid #536c54;border-radius:5px;
  background:#263e36;color:#dbe2a8;
}
.neo-world-toolbar button,.neo-interior-header button{
  border:2px solid #87976b;border-radius:4px;
  background:#d4dc9b;color:#344637;
  box-shadow:0 3px 0 #71845d;
}
.neo-world-scroll{
  border:3px solid #526d55;border-radius:7px;
  padding:14px;
  background:
    radial-gradient(ellipse at 50% 40%,rgba(171,196,115,.12),transparent 70%),
    #172d27;
  box-shadow:0 7px 0 #0e201b,inset 0 0 35px rgba(0,0,0,.28);
}
.neo-world-map{
  gap:3px;
  padding:12px;
  border:3px solid #647b56;
  border-radius:4px;
  background:#243c31;
  box-shadow:inset 0 0 0 3px rgba(220,218,159,.08);
  image-rendering:pixelated;
}
.neo-world-tile{
  border-radius:1px;
  box-shadow:inset 0 0 0 1px rgba(12,31,23,.12);
  transition:filter .12s;
}
.neo-world-tile.ground{
  background:
    radial-gradient(circle at 22% 28%,rgba(208,219,143,.16) 0 1px,transparent 2px),
    radial-gradient(circle at 72% 70%,rgba(16,49,33,.2) 0 1px,transparent 2px),
    linear-gradient(135deg,#668b55,#527b4b);
}
.neo-world-tile.road{
  border:0;
  background:
    radial-gradient(circle at 20% 30%,rgba(255,232,171,.22) 0 1px,transparent 2px),
    linear-gradient(135deg,#b89a65,#a98a58);
  box-shadow:inset 0 2px rgba(255,235,183,.12),inset 0 -2px rgba(85,67,44,.13);
}
.neo-world-tile.park{
  background:
    radial-gradient(circle at 30% 20%,rgba(184,218,125,.2) 0 2px,transparent 3px),
    linear-gradient(135deg,#477e4c,#356c46);
  box-shadow:inset 0 0 0 1px rgba(190,221,132,.13);
}
.neo-world-tile.building-tile{
  border:2px solid #5c6650;
  background:
    linear-gradient(90deg,transparent 0 12%,rgba(240,213,139,.8) 13% 19%,transparent 20% 80%,rgba(240,213,139,.8) 81% 87%,transparent 88%),
    linear-gradient(180deg,#71918a 0 22%,#456b68 23% 100%);
  box-shadow:inset 0 5px rgba(255,255,255,.12),inset 0 -5px rgba(16,38,31,.25),0 2px 0 #30483a;
}
.neo-world-tile.door-tile{
  border:2px solid #d8c184;
  background:#8d7652;
}
.neo-building-label{
  top:3px;left:3px;max-width:145px;
  padding:3px 5px;border:1px solid #e3d19a;
  border-radius:2px;background:#263d35;
  color:#fff2c8;font-size:8px;
  box-shadow:2px 2px 0 rgba(16,32,25,.4);
}
.neo-tree{
  font-size:23px;
  filter:drop-shadow(2px 3px 0 rgba(27,54,31,.55));
}
.neo-door{
  font-size:18px;
  filter:drop-shadow(2px 2px 0 #4b5339);
}
.neo-player{
  font-size:27px;
  filter:drop-shadow(2px 3px 0 rgba(20,35,26,.65));
  animation:neo-player-bob .65s steps(2,end) infinite alternate;
}
.neo-world-controls{
  border:2px solid #536c54;border-radius:5px;
  background:#263e36;box-shadow:0 4px 0 #142720;
}
.neo-world-controls p{color:#c4ceb0}
.neo-dpad button{
  border:2px solid #82966a;border-radius:4px;
  background:#d2dc9b;color:#344637;
  box-shadow:0 3px 0 #72845a;
}
.neo-dpad button:active{background:#f0dda0;transform:translateY(2px);box-shadow:0 1px 0 #72845a}
.neo-building-list{
  border:2px solid #536c54;border-radius:6px;
  background:#263e36;box-shadow:0 4px 0 #142720;
}
.neo-building-list h3{color:#f1edcf}
.neo-building-list button{
  border:2px solid #536d54;border-radius:4px;
  background:#344f40;color:#f2edcf;
  box-shadow:0 3px 0 #172a24;
}
.neo-building-list button small{color:#c2cdae}
.neo-interior{
  border:3px solid #647b56;border-radius:6px;
  background:linear-gradient(145deg,#314c40,#263d39);
  box-shadow:0 6px 0 #142720;
}
.neo-interior-header{color:#e0e5a8}
.neo-interior-room{
  border:8px solid #806d4d;border-radius:3px;
  background:
    linear-gradient(180deg,#597c78 0 13%,#b18b5e 14% 17%,#765d45 18% 100%);
  box-shadow:inset 0 0 0 4px rgba(255,224,157,.12);
}
.neo-interior-window{
  border:5px solid #806d4d;border-radius:2px;
  background:linear-gradient(135deg,#789da0,#4b6c80 55%,#d3b77d);
  box-shadow:0 0 0 2px #c7ad78;
}
.neo-interior-sign h3{color:#fff1ca;text-shadow:2px 2px #3d5142}
.neo-interior-sign p{color:#e2dfc2}
.neo-interior-map{
  border:5px solid #806d4d;border-radius:3px;
  background:#8b704d;box-shadow:inset 0 0 0 3px #b69a69;
}
.neo-interior-tile{
  border-radius:1px;
  background:repeating-linear-gradient(90deg,#9b7952 0 19px,#a9875e 20px 22px);
}
.neo-interior-tile.wall{
  background:repeating-linear-gradient(90deg,#617d6b 0 18px,#4e6c5d 19px 22px);
  border:1px solid #a58b5e;
}
.neo-interior-tile.station{
  background:linear-gradient(145deg,#557b70,#3c625b);
  border:2px solid #c7b17a;
}
.neo-interior-tile.station button{color:#fff0c8}
.neo-interior-tile.station button small{color:#e0e5a8}
.neo-interior-tile.occupied{box-shadow:0 0 0 2px #e8d48f,0 0 12px rgba(232,212,143,.4)}
.neo-interior-help{color:#d2d9b9}

@keyframes neo-player-bob{from{transform:translateY(0)}to{transform:translateY(-2px)}}
@media(max-width:650px){
  .neo-hero{border-radius:5px;padding:19px}
  .neo-world-scroll{padding:7px}
  .neo-world-map{grid-template-columns:repeat(18,minmax(34px,1fr));grid-template-rows:repeat(12,44px);min-width:680px}
  .neo-building-list>div{grid-template-columns:1fr 1fr}
}

`;
