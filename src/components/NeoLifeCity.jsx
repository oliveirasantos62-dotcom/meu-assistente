import React, { useMemo, useState } from 'react';

const DISTRICTS = [
  { id: 'central', name: 'Núcleo Central', icon: '🏙️', desc: 'O coração da cidade. Cada tarefa concluída mantém suas luzes acesas.', metric: 'tasks', threshold: 0, color: 'cyan' },
  { id: 'academy', name: 'Distrito Acadêmico', icon: '🎓', desc: 'Laboratórios, bibliotecas e centros de pesquisa alimentados pelo conhecimento.', metric: 'minutes', threshold: 60, color: 'violet' },
  { id: 'green', name: 'Jardins BioTech', icon: '🌿', desc: 'Um refúgio vivo que floresce com hábitos consistentes.', metric: 'habits', threshold: 3, color: 'green' },
  { id: 'innovation', name: 'Distrito de Inovação', icon: '🧬', desc: 'Oficinas e startups que crescem junto com seus projetos.', metric: 'projects', threshold: 1, color: 'blue' },
  { id: 'commerce', name: 'Mercado Neon', icon: '🛍️', desc: 'Lojas, personalização e itens para sua vida na cidade.', metric: 'goals', threshold: 1, color: 'pink' },
  { id: 'arcade', name: 'Arcade 88', icon: '🕹️', desc: 'Desafios de lógica e habilidade para jogar com os moradores.', metric: 'xp', threshold: 0, color: 'orange' },
];

const RESIDENTS = [
  { id: 'luna', name: 'Luna', role: 'Estudante de cibernética', avatar: '👩🏻‍🎓', district: 'academy', focus: 'study' },
  { id: 'kai', name: 'Kai', role: 'Engenheiro de sistemas', avatar: '🧑🏽‍💻', district: 'innovation', focus: 'tasks' },
  { id: 'maya', name: 'Maya', role: 'Comerciante do Mercado Neon', avatar: '👩🏽‍🔧', district: 'commerce', focus: 'coins' },
  { id: 'nox', name: 'Nox', role: 'Treinador de rotina', avatar: '🧑🏻‍🚀', district: 'green', focus: 'habits' },
  { id: 'iris', name: 'Íris', role: 'Bibliotecária de dados', avatar: '🧝🏻‍♀️', district: 'academy', focus: 'reading' },
];

const STORE_ITEMS = [
  { id: 'holo-plant', name: 'Planta holográfica', type: 'Decoração', icon: '🪴', price: 35, description: 'Um toque de natureza sintética para seu apartamento.' },
  { id: 'neon-sign', name: 'Placa Neon', type: 'Decoração', icon: '💡', price: 55, description: 'Personalize seu espaço com luzes da cidade.' },
  { id: 'drone-pet', name: 'Drone companheiro', type: 'Companheiro', icon: '🤖', price: 90, description: 'Um pequeno robô para acompanhar suas explorações.' },
  { id: 'streetwear', name: 'Jaqueta Synthwave', type: 'Visual', icon: '🧥', price: 120, description: 'Estilo para atravessar a cidade à noite.' },
  { id: 'skyboard', name: 'Hoverboard', type: 'Mobilidade', icon: '🛹', price: 180, description: 'Deslize pelas avenidas suspensas.' },
  { id: 'neon-cat', name: 'Gato de plasma', type: 'Companheiro', icon: '🐈‍⬛', price: 240, description: 'Um felino luminoso que adora explorar.' },
];

const localDay = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};
const safeArray = (value) => Array.isArray(value) ? value : [];
const completed = (task) => task?.done === true || task?.status === 'done' || task?.completed === true;

