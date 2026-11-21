export function getTravelRoute(fromId, toId) {
  const isCoastal = ['fortaleza','porto','ilhada','litoral'].includes(toId);
  return {
    mode: isCoastal ? 'navio' : 'VLT',
    cost: isCoastal ? 35 : 24,
    minutes: isCoastal ? 45 : 28,
  };
}

export function canUnlockTravel(world = {}, fromId, toId) {
  if (!fromId || !toId) return false;
  const visited = Array.isArray(world.visitedCities) ? world.visitedCities : [];
  return fromId === toId || visited.includes(fromId) || visited.length >= 2;
}
