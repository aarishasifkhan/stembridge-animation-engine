export interface EngineHandle {
  ready: boolean;
  duration: number;
  seek(t: number): void;
  /** Seek to t and return the frame as a base64 PNG (fast path for capture). */
  grab(t: number): string;
}
declare global {
  interface Window {
    __engine?: EngineHandle;
  }
}
