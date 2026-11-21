export const CITY_EVENTS_BY_PROFILE = {
  neolife: [
    { id:'capital-night', name:'Noite da Capital', reward:'Iluminação estadual intensificada', xp:30 },
  ],
  fortaleza: [
    { id:'sailors-week', name:'Semana dos Marinheiros', reward:'Mercadorias costeiras em promoção', xp:35 },
  ],
  nova: [
    { id:'innovation-fair', name:'Feira da Inovação', reward:'Protótipos com bônus de XP', xp:40 },
  ],
  serra: [
    { id:'knowledge-eclipse', name:'Eclipse do Conhecimento', reward:'Sessões de estudo com bônus', xp:45 },
  ],
  litoral: [
    { id:'stellar-tide', name:'Maré Estelar', reward:'Oportunidades de exploração oceânica', xp:50 },
  ],
  porto: [
    { id:'golden-cargo', name:'Carga Dourada', reward:'Peças industriais em oferta', xp:35 },
  ],
  ilhada: [
    { id:'solar-bloom', name:'Florada Solar das Ilhas', reward:'Recompensas sustentáveis ampliadas', xp:40 },
  ],
};

export function getCitySpecialEvent(cityId) {
  return CITY_EVENTS_BY_PROFILE[cityId]?.[0] || CITY_EVENTS_BY_PROFILE.neolife[0];
}

