import { Container } from 'pixi.js';
import { Timeline } from './Timeline';
import type { EaseName } from './Animation';
import { theme } from './theme';
import { Text, type TextOptions } from '../components/Text';
import { Label, type LabelOptions } from '../components/Label';
import { Arrow, type ArrowOptions } from '../components/Arrow';
import { Graph, type GraphOptions } from '../components/Graph';
import { Highlight, type Rect } from '../components/Highlight';

/**
 * Manim-like authoring API. Every animation call starts at the scene's time cursor
 * and advances it. Use `together()` to run several animations at the same time.
 */
export class Scene {
  readonly root = new Container();
  readonly timeline = new Timeline();
  cursor = 0;

  add<T extends Container>(node: T): T {
    this.root.addChild(node);
    return node;
  }

  get duration(): number {
    return Math.max(this.cursor, this.timeline.duration);
  }

  seek(t: number): void {
    this.timeline.seek(t);
  }

  // ---- factories ---------------------------------------------------------
  addText(content: string, o: TextOptions): Text {
    return this.add(new Text(content, o));
  }
  addLabel(content: string, o: LabelOptions): Label {
    return this.add(new Label(content, o));
  }
  addArrow(o: ArrowOptions): Arrow {
    return this.add(new Arrow(o));
  }
  addGraph(o: GraphOptions): Graph {
    return this.add(new Graph(o));
  }
  title(content: string): Text {
    const t = this.addText(content, { x: theme.width / 2, y: 90, size: theme.size.title, bold: true, color: theme.colors.greenDark });
    this.fadeIn(t, 0.8);
    return t;
  }

  // ---- animations (each advances the cursor) -----------------------------
  fadeIn(node: Container, duration = 0.6): void {
    this.timeline.tween(node, 'alpha', 0, 1, this.cursor, duration);
    this.cursor += duration;
  }

  fadeOut(node: Container, duration = 0.6): void {
    const from = this.timeline.restValue(node, 'alpha', node.alpha);
    this.timeline.tween(node, 'alpha', from, 0, this.cursor, duration);
    this.cursor += duration;
  }

  /** Wipe text in left-to-right. */
  write(node: Text, duration = 1): void {
    this.timeline.tween(node, 'progress', 0, 1, this.cursor, duration, 'linear');
    this.cursor += duration;
  }

  /** Draw an arrow or reveal a graph from 0 to 100%. */
  reveal(node: Arrow | Graph, duration = 1, ease: EaseName = 'linear'): void {
    this.timeline.tween(node, 'progress', 0, 1, this.cursor, duration, ease);
    this.cursor += duration;
  }

  move(node: Container, to: { x?: number; y?: number }, duration = 1): void {
    if (to.x !== undefined) {
      this.timeline.tween(node, 'x', this.timeline.restValue(node, 'x', node.x), to.x, this.cursor, duration);
    }
    if (to.y !== undefined) {
      this.timeline.tween(node, 'y', this.timeline.restValue(node, 'y', node.y), to.y, this.cursor, duration);
    }
    this.cursor += duration;
  }

  /** Flash a pulsing gold outline around a rectangle for `duration` seconds. */
  highlight(rect: Rect, duration = 2.5): Highlight {
    const h = this.add(new Highlight(rect));
    const fade = 0.3;
    this.timeline.tween(h, 'alpha', 0, 1, this.cursor, fade);
    this.timeline.tween(h, 'phase', 0, duration * 6, this.cursor, duration, 'linear');
    this.timeline.tween(h, 'alpha', 1, 0, this.cursor + duration - fade, fade);
    this.cursor += duration;
    return h;
  }

  wait(seconds: number): void {
    this.cursor += seconds;
    this.timeline.extendTo(this.cursor);
  }

  /** Run actions in parallel: all start now; the cursor moves to the longest one. */
  together(...actions: Array<() => void>): void {
    const start = this.cursor;
    let end = start;
    for (const act of actions) {
      this.cursor = start;
      act();
      end = Math.max(end, this.cursor);
    }
    this.cursor = end;
  }

  /** Register a pure function of local time, active between `start` and `start+duration`. */
  simulate(start: number, duration: number, fn: (localT: number) => void): void {
    this.timeline.updater((t) => fn(Math.min(Math.max(t - start, 0), duration)));
    this.timeline.extendTo(start + duration);
  }
}