function residentLine(resident, stats, history = {}) {
  const count = Number(history[resident.id]) || 0;
  const hello = count > 0 ? 'Bom te ver de novo por aqui.' : 'Prazer em conhecer você!';
  if (resident.id === 'luna') {
    if (stats.studyMinutes >= 60) return `${hello} Vi que você já dedicou ${stats.studyMinutes} minutos aos estudos. O laboratório está avançando graças a pessoas curiosas como você.`;
    return `${hello} Estou pesquisando novas tecnologias. Uma sessão de estudo sua já seria uma ótima contribuição para nosso laboratório.`;
  }
  if (resident.id === 'kai') {
    if (stats.tasks >= 3) return `${hello} ${stats.tasks} tarefas concluídas registradas! Seu foco está ajudando a manter os sistemas do distrito funcionando.`;
    return `${hello} Estou calibrando os servidores da cidade. Cada tarefa concluída ajuda a manter tudo em ordem.`;
  }
  if (resident.id === 'maya') return `${hello} Você tem ${stats.coins} moedas no bolso. Passe na loja quando quiser; aqui os preços são claros e não existem compras com dinheiro real.`;
  if (resident.id === 'nox') {
    if (stats.habits >= 3) return `${hello} Já existem ${stats.habits} registros de hábitos no seu histórico. Consistência não é perfeição: é voltar quando puder.`;
    return `${hello} Que tal cuidar de um pequeno hábito hoje? O importante é escolher algo que caiba na sua rotina.`;
  }
  if (stats.readings > 0) return `${hello} Seu registro de leitura já soma ${stats.readings} item(ns). Conhecimento é uma das melhores formas de explorar novos mundos.`;
  return `${hello} Cada livro ou material que você registra amplia o acervo da cidade. Volte quando tiver uma nova descoberta.`;
}

