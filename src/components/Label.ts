import { Container, Graphics, Text as PixiText } from 'pixi.js';
import { theme } from '../core/theme';

export interface LabelOptions {
  x: number;
  y: number;
  size?: number;
  fill?: number;
  border?: number;
  color?: number;
}

/** Text in a rounded chip, centred on (x, y). */
export class Label extends Container {
  constructor(content: string, o: LabelOptions) {
    super();
    const size = o.size ?? theme.size.label;
    const text = new PixiText({
      text: content,
      style: { fontFamily: theme.font, fontSize: size, fontWeight: '700', fill: o.color ?? theme.colors.greenDark },
    });
    text.anchor.set(0.5);
    const w = text.width + 56;
    const h = text.height + 28;
    const box = new Graphics()
      .roundRect(-w / 2, -h / 2, w, h, h / 2)
      .fill(o.fill ?? theme.colors.greenLight)
      .stroke({ width: 4, color: o.border ?? theme.colors.green });
    this.addChild(box, text);
    this.position.set(o.x, o.y);
  }
}
