import { Application } from 'pixi.js';
import { theme } from './theme';
import { loadFonts } from './Assets';
import type { Scene } from './Scene';

/** Owns the Pixi application. Never runs its own ticker: frames are drawn only on seek(). */
export class Renderer {
  private scene?: Scene;

  private constructor(readonly app: Application) {}

  static async create(host: HTMLElement): Promise<Renderer> {
    await loadFonts();
    const app = new Application();
    await app.init({
      width: theme.width,
      height: theme.height,
      background: theme.colors.bg,
      antialias: true,
      resolution: 1,
      autoDensity: false,
      autoStart: false,
      preference: 'webgl',
    });
    host.appendChild(app.canvas);
    return new Renderer(app);
  }

  show(scene: Scene): void {
    this.app.stage.removeChildren();
    this.app.stage.addChild(scene.root);
    this.scene = scene;
  }

  seek(t: number): void {
    this.scene?.seek(t);
    this.app.render();
  }

  /** Seek, render, and read the canvas back in the same task (no preserveDrawingBuffer needed). */
  grab(t: number): string {
    this.seek(t);
    return this.app.canvas.toDataURL('image/png').split(',')[1]!;
  }
}
