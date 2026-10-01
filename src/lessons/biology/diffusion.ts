import { Container } from 'pixi.js';
import { Scene } from '../../core/Scene';
import { theme } from '../../core/theme';
import { Panel } from '../../components/Panel';
import { Membrane } from '../../biology/Membrane';
import { ParticleField } from '../../simulation/Particle';
import { DiffusionSim } from '../../simulation/Diffusion';

export function diffusion(): Scene {
  const scene = new Scene();
  const c = theme.colors;

  // --- layout (1920 x 1080) ---
  const box = { x: 120, y: 240, w: 1000, h: 600 };
  const membraneX = box.x + box.w / 2;
  const pores = [
    { y: box.y + 90, h: 100 },
    { y: box.y + 250, h: 100 },
    { y: box.y + 410, h: 100 },
  ];
  const SIM_SECONDS = 16;

  const sim = new DiffusionSim({
    seed: 7,
    count: 150,
    bounds: box,
    membraneX,
    pores,
    speed: 450,
    turnRate: 1,
    radius: 10,
    duration: SIM_SECONDS,
  });

  // everything except the final summary lives in `content`, so it can fade out as one
  const content = scene.add(new Container());
  const put = <T extends Container>(n: T): T => content.addChild(n);

  // 1. title
  const title = scene.title('Diffusion');

  // 2. container + region labels
  const panel = put(new Panel(box));
  const hi = put(scene.addLabel('High concentration', { x: box.x + box.w / 4, y: 190, fill: c.greenLight }));
  const lo = put(scene.addLabel('Low concentration', { x: box.x + (box.w * 3) / 4, y: 190, fill: c.goldLight, border: c.gold }));
  scene.wait(0.4);
  scene.together(() => scene.fadeIn(panel, 0.8), () => scene.fadeIn(hi, 0.8), () => scene.fadeIn(lo, 0.8));

  // 3. membrane
  const membrane = put(new Membrane({ x: membraneX, top: box.y, bottom: box.y + box.h, pores }));
  scene.fadeIn(membrane, 0.8);

  // 4. particles (all on the left at sim time 0)
  const field = put(new ParticleField(10));
  const buf = new Float32Array(sim.count * 2);
  field.setPositions(sim.positionsAt(0, buf));
  scene.fadeIn(field, 0.8);

  // 5. caption
  const caption = put(scene.addText('Particles move randomly and spread out.', { x: box.x + box.w / 2, y: 950, size: 48 }));
  scene.write(caption, 1.6);
  scene.wait(1.2);
  scene.fadeOut(caption, 0.5);

  // 6. simulation + arrow + graph
  const arrow = put(scene.addArrow({ from: [300, 885], to: [940, 885] }));
  const arrowText = put(
    scene.addText('High concentration → Low concentration', { x: box.x + box.w / 2, y: 955, size: 50, bold: true, color: c.greenDark }),
  );
  const series = (side: 'left' | 'right') => {
    const pts: Array<[number, number]> = [];
    for (let t = 0; t <= SIM_SECONDS + 1e-9; t += 0.25) {
      const l = sim.leftFractionAt(t) * 100;
      pts.push([t, side === 'left' ? l : 100 - l]);
    }
    return pts;
  };
  const graph = put(
    scene.addGraph({
      x: 1190, y: box.y, width: 660, height: box.h,
      title: 'Concentration vs time',
      xLabel: 'Time (s)', yLabel: 'Particles on each side',
      xMax: SIM_SECONDS, yMax: 100,
      xTicks: [0, 4, 8, 12, 16], yTicks: [0, 25, 50, 75, 100], yUnit: '%',
      series: [
        { label: 'Left side', color: c.green, points: series('left') },
        { label: 'Right side', color: c.goldDark, points: series('right') },
      ],
    }),
  );
  graph.progress = 0;
  scene.together(() => scene.reveal(arrow, 1.2, 'easeOut'), () => scene.fadeIn(arrowText, 1.2), () => scene.fadeIn(graph, 0.8));

  const simStart = scene.cursor;
  scene.simulate(simStart, SIM_SECONDS, (lt) => field.setPositions(sim.positionsAt(lt, buf)));
  scene.timeline.tween(graph, 'progress', 0, 1, simStart, SIM_SECONDS, 'linear');
  scene.cursor = simStart + SIM_SECONDS;
  scene.wait(0.5);

  // 7. equilibrium
  const teq = Math.min(sim.equilibriumTime(0.07), SIM_SECONDS - 3);
  const eqText = put(
    scene.addText('Equilibrium: equal concentration on both sides', { x: box.x + box.w / 2, y: 955, size: 46, bold: true, color: c.greenDark }),
  );
  scene.together(
    () => scene.fadeOut(arrowText, 0.5),
    () => scene.fadeOut(arrow, 0.5),
  );
  scene.fadeIn(eqText, 0.6);
  scene.together(
    () => scene.highlight(box, 3.5),
    () => scene.highlight(graph.region(teq, SIM_SECONDS), 3.5),
  );
  scene.wait(0.5);

  // 8. summary
  scene.together(() => scene.fadeOut(content, 0.8), () => scene.fadeOut(title, 0.8));
  const heading = scene.addText('Summary', { x: theme.width / 2, y: 130, size: theme.size.title, bold: true, color: c.greenDark });
  scene.fadeIn(heading, 0.6);
  const bullets = [
    'Diffusion is the net movement of particles from a region of high concentration to a region of low concentration.',
    'It happens because particles move randomly all the time.',
    'At equilibrium the particles still move, but the concentration is the same on both sides.',
  ];
  bullets.forEach((b, i) => {
    const t = scene.addText(`•  ${b}`, { x: 210, y: 330 + i * 190, size: 52, align: 'left', maxWidth: 1500 });
    scene.fadeIn(t, 1.4); // wrapped (multi-line) text: fade, not write()
    scene.wait(0.6);
  });
  scene.wait(3);

  return scene;
}
