import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Timeline } from '../src/core/Timeline';
import { DiffusionSim, type DiffusionConfig } from '../src/simulation/Diffusion';

test('Timeline is a pure function of time (order-independent seeking)', () => {
  const obj = { alpha: 1 };
  const tl = new Timeline();
  tl.tween(obj, 'alpha', 0, 1, 0, 1, 'linear'); // fade in
  tl.tween(obj, 'alpha', 1, 0, 5, 1, 'linear'); // fade out
  const at = (t: number) => (tl.seek(t), obj.alpha);
  assert.equal(at(0), 0);
  assert.equal(at(0.5), 0.5);
  assert.equal(at(3), 1);
  assert.equal(at(5.5), 0.5);
  assert.equal(at(9), 0);
  assert.equal(at(0.5), 0.5); // seeking backwards gives the same answer
  assert.equal(at(3), 1);
});

const cfg: DiffusionConfig = {
  seed: 7, count: 150,
  bounds: { x: 120, y: 240, w: 1000, h: 600 },
  membraneX: 620,
  pores: [{ y: 330, h: 100 }, { y: 490, h: 100 }, { y: 650, h: 100 }],
  speed: 450, turnRate: 1, radius: 10, duration: 12,
};

test('DiffusionSim is deterministic for the same seed', () => {
  const a = new DiffusionSim(cfg), b = new DiffusionSim(cfg);
  const pa = a.positionsAt(7.3, new Float32Array(300)), pb = b.positionsAt(7.3, new Float32Array(300));
  assert.deepEqual(Array.from(pa), Array.from(pb));
});

test('DiffusionSim: starts all-left, ends near 50/50, particles stay in bounds', () => {
  const s = new DiffusionSim(cfg);
  assert.equal(s.leftFractionAt(0), 1);
  assert.ok(Math.abs(s.leftFractionAt(12) - 0.5) < 0.1, `end fraction ${s.leftFractionAt(12)}`);
  const p = s.positionsAt(12, new Float32Array(300));
  for (let i = 0; i < p.length; i += 2) {
    assert.ok(p[i]! >= 120 && p[i]! <= 1120 && p[i + 1]! >= 240 && p[i + 1]! <= 840);
  }
});
