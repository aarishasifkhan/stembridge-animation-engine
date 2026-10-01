# STEMBridge Animation Engine

Local-first, Manim-like educational animation engine: TypeScript + PixiJS, rendered to MP4 with
Playwright (headless Chromium) and FFmpeg. No AI API, no cloud, no credits.

## Prerequisites
Node 20+, npm, FFmpeg on PATH, a Chromium-based browser.

## Setup
```bash
npm install
npx playwright install chromium     # or: export CHROME_PATH=/path/to/chrome
```

## Commands
| Command | What it does |
|---|---|
| `npm run dev` | Live preview at http://127.0.0.1:5173/?lesson=diffusion (play/pause + scrubber) |
| `npm run render -- diffusion --t 0,10,24` | Save still PNGs at given seconds to `out/stills/` (fast visual check) |
| `npm run video -- diffusion` | Render `out/diffusion.mp4` (1920x1080, 30 fps, H.264) |
| `npm run video -- diffusion --fps 60 --audio narration.mp3 --out out/d.mp4` | 60 fps + narration/music (AAC) |
| `npm test` | Unit tests (timeline + simulation determinism) |
| `npm run typecheck` / `npm run build` | Strict TS check / production bundle |

## Authoring a lesson
Create `src/lessons/<subject>/<name>.ts` exporting a function that returns a `Scene`, then register it in
`src/lessons/index.ts`. Every animation call starts at the scene's time cursor and advances it:

```ts
const scene = new Scene();
scene.title('Diffusion');
const label = scene.addText('Hello', { x: 960, y: 500 });
scene.write(label, 1.2);
scene.together(() => scene.fadeIn(a, 0.6), () => scene.fadeIn(b, 0.6));
scene.wait(1);
scene.highlight({ x: 100, y: 100, w: 400, h: 300 }, 2.5);
```
`write()` wipes single-line text only; use `fadeIn` for wrapped multi-line text.
Available: `addText addLabel addArrow addGraph title fadeIn fadeOut write reveal move highlight wait together simulate`.

## Why rendering is deterministic
- Nothing runs on a real-time clock. `Timeline.seek(t)` computes every property as a pure function of `t`.
- Simulations (`DiffusionSim`) are precomputed from a seed, so position(t) is a lookup, not live physics.
- The renderer never uses a ticker; the capture script seeks to frame/fps and screenshots.
Same lesson + same seed = same video.

## Structure
`src/core` Scene, Timeline, Track/easing, Renderer, theme · `src/components` Text, Label, Panel, Arrow, Graph, Highlight ·
`src/biology` Membrane · `src/simulation` Diffusion (pure), Particle (renderer) · `src/lessons` content ·
`render/` Playwright capture · `scripts/render-video.ts` FFmpeg encode.

## Notes
- Colours/sizes live only in `src/core/theme.ts`.
- Fonts: the default stack uses system fonts, so text can look slightly different across machines. For identical
  output everywhere, bundle a font (e.g. `@fontsource/inter`) and set it in `theme.font`.
- Software WebGL (SwiftShader) is used in headless mode, so rendering is slower than on a GPU but reproducible.
- Not yet installed (add when a lesson needs them): D3, GSAP, KaTeX, Three.js, Matter.js.
