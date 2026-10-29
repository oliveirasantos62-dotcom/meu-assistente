import React, { useMemo } from 'react';

export default function Dashboard({
  data,
  save,
  daily,
  levelInfo,
  productivityScore,
  bestHour,
  pendingTasks,
  completedTasks,
  completion,
  records,
  moodAverage,
  totalXP,
  totalDone,
  overload,
  completeTask,
  updateHistory,
}) {
  const today = new Date();
  const safeLevelInfo = {
    level: 1,
    nextXP: 100,
    progress: 0,
    ...(levelInfo || {}),
  };
  const todayLabel = today.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });

  /* =========================================================
     MÉTRICAS
  ========================================================= */

  const sleep = Number(daily?.sleep) || 0;
  const energy = Number(daily?.energy) || 0;
  const focus = Number(daily?.focus) || 0;

  const mood = Number(daily?.mood) || 0;

  /* =========================================================
     TAREFAS
  ========================================================= */

  const todayTasks = useMemo(() => {
    return Array.isArray(data?.tasks)
      ? data.tasks.filter((task) => !task.completed).slice(0, 5)
      : [];
  }, [data?.tasks]);

  /* =========================================================
     PROGRESSO
  ========================================================= */

  const taskTotal = Array.isArray(data?.tasks) ? data.tasks.length : 0;

  const taskCompleted = Array.isArray(data?.tasks)
    ? data.tasks.filter((task) => task.completed).length
    : 0;

  const taskProgress =
    taskTotal > 0 ? Math.round((taskCompleted / taskTotal) * 100) : 0;

  /* =========================================================
     HÁBITOS
  ========================================================= */

  const habits = Array.isArray(data?.habits) ? data.habits : [];

  const habitsCompletedToday = habits.filter((habit) => {
    const date = today.toISOString().slice(0, 10);

    return Boolean(habit.history?.[date]);
  }).length;

  const habitProgress =
    habits.length > 0
      ? Math.round((habitsCompletedToday / habits.length) * 100)
      : 0;

  /* =========================================================
     INSIGHT SIMPLES
  ========================================================= */

  const insight = useMemo(() => {
    if (overload) {
      return {
        icon: '⚠️',
        title: 'Reduza o ritmo',
        text: 'Você está com muitas tarefas pendentes. Escolha uma prioridade antes de começar outra.',
      };
    }

    if (focus >= 4 && energy >= 4) {
      return {
        icon: '🚀',
        title: 'Bom momento para produzir',
        text: 'Seu foco e sua energia estão altos. Aproveite para trabalhar na tarefa mais importante.',
      };
    }

    if (sleep > 0 && sleep < 7) {
      return {
        icon: '😴',
        title: 'Seu sono merece atenção',
        text: 'Seu registro indica menos de 7 horas de sono. Considere reduzir a carga hoje.',
      };
    }

    if (todayTasks.length > 0) {
      return {
        icon: '🎯',
        title: 'Próximo passo',
        text: `Sua próxima tarefa é "${todayTasks[0].title || todayTasks[0].name}".`,
      };
    }

    return {
      icon: '🌱',
      title: 'Construa o dia',
      text: 'Registre seus indicadores e escolha uma tarefa importante para começar.',
    };
  }, [overload, focus, energy, sleep, todayTasks]);

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className='dashboard-page'>
      {/* =====================================================
          HERO
      ====================================================== */}

      <section
        className='dashboard-hero'
        style={{
          marginBottom: 20,
        }}
      >
        <div>
          <span className='section-label'>PAINEL DE CONTROLE</span>

          <h2
            style={{
              margin: '6px 0',
            }}
          >
            Olá, vamos construir um bom dia.
          </h2>

          <p
            className='subtitle'
            style={{
              margin: 0,
              textTransform: 'capitalize',
            }}
          >
            {todayLabel}
          </p>
        </div>

        <div
          style={{
            textAlign: 'right',
          }}
        >
          <strong
            style={{
              fontSize: 28,
            }}
          >
            {completion}%
          </strong>

          <small
            style={{
              display: 'block',
              color: 'var(--site-text-muted)',
            }}
          >
            conclusão geral
          </small>
        </div>
      </section>

      {/* =========================================================
    NÍVEL
========================================================= */}

      <section className='card' style={{ marginBottom: 20 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 20,
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <div>
            <strong>⭐ Nível {safeLevelInfo.level}</strong>

            <div className='subtitle' style={{ marginTop: 3 }}>
              {safeLevelInfo.nextXP} XP para o próximo nível
            </div>
          </div>

          <strong>{safeLevelInfo.progress}%</strong>
        </div>

        <div
          style={{
            height: 8,
            borderRadius: 999,
            background: 'var(--site-border)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${Math.min(
                100,
                Math.max(0, Number(safeLevelInfo.progress) || 0),
              )}%`,
              height: '100%',
              borderRadius: 999,
              background: 'var(--site-primary)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </section>

      {/* =====================================================
          MÉTRICAS
      ====================================================== */}

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div className='stat'>
          <strong>{focus || '—'}</strong>

          <small>🎯 Foco / 5</small>
        </div>

        <div className='stat'>
          <strong>{energy || '—'}</strong>

          <small>⚡ Energia / 5</small>
        </div>

        <div className='stat'>
          <strong>{sleep ? `${sleep}h` : '—'}</strong>

          <small>😴 Sono</small>
        </div>

        <div className='stat'>
          <strong>{habitProgress}%</strong>

          <small>🔥 Hábitos hoje</small>
        </div>
      </section>

      {/* =====================================================
          PRÓXIMO PASSO + INSIGHT
      ====================================================== */}

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(280px, 0.8fr)',
          gap: 16,
          marginBottom: 20,
        }}
      >
        {/* PRÓXIMO PASSO */}

        <div className='card'>
          <span className='section-label'>PRÓXIMO PASSO</span>

          <h3
            style={{
              margin: '8px 0 4px',
            }}
          >
            {todayTasks.length > 0
              ? todayTasks[0].title || todayTasks[0].name
              : 'Você está em dia 🎉'}
          </h3>

          <p className='subtitle'>
            {todayTasks.length > 0
              ? 'Concentre-se apenas nesta tarefa antes de trocar de contexto.'
              : 'Não há tarefas pendentes importantes no momento.'}
          </p>

          {todayTasks.length > 0 && (
            <button
              type='button'
              className='primary'
              onClick={() => completeTask(todayTasks[0].id)}
            >
              ✓ Concluir tarefa
            </button>
          )}
        </div>

        {/* INSIGHT */}

        <div className='focus'>
          <span className='section-label'>INSIGHT DO DIA</span>

          <div
            style={{
              fontSize: 30,
              marginTop: 10,
            }}
          >
            {insight.icon}
          </div>

          <strong
            style={{
              display: 'block',
              marginTop: 6,
            }}
          >
            {insight.title}
          </strong>

          <p
            style={{
              margin: '6px 0 0',
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            {insight.text}
          </p>
        </div>
      </section>

      {/* =====================================================
          TAREFAS
      ====================================================== */}

      <section className='card'>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <div>
            <span className='section-label'>HOJE</span>

            <h3
              style={{
                margin: '6px 0 0',
              }}
            >
              Suas tarefas
            </h3>
          </div>

          <strong>
            {taskCompleted}/{taskTotal}
          </strong>
        </div>

        {/* PROGRESSO */}

        <div
          style={{
            height: 6,
            borderRadius: 999,
            background: 'var(--site-border)',
            overflow: 'hidden',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: `${taskProgress}%`,
              height: '100%',
              background: 'var(--site-primary)',
              borderRadius: 999,
            }}
          />
        </div>

        {/* LISTA */}

        {todayTasks.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gap: 8,
            }}
          >
            {todayTasks.map((task) => (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: 12,
                  borderRadius: 10,
                  border: '1px solid var(--site-border)',
                }}
              >
                <button
                  type='button'
                  className='ghost'
                  onClick={() => completeTask(task.id)}
                  style={{
                    width: 32,
                    height: 32,
                    padding: 0,
                    borderRadius: 8,
                  }}
                >
                  ✓
                </button>

                <span
                  style={{
                    flex: 1,
                    fontWeight: 600,
                  }}
                >
                  {task.title || task.name}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: 30,
              color: 'var(--site-text-muted)',
            }}
          >
            🎉 Todas as tarefas estão concluídas.
          </div>
        )}
      </section>

      {/* =====================================================
          RESUMO
      ====================================================== */}

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          marginTop: 20,
        }}
      >
        <div className='stat'>
          <strong>{totalXP}</strong>

          <small>⭐ XP acumulado</small>
        </div>

        <div className='stat'>
          <strong>{totalDone}</strong>

          <small>✅ Tarefas concluídas</small>
        </div>

        <div className='stat'>
          <strong>{moodAverage || '—'}</strong>

          <small>😊 Humor médio</small>
        </div>

        <div className='stat'>
          <strong>{bestHour || '—'}</strong>

          <small>⏰ Melhor horário</small>
        </div>
      </section>
    </div>
  );
}
