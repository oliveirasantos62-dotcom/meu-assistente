export function getNpcRoutine(
  resident,
  period,
  dayIndex = new Date().getDay(),
  weatherId = 'clear',
) {
  const isWeekend = dayIndex === 0 || dayIndex === 6;
  const isWetWeather = weatherId === 'rain' || weatherId === 'storm';
  const base = isWetWeather
    ? resident.weatherSchedule?.[period] || resident.schedule?.[period]
    : isWeekend
      ? resident.weekendSchedule?.[period] || resident.schedule?.[period]
      : resident.schedule?.[period];

  if (!base) {
    return { x: 8, y: 6, activity: 'strolling', label: 'Praça Central' };
  }

  const offset = dayIndex % 3;
  if (period === 'afternoon' && resident.id === 'luna') {
    return { ...base, x: base.x + (offset === 0 ? 1 : 0), activity: 'working' };
  }
  if (period === 'night' && resident.id === 'nox') {
    return { ...base, x: Math.max(1, base.x - offset), activity: 'resting' };
  }
  if (period === 'sunset' && offset === 2 && !resident.weekendSchedule?.sunset) {
    return { ...base, x: base.x + 1, activity: 'chatting' };
  }
  return base;
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
  const friendship =
    affinity >= 55
      ? 'Que bom ter você por perto; já conhecemos bem os ritmos um do outro.'
      : '';
  return [greeting, friendship].filter(Boolean).join(' ');
}
