import { Container, Graphics } from 'pixi.js';
import { theme } from '../core/theme';

export interface PanelOptions {
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: number;
  border?: number;
  radius?: number;
}

export class Panel extends Container {
  constructor(o: PanelOptions) {
    super();
    this.addChild(
      new Graphics()
        .roundRect(o.x, o.y, o.w, o.h, o.radius ?? 24)
        .fill(o.fill ?? theme.colors.panel)
        .stroke({ width: 6, color: o.border ?? theme.colors.green }),
    );
  }
}
