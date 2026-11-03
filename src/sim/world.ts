import { Material } from './materials';

export interface World {
  readonly width: number;
  readonly height: number;
  readonly cells: Uint8Array;
}

export function createWorld(width: number, height: number): World {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
    throw new RangeError('World dimensions must be positive integers');
  }
  return { width, height, cells: new Uint8Array(width * height) };
}

export function getCell(world: World, x: number, y: number): Material {
  if (x < 0 || y < 0 || x >= world.width || y >= world.height) return Material.STONE;
  return world.cells[y * world.width + x] as Material;
}

export function setCell(world: World, x: number, y: number, material: Material): void {
  if (x < 0 || y < 0 || x >= world.width || y >= world.height) return;
  world.cells[y * world.width + x] = material;
}
