import React, { useMemo, useState } from 'react';

const REGIONS = [
  { id: 'vale', name: 'Vale do Começo', icon: '🌿', tone: 'meadow', unlock: 0, description: 'Onde pequenas ações viram grandes jornadas.', skill: 'Disciplina' },
  { id: 'biblioteca', name: 'Bosque do Saber', icon: '📚', tone: 'knowledge', unlock: 100, description: 'Trilhas de estudo, leitura e descobertas.', skill: 'Conhecimento' },
  { id: 'forja', name: 'Montanhas da Forja', icon: '⚒️', tone: 'forge', unlock: 300, description: 'Construa consistência, força e bons hábitos.', skill: 'Consistência' },
  { id: 'aurora', name: 'Costa da Aurora', icon: '🌅', tone: 'coast', unlock: 600, description: 'Transforme planos em objetivos realizados.', skill: 'Realização' },
  { id: 'observatorio', name: 'Observatório Celeste', icon: '🔭', tone: 'cosmos', unlock: 1000, description: 'Explore projetos, foco e conhecimento avançado.', skill: 'Foco' },
  { id: 'lenda', name: 'Reino das Lendas', icon: '🐉', tone: 'legend', unlock: 1600, description: 'Um território para quem construiu uma jornada.', skill: 'Todas as habilidades' },
];

const COSMETICS = [
  { id: 'cape', name: 'Capa do Explorador', icon: '🧥', cost: 80, detail: 'Um visual para sua próxima aventura.' },
  { id: 'pet', name: 'Companheiro raposinha', icon: '🦊', cost: 140, detail: 'Um pequeno parceiro de jornada.' },
  { id: 'lantern', name: 'Lanterna Estelar', icon: '🏮', cost: 220, detail: 'Ilumine suas próximas descobertas.' },
];

