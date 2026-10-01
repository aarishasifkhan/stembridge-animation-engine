import { Container, Graphics } from 'pixi.js';
import { theme } from '../core/theme';

/** Draws many circles at once from a flat [x0,y0,x1,y1,...] array. */
export class ParticleField extends Container {
  private g = new Graphics();

  constructor(
    private radius = 10,
    private color: number = theme.colors.gold,
    private outline: number = theme.colors.goldDark,
  ) {
    super();
    this.addChild(this.g);
  }

  setPositions(p: Float32Array): void {
    this.g.clear();
    for (let i = 0; i < p.length; i += 2) this.g.circle(p[i]!, p[i + 1]!, this.radius);
    this.g.fill(this.color).stroke({ width: 2, color: this.outline });
  }
}
