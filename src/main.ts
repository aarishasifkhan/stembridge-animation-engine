import { Renderer } from './core/Renderer';
import { lessons } from './lessons';

const params = new URLSearchParams(location.search);
const name = params.get('lesson') ?? 'diffusion';
const renderMode = params.has('render');
if (renderMode) document.body.classList.add('render');

const build = lessons[name];
if (!build) throw new Error(`Unknown lesson "${name}". Available: ${Object.keys(lessons).join(', ')}`);

const renderer = await Renderer.create(document.getElementById('stage')!);
const scene = build();
renderer.show(scene);
renderer.seek(0);
window.__engine = { ready: true, duration: scene.duration, seek: (t) => renderer.seek(t), grab: (t) => renderer.grab(t) };

if (!renderMode) {
  const playBtn = document.getElementById('play') as HTMLButtonElement;
  const slider = document.getElementById('seek') as HTMLInputElement;
  const label = document.getElementById('time')!;
  slider.max = String(scene.duration);
  let playing = true;
  let cur = 0;
  let last = performance.now();
  playBtn.onclick = () => {
    playing = !playing;
    playBtn.textContent = playing ? 'Pause' : 'Play';
  };
  slider.oninput = () => { cur = Number(slider.value); };
  const frame = (now: number) => {
    if (playing) cur = (cur + (now - last) / 1000) % scene.duration;
    last = now;
    renderer.seek(cur);
    slider.value = String(cur);
    label.textContent = `${cur.toFixed(1)} / ${scene.duration.toFixed(1)} s`;
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
