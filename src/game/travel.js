export function getTravelRoute(fromId, toId) {
  const isCoastal = ['fortaleza','porto'].includes(toId);
  return {
    mode: isCoastal ? 'navio' : 'VLT',
    cost: isCoastal ? 35 : 24,
    minutes: isCoastal ? 45 : 28,
  };
}

export function canUnlockTravel(world = {}, fromId, toId) {
  if (!fromId || !toId) return false;
  if (fromId === toId) return true;
  const visited = Array.isArray(world.visitedCities) ? world.visitedCities : [];
  return visited.length === 0 || visited.includes(fromId) || visited.length >= 2;
}
