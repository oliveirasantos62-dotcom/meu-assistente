export function localDateKey(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function weekKey(date = new Date()) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() + 3 - ((copy.getDay() + 6) % 7));
  const weekOne = new Date(copy.getFullYear(), 0, 4);
  const week = 1 + Math.round(((copy - weekOne) / 86400000 - 3 + ((weekOne.getDay() + 6) % 7)) / 7);
  return `${copy.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function createRecurringMissions(stats = {}, today = localDateKey()) {
  return [
    {
      id: `daily-talk-${today}`,
      scope: 'daily',
      title: 'Encontro Comunitário',
      description: 'Converse com um morador hoje.',
      progress: Math.min(1, stats.talkCountToday || 0),
      target: 1,
      reward: { coins: 12, xp: 15 },
    },
    {
      id: `daily-focus-${today}`,
      scope: 'daily',
      title: 'Foco da Aurora',
      description: 'Registre 25 minutos de estudo.',
      progress: Math.min(25, stats.todayStudyMinutes || 0),
      target: 25,
      reward: { coins: 18, xp: 25 },
    },
    {
      id: `weekly-explore-${weekKey()}`,
      scope: 'weekly',
      title: 'Cartógrafo da Cidade',
      description: 'Visite três novos estabelecimentos.',
      progress: Math.min(3, stats.locationsVisited || 0),
      target: 3,
      reward: { coins: 60, xp: 75 },
    },
  ];
}
