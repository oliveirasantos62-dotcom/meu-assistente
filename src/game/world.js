export const WORLD_WIDTH = 20;
export const WORLD_HEIGHT = 12;

export function isInsideWorld(x, y) {
  return x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT;
}

export function clampTile(value, max) {
  return Math.max(0, Math.min(max, value));
}

export function getPeriodFromHour(hour) {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 20) return 'sunset';
  return 'night';
}

export function isRoadTile(x, y) {
  return y === 6 ||
    y === 7 ||
    x === 8 ||
    x === 12 ||
    (y === 5 && x >= 3 && x <= 17) ||
    (y === 10 && x >= 2 && x <= 17) ||
    (x === 5 && y >= 1 && y <= 10) ||
    (x === 15 && y >= 1 && y <= 10);
}

import { CITY_PROFILES } from './cityProfiles';

export const CITIES = CITY_PROFILES;

