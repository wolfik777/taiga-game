import type { World } from '../sim/world';
import { renderBackground } from './backgroundRenderer';
import { renderWorld } from './canvasRenderer';
import { renderEntities } from './entitiesRenderer';
import { renderEffects } from './effectsRenderer';
import { renderUi, type UiFrame } from './uiRenderer';

export interface RenderLayers {
  readonly entities?: (context: CanvasRenderingContext2D, world: World) => void;
  readonly effects?: (context: CanvasRenderingContext2D, world: World, now: number) => void;
}

export function renderFrame(
  context: CanvasRenderingContext2D,
  world: World,
  now: number,
  ui: UiFrame,
  layers: RenderLayers = {},
): void {
  renderBackground(context, context.canvas.width, context.canvas.height);
  renderWorld(context, world);
  renderEntities(context, world);
  layers.entities?.(context, world);
  renderEffects(context, world, now);
  layers.effects?.(context, world, now);
  renderUi(context, ui);
}
