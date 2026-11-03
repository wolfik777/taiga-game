import type { World } from './sim/world';
import type { CellPoint, GameCommand } from './sim/commands';

export type { CellPoint, GameCommand } from './sim/commands';

export interface GameCommandQueue {
  enqueue(command: GameCommand): void;
  drain(): GameCommand[];
}

export function createCommandQueue(): GameCommandQueue {
  const commands: GameCommand[] = [];
  return {
    enqueue(command): void { commands.push(command); },
    drain(): GameCommand[] { return commands.splice(0, commands.length); },
  };
}

export interface CanvasBounds {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export function canvasPointToCell(
  clientX: number,
  clientY: number,
  bounds: CanvasBounds,
  worldWidth: number,
  worldHeight: number,
): CellPoint | null {
  if (bounds.width <= 0 || bounds.height <= 0) return null;
  const localX = clientX - bounds.left;
  const localY = clientY - bounds.top;
  if (localX < 0 || localY < 0 || localX >= bounds.width || localY >= bounds.height) return null;
  return {
    x: Math.floor((localX / bounds.width) * worldWidth),
    y: Math.floor((localY / bounds.height) * worldHeight),
  };
}

export interface InputTarget {
  readonly canvas: HTMLCanvasElement;
  readonly world: World;
  readonly enqueue: (command: GameCommand) => void;
}

export function attachInput(target: InputTarget): () => void {
  const { canvas, world, enqueue } = target;
  const onPointerDown = (event: PointerEvent): void => {
    const point = canvasPointToCell(event.clientX, event.clientY, canvas.getBoundingClientRect(), world.width, world.height);
    if (point !== null) enqueue({ type: 'sprinkle-sand', center: point, radius: 2 });
  };
  canvas.addEventListener('pointerdown', onPointerDown);
  return () => canvas.removeEventListener('pointerdown', onPointerDown);
}
