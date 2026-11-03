import './style.css';
import { createWorld } from './sim/world';
import { generateTaiga } from './sim/generator';
import { stepWorld } from './sim/physics';
import { applyGameCommand } from './sim/commands';
import { Material } from './sim/materials';
import { attachInput, createCommandQueue } from './input';
import { createFpsCounter } from './fpsCounter';
import { createGameState } from './gameState';
import { createGameLoop } from './gameLoop';
import { renderFrame } from './render/renderFrame';

const canvasElement = document.querySelector<HTMLCanvasElement>('#game');
const seedElement = document.querySelector<HTMLElement>('#seed-label');
const resetButton = document.querySelector<HTMLButtonElement>('#reset');
if (canvasElement === null || seedElement === null || resetButton === null) {
  throw new Error('Не найдены элементы игры');
}
const canvas: HTMLCanvasElement = canvasElement;
const seedLabel: HTMLElement = seedElement;
const context = canvas.getContext('2d', { alpha: false });
if (context === null) throw new Error('Браузер не поддерживает Canvas 2D');
canvas.width = 256;
canvas.height = 144;
context.imageSmoothingEnabled = false;

const world = createWorld(canvas.width, canvas.height);
const state = createGameState(world, 20261103);
const inputQueue = createCommandQueue();
const fpsCounter = createFpsCounter();

function resetWorld(): void {
  world.cells.fill(Material.EMPTY);
  generateTaiga(world, state.seed);
  seedLabel.textContent = String(state.seed % 10000).padStart(4, '0');
  state.tick = 0;
}

resetWorld();
resetButton.addEventListener('click', () => {
  state.seed = (Math.imul(state.seed, 1664525) + 1013904223) >>> 0;
  resetWorld();
});

const loop = createGameLoop({
  update: () => {
    for (const command of inputQueue.drain()) applyGameCommand(world, command);
    stepWorld(world, state.tick++, state.seed);
  },
  render: (now, elapsedSeconds) => {
    const measuredFps = fpsCounter.sample(elapsedSeconds);
    renderFrame(context, world, now, { fps: measuredFps });
  },
});
attachInput({ canvas, world, enqueue: (command) => inputQueue.enqueue(command) });
loop.start();
