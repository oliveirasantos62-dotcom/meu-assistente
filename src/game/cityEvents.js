export const CITY_EVENTS_BY_PROFILE = {
  neolife: [
    { id: 'blackout-investigation', name: 'Apagão na Neo-Cidade', description: 'Investigue a falha na rede e recupere os terminais do distrito.', reward: 'Créditos e componentes digitais', xp: 40 },
    { id: 'digital-invasion', name: 'Invasão de Sinal', description: 'Defenda os sistemas comerciais contra uma invasão.', reward: 'Módulos de segurança', xp: 55 },
  ],
  fortaleza: [
    { id: 'storm-crossing', name: 'Tempestade no Porto', description: 'Ajude a organizar travessias seguras durante a tempestade.', reward: 'Peças náuticas e reputação', xp: 45 },
    { id: 'aquatic-market', name: 'Feira das Profundezas', description: 'Negocie descobertas e criaturas aquáticas de forma responsável.', reward: 'Créditos marítimos', xp: 35 },
  ],
  nova: [
    { id: 'bio-mutation', name: 'Alerta de Mutação', description: 'Investigue uma alteração nas espécies da estufa.', reward: 'Sementes bioativas', xp: 45 },
    { id: 'greenhouse-day', name: 'Dia das Estufas', description: 'Ajude moradores a recuperar os jardins tecnológicos.', reward: 'Recursos de cultivo', xp: 35 },
  ],
  serra: [
    { id: 'sandstorm', name: 'Tempestade de Areia', description: 'Proteja a oficina e encontre a equipe de mineração.', reward: 'Minérios raros', xp: 50 },
    { id: 'deep-mining', name: 'Veio Perdido', description: 'Mapeie uma nova área de extração.', reward: 'Materiais industriais', xp: 40 },
  ],
  litoral: [
    { id: 'energy-overload', name: 'Sobrecarga Prisma', description: 'Estabilize os laboratórios antes que a rede entre em colapso.', reward: 'Cristais de energia', xp: 55 },
    { id: 'science-open-day', name: 'Circuito Científico', description: 'Participe de desafios de pesquisa e experimentação.', reward: 'Componentes experimentais', xp: 40 },
  ],
  porto: [
    { id: 'mirage-tide', name: 'Maré de Mirage', description: 'Explore cavernas costeiras liberadas pela maré baixa.', reward: 'Fragmentos arqueológicos', xp: 50 },
    { id: 'rare-creature', name: 'Rastro Raro', description: 'Registre uma criatura rara sem perturbar seu habitat.', reward: 'Registro de biodiversidade', xp: 45 },
  ],
  ilhada: [
    { id: 'aurora-tournament', name: 'Torneio de Aurora', description: 'Enfrente desafios especiais na capital.', reward: 'Medalha e créditos', xp: 60 },
    { id: 'global-summit', name: 'Cúpula Global', description: 'Participe de uma missão que conecta todas as regiões.', reward: 'Insígnia da capital', xp: 70 },
  ],
};

export function getCitySpecialEvent(cityId) {
  return CITY_EVENTS_BY_PROFILE[cityId]?.[0] || CITY_EVENTS_BY_PROFILE.neolife[0];
}
