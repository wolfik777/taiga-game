export function renderBackground(context: CanvasRenderingContext2D, width: number, height: number): void {
  const sky = context.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#a9bbc4');
  sky.addColorStop(0.52, '#c0c4bb');
  sky.addColorStop(1, '#d2c6aa');
  context.fillStyle = sky;
  context.fillRect(0, 0, width, height);
}
