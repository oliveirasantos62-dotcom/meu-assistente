const DEFAULT_REFERENCES = {
  dashboard: true,
  tasks: true,
  processos: true,
  calendar: true,
  diario: true,
  estudos: true,
  goals: true,
  habits: true,
  evolucao: true,
  projects: true,
  groups: true,
  collections: true,
  reports: true,
  tags: true,
  gamification: true,
  finance: true,
  investments: true,
  connections: true,
  foguinho: true,
  assistant: true,
};

export function getModuleReferences(data) {
  return {
    ...DEFAULT_REFERENCES,
    ...(data?.settings?.moduleReferences || {}),
  };
}

export function canReference(data, moduleId) {
  return getModuleReferences(data)[moduleId] !== false;
}

/**
 * Dados usados por telas agregadoras (Painel, Assistente, relatórios etc.).
 * A página própria do módulo continua usando os dados completos.
 */
export function getReferenceData(data, ownModule = null) {
  const refs = getModuleReferences(data);
  const source = data || {};
  const next = { ...source };

  const canUse = (moduleId) => moduleId === ownModule || refs[moduleId] !== false;

  if (!canUse('tasks')) {
    next.tasks = [];
    next.areas = [];
  }
  if (!canUse('habits')) next.habits = [];
  if (!canUse('diario')) next.diaryEntries = [];
  if (!canUse('estudos')) {
    next.studySessions = [];
    next.studyCycles = [];
    next.readings = [];
    next.reviews = [];
    next.errors = [];
  }
  if (!canUse('goals')) next.goals = [];
  if (!canUse('projects')) next.projects = [];
  if (!canUse('collections')) next.collections = [];
  if (!canUse('tags')) next.tags = [];
  if (!canUse('calendar')) next.calendarEvents = [];
  if (!canUse('finance')) {
    next.finance = { ...(source.finance || {}), transactions: [] };
  }
  if (!canUse('investments')) {
    next.investments = [];
    next.investmentAssets = [];
  }
  if (!canUse('processos')) next.processes = [];
  if (!canUse('groups')) next.groups = [];
  if (!canUse('connections')) next.connections = [];
  if (!canUse('foguinho')) next.foguinho = [];
  if (!canUse('assistant')) next.assistant = { history: [], notes: [] };
  if (!canUse('evolucao')) {
    next.evolutions = [];
  }
  if (!canUse('gamification')) {
    next.xp = 0;
    next.coins = 0;
    next.gamification = { missions: [], achievements: [], rewards: [], streak: 0 };
  }

  return next;
}

export function getDefaultModuleReferences() {
  return { ...DEFAULT_REFERENCES };
}
