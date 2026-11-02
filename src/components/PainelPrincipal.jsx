import React, { useMemo, useState } from 'react';
import { canReference } from '../utils/moduleReferences';

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
  onToggleTask,
  onToggleHabit,
}) {
  const tasks = Array.isArray(data?.tasks) ? data.tasks : [];

  const habits = Array.isArray(data?.habits) ? data.habits : [];

  const calendarEvents = Array.isArray(data?.calendarEvents)
    ? data.calendarEvents
    : [];

  const financeTransactions = Array.isArray(data?.finance?.transactions)
    ? data.finance.transactions
    : [];

  const goals = Array.isArray(data?.goals) ? data.goals : [];

  const investments = Array.isArray(data?.investments) ? data.investments : [];

  const showTasks = canReference(data, 'tasks');
  const showHabits = canReference(data, 'habits');
  const showGoals = canReference(data, 'goals');
  const showFinance = canReference(data, 'finance');
  const showInvestments = canReference(data, 'investments');
  const showCalendar = canReference(data, 'calendar');

  const [expandedSections, setExpandedSections] = useState({
    tasks: false,
    habits: false,
    finance: false,
    goals: false,
    investments: false,
    agenda: false,
  });

  const toggleSection = (section) => {
    setExpandedSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  };

  /*
   * ============================================================
   * DATA / DATA DE HOJE
   * ============================================================
   */

  const todayString = useMemo(() => {
    return new Date().toISOString().slice(0, 10);
  }, []);

  const formatCurrency = (value) => {
    const number = Number(value) || 0;

    return number.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatDate = (date) => {
    if (!date) return '';

    try {
      return new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR');
    } catch {
      return date;
    }
  };

  /*
   * ============================================================
   * TAREFAS
   * ============================================================
   */

  const pendingTasksCount =
    pendingTasks.length > 0
      ? pendingTasks.length
      : tasks.filter((task) => !task.done).length;

  const completedTasksCount = tasks.filter((task) => task.done).length;

  const activeGoals = goals.filter((goal) => !goal.done && goal.status !== 'completed' && goal.status !== 'concluido' && goal.status !== 'concluida');

  const completedGoals = goals.filter((goal) => goal.done || goal.status === 'completed' || goal.status === 'concluido' || goal.status === 'concluida');

  const totalInvestmentValue = investments.reduce((total, investment) => {
    const quantity = Number(investment?.quantity || 0);
    const price = Number(investment?.currentPrice || investment?.buyPrice || 0);
    return total + quantity * price;
  }, 0);

  const goalProgress = goals.length
    ? Math.round(goals.reduce((sum, goal) => sum + Math.max(0, Math.min(100, Number(goal?.progress ?? goal?.percentage ?? 0))), 0) / goals.length)
    : 0;


  /*
   * Tarefas relacionadas especificamente a hoje.
   */
  const todayTasks = useMemo(() => {
    const result = tasks.filter((task) => {
      if (!task) return false;

      if (task.date === todayString || task.deadline === todayString) {
        return true;
      }

      return calendarEvents.some(
        (event) =>
          event?.type === 'task' &&
          (String(event?.taskId) === String(task?.id) ||
            event?.name === task?.title ||
            event?.name === task?.name),
      );
    });

    /*
     * Caso nenhuma tarefa tenha data específica,
     * mostramos as tarefas pendentes.
     */
    if (result.length === 0) {
      return tasks.filter((task) => !task.done);
    }

    return result;
  }, [tasks, calendarEvents, todayString]);

  /*
   * ============================================================
   * HÁBITOS
   * ============================================================
   */

  const getHabitDoneToday = (habit) => {
    /*
     * Formato principal:
     * habit.history["YYYY-MM-DD"]
     */
    if (
      habit?.history &&
      Object.prototype.hasOwnProperty.call(habit.history, todayString)
    ) {
      return Boolean(habit.history[todayString]);
    }

    /*
     * Compatibilidade com formato antigo.
     */
    return Boolean(habit?.done);
  };

  const habitsDoneCount = habits.filter((habit) =>
    getHabitDoneToday(habit),
  ).length;

  const totalHabits = habits.length;

  /*
   * ============================================================
   * AGENDA
   * ============================================================
   */

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

  /*
   * ============================================================
   * FINANCEIRO — SOMENTE HOJE
   * ============================================================
   */

  const normalizeFinanceType = (transaction) => {
    const type = String(
      transaction?.type || transaction?.kind || transaction?.categoryType || '',
    ).toLowerCase();

    if (
      [
        'income',
        'entrada',
        'receita',
        'receber',
        'recebimento',
        'credito',
        'crédito',
      ].includes(type)
    ) {
      return 'income';
    }

    return 'expense';
  };

  const todayFinanceTransactions = useMemo(() => {
    return financeTransactions
      .filter((transaction) => {
        if (!transaction) return false;

        return transaction.date === todayString;
      })
      .sort((a, b) => {
        const timeA = a?.time || a?.scheduledTime || '';

        const timeB = b?.time || b?.scheduledTime || '';

        return String(timeA).localeCompare(String(timeB));
      });
  }, [financeTransactions, todayString]);

  const todayIncomeTransactions = useMemo(
    () =>
      todayFinanceTransactions.filter(
        (transaction) => normalizeFinanceType(transaction) === 'income',
      ),
    [todayFinanceTransactions],
  );

  const todayExpenseTransactions = useMemo(
    () =>
      todayFinanceTransactions.filter(
        (transaction) => normalizeFinanceType(transaction) === 'expense',
      ),
    [todayFinanceTransactions],
  );

  const todayIncomeTotal = useMemo(
    () =>
      todayIncomeTransactions.reduce(
        (total, transaction) => total + (Number(transaction?.amount) || 0),
        0,
      ),
    [todayIncomeTransactions],
  );

  const todayExpenseTotal = useMemo(
    () =>
      todayExpenseTransactions.reduce(
        (total, transaction) => total + (Number(transaction?.amount) || 0),
        0,
      ),
    [todayExpenseTransactions],
  );

  const todayFinanceCount =
    todayIncomeTransactions.length + todayExpenseTransactions.length;

  /*
   * ============================================================
   * HUMOR / ENERGIA / FOCO
   * ============================================================
   */

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

  /*
   * ============================================================
   * SAUDAÇÃO
   * ============================================================
   */

  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) return 'Bom dia';

    if (hour < 18) return 'Boa tarde';

    return 'Boa noite';
  };

  /*
   * ============================================================
   * INSIGHT DO DIA
   * ============================================================
   */

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

  /*
   * ============================================================
   * LABEL DO FINANCEIRO
   * ============================================================
   */

  const getFinanceMainText = () => {
    if (todayFinanceCount === 0) {
      return 'Nenhuma movimentação financeira hoje';
    }

    if (
      todayIncomeTransactions.length > 0 &&
      todayExpenseTransactions.length === 0
    ) {
      return `${todayIncomeTransactions.length} ${
        todayIncomeTransactions.length === 1 ? 'recebimento' : 'recebimentos'
      } hoje`;
    }

    if (
      todayExpenseTransactions.length > 0 &&
      todayIncomeTransactions.length === 0
    ) {
      return `${todayExpenseTransactions.length} ${
        todayExpenseTransactions.length === 1 ? 'pagamento' : 'pagamentos'
      } hoje`;
    }

    return `${todayFinanceCount} movimentações hoje`;
  };

  /*
   * ============================================================
   * TOGGLES
   * ============================================================
   */

  const handleTaskToggle = (task) => {
    if (!task) return;

    if (typeof onToggleTask === 'function') {
      /*
       * Importante:
       * o App agora passa completeTask
       * diretamente.
       *
       * Isso garante que:
       * - XP seja atualizado
       * - moedas sejam atualizadas
       * - histórico seja atualizado
       * - completedAt seja atualizado
       * - banco seja sincronizado
       */
      onToggleTask(task.id);
    }
  };

  const handleHabitToggle = (habit) => {
    if (!habit) return;

    if (typeof onToggleHabit === 'function') {
      /*
       * O useAppData controla a data atual
       * automaticamente.
       */
      onToggleHabit(habit.id);
    }
  };

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div className='dashboard-page'>
      {/* ======================================================
          HEADER
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

      {/* ======================================================
          MAIN STATS
      ====================================================== */}

      <section className='dashboard-stats'>
        {/* TAREFAS */}
        {showTasks && (
        <button
          type='button'
          className={`card dashboard-stat dashboard-stat-button ${
            expandedSections.tasks ? 'dashboard-stat-active' : ''
          }`}
          onClick={() => toggleSection('tasks')}
          aria-expanded={expandedSections.tasks}
        >
          <span className='dashboard-stat-icon'>📋</span>

          <div>
            <strong>{pendingTasksCount}</strong>

            <span>tarefas pendentes</span>
          </div>

          <span className='dashboard-stat-chevron'>
            {expandedSections.tasks ? '⌃' : '⌄'}
          </span>
        </button>
        )}

        {/* HÁBITOS */}
        {showHabits && (
        <button
          type='button'
          className={`card dashboard-stat dashboard-stat-button ${
            expandedSections.habits ? 'dashboard-stat-active' : ''
          }`}
          onClick={() => toggleSection('habits')}
          aria-expanded={expandedSections.habits}
        >
          <span className='dashboard-stat-icon'>🔥</span>

          <div>
            <strong>
              {habitsDoneCount}/{totalHabits}
            </strong>

            <span>hábitos hoje</span>
          </div>

          <span className='dashboard-stat-chevron'>
            {expandedSections.habits ? '⌃' : '⌄'}
          </span>
        </button>
        )}

        {/* OBJETIVOS */}
        {showGoals && (
          <button
            type='button'
            className={`card dashboard-stat dashboard-stat-button ${
              expandedSections.goals ? 'dashboard-stat-active' : ''
            }`}
            onClick={() => toggleSection('goals')}
            aria-expanded={expandedSections.goals}
          >
            <span className='dashboard-stat-icon'>🎯</span>
            <div>
              <strong>{activeGoals.length}</strong>
              <span>objetivos ativos</span>
            </div>
            <span className='dashboard-stat-chevron'>{expandedSections.goals ? '⌃' : '⌄'}</span>
          </button>
        )}

        {/* INVESTIMENTOS */}
        {showInvestments && (
          <button
            type='button'
            className={`card dashboard-stat dashboard-stat-button ${
              expandedSections.investments ? 'dashboard-stat-active' : ''
            }`}
            onClick={() => toggleSection('investments')}
            aria-expanded={expandedSections.investments}
          >
            <span className='dashboard-stat-icon'>📈</span>
            <div>
              <strong>{investments.length}</strong>
              <span>investimentos</span>
            </div>
            <span className='dashboard-stat-chevron'>{expandedSections.investments ? '⌃' : '⌄'}</span>
          </button>
        )}

        {/* PRODUTIVIDADE */}

        <div className='card dashboard-stat'>
          <span className='dashboard-stat-icon'>📈</span>

          <div>
            <strong>{productivityScore}</strong>

            <span>produtividade</span>
          </div>
        </div>

        {/* XP */}

        <div className='card dashboard-stat'>
          <span className='dashboard-stat-icon'>⭐</span>

          <div>
            <strong>{Number(data?.xp) || 0}</strong>

            <span>XP atual</span>
          </div>
        </div>

        {/* FINANCEIRO */}
        {showFinance && (
        <button
          type='button'
          className={`card dashboard-stat dashboard-finance-stat dashboard-stat-button ${
            expandedSections.finance ? 'dashboard-stat-active' : ''
          }`}
          onClick={() => toggleSection('finance')}
          aria-expanded={expandedSections.finance}
        >
          <span className='dashboard-stat-icon'>💰</span>

          <div className='dashboard-finance-stat-content'>
            <strong>{getFinanceMainText()}</strong>

            <span className='dashboard-finance-values'>
              {todayIncomeTotal > 0 && (
                <span className='dashboard-finance-income'>
                  ↑ {formatCurrency(todayIncomeTotal)} a receber
                </span>
              )}

              {todayExpenseTotal > 0 && (
                <span className='dashboard-finance-expense'>
                  ↓ {formatCurrency(todayExpenseTotal)} a pagar
                </span>
              )}

              {todayFinanceCount === 0 && (
                <span>Nenhum pagamento ou recebimento previsto</span>
              )}
            </span>
          </div>

          <span className='dashboard-stat-chevron'>
            {expandedSections.finance ? '⌃' : '⌄'}
          </span>
        </button>
        )}
      </section>

      {/* ======================================================
          TAREFAS EXPANDIDAS
      ====================================================== */}

      {showTasks && expandedSections.tasks && (
        <section className='card dashboard-inline-section'>
          <div className='dashboard-inline-header'>
            <div>
              <span className='section-label'>TAREFAS</span>

              <h3>Tarefas de hoje</h3>

              <p>
                Marque uma tarefa aqui e o estado será atualizado também na
                página de tarefas.
              </p>
            </div>

            <button
              type='button'
              className='dashboard-collapse-button'
              onClick={() => toggleSection('tasks')}
            >
              Ocultar
            </button>
          </div>

          <div className='dashboard-inline-list'>
            {todayTasks.length === 0 ? (
              <div className='dashboard-empty-state'>
                <span>🎯</span>

                <div>
                  <strong>Nenhuma tarefa para hoje</strong>

                  <p>Seu dia está livre de tarefas pendentes.</p>
                </div>
              </div>
            ) : (
              todayTasks.map((task) => (
                <div
                  key={task.id}
                  className={`dashboard-list-item ${
                    task.done ? 'dashboard-list-item-done' : ''
                  }`}
                >
                  <button
                    type='button'
                    className={`dashboard-check ${task.done ? 'checked' : ''}`}
                    onClick={() => handleTaskToggle(task)}
                    aria-label={
                      task.done ? 'Reabrir tarefa' : 'Concluir tarefa'
                    }
                  >
                    {task.done ? '✓' : ''}
                  </button>

                  <div className='dashboard-list-main'>
                    <strong>
                      {task.title || task.name || 'Tarefa sem nome'}
                    </strong>

                    {task.description && <span>{task.description}</span>}

                    <div className='dashboard-list-meta'>
                      {task.priority && <span>{task.priority}</span>}

                      {task.deadline && (
                        <span>📅 {formatDate(task.deadline)}</span>
                      )}

                      {task.xp && <span>⭐ {task.xp} XP</span>}
                    </div>
                  </div>

                  {task.done && (
                    <span className='dashboard-done-label'>Concluída</span>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* ======================================================
          HÁBITOS EXPANDIDOS
      ====================================================== */}

      {showHabits && expandedSections.habits && (
        <section className='card dashboard-inline-section'>
          <div className='dashboard-inline-header'>
            <div>
              <span className='section-label'>HÁBITOS</span>

              <h3>Hábitos de hoje</h3>

              <p>Marque seus hábitos diretamente pelo painel.</p>
            </div>

            <button
              type='button'
              className='dashboard-collapse-button'
              onClick={() => toggleSection('habits')}
            >
              Ocultar
            </button>
          </div>

          <div className='dashboard-inline-list'>
            {habits.length === 0 ? (
              <div className='dashboard-empty-state'>
                <span>🔥</span>

                <div>
                  <strong>Nenhum hábito cadastrado</strong>

                  <p>Crie seus primeiros hábitos para acompanhar sua rotina.</p>
                </div>
              </div>
            ) : (
              habits.map((habit) => {
                const done = getHabitDoneToday(habit);

                return (
                  <div
                    key={habit.id}
                    className={`dashboard-list-item ${
                      done ? 'dashboard-list-item-done' : ''
                    }`}
                  >
                    <button
                      type='button'
                      className={`dashboard-check ${done ? 'checked' : ''}`}
                      onClick={() => handleHabitToggle(habit)}
                      aria-label={done ? 'Desmarcar hábito' : 'Concluir hábito'}
                    >
                      {done ? '✓' : ''}
                    </button>

                    <div className='dashboard-list-main'>
                      <strong>
                        {habit.name || habit.title || 'Hábito sem nome'}
                      </strong>

                      {habit.description && <span>{habit.description}</span>}

                      <div className='dashboard-list-meta'>
                        {habit.frequency && <span>🔁 {habit.frequency}</span>}

                        {habit.streak !== undefined && (
                          <span>🔥 {habit.streak} dias</span>
                        )}

                        {habit.xp && <span>⭐ {habit.xp} XP</span>}
                      </div>
                    </div>

                    {done && (
                      <span className='dashboard-done-label'>Feito hoje</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* ======================================================
          FINANCEIRO EXPANDIDO
      ====================================================== */}

      {showFinance && expandedSections.finance && (
        <section className='card dashboard-inline-section dashboard-finance-section'>
          <div className='dashboard-inline-header'>
            <div>
              <span className='section-label'>FINANCEIRO</span>

              <h3>Movimentações de hoje</h3>

              <p>
                Aqui aparecem somente pagamentos e recebimentos previstos para
                hoje.
              </p>
            </div>

            <button
              type='button'
              className='dashboard-collapse-button'
              onClick={() => toggleSection('finance')}
            >
              Ocultar
            </button>
          </div>

          {/* RESUMO */}

          <div className='dashboard-finance-summary'>
            <div className='dashboard-finance-summary-card'>
              <span>↑</span>

              <div>
                <small>A receber</small>

                <strong className='dashboard-finance-income'>
                  {formatCurrency(todayIncomeTotal)}
                </strong>
              </div>
            </div>

            <div className='dashboard-finance-summary-card'>
              <span>↓</span>

              <div>
                <small>A pagar</small>

                <strong className='dashboard-finance-expense'>
                  {formatCurrency(todayExpenseTotal)}
                </strong>
              </div>
            </div>
          </div>

          {/* LISTA */}

          <div className='dashboard-inline-list'>
            {todayFinanceTransactions.length === 0 ? (
              <div className='dashboard-empty-state'>
                <span>💰</span>

                <div>
                  <strong>Nenhuma movimentação hoje</strong>

                  <p>
                    Você não possui pagamentos ou recebimentos registrados para
                    hoje.
                  </p>
                </div>
              </div>
            ) : (
              todayFinanceTransactions.map((transaction) => {
                const type = normalizeFinanceType(transaction);

                const isIncome = type === 'income';

                return (
                  <div
                    key={
                      transaction.id ||
                      `${transaction.date}-${transaction.description}-${transaction.amount}`
                    }
                    className='dashboard-list-item dashboard-finance-item'
                  >
                    <div
                      className={`dashboard-finance-type-icon ${
                        isIncome ? 'income' : 'expense'
                      }`}
                    >
                      {isIncome ? '↑' : '↓'}
                    </div>

                    <div className='dashboard-list-main'>
                      <strong>
                        {transaction.description ||
                          transaction.name ||
                          transaction.title ||
                          (isIncome ? 'Recebimento' : 'Pagamento')}
                      </strong>

                      <div className='dashboard-list-meta'>
                        {transaction.category && (
                          <span>{transaction.category}</span>
                        )}

                        {transaction.time && <span>🕐 {transaction.time}</span>}

                        <span>{formatDate(transaction.date)}</span>
                      </div>
                    </div>

                    <strong
                      className={
                        isIncome
                          ? 'dashboard-finance-income'
                          : 'dashboard-finance-expense'
                      }
                    >
                      {isIncome ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </strong>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* ======================================================
          OBJETIVOS
      ====================================================== */}

      {showGoals && expandedSections.goals && (
        <section className='card dashboard-inline-section'>
          <div className='dashboard-inline-header'>
            <div>
              <span className='section-label'>OBJETIVOS</span>
              <h3>Seus objetivos</h3>
              <p>Resumo dos objetivos que continuam ativos.</p>
            </div>
            <button type='button' className='dashboard-collapse-button' onClick={() => toggleSection('goals')}>Ocultar</button>
          </div>
          <div className='dashboard-inline-list'>
            {goals.length === 0 ? (
              <div className='dashboard-empty-state'><span>🎯</span><div><strong>Nenhum objetivo cadastrado</strong><p>Crie um objetivo para acompanhar seu progresso aqui.</p></div></div>
            ) : (
              goals.slice(0, 8).map((goal) => {
                const value = Math.max(0, Math.min(100, Number(goal?.progress ?? goal?.percentage ?? 0)));
                const done = Boolean(goal?.done) || ['completed','concluido','concluida'].includes(String(goal?.status || '').toLowerCase());
                return (
                  <div key={goal.id} className='dashboard-list-item'>
                    <div className='dashboard-stat-icon'>🎯</div>
                    <div className='dashboard-list-main'>
                      <strong>{goal.title || goal.name || 'Objetivo sem nome'}</strong>
                      <span>{done ? 'Concluído' : `${value}% concluído`}</span>
                      <div className='dashboard-reference-progress'><span style={{ width: `${done ? 100 : value}%` }} /></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* ======================================================
          INVESTIMENTOS
      ====================================================== */}

      {showInvestments && expandedSections.investments && (
        <section className='card dashboard-inline-section'>
          <div className='dashboard-inline-header'>
            <div>
              <span className='section-label'>INVESTIMENTOS</span>
              <h3>Carteira</h3>
              <p>Resumo dos investimentos registrados.</p>
            </div>
            <button type='button' className='dashboard-collapse-button' onClick={() => toggleSection('investments')}>Ocultar</button>
          </div>
          <div className='dashboard-reference-investment-summary'>
            <div><span>Ativos</span><strong>{investments.length}</strong></div>
            <div><span>Valor atual</span><strong>{formatCurrency(totalInvestmentValue)}</strong></div>
          </div>
          <div className='dashboard-inline-list'>
            {investments.length === 0 ? (
              <div className='dashboard-empty-state'><span>📈</span><div><strong>Nenhum investimento cadastrado</strong><p>Adicione ativos na área de investimentos.</p></div></div>
            ) : investments.slice(0, 8).map((investment) => (
              <div key={investment.id} className='dashboard-list-item'>
                <div className='dashboard-stat-icon'>📈</div>
                <div className='dashboard-list-main'>
                  <strong>{investment.ticker || investment.name || 'Investimento'}</strong>
                  <span>{investment.type || 'Ativo'}</span>
                </div>
                <strong>{formatCurrency(Number(investment.quantity || 0) * Number(investment.currentPrice || investment.buyPrice || 0))}</strong>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ======================================================
          AGENDA
      ====================================================== */}

      {showCalendar && (
      <section className='card dashboard-day-card'>
        <div className='dashboard-inline-header'>
          <div>
            <span className='section-label'>VISÃO DO DIA</span>

            <h3>Agenda de hoje</h3>

            <p>Compromissos e eventos programados para hoje.</p>
          </div>

          <button
            type='button'
            className='dashboard-collapse-button'
            onClick={() => toggleSection('agenda')}
          >
            {expandedSections.agenda ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>

        {expandedSections.agenda && (
          <div className='dashboard-inline-list'>
            {todayEvents.length === 0 ? (
              <div className='dashboard-empty-state'>
                <span>📅</span>

                <div>
                  <strong>Nenhum compromisso hoje</strong>

                  <p>Sua agenda está livre neste momento.</p>
                </div>
              </div>
            ) : (
              todayEvents.map((event) => (
                <div
                  key={
                    event.id ||
                    `${event.date}-${event.name}-${event.scheduledTime}`
                  }
                  className='dashboard-list-item'
                >
                  <div className='dashboard-event-time'>
                    {event.scheduledTime || '—'}
                  </div>

                  <div className='dashboard-list-main'>
                    <strong>{event.name || event.title || 'Evento'}</strong>

                    {event.description && <span>{event.description}</span>}

                    <div className='dashboard-list-meta'>
                      {event.type && <span>{event.type}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>
      )}

      {/* ======================================================
          NEXT STEP + INSIGHT
      ====================================================== */}

      <section className='dashboard-grid'>
        <div className='card dashboard-next-step'>
          <span className='section-label'>PRÓXIMO PASSO</span>

          <h3>
            {todayTasks.find((task) => !task.done)?.title ||
              todayTasks.find((task) => !task.done)?.name ||
              'Escolha uma prioridade'}
          </h3>

          <p>
            Comece pela tarefa mais importante e evite trocar de contexto sem
            necessidade.
          </p>

          <div className='dashboard-next-step-meta'>
            <span>📋 {pendingTasksCount} pendentes</span>

            <span>
              🔥 {habitsDoneCount}/{totalHabits} hábitos
            </span>
          </div>
        </div>

        <div className='card dashboard-insight'>
          <span className='section-label'>INSIGHT DO DIA</span>

          <div className='dashboard-insight-icon'>💡</div>

          <p>{getTodayInsight()}</p>
        </div>
      </section>

      {/* ======================================================
          LEVEL / XP
      ====================================================== */}

      <section className='card dashboard-level-card'>
        <div className='dashboard-level-header'>
          <div>
            <span className='section-label'>PROGRESSÃO</span>

            <h3>Nível {level}</h3>
          </div>

          <strong>
            {nextXP > 0 ? `${nextXP} XP para o próximo nível` : 'Próximo nível'}
          </strong>
        </div>

        <div className='dashboard-progress'>
          <div
            className='dashboard-progress-bar'
            style={{
              width: `${Math.min(Math.max(Number(progress) || 0, 0), 100)}%`,
            }}
          />
        </div>

        <div className='dashboard-level-footer'>
          <span>⭐ {Number(data?.xp) || 0} XP</span>

          <span>{Math.round(Number(progress) || 0)}%</span>
        </div>
      </section>

      {/* ======================================================
          STATUS DO DIA
      ====================================================== */}

      <section className='card dashboard-status-card'>
        <div>
          <span className='section-label'>STATUS DE HOJE</span>

          <h3>Como você está?</h3>
        </div>

        <div className='dashboard-status-grid'>
          <div className='dashboard-status-item'>
            <span>😴</span>

            <div>
              <small>Sono</small>

              <strong>{sleep > 0 ? `${sleep}h` : 'Não informado'}</strong>
            </div>
          </div>

          <div className='dashboard-status-item'>
            <span>⚡</span>

            <div>
              <small>Energia</small>

              <strong>{energy > 0 ? `${energy}/5` : 'Não informado'}</strong>
            </div>
          </div>

          <div className='dashboard-status-item'>
            <span>🎯</span>

            <div>
              <small>Foco</small>

              <strong>{focus > 0 ? `${focus}/5` : 'Não informado'}</strong>
            </div>
          </div>

          <div className='dashboard-status-item'>
            <span>{getMoodEmoji(mood)}</span>

            <div>
              <small>Humor</small>

              <strong>{mood || 'Não informado'}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          PERFORMANCE
      ====================================================== */}

      <section className='dashboard-summary-grid'>
        <div className='card dashboard-summary-card'>
          <span>📋</span>

          <div>
            <small>Tarefas concluídas</small>

            <strong>{completedTasksCount}</strong>
          </div>
        </div>

        <div className='card dashboard-summary-card'>
          <span>🔥</span>

          <div>
            <small>Hábitos realizados</small>

            <strong>
              {habitsDoneCount}/{totalHabits}
            </strong>
          </div>
        </div>

        <div className='card dashboard-summary-card'>
          <span>⏰</span>

          <div>
            <small>Melhor horário</small>

            <strong>{bestHour || '—'}</strong>
          </div>
        </div>

        <div className='card dashboard-summary-card'>
          <span>💰</span>

          <div>
            <small>Movimentações hoje</small>

            <strong>{todayFinanceCount}</strong>
          </div>
        </div>
      </section>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <p className='dashboard-footer-note'>
        💡 Para análises detalhadas, histórico e padrões de produtividade,
        consulte <strong>Ciência de Dados</strong>.
      </p>
    </div>
  );
}
