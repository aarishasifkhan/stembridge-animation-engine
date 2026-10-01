/** Render still frames for quick visual checks.
 *  npm run render -- diffusion --t 0,6,14 --out out/stills
 */
import { parseArgs } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { openLesson, frameAt } from './capture';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { t: { type: 'string', default: '0' }, out: { type: 'string', default: 'out/stills' } },
});
const lesson = positionals[0];
if (!lesson) throw new Error('Usage: npm run render -- <lesson> [--t 0,5,10] [--out dir]');

const { page, duration, close } = await openLesson(lesson);
try {
  await mkdir(values.out, { recursive: true });
  for (const raw of values.t.split(',')) {
    const t = Math.min(Number(raw), duration);
    const file = join(values.out, `${lesson}-${t.toFixed(2)}s.png`);
    await writeFile(file, await frameAt(page, t));
    console.log('wrote', file);
  }
} finally {
  await close();
}
