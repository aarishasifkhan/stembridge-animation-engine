import { Track, type EaseName } from './Animation';

type NumericKeys<T> = { [K in keyof T]: T[K] extends number ? K : never }[keyof T] & string;

export class Timeline {
  private tracks = new Map<object, Map<string, Track>>();
  private updaters: Array<(t: number) => void> = [];
  private _end = 0;

  get duration(): number {
    return this._end;
  }

  extendTo(t: number): void {
    this._end = Math.max(this._end, t);
  }

  /** Animate a numeric property of `target` from `from` to `to`. */
  tween<T extends object>(
    target: T,
    prop: NumericKeys<T>,
    from: number,
    to: number,
    start: number,
    duration: number,
    ease: EaseName = 'easeInOut',
  ): void {
    let props = this.tracks.get(target);
    if (!props) this.tracks.set(target, (props = new Map()));
    let track = props.get(prop);
    if (!track) props.set(prop, (track = new Track()));
    track.add({ start, duration, from, to, ease });
    this.extendTo(start + duration);
  }

  /** Value a property will have after all queued tweens (or `fallback`). */
  restValue<T extends object>(target: T, prop: NumericKeys<T>, fallback: number): number {
    return this.tracks.get(target)?.get(prop)?.restValue ?? fallback;
  }

  /** A procedural callback that must be a pure function of time `t` (seconds). */
  updater(fn: (t: number) => void): void {
    this.updaters.push(fn);
  }

  seek(t: number): void {
    for (const [target, props] of this.tracks) {
      for (const [prop, track] of props) Reflect.set(target, prop, track.valueAt(t));
    }
    for (const fn of this.updaters) fn(t);
  }
}
