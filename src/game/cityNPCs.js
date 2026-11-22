export const CITY_NPCS = {
  neolife: [
    { id:'luna', name:'Luna', role:'Investigadora de segurança digital', home:{x:2,y:3}, work:{x:9,y:2}, workBuilding:'innovation-lab', focus:'investigation', interest:'mistérios da rede', personality:'curiosa e metódica', dialogues:{morning:'Recebi um sinal estranho vindo dos terminais do centro.',afternoon:'Estou rastreando uma invasão. Cada pista importa.',sunset:'As luzes da Neo-Cidade escondem mais do que mostram.',night:'Se houver outro apagão, procure o terminal de emergência.'}, weekendDialogue:'Hoje vou investigar os arquivos antigos do distrito.', weatherDialogue:'O sistema está instável. Melhor manter os equipamentos protegidos.', storyChapters:[{affinity:20,title:'Sinal Fantasma',text:'Luna encontrou uma transmissão que não pertence a nenhuma rede conhecida.'},{affinity:55,title:'Código de Origem',text:'Ela precisa de ajuda para descobrir quem está por trás das invasões digitais.'}], routines:['morning','afternoon','sunset','night'] },
    { id:'kai', name:'Kai', role:'Comerciante de equipamentos', home:{x:4,y:10}, work:{x:15,y:9}, workBuilding:'neon-market', focus:'commerce', interest:'gadgets e ferramentas', personality:'comunicativo e inventivo', dialogues:{morning:'Chegaram componentes novos para quem gosta de explorar.',afternoon:'Posso montar um kit de investigação com desconto.',sunset:'O mercado fica movimentado quando as luzes acendem.',night:'Fechando a loja. Amanhã chegam novos equipamentos.'}, weekendDialogue:'Hoje estou testando um dispositivo de rastreamento.', weatherDialogue:'Apagão? Tenho lanternas e baterias de emergência.', storyChapters:[{affinity:20,title:'Mercado Noturno',text:'Kai quer ampliar o acesso a equipamentos para todos os moradores.'},{affinity:55,title:'Rede de Confiança',text:'Ele está organizando comerciantes para proteger o distrito durante invasões.'}], routines:['morning','afternoon','sunset','night'] },
  ],
  fortaleza: [
    { id:'marina', name:'Marina', role:'Capitã de balsa', home:{x:2,y:4}, work:{x:15,y:8}, workBuilding:'neon-market', focus:'travel', interest:'rotas marítimas', personality:'prática e acolhedora', dialogues:{morning:'A primeira balsa está quase pronta para partir.',afternoon:'O mercado aquático recebeu espécies registradas nas últimas expedições.',sunset:'O horizonte está bonito, mas precisamos observar as nuvens.',night:'As embarcações estão ancoradas. Travessias só com segurança.'}, weekendDialogue:'Posso mostrar uma rota curta entre os píeres.',weatherDialogue:'Tempestade chegando. Vamos suspender as viagens até passar.',storyChapters:[{affinity:20,title:'Rota Segura',text:'Marina está mapeando trajetos seguros entre as plataformas marítimas.'},{affinity:55,title:'Travessia Comunitária',text:'Ela quer tornar o transporte acessível aos moradores das ilhas.'}],routines:['morning','afternoon','sunset','night'] },
    { id:'bento', name:'Bento', role:'Mecânico naval', home:{x:5,y:10}, work:{x:5,y:9}, workBuilding:'innovation-lab', focus:'crafting', interest:'barcos e motores', personality:'paciente e inventivo', dialogues:{morning:'Estou revisando o motor elétrico da balsa.',afternoon:'Uma peça bem ajustada evita problemas no meio do mar.',sunset:'Hoje terminei um casco resistente às ondas.',night:'A oficina fecha, mas as ideias continuam.'},weekendDialogue:'Vou testar um pequeno barco de exploração.',weatherDialogue:'Com ondas altas, reforço os cabos e espero a maré baixar.',storyChapters:[{affinity:20,title:'Motor de Maré',text:'Bento está adaptando motores para aproveitar a energia das ondas.'},{affinity:55,title:'Frota Azul',text:'Ele quer construir embarcações menores para missões de pesquisa.'}],routines:['morning','afternoon','sunset','night'] },
  ],
  nova: [
    { id:'flora', name:'Flora', role:'Botânica de bioengenharia', home:{x:15,y:2}, work:{x:7,y:3}, workBuilding:'greenhouse', focus:'nature', interest:'plantas adaptativas', personality:'atenta e gentil', dialogues:{morning:'As estufas estão acordando. Hoje vou observar uma nova muda.',afternoon:'Algumas plantas estão reagindo de forma inesperada à luz.',sunset:'O jardim fica mais bonito quando os sensores diminuem.',night:'Deixei as estufas em modo de conservação.'},weekendDialogue:'Vou coletar sementes sem prejudicar as espécies.',weatherDialogue:'A umidade mudou. Precisamos ajustar a irrigação.',storyChapters:[{affinity:20,title:'Semente Estranha',text:'Flora encontrou uma semente com comportamento bioluminescente.'},{affinity:55,title:'Jardim Vivo',text:'Ela quer criar um espaço de cultivo comunitário e biodiversidade.'}],routines:['morning','afternoon','sunset','night'] },
    { id:'caio', name:'Caio', role:'Guardião ambiental', home:{x:4,y:10}, work:{x:5,y:9}, workBuilding:'innovation-lab', focus:'environment', interest:'recuperação de ecossistemas', personality:'calmo e determinado', dialogues:{morning:'Vou verificar os sensores de qualidade do solo.',afternoon:'A área norte precisa de recuperação vegetal.',sunset:'Cada muda plantada ajuda a cidade a respirar.',night:'Os drones de monitoramento estão funcionando.'},weekendDialogue:'Hoje teremos mutirão no jardim comunitário.',weatherDialogue:'A alteração biológica parece estar avançando. Vamos investigar.',storyChapters:[{affinity:20,title:'Solo em Alerta',text:'Caio detectou alterações em uma área próxima às estufas.'},{affinity:55,title:'Corredor Verde',text:'Ele planeja conectar jardins para proteger as criaturas locais.'}],routines:['morning','afternoon','sunset','night'] },
  ],
  serra: [
    { id:'dara', name:'Dara', role:'Engenheira de mineração', home:{x:2,y:3}, work:{x:5,y:9}, workBuilding:'innovation-lab', focus:'mining', interest:'minerais raros', personality:'objetiva e corajosa', dialogues:{morning:'A equipe encontrou um veio mineral perto das dunas.',afternoon:'Use proteção: a areia reduz a visibilidade rapidamente.',sunset:'A temperatura cai e a oficina começa a receber materiais.',night:'As máquinas estão desligadas para manutenção.'},weekendDialogue:'Vou explorar uma área de mineração desativada.',weatherDialogue:'Tempestade de areia! Procure abrigo e não saia da rota marcada.',storyChapters:[{affinity:20,title:'Veio Oculto',text:'Dara encontrou sinais de um depósito mineral ainda não catalogado.'},{affinity:55,title:'Oficina do Deserto',text:'Ela está criando ferramentas resistentes ao calor e à areia.'}],routines:['morning','afternoon','sunset','night'] },
    { id:'rami', name:'Rami', role:'Mecânico de equipamentos', home:{x:15,y:2}, work:{x:15,y:9}, workBuilding:'neon-market', focus:'crafting', interest:'ferramentas e melhorias', personality:'bem-humorado e habilidoso', dialogues:{morning:'Traga peças usadas. Sempre dá para reaproveitar algo.',afternoon:'Terminei uma proteção nova para equipamentos de mineração.',sunset:'A oficina está cheia de projetos para amanhã.',night:'Vou guardar as ferramentas antes que a areia entre em tudo.'},weekendDialogue:'Hoje faço manutenção nos veículos de exploração.',weatherDialogue:'Com esse vento, cubra os mecanismos e espere a areia baixar.',storyChapters:[{affinity:20,title:'Peça por Peça',text:'Rami está recuperando máquinas antigas para reduzir desperdício.'},{affinity:55,title:'Ferramenta de Campo',text:'Ele quer desenvolver um kit para exploração segura das dunas.'}],routines:['morning','afternoon','sunset','night'] },
  ],
  litoral: [
    { id:'iris', name:'Íris', role:'Cientista de energia', home:{x:3,y:4}, work:{x:15,y:2}, workBuilding:'innovation-lab', focus:'science', interest:'cristais energéticos', personality:'brilhante e inquieta', dialogues:{morning:'Os cristais estão emitindo uma frequência diferente.',afternoon:'Precisamos estabilizar o reator antes do próximo teste.',sunset:'A luz atravessa as montanhas e revela novas cores.',night:'O laboratório está em modo de segurança.'},weekendDialogue:'Vou observar as formações cristalinas nas encostas.',weatherDialogue:'A rede está sobrecarregada. Evite tocar nos terminais expostos.',storyChapters:[{affinity:20,title:'Pulso Prisma',text:'Íris identificou uma fonte de energia em uma formação cristalina.'},{affinity:55,title:'Núcleo Estável',text:'Ela busca uma forma segura de distribuir energia para as outras cidades.'}],routines:['morning','afternoon','sunset','night'] },
    { id:'noah', name:'Noah', role:'Pesquisador de campo', home:{x:6,y:10}, work:{x:4,y:3}, workBuilding:'university', focus:'research', interest:'fenômenos elétricos', personality:'observador e paciente', dialogues:{morning:'Vou registrar a atividade elétrica nas encostas.',afternoon:'Os dados indicam uma sobrecarga localizada.',sunset:'O céu daqui parece um prisma.',night:'Os sensores continuam coletando dados.'},weekendDialogue:'Hoje haverá uma visita guiada ao laboratório.',weatherDialogue:'A instabilidade energética exige cautela nas trilhas.',storyChapters:[{affinity:20,title:'Sinais na Montanha',text:'Noah encontrou padrões elétricos que se repetem nas rochas.'},{affinity:55,title:'Rede de Energia',text:'Ele está conectando os laboratórios a uma rede mais resiliente.'}],routines:['morning','afternoon','sunset','night'] },
  ],
  porto: [
    { id:'maya', name:'Maya', role:'Arqueóloga marinha', home:{x:3,y:4}, work:{x:7,y:3}, workBuilding:'university', focus:'exploration', interest:'ruínas e cavernas', personality:'curiosa e respeitosa', dialogues:{morning:'A maré baixa revelou uma entrada na caverna.',afternoon:'Nunca retire um artefato antes de registrar sua posição.',sunset:'As inscrições parecem contar a história de uma antiga expedição.',night:'A área está isolada até a próxima janela de maré.'},weekendDialogue:'Vou mapear uma trilha costeira nova.',weatherDialogue:'Com mar agitado, as cavernas ficam fechadas.',storyChapters:[{affinity:20,title:'Inscrição Submersa',text:'Maya encontrou símbolos em uma câmara costeira.'},{affinity:55,title:'Arquivo de Mirage',text:'Ela quer preservar as descobertas em um museu aberto à comunidade.'}],routines:['morning','afternoon','sunset','night'] },
    { id:'téo', name:'Téo', role:'Biólogo de criaturas raras', home:{x:15,y:2}, work:{x:8,y:10}, workBuilding:'greenhouse', focus:'wildlife', interest:'fauna insular', personality:'cuidadoso e entusiasmado', dialogues:{morning:'Vi rastros perto das piscinas naturais.',afternoon:'Registre a criatura à distância. O habitat vem primeiro.',sunset:'Algumas espécies só aparecem quando a luz diminui.',night:'Os sensores noturnos estão ativos.'},weekendDialogue:'Vou observar a enseada sem interferir na fauna.',weatherDialogue:'A maré está forte. Vamos adiar a observação costeira.',storyChapters:[{affinity:20,title:'Pegadas na Areia',text:'Téo está tentando identificar uma criatura que aparece raramente.'},{affinity:55,title:'Santuário Mirage',text:'Ele quer criar uma área protegida para espécies insulares.'}],routines:['morning','afternoon','sunset','night'] },
  ],
  ilhada: [
    { id:'aurora', name:'Aurora', role:'Coordenadora de missões da capital', home:{x:3,y:4}, work:{x:10,y:6}, workBuilding:'central-hub', focus:'main-quest', interest:'história da cidade', personality:'inspiradora e estratégica', dialogues:{morning:'A capital recebeu notícias de todas as regiões.',afternoon:'Há um desafio novo no centro de torneios.',sunset:'A história desta cidade está ligada às outras seis.',night:'Amanhã começa uma nova etapa da missão principal.'},weekendDialogue:'Hoje teremos um encontro de representantes das regiões.',weatherDialogue:'Mesmo com o clima instável, os eventos globais seguem no abrigo central.',storyChapters:[{affinity:20,title:'Chamado de Aurora',text:'Aurora está reunindo pistas sobre a origem da rede que conecta as cidades.'},{affinity:55,title:'Convergência',text:'Ela prepara uma missão que exigirá cooperação entre todas as regiões.'}],routines:['morning','afternoon','sunset','night'] },
    { id:'enzo', name:'Enzo', role:'Organizador de torneios', home:{x:15,y:2}, work:{x:15,y:9}, workBuilding:'neon-market', focus:'tournaments', interest:'desafios e competições', personality:'competitivo e justo', dialogues:{morning:'As inscrições para o torneio estão abertas.',afternoon:'O desafio de hoje testa estratégia e exploração.',sunset:'A arena está pronta para receber os finalistas.',night:'A classificação será atualizada amanhã.'},weekendDialogue:'Hoje teremos uma competição especial entre distritos.',weatherDialogue:'A etapa externa foi transferida para a arena coberta.',storyChapters:[{affinity:20,title:'Primeiro Desafio',text:'Enzo quer criar torneios acessíveis para jogadores iniciantes.'},{affinity:55,title:'Campeonato Global',text:'Ele está organizando uma competição entre todas as cidades.'}],routines:['morning','afternoon','sunset','night'] },
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
  const isSafe = (point) =>
    Number.isInteger(point?.x) && Number.isInteger(point?.y) &&
    point.x >= 0 && point.y >= 0 && point.x < map.width && point.y < map.height &&
    !map.isWaterTile(point.x, point.y) && !isBuildingTile(point, buildings);
  const findNearbySafe = (origin, seed = 0) => {
    const offsets = [
      [2, 0], [0, 2], [-2, 0], [0, -2], [3, 1], [-3, 1], [1, -3], [-1, 3],
      [4, 0], [0, 4], [-4, 0], [0, -4], [3, -2], [-3, -2], [2, 3], [-2, 3],
    ];
    for (let i = 0; i < offsets.length; i += 1) {
      const [dx, dy] = offsets[(i + seed) % offsets.length];
      const candidate = { x: origin.x + dx, y: origin.y + dy };
      if (isSafe(candidate)) return candidate;
    }
    return { ...origin };
  };

  return (CITY_NPCS[cityId] || []).map((npc, index) => {
    const workBuilding =
      buildings.find((building) => building.id === npc.workBuilding) ||
      buildings.find((building) => !building.isHome);
    const home = getSafeLocation(npc.home, homeDoor, buildings, map);
    const work = getSafeLocation(npc.work, workBuilding?.door || socialPoint, buildings, map);
    const plaza = getSafeLocation(socialPoint, homeDoor, buildings, map);
    const hobbyOrigin = npc.focus === 'nature' || npc.focus === 'environment'
      ? findNearbySafe(plaza, index + 2)
      : npc.focus === 'commerce' || npc.focus === 'tournaments'
        ? findNearbySafe(work, index + 4)
        : findNearbySafe(plaza, index + 6);
    const optionalStop = findNearbySafe(work, index + 8);
    const unique = (points) => points.filter(
      (point, pointIndex, all) => all.findIndex((other) => other.x === point.x && other.y === point.y) === pointIndex,
    );
    const roamPoints = unique([home, work, plaza, hobbyOrigin, optionalStop]);
    const schedule = {
      morning: { ...work, activity: 'commuting', label: `Indo para ${workBuilding?.name || 'o trabalho'}` },
      afternoon: { ...work, activity: 'working', label: workBuilding?.name || 'Local de trabalho' },
      sunset: { ...hobbyOrigin, activity: npc.focus === 'nature' ? 'gardening' : 'relaxing', label: npc.hobbyLabel || 'Cuidando dos próprios interesses' },
      night: { ...home, activity: 'resting', label: 'Em casa, encerrando o dia' },
    };
    return {
      ...npc,
      avatar: npc.name.charAt(0).toUpperCase(),
      district: workBuilding?.district || 'central',
      workBuilding: workBuilding?.id || null,
      home,
      work,
      plaza,
      spriteRow: npc.spriteRow ?? index,
      relations: npc.relations || [],
      storyChapters: npc.storyChapters || [],
      routineSeed: index + cityId.length,
      hobbyPoint: hobbyOrigin,
      hobbyActivity: npc.focus === 'nature' || npc.focus === 'environment' ? 'gardening' : 'relaxing',
      hobbyLabel: npc.focus === 'nature' || npc.focus === 'environment' ? 'Cuidando do jardim' : `Se dedicando a ${npc.interest || 'um interesse pessoal'}`,
      optionalStop,
      optionalStopLabel: npc.focus === 'commerce' ? 'Conferindo entregas e estoques' : 'Resolvendo uma tarefa pessoal',
      roamPoints,
      schedule,
      weekendSchedule: {
        morning: { ...plaza, activity: 'strolling', label: 'Passeio de fim de semana' },
        afternoon: { ...hobbyOrigin, activity: 'relaxing', label: npc.hobbyLabel || 'Tempo livre' },
        sunset: { ...plaza, activity: 'chatting', label: 'Encontro comunitário' },
        night: { ...home, activity: 'resting', label: 'Descansando em casa' },
      },
      weatherSchedule: {
        morning: { ...work, activity: 'commuting', label: 'Indo para um local protegido' },
        afternoon: { ...work, activity: 'working', label: `Abrigo · ${workBuilding?.name || 'trabalho'}` },
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
