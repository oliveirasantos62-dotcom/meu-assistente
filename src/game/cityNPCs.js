export const CITY_NPCS = {
  neolife: [
    { id:'luna', name:'Luna', role:'Estudante de cibernética', home:{x:2,y:3}, work:{x:9,y:2}, routines:['morning','afternoon','sunset','night'] },
    { id:'kai', name:'Kai', role:'Engenheiro urbano', home:{x:4,y:10}, work:{x:4,y:9}, routines:['morning','afternoon','sunset','night'] },
  ],
  fortaleza: [
    {
      id:'marina', name:'Marina', role:'Capitã comercial', home:{x:2,y:4}, work:{x:15,y:8},
      workBuilding:'neon-market', spriteRow:5, focus:'commerce', interest:'as rotas costeiras',
      personality:'prática e acolhedora',
      dialogues:{
        morning:'O primeiro ferry sai quando o céu clareia. Gosto de ver a cidade acordando pelo cais.',
        afternoon:'Estou conferindo as encomendas da feira. Cada ilha tem um produto que conta sua história.',
        sunset:'No fim do expediente, observo as luzes do porto e planejo a próxima travessia.',
        night:'O cais fica mais calmo à noite; ainda assim, deixo uma lanterna acesa para quem chega.',
      },
      weekendDialogue:'Hoje trabalho sem pressa. Se tiver tempo, quero lhe mostrar a enseada protegida.',
      weatherDialogue:'Com esse tempo, prefiro manter as embarcações no abrigo. O mar merece respeito.',
      relations:[{ targetId:'bento', label:'Parceria no cais', bond:82 }],
      storyChapters:[
        { affinity:20, title:'Mapas de Maré', text:'Marina guarda mapas feitos à mão para ajudar viajantes a encontrar enseadas seguras.' },
        { affinity:55, title:'Uma Rota para Todos', text:'Ela quer transformar o antigo ferry em uma rota comunitária acessível às pequenas ilhas.' },
      ],
      routines:['morning','afternoon','sunset','night'],
    },
    {
      id:'bento', name:'Bento', role:'Artesão naval', home:{x:5,y:10}, work:{x:5,y:9},
      workBuilding:'innovation-lab', spriteRow:6, focus:'projects', interest:'consertos e barcos',
      personality:'paciente e inventivo',
      dialogues:{
        morning:'Começo o dia conferindo cada rebite. Um casco bem cuidado deixa todo mundo viajar tranquilo.',
        afternoon:'Estou ajustando um leme solar. Pequenos reparos evitam grandes problemas no mar.',
        sunset:'Gosto de guardar as ferramentas e ouvir as histórias de quem acabou de chegar.',
        night:'A oficina descansa comigo, mas amanhã termino aquele projeto de navegação.',
      },
      weekendDialogue:'Hoje fecho a oficina mais cedo. Vou testar um modelo leve perto do farol.',
      weatherDialogue:'Chuva é hora de revisar as juntas e proteger a madeira; o trabalho também sabe esperar.',
      relations:[{ targetId:'marina', label:'Parceria no cais', bond:82 }],
      storyChapters:[
        { affinity:20, title:'O Primeiro Convés', text:'Bento aprendeu a trabalhar com madeira observando as embarcações antigas do porto.' },
        { affinity:55, title:'Madeira e Sol', text:'Ele está projetando um pequeno barco solar para levar ferramentas às comunidades costeiras.' },
      ],
      routines:['morning','afternoon','sunset','night'],
    },
  ],
  nova: [
    {
      id:'nova', name:'Nóva', role:'Pesquisadora de IA', home:{x:15,y:2}, work:{x:5,y:9},
      workBuilding:'innovation-lab', spriteRow:7, focus:'study', interest:'inteligência artificial',
      personality:'curiosa e metódica',
      dialogues:{
        morning:'Antes de abrir as simulações, gosto de observar como a luz muda nas estufas solares.',
        afternoon:'Estou comparando hipóteses, não pessoas. Aqui, uma boa pergunta vale mais que uma resposta rápida.',
        sunset:'O laboratório fica bonito quando os painéis começam a refletir o entardecer.',
        night:'Anotei a ideia para amanhã. Descansar também faz parte de uma pesquisa cuidadosa.',
      },
      weekendDialogue:'Hoje deixei as simulações para depois. Estou explorando os caminhos verdes do vale.',
      weatherDialogue:'A chuva altera os sensores externos, então estou trabalhando com os dados já registrados.',
      storyChapters:[
        { affinity:20, title:'Perguntas Melhores', text:'Nóva começou sua pesquisa tentando ensinar sistemas a fazer perguntas mais cuidadosas.' },
        { affinity:55, title:'Dados com Consentimento', text:'Seu próximo projeto só usa medições autorizadas e deixa as pessoas decidirem o que compartilhar.' },
      ],
      routines:['morning','afternoon','sunset','night'],
    },
  ],
  serra: [
    {
      id:'orion', name:'Órion', role:'Astrônomo', home:{x:3,y:3}, work:{x:14,y:1},
      workBuilding:'university', spriteRow:8, focus:'study', interest:'astronomia e observação',
      personality:'sereno e contemplativo',
      dialogues:{
        morning:'A névoa ainda cobre as trilhas. Vou registrar o céu quando ela se abrir.',
        afternoon:'Estou calibrando o observatório; cada ajuste melhora a próxima leitura.',
        sunset:'Esse é meu horário favorito: a serra fica violeta antes das primeiras estrelas.',
        night:'Encontrei uma constelação nova no mapa local. Quer olhar comigo depois?',
      },
      weekendDialogue:'Hoje não há aula nem palestra. Vou deixar o telescópio aberto para quem passar.',
      weatherDialogue:'Com nuvens baixas, troco o telescópio pelo arquivo de mapas celestes.',
      storyChapters:[
        { affinity:20, title:'Céu de Inverno', text:'Órion começou a observar o céu em noites frias, usando um telescópio emprestado do instituto.' },
        { affinity:55, title:'Observatório Aberto', text:'Ele sonha em manter o mirante aberto para qualquer morador curioso, sem exigir conhecimento prévio.' },
      ],
      routines:['morning','afternoon','sunset','night'],
    },
  ],
  litoral: [
    {
      id:'sel', name:'Sel', role:'Oceanógrafa', home:{x:3,y:4}, work:{x:15,y:2},
      workBuilding:'innovation-lab', spriteRow:9, focus:'projects', interest:'vida marinha',
      personality:'atenta e otimista',
      dialogues:{
        morning:'Estou verificando a maré antes de liberar os sensores. O oceano sempre dá sinais.',
        afternoon:'Os recifes estão mais ativos hoje. Anoto tudo sem interferir no habitat.',
        sunset:'A aurora começa cedo aqui; gosto de acompanhar a mudança de cor na água.',
        night:'Deixei os instrumentos em monitoramento. Agora o mar precisa de silêncio.',
      },
      weekendDialogue:'Hoje faço uma caminhada curta pela praia e recolho apenas dados, nunca lembranças do recife.',
      weatherDialogue:'Com a chuva, adio a saída para o mar e reviso as medições no laboratório.',
      storyChapters:[
        { affinity:20, title:'Ouvindo o Recife', text:'Sel aprendeu a reconhecer mudanças na água antes de elas aparecerem nos instrumentos.' },
        { affinity:55, title:'Refúgio Azul', text:'Ela está preparando uma área de proteção marinha construída com os pescadores locais.' },
      ],
      routines:['morning','afternoon','sunset','night'],
    },
  ],
  porto: [
    {
      id:'darius', name:'Darius', role:'Operador logístico', home:{x:3,y:4}, work:{x:5,y:9},
      workBuilding:'innovation-lab', spriteRow:10, focus:'tasks', interest:'logística e manutenção',
      personality:'direto e confiável',
      dialogues:{
        morning:'Já organizei as partidas do turno. Um porto eficiente também precisa de pausas bem marcadas.',
        afternoon:'Estou conferindo a carga por região para evitar viagens desnecessárias.',
        sunset:'O guindaste solar encerra o dia em silêncio. É meu sinal para fechar a planilha.',
        night:'Tudo seguro no cais. Amanhã volto cedo para abrir as rotas.',
      },
      weekendDialogue:'No fim de semana, só acompanho o essencial. O porto também precisa respirar.',
      weatherDialogue:'Com nevoeiro, diminuímos o ritmo e priorizamos a segurança dos trabalhadores.',
      storyChapters:[
        { affinity:20, title:'Rotas Seguras', text:'Darius aprendeu a planejar rotas observando como as equipes se ajudam durante as mudanças de turno.' },
        { affinity:55, title:'Carga Compartilhada', text:'Ele está reorganizando as entregas para que oficinas menores também recebam materiais a tempo.' },
      ],
      routines:['morning','afternoon','sunset','night'],
    },
  ],
  ilhada: [
    {
      id:'nami', name:'Nami', role:'Guia sustentável', home:{x:3,y:4}, work:{x:16,y:2},
      workBuilding:'greenhouse', spriteRow:11, focus:'habits', interest:'trilhas e conservação',
      personality:'alegre e cuidadosa',
      dialogues:{
        morning:'Antes da trilha, confiro água e sinalização. Cuidar do grupo vem antes de chegar rápido.',
        afternoon:'Os visitantes estão aprendendo a observar sem deixar marcas. Esse é o melhor passeio.',
        sunset:'A lagoa fica dourada no fim da tarde. É um bom lugar para agradecer pelo dia.',
        night:'A mata fica mais tranquila quando as luzes diminuem. Vou recolher os últimos materiais.',
      },
      weekendDialogue:'Hoje guio um passeio pequeno pela costa. Vamos no ritmo de quem está caminhando.',
      weatherDialogue:'Com monção, mudamos a rota e ficamos perto do abrigo. A natureza dita o caminho.',
      storyChapters:[
        { affinity:20, title:'Trilha Sem Marcas', text:'Nami criou um guia de caminhada que ensina a observar a ilha sem deixar rastros.' },
        { affinity:55, title:'A Lagoa Compartilhada', text:'Ela está reunindo moradores para proteger os caminhos que ligam a lagoa às casas da ilha.' },
      ],
      routines:['morning','afternoon','sunset','night'],
    },
  ],
};

