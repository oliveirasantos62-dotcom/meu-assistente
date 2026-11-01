import React, { useMemo, useState } from 'react';

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
  const calendarEvents = Array.isArray(data?.calendarEvents)
    ? data.calendarEvents
    : [];

  const [expandedSections, setExpandedSections] = useState({
    habits: false,
    tasks: false,
    agenda: false,
  });

  const toggleSection = (section) => {
    setExpandedSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  };

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

  const todayString = new Date().toISOString().slice(0, 10);

  const todayEvents = useMemo(
    () =>
      calendarEvents
        .filter((event) => event?.date === todayString)
        .sort((a, b) => {
          if (!a?.scheduledTime) return 1;
          if (!b?.scheduledTime) return -1;
          return String(a.scheduledTime).localeCompare(String(b.scheduledTime));
        }),
    [calendarEvents, todayString],
  );

  const todayTasks = useMemo(
    () =>
      tasks.filter((task) => {
        if (task?.date === todayString || task?.deadline === todayString) {
          return true;
        }

        return todayEvents.some(
          (event) =>
            event?.type === 'task' &&
            (event?.taskId === task?.id ||
              event?.name === task?.title ||
              event?.name === task?.name),
        );
      }),
    [tasks, todayEvents, todayString],
  );

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
          VISÃO RÁPIDA DO DIA
          Tudo aparece dentro do próprio painel. Cada bloco pode
          ser aberto/fechado sem navegar para outra página.
      ====================================================== */}
      <section className='card dashboard-day-card'>
        <div className='section-title dashboard-day-header'>
          <div>
            <span className='section-label'>VISÃO DO DIA</span>
            <h2>📅 Seu dia</h2>
            <p className='subtitle'>
              Abra apenas o que você quer acompanhar agora.
            </p>
          </div>

          <span className='dashboard-day-date'>
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: '2-digit',
              month: 'short',
            })}
          </span>
        </div>

        <div className='dashboard-day-sections'>
          <div className={`dashboard-day-section ${expandedSections.habits ? 'is-open' : ''}`}>
            <button
              type='button'
              className='dashboard-day-toggle'
              onClick={() => toggleSection('habits')}
              aria-expanded={expandedSections.habits}
            >
              <span className='dashboard-day-toggle-main'>
                <span className='dashboard-day-icon'>🔥</span>
                <span>
                  <strong>Hábitos de hoje</strong>
                  <small>{habitsDoneCount}/{totalHabits} concluídos</small>
                </span>
              </span>
              <span className='dashboard-day-toggle-action'>
                {expandedSections.habits ? 'Esconder' : 'Mostrar'}
                <span aria-hidden='true'>{expandedSections.habits ? '⌃' : '⌄'}</span>
              </span>
            </button>

            {expandedSections.habits && (
              <div className='dashboard-day-content'>
                {habits.length > 0 ? (
                  <div className='dashboard-day-list'>
                    {habits.map((habit, index) => (
                      <div className='dashboard-day-item' key={habit.id ?? `habit-${index}`}>
                        <span className={`dashboard-day-check ${habit.done ? 'done' : ''}`}>
                          {habit.done ? '✓' : '○'}
                        </span>
                        <div>
                          <strong>{habit.name || habit.title || 'Hábito'}</strong>
                          <small>{habit.done ? 'Concluído hoje' : 'Pendente hoje'}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='dashboard-empty'>Nenhum hábito cadastrado.</div>
                )}
              </div>
            )}
          </div>

          <div className={`dashboard-day-section ${expandedSections.tasks ? 'is-open' : ''}`}>
            <button
              type='button'
              className='dashboard-day-toggle'
              onClick={() => toggleSection('tasks')}
              aria-expanded={expandedSections.tasks}
            >
              <span className='dashboard-day-toggle-main'>
                <span className='dashboard-day-icon'>📋</span>
                <span>
                  <strong>Tarefas de hoje</strong>
                  <small>{todayTasks.length || pendingTasksCount} para acompanhar</small>
                </span>
              </span>
              <span className='dashboard-day-toggle-action'>
                {expandedSections.tasks ? 'Esconder' : 'Mostrar'}
                <span aria-hidden='true'>{expandedSections.tasks ? '⌃' : '⌄'}</span>
              </span>
            </button>

            {expandedSections.tasks && (
              <div className='dashboard-day-content'>
                {todayTasks.length > 0 ? (
                  <div className='dashboard-day-list'>
                    {todayTasks.map((task, index) => (
                      <div className='dashboard-day-item' key={task.id ?? `task-${index}`}>
                        <span className={`dashboard-day-check ${task.done ? 'done' : ''}`}>
                          {task.done ? '✓' : '○'}
                        </span>
                        <div>
                          <strong>{task.title || task.name || 'Tarefa'}</strong>
                          <small>{task.done ? 'Concluída' : 'Pendente'}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='dashboard-empty'>Nenhuma tarefa específica para hoje.</div>
                )}
              </div>
            )}
          </div>

          <div className={`dashboard-day-section ${expandedSections.agenda ? 'is-open' : ''}`}>
            <button
              type='button'
              className='dashboard-day-toggle'
              onClick={() => toggleSection('agenda')}
              aria-expanded={expandedSections.agenda}
            >
              <span className='dashboard-day-toggle-main'>
                <span className='dashboard-day-icon'>🗓️</span>
                <span>
                  <strong>Agenda de hoje</strong>
                  <small>{todayEvents.length} eventos</small>
                </span>
              </span>
              <span className='dashboard-day-toggle-action'>
                {expandedSections.agenda ? 'Esconder' : 'Mostrar'}
                <span aria-hidden='true'>{expandedSections.agenda ? '⌃' : '⌄'}</span>
              </span>
            </button>

            {expandedSections.agenda && (
              <div className='dashboard-day-content'>
                {todayEvents.length > 0 ? (
                  <div className='dashboard-day-list'>
                    {todayEvents.map((event, index) => (
                      <div className='dashboard-day-item' key={event.id ?? `event-${index}`}>
                        <span className='dashboard-day-check'>
                          {event.type === 'appointment' ? '📌' : event.type === 'habit' ? '🔥' : '•'}
                        </span>
                        <div>
                          <strong>{event.name || event.title || 'Evento'}</strong>
                          <small>
                            {event.scheduledTime || 'Sem horário'}
                            {event.duration ? ` · ${event.duration} min` : ''}
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='dashboard-empty'>Nenhum evento agendado para hoje.</div>
                )}
              </div>
            )}
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
