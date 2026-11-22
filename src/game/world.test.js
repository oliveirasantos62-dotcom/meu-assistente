import { describe, expect, it } from 'vitest';
import { CITIES, getPeriodFromHour, isInsideWorld, isRoadTile } from './world';
import { CITY_MAPS } from './cityMaps';
import { CITY_LAYOUTS } from './cityLayouts';
import { createCollisionChecker, manhattanDistance } from './collision';
import { createRecurringMissions, localDateKey, weekKey } from './questEvents';
import { advanceVehicle, getSignalState } from './traffic';
import { buildNpcReaction, summarizeRealProgress } from './socialReactions';
import { canUnlockTravel } from './travel';
import { createCityResidents } from './cityNPCs';
import { getNpcDialogue, getNpcRoutine } from './npcRoutines';
import {
  collectForageItem,
  createForageNodes,
  FORAGE_CATALOG,
} from './forage';

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
    expect(new Set(CITIES.map((city) => city.mapTag)).size).toBe(7);
    expect(CITIES.find((city) => city.id === 'neolife')?.routes).toContain('fortaleza');
    CITIES.forEach((city) => {
      expect(city.mapPosition.x).toBeGreaterThanOrEqual(0);
      expect(city.mapPosition.x).toBeLessThanOrEqual(100);
      expect(city.mapPosition.y).toBeGreaterThanOrEqual(0);
      expect(city.mapPosition.y).toBeLessThanOrEqual(100);
    });
  });

  it('define mapas físicos distintos e portas acessíveis em cada cidade', () => {
    const signatures = CITIES.map(({ id }) =>
      Array.from({ length: CITY_MAPS[id].height }, (_, y) =>
        Array.from({ length: CITY_MAPS[id].width }, (_, x) =>
          CITY_MAPS[id].getTile(x, y),
        ).join(','),
      ).join(';'),
    );
    expect(new Set(signatures).size).toBe(CITIES.length);

    CITIES.forEach(({ id }) => {
      CITY_LAYOUTS[id].forEach((building) => {
        expect(CITY_MAPS[id].isWaterTile(building.door.x, building.door.y)).toBe(false);
      });
    });
  });

  it('distribui itens coletáveis em áreas caminháveis nas sete cidades', () => {
    CITIES.forEach(({ id }) => {
      const map = CITY_MAPS[id];
      const buildings = CITY_LAYOUTS[id];
      const nodes = createForageNodes(id, map, buildings, [{ x: 7, y: 1 }]);

      expect(nodes).toHaveLength(3);
      nodes.forEach((node) => {
        expect(FORAGE_CATALOG[node.id]).toBeDefined();
        expect(map.isRoadTile(node.x, node.y)).toBe(false);
        expect(map.isWaterTile(node.x, node.y)).toBe(false);
        expect(
          buildings.some(
            (building) =>
              node.x >= building.x &&
              node.x < building.x + building.w &&
              node.y >= building.y &&
              node.y < building.y + building.h,
          ),
        ).toBe(false);
        expect({ x: node.x, y: node.y }).not.toEqual({ x: 7, y: 1 });
      });
    });
  });

  it('guarda coleta no inventário sem apagar o estado de viagem', () => {
    const city = {
      inventory: ['starter-item'],
      collections: { items: ['known-item'], fish: ['fish-1'] },
      world: { cityId: 'fortaleza', mapStates: { fortaleza: { x: 4, y: 6 } } },
    };
    const node = { id: 'sea-glass', nodeId: 'forage-fortaleza-2-2' };
    const collected = collectForageItem(city, node);

    expect(collected.inventory).toEqual(['starter-item', 'sea-glass']);
    expect(collected.collections).toEqual({
      items: ['known-item', 'sea-glass'],
      fish: ['fish-1'],
    });
    expect(collected.world.mapStates).toEqual(city.world.mapStates);
    expect(collectForageItem(collected, node)).toBe(collected);
  });

  it('mantém barcos em água e cais em tiles acessíveis', () => {
    const harborCities = CITIES.filter(({ id }) => CITY_MAPS[id].harbor);
    expect(harborCities).toHaveLength(4);
    harborCities.forEach(({ id }) => {
      const { ship, dock } = CITY_MAPS[id].harbor;
      for (let y = ship.y; y < ship.y + ship.height; y += 1) {
        for (let x = ship.x; x < ship.x + ship.width; x += 1) {
          expect(CITY_MAPS[id].isWaterTile(x, y)).toBe(true);
        }
      }
      expect(CITY_MAPS[id].isWaterTile(dock.x, dock.y)).toBe(false);
    });
  });

  it('cria moradores regionais com rotinas seguras e falas contextuais', () => {
    CITIES.filter(({ id }) => id !== 'neolife').forEach(({ id }) => {
      const residents = createCityResidents(id, CITY_LAYOUTS[id], CITY_MAPS[id]);
      expect(residents.length).toBeGreaterThan(0);
      residents.forEach((resident) => {
        expect(resident.spriteRow).toBeGreaterThanOrEqual(5);
        expect(resident.roamPoints.length).toBeGreaterThan(0);
        Object.values(resident.schedule).forEach((stop) => {
          expect(CITY_MAPS[id].isWaterTile(stop.x, stop.y)).toBe(false);
          expect(
            CITY_LAYOUTS[id].some(
              (building) =>
                stop.x >= building.x &&
                stop.x < building.x + building.w &&
                stop.y >= building.y &&
                stop.y < building.y + building.h,
            ),
          ).toBe(false);
        });
      });
    });

    const marina = createCityResidents(
      'fortaleza',
      CITY_LAYOUTS.fortaleza,
      CITY_MAPS.fortaleza,
    )[0];
    expect(getNpcRoutine(marina, 'afternoon', 1, 'rain').activity).toBe('working');
    expect(getNpcRoutine(marina, 'afternoon', 6, 'clear').activity).toBe('chatting');
    expect(getNpcDialogue(marina, { weatherId: 'rain' })).toBe(marina.weatherDialogue);
  });

  it('bloqueia água e mantém pontes navegáveis', () => {
    const coast = createCollisionChecker({
      water: CITY_MAPS.fortaleza.isWaterTile,
    });
    const islandBridge = createCollisionChecker({
      water: CITY_MAPS.litoral.isWaterTile,
    });
    expect(coast(0, 0)).toBe(false);
    expect(islandBridge(0, 6)).toBe(true);
    expect(CITY_MAPS.litoral.getTile(0, 6)).toBe('bridge');
  });

  it('permite a primeira viagem por uma rota conectada', () => {
    expect(canUnlockTravel({}, 'neolife', 'fortaleza')).toBe(true);
    expect(canUnlockTravel({ visitedCities: ['fortaleza'] }, 'fortaleza', 'porto')).toBe(true);
    expect(canUnlockTravel({}, '', 'porto')).toBe(false);
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
