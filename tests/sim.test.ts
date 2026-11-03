import { describe, expect, it } from 'vitest';
import { Material } from '../src/sim/materials';
import { createWorld, getCell, setCell } from '../src/sim/world';
import { generateTaiga } from '../src/sim/generator';
import { stepWorld } from '../src/sim/physics';
import { canvasPointToCell } from '../src/input';
import { renderWorld } from '../src/render/canvasRenderer';

describe('canvas-to-world coordinates', () => {
  const bounds = { left: 10, top: 20, width: 1024, height: 576 };

  it('maps the canvas top-left to cell 0,0', () => {
    expect(canvasPointToCell(10, 20, bounds, 256, 144)).toEqual({ x: 0, y: 0 });
  });

  it('maps the inclusive bottom-right pixel to cell 255,143', () => {
    expect(canvasPointToCell(1033.999, 595.999, bounds, 256, 144)).toEqual({ x: 255, y: 143 });
  });

  it('rejects points outside the displayed canvas', () => {
    expect(canvasPointToCell(1034, 596, bounds, 256, 144)).toBeNull();
  });

  it('includes the world right and bottom edges in the rendered area', () => {
    const world = createWorld(256, 144);
    setCell(world, 255, 143, Material.SAND);
    const drawn: Array<{ x: number; y: number; color: string }> = [];
    const context = {
      canvas: { width: 256, height: 144 },
      fillStyle: '',
      save(): void {},
      restore(): void {},
      fillRect: function (this: { fillStyle: string }, x: number, y: number): void { drawn.push({ x, y, color: this.fillStyle }); },
    } as unknown as CanvasRenderingContext2D;

    renderWorld(context, world);

    expect(drawn.some((cell) => cell.x === 255 && cell.y === 143 && cell.color === '#d7b873')).toBe(true);
  });
});

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
