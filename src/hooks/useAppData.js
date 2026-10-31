import { useState, useEffect, useMemo, useCallback } from 'react';
import { storageService, emptyAppData } from '../services/storage';
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

  return {
    ...emptyAppData,
    ...source,

    habits: Array.isArray(source.habits) ? source.habits : [],
    tasks: Array.isArray(source.tasks)
      ? source.tasks.map((task) => ({
          ...task,
          observations: Array.isArray(task.observations)
            ? task.observations
            : [],
        }))
      : [],
    goals: Array.isArray(source.goals) ? source.goals : [],
    projects: Array.isArray(source.projects) ? source.projects : [],
    areas: Array.isArray(source.areas) ? source.areas : [],
    processes: Array.isArray(source.processes) ? source.processes : [],

    calendarEvents: Array.isArray(source.calendarEvents)
      ? source.calendarEvents
      : [],

    history:
      source.history &&
      typeof source.history === 'object' &&
      !Array.isArray(source.history)
        ? source.history
        : {},

    diaryEntries: Array.isArray(source.diaryEntries) ? source.diaryEntries : [],

    studySessions: Array.isArray(source.studySessions)
      ? source.studySessions
      : [],

    knowledgeItems: Array.isArray(source.knowledgeItems)
      ? source.knowledgeItems
      : [],

    // NOVO: dados da página Coleções & Conquistas
    collections: Array.isArray(source.collections) ? source.collections : [],

    errors: Array.isArray(source.errors) ? source.errors : [],

    weeklyReflections: Array.isArray(source.weeklyReflections)
      ? source.weeklyReflections
      : [],

    xp: Number(source.xp) || 0,
    coins: Number(source.coins) || 0,

    finance: {
      ...(emptyAppData.finance || {}),
      ...(source.finance || {}),
      transactions: Array.isArray(source.finance?.transactions)
        ? source.finance.transactions
        : [],
      financialGoals: Array.isArray(source.finance?.financialGoals)
        ? source.finance.financialGoals
        : [],
      budgetsByCategory:
        source.finance?.budgetsByCategory &&
        typeof source.finance.budgetsByCategory === 'object'
          ? source.finance.budgetsByCategory
          : {},
      accounts: Array.isArray(source.finance?.accounts)
        ? source.finance.accounts
        : [],
    },

    investments: Array.isArray(source.investments) ? source.investments : [],

    portfolioHistory: Array.isArray(source.portfolioHistory)
      ? source.portfolioHistory
      : [],

    targetAllocation:
      source.targetAllocation && typeof source.targetAllocation === 'object'
        ? source.targetAllocation
        : { Ações: 60, FIIs: 20, 'Renda Fixa': 20, Cripto: 0 },

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
        ? source.settings
        : {},
  };
}

/**
 * Aceita:
 * - objeto do Supabase: { id, email, ... }
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

  // O backend de autenticação já identifica cada conta.
  // Os dados de produtividade continuam locais nesta etapa da migração.
  const [cloudReady] = useState(true);
  const [syncError, setSyncError] = useState('');
  const [syncStatus, setSyncStatus] = useState('local');

  useEffect(() => {
    if (!storageKey) {
      setData(normalizeAppData(null));
      setSyncStatus('local');
      return;
    }

    setData(normalizeAppData(storageService.loadData(storageKey)));
    setSyncStatus('local');
    setSyncError('');
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey || !data) return;

    const result = storageService.saveData(storageKey, normalizeAppData(data));
    if (result === false) {
      setSyncError('Não foi possível salvar os dados neste dispositivo.');
      setSyncStatus('error');
    } else {
      setSyncError('');
      setSyncStatus('local');
    }
  }, [data, storageKey]);

  /**
   * Função principal usada pelas páginas.
   * Exemplo: save(novoObjeto).
   */
  const save = useCallback((nextData) => {
    setData(normalizeAppData(nextData));
  }, []);

  const safeData = data || normalizeAppData(null);

  const today = getTodayDate();
  const history = safeData.history || {};
  const daily = history[today] || {};

  const levelInfo = useMemo(
    () => calculateLevelInfo(Number(safeData.xp) || 0),
    [safeData.xp],
  );

  const productivityScore = useMemo(
    () => calculateProductivityScore(daily || {}),
    [daily],
  );

  const bestHour = useMemo(
    () => calculateBestHour(daily?.completionTimes || []),
    [daily],
  );

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

  /**
   * Alterna o status da tarefa. Ao reabrir, estorna a recompensa e
   * corrige o histórico do dia em que ela havia sido concluída.
   */
  const completeTask = useCallback(
    (id) => {
      const task = tasks.find((item) => String(item.id) === String(id));
      if (!task) return;

      const now = new Date();
      const taskXP = Math.max(0, Number(task.xp) || 0);
      const rewardCoins = Math.floor(taskXP / 10);

      if (!task.done) {
        const timestamp = now.toISOString();
        const historyToday = history[today] || {};
        const updatedTasks = tasks.map((item) =>
          String(item.id) === String(id)
            ? { ...item, done: true, completedAt: timestamp }
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
          ? { ...item, done: false, completedAt: null }
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

  /**
   * Atualiza os indicadores do dia atual.
   */
  const updateHistory = useCallback(
    (patch) => {
      if (!patch || typeof patch !== 'object') return;

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

  return {
    // Dados principais
    data: safeData,
    save,

    // Estado da sincronização
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
    habits: safeData.habits || [],
  };
}
