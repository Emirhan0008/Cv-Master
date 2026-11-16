/**
 * PNG dışa aktarma — PDF'in gördüğü A4 sayfayı birebir PNG'ye yazar.
 *
 * Neden ayrı araç: `cli.mjs` yalnız PDF/JSON üretiyor; PNG yolunu her seferinde
 * elle Playwright yazmak gerekiyordu ve ekran/print ölçeği tutmadığında
 * PNG ile PDF farklı görünüyordu (auto-fit zoom ekranda farklı hesaplanınca).
 *
 * Kullanım: node mcp/export-png.mjs <slug> --out <dosya.png> [--scale 2]
 *           node mcp/export-png.mjs mavi-mega-rehber-2026 --out Downloads/cv.png
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { mountDraft, PREVIEW_URL, checkServer, START_HINT } from './measure.mjs';

const args = process.argv.slice(2);
const slug = args[0];
if (!slug) {
  console.error('HATA: slug gerekli\n  node mcp/export-png.mjs <slug> --out <dosya.png> [--scale 2]');
  process.exit(1);
}
const outIdx = args.indexOf('--out');
const scaleIdx = args.indexOf('--scale');
const scale = scaleIdx >= 0 ? Number(args[scaleIdx + 1]) || 2 : 2;

const PROJECT_DIR = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\//, '')), '..');
// file:///W:/... biçiminde gelebiliyor; Windows yoluna çevir.
const normalize = (p) => p.replace(/^\/([A-Za-z]:)/, '$1');
const draftPath = path.join(normalize(PROJECT_DIR), 'cv-data', 'drafts', slug + '.json');
if (!fs.existsSync(draftPath)) {
  console.error('HATA: CV bulunamadi:', draftPath);
  process.exit(1);
}
const draft = JSON.parse(fs.readFileSync(draftPath, 'utf8'));
const outPath = outIdx >= 0
  ? path.resolve(normalize(args[outIdx + 1]))
  : path.join(process.env.USERPROFILE || process.cwd(), 'Downloads', slug + '.png');

await checkServer(PREVIEW_URL).catch(() => {
  console.error('HATA: önizleme sunucusu kapalı (' + PREVIEW_URL + ')');
  console.error('  ' + START_HINT);
  process.exit(3);
});

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1500, height: 1400 }, deviceScaleFactor: scale });
const page = await ctx.newPage();
await mountDraft(page, draft, slug, { template: draft.styles?.template });
await page.evaluate(() => document.fonts.ready);
// Auto-fit zoom otursun (fontlar + görsel çözümü sonrası yeniden hesaplanır).
await page.waitForTimeout(2400);

// PRINT medyası: PDF ile aynı geometri. Ekranda yakalamak, zoom ölçeği
// yüzünden PDF'ten farklı bir görüntü üretebiliyordu.
await page.emulateMedia({ media: 'print' });
await page.waitForTimeout(1500);

const box = await page.evaluate(() => {
  const el = document.getElementById('cv-preview-page');
  const r = el.getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
});
await page.screenshot({
  path: outPath,
  clip: { x: box.x, y: box.y, width: box.width, height: box.height },
});
await browser.close();

const kb = Math.round(fs.statSync(outPath).size / 1024);
console.log(`[PNG] ${slug} → ${outPath} (${Math.round(box.width)}x${Math.round(box.height)} CSS px, @${scale}x, ${kb} KB)`);
