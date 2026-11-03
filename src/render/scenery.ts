import type { World } from '../sim/world';

export interface SceneryState {
  readonly time: number;
  readonly snow: readonly Snowflake[];
}
interface Snowflake { x: number; y: number; speed: number; sway: number; phase: number }
interface Tree { x: number; y: number; height: number; width: number; hue: number; fir: boolean }

let initialized = false;
let snowflakes: Snowflake[] = [];
let trees: Tree[] = [];
let hills: number[][] = [];
let previousTime = 0;
let sceneTime = 0;

function hash(n: number): number {
  let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967295;
}

function ensureScene(): void {
  if (initialized) return;
  initialized = true;
  trees = [];
  for (let i = 0; i < 140; i++) {
    const x = hash(i * 7 + 2) * 1100 - 60;
    const y = 360 + hash(i * 7 + 3) * 145;
    trees.push({ x, y, height: 24 + hash(i * 7 + 4) * 65, width: 12 + hash(i * 7 + 5) * 24, hue: hash(i * 7 + 6), fir: hash(i * 7 + 1) < 0.72 });
  }
  hills = [[], [], []];
  for (let layer = 0; layer < 3; layer++) {
    for (let x = 0; x <= 1100; x += 24) {
      const envelope = hash(layer * 1000 + x) * 20 - 10;
      hills[layer].push(118 + layer * 70 + envelope);
    }
  }
  snowflakes = Array.from({ length: 72 }, (_, i) => ({ x: hash(i * 11 + 2) * 960, y: hash(i * 11 + 3) * 540, speed: 12 + hash(i * 11 + 4) * 25, sway: 5 + hash(i * 11 + 5) * 13, phase: hash(i * 11 + 6) * Math.PI * 2 }));
}

function polygon(ctx: CanvasRenderingContext2D, points: readonly [number, number][], fill: string): void {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawMountains(ctx: CanvasRenderingContext2D, width: number, height: number, offset: number, parallax: number, color: string, peakSize: number, seed: number): void {
  const shift = offset * parallax;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-100, height);
  let x = -100;
  let i = 0;
  while (x < width + 100) {
    const center = x + peakSize * (0.45 + hash(seed + i * 5) * 0.45) - shift % peakSize;
    const peak = 82 + hash(seed + i * 13) * 105;
    ctx.lineTo(center - peakSize * 0.62, height - peak * 0.58);
    ctx.lineTo(center, height - peak);
    ctx.lineTo(center + peakSize * 0.62, height - peak * 0.55);
    x += peakSize;
    i++;
  }
  ctx.lineTo(width + 120, height);
  ctx.closePath(); ctx.fill();
  // Soft, broken snow-caps catch the cold sky light.
  ctx.globalAlpha = 0.56;
  for (let n = 0; n < i; n++) {
    const center = n * peakSize + peakSize * (0.45 + hash(seed + n * 5) * 0.45) - shift % peakSize - 100;
    const peak = 82 + hash(seed + n * 13) * 105;
    polygon(ctx, [[center - 17, height - peak + 23], [center, height - peak], [center + 15, height - peak + 25], [center + 3, height - peak + 18], [center - 5, height - peak + 26]], '#d5dce0');
  }
  ctx.globalAlpha = 1;
}

function drawForest(ctx: CanvasRenderingContext2D, width: number, ground: number, parallax: number, offset: number, far: boolean): void {
  const scale = far ? 0.52 : 1;
  const spacing = far ? 29 : 38;
  const shift = offset * parallax;
  for (let i = -2; i < Math.ceil(width / spacing) + 3; i++) {
    const seed = i + (far ? 800 : 100);
    const x = i * spacing - (shift % spacing);
    const h = (far ? 42 : 72) + hash(seed * 13 + 4) * (far ? 40 : 74);
    const w = (far ? 13 : 22) + hash(seed * 13 + 8) * (far ? 14 : 24);
    const autumn = hash(seed * 13 + 9) > (far ? 0.82 : 0.69);
    const color = autumn ? (far ? '#879087' : '#a85f3e') : (far ? '#52645e' : '#2c463c');
    const trunk = far ? '#59615a' : '#493f34';
    ctx.fillStyle = trunk; ctx.fillRect(x - 2 * scale, ground - 5 * scale, 4 * scale, 8 * scale);
    if (autumn) {
      polygon(ctx, [[x, ground-h], [x-w*.58,ground-h*.58], [x-w*.28,ground-h*.62], [x-w,ground-h*.26], [x-w*.35,ground-h*.33], [x-w*.78,ground-h*.06], [x+w*.76,ground-h*.06], [x+w*.32,ground-h*.34], [x+w,ground-h*.27], [x+w*.38,ground-h*.62], [x+w*.62,ground-h*.58]], color);
      ctx.fillStyle = '#cb8b56'; ctx.fillRect(x - 2*scale, ground-h*.55, 4*scale, 3*scale);
    } else {
      polygon(ctx, [[x, ground-h], [x-w*.45,ground-h*.58], [x-w*.2,ground-h*.62], [x-w*.75,ground-h*.34], [x-w*.35,ground-h*.36], [x-w,ground-h*.08], [x+w,ground-h*.08], [x+w*.34,ground-h*.36], [x+w*.75,ground-h*.34], [x+w*.2,ground-h*.62], [x+w*.45,ground-h*.58]], color);
      ctx.fillStyle = far ? '#819087' : '#637568'; ctx.fillRect(x - 2*scale, ground-h*.43, 3*scale, 5*scale);
    }
  }
}