export default function NeoLifeCity({ data = {}, save, onNavigate }) {
  const [activeTab, setActiveTab] = useState('city');
  const [selectedResident, setSelectedResident] = useState(null);
  const [notice, setNotice] = useState('');
  const [sequence, setSequence] = useState([]);
  const [playerSequence, setPlayerSequence] = useState([]);
  const [gameState, setGameState] = useState('idle');
  const [gameSeed, setGameSeed] = useState(0);

  const city = data.neoCity && typeof data.neoCity === 'object' ? data.neoCity : {};
  const inventory = safeArray(city.inventory);
  const talks = city.talks && typeof city.talks === 'object' ? city.talks : {};
  const arcade = city.arcade && typeof city.arcade === 'object' ? city.arcade : {};
  const coins = Math.max(0, Number(data.coins) || 0);
  const xp = Math.max(0, Number(data.xp) || 0);
  const tasks = safeArray(data.tasks);
  const habits = safeArray(data.habits);
  const sessions = safeArray(data.studySessions);
  const readings = safeArray(data.readings).concat(safeArray(data.knowledgeItems));
  const goals = safeArray(data.goals);
  const projects = safeArray(data.projects);
  const stats = useMemo(() => ({
    tasks: tasks.filter(completed).length,
    studyMinutes: sessions.reduce((sum, item) => sum + Math.max(0, Number(item.minutes) || 0), 0),
    habits: habits.reduce((sum, habit) => sum + new Set([
      ...Object.entries(habit.history || {}).filter(([, done]) => done).map(([day]) => day),
      ...safeArray(habit.completedDates),
    ]).size, 0),
    readings: readings.length,
    goals: goals.filter((goal) => goal.status === 'completed' || Number(goal.progress) >= 100).length,
    projects: projects.length,
    coins,
    xp,
  }), [tasks, sessions, habits, readings, goals, projects, coins, xp]);

  const districtValue = (district) => stats[district.metric] || 0;
  const districtOpen = (district) => districtValue(district) >= district.threshold;
  const openCount = DISTRICTS.filter(districtOpen).length;
  const today = localDay();
  const attemptedToday = arcade.lastAttemptDate === today;
  const ownedIds = new Set(inventory);

  const persistCity = (nextCity, extra = {}) => save?.({ ...data, ...extra, neoCity: nextCity });

  const talkTo = (resident) => {
    const nextTalks = { ...talks, [resident.id]: (Number(talks[resident.id]) || 0) + 1 };
    persistCity({ ...city, talks: nextTalks });
    setSelectedResident({ ...resident, dialogue: residentLine(resident, stats, talks) });
  };

  const buyItem = (item) => {
    if (ownedIds.has(item.id)) return;
    if (coins < item.price) { setNotice(`Faltam ${item.price - coins} moedas para comprar ${item.name}.`); return; }
    persistCity({ ...city, inventory: [...inventory, item.id] }, { coins: coins - item.price });
    setNotice(`${item.name} foi adicionado ao seu inventário.`);
  };

  const startGame = () => {
    if (attemptedToday) { setNotice('Você já participou do desafio de hoje. O Arcade terá uma nova rodada amanhã.'); return; }
    if (coins < 5) { setNotice('Você precisa de 5 moedas para entrar no desafio.'); return; }
    const nextSequence = Array.from({ length: 4 }, () => Math.floor(Math.random() * 4));
    setSequence(nextSequence);
    setPlayerSequence([]);
    setGameSeed((value) => value + 1);
    setGameState('preview');
    persistCity({ ...city, arcade: { ...arcade, lastAttemptDate: today } }, { coins: coins - 5 });
  };

  const choosePad = (value) => {
    if (gameState !== 'playing') return;
    const next = [...playerSequence, value];
    setPlayerSequence(next);
    if (next.some((item, index) => item !== sequence[index])) {
      setGameState('lost');
      setNotice('Quase! O desafio de hoje foi encerrado. Amanhã você pode tentar outra sequência.');
      return;
    }
    if (next.length === sequence.length) {
      setGameState('won');
      const nextArcade = { ...arcade, lastAttemptDate: today, lastWinDate: today };
      persistCity({ ...city, arcade: nextArcade }, { coins: Math.max(0, Number(data.coins) || 0) + 12 });
      setNotice('Sequência perfeita! Você ganhou 12 moedas.');
    }
  };

  const tabs = [
    ['city', '🌆 Cidade'], ['residents', '🧑‍🤝‍🧑 Moradores'], ['market', '🛍️ Mercado'], ['arcade', '🕹️ Arcade'], ['inventory', '🎒 Inventário'],
  ];

  return (
    <main className="neo-city-page">
      <style>{styles}</style>
      <section className="neo-hero">
        <div className="neo-hero-grid" />
        <div className="neo-hero-copy">
          <span className="neo-kicker">NEO-LIFE // SIMULADOR DE EVOLUÇÃO</span>
          <h1>Sua vida real. <em>Sua cidade.</em></h1>
          <p>Uma metrópole futurista que cresce com seus estudos, tarefas, hábitos e conquistas. Explore, converse com moradores e construa seu próprio canto da cidade.</p>
          <div className="neo-hero-actions"><button onClick={() => onNavigate?.('tasks')}>＋ Registrar progresso</button><span>Sem perder progresso por descansar.</span></div>
        </div>
        <div className="neo-city-skyline" aria-label="Ilustração de uma cidade futurista">
          <div className="neo-moon" /><div className="neo-tower tower-a" /><div className="neo-tower tower-b" /><div className="neo-tower tower-c" /><div className="neo-tower tower-d" /><div className="neo-road" />
          <span className="skyline-label">SETORES CONECTADOS <b>{openCount}/{DISTRICTS.length}</b></span>
        </div>
        <div className="neo-wallet"><span>CARTEIRA DIGITAL</span><strong>🪙 {coins.toLocaleString('pt-BR')}</strong><small>moedas disponíveis</small></div>
      </section>

      <div className="neo-tabs" role="tablist" aria-label="Áreas da cidade">
        {tabs.map(([id, label]) => <button key={id} role="tab" aria-selected={activeTab === id} className={activeTab === id ? 'active' : ''} onClick={() => setActiveTab(id)}>{label}</button>)}
      </div>

      {notice && <div className="neo-notice" role="status">✨ {notice}<button onClick={() => setNotice('')} aria-label="Fechar aviso">×</button></div>}

      {activeTab === 'city' && <>
        <section className="neo-section-heading"><div><span>MAPA URBANO</span><h2>Explore os distritos</h2><p>O desenvolvimento de cada região é calculado a partir dos registros existentes no Meu Assistente.</p></div><div className="neo-level-chip">⚡ {xp.toLocaleString('pt-BR')} XP acumulados</div></section>
        <section className="neo-district-grid">
          {DISTRICTS.map((district, index) => {
            const unlocked = districtOpen(district);
            const value = districtValue(district);
            const pct = district.threshold === 0 ? 100 : Math.min(100, Math.round(value / district.threshold * 100));
            return <article key={district.id} className={`neo-district ${district.color} ${unlocked ? '' : 'locked'}`} style={{ '--delay': `${index * 55}ms` }}>
              <div className="neo-district-top"><span className="neo-district-icon">{unlocked ? district.icon : '🔒'}</span><span className="neo-status">{unlocked ? 'ACESSÍVEL' : 'EM CONSTRUÇÃO'}</span></div>
              <h3>{district.name}</h3><p>{district.desc}</p>
              <div className="neo-district-progress"><div><span>{district.metric === 'minutes' ? 'Minutos estudados' : district.metric === 'tasks' ? 'Tarefas concluídas' : district.metric === 'habits' ? 'Registros de hábitos' : district.metric === 'projects' ? 'Projetos criados' : district.metric === 'goals' ? 'Metas concluídas' : 'Experiência total'}</span><b>{value.toLocaleString('pt-BR')}{district.metric === 'minutes' ? ' min' : ''}</b></div><i><u style={{ width: `${pct}%` }} /></i></div>
              {!unlocked && <small>Meta para abrir: {district.threshold} {district.metric === 'minutes' ? 'minutos' : district.metric === 'habits' ? 'registros' : district.metric === 'projects' || district.metric === 'goals' ? 'unidade(s)' : 'pontos'}</small>}
            </article>;
          })}
        </section>
        <section className="neo-city-bottom"><div><span>💬 VIDA NA CIDADE</span><h2>Os moradores percebem sua evolução</h2><p>Converse com personagens que reconhecem atividades realmente registradas. Eles não inventam conquistas nem cobram quando você tira um tempo para descansar.</p><button onClick={() => setActiveTab('residents')}>Conhecer moradores →</button></div><div className="neo-resident-preview">{RESIDENTS.slice(0, 4).map((resident) => <button key={resident.id} onClick={() => { setActiveTab('residents'); talkTo(resident); }}><span>{resident.avatar}</span><b>{resident.name}</b><small>{resident.role}</small></button>)}</div></section>
      </>}

      {activeTab === 'residents' && <>
        <section className="neo-section-heading"><div><span>PERSONAGENS DA CIDADE</span><h2>Gente que acompanha sua jornada</h2><p>As conversas mudam conforme suas atividades e seu histórico de interação.</p></div></section>
        <section className="neo-resident-grid">{RESIDENTS.map((resident) => <article className="neo-resident-card" key={resident.id}><div className="neo-resident-avatar">{resident.avatar}</div><div><span>{DISTRICTS.find((item) => item.id === resident.district)?.name}</span><h3>{resident.name}</h3><p>{resident.role}</p><small>{Number(talks[resident.id]) || 0} conversas</small></div><button onClick={() => talkTo(resident)}>Conversar <span>↗</span></button></article>)}</section>
        {selectedResident && <div className="neo-dialogue" role="dialog" aria-modal="true" aria-label={`Conversa com ${selectedResident.name}`}><button className="neo-dialogue-close" onClick={() => setSelectedResident(null)} aria-label="Fechar">×</button><div>{selectedResident.avatar}</div><span>TRANSMISSÃO LOCAL // {selectedResident.name.toUpperCase()}</span><h3>{selectedResident.name}</h3><p>“{selectedResident.dialogue}”</p><button onClick={() => setSelectedResident(null)}>Continuar explorando</button></div>}
      </>}

      {activeTab === 'market' && <>
        <section className="neo-section-heading"><div><span>MERCADO NEON</span><h2>Personalize sua vida na cidade</h2><p>Compre itens usando apenas as moedas conquistadas no aplicativo. Cada preço é fixo e aparece antes da compra.</p></div><div className="neo-level-chip">🪙 {coins} moedas</div></section>
        <section className="neo-shop-grid">{STORE_ITEMS.map((item) => { const owned = ownedIds.has(item.id); return <article className="neo-shop-item" key={item.id}><div className="neo-item-art">{item.icon}<span>{item.type}</span></div><h3>{item.name}</h3><p>{item.description}</p><div><b>🪙 {item.price}</b><button disabled={owned || coins < item.price} onClick={() => buyItem(item)}>{owned ? '✓ Adquirido' : coins < item.price ? 'Moedas insuficientes' : 'Comprar'}</button></div></article>; })}</section>
      </>}

      {activeTab === 'arcade' && <>
        <section className="neo-section-heading"><div><span>ARCADE 88 // JOGO DE HABILIDADE</span><h2>Desafio de sequência</h2><p>Memorize a sequência de luzes e repita na ordem correta. Uma tentativa por dia, entrada de 5 moedas e recompensa fixa de 12 moedas ao vencer.</p></div><div className="neo-level-chip">🎟️ Entrada: 5 moedas</div></section>
        <section className="neo-arcade-card"><div className="neo-arcade-screen"><div className="neo-arcade-top"><span>NEURAL LINK // MEMORY GRID</span><b>{gameState === 'playing' ? `${playerSequence.length}/4` : gameState === 'preview' ? 'MEMORIZE' : gameState === 'won' ? 'VITÓRIA' : gameState === 'lost' ? 'FIM DE JOGO' : 'AGUARDANDO'}</b></div><div className="neo-sequence-preview">{gameState === 'preview' ? sequence.map((entry, index) => <span key={index}>{['✦', '◈', '⌁', '✧'][entry]}</span>) : null}</div><div className="neo-pad-grid" key={gameSeed}>{[0, 1, 2, 3].map((value) => <button key={value} className={`neo-pad pad-${value} ${playerSequence.includes(value) && gameState === 'playing' ? 'selected' : ''}`} disabled={gameState !== 'playing'} onClick={() => choosePad(value)} aria-label={`Botão ${value + 1}`}>{['✦', '◈', '⌁', '✧'][value]}</button>)}</div><p>{gameState === 'preview' ? 'Memorize a sequência exibida e depois comece.' : gameState === 'playing' ? 'Repita a sequência de quatro símbolos.' : gameState === 'won' ? 'Conexão estabelecida. +12 moedas adicionadas à carteira.' : gameState === 'lost' ? 'A sequência não correspondeu. Tente novamente amanhã.' : attemptedToday ? 'Você já usou sua tentativa de hoje.' : 'Inicie o desafio para receber sua sequência.'}</p>{gameState === 'preview' ? <button className="neo-game-start" onClick={() => setGameState('playing')}>Já memorizei · começar</button> : <button className="neo-game-start" disabled={attemptedToday || coins < 5 || gameState === 'playing'} onClick={startGame}>{gameState === 'won' ? 'Desafio concluído' : attemptedToday ? 'Volte amanhã' : coins < 5 ? 'Precisa de 5 moedas' : 'Iniciar desafio · 5 moedas'}</button>}</div><aside className="neo-arcade-info"><span>COMO JOGAR</span><h3>Teste sua memória</h3><ol><li>Entre no desafio por 5 moedas.</li><li>Observe os quatro símbolos que formam sua sequência.</li><li>Toque nos símbolos na mesma ordem.</li><li>Se acertar tudo, recebe 12 moedas.</li></ol><small>Sem apostas, sem compras com dinheiro real e sem recompensas aleatórias.</small></aside></section>
      </>}

      {activeTab === 'inventory' && <>
        <section className="neo-section-heading"><div><span>SEUS PERTENCES</span><h2>Inventário pessoal</h2><p>Itens que você comprou no Mercado Neon ficam guardados aqui.</p></div><div className="neo-level-chip">🎒 {inventory.length} itens</div></section>
        {inventory.length ? <section className="neo-inventory-grid">{STORE_ITEMS.filter((item) => ownedIds.has(item.id)).map((item) => <article key={item.id}><span>{item.icon}</span><div><b>{item.name}</b><small>{item.type}</small></div><i>✓</i></article>)}</section> : <div className="neo-empty-inventory"><span>🎒</span><h3>Sua mochila está esperando aventuras</h3><p>Visite o Mercado Neon para comprar seu primeiro item.</p><button onClick={() => setActiveTab('market')}>Explorar mercado</button></div>}
      </>}

      <footer className="neo-footer"><span>NEO-LIFE / BUILD 01</span><p>Seu progresso real constrói a cidade. Seu descanso também faz parte da jornada.</p><span>XP {xp.toLocaleString('pt-BR')} · 🪙 {coins}</span></footer>
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
@keyframes neo-rise{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:translateY(0)}}
@media(max-width:900px){.neo-hero{grid-template-columns:1fr;padding:24px}.neo-city-skyline{height:150px}.neo-wallet{top:auto;bottom:18px;right:18px}.neo-district-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.neo-shop-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.neo-city-bottom{grid-template-columns:1fr}.neo-arcade-card{grid-template-columns:1fr}}
@media(max-width:600px){.neo-city-page{gap:17px}.neo-hero{padding:20px;min-height:0}.neo-hero h1{font-size:31px}.neo-hero-copy>p{font-size:12px}.neo-city-skyline{height:125px}.neo-wallet{padding:7px 10px}.neo-tabs{gap:3px}.neo-tabs button{padding:9px 11px;font-size:10px}.neo-section-heading{align-items:flex-start;flex-direction:column}.neo-section-heading h2{font-size:20px}.neo-district-grid,.neo-resident-grid,.neo-shop-grid,.neo-inventory-grid{grid-template-columns:1fr}.neo-district{min-height:195px}.neo-resident-card{grid-template-columns:50px 1fr}.neo-resident-avatar{width:48px;height:48px;font-size:27px}.neo-resident-card>button{grid-column:2;justify-self:start}.neo-resident-preview{grid-template-columns:repeat(2,minmax(0,1fr))}.neo-city-bottom{padding:17px}.neo-footer{flex-wrap:wrap}.neo-footer p{order:3;width:100%;text-align:left}.neo-pad-grid{grid-template-columns:repeat(2,76px)}.neo-pad{height:70px}}
`;
