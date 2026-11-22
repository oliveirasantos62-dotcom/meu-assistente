import { WORLD_HEIGHT, WORLD_WIDTH } from './world';

const keyOf = (x, y) => `${x}:${y}`;

function addRect(target, [left, top, right, bottom]) {
  for (let y = top; y <= bottom; y += 1) {
    for (let x = left; x <= right; x += 1) target.add(keyOf(x, y));
  }
}

function addPath(target, points) {
  for (let i = 1; i < points.length; i += 1) {
    const [startX, startY] = points[i - 1];
    const [endX, endY] = points[i];
    const stepX = Math.sign(endX - startX);
    const stepY = Math.sign(endY - startY);
    if (stepX && stepY) throw new Error('City map paths must be orthogonal.');
    let x = startX;
    let y = startY;
    target.add(keyOf(x, y));
    while (x !== endX || y !== endY) {
      x += stepX;
      y += stepY;
      target.add(keyOf(x, y));
    }
  }
}

function createMap(definition) {
  const roads = new Set();
  definition.roads.forEach((path) => addPath(roads, path));

  const features = {};
  Object.entries(definition.features).forEach(([name, rectangles]) => {
    const cells = new Set();
    rectangles.forEach((rect) => addRect(cells, rect));
    features[name] = cells;
  });

  const water = features.water || new Set();
  const landmarks = definition.landmarks;

  return Object.freeze({
    width: WORLD_WIDTH,
    height: WORLD_HEIGHT,
    spawn: Object.freeze(definition.spawn),
    harbor: definition.harbor
      ? Object.freeze({
          name: definition.harbor.name,
          ship: Object.freeze({ ...definition.harbor.ship }),
          dock: Object.freeze({ ...definition.harbor.dock }),
        })
      : null,
    roads,
    landmarks: Object.freeze(landmarks),
    isRoadTile: (x, y) => roads.has(keyOf(x, y)),
    isWaterTile: (x, y) => water.has(keyOf(x, y)) && !roads.has(keyOf(x, y)),
    getTile(x, y) {
      const key = keyOf(x, y);
      if (x < 0 || y < 0 || x >= WORLD_WIDTH || y >= WORLD_HEIGHT) return 'void';
      if (water.has(key)) return roads.has(key) ? 'bridge' : 'water';
      if (roads.has(key)) return 'road';
      if (features.mountain?.has(key)) return 'mountain';
      if (features.shore?.has(key)) return 'shore';
      if (features.forest?.has(key)) return 'forest';
      if (features.plaza?.has(key)) return 'plaza';
      if (features.industry?.has(key)) return 'industry';
      return 'ground';
    },
  });
}

