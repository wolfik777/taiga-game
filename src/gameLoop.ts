export const FIXED_STEP = 1 / 60;

export interface GameLoopCallbacks {
  readonly update: (step: number) => void;
  readonly render: (now: number, elapsedSeconds: number) => void;
}

export interface GameLoop {
  start(): void;
  stop(): void;
}

export function createGameLoop(callbacks: GameLoopCallbacks): GameLoop {
  let running = false;
  let previous = 0;
  let accumulator = 0;
  let requestId = 0;

  const frame = (now: number): void => {
    if (!running) return;
    const elapsed = previous === 0 ? 0 : Math.min((now - previous) / 1000, 0.05);
    previous = now;
    accumulator += elapsed;
    while (accumulator >= FIXED_STEP) {
      callbacks.update(FIXED_STEP);
      accumulator -= FIXED_STEP;
    }
    callbacks.render(now, elapsed);
    requestId = requestAnimationFrame(frame);
  };

  return {
    start(): void {
      if (running) return;
      running = true;
      previous = 0;
      requestId = requestAnimationFrame(frame);
    },
    stop(): void {
      running = false;
      cancelAnimationFrame(requestId);
    },
  };
}
