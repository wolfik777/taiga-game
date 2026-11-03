import { Material } from './materials';
import { getCell, setCell, type World } from './world';

function randomFor(seed: number, frame: number, x: number, y: number): number {
  let n = (seed ^ Math.imul(frame + 1, 0x9e3779b1) ^ Math.imul(x + 1, 0x85ebca6b) ^ Math.imul(y + 1, 0xc2b2ae35)) >>> 0;
  n ^= n >>> 16;
  n = Math.imul(n, 0x7feb352d);
  n ^= n >>> 15;
  n = Math.imul(n, 0x846ca68b);
  n ^= n >>> 16;
  return (n >>> 0) / 0x100000000;
}

function move(world: World, x: number, y: number, nx: number, ny: number, material: Material): boolean {
  if (getCell(world, nx, ny) !== Material.EMPTY) return false;
  setCell(world, nx, ny, material);
  setCell(world, x, y, Material.EMPTY);
  return true;
}

export function stepWorld(world: World, frame: number, seed: number): void {
  const leftToRight = (frame & 1) === 0;
  const gasMoves: Array<{ x: number; y: number; toX: number; material: Material }> = [];
  const gasHandled = new Uint8Array(world.width * world.height);
  for (let y = world.height - 1; y >= 0; y--) {
    for (let i = 0; i < world.width; i++) {
      const x = leftToRight ? i : world.width - 1 - i;
      const material = getCell(world, x, y);
      if (gasHandled[y * world.width + x] !== 0) continue;
      if (material === Material.EMPTY || material === Material.STONE || material === Material.EARTH || material === Material.GRASS || material === Material.WOOD || material === Material.FOLIAGE) continue;
      const random = randomFor(seed, frame, x, y);
      const first = random < 0.5 ? -1 : 1;
      if (material === Material.SAND) {
        if (!move(world, x, y, x, y + 1, material)) {
          if (!move(world, x, y, x + first, y + 1, material)) move(world, x, y, x - first, y + 1, material);
        }
      } else if (material === Material.WATER) {
        if (!move(world, x, y, x, y + 1, material)) {
          if (!move(world, x, y, x + first, y + 1, material) && !move(world, x, y, x - first, y + 1, material)) {
            const side = random < 0.5 ? -1 : 1;
            move(world, x, y, x + side, y, material) || move(world, x, y, x - side, y, material);
          }
        }
      } else if (material === Material.SMOKE || material === Material.FIRE) {
        const direction = randomFor(seed, frame, x, y + 1) < 0.5 ? -1 : 1;
        gasMoves.push({ x, y, toX: x + direction, material });
      }
    }
  }
  // Apply gases bottom-to-top; mark destinations to prevent a second move this tick.
  gasMoves.reverse();
  for (const gas of gasMoves) {
    const index = gas.y * world.width + gas.x;
    if (gasHandled[index] !== 0 || getCell(world, gas.x, gas.y) !== gas.material) continue;
    const straight = move(world, gas.x, gas.y, gas.x, gas.y - 1, gas.material);
    const moved = straight || move(world, gas.x, gas.y, gas.toX, gas.y - 1, gas.material);
    if (moved) {
      const movedX = straight ? gas.x : gas.toX;
      gasHandled[(gas.y - 1) * world.width + movedX] = 1;
    }
  }
}
