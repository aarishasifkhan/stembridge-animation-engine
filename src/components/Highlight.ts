import { Container, Graphics } from 'pixi.js';
import { theme } from '../core/theme';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Pulsing gold outline. Tween `phase` to make it pulse; tween `alpha` to show/hide. */
export class Highlight extends Container {
  private g = new Graphics();
  private _phase = 0;

  constructor(r: Rect) {
    super();
    const pad = 10;
    this.g
      .roundRect(r.x - pad, r.y - pad, r.w + pad * 2, r.h + pad * 2, 22)
      .fill({ color: theme.colors.gold, alpha: 0.14 })
      .stroke({ width: 10, color: theme.colors.gold });
    this.addChild(this.g);
  }

  get phase(): number {
    return this._phase;
  }
  set phase(v: number) {
    this._phase = v;
    this.g.alpha = 0.7 + 0.3 * Math.sin(v);
  }
}
