import React from 'react';
import Shop from './Shop';

export default function Gamification({ data = {}, completedTasks = [], save }) {
  const xp = Number(data.xp || 0);
  const coins = Number(data.coins || 0);
  const level = Math.floor(xp / 100) + 1;
  const xpIntoLevel = xp % 100;
  const streak = calculateStreak(data);

  const achievements = [
    [completedTasks.length >= 1, '🌱', 'Primeiro passo', '1 tarefa'],
    [completedTasks.length >= 5, '⚡', 'Ritmo', '5 tarefas'],
    [completedTasks.length >= 10, '🚀', 'Imparável', '10 tarefas'],
    [streak >= 3, '🔥', 'Consistência', '3 dias'],
    [xp >= 1500, '⭐', 'Colecionador', '1.500 XP'],
    [coins >= 500, '🪙', 'Economista', '500 moedas'],
  ];

  const tasks = Array.isArray(data.tasks) ? data.tasks : [];
  const nextMilestone = xp < 1500
    ? `${1500 - xp} XP para desbloquear Colecionador.`
    : coins < 500
      ? `${500 - coins} moedas para desbloquear Economista.`
      : 'Você já alcançou os principais marcos básicos!';

  return (
    <main className="gamification-page">
      <style>{styles}</style>

      <header className="gamification-header">
        <div>
          <span className="eyebrow">CENTRAL DE PROGRESSO</span>
          <h1>🎮 Gamificação</h1>
          <p>Acompanhe sua evolução, desbloqueie conquistas e use suas moedas na loja.</p>
        </div>
        <div className="level-badge">
          <span>🏆</span>
          <div><small>NÍVEL ATUAL</small><strong>{level}</strong></div>
        </div>
      </header>

      <section className="gami-stats">
        <article className="gami-stat"><span className="stat-icon">⭐</span><div><strong>{xp.toLocaleString('pt-BR')}</strong><span>XP total</span></div></article>
        <article className="gami-stat"><span className="stat-icon">🏆</span><div><strong>{level}</strong><span>nível atual</span></div></article>
        <article className="gami-stat"><span className="stat-icon">🪙</span><div><strong>{coins.toLocaleString('pt-BR')}</strong><span>moedas disponíveis</span></div></article>
        <article className="gami-stat"><span className="stat-icon">🔥</span><div><strong>{streak}</strong><span>dias de sequência</span></div></article>
      </section>

      <section className="gami-panel">
        <div className="section-heading">
          <div><span className="section-icon">📈</span><div><h2>Progresso do nível</h2><p>Conclua tarefas para acumular XP e subir de nível.</p></div></div>
          <strong>{xpIntoLevel}/100 XP</strong>
        </div>
        <div className="progress-track"><div className="progress-fill" style={{ width: `${xpIntoLevel}%` }} /></div>
        <div className="progress-labels"><span>Nível {level}</span><span>{100 - xpIntoLevel} XP para o nível {level + 1}</span></div>
      </section>

      <section className="gami-panel">
        <div className="section-heading">
          <div><span className="section-icon">🎖️</span><div><h2>Conquistas</h2><p>Marcos para reconhecer seu esforço e consistência.</p></div></div>
          <span className="achievement-count">{achievements.filter(([unlocked]) => unlocked).length}/{achievements.length} desbloqueadas</span>
        </div>
        <div className="achievement-grid">
          {achievements.map(([unlocked, icon, name, goal]) => (
            <article className={`achievement ${unlocked ? 'unlocked' : 'locked'}`} key={name}>
              <span className="achievement-icon">{unlocked ? icon : '🔒'}</span>
              <div><strong>{name}</strong><p>{unlocked ? 'Conquista desbloqueada!' : `Meta: ${goal}`}</p></div>
              <span className={`achievement-status ${unlocked ? 'status-unlocked' : ''}`}>{unlocked ? 'Obtida' : 'Bloqueada'}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="gami-panel">
        <div className="section-heading">
          <div><span className="section-icon">⚔️</span><div><h2>Dificuldade das tarefas</h2><p>Uma visão rápida do esforço estimado por tarefa.</p></div></div>
        </div>
        {tasks.length ? <div className="task-difficulty-list">
          {tasks.slice(0, 6).map((task, index) => {
            const taskXp = Number(task.xp || 0);
            return <div className="difficulty-row" key={task.id ?? `${task.name || task.title}-${index}`}>
              <span className="difficulty-task">{task.name || task.title || 'Tarefa sem título'}</span>
              <span className={`difficulty-pill difficulty-${getDifficultyKey(taskXp)}`}>{getDifficulty(taskXp)}</span>
              <strong>{taskXp} XP</strong>
            </div>;
          })}
        </div> : <p className="empty-state">Suas tarefas cadastradas aparecerão aqui.</p>}
      </section>

      <section className="gami-panel milestone-panel">
        <span className="milestone-icon">🎁</span>
        <div><h2>Próximo marco</h2><p>{nextMilestone}</p></div>
      </section>

      <section className="gami-panel shop-panel">
        <div className="section-heading">
          <div><span className="section-icon">🛍️</span><div><h2>Loja de recompensas</h2><p>Crie recompensas personalizadas e resgate-as usando suas moedas.</p></div></div>
          <div className="shop-balance">🪙 {coins}</div>
        </div>
        <Shop data={data} save={save} />
      </section>
    </main>
  );
}

function getDifficulty(xp) {
  if (xp >= 80) return '🔥 ÉPICA';
  if (xp >= 50) return '⚔️ DIFÍCIL';
  if (xp >= 30) return '🎯 MÉDIA';
  return '🌱 FÁCIL';
}

function getDifficultyKey(xp) {
  if (xp >= 80) return 'epic';
  if (xp >= 50) return 'hard';
  if (xp >= 30) return 'medium';
  return 'easy';
}

function calculateStreak(data) {
  const dates = Object.keys(data.history || {})
    .filter((date) => (data.history[date]?.completed || 0) > 0)
    .sort()
    .reverse();

  if (!dates.length) return 0;

  let streak = 1;
  for (let i = 0; i < dates.length - 1; i++) {
    const current = new Date(`${dates[i]}T12:00:00`);
    const previous = new Date(`${dates[i + 1]}T12:00:00`);
    const difference = Math.round((current - previous) / 86400000);
    if (difference === 1) streak++;
    else break;
  }
  return streak;
}

const styles = `
.gamification-page{max-width:1180px;margin:0 auto;padding:24px;color:var(--text,#202436);font-family:inherit}
.gamification-page *{box-sizing:border-box}
.gamification-header{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-bottom:24px}
.gamification-header h1{font-size:clamp(1.8rem,3vw,2.4rem);margin:7px 0}
.gamification-header p,.section-heading p{color:var(--muted,#777d91);margin:0;line-height:1.5}
.eyebrow{font-size:.72rem;letter-spacing:.14em;font-weight:800;color:#7567e8}
.level-badge{display:flex;align-items:center;gap:12px;background:linear-gradient(135deg,#7667e8,#9c78ef);color:white;padding:14px 20px;border-radius:18px;box-shadow:0 10px 28px #7667e82b;min-width:145px}
.level-badge>span{font-size:2rem}.level-badge small{display:block;font-size:.65rem;opacity:.85;letter-spacing:.08em}.level-badge strong{font-size:1.7rem}
.gami-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:18px}
.gami-stat{display:flex;align-items:center;gap:13px;padding:20px;border:1px solid var(--border,#e9eaf2);background:var(--card,#fff);border-radius:18px;min-width:0}
.stat-icon{display:grid;place-items:center;width:46px;height:46px;border-radius:14px;background:#f0efff;font-size:1.45rem;flex-shrink:0}
.gami-stat strong{display:block;font-size:1.55rem;line-height:1.2}.gami-stat span:last-child{display:block;font-size:.82rem;color:var(--muted,#777d91);margin-top:4px}
.gami-panel{background:var(--card,#fff);border:1px solid var(--border,#e9eaf2);border-radius:20px;padding:22px;margin-bottom:18px}
.section-heading{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:18px}
.section-heading>div{display:flex;align-items:center;gap:12px;min-width:0}
.section-icon{width:44px;height:44px;border-radius:14px;background:#f1efff;display:grid;place-items:center;font-size:1.35rem;flex-shrink:0}
.section-heading h2,.milestone-panel h2{font-size:1.08rem;margin:0 0 4px}.section-heading p{font-size:.86rem}
.section-heading>strong,.achievement-count{font-size:.82rem;color:#7567e8;white-space:nowrap}
.progress-track{height:12px;background:var(--border,#ececf4);border-radius:999px;overflow:hidden}.progress-fill{height:100%;background:linear-gradient(90deg,#7667e8,#a178ef);border-radius:999px;transition:width .25s ease}
.progress-labels{display:flex;justify-content:space-between;gap:10px;margin-top:9px;color:var(--muted,#777d91);font-size:.8rem}
.achievement-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.achievement{display:flex;align-items:center;gap:12px;border-radius:15px;padding:14px;min-width:0;border:1px solid var(--border,#ececf4)}
.achievement.unlocked{background:#f0faf5;border-color:#d5f0e1}.achievement.locked{background:var(--surface,#f8f8fc)}
.achievement-icon{font-size:1.7rem;flex-shrink:0}.achievement>div{flex:1;min-width:0}.achievement strong{font-size:.9rem}.achievement p{font-size:.8rem;color:var(--muted,#777d91);margin:4px 0 0}
.achievement-status{font-size:.68rem;color:#9295a5;white-space:nowrap}.status-unlocked{color:#16845b;font-weight:800}
.task-difficulty-list{display:grid;gap:0}.difficulty-row{display:flex;align-items:center;gap:12px;padding:13px 0;border-bottom:1px solid var(--border,#eeeef4)}.difficulty-row:last-child{border-bottom:0}.difficulty-task{flex:1;min-width:0;overflow-wrap:anywhere}.difficulty-row>strong{font-size:.82rem;white-space:nowrap}.difficulty-pill{font-size:.7rem;font-weight:800;padding:6px 9px;border-radius:999px;white-space:nowrap}.difficulty-easy{background:#e9f8ef;color:#218454}.difficulty-medium{background:#fff5d9;color:#987018}.difficulty-hard{background:#ffeadf;color:#b65726}.difficulty-epic{background:#f0e9ff;color:#744ac4}
.empty-state{padding:16px;background:var(--surface,#f8f8fc);border-radius:12px;color:var(--muted,#777d91);margin:0}
.milestone-panel{display:flex;align-items:center;gap:16px;background:linear-gradient(115deg,#f7f4ff,#fff9e9);border-color:#e9e0ff}.milestone-icon{font-size:2.2rem}.milestone-panel p{margin:0;color:#65677b}
.shop-balance{font-weight:800;color:#9a6b05;background:#fff6d9;border-radius:12px;padding:10px 13px;white-space:nowrap}
.shop-panel .card{border:0;padding:0;margin:0;background:transparent;box-shadow:none}
.shop-panel .subtitle{color:var(--muted,#777d91)}
.shop-panel .focus{border:1px solid var(--border,#e9eaf2);background:var(--surface,#f8f8fc);padding:16px;border-radius:15px}
.shop-panel input{max-width:100%;width:100%;padding:11px 12px;border:1px solid var(--border,#dfe1eb);border-radius:10px;background:var(--card,#fff);color:inherit}
.shop-panel button{font:inherit;cursor:pointer}
.shop-panel button:disabled{cursor:not-allowed}
.shop-panel .primary{border:0;border-radius:10px;padding:9px 14px;background:#7667e8;color:#fff;font-weight:750}
.shop-panel .ghost{border:1px solid var(--border,#dfe1eb);border-radius:10px;padding:8px 12px;background:transparent;color:inherit}
.shop-panel .task{display:flex;gap:12px;flex-wrap:wrap}
.shop-panel .tag{font-size:.78rem;font-weight:800;padding:5px 8px;border-radius:999px;background:#f0efff;color:#7567e8;white-space:nowrap}
.shop-panel .shop-notification{padding:10px 14px;border-radius:10px;background:rgba(109,93,252,.12);color:var(--site-primary,#6655e8);font-weight:600;margin-bottom:14px}
.shop-panel .shop-form{display:grid;grid-template-columns:2fr 1fr auto;gap:8px;margin-top:10px}
@media(max-width:850px){.gami-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:600px){.gamification-page{padding:14px}.gamification-header{align-items:flex-start;flex-direction:column}.level-badge{width:100%}.gami-panel{padding:16px}.achievement-grid{grid-template-columns:1fr}.achievement-status{display:none}.section-heading{align-items:flex-start}.section-heading>strong,.achievement-count{white-space:normal;text-align:right}.difficulty-row{gap:7px;flex-wrap:wrap}.difficulty-task{flex-basis:100%}.shop-panel .shop-form{grid-template-columns:1fr}.shop-panel .task{align-items:flex-start}.shop-panel .task>div{width:100%}}
/* Contraste no tema escuro */
body.dark .gamification-page{color:var(--site-on-background,#f0f2f5)}
body.dark .gamification-header p,
body.dark .section-heading p,
body.dark .gami-stat span:last-child,
body.dark .achievement p,
body.dark .progress-labels{color:var(--site-text-muted,#aeb4c7)}
body.dark .gami-stat,
body.dark .gami-panel{background:var(--site-card-bg,#1a1d2b);border-color:var(--site-border,#34394f);color:var(--site-on-background,#f0f2f5)}
body.dark .stat-icon,
body.dark .section-icon{background:rgba(139,121,255,.17)}
body.dark .achievement{border-color:var(--site-border,#34394f)}
body.dark .achievement.unlocked{background:rgba(33,132,84,.15);border-color:rgba(82,196,139,.3)}
body.dark .achievement.locked{background:#202437}
body.dark .achievement-status{color:#aeb4c7}
body.dark .status-unlocked{color:#83dfb4}
body.dark .difficulty-easy{background:rgba(33,132,84,.2);color:#83dfb4}
body.dark .difficulty-medium{background:rgba(152,112,24,.2);color:#f1d078}
body.dark .difficulty-hard{background:rgba(182,87,38,.2);color:#ffb18a}
body.dark .difficulty-epic{background:rgba(116,74,196,.22);color:#c7aaff}
body.dark .empty-state{background:#202437;color:#c5cad9}
body.dark .milestone-panel{background:linear-gradient(115deg,#25213a,#302b25);border-color:#49405f}
body.dark .milestone-panel p{color:#c5cad9}
body.dark .shop-balance{background:rgba(154,107,5,.2);color:#f3cf78}
body.dark .shop-panel .focus{background:#202437;border-color:var(--site-border)}
body.dark .shop-panel input{background:#141724;color:var(--site-on-background);border-color:#3a4058}
body.dark .shop-panel .tag{background:rgba(139,121,255,.17);color:#c3b8ff}

`;
