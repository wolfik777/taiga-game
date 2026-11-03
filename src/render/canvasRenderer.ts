import { MATERIAL_PROPS, Material } from '../sim/materials';
import type { World } from '../sim/world';

export const CELL_SIZE = 4;
const PALETTE = new Map<Material, string>(Object.entries(MATERIAL_PROPS).map(([id, props]) => [Number(id) as Material, props.color]));

export function renderWorld(context: CanvasRenderingContext2D, world: World): void {
  const columns = Math.min(world.width, Math.ceil(context.canvas.width / CELL_SIZE));
  const rows = Math.min(world.height, Math.ceil(context.canvas.height / CELL_SIZE));
  context.fillStyle = '#aab5a8';
  context.fillRect(0, 0, context.canvas.width, context.canvas.height);
  for (let y = 0; y < rows; y++) {
    let x = 0;
    while (x < columns) {
      const material = world.cells[y * world.width + x] as Material;
      if (material === Material.EMPTY) { x++; continue; }
      let end = x + 1;
      while (end < columns && world.cells[y * world.width + end] === material) end++;
      context.fillStyle = PALETTE.get(material) ?? '#ff00ff';
      context.fillRect(x * CELL_SIZE, y * CELL_SIZE, (end - x) * CELL_SIZE, CELL_SIZE);
      x = end;
    }
  }
}
