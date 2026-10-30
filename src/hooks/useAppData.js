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
    tasks: Array.isArray(source.tasks) ? source.tasks : [],

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
   * Conclui uma tarefa e registra XP, moedas e histórico.
   */
  const completeTask = useCallback(
    (id) => {
      const task = tasks.find((item) => item.id === id);

      if (!task || task.done) return;

      const now = new Date();
      const historyToday = history[today] || {};
      const taskXP = Number(task.xp) || 0;

      const updatedTasks = tasks.map((item) =>
        item.id === id
          ? {
              ...item,
              done: true,
              completedAt: now.toISOString(),
            }
          : item,
      );

      save({
        ...safeData,
        xp: (Number(safeData.xp) || 0) + taskXP,
        coins: (Number(safeData.coins) || 0) + Math.floor(taskXP / 10),
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
              now.toISOString(),
            ],
          },
        },
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
