import type { CellPoint } from './input';

/** Converts world-cell coordinates into canvas-cell coordinates. */
export interface Camera {
  worldToScreen(point: CellPoint): CellPoint;
  screenToWorld(point: CellPoint): CellPoint;
}

/** Initial camera is intentionally stationary; scrolling can be added behind this boundary. */
export function createCamera(): Camera {
  return {
    worldToScreen: (point) => point,
    screenToWorld: (point) => point,
  };
}
