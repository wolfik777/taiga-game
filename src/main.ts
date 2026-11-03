import './style.css';
import { generateTaiga } from './sim/generator';
import { Material } from './sim/materials';
import { stepWorld } from './sim/physics';
import { createWorld, getCell, setCell } from './sim/world';
import { renderScenery } from './render/scenery';

const canvasElement = document.querySelector<HTMLCanvasElement>('#game');
const fpsLabel = document.querySelector<HTMLElement>('#fps');
const seedLabel = document.querySelector<HTMLElement>('#seed-label');
const resetButton = document.querySelector<HTMLButtonElement>('#reset');
if (canvasElement === null) throw new Error('Не найден canvas игры');
if (fpsLabel === null) throw new Error('Не найден счётчик FPS');
if (seedLabel === null) throw new Error('Не найдена метка мира');
if (resetButton === null) throw new Error('Не найдена кнопка нового мира');
const fpsElement: HTMLElement = fpsLabel;
const seedElement: HTMLElement = seedLabel;
const gameCanvas: HTMLCanvasElement = canvasElement;
const context = gameCanvas.getContext('2d', { alpha: false });
if (context === null) throw new Error('Браузер не поддерживает Canvas 2D');
const gameContext: CanvasRenderingContext2D = context;
gameContext.imageSmoothingEnabled = false;

const world = createWorld(256, 144);
let seed = 20261103;
let frame = 0;
function resetWorld(): void {
  world.cells.fill(Material.EMPTY);
  generateTaiga(world, seed);
  seedElement.textContent = String(seed % 10000).padStart(4, '0');
  frame = 0;
}
resetWorld();
resetButton.addEventListener('click', () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; resetWorld(); });

function sprinkle(clientX: number, clientY: number): void {
  const rect = gameCanvas.getBoundingClientRect();
  const x = Math.floor(((clientX - rect.left) / rect.width) * gameCanvas.width / 4);
  const y = Math.floor(((clientY - rect.top) / rect.height) * gameCanvas.height / 4);
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
    if (dx * dx + dy * dy <= 6 && getCell(world, x + dx, y + dy) === Material.EMPTY) setCell(world, x + dx, y + dy, Material.SAND);
  }
}
gameCanvas.addEventListener('pointerdown', (event) => sprinkle(event.clientX, event.clientY));
let painting = false;
gameCanvas.addEventListener('pointerdown', () => { painting = true; });
window.addEventListener('pointerup', () => { painting = false; });
gameCanvas.addEventListener('pointermove', (event) => { if (painting) sprinkle(event.clientX, event.clientY); });

const FIXED_STEP = 1 / 60;
let previous = 0;
let accumulator = 0;
let fpsFrames = 0;
let fpsElapsed = 0;
function loop(now: number): void {
  const elapsed = previous === 0 ? 0 : Math.min((now - previous) / 1000, 0.05);
  previous = now;
  accumulator += elapsed;
  while (accumulator >= FIXED_STEP) {
    stepWorld(world, frame++, seed);
    accumulator -= FIXED_STEP;
  }
  renderScenery(gameContext, world, now);
  fpsFrames++;
  fpsElapsed += elapsed;
  if (fpsElapsed >= 1) {
    fpsElement.textContent = `${Math.round(fpsFrames / fpsElapsed)} FPS`;
    fpsFrames = 0;
    fpsElapsed = 0;
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
