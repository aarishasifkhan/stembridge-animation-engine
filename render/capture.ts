import { chromium, type Browser, type Page } from 'playwright';
import { createServer, type ViteDevServer } from 'vite';
import { resolve } from 'node:path';

export const WIDTH = 1920;
export const HEIGHT = 1080;

export interface OpenLesson {
  page: Page;
  duration: number;
  close(): Promise<void>;
}

/** Start a local Vite server and open one lesson in headless Chromium (render mode). */
export async function openLesson(lesson: string): Promise<OpenLesson> {
  const root = resolve(import.meta.dirname, '..');
  const server: ViteDevServer = await createServer({ root, logLevel: 'silent', server: { port: 5199, strictPort: false, host: '127.0.0.1' } });
  await server.listen();
  const url = server.resolvedUrls?.local[0];
  if (!url) throw new Error('Vite did not report a URL');

  let browser: Browser;
  try {
    browser = await chromium.launch({
      headless: true,
      executablePath: process.env.CHROME_PATH || undefined, // e.g. /usr/bin/google-chrome
      args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--hide-scrollbars'],
    });
  } catch (e) {
    await server.close();
    throw new Error(`Could not launch Chromium (${(e as Error).message}). Run "npx playwright install chromium" or set CHROME_PATH.`);
  }

  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
  page.on('pageerror', (err) => console.error('[page error]', err.message));
  await page.goto(`${url}?lesson=${encodeURIComponent(lesson)}&render`);
  await page.waitForFunction(() => window.__engine?.ready === true, undefined, { timeout: 30_000 });
  const duration = await page.evaluate(() => window.__engine!.duration);

  return {
    page,
    duration,
    close: async () => {
      await browser.close();
      await server.close();
    },
  };
}

/** Seek the deterministic clock to time t and return a PNG of the frame. */
export async function frameAt(page: Page, t: number): Promise<Buffer> {
  const b64 = await page.evaluate((time) => window.__engine!.grab(time), t);
  return Buffer.from(b64, 'base64');
}
