import { Container, Graphics } from 'pixi.js';
import { theme } from '../core/theme';

export interface ArrowOptions {
  from: [number, number];
  to: [number, number];
  color?: number;
  width?: number;
}

/** Straight arrow with a `progress` property (0..1) that draws it out. */
export class Arrow extends Container {
  private g = new Graphics();
  private _progress = 1;

  constructor(private o: ArrowOptions) {
    super();
    this.addChild(this.g);
    this.redraw();
  }

  get progress(): number {
    return this._progress;
  }
  set progress(p: number) {
    if (p === this._progress) return;
    this._progress = p;
    this.redraw();
  }

  private redraw(): void {
    const { from, to } = this.o;
    const color = this.o.color ?? theme.colors.green;
    const width = this.o.width ?? 10;
    this.g.clear();
    const p = this._progress;
    if (p <= 0) return;
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const len = Math.hypot(dx, dy);
    const ux = dx / len;
    const uy = dy / len;
    const head = Math.min(44, len * p);
    const tipX = from[0] + dx * p;
    const tipY = from[1] + dy * p;
    const baseX = tipX - ux * head;
    const baseY = tipY - uy * head;
    this.g.moveTo(from[0], from[1]).lineTo(baseX, baseY).stroke({ width, color, cap: 'round' });
    this.g
      .poly([tipX, tipY, baseX - uy * head * 0.6, baseY + ux * head * 0.6, baseX + uy * head * 0.6, baseY - ux * head * 0.6])
      .fill(color);
  }
}
