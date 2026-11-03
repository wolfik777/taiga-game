import { Material } from './materials';
import { setCell, type World } from './world';

function randomFrom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

export function generateTaiga(world: World, seed: number): void {
  const random = randomFrom(seed);
  // Keep terrain variation smooth and deterministic, with three modest noise octaves.
  const noiseSalt = random();
  const lattice = (n: number): number => {
    let h = (n + Math.floor(noiseSalt * 0x7fffffff)) | 0;
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    h ^= h >>> 16;
    return (h >>> 0) / 0xffffffff;
  };
  const noise = (x: number, spacing: number): number => {
    const i = Math.floor(x / spacing);
    const t = (x / spacing) - i;
    const u = t * t * (3 - 2 * t);
    return lattice(i) + (lattice(i + 1) - lattice(i)) * u;
  };
  const surface: number[] = [];
  for (let x = 0; x < world.width; x++) {
    const detail = (noise(x, 16) - 0.5) * 5 + (noise(x, 40) - 0.5) * 12 + (noise(x, 96) - 0.5) * 7;
    const groundY = Math.max(12, Math.min(world.height - 12, Math.round(world.height * 0.60 + detail)));
    surface.push(groundY);
    for (let y = groundY; y < world.height; y++) {
      const depth = y - groundY;
      setCell(world, x, y, depth === 0 ? Material.GRASS : depth <= 2 + (x % 3) ? Material.EARTH : Material.STONE);
    }
  }

  for (let x = 4; x < world.width - 4; x++) {
    const top = surface[x];
    if (random() < 1 / 40) {
      const trunkHeight = 5 + Math.floor(random() * 5);
      for (let dy = 1; dy <= trunkHeight; dy++) setCell(world, x, top - dy, Material.WOOD);
      const crownY = top - trunkHeight;
      for (let dy = -3; dy <= 3; dy++) {
        const halfWidth = 4 - Math.abs(dy);
        for (let dx = -halfWidth; dx <= halfWidth; dx++) {
          if (Math.abs(dx) + Math.abs(dy) <= 5 && getEmptyOrFoliage(world, x + dx, crownY + dy)) {
            setCell(world, x + dx, crownY + dy, Material.FOLIAGE);
          }
        }
      }
    }
    if (random() < 1 / 60) {
      setCell(world, x, top - 1, Material.STONE);
      if (random() < 0.35) setCell(world, x + 1, top - 1, Material.STONE);
    }
  }
}

function getEmptyOrFoliage(world: World, x: number, y: number): boolean {
  if (x < 0 || x >= world.width || y < 0 || y >= world.height) return false;
  const cell = world.cells[y * world.width + x];
  return cell === Material.EMPTY || cell === Material.FOLIAGE;
}
