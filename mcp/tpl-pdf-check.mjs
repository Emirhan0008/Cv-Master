/**
 * Gerçek PDF üretip geri render eder — "ekran ≠ çıktı" iddiasını PDF üzerinde
 * doğrular (print emülasyonu PDF motorunun aynısı değildir).
 *
 * Kullanım: node mcp/tpl-pdf-check.mjs [--only tpl1,tpl2]
 * Çıktı: C:/Users/YILMAZ/AppData/Local/Temp/opencode/tplpdf/<tpl>.png
 */
import fs from 'node:fs';
import { chromium } from 'playwright';
import { mountDraft, A4_HEIGHT_PX } from './measure.mjs';

const args = process.argv.slice(2);
const onlyIdx = args.indexOf('--only');
const TEMPLATES = onlyIdx >= 0
  ? args[onlyIdx + 1].split(',')
  : ['corporate', 'modern', 'depth3d', 'modern-geometric', 'split-sidebar',
     'minimalist-clean', 'editorial-serif', 'tech-mono', 'crimson-split',
     'teal-timeline', 'dark-gold-arch'];

const OUT = 'C:/Users/YILMAZ/AppData/Local/Temp/opencode/tplpdf';
fs.mkdirSync(OUT, { recursive: true });

const base = JSON.parse(fs.readFileSync('W:/Cv-Master/cv-data/drafts/mavi-mega-rehber-2026.json', 'utf8'));
base.styles.pageGuide = false;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } });

const viewerHtml = `<html><body style="margin:0;background:#fff"><canvas id="c"></canvas>
<script type="module">
import * as pdfjs from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.6.82/build/pdf.mjs';
pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.6.82/build/pdf.worker.mjs';
const raw = atob(window.__PDF__);
const arr = new Uint8Array(raw.length);
for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
const doc = await pdfjs.getDocument({ data: arr }).promise;
const p = await doc.getPage(1);
const vp = p.getViewport({ scale: 2 });
const cv = document.getElementById('c');
cv.width = vp.width; cv.height = vp.height;
await p.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
document.title = 'hazir ' + doc.numPages;
</script></body></html>`;
const viewerPath = 'C:/Users/YILMAZ/AppData/Local/Temp/opencode/tplpdf/_v.html';
fs.writeFileSync(viewerPath, viewerHtml);

for (const tpl of TEMPLATES) {
  const page = await ctx.newPage();
  await mountDraft(page, base, 'pdf-' + tpl, { template: tpl });
  await page.waitForTimeout(600);
  const buf = await page.pdf({
    width: '210mm', height: '297mm', printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }, preferCSSPageSize: true,
  });
  const pdfPath = `${OUT}/${tpl}.pdf`;
  fs.writeFileSync(pdfPath, buf);
  await page.close();

  // PDF'i geri render et
  const v = await ctx.newPage();
  await v.addInitScript((d) => { window.__PDF__ = d; }, buf.toString('base64'));
  await v.goto('file:///' + viewerPath);
  await v.waitForFunction(() => document.title.startsWith('hazir'), { timeout: 90000 });
  await v.waitForTimeout(250);
  const pages = (await v.title()).split(' ')[1];
  await v.locator('#c').screenshot({ path: `${OUT}/${tpl}.png` });
  await v.close();

  // PDF'te kaç sayfa + A4 doluluk
  console.log(tpl.padEnd(18), 'sayfa=' + pages, 'boyut=' + Math.round(buf.length / 1024) + 'KB', `${OUT}/${tpl}.png`);
}
await browser.close();
