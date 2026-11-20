import { describe, expect, it } from 'vitest';
import { CITIES, getPeriodFromHour, isInsideWorld, isRoadTile } from './world';
import { createCollisionChecker, manhattanDistance } from './collision';
import { createRecurringMissions, localDateKey, weekKey } from './questEvents';
import { advanceVehicle, getSignalState } from './traffic';
import { buildNpcReaction, summarizeRealProgress } from './socialReactions';

describe('NeoLifeCity world systems', () => {
  it('classifica horários do ciclo diário', () => {
    expect(getPeriodFromHour(7)).toBe('morning');
    expect(getPeriodFromHour(14)).toBe('afternoon');
    expect(getPeriodFromHour(18)).toBe('sunset');
    expect(getPeriodFromHour(22)).toBe('night');
  });

  it('impede saída dos limites e colisão com prédio', () => {
    expect(isInsideWorld(-1, 5)).toBe(false);
    const canOccupy = createCollisionChecker({
      buildings: [{ x: 2, y: 2, w: 3, h: 2 }],
      props: [],
      water: () => false,
    });
    expect(canOccupy(3, 2)).toBe(false);
    expect(canOccupy(8, 8)).toBe(true);
  });

  it('calcula distâncias e identifica ruas', () => {
    expect(manhattanDistance({ x: 2, y: 3 }, { x: 5, y: 6 })).toBe(6);
    expect(isRoadTile(8, 4)).toBe(true);
  });

  it('expõe as sete cidades do Estado de NeoLândia', () => {
    expect(CITIES).toHaveLength(7);
    expect(new Set(CITIES.map((city) => city.id)).size).toBe(7);
    expect(CITIES.find((city) => city.id === 'neolife')?.routes).toContain('fortaleza');
  });

  it('gera missões diárias e semanais com datas estáveis', () => {
    const missions = createRecurringMissions(
      { talkCountToday: 1, todayStudyMinutes: 25, locationsVisited: 3 },
      '2026-11-20',
    );
    expect(missions).toHaveLength(3);
    expect(missions[0].scope).toBe('daily');
    expect(missions[2].scope).toBe('weekly');
    expect(localDateKey(new Date(2026, 10, 20))).toBe('2026-11-20');
    expect(weekKey(new Date(2026, 10, 20))).toMatch(/^\d{4}-W\d{2}$/);
  });

  it('movimenta veículos e alterna semáforos', () => {
    const vehicle = { type: 'car', lane: 'east', pos: 12, speed: 2 };
    expect(advanceVehicle(vehicle).pos).toBe(14);
    expect(getSignalState(0, 0)).toBe('go');
    expect(getSignalState(8, 0)).toBe('stop');
  });

  it('gera reações sociais apenas a partir de progresso real positivo', () => {
    const changes = summarizeRealProgress(
      { tasks: 2, habits: 1, studyMinutes: 20 },
      { tasks: 3, habits: 2, studyMinutes: 45 },
    );
    expect(changes.tasks).toBe(1);
    expect(changes.habits).toBe(1);
    expect(changes.studyMinutes).toBe(25);
    expect(buildNpcReaction('habit', 'nox')).toContain('constância');
  });
});
