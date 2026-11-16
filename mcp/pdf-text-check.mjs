/**
 * Üretilen PDF'in GERÇEK metnini okur ve iddiaları PDF üzerinde doğrular.
 *
 * Neden ayrı araç: `tpl-pdf-check.mjs` PDF'i resme çevirip görsel kontrol
 * yapıyor; ama "ad İ ile mi basıldı", "staj bloğu kaldı mı", "GitHub linki
 * girdi mi" gibi metin iddiaları resimden okunamaz. Bu araç pdf.js'i
 * tarayıcıda CDN'den yükler (projeye bağımlılık eklemez), PDF'i `route`
 * ile servis eder (700 KB base64'ü sayfaya geçirmek atob'u bozuyordu).
 *
 * ÖNEMLİ — pdf.js metni harf harf ayırır: "EMİRHAN YILMAZ" yerine
 * "EM İ RHAN YILMAZ", "öğretmenlik" yerine "ö ğ retmenlik" gelir. Bu yüzden
 * tüm karşılaştırmalar BOŞLUKSUZ yapılır; aksi hâlde her arama yanlış negatif
 * verir (ölçüldü).
 *
 * Kullanım:
 *   node mcp/pdf-text-check.mjs <slug> <pdf-yolu> [--forbid a,b] [--require c,d]
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const [slug, pdfPath, ...rest] = process.argv.slice(2);
if (!slug || !pdfPath) {
  console.error('kullanım: node mcp/pdf-text-check.mjs <slug> <pdf-yolu> [--forbid a,b] [--require c,d]');
  process.exit(1);
}
const opt = (name, fallback = '') => {
  const i = rest.indexOf(name);
  return i >= 0 ? rest[i + 1] : fallback;
};
const forbid = opt('--forbid').split(',').map((s) => s.trim()).filter(Boolean);
const require = opt('--require').split(',').map((s) => s.trim()).filter(Boolean);

const pdfBuf = fs.readFileSync(pdfPath);

const harness = `<html><body><script type="module">
import * as pdfjs from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.6.82/build/pdf.mjs';
pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.6.82/build/pdf.worker.mjs';
const data = new Uint8Array(await (await fetch('/cv.pdf')).arrayBuffer());
const doc = await pdfjs.getDocument({ data }).promise;
window.__PAGES__ = doc.numPages;
const out = [];
for (let i = 1; i <= doc.numPages; i++) {
  const pg = await doc.getPage(i);
  const c = await pg.getTextContent();
  out.push(c.items.map((x) => x.str).join(' '));
}
window.__TEXT__ = out;
</script></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', (e) => console.error('PAGEERROR', String(e).slice(0, 300)));

await page.route('https://cv.local/**', async (route) => {
  if (route.request().url().endsWith('/cv.pdf')) {
    return route.fulfill({ status: 200, contentType: 'application/pdf', body: pdfBuf });
  }
  return route.fulfill({ status: 200, contentType: 'text/html', body: harness });
});

await page.goto('https://cv.local/harness.html');
const handle = await page.waitForFunction(() => window.__TEXT__ || null, null, { timeout: 60000 });
const pages = await handle.jsonValue();
const numPages = await page.evaluate(() => window.__PAGES__);
await browser.close();

const norm = pages.join(' ').replace(/\s+/g, ' ').trim();
const compact = norm.replace(/\s+/g, '');
const lowerCompact = compact.toLowerCase();
const trLower = (s) => s.replace(/I/g, 'ı').replace(/İ/g, 'i').toLowerCase();
const lowerTrCompact = trLower(compact);

console.log(`dosya   : ${path.basename(pdfPath)}`);
console.log(`slug    : ${slug}`);
console.log(`sayfa   : ${numPages}`);
console.log(`uzunluk : ${norm.length} karakter`);

const nameCandidates = ['EMİRHANYILMAZ', 'EMIRHANYILMAZ', 'EmirhanYılmaz'];
const exact = nameCandidates.find((n) => compact.includes(n));
console.log(`ad      : ${exact || '(bulunamadı)'}`);

let fail = 0;
if (exact !== 'EMİRHANYILMAZ') {
  console.error(`  ✗ ad "EMİRHAN YILMAZ" değil → ${exact}`);
  fail++;
}
if (numPages > 1) {
  console.error(`  ✗ ${numPages} sayfa (tek sayfa olmalı)`);
  fail++;
}
for (const f of forbid) {
  const needle = f.replace(/\s+/g, '').toLowerCase();
  const hit = lowerCompact.includes(needle) || lowerTrCompact.includes(trLower(needle));
  console.log(`${hit ? '✗' : '✓'} yasak "${f}"`);
  if (hit) fail++;
}
for (const r of require) {
  const needle = r.replace(/\s+/g, '').toLowerCase();
  const hit = lowerCompact.includes(needle) || lowerTrCompact.includes(trLower(needle));
  console.log(`${hit ? '✓' : '✗'} gerekli "${r}"`);
  if (!hit) fail++;
}

console.log(fail === 0 ? 'SONUÇ   : ✓' : `SONUÇ   : ✗ ${fail} sorun`);
process.exit(fail === 0 ? 0 : 2);
