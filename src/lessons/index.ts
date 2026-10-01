import type { Scene } from '../core/Scene';
import { diffusion } from './biology/diffusion';

/** Register every lesson here. Each one is independently renderable by name. */
export const lessons: Record<string, () => Scene> = {
  diffusion,
};
