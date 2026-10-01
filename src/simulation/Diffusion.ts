/**
 * Deterministic diffusion simulation (no rendering, no DOM).
 * The whole trajectory is precomputed from a seed, so position(t) is a pure function
 * of time: the same lesson renders identically every run.
 */
export interface Pore {
  y: number;
  h: number;
}

export interface DiffusionConfig {
  seed: number;
  count: number;
  bounds: { x: number; y: number; w: number; h: number };
  membraneX: number;
  pores: Pore[];
  speed: number; // px / s
  turnRate: number; // random direction change (rad / sqrt(s))
  radius: number;
  duration: number; // seconds of simulated time
  dt?: number;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class DiffusionSim {
  readonly count: number;
  readonly dt: number;
  readonly steps: number;
  readonly duration: number;
  private frames: Float32Array;
  private left: Float32Array;

  constructor(cfg: DiffusionConfig) {
    const rand = mulberry32(cfg.seed);
    const gauss = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
    const n = cfg.count;
    const dt = cfg.dt ?? 1 / 60;
    const steps = Math.round(cfg.duration / dt);
    const { bounds: b, membraneX: mx, radius: r } = cfg;
    this.count = n;
    this.dt = dt;
    this.steps = steps;
    this.duration = cfg.duration;
    this.frames = new Float32Array((steps + 1) * n * 2);
    this.left = new Float32Array(steps + 1);

    const x = new Float32Array(n);
    const y = new Float32Array(n);
    const a = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      x[i] = b.x + r + rand() * (mx - b.x - 2 * r - 14); // start on the left side only
      y[i] = b.y + r + rand() * (b.h - 2 * r);
      a[i] = rand() * 2 * Math.PI;
    }

    const sqrtDt = Math.sqrt(dt);
    const inPore = (py: number) => cfg.pores.some((p) => py - r >= p.y && py + r <= p.y + p.h);

    const store = (s: number) => {
      let l = 0;
      const base = s * n * 2;
      for (let i = 0; i < n; i++) {
        this.frames[base + 2 * i] = x[i]!;
        this.frames[base + 2 * i + 1] = y[i]!;
        if (x[i]! < mx) l++;
      }
      this.left[s] = l / n;
    };
    store(0);

    for (let s = 1; s <= steps; s++) {
      for (let i = 0; i < n; i++) {
        let ang = a[i]! + gauss() * sqrtDt * cfg.turnRate;
        let nx = x[i]! + Math.cos(ang) * cfg.speed * dt;
        let ny = y[i]! + Math.sin(ang) * cfg.speed * dt;
        if (nx < b.x + r) { nx = 2 * (b.x + r) - nx; ang = Math.PI - ang; }
        else if (nx > b.x + b.w - r) { nx = 2 * (b.x + b.w - r) - nx; ang = Math.PI - ang; }
        if (ny < b.y + r) { ny = 2 * (b.y + r) - ny; ang = -ang; }
        else if (ny > b.y + b.h - r) { ny = 2 * (b.y + b.h - r) - ny; ang = -ang; }
        if ((x[i]! - mx) * (nx - mx) < 0 && !inPore(ny)) { nx = x[i]!; ang = Math.PI - ang; }
        x[i] = nx; y[i] = ny; a[i] = ang;
      }
      store(s);
    }
  }

  /** Write particle positions at simulated time t into `out` (length count*2). */
  positionsAt(t: number, out: Float32Array): Float32Array {
    const f = Math.min(Math.max(t / this.dt, 0), this.steps);
    const i0 = Math.floor(f);
    const i1 = Math.min(i0 + 1, this.steps);
    const k = f - i0;
    const n2 = this.count * 2;
    for (let j = 0; j < n2; j++) {
      const a = this.frames[i0 * n2 + j]!;
      const b = this.frames[i1 * n2 + j]!;
      out[j] = a + (b - a) * k;
    }
    return out;
  }

  /** Fraction (0..1) of particles on the left side at simulated time t. */
  leftFractionAt(t: number): number {
    const f = Math.min(Math.max(t / this.dt, 0), this.steps);
    return this.left[Math.round(f)]!;
  }

  /** First time after which left fraction stays within `tol` of 0.5. */
  equilibriumTime(tol: number): number {
    let s = this.steps;
    while (s > 0 && Math.abs(this.left[s]! - 0.5) <= tol) s--;
    return (s + 1) * this.dt;
  }
}