const dateKey = (value = new Date()) => {
  const now = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(now.getTime())) return '';
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export default function World({ data = {}, save, onNavigate }) {
  const [activeRegion, setActiveRegion] = useState('vale');
  const [notice, setNotice] = useState('');
  const xp = Math.max(0, Number(data.xp) || 0);
  const coins = Math.max(0, Number(data.coins) || 0);
  const level = Math.floor(xp / 100) + 1;
  const progress = xp % 100;
  const tasks = Array.isArray(data.tasks) ? data.tasks : [];
  const habits = Array.isArray(data.habits) ? data.habits : [];
  const sessions = Array.isArray(data.studySessions) ? data.studySessions : [];
  const goals = Array.isArray(data.goals) ? data.goals : [];
  const world = data.world && typeof data.world === 'object' ? data.world : {};
  const today = dateKey();
  const completedToday = tasks.filter((task) => task.done && dateKey(task.completedAt) === today).length;
  const studiedToday = sessions.filter((session) => { const sessionDate = session.study_date || session.date || session.createdAt; return String(sessionDate || '').length <= 10 ? String(sessionDate || '').slice(0, 10) === today : dateKey(sessionDate) === today; }).reduce((sum, session) => sum + Math.max(0, Number(session.minutes) || 0), 0);
  const habitDoneToday = habits.filter((habit) => habit.history?.[today] === true || (Array.isArray(habit.completedDates) && habit.completedDates.includes(today))).length;
  const completedGoals = goals.filter((goal) => goal.status === 'completed' || Number(goal.progress) >= 100).length;
  const completedAll = tasks.filter((task) => task.done).length;
  const claimed = world.missionClaims && typeof world.missionClaims === 'object' ? world.missionClaims : {};
  const dailyMissions = [
    { id: 'task', icon: '⚔️', title: 'Uma missão de cada vez', detail: 'Conclua uma tarefa hoje', current: completedToday, target: 1, xp: 15, coins: 8, action: 'tasks' },
    { id: 'study', icon: '📖', title: 'Conhecimento em movimento', detail: 'Estude por 25 minutos', current: studiedToday, target: 25, xp: 20, coins: 10, action: 'estudos' },
    { id: 'habit', icon: '🌱', title: 'Cultive sua rotina', detail: 'Registre um hábito hoje', current: habitDoneToday, target: 1, xp: 12, coins: 7, action: 'habits' },
  ];
  const skillStats = [
    { name: 'Disciplina', icon: '⚔️', value: completedAll * 10 + habitDoneToday * 5, hint: 'tarefas e hábitos' },
    { name: 'Conhecimento', icon: '📚', value: sessions.reduce((sum, item) => sum + Math.max(0, Number(item.minutes) || 0), 0), hint: 'minutos de estudo' },
    { name: 'Realização', icon: '🏆', value: completedGoals * 100, hint: 'objetivos concluídos' },
    { name: 'Consistência', icon: '🔥', value: habits.reduce((sum, habit) => sum + Object.values(habit.history || {}).filter(Boolean).length, 0) * 5, hint: 'hábitos registrados' },
  ];
  const unlockedCount = REGIONS.filter((region) => xp >= region.unlock).length;
  const selectedRegion = REGIONS.find((region) => region.id === activeRegion) || REGIONS[0];
  const owned = Array.isArray(world.ownedCosmetics) ? world.ownedCosmetics : [];

  const updateWorld = (patch, extra = {}) => save({ ...data, ...extra, world: { ...world, ...patch } });

  const claimMission = (mission) => {
    const key = `${today}:${mission.id}`;
    if (claimed[key] || mission.current < mission.target) return;
    const nextClaims = { ...claimed, [key]: true };
    save({
      ...data,
      xp: xp + mission.xp,
      coins: coins + mission.coins,
      world: { ...world, missionClaims: nextClaims, lastRewardAt: new Date().toISOString() },
    });
    setNotice(`+${mission.xp} XP e +${mission.coins} moedas. Muito bem!`);
  };

  const buyCosmetic = (item) => {
    if (owned.includes(item.id)) return;
    if (coins < item.cost) { setNotice('Ainda faltam algumas moedas. Continue sua jornada!'); return; }
    save({ ...data, coins: coins - item.cost, world: { ...world, ownedCosmetics: [...owned, item.id] } });
    setNotice(`${item.name} desbloqueado!`);
  };

  const explore = (region) => {
    const discoveries = Array.isArray(world.discoveries) ? world.discoveries : [];
    if (discoveries.includes(region.id)) { setNotice('Você já descobriu este lugar. Volte quando quiser!'); return; }
    if (xp < region.unlock) return;
    updateWorld({ discoveries: [...discoveries, region.id] }, { coins: coins + 15 });
    setNotice(`Nova descoberta: ${region.name}! +15 moedas.`);
  };

  const nextRegion = REGIONS.find((region) => xp < region.unlock);
  const totalStudyMinutes = sessions.reduce((sum, item) => sum + Math.max(0, Number(item.minutes) || 0), 0);

  return (
    <main className="world-page">
      <style>{styles}</style>
      <header className="world-hero">
        <div className="world-hero-copy">
          <span className="world-eyebrow">SUA JORNADA, NO SEU RITMO</span>
          <h1>🌎 Um mundo que cresce com você</h1>
          <p>Cada tarefa, estudo, hábito e objetivo deixa sua história um pouco maior. Não existe perder progresso por descansar.</p>
          <div className="world-hero-actions"><button onClick={() => onNavigate?.('tasks')}>⚔️ Ver minhas tarefas</button><button className="world-secondary" onClick={() => onNavigate?.('estudos')}>📚 Continuar estudando</button></div>
        </div>
        <div className="world-avatar-card"><div className="world-avatar">🧙‍♂️</div><span>AVENTUREIRO(A)</span><strong>Nível {level}</strong><small>{xp.toLocaleString('pt-BR')} XP acumulados</small><div className="world-level-track"><i style={{ width: `${progress}%` }} /></div><small>{100 - progress} XP para o próximo nível</small></div>
      </header>

      {notice && <div className="world-notice" role="status">✨ {notice}<button onClick={() => setNotice('')} aria-label="Fechar aviso">×</button></div>}

      <section className="world-stat-row">
        <article><span>⭐</span><div><strong>{xp.toLocaleString('pt-BR')}</strong><small>XP total</small></div></article>
        <article><span>🪙</span><div><strong>{coins.toLocaleString('pt-BR')}</strong><small>moedas</small></div></article>
        <article><span>🗺️</span><div><strong>{unlockedCount}/{REGIONS.length}</strong><small>regiões abertas</small></div></article>
        <article><span>📖</span><div><strong>{totalStudyMinutes.toLocaleString('pt-BR')} min</strong><small>de conhecimento</small></div></article>
      </section>

      <section className="world-section">
        <div className="world-section-heading"><div><span>EXPLORAÇÃO</span><h2>🧭 Mapa do mundo</h2><p>Novos lugares aparecem conforme você acumula experiência.</p></div><b>{unlockedCount} regiões descobertas</b></div>
        <div className="world-map">
          <div className="world-map-path" />
          {REGIONS.map((region, index) => {
            const unlocked = xp >= region.unlock;
            const discovered = (world.discoveries || []).includes(region.id);
            return <button key={region.id} className={`world-region ${region.tone} ${unlocked ? 'is-open' : 'is-locked'} ${activeRegion === region.id ? 'is-selected' : ''}`} style={{ '--region-index': index }} onClick={() => setActiveRegion(region.id)}>
              <span className="region-icon">{unlocked ? region.icon : '🔒'}</span><strong>{region.name}</strong><small>{unlocked ? (discovered ? 'Explorado' : 'Disponível') : `${region.unlock} XP necessários`}</small>
            </button>;
          })}
        </div>
        <div className="world-region-detail"><div className="region-detail-icon">{selectedRegion.icon}</div><div className="region-detail-copy"><span>{xp >= selectedRegion.unlock ? 'REGIÃO DISPONÍVEL' : 'REGIÃO BLOQUEADA'}</span><h3>{selectedRegion.name}</h3><p>{selectedRegion.description}</p><small>Habilidade relacionada: {selectedRegion.skill}</small></div>{xp >= selectedRegion.unlock ? <button onClick={() => explore(selectedRegion)}>{(world.discoveries || []).includes(selectedRegion.id) ? '✓ Já explorada' : '✨ Explorar (+15 moedas)'}</button> : <div className="region-lock-note">Faltam {selectedRegion.unlock - xp} XP</div>}</div>
      </section>

      <section className="world-section">
        <div className="world-section-heading"><div><span>AVENTURAS DO DIA</span><h2>📜 Quadro de missões</h2><p>Pequenos desafios opcionais baseados no que você já faz.</p></div><button className="world-link" onClick={() => onNavigate?.('tasks')}>Abrir tarefas →</button></div>
        <div className="world-mission-grid">{dailyMissions.map((mission) => {
          const done = mission.current >= mission.target;
          const isClaimed = Boolean(claimed[`${today}:${mission.id}`]);
          const pct = Math.min(100, mission.current / mission.target * 100);
          return <article className={`world-mission ${done ? 'mission-ready' : ''}`} key={mission.id}><div className="mission-top"><span>{mission.icon}</span><b>{done ? (isClaimed ? 'RECOMPENSA RECEBIDA' : 'CONCLUÍDA') : 'MISSÃO OPCIONAL'}</b></div><h3>{mission.title}</h3><p>{mission.detail}</p><div className="mission-progress"><i style={{ width: `${pct}%` }} /></div><div className="mission-bottom"><small>{Math.min(mission.current, mission.target)}/{mission.target} · +{mission.xp} XP · +{mission.coins} moedas</small>{isClaimed ? <span className="mission-claimed">✓ Resgatada</span> : done ? <button onClick={() => claimMission(mission)}>Resgatar</button> : <button className="mission-go" onClick={() => onNavigate?.(mission.action)}>Continuar →</button>}</div></article>;
        })}</div>
      </section>

      <section className="world-section">
        <div className="world-section-heading"><div><span>EVOLUÇÃO DO PERSONAGEM</span><h2>🌳 Habilidades que você desenvolve</h2><p>Indicadores calculados a partir das suas atividades registradas.</p></div></div>
        <div className="world-skills">{skillStats.map((skill) => { const skillLevel = Math.floor(skill.value / 100) + 1; const skillProgress = skill.value % 100; return <article key={skill.name}><div className="skill-icon">{skill.icon}</div><div className="skill-main"><div><strong>{skill.name}</strong><b>Nível {skillLevel}</b></div><div className="skill-track"><i style={{ width: `${skillProgress}%` }} /></div><small>{skill.hint} · {skill.value.toLocaleString('pt-BR')} pontos</small></div></article>; })}</div>
      </section>

      <section className="world-section world-shop-section">
        <div className="world-section-heading"><div><span>PERSONALIZAÇÃO</span><h2>🎒 Loja do aventureiro</h2><p>Troque moedas por itens cosméticos. Suas atividades continuam sendo a prioridade.</p></div><b>🪙 {coins}</b></div>
        <div className="world-shop-grid">{COSMETICS.map((item) => { const isOwned = owned.includes(item.id); return <article key={item.id}><span>{item.icon}</span><div><strong>{item.name}</strong><small>{item.detail}</small></div><button disabled={isOwned || coins < item.cost} onClick={() => buyCosmetic(item)}>{isOwned ? 'Desbloqueado' : `🪙 ${item.cost}`}</button></article>; })}</div>
      </section>
      <footer className="world-footer">{nextRegion ? `Próximo destino: ${nextRegion.name} · ${nextRegion.unlock - xp} XP para abrir.` : 'Todas as regiões estão disponíveis. Continue construindo sua própria história!'} <span>🌱 Seu progresso não desaparece quando você descansa.</span></footer>
    </main>
  );
}

