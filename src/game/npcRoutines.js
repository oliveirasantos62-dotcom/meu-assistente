export function getNpcRoutine(
  resident,
  period,
  dayIndex = new Date().getDay(),
  weatherId = 'clear',
  hour = null,
) {
  const isWeekend = dayIndex === 0 || dayIndex === 6;
  const isWetWeather = weatherId === 'rain' || weatherId === 'storm';
  const scheduleSet = isWetWeather
    ? resident.weatherSchedule || resident.schedule
    : isWeekend
      ? resident.weekendSchedule || resident.schedule
      : resident.schedule;
  let base = scheduleSet?.[period] || resident.schedule?.[period];

  if (!base) {
    return { x: 8, y: 6, activity: 'strolling', label: 'Explorando o distrito' };
  }

  // Moradores do núcleo principal também ganham passeios diferentes no fim de semana.
  const periodIndex = ['morning', 'afternoon', 'sunset', 'night'].indexOf(period);
  if (isWeekend && !resident.weekendSchedule && resident.roamPoints?.length) {
    const pointIndex = (dayIndex + (resident.spriteRow || 0) + Math.max(0, periodIndex)) % resident.roamPoints.length;
    const weekendPoint = resident.roamPoints[pointIndex];
    base = {
      ...base,
      ...weekendPoint,
      activity: period === 'night' ? 'resting' : period === 'sunset' ? 'chatting' : 'strolling',
      label: period === 'night' ? 'Descansando' : 'Passeio de fim de semana',
    };
  }

  // Pequenas variações por dia fazem a rotina parecer pessoal, sem teletransportar NPCs.
  const variation = (dayIndex + (resident.routineSeed || resident.spriteRow || 0)) % 4;
  const result = { ...base };
  if (period === 'morning' && hour !== null && hour < 8 && resident.home) {
    return { ...result, ...resident.home, activity: 'preparing', label: 'Se preparando para sair' };
  }
  if (period === 'afternoon' && variation === 1 && resident.optionalStop) {
    return { ...result, ...resident.optionalStop, activity: 'errand', label: resident.optionalStopLabel || 'Resolvendo algo pelo distrito' };
  }
  if (period === 'sunset' && variation === 2 && resident.hobbyPoint) {
    return { ...result, ...resident.hobbyPoint, activity: resident.hobbyActivity || 'relaxing', label: resident.hobbyLabel || 'Tempo para si' };
  }
  return result;
}

/** Encontra o próximo tile de um caminho válido usando busca em largura. */
export function getNpcPathStep(start, target, isWalkable, maxVisited = 650) {
  if (!start || !target || (start.x === target.x && start.y === target.y)) return null;
  const key = (point) => `${point.x},${point.y}`;
  const queue = [{ ...start, first: null }];
  const visited = new Set([key(start)]);
  const directions = [
    { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 },
  ];
  let cursor = 0;
  while (cursor < queue.length && visited.size <= maxVisited) {
    const current = queue[cursor++];
    for (const direction of directions) {
      const next = { x: current.x + direction.x, y: current.y + direction.y };
      const nextKey = key(next);
      if (visited.has(nextKey) || !isWalkable(next.x, next.y)) continue;
      const first = current.first || next;
      if (next.x === target.x && next.y === target.y) return first;
      visited.add(nextKey);
      queue.push({ ...next, first });
    }
  }
  return null;
}

export function getNpcMood(resident, context = {}) {
  const { weatherId = 'clear', hour = 12, affinity = 0, energy = 70, social = 50 } = context;
  if (weatherId === 'storm') return { mood: 'cautious', label: 'Cauteloso' };
  if (weatherId === 'rain') return { mood: 'cozy', label: 'Aconchegado' };
  if (energy < 20) return { mood: 'tired', label: 'Cansado' };
  if (social < 20) return { mood: 'quiet', label: 'Mais reservado' };
  if (affinity >= 70) return { mood: 'happy', label: 'Contente em ver você' };
  if (hour >= 18 && hour < 21) return { mood: 'relaxed', label: 'Descontraído' };
  if (resident.personality?.includes('curiosa')) return { mood: 'curious', label: 'Curioso' };
  return { mood: 'focused', label: 'Concentrado' };
}

export function getNpcDailyStatus(hour, dayIndex = new Date().getDay(), weatherId = 'clear') {
  const isWeekend = dayIndex === 0 || dayIndex === 6;
  const isWetWeather = weatherId === 'rain' || weatherId === 'storm';

  if (isWetWeather && hour >= 18) {
    return { activity: 'resting', label: 'Recolhido por causa da chuva' };
  }
  if (isWeekend && hour >= 10 && hour < 18) {
    return { activity: 'chatting', label: 'Aproveitando o fim de semana' };
  }
  if (hour >= 6 && hour < 8) return { activity: 'strolling', label: 'Acordando e se preparando' };
  if (hour >= 8 && hour < 12) return { activity: 'working', label: 'No trabalho' };
  if (hour >= 12 && hour < 14) return { activity: 'chatting', label: 'Almoçando' };
  if (hour >= 14 && hour < 18) return { activity: 'working', label: 'Retornando ao trabalho' };
  if (hour >= 18 && hour < 21) return { activity: 'strolling', label: 'Tempo livre na cidade' };
  return { activity: 'resting', label: 'Voltando para casa' };
}

export function getNpcDialogue(resident, context = {}) {
  const {
    period = 'morning',
    weatherId = 'clear',
    dayIndex = new Date().getDay(),
    activity = 'strolling',
    mood = 'focused',
    goal = '',
    talkCount = 0,
    affinity = 0,
    memory = null,
    cityName = 'NeoLândia',
  } = context;
  const isWeekend = dayIndex === 0 || dayIndex === 6;

  if (talkCount > 1 && memory?.text) {
    return `Ainda estou pensando no que conversamos: ${memory.text} Aqui em ${cityName}, cada encontro deixa uma lembrança boa.`;
  }

  if ((weatherId === 'rain' || weatherId === 'storm') && resident.weatherDialogue) {
    return resident.weatherDialogue;
  }

  const line = isWeekend
    ? resident.weekendDialogue || resident.dialogues?.[period]
    : resident.dialogues?.[period];
  const greeting =
    line ||
    `${resident.name} comenta sobre ${resident.interest || 'a vida na cidade'} enquanto está ${activity}.`;
  const moodLines = {
    cautious: 'Hoje estou mais atento ao que acontece ao redor.',
    cozy: 'Com esse clima, prefiro um ritmo mais tranquilo.',
    tired: 'O dia foi longo; vou precisar descansar um pouco.',
    quiet: 'Estou precisando de um momento mais reservado.',
    happy: 'Estou de bom humor. É sempre bom encontrar alguém conhecido.',
    relaxed: 'Finalmente consegui um tempo para respirar.',
    curious: 'Tem alguma coisa nova acontecendo por aqui. Quero investigar.',
  };
  const stateLine = moodLines[mood] || '';
  const goalLine = goal && activity !== 'resting' ? `Agora estou: ${goal.toLowerCase()}.` : '';
  const friendship =
    affinity >= 55
      ? 'Que bom ter você por perto; já conhecemos bem os ritmos um do outro.'
      : '';
  return [greeting, stateLine, goalLine, friendship].filter(Boolean).join(' ');
}
