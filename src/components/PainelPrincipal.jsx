import React from 'react';

export default function PainelPrincipal({
  data,
  completion = 0,
  level = 1,
  nextXP = 0,
  progress = 0,
  daily,
  productivityScore = 0,
  bestHour,
  pendingTasks = [],
}) {
  const tasks = Array.isArray(data?.tasks) ? data.tasks : [];
  const habits = Array.isArray(data?.habits) ? data.habits : [];

  const pendingTasksCount =
    pendingTasks.length > 0
      ? pendingTasks.length
      : tasks.filter((task) => !task.done).length;

  const completedTasksCount = tasks.filter((task) => task.done).length;

  /*
   * O formato antigo do app usava h.done diretamente.
   * Mantemos compatibilidade com esse formato.
   */
  const habitsDoneCount = habits.filter((habit) => habit.done).length;

  const totalHabits = habits.length;

  const sleep = Number(daily?.sleep) || 0;
  const energy = Number(daily?.energy) || 0;
  const focus = Number(daily?.focus) || 0;

  const mood = daily?.mood || data?.mood || '';

  const getMoodEmoji = (value) => {
    const emojis = {
      'Muito mal': '😞',
      Mal: '😕',
      Neutro: '😐',
      Bem: '🙂',
      'Muito bem': '😄',
    };

    return emojis[value] || '😐';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';

    return 'Boa noite';
  };

  const getTodayInsight = () => {
    if (pendingTasksCount === 0 && totalHabits === 0) {
      return 'Seu dia está livre. Aproveite para planejar o próximo passo.';
    }

    if (pendingTasksCount >= 5) {
      return 'Você tem bastante coisa pendente. Escolha as 1–3 tarefas mais importantes antes de começar.';
    }

    if (energy >= 4 && focus >= 4) {
      return 'Sua energia e foco estão bons. Este pode ser um ótimo momento para uma tarefa difícil.';
    }

    if (sleep > 0 && sleep < 6) {
      return 'Seu sono foi baixo. Considere reduzir a carga e priorizar o essencial.';
    }

    if (productivityScore >= 70) {
      return 'Seu desempenho está bom. Mantenha o ritmo sem exagerar na quantidade de tarefas.';
    }

    if (completion >= 80) {
      return 'Você está avançando muito bem hoje. Foque em terminar o que realmente importa.';
    }

    return 'Defina uma prioridade e avance nela antes de trocar de contexto.';
  };

  return (
    <div className='dashboard-page'>
      {/* =====================================================
          CABEÇALHO
      ====================================================== */}
      <section className='card dashboard-welcome'>
        <div>
          <span className='section-label'>PAINEL PRINCIPAL</span>

          <h2>{getGreeting()} 👋</h2>

          <p className='subtitle'>
            Aqui você acompanha apenas o que importa para o seu dia.
          </p>
        </div>

        <div className='dashboard-completion'>
          <strong>{completion}%</strong>
          <span>do dia concluído</span>
        </div>
      </section>

      {/* =====================================================
          INDICADORES PRINCIPAIS
      ====================================================== */}
      <section className='dashboard-stats'>
        <div className='card dashboard-stat'>
          <span className='dashboard-stat-icon'>📋</span>

          <div>
            <strong>{pendingTasksCount}</strong>
            <span>tarefas pendentes</span>
          </div>
        </div>

        <div className='card dashboard-stat'>
          <span className='dashboard-stat-icon'>🔥</span>

          <div>
            <strong>
              {habitsDoneCount}/{totalHabits}
            </strong>
            <span>hábitos hoje</span>
          </div>
        </div>

        <div className='card dashboard-stat'>
          <span className='dashboard-stat-icon'>📈</span>

          <div>
            <strong>{productivityScore}</strong>
            <span>produtividade</span>
          </div>
        </div>

        <div className='card dashboard-stat'>
          <span className='dashboard-stat-icon'>⭐</span>

          <div>
            <strong>{Number(data?.xp) || 0}</strong>
            <span>XP atual</span>
          </div>
        </div>
      </section>

      {/* =====================================================
          PRÓXIMO PASSO + INSIGHT
      ====================================================== */}
      <section className='dashboard-grid'>
        <div className='card'>
          <div className='section-title'>
            <div>
              <span className='section-label'>PRÓXIMO PASSO</span>
              <h2>🎯 O que fazer agora?</h2>
            </div>
          </div>

          {pendingTasksCount > 0 ? (
            <div className='focus dashboard-next-step'>
              <strong>
                {pendingTasks[0]?.title ||
                  pendingTasks[0]?.name ||
                  tasks.find((task) => !task.done)?.title ||
                  tasks.find((task) => !task.done)?.name ||
                  'Escolha sua próxima tarefa'}
              </strong>

              <p className='subtitle'>
                Comece por uma tarefa antes de trocar de contexto.
              </p>
            </div>
          ) : (
            <div className='focus dashboard-next-step'>
              <strong>🎉 Nenhuma tarefa pendente</strong>

              <p className='subtitle'>
                Você pode planejar o próximo passo ou aproveitar o tempo livre.
              </p>
            </div>
          )}
        </div>

        <div className='card'>
          <div className='section-title'>
            <div>
              <span className='section-label'>INSIGHT</span>
              <h2>💡 Para hoje</h2>
            </div>
          </div>

          <div className='focus'>
            <p className='subtitle'>{getTodayInsight()}</p>
          </div>
        </div>
      </section>

      {/* =====================================================
          PROGRESSO DE NÍVEL
      ====================================================== */}
      <section className='card'>
        <div className='section-title'>
          <div>
            <span className='section-label'>PROGRESSO</span>
            <h2>⭐ Nível {level}</h2>
          </div>

          <strong>{Number(data?.xp) || 0} XP</strong>
        </div>

        <div className='progress dashboard-progress'>
          <span
            style={{
              width: `${Math.min(100, Math.max(0, progress))}%`,
            }}
          />
        </div>

        <small className='dashboard-muted'>
          {nextXP > 0
            ? `${nextXP} XP para o próximo nível`
            : 'Continue completando atividades para evoluir.'}
        </small>
      </section>

      {/* =====================================================
          RESUMO DO ESTADO ATUAL
      ====================================================== */}
      <section className='card'>
        <div className='section-title'>
          <div>
            <span className='section-label'>COMO VOCÊ ESTÁ</span>
            <h2>🧠 Resumo rápido</h2>
          </div>
        </div>

        <div className='dashboard-status-grid'>
          <div className='dashboard-status'>
            <span>😊 Humor</span>
            <strong>
              {mood ? `${getMoodEmoji(mood)} ${mood}` : 'Não registrado'}
            </strong>
          </div>

          <div className='dashboard-status'>
            <span>😴 Sono</span>
            <strong>{sleep > 0 ? `${sleep}h` : 'Não registrado'}</strong>
          </div>

          <div className='dashboard-status'>
            <span>⚡ Energia</span>
            <strong>{energy > 0 ? `${energy}/5` : 'Não registrada'}</strong>
          </div>

          <div className='dashboard-status'>
            <span>🎯 Foco</span>
            <strong>{focus > 0 ? `${focus}/5` : 'Não registrado'}</strong>
          </div>
        </div>
      </section>

      {/* =====================================================
          PEQUENO RESUMO DO DESEMPENHO
          Não substitui DataDashboard.
          DataDashboard ficará responsável pela análise completa.
      ====================================================== */}
      <section className='dashboard-summary-grid'>
        <div className='card dashboard-summary-card'>
          <span>✅</span>

          <div>
            <strong>{completedTasksCount}</strong>
            <small>tarefas concluídas</small>
          </div>
        </div>

        <div className='card dashboard-summary-card'>
          <span>📊</span>

          <div>
            <strong>{productivityScore}/100</strong>
            <small>produtividade</small>
          </div>
        </div>

        <div className='card dashboard-summary-card'>
          <span>🕐</span>

          <div>
            <strong>
              {bestHour
                ? `${String(bestHour[0]).padStart(2, '0')}:00`
                : '--:--'}
            </strong>

            <small>melhor horário</small>
          </div>
        </div>
      </section>

      <p className='dashboard-footer-note'>
        💡 Para análises detalhadas, histórico e padrões de produtividade,
        consulte <strong>Ciência de Dados</strong>.
      </p>
    </div>
  );
}