function drawGround(ctx: CanvasRenderingContext2D, world: World, width: number, height: number, offset: number): void {
  const cell = width / world.width;
  const startX = Math.max(0, Math.floor(offset / cell));
  const endX = Math.min(world.width, Math.ceil((offset + width) / cell));
  let surface = 0;
  for (let x = startX; x < endX; x++) {
    for (let y = 0; y < world.height; y++) {
      const id = world.cells[y * world.width + x];
      if (id !== 0) { surface = y; break; }
    }
    const sx = x * cell - offset;
    const top = surface * cell;
    const jitter = (hash(x * 43 + 9) - 0.5) * cell * 0.75;
    ctx.fillStyle = '#657b55';
    ctx.fillRect(sx, top + jitter, cell + 1, Math.max(0, height - top));
    ctx.fillStyle = '#9da371';
    ctx.fillRect(sx, top + jitter, cell + 1, Math.max(2, cell * 0.55));
    const specks = 1 + Math.floor(hash(x * 19 + 1) * 3);
    for (let k = 0; k < specks; k++) {
      const py = top + cell * (1 + hash(x * 61 + k) * 7);
      ctx.fillStyle = ['#795c42','#8a704d','#52614a'][Math.floor(hash(x * 31 + k) * 3)];
      ctx.fillRect(sx + hash(x*47+k)*cell, py, 1.5, 1.5);
    }
  }
  ctx.fillStyle = '#53644b'; ctx.fillRect(0, height - 5, width, 5);
}

function drawCampfire(ctx: CanvasRenderingContext2D, time: number, width: number, height: number): void {
  const x = width * 0.29;
  const y = height * 0.635;
  const flicker = Math.sin(time * 8) * 2;
  const glow = ctx.createRadialGradient(x, y, 2, x, y, 58);
  glow.addColorStop(0, '#f3a65b38'); glow.addColorStop(1, '#f3a65b00');
  ctx.fillStyle = glow; ctx.fillRect(x-58,y-58,116,116);
  ctx.fillStyle='#493c32'; ctx.fillRect(x-17,y+4,35,5); ctx.fillRect(x-13,y,27,5);
  polygon(ctx, [[x,y-24-flicker],[x-8,y-10],[x-5,y-2],[x+3,y-7],[x+7,y-18],[x+12,y-6],[x+8,y+3],[x-8,y+4],[x-12,y-4]], '#e88442');
  polygon(ctx, [[x+1,y-16-flicker*.6],[x-4,y-6],[x,y],[x+5,y-5]], '#ffd48a');
  for (let i=0;i<4;i++) {
    const drift=Math.sin(time*1.3+i*2.3)*8;
    const sy=y-29-i*17-(time*15%17);
    ctx.globalAlpha=.44-i*.07; ctx.fillStyle='#c0c4bd';
    ctx.beginPath();ctx.arc(x+drift,sy,2+i*.8,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;
}

function drawSnow(ctx: CanvasRenderingContext2D, width: number, height: number, dt: number): void {
  for (const flake of snowflakes) {
    flake.y += flake.speed * dt;
    flake.x += Math.sin(sceneTime * 1.2 + flake.phase) * flake.sway * dt;
    if (flake.y > height) { flake.y = -3; flake.x = hash(Math.floor(sceneTime*17+flake.phase*100))*width; }
    if (flake.x < 0) flake.x = width; else if (flake.x > width) flake.x = 0;
    ctx.globalAlpha = 0.3 + flake.speed / 65;
    ctx.fillStyle = '#e6f1f0';
    ctx.fillRect(Math.round(flake.x), Math.round(flake.y), flake.speed > 28 ? 2 : 1, flake.speed > 28 ? 2 : 1);
  }
  ctx.globalAlpha = 1;
}

export function renderScenery(context: CanvasRenderingContext2D, world: World, now: number): void {
  ensureScene();
  const width = context.canvas.width;
  const height = context.canvas.height;
  const dt = previousTime === 0 ? 0 : Math.min((now - previousTime) / 1000, 0.05);
  previousTime = now; sceneTime += dt;
  const offset = Math.sin(sceneTime * 0.12) * 9;
  const sky = context.createLinearGradient(0,0,0,height);
  sky.addColorStop(0,'#a9bbc4'); sky.addColorStop(.52,'#c0c4bb'); sky.addColorStop(1,'#d2c6aa');
  context.fillStyle=sky; context.fillRect(0,0,width,height);
  const sun=context.createRadialGradient(width*.74,height*.25,2,width*.74,height*.25,115);
  sun.addColorStop(0,'#f2d5a844'); sun.addColorStop(1,'#f2d5a800'); context.fillStyle=sun;context.fillRect(0,0,width,height);
  drawMountains(context,width,height*.56,offset*.24,.16,'#82949d',180,42);
  drawMountains(context,width,height*.63,offset*.5,.32,'#73837f',155,79);
  context.fillStyle='#b7b9ad55';context.fillRect(0,height*.43,width,height*.17);
  drawForest(context,width,height*.64,.48,offset*.5,true);
  drawForest(context,width,height*.72,.8,offset*.8,false);
  const horizon=context.createLinearGradient(0,height*.68,0,height*.91);
  horizon.addColorStop(0,'#89938300');horizon.addColorStop(1,'#a7a18b88');context.fillStyle=horizon;context.fillRect(0,height*.65,width,height*.25);
  drawGround(context,world,width,height,0);
  drawCampfire(context,sceneTime,width,height);
  drawSnow(context,width,height,dt);
}
