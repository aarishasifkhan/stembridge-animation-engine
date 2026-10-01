import { Container, Graphics } from 'pixi.js';
import { theme } from '../core/theme';

export interface MembraneOptions {
  x: number;
  top: number;
  bottom: number;
  pores: Array<{ y: number; h: number }>;
  thickness?: number;
}

/** Vertical membrane with gaps (pores) that particles can pass through. */
export class Membrane extends Container {
  constructor(o: MembraneOptions) {
    super();
    const t = o.thickness ?? 20;
    const g = new Graphics();
    const pores = [...o.pores].sort((a, b) => a.y - b.y);
    let y = o.top;
    for (const p of pores) {
      if (p.y > y) g.roundRect(o.x - t / 2, y, t, p.y - y, t / 2).fill(theme.colors.greenDark);
      y = p.y + p.h;
    }
    if (y < o.bottom) g.roundRect(o.x - t / 2, y, t, o.bottom - y, t / 2).fill(theme.colors.greenDark);
    this.addChild(g);
  }
}
