import { isInsideWorld } from './world';

export function tileKey(x, y) {
  return `${x}:${y}`;
}

export function createCollisionChecker({ buildings = [], props = [], water = () => false } = {}) {
  return (x, y, occupants = []) => {
    if (!isInsideWorld(x, y) || water(x, y)) return false;
    if (buildings.some((building) =>
      x >= building.x &&
      x < building.x + building.w &&
      y >= building.y &&
      y < building.y + building.h
    )) return false;
    if (props.some((prop) => prop.solid && prop.x === x && prop.y === y)) return false;
    if (occupants.some((actor) => actor.x === x && actor.y === y)) return false;
    return true;
  };
}

export function manhattanDistance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

