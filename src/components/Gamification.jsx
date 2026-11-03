import React from 'react';
import Shop from './Shop';

export default function Gamification({ data = {}, completedTasks = [], save }) {
  const xp = Number(data.xp || 0);
  const coins = Number(data.coins || 0);
  const level = Math.floor(xp / 100) + 1;
  const xpIntoLevel = xp % 100;
  const streak = calculateStreak(data);



  const tasks = Array.isArray(data.tasks) ? data.tasks : [];
  const goals = Array.isArray(data.goals) ? data.goals : [];
  const habits = Array.isArray(data.habits) ? data.habits : [];
  const areas = Array.isArray(data.areas) ? data.areas : [];
  const studySessions = Array.isArray(data.studySessions) ? data.studySessions : [];
  const completedGoals = goals.filter((goal) => goal.status === 'completed' || Number(goal.progress) >= 100);
  const completedTasksCount = tasks.filter((task) => task.done).length;
  const habitCompletions = habits.reduce((total, habit) => total + Object.values(habit.history || {}).filter(Boolean).length, 0);
  const studyMinutes = studySessions.reduce((total, session) => total + Math.max(0, Number(session.minutes) || 0), 0);

  const studySessionsCount = studySessions.length;
  const diaryEntries = Array.isArray(data.diaryEntries) ? data.diaryEntries.length : 0;
  const collections = Array.isArray(data.collections) ? data.collections.length : 0;

  const achievementMetrics = {
    tasks: completedTasksCount,
    streak,
    xp,
    coins,
    studies: studySessionsCount,
    goals: completedGoals.length,
    habits: habitCompletions,
    diary: diaryEntries,
    collections,
  };

  const achievementBaseline = data.gamification?.achievementBaseline || {};
  const achievementMetric = (key, value) => Math.max(0, Number(value || 0) - Number(achievementBaseline[key] || 0));

  const resetGamification = () => {
    const confirmed = window.confirm(
      'Reiniciar a gamificação? XP, moedas, sequência, missões e recompensas serão zerados. Tarefas, hábitos, estudos, objetivos e demais dados não serão apagados.'
    );
    if (!confirmed) return;

    save({
      ...data,
      xp: 0,
      coins: 0,
      gamification: {
        ...(data.gamification || {}),
        missions: [],
        rewards: [],
        streak: 0,
      },
    });
  };

  const resetAchievements = () => {
    const confirmed = window.confirm(
      'Reiniciar todas as conquistas?\n\nO progresso das conquistas será zerado e as atividades antigas deixarão de contar para os próximos marcos. XP, moedas, tarefas e estudos não serão apagados.'
    );
    if (!confirmed) return;

    save({
      ...data,
      gamification: {
        ...(data.gamification || {}),
        achievements: [],
        achievementBaseline: achievementMetrics,
      },
    });
  };
  // Conquistas são geradas por linhas infinitas. Quando o último marco é atingido,
  // o próximo cresce automaticamente, sem precisar cadastrar milhares de badges.
  const achievementFamilies = [
    { icon: '⚡', name: 'Imparável', metric: achievementMetric('tasks', completedTasksCount), label: 'tarefas concluídas', targets: [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500], growth: 2.5 },
    { icon: '🔥', name: 'Consistência', metric: achievementMetric('streak', streak), label: 'dias de sequência', targets: [1, 3, 7, 14, 30, 60, 100, 180, 365], growth: 2 },
    { icon: '⭐', name: 'Colecionador de XP', metric: achievementMetric('xp', xp), label: 'XP acumulado', targets: [100, 500, 1500, 5000, 10000, 25000, 50000, 100000], growth: 2.5 },
    { icon: '🪙', name: 'Economista', metric: achievementMetric('coins', coins), label: 'moedas acumuladas', targets: [100, 500, 1000, 2500, 5000, 10000, 25000, 50000], growth: 2.5 },
    { icon: '📚', name: 'Mestre dos Estudos', metric: achievementMetric('studies', studySessionsCount), label: 'sessões de estudo', targets: [1, 5, 10, 25, 50, 100, 250, 500, 1000], growth: 2.5 },
    { icon: '🎯', name: 'Conquistador', metric: achievementMetric('goals', completedGoals.length), label: 'objetivos concluídos', targets: [1, 3, 5, 10, 25, 50, 100, 250, 500], growth: 2.5 },
    { icon: '💪', name: 'Construtor de Hábitos', metric: achievementMetric('habits', habitCompletions), label: 'hábitos cumpridos', targets: [1, 7, 30, 100, 365, 500, 1000, 2500], growth: 2.5 },
    { icon: '📝', name: 'Cronista', metric: achievementMetric('diary', diaryEntries), label: 'registros no diário', targets: [1, 7, 30, 100, 365, 500, 1000, 2500], growth: 2.5 },
    { icon: '🗂️', name: 'Colecionador', metric: achievementMetric('collections', collections), label: 'itens em coleções', targets: [1, 5, 10, 25, 50, 100, 250, 500, 1000], growth: 2.5 },
  ];

  const achievements = buildInfiniteAchievements(achievementFamilies);
  const unlockedAchievements = achievements.filter((achievement) => achievement.unlocked).length;


  const rank = getRank(level);
  const attributes = [
    { icon: '⚔️', name: 'Disciplina', xp: completedTasksCount * 10 + habitCompletions * 5, source: 'tarefas + hábitos' },
    { icon: '📚', name: 'Conhecimento', xp: Math.round(studyMinutes + (Array.isArray(data.reviews) ? data.reviews.length * 10 : 0)), source: 'estudos + revisões' },
    { icon: '🎯', name: 'Foco', xp: Math.round(studyMinutes * 0.5 + tasks.filter((task) => task.done && String(task.priority || '').toLowerCase() === 'alta').length * 15), source: 'tempo estudado + prioridades' },
    { icon: '🔥', name: 'Consistência', xp: streak * 25 + habitCompletions * 2, source: 'sequência + hábitos' },
    { icon: '🏆', name: 'Realização', xp: completedGoals.length * 100 + completedTasksCount * 5, source: 'objetivos + execução' },
  ].map((attribute) => ({
    ...attribute,
    level: Math.floor(attribute.xp / 100) + 1,
    progress: attribute.xp % 100,
  }));

  const areaSkills = areas.map((area) => {
    const areaId = String(area.id);
    const taskXp = tasks
      .filter((task) => task.done && String(task.areaId || '') === areaId)
      .reduce((sum, task) => sum + Math.max(0, Number(task.xp) || 0), 0);
    const goalXp = goals
      .filter((goal) => (goal.status === 'completed' || Number(goal.progress) >= 100) && String(goal.areaId || '') === areaId)
      .reduce((sum, goal) => sum + Math.max(0, Number(goal.xpReward) || 100), 0);
    const studyXp = studySessions
      .filter((session) => String(session.areaId || '') === areaId)
      .reduce((sum, session) => sum + Math.max(0, Number(session.minutes) || 0), 0);
    const skillXp = Math.round(taskXp + goalXp + studyXp);
    return {
      ...area,
      skillXp,
      level: Math.floor(skillXp / 100) + 1,
      progress: skillXp % 100,
      contributions: [
        taskXp ? `${taskXp} XP tarefas` : null,
        goalXp ? `${goalXp} XP objetivos` : null,
        studyXp ? `${studyXp} XP estudos` : null,
      ].filter(Boolean),
    };
  });
  const nextAchievement = achievements.find((achievement) => !achievement.unlocked);
  const nextMilestone = nextAchievement
    ? `${Math.max(0, nextAchievement.target - nextAchievement.metric).toLocaleString('pt-BR')} ${nextAchievement.label} para ${nextAchievement.name}.`
    : 'Você alcançou todos os marcos exibidos. A próxima conquista é gerada automaticamente.';

  return (
    <main className="gamification-page">
      <style>{styles}</style>

      <header className="gamification-header">
        <div>
          <span className="eyebrow">CENTRAL DE PROGRESSO</span>
          <h1>🎮 Gamificação</h1>
          <p>Acompanhe sua evolução, desbloqueie conquistas e use suas moedas na loja.</p>
        </div>
        <div className="gamification-actions">
          <div className="level-badge">
            <span>🏆</span>
            <div><small>NÍVEL ATUAL</small><strong>{level}</strong></div>
          </div>
          <button type="button" className="reset-gamification-btn" onClick={resetGamification} title="Zerar XP, moedas, sequência, missões e recompensas">
            ↻ Reiniciar progresso
          </button>
          <button type="button" className="reset-achievements-btn" onClick={resetAchievements} title="Zerar somente as conquistas">
            🏆 Reiniciar conquistas
          </button>
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
          <div><span className="section-icon">⚔️</span><div><h2>Missões de hoje</h2><p>Objetivos simples para transformar progresso em hábito.</p></div></div>
        </div>
        <div className="mission-grid">
          {[
            {
              icon: '✅',
              title: 'Concluir 3 tarefas',
              current: completedTasks.filter((task) => task.completedAt?.slice?.(0, 10) === new Date().toISOString().slice(0, 10)).length,
              target: 3,
              reward: '+60 XP',
            },
            {
              icon: '🔥',
              title: 'Manter sua sequência',
              current: streak > 0 ? 1 : 0,
              target: 1,
              reward: '+30 XP',
            },
            {
              icon: '📚',
              title: 'Registrar um estudo',
              current: Array.isArray(data.studySessions)
                ? data.studySessions.filter((item) => String(item.date || '').slice(0, 10) === new Date().toISOString().slice(0, 10)).length
                : 0,
              target: 1,
              reward: '+40 XP',
            },
          ].map((mission) => {
            const progress = Math.min(100, (mission.current / mission.target) * 100);
            const done = progress >= 100;

            return (
              <article className="mission-card" key={mission.title}>
                <span className="mission-icon">{done ? '🏆' : mission.icon}</span>
                <div>
                  <strong>{mission.title}</strong>
                  <small>{done ? 'Concluída' : `${mission.current}/${mission.target}`} · {mission.reward}</small>
                  <div className="mission-track"><div style={{ width: `${progress}%` }} /></div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="gami-panel">
        <div className="section-heading">
          <div><span className="section-icon">🎖️</span><div><h2>Conquistas</h2><p>Marcos para reconhecer seu esforço e consistência.</p></div></div>
          <span className="achievement-count">{unlockedAchievements} desbloqueadas · linhas infinitas</span>
        </div>
        <div className="achievement-grid">
          {achievements.map((achievement) => (
            <article className={`achievement ${achievement.unlocked ? 'unlocked' : 'locked'}`} key={achievement.id}>
              <span className="achievement-icon">{achievement.unlocked ? achievement.icon : '🔒'}</span>
              <div>
                <strong>{achievement.name}</strong>
                <p>{achievement.unlocked ? `${achievement.metric.toLocaleString('pt-BR')} / ${achievement.target.toLocaleString('pt-BR')} ${achievement.label}` : `Meta: ${achievement.target.toLocaleString('pt-BR')} ${achievement.label}`}</p>
              </div>
              <span className={`achievement-status ${achievement.unlocked ? 'status-unlocked' : ''}`}>{achievement.unlocked ? 'Obtida' : 'Bloqueada'}</span>
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

      <section className="gami-panel rpg-sheet">
        <div className="section-heading">
          <div><span className="section-icon">🧙</span><div><h2>Ficha do personagem</h2><p>Seu progresso vira atributos de RPG. Eles evoluem automaticamente com o que você já faz no sistema.</p></div></div>
          <span className="rpg-rank">{rank}</span>
        </div>
        <div className="attribute-grid">
          {attributes.map((attribute) => (
            <article className="attribute-card" key={attribute.name}>
              <div className="attribute-top"><span className="attribute-icon">{attribute.icon}</span><div><strong>{attribute.name}</strong><small>Nível {attribute.level}</small></div><b>{attribute.xp} XP</b></div>
              <div className="attribute-track"><span style={{ width: `${attribute.progress}%` }} /></div>
              <small className="attribute-source">{attribute.source} · {100 - attribute.progress} XP para o próximo nível</small>
            </article>
          ))}
        </div>
      </section>

      <section className="gami-panel">
        <div className="section-heading">
          <div><span className="section-icon">🗺️</span><div><h2>Áreas como habilidades</h2><p>Cada área ganha experiência quando você conclui tarefas, objetivos ou registra estudos vinculados a ela.</p></div></div>
          <span className="achievement-count">{areaSkills.length} habilidades</span>
        </div>
        {areaSkills.length ? (
          <div className="skill-grid">
            {areaSkills.map((skill) => (
              <article className="skill-card" key={skill.id}>
                <div className="skill-card-top">
                  <span className="skill-icon">{skill.icon || '📂'}</span>
                  <div><strong>{skill.name}</strong><small>Nível {skill.level}</small></div>
                  <b>{skill.skillXp} XP</b>
                </div>
                <div className="skill-track"><span style={{ width: `${skill.progress}%` }} /></div>
                <small>{skill.contributions.length ? skill.contributions.join(' · ') : 'Ainda sem experiência registrada nesta área.'}</small>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">Crie áreas em Tarefas → Áreas e vincule seus objetivos ou tarefas. Elas aparecerão aqui como habilidades evolutivas.</p>
        )}
      </section>

      <section className="gami-panel rpg-rules">
        <div className="section-heading">
          <div><span className="section-icon">✨</span><div><h2>Como seu personagem evolui</h2><p>Não é uma barra separada: a gamificação acompanha sua rotina real.</p></div></div>
        </div>
        <div className="rpg-rule-grid">
          <div><span>✅</span><strong>Tarefa concluída</strong><small>Recebe o XP definido na própria tarefa.</small></div>
          <div><span>🔥</span><strong>Hábito cumprido</strong><small>Gera XP e fortalece Disciplina e Consistência.</small></div>
          <div><span>🎯</span><strong>Objetivo concluído</strong><small>Recebe a recompensa de XP configurada no objetivo.</small></div>
          <div><span>📚</span><strong>Estudo registrado</strong><small>Tempo estudado fortalece Conhecimento e Foco.</small></div>
        </div>
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

function buildInfiniteAchievements(families) {
  const result = [];

  families.forEach((family) => {
    const targets = [...family.targets];
    let guard = 0;
    while (targets[targets.length - 1] <= family.metric && guard < 100) {
      const next = Math.ceil(targets[targets.length - 1] * family.growth);
      targets.push(Math.max(next, targets[targets.length - 1] + 1));
      guard += 1;
    }

    // Mostra o histórico recente da linha + os próximos marcos, mantendo a interface leve.
    const unlockedIndexes = targets.reduce((last, target, index) => (family.metric >= target ? index : last), -1);
    const start = Math.max(0, unlockedIndexes - 1);
    const end = Math.min(targets.length, Math.max(start + 4, unlockedIndexes + 3));

    targets.slice(start, end).forEach((target, offset) => {
      const index = start + offset;
      result.push({
        id: `${family.name}-${target}`,
        icon: family.icon,
        name: index > 0 ? `${family.name} ${toRoman(index + 1)}` : family.name,
        target,
        metric: family.metric,
        label: family.label,
        unlocked: family.metric >= target,
      });
    });
  });

  return result;
}

function toRoman(number) {
  const values = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let value = number;
  let output = '';
  values.forEach(([unit, symbol]) => {
    while (value >= unit) {
      output += symbol;
      value -= unit;
    }
  });
  return output;
}

function getRank(level) {
  if (level >= 30) return '🌟 Lenda';
  if (level >= 20) return '👑 Mestre';
  if (level >= 12) return '⚔️ Especialista';
  if (level >= 7) return '🗺️ Explorador';
  if (level >= 3) return '🛡️ Aprendiz';
  return '🌱 Novato';
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

.mission-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.mission-card{display:flex;gap:11px;padding:14px;border:1px solid var(--border,#e9eaf2);border-radius:15px;background:var(--surface,#f8f8fc)}
.mission-icon{font-size:1.5rem;flex-shrink:0}.mission-card strong,.mission-card small{display:block}.mission-card strong{font-size:.86rem}.mission-card small{font-size:.74rem;color:var(--muted,#777d91);margin-top:4px}
.mission-track{height:7px;background:var(--border,#e9eaf2);border-radius:999px;overflow:hidden;margin-top:9px}.mission-track>div{height:100%;background:#7667e8;border-radius:999px}
@media(max-width:850px){.mission-grid{grid-template-columns:1fr}}
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

.gamification-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end}
.reset-gamification-btn{border:1px solid rgba(220,70,70,.28);background:transparent;color:#c53f4b;border-radius:12px;padding:10px 13px;font-weight:700;cursor:pointer;transition:.2s}
.reset-gamification-btn:hover{background:rgba(220,70,70,.08);transform:translateY(-1px)}
.reset-achievements-btn{border:1px solid rgba(109,93,252,.35);background:rgba(109,93,252,.08);color:#6d5dfc;border-radius:12px;padding:10px 13px;font-weight:800;cursor:pointer;transition:.2s}.reset-achievements-btn:hover{background:rgba(109,93,252,.15);transform:translateY(-1px)}
body.dark .reset-achievements-btn{color:#a99cff;border-color:rgba(169,156,255,.35);background:rgba(109,93,252,.12)}
body.dark .reset-gamification-btn{color:#ff8d98;border-color:rgba(255,141,152,.32)}
body.dark .reset-gamification-btn:hover{background:rgba(255,141,152,.1)}
@media(max-width:600px){.gamification-page{padding:14px}.gamification-header{align-items:flex-start;flex-direction:column}.gamification-actions{width:100%;justify-content:stretch}.gamification-actions .level-badge{flex:1}.reset-gamification-btn{flex:1}.level-badge{width:100%}.gami-panel{padding:16px}.achievement-grid{grid-template-columns:1fr}.achievement-status{display:none}.section-heading{align-items:flex-start}.section-heading>strong,.achievement-count{white-space:normal;text-align:right}.difficulty-row{gap:7px;flex-wrap:wrap}.difficulty-task{flex-basis:100%}.shop-panel .shop-form{grid-template-columns:1fr}.shop-panel .task{align-items:flex-start}.shop-panel .task>div{width:100%}}
.rpg-sheet{background:linear-gradient(135deg,rgba(118,103,232,.09),rgba(54,201,232,.06));}
.rpg-rank{font-weight:900;color:#8d7cff;background:rgba(118,103,232,.12);border:1px solid rgba(118,103,232,.25);padding:8px 12px;border-radius:999px;white-space:nowrap}
.attribute-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.attribute-card,.skill-card{border:1px solid var(--border,#e9eaf2);background:var(--surface,#f8f8fc);border-radius:16px;padding:15px}
.attribute-top,.skill-card-top{display:flex;align-items:center;gap:10px}.attribute-top>div,.skill-card-top>div{flex:1;min-width:0}.attribute-top strong,.attribute-top small,.skill-card-top strong,.skill-card-top small{display:block}.attribute-top small,.skill-card-top small{font-size:.72rem;color:var(--muted,#777d91);margin-top:2px}.attribute-top>b,.skill-card-top>b{font-size:.78rem;white-space:nowrap}.attribute-icon,.skill-icon{display:grid;place-items:center;width:40px;height:40px;border-radius:12px;background:#292541;font-size:1.25rem;flex-shrink:0}.attribute-track,.skill-track{height:7px;background:var(--border,#e9eaf2);border-radius:999px;overflow:hidden;margin-top:12px}.attribute-track span,.skill-track span{display:block;height:100%;background:linear-gradient(90deg,#7667e8,#36c9e8);border-radius:inherit}.attribute-source,.skill-card>small{display:block;color:var(--muted,#777d91);font-size:.72rem;margin-top:8px}.skill-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.rpg-rule-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.rpg-rule-grid>div{padding:14px;border:1px solid var(--border,#e9eaf2);border-radius:15px;background:var(--surface,#f8f8fc)}.rpg-rule-grid span{font-size:1.4rem;display:block;margin-bottom:8px}.rpg-rule-grid strong,.rpg-rule-grid small{display:block}.rpg-rule-grid small{color:var(--muted,#777d91);font-size:.75rem;margin-top:4px;line-height:1.4}
@media(max-width:850px){.attribute-grid,.skill-grid{grid-template-columns:1fr}.rpg-rule-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}

.gamification-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end}
.reset-gamification-btn{border:1px solid rgba(220,70,70,.28);background:transparent;color:#c53f4b;border-radius:12px;padding:10px 13px;font-weight:700;cursor:pointer;transition:.2s}
.reset-gamification-btn:hover{background:rgba(220,70,70,.08);transform:translateY(-1px)}
.reset-achievements-btn{border:1px solid rgba(109,93,252,.35);background:rgba(109,93,252,.08);color:#6d5dfc;border-radius:12px;padding:10px 13px;font-weight:800;cursor:pointer;transition:.2s}.reset-achievements-btn:hover{background:rgba(109,93,252,.15);transform:translateY(-1px)}
body.dark .reset-achievements-btn{color:#a99cff;border-color:rgba(169,156,255,.35);background:rgba(109,93,252,.12)}
body.dark .reset-gamification-btn{color:#ff8d98;border-color:rgba(255,141,152,.32)}
body.dark .reset-gamification-btn:hover{background:rgba(255,141,152,.1)}
@media(max-width:600px){.rpg-rule-grid{grid-template-columns:1fr}.rpg-rank{white-space:normal;text-align:center}}

/* Tema escuro: remove superfícies claras sem alterar a estrutura ou as ações */
body.dark .gamification-page {
  color: var(--site-on-background, #f0f2f5);
  --gami-panel: var(--site-card-bg, #1a1d2b);
  --gami-border: var(--site-border, #2a2e43);
  --gami-muted: var(--site-text-muted, #aab1c5);
}
body.dark .gamification-page .gami-stat,
body.dark .gamification-page .gami-panel,
body.dark .gamification-page .mission-card,
body.dark .gamification-page .achievement.locked,
body.dark .gamification-page .empty-state {
  background: var(--gami-panel); border-color: var(--gami-border); color: #f0f2f5;
}
body.dark .gamification-page .attribute-card,
body.dark .gamification-page .skill-card,
body.dark .gamification-page .rpg-rule-grid>div { background: #20243a; border-color: var(--gami-border); color: #f0f2f5; }
body.dark .gamification-page .attribute-source,
body.dark .gamification-page .skill-card>small,
body.dark .gamification-page .rpg-rule-grid small { color: var(--gami-muted); }
body.dark .gamification-page .stat-icon,
body.dark .gamification-page .section-icon { background: #292541; }
body.dark .gamification-page .gami-stat span:last-child,
body.dark .gamification-page .gamification-header p,
body.dark .gamification-page .section-heading p,
body.dark .gamification-page .progress-labels,
body.dark .gamification-page .achievement p,
body.dark .gamification-page .mission-card small,
body.dark .gamification-page .empty-state { color: var(--gami-muted); }
body.dark .gamification-page .achievement.unlocked { background: #17352d; border-color: #285b49; }
body.dark .gamification-page .achievement.unlocked p,
body.dark .gamification-page .status-unlocked { color: #83d6ae; }
body.dark .gamification-page .difficulty-easy { background: #173b2c; color: #8de0b3; }
body.dark .gamification-page .difficulty-medium { background: #40351b; color: #f2d27b; }
body.dark .gamification-page .difficulty-hard { background: #46291f; color: #ffb18a; }
body.dark .gamification-page .difficulty-epic { background: #302449; color: #c8a8ff; }
body.dark .gamification-page .milestone-panel { background: linear-gradient(115deg, #25213c, #302b25); border-color: #494064; }
body.dark .gamification-page .milestone-panel p { color: #c5c9d8; }
body.dark .gamification-page .shop-balance { color: #f4d783; background: #40351b; }
body.dark .gamification-page .shop-panel .focus { background: #20243a; border-color: var(--gami-border); }
body.dark .gamification-page .shop-panel input,
body.dark .gamification-page .shop-panel select,
body.dark .gamification-page .shop-panel textarea {
  background: #121624; border-color: #3a4058; color: #f0f2f5; color-scheme: dark;
}
body.dark .gamification-page .shop-panel input::placeholder,
body.dark .gamification-page .shop-panel textarea::placeholder { color: #9299ad; }
body.dark .gamification-page .shop-panel .tag { background: #292541; color: #c8bcff; }
body.dark .gamification-page .shop-panel .ghost { background: #20243a; border-color: #3a4058; color: #e8eaf5; }
body.dark .gamification-page .shop-panel .ghost:hover { background: #292e49; }

`;
