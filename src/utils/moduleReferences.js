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
export function getReferenceData(data) {
  const refs = getModuleReferences(data);
  const source = data || {};
  const next = { ...source };

  if (refs.tasks === false) next.tasks = [];
  if (refs.habits === false) next.habits = [];
  if (refs.diario === false) next.diaryEntries = [];
  if (refs.estudos === false) {
    next.studySessions = [];
    next.studyCycles = [];
    next.readings = [];
    next.reviews = [];
    next.errors = [];
  }
  if (refs.goals === false) next.goals = [];
  if (refs.projects === false) next.projects = [];
  if (refs.collections === false) next.collections = [];
  if (refs.tags === false) next.tags = [];
  if (refs.calendar === false) next.calendarEvents = [];
  if (refs.finance === false) {
    next.finance = { ...(source.finance || {}), transactions: [] };
  }
  if (refs.investments === false) {
    next.investments = [];
    next.investmentAssets = [];
  }
  if (refs.processos === false) next.processes = [];
  if (refs.groups === false) next.groups = [];
  if (refs.connections === false) next.connections = [];
  if (refs.foguinho === false) next.foguinho = [];
  if (refs.assistant === false) next.assistant = { history: [], notes: [] };

  return next;
}

export function getDefaultModuleReferences() {
  return { ...DEFAULT_REFERENCES };
}
