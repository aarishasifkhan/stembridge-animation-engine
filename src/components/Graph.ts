import { Container, Graphics, Text as PixiText } from 'pixi.js';
import { theme } from '../core/theme';
import type { Rect } from './Highlight';

export interface Series {
  label: string;
  color: number;
  points: Array<[number, number]>;
}

export interface GraphOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  xLabel: string;
  yLabel: string;
  xMax: number;
  yMax: number;
  xTicks: number[];
  yTicks: number[];
  yUnit?: string;
  series: Series[];
}

const PAD = { left: 170, right: 40, top: 130, bottom: 125 };

/** Line graph in absolute scene coordinates. `progress` reveals lines left-to-right. */
export class Graph extends Container {
  private lines = new Graphics();
  private _progress = 1;
  private plot: Rect;

  constructor(private o: GraphOptions) {
    super();
    this.plot = {
      x: o.x + PAD.left,
      y: o.y + PAD.top,
      w: o.width - PAD.left - PAD.right,
      h: o.height - PAD.top - PAD.bottom,
    };
    const card = new Graphics()
      .roundRect(o.x, o.y, o.width, o.height, 24)
      .fill(theme.colors.panel)
      .stroke({ width: 6, color: theme.colors.green });
    const axes = new Graphics();
    axes
      .moveTo(this.plot.x, this.plot.y)
      .lineTo(this.plot.x, this.plot.y + this.plot.h)
      .lineTo(this.plot.x + this.plot.w, this.plot.y + this.plot.h)
      .stroke({ width: 5, color: theme.colors.ink, cap: 'round', join: 'round' });
    this.addChild(card, axes, this.lines);

    for (const v of o.yTicks) {
      const y = this.py(v);
      axes.moveTo(this.plot.x, y).lineTo(this.plot.x + this.plot.w, y).stroke({ width: 2, color: 0xd9dfdb });
      this.addChild(this.text(`${v}${o.yUnit ?? ''}`, this.plot.x - 14, y, 28, theme.colors.muted, 1, 0.5));
    }
    for (const v of o.xTicks) {
      this.addChild(this.text(`${v}`, this.px(v), this.plot.y + this.plot.h + 14, 28, theme.colors.muted, 0.5, 0));
    }
    this.addChild(this.text(o.title, o.x + o.width / 2, o.y + 38, 40, theme.colors.greenDark, 0.5, 0.5, true));
    this.addChild(this.text(o.xLabel, this.plot.x + this.plot.w / 2, o.y + o.height - 38, 32, theme.colors.ink, 0.5, 0.5));
    const yl = this.text(o.yLabel, o.x + 40, this.plot.y + this.plot.h / 2, 32, theme.colors.ink, 0.5, 0.5);
    yl.rotation = -Math.PI / 2;
    this.addChild(yl);

    // legend
    let lx = this.plot.x;
    for (const s of o.series) {
      axes.moveTo(lx, o.y + 92).lineTo(lx + 44, o.y + 92).stroke({ width: 8, color: s.color, cap: 'round' });
      const t = this.text(s.label, lx + 56, o.y + 92, 30, theme.colors.ink, 0, 0.5);
      this.addChild(t);
      lx += 56 + t.width + 40;
    }
    this.redraw();
  }

  private text(s: string, x: number, y: number, size: number, color: number, ax: number, ay: number, bold = false): PixiText {
    const t = new PixiText({
      text: s,
      style: { fontFamily: theme.font, fontSize: size, fill: color, fontWeight: bold ? '700' : '400' },
    });
    t.anchor.set(ax, ay);
    t.position.set(x, y);
    return t;
  }

  px(xv: number): number {
    return this.plot.x + (xv / this.o.xMax) * this.plot.w;
  }
  py(yv: number): number {
    return this.plot.y + this.plot.h - (yv / this.o.yMax) * this.plot.h;
  }

  /** Scene-space rectangle covering data x range [x0, x1] of the plot area. */
  region(x0: number, x1: number): Rect {
    return { x: this.px(x0), y: this.plot.y, w: this.px(x1) - this.px(x0), h: this.plot.h };
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
    this.lines.clear();
    const cut = this._progress * this.o.xMax;
    for (const s of this.o.series) {
      let started = false;
      for (let i = 0; i < s.points.length; i++) {
        const [x, y] = s.points[i]!;
        if (x <= cut) {
          if (!started) this.lines.moveTo(this.px(x), this.py(y));
          else this.lines.lineTo(this.px(x), this.py(y));
          started = true;
        } else {
          const prev = s.points[i - 1];
          if (prev && started) {
            const f = (cut - prev[0]) / (x - prev[0]);
            this.lines.lineTo(this.px(cut), this.py(prev[1] + (y - prev[1]) * f));
          }
          break;
        }
      }
      if (started) this.lines.stroke({ width: 7, color: s.color, cap: 'round', join: 'round' });
    }
  }
}
