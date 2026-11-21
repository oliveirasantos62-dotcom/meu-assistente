export function getSignalState(totalTicks, index = 0) {
  const phase = Math.floor(totalTicks / 8) % 2;
  const open = index % 2 === 0 ? phase === 0 : phase === 1;
  return open ? 'go' : 'stop';
}

export function advanceVehicle(vehicle) {
  if (vehicle.type === 'drone' || vehicle.type === 'aircar' || vehicle.type === 'helicopter') {
    return { ...vehicle, phase: (vehicle.phase + 2.5) % 100 };
  }
  if (vehicle.lane === 'east' || vehicle.lane === 'bike-east') {
    const nextPos = vehicle.pos + vehicle.speed;
    return { ...vehicle, pos: nextPos > 103 ? -4 : nextPos };
  }
  const nextPos = vehicle.pos - vehicle.speed;
  return { ...vehicle, pos: nextPos < -4 ? 103 : nextPos };
}

