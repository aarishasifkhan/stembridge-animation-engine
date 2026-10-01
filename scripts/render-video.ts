/** Render a lesson to MP4 (H.264) with optional narration/music.
 *  npm run video -- diffusion [--fps 30] [--out out/diffusion.mp4] [--audio narration.mp3] [--keep-frames]
 *
 * Frames are written to out/.frames/<lesson>-<fps>fps/ and already-rendered frames are skipped,
 * so an interrupted render simply resumes when you run the same command again.
 */
import { parseArgs } from 'node:util';
import { mkdir, rm, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { openLesson, frameAt } from '../render/capture';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    fps: { type: 'string', default: '30' },
    out: { type: 'string' },
    audio: { type: 'string' },
    'keep-frames': { type: 'boolean', default: false },
  },
});
const lesson = positionals[0];
if (!lesson) throw new Error('Usage: npm run video -- <lesson> [--fps 30] [--out file.mp4] [--audio file]');
const fps = Number(values.fps);
const out = values.out ?? `out/${lesson}.mp4`;
const framesDir = join('out', '.frames', `${lesson}-${fps}fps`);
await mkdir(dirname(out), { recursive: true });
await mkdir(framesDir, { recursive: true });

const exists = (p: string) => access(p).then(() => true, () => false);
const name = (f: number) => join(framesDir, `${String(f).padStart(6, '0')}.png`);

const { page, duration, close } = await openLesson(lesson);
const frames = Math.round(duration * fps);
console.log(`Rendering "${lesson}": ${duration.toFixed(2)} s, ${frames} frames @ ${fps} fps`);

try {
  for (let f = 0; f < frames; f++) {
    if (await exists(name(f))) continue;
    await writeFile(name(f), await frameAt(page, f / fps));
    if (f % fps === 0) console.log(`  frame ${f}/${frames}`);
  }
} finally {
  await close();
}

const args = ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', join(framesDir, '%06d.png')];
if (values.audio) args.push('-i', values.audio, '-af', 'apad', '-c:a', 'aac', '-b:a', '192k');
args.push('-t', duration.toFixed(3), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-movflags', '+faststart', out);
const ff = spawn('ffmpeg', args, { stdio: 'inherit' });
const [code] = await once(ff, 'close');
if (code !== 0) throw new Error(`ffmpeg exited with code ${code}`);
if (!values['keep-frames']) await rm(framesDir, { recursive: true, force: true });
console.log(`Done: ${out}`);