const definitions = {
  neolife: {
    spawn: { x: 7, y: 6 },
    roads: [
      [[0, 6], [19, 6]], [[8, 0], [8, 11]], [[12, 0], [12, 11]],
      [[2, 10], [17, 10]], [[9, 2], [9, 6]], [[15, 5], [15, 10]],
      [[4, 8], [4, 10]],
    ],
    features: {
      water: [[0, 0, 1, 2], [18, 9, 19, 11]],
      plaza: [[9, 5, 11, 7], [5, 2, 6, 3]],
      forest: [[0, 8, 2, 11], [17, 1, 19, 3]],
    },
    landmarks: [{ id: 'pulse-garden', name: 'Praça dos Terminais', x: 6, y: 3, kind: 'garden' }],
  },
  fortaleza: {
    spawn: { x: 10, y: 6 },
    harbor: {
      name: 'Balsa Maré Azul',
      ship: { x: 0, y: 1, width: 2, height: 3, orientation: 'vertical' },
      dock: { x: 2, y: 5 },
    },
    roads: [
      [[0, 6], [19, 6]], [[9, 4], [9, 11]], [[3, 4], [3, 6]],
      [[3, 8], [15, 8]], [[5, 8], [5, 10]], [[15, 8], [15, 10]],
      [[10, 6], [10, 8]],
    ],
    features: {
      water: [[0, 0, 1, 5], [18, 0, 19, 4], [17, 9, 19, 11]],
      shore: [[2, 0, 3, 5], [16, 0, 17, 4], [15, 9, 16, 11]],
      plaza: [[10, 5, 12, 7]],
      forest: [[4, 1, 5, 2], [11, 1, 13, 2]],
    },
    landmarks: [{ id: 'cybernetic-lighthouse', name: 'Farol Cibernético', x: 2, y: 1, kind: 'lighthouse' }],
  },
  nova: {
    spawn: { x: 10, y: 6 },
    roads: [
      [[0, 6], [19, 6]], [[9, 0], [9, 11]], [[3, 4], [3, 6]],
      [[5, 6], [5, 10]], [[14, 3], [14, 6]], [[14, 6], [15, 6]],
      [[15, 6], [15, 10]],
    ],
    features: {
      water: [[18, 0, 19, 11], [0, 10, 2, 11]],
      shore: [[17, 0, 17, 11]],
      plaza: [[10, 5, 12, 7], [6, 2, 7, 3]],
      forest: [[0, 0, 1, 4], [4, 1, 6, 2], [12, 8, 17, 9]],
    },
    landmarks: [{ id: 'bio-greenhouse', name: 'Estufa Bioluminescente', x: 6, y: 2, kind: 'garden' }],
  },
  serra: {
    spawn: { x: 10, y: 6 },
    roads: [
      [[0, 6], [19, 6]], [[3, 3], [3, 6]], [[10, 6], [10, 9]],
      [[14, 2], [14, 6]], [[14, 6], [16, 6]], [[16, 6], [16, 10]],
      [[9, 8], [16, 8]],
    ],
    features: {
      mountain: [[0, 0, 5, 2], [16, 0, 19, 4], [0, 9, 3, 11]],
      forest: [[5, 0, 7, 3], [1, 7, 3, 8], [17, 8, 19, 11]],
      plaza: [[10, 5, 12, 7]],
      shore: [[6, 10, 8, 11]],
    },
    landmarks: [{ id: 'desert-oasis', name: 'Oásis das Dunas', x: 7, y: 4, kind: 'observatory' }],
  },
  litoral: {
    spawn: { x: 10, y: 6 },
    harbor: {
      name: 'Ferry Aurora',
      ship: { x: 0, y: 3, width: 2, height: 3, orientation: 'vertical' },
      dock: { x: 2, y: 5 },
    },
    roads: [
      [[0, 6], [17, 6]], [[9, 0], [9, 11]], [[3, 4], [3, 6]],
      [[14, 3], [14, 6]], [[14, 6], [15, 6]], [[15, 6], [15, 10]],
      [[10, 8], [15, 8]],
    ],
    features: {
      water: [[0, 0, 1, 11], [18, 0, 19, 11], [2, 10, 4, 11]],
      shore: [[2, 0, 2, 9], [17, 0, 17, 11], [3, 9, 4, 9]],
      plaza: [[10, 5, 12, 7]],
      forest: [[4, 1, 6, 3], [5, 8, 7, 10]],
    },
    landmarks: [{ id: 'prism-energy-core', name: 'Núcleo de Energia Prisma', x: 16, y: 4, kind: 'buoy' }],
  },
  porto: {
    spawn: { x: 10, y: 6 },
    harbor: {
      name: 'Balsa Mirage',
      ship: { x: 17, y: 0, width: 3, height: 2, orientation: 'horizontal' },
      dock: { x: 16, y: 4 },
    },
    roads: [
      [[0, 6], [19, 6]], [[9, 0], [9, 11]], [[3, 4], [3, 6]],
      [[5, 6], [5, 10]], [[10, 8], [15, 8]], [[15, 8], [15, 10]],
      [[4, 10], [15, 10]],
    ],
    features: {
      water: [[0, 8, 2, 11], [17, 0, 19, 2]],
      shore: [[3, 8, 4, 11], [16, 0, 17, 7]],
      forest: [[10, 1, 13, 3], [6, 8, 10, 9], [16, 8, 18, 10]],
      plaza: [[10, 5, 11, 7]],
    },
    landmarks: [{ id: 'mirage-ruins', name: 'Ruínas da Enseada', x: 17, y: 4, kind: 'crane' }],
  },
  ilhada: {
    spawn: { x: 10, y: 6 },
    harbor: {
      name: 'Balsa das Ilhas',
      ship: { x: 0, y: 4, width: 2, height: 4, orientation: 'vertical' },
      dock: { x: 2, y: 6 },
    },
    roads: [
      [[2, 6], [17, 6]], [[9, 4], [9, 6]], [[10, 6], [10, 10]],
      [[3, 4], [3, 6]], [[15, 3], [15, 6]], [[15, 6], [15, 10]],
      [[9, 8], [15, 8]],
    ],
    features: {
      water: [[0, 0, 1, 11], [18, 0, 19, 11], [6, 0, 7, 4], [12, 0, 13, 2], [3, 10, 5, 11]],
      shore: [[2, 0, 2, 11], [17, 0, 17, 11], [8, 0, 8, 3], [14, 0, 14, 2], [5, 9, 7, 11]],
      forest: [[4, 0, 5, 2], [10, 0, 11, 2], [2, 8, 5, 9], [16, 8, 17, 9]],
      plaza: [[9, 5, 11, 7]],
    },
    landmarks: [{ id: 'aurora-plaza', name: 'Praça da Capital', x: 4, y: 3, kind: 'lagoon' }],
  },
};

export const CITY_MAPS = Object.freeze(
  Object.fromEntries(
    Object.entries(definitions).map(([cityId, definition]) => [
      cityId,
      createMap(definition),
    ]),
  ),
);
