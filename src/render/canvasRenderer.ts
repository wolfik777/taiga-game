import { MATERIAL_PROPS, Material } from '../sim/materials';
import type { World } from '../sim/world';

const PALETTE = new Map<Material, string>(Object.entries(MATERIAL_PROPS).map(([id, props]) => [Number(id) as Material, props.color]));

export function renderWorld(context: CanvasRenderingContext2D, world: World): void {
  for (let y = 0; y < world.height; y++) {
    const row = y * world.width;
    for (let x = 0; x < world.width; x++) {
      const material = world.cells[row + x] as Material;
      if (material === Material.EMPTY) continue;
      context.fillStyle = PALETTE.get(material) ?? '#ff00ff';
      context.fillRect(x, y, 1, 1);
    }
  }
}
