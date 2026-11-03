export interface UiFrame {
  readonly fps: number | null;
}

export function renderUi(context: CanvasRenderingContext2D, frame: UiFrame): void {
  if (frame.fps === null) return;
  context.save();
  context.font = '6px monospace';
  context.textAlign = 'right';
  context.textBaseline = 'top';
  context.fillStyle = '#f4f3e8';
  context.fillText(`${Math.round(frame.fps)} FPS`, context.canvas.width - 3, 3);
  context.restore();
}
