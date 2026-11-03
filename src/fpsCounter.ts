export interface FpsCounter {
  sample(elapsedSeconds: number): number | null;
}

export function createFpsCounter(): FpsCounter {
  let frames = 0;
  let elapsed = 0;
  return {
    sample(elapsedSeconds: number): number | null {
      frames++;
      elapsed += elapsedSeconds;
      if (elapsed < 1) return null;
      const fps = frames / elapsed;
      frames = 0;
      elapsed = 0;
      return fps;
    },
  };
}
