export const NPC_REACTION_PROFILES = Object.freeze({
  luna: {
    study: 'Luna viu você dedicar tempo ao conhecimento e abriu uma nova conversa acadêmica.',
    reading: 'Luna percebeu uma nova leitura no seu acervo e comentou o tema com você.',
  },
  kai: {
    task: 'Kai viu uma tarefa real sair do planejamento e preparou uma nova ideia de projeto.',
    project: 'Kai celebrou o avanço do seu projeto e reagiu com mais confiança.',
  },
  nox: {
    habit: 'Nox notou sua constância e ofereceu um ciclo botânico mais curto e equilibrado.',
  },
  maya: {
    goal: 'Maya viu uma meta concluída e abriu uma oportunidade especial no Mercado Neon.',
  },
});

export function buildNpcReaction(kind, residentId) {
  const profile = NPC_REACTION_PROFILES[residentId] || {};
  return profile[kind] || 'Um morador registrou o progresso real da cidade na memória da comunidade.';
}

export function summarizeRealProgress(previous = {}, current = {}) {
  const changes = {};
  [
    'tasks',
    'studyMinutes',
    'habits',
    'readings',
    'goals',
    'projects',
    'projectProgress',
  ].forEach((key) => {
    const before = Number(previous[key]) || 0;
    const after = Number(current[key]) || 0;
    changes[key] = Math.max(0, after - before);
  });
  return changes;
}
