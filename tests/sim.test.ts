import { describe, expect, it } from 'vitest';
import { Material } from '../src/sim/materials';
import { createWorld, getCell, setCell } from '../src/sim/world';
import { generateTaiga } from '../src/sim/generator';
import { stepWorld } from '../src/sim/physics';

describe('world grid', () => {
  it('returns stone outside the world and safely ignores out-of-bounds writes', () => {
    const world = createWorld(4, 4);
    expect(getCell(world, -1, 0)).toBe(Material.STONE);
    setCell(world, 4, 2, Material.SAND);
    expect(getCell(world, 3, 2)).toBe(Material.EMPTY);
  });
});

describe('taiga generator', () => {
  it('creates one grass surface cell in every column', () => {
    const world = createWorld(256, 144);
    generateTaiga(world, 1234);
    for (let x = 0; x < world.width; x++) {
      let grass = 0;
      for (let y = 0; y < world.height; y++) if (getCell(world, x, y) === Material.GRASS) grass++;
      expect(grass).toBe(1);
    }
  });

  it('is deterministic for the same seed', () => {
    const a = createWorld(256, 144);
    const b = createWorld(256, 144);
    generateTaiga(a, 765);
    generateTaiga(b, 765);
    expect(a.cells).toEqual(b.cells);
  });
});

describe('particle simulation', () => {
  it('moves sand down into an empty cell', () => {
    const world = createWorld(8, 8);
    setCell(world, 3, 2, Material.SAND);
    stepWorld(world, 0, 1);
    expect(getCell(world, 3, 3)).toBe(Material.SAND);
    expect(getCell(world, 3, 2)).toBe(Material.EMPTY);
  });

  it('spreads water along a floor', () => {
    const world = createWorld(8, 8);
    for (let x = 0; x < 8; x++) setCell(world, x, 7, Material.STONE);
    setCell(world, 4, 6, Material.WATER);
    stepWorld(world, 0, 10);
    expect([...world.cells].filter((id) => id === Material.WATER).length).toBe(1);
    expect(getCell(world, 4, 6)).toBe(Material.WATER);
  });

  it('moves smoke upward', () => {
    const world = createWorld(8, 8);
    setCell(world, 3, 4, Material.SMOKE);
    stepWorld(world, 0, 1);
    expect([...world.cells].filter((id) => id === Material.SMOKE)).toHaveLength(1);
    const smokeY = world.cells.findIndex((id) => id === Material.SMOKE) / world.width;
    expect(smokeY).toBeLessThan(4);
  });

  it('is deterministic for equal worlds, seeds and steps', () => {
    const a = createWorld(16, 16);
    const b = createWorld(16, 16);
    for (let x = 2; x < 14; x++) { setCell(a, x, 14, Material.STONE); setCell(b, x, 14, Material.STONE); }
    setCell(a, 7, 2, Material.SAND); setCell(b, 7, 2, Material.SAND);
    for (let frame = 0; frame < 8; frame++) { stepWorld(a, frame, 2026); stepWorld(b, frame, 2026); }
    expect(a.cells).toEqual(b.cells);
  });
});
