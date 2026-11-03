import { Material } from './materials';
import { getCell, setCell, type World } from './world';

export interface CellPoint {
  readonly x: number;
  readonly y: number;
}

export type GameCommand =
  | { readonly type: 'sprinkle-sand'; readonly center: CellPoint; readonly radius: number };

export function applyGameCommand(world: World, command: GameCommand): void {
  switch (command.type) {
    case 'sprinkle-sand': {
      const { center, radius } = command;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx * dx + dy * dy <= radius * radius && getCell(world, center.x + dx, center.y + dy) === Material.EMPTY) {
            setCell(world, center.x + dx, center.y + dy, Material.SAND);
          }
        }
      }
      break;
    }
  }
}