const styles = `
.world-page{--w-ink:var(--text,#24283b);--w-muted:var(--muted,#788097);--w-card:var(--card-bg,#fff);--w-line:var(--border-color,rgba(120,130,160,.18));max-width:1240px;margin:0 auto;padding:clamp(14px,2.4vw,28px);color:var(--w-ink)}
.world-page *{box-sizing:border-box}.world-hero{position:relative;display:grid;grid-template-columns:minmax(0,1.5fr) minmax(220px,.65fr);gap:24px;align-items:center;overflow:hidden;padding:clamp(22px,4vw,42px);border-radius:26px;background:radial-gradient(circle at 82% 10%,rgba(255,255,255,.24),transparent 30%),linear-gradient(125deg,#142d3b,#1d5b58 55%,#527b55);color:#f6fff7;box-shadow:0 18px 45px rgba(20,55,53,.18)}
.world-hero:after{content:'✦  ·  ✧     ·       ✦';position:absolute;right:28%;top:14%;font-size:28px;letter-spacing:18px;color:#e3f2cb;opacity:.5;pointer-events:none}.world-eyebrow,.world-section-heading>div>span{font-size:10px;font-weight:900;letter-spacing:2px;opacity:.75}.world-hero h1{font-size:clamp(25px,3.4vw,40px);line-height:1.1;margin:12px 0}.world-hero p{max-width:650px;color:rgba(245,255,246,.82);line-height:1.65;margin:0}.world-hero-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:22px}.world-hero button,.world-region-detail>button,.world-mission button,.world-shop-grid button{border:0;border-radius:12px;padding:11px 15px;font-weight:800;cursor:pointer;background:#e8f4cf;color:#243b2b}.world-hero button.world-secondary{background:rgba(255,255,255,.13);color:white;border:1px solid rgba(255,255,255,.25)}.world-avatar-card{justify-self:end;width:min(100%,230px);display:flex;flex-direction:column;align-items:center;padding:18px;border-radius:20px;background:rgba(8,25,30,.28);border:1px solid rgba(255,255,255,.2);backdrop-filter:blur(8px)}.world-avatar{font-size:66px;filter:drop-shadow(0 7px 3px rgba(0,0,0,.18))}.world-avatar-card>span{font-size:9px;letter-spacing:2px;color:#cde8d4}.world-avatar-card strong{font-size:24px;margin:4px}.world-avatar-card small{font-size:11px;color:#e1f0e2}.world-level-track,.mission-progress,.skill-track{width:100%;height:8px;border-radius:20px;background:rgba(0,0,0,.17);overflow:hidden;margin:10px 0 6px}.world-level-track i,.mission-progress i,.skill-track i{display:block;height:100%;border-radius:inherit;background:#d7ee9d;transition:width .35s}.world-notice{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:14px 0;padding:13px 16px;background:#eaf5df;color:#294b2c;border:1px solid #d2e6c1;border-radius:14px;font-weight:700}.world-notice button{border:0;background:transparent;font-size:22px;color:inherit;cursor:pointer}.world-stat-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:18px 0 28px}.world-stat-row article{display:flex;align-items:center;gap:12px;padding:16px;background:var(--w-card);border:1px solid var(--w-line);border-radius:17px;min-width:0}.world-stat-row article>span{display:grid;place-items:center;width:42px;height:42px;background:rgba(113,151,100,.13);border-radius:13px;font-size:21px}.world-stat-row article div{display:grid;min-width:0}.world-stat-row strong{font-size:20px}.world-stat-row small{color:var(--w-muted);font-size:11px}.world-section{margin:28px 0}.world-section-heading{display:flex;justify-content:space-between;align-items:end;gap:15px;margin-bottom:15px}.world-section-heading>div>span{color:#72956a;opacity:1}.world-section-heading h2{font-size:clamp(19px,2.2vw,25px);margin:5px 0}.world-section-heading p{margin:0;color:var(--w-muted);font-size:13px}.world-section-heading>b{font-size:12px;color:var(--w-muted);white-space:nowrap}.world-map{position:relative;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;padding:22px;border:1px solid var(--w-line);border-radius:22px;background:linear-gradient(145deg,rgba(106,155,102,.12),rgba(104,160,177,.09)),var(--w-card);overflow:hidden}.world-map:before,.world-map:after{content:'';position:absolute;border-radius:50%;background:rgba(125,169,105,.12);width:180px;height:180px;pointer-events:none}.world-map:before{left:-80px;top:35px}.world-map:after{right:-80px;bottom:-100px;background:rgba(93,153,180,.12)}.world-map-path{position:absolute;left:12%;right:12%;top:50%;height:2px;border-top:2px dashed rgba(112,153,111,.35)}.world-region{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:5px;min-height:132px;padding:15px 8px;border:1px solid var(--w-line);border-radius:17px;background:var(--w-card);color:var(--w-ink);cursor:pointer;transition:transform .2s,border-color .2s,box-shadow .2s}.world-region:hover{transform:translateY(-3px)}.world-region.is-selected{border-color:#79a76d;box-shadow:0 0 0 3px rgba(121,167,109,.15)}.region-icon{display:grid;place-items:center;width:54px;height:54px;border-radius:17px;background:rgba(125,169,105,.16);font-size:27px}.world-region strong{font-size:12px;text-align:center}.world-region small{font-size:10px;color:var(--w-muted)}.world-region.is-locked{opacity:.65;filter:saturate(.4)}.world-region.knowledge .region-icon{background:#e5e9fa}.world-region.forge .region-icon{background:#f8e6d9}.world-region.coast .region-icon{background:#dff0f2}.world-region.cosmos .region-icon{background:#e9e1f8}.world-region.legend .region-icon{background:#f6e9c9}.world-region-detail{display:flex;align-items:center;gap:15px;padding:17px;margin-top:12px;border:1px solid var(--w-line);border-radius:17px;background:var(--w-card)}.region-detail-icon{display:grid;place-items:center;flex:0 0 54px;height:54px;border-radius:16px;background:rgba(118,155,103,.14);font-size:28px}.region-detail-copy{flex:1;min-width:0}.region-detail-copy>span{font-size:9px;font-weight:900;letter-spacing:1.5px;color:#72956a}.region-detail-copy h3{margin:3px 0;font-size:16px}.region-detail-copy p{margin:0 0 4px;color:var(--w-muted);font-size:12px}.region-detail-copy small,.region-lock-note{font-size:11px;color:var(--w-muted)}.world-region-detail>button{white-space:nowrap}.world-mission-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px}.world-mission{padding:17px;background:var(--w-card);border:1px solid var(--w-line);border-radius:17px;min-width:0}.world-mission.mission-ready{border-color:rgba(111,164,91,.55);background:linear-gradient(145deg,rgba(126,173,100,.09),var(--w-card))}.mission-top{display:flex;align-items:center;justify-content:space-between}.mission-top>span{font-size:24px}.mission-top>b{font-size:8px;letter-spacing:1px;color:var(--w-muted)}.world-mission h3{font-size:15px;margin:12px 0 5px}.world-mission p{font-size:12px;color:var(--w-muted);margin:0}.mission-progress{height:7px;background:rgba(130,140,160,.18);margin:17px 0 10px}.mission-progress i{background:#83ad6b}.mission-bottom{display:flex;align-items:center;justify-content:space-between;gap:8px}.mission-bottom small{font-size:10px;color:var(--w-muted)}.world-mission button{padding:8px 10px;font-size:10px;white-space:nowrap;background:#e8f2dc}.world-mission button.mission-go{background:rgba(122,151,173,.13);color:var(--w-ink)}.mission-claimed{font-size:10px;font-weight:800;color:#67965d}.world-skills{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.world-skills article{display:flex;align-items:center;gap:13px;padding:16px;background:var(--w-card);border:1px solid var(--w-line);border-radius:16px}.skill-icon{display:grid;place-items:center;width:45px;height:45px;flex:0 0 45px;background:rgba(125,169,105,.14);border-radius:14px;font-size:22px}.skill-main{flex:1;min-width:0}.skill-main>div:first-child{display:flex;justify-content:space-between;gap:8px}.skill-main strong{font-size:13px}.skill-main b{font-size:10px;color:#72956a}.skill-track{height:6px;background:rgba(130,140,160,.16);margin:8px 0 5px}.skill-track i{background:#80a96c}.skill-main small{font-size:10px;color:var(--w-muted)}.world-shop-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.world-shop-grid article{display:flex;align-items:center;gap:12px;padding:15px;background:var(--w-card);border:1px solid var(--w-line);border-radius:16px}.world-shop-grid article>span{font-size:28px}.world-shop-grid article>div{flex:1;min-width:0;display:grid;gap:4px}.world-shop-grid strong{font-size:12px}.world-shop-grid small{font-size:10px;color:var(--w-muted)}.world-shop-grid button{padding:8px 10px;font-size:10px;white-space:nowrap;background:#e7f0dd}.world-shop-grid button:disabled{opacity:.65;cursor:default}.world-link{border:0;background:transparent;color:#6f9666;font-weight:800;cursor:pointer}.world-footer{padding:16px;border-radius:15px;background:rgba(116,153,104,.1);color:var(--w-muted);font-size:12px;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}.world-footer span{color:#719368;font-weight:700}
body.dark .world-page{--w-card:#20263a;--w-line:rgba(190,200,225,.13);--w-ink:#f0f2f8;--w-muted:#aeb6ca}body.dark .world-region.knowledge .region-icon{background:#343b5a}body.dark .world-region.forge .region-icon{background:#4a3935}body.dark .world-region.coast .region-icon{background:#2d454f}body.dark .world-region.cosmos .region-icon{background:#403650}body.dark .world-region.legend .region-icon{background:#51472e}body.dark .world-notice{background:#263c2b;color:#d9f0d4;border-color:#3b5940}body.dark .world-mission button,body.dark .world-shop-grid button{background:#354b37;color:#e5f4df}body.dark .world-mission button.mission-go{background:#343b51;color:#e9ecf6}
@media(max-width:760px){.world-hero{grid-template-columns:1fr}.world-avatar-card{justify-self:start;width:100%;max-width:none;display:grid;grid-template-columns:auto 1fr;column-gap:13px;justify-items:start}.world-avatar{grid-row:span 4;font-size:48px}.world-stat-row{grid-template-columns:repeat(2,minmax(0,1fr))}.world-map{grid-template-columns:repeat(2,minmax(0,1fr));padding:12px}.world-map-path{display:none}.world-mission-grid,.world-shop-grid{grid-template-columns:1fr}.world-skills{grid-template-columns:1fr}.world-region-detail{align-items:flex-start;flex-wrap:wrap}.region-detail-copy{min-width:calc(100% - 75px)}.world-region-detail>button{width:100%}.world-section-heading{align-items:flex-start;flex-direction:column}.world-section-heading>b{white-space:normal}}
@media(max-width:420px){.world-page{padding:10px}.world-hero{padding:20px;border-radius:19px}.world-hero-actions{display:grid}.world-hero-actions button{width:100%}.world-stat-row article{padding:12px;gap:8px}.world-stat-row article>span{width:34px;height:34px}.world-stat-row strong{font-size:17px}.world-region{min-height:120px}.world-footer{display:grid}}
`;