function isBuildingTile(position, buildings) {
  return buildings.some(
    (building) =>
      position.x >= building.x &&
      position.x < building.x + building.w &&
      position.y >= building.y &&
      position.y < building.y + building.h,
  );
}

function getSafeLocation(candidate, fallback, buildings, map) {
  const isSafe = (position) =>
    Number.isInteger(position?.x) &&
    Number.isInteger(position?.y) &&
    position.x >= 0 &&
    position.y >= 0 &&
    position.x < map.width &&
    position.y < map.height &&
    !map.isWaterTile(position.x, position.y) &&
    !isBuildingTile(position, buildings);

  if (isSafe(candidate)) return { x: candidate.x, y: candidate.y };
  if (isSafe(fallback)) return { x: fallback.x, y: fallback.y };
  return { ...map.spawn };
}

export function createCityResidents(cityId, buildings, map) {
  if (cityId === 'neolife' || !map) return [];

  const homeBuilding = buildings.find((building) => building.isHome);
  const homeDoor = homeBuilding?.door || map.spawn;
  const socialPoint = map.spawn;

  return (CITY_NPCS[cityId] || []).map((npc, index) => {
    const workBuilding =
      buildings.find((building) => building.id === npc.workBuilding) ||
      buildings.find((building) => !building.isHome);
    const home = getSafeLocation(npc.home, homeDoor, buildings, map);
    const work = getSafeLocation(npc.work, workBuilding?.door || socialPoint, buildings, map);
    const plaza = getSafeLocation(socialPoint, homeDoor, buildings, map);
    const roamPoints = [home, work, plaza].filter(
      (point, pointIndex, points) =>
        points.findIndex((other) => other.x === point.x && other.y === point.y) === pointIndex,
    );
    const schedule = {
      morning: { ...home, activity: 'strolling', label: 'Saindo de casa' },
      afternoon: {
        ...work,
        activity: 'working',
        label: workBuilding?.name || 'Local de trabalho',
      },
      sunset: { ...plaza, activity: 'chatting', label: 'Praça da cidade' },
      night: { ...home, activity: 'resting', label: 'Voltando para casa' },
    };

    return {
      ...npc,
      avatar: npc.name.charAt(0).toUpperCase(),
      district: workBuilding?.district || 'central',
      workBuilding: workBuilding?.id || null,
      spriteRow: npc.spriteRow ?? index,
      relations: npc.relations || [],
      storyChapters: npc.storyChapters || [],
      roamPoints,
      schedule,
      weekendSchedule: {
        morning: { ...plaza, activity: 'strolling', label: 'Passeio de fim de semana' },
        afternoon: { ...plaza, activity: 'chatting', label: 'Encontro comunitário' },
        sunset: { ...plaza, activity: 'chatting', label: 'Praça ao entardecer' },
        night: { ...home, activity: 'resting', label: 'Descansando em casa' },
      },
      weatherSchedule: {
        morning: { ...home, activity: 'resting', label: 'Aguardando o tempo melhorar' },
        afternoon: {
          ...work,
          activity: 'working',
          label: `Abrigo · ${workBuilding?.name || 'trabalho'}`,
        },
        sunset: { ...home, activity: 'resting', label: 'Voltando para um local coberto' },
        night: { ...home, activity: 'resting', label: 'Em casa por causa do clima' },
      },
    };
  });
}

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
