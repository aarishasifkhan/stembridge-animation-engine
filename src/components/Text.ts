import { Container, Graphics, Text as PixiText } from 'pixi.js';
import { theme } from '../core/theme';

export interface TextOptions {
  x: number;
  y: number;
  size?: number;
  color?: number;
  bold?: boolean;
  align?: 'center' | 'left';
  maxWidth?: number;
}

/** Text with a `progress` property (0..1) that wipes it in left-to-right. */
export class Text extends Container {
  private inner: PixiText;
  private maskG = new Graphics();
  private _progress = 1;

  constructor(content: string, o: TextOptions) {
    super();
    this.inner = new PixiText({
      text: content,
      style: {
        fontFamily: theme.font,
        fontSize: o.size ?? theme.size.body,
        fontWeight: o.bold ? '700' : '400',
        fill: o.color ?? theme.colors.ink,
        align: o.align === 'left' ? 'left' : 'center',
        wordWrap: o.maxWidth !== undefined,
        wordWrapWidth: o.maxWidth ?? 0,
      },
    });
    this.inner.anchor.set(o.align === 'left' ? 0 : 0.5, 0.5);
    this.position.set(o.x, o.y);
    this.addChild(this.inner, this.maskG);
  }

  get progress(): number {
    return this._progress;
  }
  set progress(p: number) {
    if (p === this._progress) return;
    this._progress = p;
    if (p >= 1) {
      this.inner.mask = null;
      this.maskG.clear();
      return;
    }
    const w = this.inner.width;
    const h = this.inner.height;
    this.maskG.clear().rect(-w * this.inner.anchor.x, -h / 2, w * p, h).fill(0xffffff);
    this.inner.mask = this.maskG;
  }
}
