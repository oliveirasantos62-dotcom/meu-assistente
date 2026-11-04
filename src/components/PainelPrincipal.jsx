import React, { useMemo, useState } from 'react';
import { canReference } from '../utils/moduleReferences';
import { isTaskCancelled } from '../utils/taskStatus';

export default function PainelPrincipal({
  data,
  completion = 0,
  dailyXpDone = 0,
  dailyXpMax = 0,
  level = 1,
  nextXP = 0,
  progress = 0,
  daily,
  productivityScore = 0,
  bestHour,
  pendingTasks = [],
  onToggleTask,
  onToggleHabit,
  save,
  sourceData,
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
  const showStudies = canReference(data, 'estudos');

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
   * MURAL DE AVISOS
   * ============================================================
   * O mural pertence ao Painel Principal e fica salvo nos dados
   * centrais. Ele funciona como pequenos cartões personalizáveis,
   * semelhantes aos itens das Coleções, mas voltados para lembretes
   * e avisos rápidos.
   */
  const noticeBoard =
    data?.noticeBoard && typeof data.noticeBoard === 'object'
      ? data.noticeBoard
      : { enabled: false, items: [] };

  // Migração compatível: murais antigos (com apenas `items`) viram um mural Geral.
  const noticeBoards =
    Array.isArray(noticeBoard.boards) && noticeBoard.boards.length
      ? noticeBoard.boards.map((board, index) => ({
          id: board?.id || `notice-board-${index}`,
          name: String(board?.name || `Mural ${index + 1}`),
          items: Array.isArray(board?.items) ? board.items : [],
        }))
      : [
          {
            id: 'notice-board-default',
            name: 'Geral',
            items: Array.isArray(noticeBoard.items) ? noticeBoard.items : [],
          },
        ];

  const [activeNoticeBoardId, setActiveNoticeBoardId] = useState(
    noticeBoards[0]?.id || 'notice-board-default',
  );
  const activeNoticeBoard =
    noticeBoards.find((board) => board.id === activeNoticeBoardId) ||
    noticeBoards[0];
  const noticeItems = activeNoticeBoard?.items || [];

  const [noticeModalOpen, setNoticeModalOpen] = useState(false);
  const [editingNoticeId, setEditingNoticeId] = useState(null);
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    content: '',
    backgroundColor: '#fff3a6',
    textColor: '#2f2a1f',
    borderColor: '#e0b800',
    borderEnabled: true,
    borderMode: 'all',
  });

  const normalizeNotice = (notice) => ({
    backgroundColor: notice?.backgroundColor || notice?.color || '#fff3a6',
    textColor: notice?.textColor || '#2f2a1f',
    borderColor: notice?.borderColor || notice?.color || '#e0b800',
    borderEnabled: notice?.borderEnabled !== false,
    borderMode: notice?.borderMode === 'top' ? 'top' : 'all',
  });

  const updateNoticeBoard = (updater) => {
    if (typeof save !== 'function') return;

    const current = {
      enabled: Boolean(noticeBoard.enabled),
      boards: noticeBoards,
      activeBoardId: activeNoticeBoard?.id || noticeBoards[0]?.id,
    };
    const next = typeof updater === 'function' ? updater(current) : updater;

    save({
      ...(sourceData || data),
      noticeBoard: { ...current, ...next },
    });
  };

  const toggleNoticeBoard = () => {
    updateNoticeBoard((current) => ({ ...current, enabled: !current.enabled }));
  };

  const createNoticeBoard = () => {
    const name = window.prompt(
      'Nome do novo mural (ex.: Saúde, Concurso, Estudos):',
    );
    if (!name || !name.trim()) return;
    const board = {
      id: `notice-board-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim().slice(0, 40),
      items: [],
    };
    updateNoticeBoard((current) => ({
      ...current,
      enabled: true,
      boards: [...current.boards, board],
      activeBoardId: board.id,
    }));
    setActiveNoticeBoardId(board.id);
  };

  const renameNoticeBoard = () => {
    if (!activeNoticeBoard) return;
    const name = window.prompt('Novo nome do mural:', activeNoticeBoard.name);
    if (!name || !name.trim()) return;
    updateNoticeBoard((current) => ({
      ...current,
      boards: current.boards.map((board) =>
        board.id === activeNoticeBoard.id
          ? { ...board, name: name.trim().slice(0, 40) }
          : board,
      ),
    }));
  };

  const deleteNoticeBoard = () => {
    if (!activeNoticeBoard || noticeBoards.length <= 1) {
      window.alert(
        'Mantenha pelo menos um mural. Você pode renomear o mural atual.',
      );
      return;
    }
    if (
      !window.confirm(
        `Excluir o mural "${activeNoticeBoard.name}" e todos os avisos dele?`,
      )
    )
      return;
    const remaining = noticeBoards.filter(
      (board) => board.id !== activeNoticeBoard.id,
    );
    const nextActiveId = remaining[0].id;
    updateNoticeBoard((current) => ({
      ...current,
      boards: remaining,
      activeBoardId: nextActiveId,
    }));
    setActiveNoticeBoardId(nextActiveId);
  };

  const openNewNotice = () => {
    setEditingNoticeId(null);
    setNoticeForm({
      title: '',
      content: '',
      backgroundColor: '#fff3a6',
      textColor: '#2f2a1f',
      borderColor: '#e0b800',
      borderEnabled: true,
      borderMode: 'all',
    });
    setNoticeModalOpen(true);
  };

  const openEditNotice = (notice) => {
    setEditingNoticeId(notice.id);
    setNoticeForm({
      title: notice.title || '',
      content: notice.content || '',
      ...normalizeNotice(notice),
    });
    setNoticeModalOpen(true);
  };

  const saveNotice = (event) => {
    event.preventDefault();

    const title = noticeForm.title.trim();
    const content = noticeForm.content.trim();
    if (!title && !content) return;

    const now = new Date().toISOString();
    const item = {
      id:
        editingNoticeId ||
        `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: title || 'Aviso',
      content,
      backgroundColor: noticeForm.backgroundColor || '#fff3a6',
      textColor: noticeForm.textColor || '#2f2a1f',
      borderColor: noticeForm.borderColor || '#e0b800',
      borderEnabled: Boolean(noticeForm.borderEnabled),
      borderMode: noticeForm.borderMode === 'top' ? 'top' : 'all',
      createdAt: editingNoticeId
        ? noticeItems.find((notice) => notice.id === editingNoticeId)
            ?.createdAt || now
        : now,
      updatedAt: now,
    };

    updateNoticeBoard((current) => ({
      ...current,
      enabled: true,
      boards: current.boards.map((board) =>
        board.id !== activeNoticeBoard?.id
          ? board
          : {
              ...board,
              items: editingNoticeId
                ? board.items.map((notice) =>
                    notice.id === editingNoticeId
                      ? { ...notice, ...item }
                      : notice,
                  )
                : [item, ...board.items],
            },
      ),
    }));

    setNoticeModalOpen(false);
    setEditingNoticeId(null);
  };

  const deleteNotice = (id) => {
    if (!window.confirm('Excluir este aviso do mural?')) return;

    updateNoticeBoard((current) => ({
      ...current,
      boards: current.boards.map((board) =>
        board.id !== activeNoticeBoard?.id
          ? board
          : {
              ...board,
              items: board.items.filter((notice) => notice.id !== id),
            },
      ),
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

  const activeTasks = tasks.filter(
    (task) => !task.done && !isTaskCancelled(task, new Date()),
  );

  const pendingTasksCount =
    pendingTasks.length > 0
      ? pendingTasks.filter((task) => !isTaskCancelled(task, new Date())).length
      : activeTasks.length;

  const completedTasksCount = tasks.filter((task) => task.done).length;

  const activeGoals = goals.filter(
    (goal) =>
      !goal.done &&
      goal.status !== 'completed' &&
      goal.status !== 'concluido' &&
      goal.status !== 'concluida',
  );

  const completedGoals = goals.filter(
    (goal) =>
      goal.done ||
      goal.status === 'completed' ||
      goal.status === 'concluido' ||
      goal.status === 'concluida',
  );

  const totalInvestmentValue = investments.reduce((total, investment) => {
    const quantity = Number(investment?.quantity || 0);
    const price = Number(investment?.currentPrice || investment?.buyPrice || 0);
    return total + quantity * price;
  }, 0);

  const goalProgress = goals.length
    ? Math.round(
        goals.reduce(
          (sum, goal) =>
            sum +
            Math.max(
              0,
              Math.min(100, Number(goal?.progress ?? goal?.percentage ?? 0)),
            ),
          0,
        ) / goals.length,
      )
    : 0;

  /*
   * Tarefas relacionadas especificamente a hoje.
   */
  const todayTasks = useMemo(() => {
    const result = tasks.filter((task) => {
      if (!task) return false;

      if (isTaskCancelled(task, todayString)) return false;

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
      return tasks.filter(
        (task) => !task.done && !isTaskCancelled(task, todayString),
      );
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

  const todayEvents = useMemo(() => {
    const dailyTaskEvents = tasks
      .filter((task) => {
        const frequency = String(task?.frequency || task?.recurrence || '')
          .trim()
          .toLowerCase();
        const isDaily = [
          'diária',
          'diaria',
          'diário',
          'diario',
          'daily',
          'todos os dias',
        ].includes(frequency);
        return isDaily && !task.done && !isTaskCancelled(task, todayString);
      })
      .map((task) => ({
        id: `dashboard-daily-task:${task.id}:${todayString}`,
        taskId: task.id,
        name: task.title || task.name || 'Tarefa diária',
        description: task.description || '',
        date: todayString,
        type: 'task',
        scheduledTime: task.scheduledTime || task.time || '',
        duration: Number(task.duration || 0),
        sourceTask: true,
        isDailyTask: true,
      }));

    const merged = [
      ...calendarEvents.filter((event) => event?.date === todayString),
      ...dailyTaskEvents,
    ];
    const unique = new Map();
    merged.forEach((event) => {
      const key =
        event?.sourceTask && event?.taskId
          ? `task:${event.taskId}:${event.date}`
          : `${event?.type || 'event'}:${event?.id}:${event?.date}`;
      if (!unique.has(key)) unique.set(key, event);
    });

    return Array.from(unique.values()).sort((a, b) => {
      if (!a?.scheduledTime) return 1;
      if (!b?.scheduledTime) return -1;
      return String(a.scheduledTime).localeCompare(String(b.scheduledTime));
    });
  }, [calendarEvents, tasks, todayString]);

  const todayStudyEvents = useMemo(
    () => todayEvents.filter((event) => event?.type === 'study'),
    [todayEvents],
  );
  const nextStudyEvents = useMemo(
    () =>
      calendarEvents
        .filter(
          (event) => event?.type === 'study' && event?.date >= todayString,
        )
        .sort(
          (a, b) =>
            String(a.date).localeCompare(String(b.date)) ||
            String(a.scheduledTime || '').localeCompare(
              String(b.scheduledTime || ''),
            ),
        )
        .slice(0, 5),
    [calendarEvents, todayString],
  );
  const studyMinutesToday = todayStudyEvents.reduce(
    (sum, event) => sum + Number(event?.duration || 0),
    0,
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

  const weekData = useMemo(() => {
    const result = [];
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date(base);
      date.setDate(base.getDate() - offset);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const taskCount = tasks.filter((task) => {
        const completed =
          task?.completedAt || task?.completedDate || task?.doneAt || '';
        return String(completed).slice(0, 10) === key;
      }).length;
      const studyMinutes = (
        Array.isArray(data?.studySessions) ? data.studySessions : []
      ).reduce((sum, session) => {
        const sessionDate =
          session?.date || session?.startedAt || session?.createdAt || '';
        return String(sessionDate).slice(0, 10) === key
          ? sum + Number(session?.minutes || session?.duration || 0)
          : sum;
      }, 0);
      result.push({
        label: dayNames[date.getDay()],
        date: key,
        value: Math.max(
          taskCount * 20,
          Math.min(100, Math.round(studyMinutes / 3)),
        ),
        taskCount,
        studyMinutes,
      });
    }
    return result;
  }, [tasks, data?.studySessions]);

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

      <section className='dashboard-notice-toolbar'>
        <div>
          <span className='section-label'>MURAL</span>
          <strong>📌 Mural de avisos</strong>
          <span>
            Crie lembretes e avisos rápidos para aparecerem no seu Painel
            Principal.
          </span>
        </div>
        <div className='dashboard-notice-actions'>
          <button
            type='button'
            className={`dashboard-notice-toggle ${noticeBoard.enabled ? 'active' : ''}`}
            onClick={toggleNoticeBoard}
            aria-pressed={noticeBoard.enabled}
          >
            {noticeBoard.enabled ? '🟢 Mural ativado' : '⚪ Mural desativado'}
          </button>
          {noticeBoard.enabled && (
            <>
              <button
                type='button'
                className='dashboard-notice-add'
                onClick={createNoticeBoard}
              >
                + Novo mural
              </button>
              <button
                type='button'
                className='dashboard-notice-add'
                onClick={openNewNotice}
              >
                + Novo aviso
              </button>
            </>
          )}
        </div>
      </section>

      {noticeBoard.enabled && (
        <section className='card dashboard-notice-board'>
          <div className='dashboard-notice-header'>
            <div>
              <span className='section-label'>AVISOS</span>
              <h3>{activeNoticeBoard?.name || 'Seu mural'}</h3>
              <div
                className='dashboard-notice-board-tabs'
                role='tablist'
                aria-label='Selecionar mural'
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginTop: 12,
                }}
              >
                {noticeBoards.map((board) => (
                  <button
                    type='button'
                    key={board.id}
                    role='tab'
                    aria-selected={board.id === activeNoticeBoard?.id}
                    className={
                      board.id === activeNoticeBoard?.id ? 'active' : ''
                    }
                    style={{
                      border:
                        '1px solid var(--border-color, rgba(128,128,128,.3))',
                      borderRadius: 999,
                      padding: '7px 12px',
                      background:
                        board.id === activeNoticeBoard?.id
                          ? 'var(--primary-soft, rgba(99,102,241,.14))'
                          : 'transparent',
                      color: 'inherit',
                      cursor: 'pointer',
                    }}
                    onClick={() => setActiveNoticeBoardId(board.id)}
                  >
                    {board.name} <span>{board.items.length}</span>
                  </button>
                ))}
              </div>
              <div
                className='dashboard-notice-board-management'
                style={{
                  display: 'flex',
                  gap: 8,
                  flexWrap: 'wrap',
                  marginTop: 8,
                }}
              >
                <button
                  type='button'
                  onClick={renameNoticeBoard}
                  style={{
                    background: 'transparent',
                    border: 0,
                    color: 'var(--text-muted, inherit)',
                    cursor: 'pointer',
                    padding: '4px 0',
                  }}
                >
                  Renomear mural
                </button>
                <button
                  type='button'
                  onClick={deleteNoticeBoard}
                  disabled={noticeBoards.length <= 1}
                  style={{
                    background: 'transparent',
                    border: 0,
                    color: 'var(--text-muted, inherit)',
                    cursor:
                      noticeBoards.length <= 1 ? 'not-allowed' : 'pointer',
                    padding: '4px 0',
                    opacity: noticeBoards.length <= 1 ? 0.45 : 1,
                  }}
                >
                  Excluir mural
                </button>
              </div>
            </div>
            <span className='dashboard-notice-count'>
              {noticeItems.length}{' '}
              {noticeItems.length === 1 ? 'aviso' : 'avisos'}
            </span>
          </div>

          {noticeItems.length === 0 ? (
            <div className='dashboard-notice-empty'>
              <span>📌</span>
              <div>
                <strong>
                  O mural {activeNoticeBoard?.name || 'Geral'} está vazio
                </strong>
                <p>
                  Adicione um lembrete, uma ideia, uma prioridade ou qualquer
                  aviso que queira manter à vista.
                </p>
              </div>
              <button
                type='button'
                className='dashboard-notice-add'
                onClick={openNewNotice}
              >
                + Criar primeiro aviso
              </button>
            </div>
          ) : (
            <div className='dashboard-notice-grid'>
              {noticeItems.map((notice) => (
                <article
                  key={notice.id}
                  className={`dashboard-notice-card ${normalizeNotice(notice).borderEnabled ? 'has-border' : 'no-border'} ${normalizeNotice(notice).borderMode === 'top' ? 'border-top-only' : 'border-all'}`}
                  style={{
                    '--notice-bg': normalizeNotice(notice).backgroundColor,
                    '--notice-text': normalizeNotice(notice).textColor,
                    '--notice-border': normalizeNotice(notice).borderColor,
                    '--notice-rotation': `${
                      ((String(notice.id || '')
                        .split('')
                        .reduce((sum, char) => sum + char.charCodeAt(0), 0) %
                        5) -
                        2) *
                      0.45
                    }deg`,
                  }}
                >
                  <div className='dashboard-notice-card-top'>
                    <span className='dashboard-notice-pin'>📌</span>
                    <div className='dashboard-notice-card-actions'>
                      <button
                        type='button'
                        onClick={() => openEditNotice(notice)}
                        aria-label='Editar aviso'
                      >
                        ✎
                      </button>
                      <button
                        type='button'
                        onClick={() => deleteNotice(notice.id)}
                        aria-label='Excluir aviso'
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <h4>{notice.title || 'Aviso'}</h4>
                  <p>{notice.content || 'Sem conteúdo.'}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {noticeModalOpen && (
        <div className='dashboard-notice-modal-backdrop' role='presentation'>
          <form className='dashboard-notice-modal' onSubmit={saveNotice}>
            <div className='dashboard-notice-modal-header'>
              <div>
                <span className='section-label'>MURAL DE AVISOS</span>
                <h3>{editingNoticeId ? 'Editar aviso' : 'Novo aviso'}</h3>
              </div>
              <button
                type='button'
                onClick={() => setNoticeModalOpen(false)}
                aria-label='Fechar'
              >
                ×
              </button>
            </div>

            <label>
              Título
              <input
                value={noticeForm.title}
                onChange={(event) =>
                  setNoticeForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder='Ex.: Prova na sexta'
                maxLength={80}
              />
            </label>

            <label>
              Aviso
              <textarea
                value={noticeForm.content}
                onChange={(event) =>
                  setNoticeForm((current) => ({
                    ...current,
                    content: event.target.value,
                  }))
                }
                placeholder='Escreva o que precisa ficar visível...'
                rows={5}
                maxLength={500}
              />
            </label>

            <div className='dashboard-notice-customization'>
              <div className='dashboard-notice-color-field'>
                <label htmlFor='notice-background-color'>
                  Cor interna / fundo
                </label>
                <div className='dashboard-notice-color-input'>
                  <input
                    id='notice-background-color'
                    type='color'
                    value={noticeForm.backgroundColor}
                    onChange={(event) =>
                      setNoticeForm((current) => ({
                        ...current,
                        backgroundColor: event.target.value,
                      }))
                    }
                  />
                  <code>{noticeForm.backgroundColor}</code>
                </div>
              </div>

              <div className='dashboard-notice-color-field'>
                <label htmlFor='notice-text-color'>Cor da letra</label>
                <div className='dashboard-notice-color-input'>
                  <input
                    id='notice-text-color'
                    type='color'
                    value={noticeForm.textColor}
                    onChange={(event) =>
                      setNoticeForm((current) => ({
                        ...current,
                        textColor: event.target.value,
                      }))
                    }
                  />
                  <code>{noticeForm.textColor}</code>
                </div>
              </div>

              <div className='dashboard-notice-color-field'>
                <label htmlFor='notice-border-color'>Cor da borda</label>
                <div className='dashboard-notice-color-input'>
                  <input
                    id='notice-border-color'
                    type='color'
                    value={noticeForm.borderColor}
                    onChange={(event) =>
                      setNoticeForm((current) => ({
                        ...current,
                        borderColor: event.target.value,
                      }))
                    }
                  />
                  <code>{noticeForm.borderColor}</code>
                </div>
              </div>

              <div className='dashboard-notice-border-options'>
                <span>Borda</span>
                <div className='dashboard-notice-segmented'>
                  <button
                    type='button'
                    className={noticeForm.borderEnabled ? 'active' : ''}
                    onClick={() =>
                      setNoticeForm((current) => ({
                        ...current,
                        borderEnabled: true,
                      }))
                    }
                  >
                    Com borda
                  </button>
                  <button
                    type='button'
                    className={!noticeForm.borderEnabled ? 'active' : ''}
                    onClick={() =>
                      setNoticeForm((current) => ({
                        ...current,
                        borderEnabled: false,
                      }))
                    }
                  >
                    Sem borda
                  </button>
                </div>
              </div>

              <div className='dashboard-notice-border-options'>
                <span>Estilo da borda</span>
                <div className='dashboard-notice-segmented'>
                  <button
                    type='button'
                    disabled={!noticeForm.borderEnabled}
                    className={noticeForm.borderMode === 'top' ? 'active' : ''}
                    onClick={() =>
                      setNoticeForm((current) => ({
                        ...current,
                        borderMode: 'top',
                      }))
                    }
                  >
                    Só superior
                  </button>
                  <button
                    type='button'
                    disabled={!noticeForm.borderEnabled}
                    className={noticeForm.borderMode === 'all' ? 'active' : ''}
                    onClick={() =>
                      setNoticeForm((current) => ({
                        ...current,
                        borderMode: 'all',
                      }))
                    }
                  >
                    Todo o contorno
                  </button>
                </div>
              </div>
            </div>

            <div
              className={`dashboard-notice-preview ${noticeForm.borderEnabled ? 'has-border' : 'no-border'} ${noticeForm.borderMode === 'top' ? 'border-top-only' : 'border-all'}`}
              style={{
                '--notice-bg': noticeForm.backgroundColor,
                '--notice-text': noticeForm.textColor,
                '--notice-border': noticeForm.borderColor,
              }}
            >
              <span>📌</span>
              <div>
                <strong>{noticeForm.title || 'Prévia do post-it'}</strong>
                <p>
                  {noticeForm.content || 'Assim seu aviso ficará no mural.'}
                </p>
              </div>
            </div>

            <div className='dashboard-notice-modal-footer'>
              <button
                type='button'
                className='ghost'
                onClick={() => setNoticeModalOpen(false)}
              >
                Cancelar
              </button>
              <button type='submit' className='primary'>
                Salvar aviso
              </button>
            </div>
          </form>
        </div>
      )}

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

          <div className='dashboard-daily-xp'>
            <span>XP do dia</span>
            <strong>
              {dailyXpDone} / {dailyXpMax} XP
            </strong>
          </div>
        </div>
      </section>

      <section className='dashboard-command-grid'>
        <div className='card dashboard-weekly-panel'>
          <div className='dashboard-panel-heading'>
            <div>
              <span className='section-label'>DESTAQUES DA SEMANA</span>
              <h3>🚀 Seu ritmo recente</h3>
            </div>
            <span className='dashboard-panel-caption'>últimos 7 dias</span>
          </div>
          <div className='dashboard-chart'>
            {weekData.map((day) => (
              <div
                className='dashboard-chart-day'
                key={day.date}
                title={`${day.taskCount} tarefas · ${day.studyMinutes} min de estudo`}
              >
                <div className='dashboard-chart-track'>
                  <span style={{ height: `${Math.max(8, day.value)}%` }} />
                </div>
                <strong>{day.value}</strong>
                <small>{day.label}</small>
              </div>
            ))}
          </div>
          <div className='dashboard-weekly-metrics'>
            <span>🔥 {data?.gamification?.streak || 0} dias de sequência</span>
            <span>⏱️ {studyMinutesToday} min de estudo hoje</span>
            <span>✓ {completedTasksCount} tarefas concluídas</span>
          </div>
        </div>

        <div className='card dashboard-agenda-preview'>
          <div className='dashboard-panel-heading'>
            <div>
              <span className='section-label'>AGENDA</span>
              <h3>📅 Hoje</h3>
            </div>
            <span className='dashboard-agenda-count'>{todayEvents.length}</span>
          </div>
          <div className='dashboard-agenda-preview-list'>
            {todayEvents.slice(0, 5).map((event) => (
              <div
                className='dashboard-agenda-preview-item'
                key={`${event.id}-${event.date}`}
              >
                <span
                  className={`agenda-dot agenda-${event.type || 'event'}`}
                />
                <div>
                  <strong>{event.name || event.title || 'Evento'}</strong>
                  <small>
                    {event.scheduledTime || 'Hoje'}
                    {event.duration ? ` · ${event.duration} min` : ''}
                    {event.isDailyTask ? ' · diária' : ''}
                  </small>
                </div>
              </div>
            ))}
            {todayEvents.length === 0 && (
              <div className='dashboard-agenda-empty'>
                Agenda livre por enquanto.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className='dashboard-highlight-grid'>
        <div className='card dashboard-highlight-card'>
          <div className='highlight-icon'>🎯</div>
          <div className='highlight-main'>
            <span>Próxima meta</span>
            <strong>
              {activeGoals[0]?.title ||
                activeGoals[0]?.name ||
                'Defina um objetivo'}
            </strong>
            <small>
              {activeGoals[0]
                ? `${Math.max(0, Math.min(100, Number(activeGoals[0].progress ?? activeGoals[0].percentage ?? 0)))}% concluído`
                : 'Transforme uma intenção em meta.'}
            </small>
          </div>
          <div className='highlight-progress'>
            <span
              style={{
                width: `${activeGoals[0] ? Math.max(0, Math.min(100, Number(activeGoals[0].progress ?? activeGoals[0].percentage ?? 0))) : 0}%`,
              }}
            />
          </div>
        </div>
        <div className='card dashboard-highlight-card'>
          <div className='highlight-icon'>🔥</div>
          <div className='highlight-main'>
            <span>Hábitos de hoje</span>
            <strong>
              {habitsDoneCount}/{totalHabits} concluídos
            </strong>
            <small>
              {totalHabits
                ? 'Mantenha a sequência'
                : 'Cadastre seus hábitos principais'}
            </small>
          </div>
          <div className='highlight-progress'>
            <span
              style={{
                width: `${totalHabits ? Math.round((habitsDoneCount / totalHabits) * 100) : 0}%`,
              }}
            />
          </div>
        </div>
        <div className='card dashboard-highlight-card dashboard-gami-highlight'>
          <div className='highlight-icon'>🏆</div>
          <div className='highlight-main'>
            <span>Gamificação</span>
            <strong>Nível {level}</strong>
            <small>
              {Number(data?.xp || 0).toLocaleString('pt-BR')} XP ·{' '}
              {Number(data?.coins || 0).toLocaleString('pt-BR')} moedas
            </small>
          </div>
          <div className='highlight-progress'>
            <span
              style={{
                width: `${Math.max(0, Math.min(100, Number(progress) || 0))}%`,
              }}
            />
          </div>
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
            <span className='dashboard-stat-chevron'>
              {expandedSections.goals ? '⌃' : '⌄'}
            </span>
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
            <span className='dashboard-stat-chevron'>
              {expandedSections.investments ? '⌃' : '⌄'}
            </span>
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
            <button
              type='button'
              className='dashboard-collapse-button'
              onClick={() => toggleSection('goals')}
            >
              Ocultar
            </button>
          </div>
          <div className='dashboard-inline-list'>
            {goals.length === 0 ? (
              <div className='dashboard-empty-state'>
                <span>🎯</span>
                <div>
                  <strong>Nenhum objetivo cadastrado</strong>
                  <p>Crie um objetivo para acompanhar seu progresso aqui.</p>
                </div>
              </div>
            ) : (
              goals.slice(0, 8).map((goal) => {
                const value = Math.max(
                  0,
                  Math.min(
                    100,
                    Number(goal?.progress ?? goal?.percentage ?? 0),
                  ),
                );
                const done =
                  Boolean(goal?.done) ||
                  ['completed', 'concluido', 'concluida'].includes(
                    String(goal?.status || '').toLowerCase(),
                  );
                return (
                  <div key={goal.id} className='dashboard-list-item'>
                    <div className='dashboard-stat-icon'>🎯</div>
                    <div className='dashboard-list-main'>
                      <strong>
                        {goal.title || goal.name || 'Objetivo sem nome'}
                      </strong>
                      <span>{done ? 'Concluído' : `${value}% concluído`}</span>
                      <div className='dashboard-reference-progress'>
                        <span style={{ width: `${done ? 100 : value}%` }} />
                      </div>
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
            <button
              type='button'
              className='dashboard-collapse-button'
              onClick={() => toggleSection('investments')}
            >
              Ocultar
            </button>
          </div>
          <div className='dashboard-reference-investment-summary'>
            <div>
              <span>Ativos</span>
              <strong>{investments.length}</strong>
            </div>
            <div>
              <span>Valor atual</span>
              <strong>{formatCurrency(totalInvestmentValue)}</strong>
            </div>
          </div>
          <div className='dashboard-inline-list'>
            {investments.length === 0 ? (
              <div className='dashboard-empty-state'>
                <span>📈</span>
                <div>
                  <strong>Nenhum investimento cadastrado</strong>
                  <p>Adicione ativos na área de investimentos.</p>
                </div>
              </div>
            ) : (
              investments.slice(0, 8).map((investment) => (
                <div key={investment.id} className='dashboard-list-item'>
                  <div className='dashboard-stat-icon'>📈</div>
                  <div className='dashboard-list-main'>
                    <strong>
                      {investment.ticker || investment.name || 'Investimento'}
                    </strong>
                    <span>{investment.type || 'Ativo'}</span>
                  </div>
                  <strong>
                    {formatCurrency(
                      Number(investment.quantity || 0) *
                        Number(
                          investment.currentPrice || investment.buyPrice || 0,
                        ),
                    )}
                  </strong>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {showStudies && (
        <section className='card dashboard-day-card dashboard-study-card'>
          <div className='dashboard-inline-header'>
            <div>
              <span className='section-label'>ESTUDOS</span>
              <h3>📚 Estudos de hoje</h3>
              <p>
                {studyMinutesToday > 0
                  ? `${studyMinutesToday} min planejados para hoje.`
                  : 'Seu planejamento de estudos aparecerá aqui.'}
              </p>
            </div>
            <div className='dashboard-study-badge'>
              {todayStudyEvents.length} sessão(ões)
            </div>
          </div>
          {todayStudyEvents.length > 0 ? (
            <div className='dashboard-inline-list'>
              {todayStudyEvents.map((event) => (
                <div key={event.id} className='dashboard-list-item'>
                  <div className='dashboard-event-time'>
                    {event.scheduledTime || '—'}
                  </div>
                  <div className='dashboard-list-main'>
                    <strong>{event.name}</strong>
                    <span>
                      {event.duration || 0} min
                      {event.description ? ` · ${event.description}` : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : nextStudyEvents.length > 0 ? (
            <div className='dashboard-inline-list'>
              <div className='dashboard-study-next'>
                <strong>Próximo estudo</strong>
                <span>
                  {nextStudyEvents[0].name} ·{' '}
                  {formatDate(nextStudyEvents[0].date)}{' '}
                  {nextStudyEvents[0].scheduledTime
                    ? `às ${nextStudyEvents[0].scheduledTime}`
                    : ''}
                </span>
              </div>
            </div>
          ) : (
            <div className='dashboard-empty-state'>
              <span>🗓️</span>
              <div>
                <strong>Planejamento ainda não gerado</strong>
                <p>
                  Abra Estudos → Planejamento para organizar sua rotina e enviar
                  as sessões para a agenda.
                </p>
              </div>
            </div>
          )}
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
