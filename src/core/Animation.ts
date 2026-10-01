export type EaseName = 'linear' | 'easeInOut' | 'easeOut' | 'easeIn';

export const easings: Record<EaseName, (p: number) => number> = {
  linear: (p) => p,
  easeIn: (p) => p * p * p,
  easeOut: (p) => 1 - Math.pow(1 - p, 3),
  easeInOut: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
};

export interface Segment {
  start: number;
  duration: number;
  from: number;
  to: number;
  ease: EaseName;
}

/**
 * A Track is a pure function of time for ONE numeric property.
 * Before its first segment it holds the first `from`; between segments it holds
 * the previous `to`. Because it is stateless, seeking to any time, in any order,
 * always gives the same value -- this is what makes rendering deterministic.
 */
export class Track {
  private segments: Segment[] = [];

  add(seg: Segment): void {
    this.segments.push(seg);
    // stable sort keeps insertion order for equal start times
    this.segments.sort((a, b) => a.start - b.start);
  }

  get restValue(): number | undefined {
    const last = this.segments[this.segments.length - 1];
    return last?.to;
  }

  valueAt(t: number): number {
    const first = this.segments[0];
    if (!first) return 0;
    let v = first.from;
    for (const s of this.segments) {
      if (t < s.start) break;
      if (s.duration <= 0 || t >= s.start + s.duration) {
        v = s.to;
      } else {
        const p = easings[s.ease]((t - s.start) / s.duration);
        v = s.from + (s.to - s.from) * p;
      }
    }
    return v;
  }
}
