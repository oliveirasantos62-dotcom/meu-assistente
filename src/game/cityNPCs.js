export const CITY_NPCS = {
  neolife: [
    { id:'luna', name:'Luna', role:'Estudante de cibernética', home:{x:2,y:3}, work:{x:9,y:2}, routines:['morning','afternoon','sunset','night'] },
    { id:'kai', name:'Kai', role:'Engenheiro urbano', home:{x:4,y:10}, work:{x:4,y:9}, routines:['morning','afternoon','sunset','night'] },
  ],
  fortaleza: [
    { id:'marina', name:'Marina', role:'Capitã comercial', home:{x:2,y:4}, work:{x:15,y:8}, routines:['morning','afternoon','sunset','night'] },
    { id:'bento', name:'Bento', role:'Artesão naval', home:{x:5,y:10}, work:{x:5,y:9}, routines:['morning','afternoon','sunset','night'] },
  ],
  nova: [
    { id:'nova', name:'Nóva', role:'Pesquisadora de IA', home:{x:15,y:2}, work:{x:5,y:9}, routines:['morning','afternoon','sunset','night'] },
  ],
  serra: [
    { id:'orion', name:'Órion', role:'Astrônomo', home:{x:3,y:3}, work:{x:14,y:1}, routines:['morning','afternoon','sunset','night'] },
  ],
  litoral: [
    { id:'sel', name:'Sel', role:'Oceanógrafa', home:{x:3,y:4}, work:{x:15,y:2}, routines:['morning','afternoon','sunset','night'] },
  ],
  porto: [
    { id:'darius', name:'Darius', role:'Operador logístico', home:{x:3,y:4}, work:{x:5,y:9}, routines:['morning','afternoon','sunset','night'] },
  ],
  ilhada: [
    { id:'nami', name:'Nami', role:'Guia sustentável', home:{x:3,y:4}, work:{x:16,y:2}, routines:['morning','afternoon','sunset','night'] },
  ],
};

export function getCityNpcPosition(npc, period, dayIndex = new Date().getDay(), weatherId = 'clear') {
  const phase = period || 'morning';
  const offset = dayIndex % 3;
  if (phase === 'morning') {
    return { ...(npc.home || {x:8,y:6}), activity: 'strolling', label:'Saindo de casa' };
  }
  if (phase === 'afternoon') {
    return { ...(npc.work || {x:8,y:6}), x: (npc.work?.x || 8) + (offset === 0 ? 1 : 0), activity: 'working', label:'Trabalhando' };
  }
  if (phase === 'sunset') {
    return { x: Math.max(1, (npc.work?.x || 8) - 2), y: 5 + offset, activity: weatherId === 'rain' ? 'resting' : 'chatting', label:'Vida comunitária' };
  }
  return { ...(npc.home || {x:8,y:6}), x: Math.max(1, (npc.home?.x || 8) - (offset === 2 ? 1 : 0)), activity:'resting', label:'Em casa' };
}

