const CITY_FORAGE = Object.freeze({
  neolife: [
    { id: 'neo-berry', name: 'Baga-lume', kind: 'berry', icon: '●' },
    { id: 'signal-bloom', name: 'Flor de Sinal', kind: 'flower', icon: '✿' },
    { id: 'circuit-shard', name: 'Fragmento de Circuito', kind: 'shard', icon: '◆' },
  ],
  fortaleza: [
    { id: 'salt-berry', name: 'Alga de Neon', kind: 'leaf', icon: '♣' },
    { id: 'sea-glass', name: 'Vidro Marinho', kind: 'shard', icon: '◆' },
    { id: 'blue-shell', name: 'Concha Cibernética', kind: 'shell', icon: '◉' },
  ],
  nova: [
    { id: 'sun-fruit', name: 'Fruto Fotossintético', kind: 'berry', icon: '●' },
    { id: 'bio-leaf', name: 'Folha Bioativa', kind: 'leaf', icon: '♣' },
    { id: 'seed-capsule', name: 'Cápsula de Semente', kind: 'flower', icon: '✿' },
  ],
  serra: [
    { id: 'cloud-berry', name: 'Fruto das Dunas', kind: 'berry', icon: '●' },
    { id: 'star-moss', name: 'Musgo Resistente', kind: 'leaf', icon: '♣' },
    { id: 'mineral-chip', name: 'Minério Bruto', kind: 'shard', icon: '◆' },
  ],
  litoral: [
    { id: 'tidal-berry', name: 'Cristal Luminoso', kind: 'shard', icon: '◆' },
    { id: 'lumen-kelp', name: 'Musgo Elétrico', kind: 'leaf', icon: '♣' },
    { id: 'tide-crystal', name: 'Prisma de Energia', kind: 'shard', icon: '◆' },
  ],
  porto: [
    { id: 'brass-gear', name: 'Fragmento Arqueológico', kind: 'shard', icon: '⚙' },
    { id: 'copper-scrap', name: 'Concha Fossilizada', kind: 'shell', icon: '▧' },
    { id: 'salt-bloom', name: 'Orquídea Insular', kind: 'flower', icon: '✿' },
  ],
  ilhada: [
    { id: 'sun-berry', name: 'Flor Aurora', kind: 'flower', icon: '●' },
    { id: 'coral-fragment', name: 'Medalha de Torneio', kind: 'shard', icon: '◆' },
    { id: 'orchid-seed', name: 'Relíquia da Capital', kind: 'flower', icon: '✿' },
  ],
});

export const FORAGE_CATALOG = Object.freeze(
  Object.fromEntries(
    Object.values(CITY_FORAGE)
      .flat()
      .map((item) => [
        item.id,
        Object.freeze({
          ...item,
          category: 'Coletas',
          description: 'Encontrado durante a exploração do mundo.',
        }),
      ]),
  ),
);

const TERRAIN_PRIORITY = Object.freeze({
  forest: 0,
  shore: 1,
  ground: 2,
  plaza: 3,
  industry: 4,
});

const isInsideBuilding = (x, y, buildings) =>
  buildings.some(
    (building) =>
      x >= building.x &&
      x < building.x + building.w &&
      y >= building.y &&
      y < building.y + building.h,
  );

const stableScore = (cityId, x, y) => {
  const citySeed = Array.from(cityId).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );
  return (citySeed * 31 + x * 17 + y * 23) % 97;
};

export function createForageNodes(
  cityId,
  map,
  buildings = [],
  props = [],
  plots = [],
) {
  const items = CITY_FORAGE[cityId];
  if (!items || !map) return [];

  const candidates = [];
  for (let y = 0; y < map.height; y += 1) {
    for (let x = 0; x < map.width; x += 1) {
      const terrain = map.getTile(x, y);
      if (
        !(terrain in TERRAIN_PRIORITY) ||
        map.isRoadTile(x, y) ||
        map.isWaterTile(x, y) ||
        isInsideBuilding(x, y, buildings) ||
        props.some((prop) => prop.x === x && prop.y === y) ||
        plots.some((plot) => plot.x === x && plot.y === y) ||
        Math.abs(x - map.spawn.x) + Math.abs(y - map.spawn.y) < 3
      ) {
        continue;
      }
      candidates.push({
        x,
        y,
        terrain,
        score: stableScore(cityId, x, y),
      });
    }
  }

  candidates.sort(
    (a, b) =>
      TERRAIN_PRIORITY[a.terrain] - TERRAIN_PRIORITY[b.terrain] ||
      a.score - b.score,
  );

  const chosen = [];
  candidates.forEach((candidate) => {
    if (chosen.length >= items.length) return;
    if (
      chosen.some(
        (node) =>
          Math.abs(node.x - candidate.x) + Math.abs(node.y - candidate.y) < 3,
      )
    ) {
      return;
    }
    chosen.push(candidate);
  });

  return chosen.map((position, index) => ({
    ...position,
    ...items[index],
    nodeId: `forage-${cityId}-${position.x}-${position.y}`,
  }));
}

export function collectForageItem(city, node) {
  const world = city.world || {};
  const collectedForage = Array.isArray(world.collectedForage)
    ? world.collectedForage
    : [];
  if (collectedForage.includes(node.nodeId)) return city;

  const collections = city.collections || {};
  const collectedItems = Array.isArray(collections.items)
    ? collections.items
    : [];

  return {
    ...city,
    inventory: [...(Array.isArray(city.inventory) ? city.inventory : []), node.id],
    collections: {
      ...collections,
      items: Array.from(new Set([...collectedItems, node.id])),
    },
    world: {
      ...world,
      collectedForage: [...collectedForage, node.nodeId],
    },
  };
}
