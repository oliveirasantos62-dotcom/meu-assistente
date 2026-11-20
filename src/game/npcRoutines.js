export function getNpcRoutine(resident, period, dayIndex = new Date().getDay()) {
  const base = resident.schedule?.[period];
  if (!base) return { x: 8, y: 6, activity: 'strolling', label: 'Praça Central' };

  const offset = dayIndex % 3;
  if (period === 'afternoon' && resident.id === 'luna') {
    return { ...base, x: base.x + (offset === 0 ? 1 : 0), activity: 'working' };
  }
  if (period === 'night' && resident.id === 'nox') {
    return { ...base, x: Math.max(1, base.x - offset), activity: 'resting' };
  }
  if (period === 'sunset' && offset === 2) {
    return { ...base, x: base.x + 1, activity: 'chatting' };
  }
  return base;
}

export function getNpcDailyStatus(hour) {
  if (hour >= 6 && hour < 8) return { activity: 'strolling', label: 'Acordando e se preparando' };
  if (hour >= 8 && hour < 12) return { activity: 'working', label: 'No trabalho' };
  if (hour >= 12 && hour < 14) return { activity: 'chatting', label: 'Almoçando' };
  if (hour >= 14 && hour < 18) return { activity: 'working', label: 'Retornando ao trabalho' };
  if (hour >= 18 && hour < 21) return { activity: 'strolling', label: 'Tempo livre na cidade' };
  return { activity: 'resting', label: 'Voltando para casa' };
}
