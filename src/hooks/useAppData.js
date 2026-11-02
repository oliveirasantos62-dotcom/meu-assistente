import { useState, useEffect, useMemo, useCallback } from 'react';
import { storageService, emptyAppData } from '../services/storage';
import { loadAppData, saveAppData } from '../services/api';
import {
  getTodayDate,
  calculateLevelInfo,
  calculateProductivityScore,
  calculateBestHour,
  generatePeriodRecords,
  MOOD_SCORES,
} from '../utils/calculations';

/**
 * Garante que os dados tenham uma estrutura válida,
 * mesmo quando vêm de uma versão antiga do aplicativo.
 */
function normalizeAppData(rawData) {
  const source = rawData && typeof rawData === 'object' ? rawData : {};

  // Migração automática: versões antigas permitiam criar "tarefas"
  // diretamente no calendário. Agora tarefas pertencem a data.tasks,
  // para que Calendário e Tarefas sempre usem a mesma entidade.
  const sourceTasks = Array.isArray(source.tasks) ? source.tasks : [];

  const sourceCalendarEvents = Array.isArray(source.calendarEvents)
    ? source.calendarEvents
    : [];

  const existingTaskIds = new Set(sourceTasks.map((task) => String(task.id)));

  const migratedCalendarTasks = sourceCalendarEvents
    .filter((event) => event?.type === 'task' && !event?.sourceTask)
    .filter((event) => !existingTaskIds.has(String(event.id)))
    .map((event) => ({
      id: event.id,
      name: event.name || 'Tarefa sem título',
      description: event.notes || event.description || '',
      priority:
        event.priority === 'high'
          ? 'Alta'
          : event.priority === 'low'
            ? 'Baixa'
            : 'Média',
      deadline: event.date || '',
      frequency:
        event.recurrence === 'daily'
          ? 'Diária'
          : event.recurrence === 'weekly'
            ? 'Semanal'
            : event.recurrence === 'monthly'
              ? 'Mensal'
              : '1x',
      xp: Number(event.xp || 40),
      projectId: event.projectId || null,
      areaId: event.areaId || null,
      scheduledTime: event.scheduledTime || '',
      duration: Number(event.duration || 0),
      recurrence: event.recurrence || 'none',
      recurrenceEnd: event.recurrenceEnd || '',
      done: Boolean(event.done),
      createdAt: event.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

  const migratedTaskIds = new Set(
    migratedCalendarTasks.map((task) => String(task.id)),
  );

  // Migra a antiga propriedade singular `tag` das tarefas para o sistema
  // central de tags. Assim, tarefas antigas continuam conectadas aos
  // relatórios, filtros e demais entidades sem duplicar informação.
  const normalizedTags = Array.isArray(source.tags)
    ? source.tags.map((tag) => ({
        ...tag,
        id: String(tag.id),
        name: String(tag.name || '').replace(/^#/, '').trim(),
      })).filter((tag) => tag.name)
    : [];

  const legacyTagIds = new Map(
    normalizedTags.map((tag) => [tag.name.toLowerCase(), String(tag.id)]),
  );

  const tasksWithNormalizedTags = [...sourceTasks, ...migratedCalendarTasks].map((task) => {
    const existing = Array.isArray(task.tags)
      ? task.tags.map((tag) => (typeof tag === 'object' ? tag.id : String(tag))).filter(Boolean)
      : [];

    const legacyName = String(task.tag || '').replace(/^#/, '').trim();
    if (legacyName) {
      let tagId = legacyTagIds.get(legacyName.toLowerCase());
      if (!tagId) {
        tagId = `legacy-tag-${legacyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || Date.now()}`;
        const newTag = {
          id: tagId,
          name: legacyName,
          color: '#6366f1',
          createdAt: new Date().toISOString(),
        };
        normalizedTags.push(newTag);
        legacyTagIds.set(legacyName.toLowerCase(), tagId);
      }
      if (!existing.includes(tagId)) existing.push(tagId);
    }

    const normalizedTask = { ...task, tags: Array.from(new Set(existing.map(String))) };
    delete normalizedTask.tag;
    return normalizedTask;
  });

  const normalizeEntityTags = (item) => ({
    ...item,
    tags: Array.from(new Set((Array.isArray(item?.tags) ? item.tags : []).map((tag) => typeof tag === 'object' ? tag.id : tag).map(String).filter(Boolean))),
  });

  const normalizeCollectionTags = (collection) => ({
    ...normalizeEntityTags(collection),
    itens: Array.isArray(collection?.itens) ? collection.itens.map(normalizeEntityTags) : [],
  });

  const normalizedCollections = Array.isArray(source.collections)
    ? source.collections.map(normalizeCollectionTags)
    : [];

  const normalizedFinance = {
    ...(emptyAppData.finance || {}),
    ...(source.finance || {}),
    transactions: Array.isArray(source.finance?.transactions)
      ? source.finance.transactions.map(normalizeEntityTags)
      : [],
    financialGoals: Array.isArray(source.finance?.financialGoals)
      ? source.finance.financialGoals.map(normalizeEntityTags)
      : [],
    budgetsByCategory: source.finance?.budgetsByCategory && typeof source.finance.budgetsByCategory === 'object'
      ? source.finance.budgetsByCategory
      : {},
    accounts: Array.isArray(source.finance?.accounts)
      ? source.finance.accounts.map(normalizeEntityTags)
      : [],
  };

  return {
    ...emptyAppData,
    ...source,

    habits: Array.isArray(source.habits) ? source.habits.map(normalizeEntityTags) : [],

    tasks: tasksWithNormalizedTags.map((task) => ({
      ...task,
      observations: Array.isArray(task.observations) ? task.observations : [],
    })),

    goals: Array.isArray(source.goals) ? source.goals.map(normalizeEntityTags) : [],

    projects: Array.isArray(source.projects) ? source.projects.map(normalizeEntityTags) : [],

    areas: Array.isArray(source.areas) ? source.areas.map(normalizeEntityTags) : [],

    processes: Array.isArray(source.processes) ? source.processes.map(normalizeEntityTags) : [],

    calendarEvents: sourceCalendarEvents.filter(
      (event) =>
        !(
          event?.type === 'task' &&
          !event?.sourceTask &&
          migratedTaskIds.has(String(event.id))
        ),
    ).map(normalizeEntityTags),

    history:
      source.history &&
      typeof source.history === 'object' &&
      !Array.isArray(source.history)
        ? source.history
        : {},

    diaryEntries: Array.isArray(source.diaryEntries) ? source.diaryEntries.map(normalizeEntityTags) : [],

    studySessions: Array.isArray(source.studySessions)
      ? source.studySessions.map(normalizeEntityTags)
      : [],

    knowledgeItems: Array.isArray(source.knowledgeItems)
      ? source.knowledgeItems.map(normalizeEntityTags)
      : [],

    // Coleções & Conquistas
    collections: normalizedCollections,

    tags: normalizedTags,

    studyCycles: Array.isArray(source.studyCycles) ? source.studyCycles.map(normalizeEntityTags) : [],

    errors: Array.isArray(source.errors) ? source.errors.map(normalizeEntityTags) : [],

    weeklyReflections: Array.isArray(source.weeklyReflections)
      ? source.weeklyReflections.map(normalizeEntityTags)
      : [],

    xp: Number(source.xp) || 0,

    coins: Number(source.coins) || 0,

    finance: normalizedFinance,
    investments: Array.isArray(source.investments) ? source.investments.map(normalizeEntityTags) : [],

    portfolioHistory: Array.isArray(source.portfolioHistory)
      ? source.portfolioHistory
      : [],

    targetAllocation:
      source.targetAllocation && typeof source.targetAllocation === 'object'
        ? source.targetAllocation
        : {
            Ações: 60,
            FIIs: 20,
            'Renda Fixa': 20,
            Cripto: 0,
          },

    gamification: {
      ...(emptyAppData.gamification || {}),
      ...(source.gamification || {}),

      missions: Array.isArray(source.gamification?.missions)
        ? source.gamification.missions
        : [],

      achievements: Array.isArray(source.gamification?.achievements)
        ? source.gamification.achievements
        : [],

      rewards: Array.isArray(source.gamification?.rewards)
        ? source.gamification.rewards
        : [],
    },

    assistant: {
      ...(emptyAppData.assistant || {}),
      ...(source.assistant || {}),

      history: Array.isArray(source.assistant?.history)
        ? source.assistant.history
        : [],

      notes: Array.isArray(source.assistant?.notes)
        ? source.assistant.notes
        : [],
    },

    settings:
      source.settings && typeof source.settings === 'object'
        ? {
            modules: source.settings.modules && typeof source.settings.modules === 'object' ? source.settings.modules : {},
            moduleReferences: source.settings.moduleReferences && typeof source.settings.moduleReferences === 'object' ? source.settings.moduleReferences : {},
            assistant: source.settings.assistant && typeof source.settings.assistant === 'object' ? source.settings.assistant : { webResearch: false },
          }
        : { modules: {}, moduleReferences: {}, assistant: { webResearch: false } },
  };
}

/**
 * Aceita:
 * - objeto de usuário autenticado: { id, email, ... }
 * - string antiga de usuário, para compatibilidade.
 */
function getUserInfo(user) {
  if (user && typeof user === 'object') {
    return {
      userId: user.id || null,
      storageKey: user.email || user.id || null,
    };
  }

  return {
    userId: null,
    storageKey: typeof user === 'string' ? user : null,
  };
}

export function useAppData(user) {
  const { userId, storageKey } = getUserInfo(user);

  const backendUser = user?.authProvider === 'backend';

  const [data, setData] = useState(() =>
    normalizeAppData(storageKey ? storageService.loadData(storageKey) : null),
  );

  const [period, setPeriod] = useState('7');

  // Dados de contas autenticadas são carregados
  // e persistidos no TiDB pela API.
  const [cloudReady, setCloudReady] = useState(!backendUser);

  const [loadedUserKey, setLoadedUserKey] = useState(null);

  const [syncError, setSyncError] = useState('');

  const [syncStatus, setSyncStatus] = useState(
    backendUser ? 'loading' : 'local',
  );

  // =========================================
  // CARREGAMENTO DOS DADOS
  // =========================================

  useEffect(() => {
    let cancelled = false;

    if (!storageKey) {
      setData(normalizeAppData(null));

      setCloudReady(false);
      setLoadedUserKey(null);
      setSyncStatus('local');
      setSyncError('');

      return () => {
        cancelled = true;
      };
    }

    if (!backendUser || !userId) {
      setData(normalizeAppData(storageService.loadData(storageKey)));

      setCloudReady(true);
      setLoadedUserKey(null);
      setSyncStatus('local');
      setSyncError('');

      return () => {
        cancelled = true;
      };
    }

    setCloudReady(false);
    setLoadedUserKey(null);
    setSyncStatus('loading');
    setSyncError('');

    const localData = normalizeAppData(storageService.loadData(storageKey));

    loadAppData()
      .then(async (remote) => {
        if (cancelled) return;

        if (remote?.exists && remote.appData) {
          const cloudData = normalizeAppData(remote.appData);

          setData(cloudData);

          storageService.saveData(storageKey, cloudData);
        } else {
          // Migra automaticamente os dados
          // locais antigos para o TiDB.
          await saveAppData(localData);

          if (cancelled) return;

          setData(localData);
        }

        setLoadedUserKey(storageKey);

        setCloudReady(true);
        setSyncStatus('synced');
      })
      .catch((error) => {
        if (cancelled) return;

        setData(localData);

        setSyncError(
          error?.message || 'Não foi possível carregar os dados do TiDB.',
        );

        setSyncStatus('error');
        setCloudReady(false);
      });

    return () => {
      cancelled = true;
    };
  }, [storageKey, userId, backendUser]);

  // =========================================
  // SINCRONIZAÇÃO
  // =========================================

  useEffect(() => {
    if (!storageKey || !data) {
      return;
    }

    const normalized = normalizeAppData(data);

    storageService.saveData(storageKey, normalized);

    if (!backendUser) {
      setSyncError('');
      setSyncStatus('local');
      return;
    }

    // Impede gravações antes de concluir
    // a carga/migração da conta atual.
    if (loadedUserKey !== storageKey || !cloudReady) {
      return;
    }

    let cancelled = false;

    setSyncStatus('saving');

    saveAppData(normalized)
      .then(() => {
        if (cancelled) return;

        setSyncError('');
        setSyncStatus('synced');
      })
      .catch((error) => {
        if (cancelled) return;

        setSyncError(
          error?.message || 'Não foi possível salvar os dados no TiDB.',
        );

        setSyncStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [data, storageKey, backendUser, loadedUserKey, cloudReady]);

  // =========================================
  // SAVE
  // =========================================

  const save = useCallback((nextData) => {
    setData(normalizeAppData(nextData));
  }, []);

  const safeData = data || normalizeAppData(null);

  // =========================================
  // DADOS DO DIA
  // =========================================

  const today = getTodayDate();

  const history = safeData.history || {};

  const daily = history[today] || {};

  // =========================================
  // NÍVEL
  // =========================================

  const levelInfo = useMemo(
    () => calculateLevelInfo(Number(safeData.xp) || 0),
    [safeData.xp],
  );

  // =========================================
  // PRODUTIVIDADE
  // =========================================

  const productivityScore = useMemo(
    () => calculateProductivityScore(daily || {}),
    [daily],
  );

  // =========================================
  // MELHOR HORÁRIO
  // =========================================

  const bestHour = useMemo(
    () => calculateBestHour(daily?.completionTimes || []),
    [daily],
  );

  // =========================================
  // TAREFAS
  // =========================================

  const tasks = Array.isArray(safeData.tasks) ? safeData.tasks : [];

  const pendingTasks = useMemo(
    () => tasks.filter((task) => !task.done),
    [tasks],
  );

  const completedTasks = useMemo(
    () => tasks.filter((task) => task.done),
    [tasks],
  );

  const completion = tasks.length
    ? Math.round((completedTasks.length / tasks.length) * 100)
    : 0;

  // =========================================
  // REGISTROS
  // =========================================

  const records = useMemo(
    () => generatePeriodRecords(period, history),
    [period, history],
  );

  const moodValues = records
    .map((record) => MOOD_SCORES?.[record.mood] || 0)
    .filter((value) => value > 0);

  const moodAverage = moodValues.length
    ? (
        moodValues.reduce((total, value) => total + value, 0) /
        moodValues.length
      ).toFixed(1)
    : 0;

  const totalXP = records.reduce(
    (sum, record) => sum + (Number(record.xp) || 0),
    0,
  );

  const totalDone = records.reduce(
    (sum, record) => sum + (Number(record.completed) || 0),
    0,
  );

  const spent = records.reduce(
    (sum, record) => sum + (Number(record.spent) || 0),
    0,
  );

  const overload =
    pendingTasks.length >= 6 ||
    (Number(daily?.energy) > 0 && Number(daily.energy) <= 2) ||
    (Number(daily?.focus) > 0 && Number(daily.focus) <= 2);

  // =========================================
  // CONCLUIR / REABRIR TAREFA
  // =========================================

  const completeTask = useCallback(
    (id) => {
      const task = tasks.find((item) => String(item.id) === String(id));

      if (!task) return;

      const now = new Date();

      const taskXP = Math.max(0, Number(task.xp) || 0);

      const rewardCoins = Math.floor(taskXP / 10);

      // -------------------------------------
      // CONCLUIR
      // -------------------------------------

      if (!task.done) {
        const timestamp = now.toISOString();

        const historyToday = history[today] || {};

        const updatedTasks = tasks.map((item) =>
          String(item.id) === String(id)
            ? {
                ...item,
                done: true,
                completedAt: timestamp,
              }
            : item,
        );

        save({
          ...safeData,

          xp: (Number(safeData.xp) || 0) + taskXP,

          coins: (Number(safeData.coins) || 0) + rewardCoins,

          tasks: updatedTasks,

          history: {
            ...history,

            [today]: {
              ...historyToday,

              completed: (Number(historyToday.completed) || 0) + 1,

              xp: (Number(historyToday.xp) || 0) + taskXP,

              completionTimes: [
                ...(Array.isArray(historyToday.completionTimes)
                  ? historyToday.completionTimes
                  : []),

                timestamp,
              ],
            },
          },
        });

        return;
      }

      // -------------------------------------
      // REABRIR
      // -------------------------------------

      const completedAt = task.completedAt || now.toISOString();

      const completedDate = completedAt.slice(0, 10);

      const dayHistory = history[completedDate] || {};

      const updatedHistory = {
        ...history,

        [completedDate]: {
          ...dayHistory,

          completed: Math.max(0, (Number(dayHistory.completed) || 0) - 1),

          xp: Math.max(0, (Number(dayHistory.xp) || 0) - taskXP),

          completionTimes: (Array.isArray(dayHistory.completionTimes)
            ? dayHistory.completionTimes
            : []
          ).filter((timestamp) => timestamp !== completedAt),
        },
      };

      const updatedTasks = tasks.map((item) =>
        String(item.id) === String(id)
          ? {
              ...item,
              done: false,
              completedAt: null,
            }
          : item,
      );

      save({
        ...safeData,

        xp: Math.max(0, (Number(safeData.xp) || 0) - taskXP),

        coins: Math.max(0, (Number(safeData.coins) || 0) - rewardCoins),

        tasks: updatedTasks,

        history: updatedHistory,
      });
    },
    [tasks, history, today, safeData, save],
  );

  // =========================================
  // HÁBITOS
  // =========================================

  const habits = Array.isArray(safeData.habits) ? safeData.habits : [];

  /**
   * Alterna o hábito para uma determinada data.
   *
   * Mantém:
   * habit.history[data] = true/false
   *
   * e também atualiza:
   * habit.done
   *
   * para manter compatibilidade com
   * versões antigas do aplicativo.
   */
  const toggleHabit = useCallback(
    (habitId, date = today) => {
      const currentHabits = Array.isArray(safeData.habits)
        ? safeData.habits
        : [];

      const updatedHabits = currentHabits.map((habit) => {
        if (String(habit.id) !== String(habitId)) {
          return habit;
        }

        const history = {
          ...(habit.history || {}),
        };

        const hasDate = Object.prototype.hasOwnProperty.call(history, date);

        const currentDone = hasDate
          ? Boolean(history[date])
          : Boolean(habit.done);

        const nextDone = !currentDone;

        history[date] = nextDone;

        return {
          ...habit,

          history,

          // Compatibilidade
          // com a estrutura antiga.
          done: date === today ? nextDone : habit.done,

          updatedAt: new Date().toISOString(),
        };
      });

      save({
        ...safeData,
        habits: updatedHabits,
      });
    },
    [safeData, today, save],
  );

  // =========================================
  // HISTÓRICO
  // =========================================

  const updateHistory = useCallback(
    (patch) => {
      if (!patch || typeof patch !== 'object') {
        return;
      }

      const currentDay = history[today] || {};

      save({
        ...safeData,

        history: {
          ...history,

          [today]: {
            ...currentDay,
            ...patch,
          },
        },
      });
    },
    [safeData, history, today, save],
  );

  // =========================================
  // RETORNO
  // =========================================

  return {
    // Dados principais
    data: safeData,
    save,

    // Sincronização
    cloudReady,
    syncError,
    syncStatus,

    // Período
    period,
    setPeriod,

    // Dia atual
    today,
    daily,

    // Dashboard
    levelInfo,
    productivityScore,
    bestHour,

    // Tarefas
    tasks,
    pendingTasks,
    completedTasks,
    completion,

    // Histórico
    history,
    records,

    // Indicadores
    moodAverage,
    totalXP,
    totalDone,
    spent,
    overload,

    // Ações
    completeTask,
    toggleHabit,
    updateHistory,

    // Diário e estudos
    diaryEntries: safeData.diaryEntries,

    studySessions: safeData.studySessions,

    knowledgeItems: safeData.knowledgeItems,

    errors: safeData.errors,

    weeklyReflections: safeData.weeklyReflections,

    // Financeiro
    transactions: safeData.finance?.transactions || [],

    // Hábitos
    habits,
  };
}
