import type { World } from './sim/world';

export interface GameState {
  readonly world: World;
  seed: number;
  tick: number;
}

export function createGameState(world: World, seed: number): GameState {
  return { world, seed: seed >>> 0, tick: 0 };
}
