/**
 * Ad başlığı doğrulaması — erişilebilirlik ağacı yöntemi.
 *
 * Neden bu yol: ad metni CSS `uppercase` ile dönüştürüldüğü için DOM'da
 * "Emirhan Yılmaz" yazar; ekranda ne basıldığı DOM'dan okunamaz. Chromium
 * erişilebilirlik ağacında `name` alanı text-transform uygulanmış metni verir,
 * bu yüzden "EMİRHAN YILMAZ" (noktalı İ) ile "EMIRHAN YILMAZ" (noktasız I)
 * ayrımı tek çağrıda görünür. Ekran görüntüsü karşılaştırmasından çok daha
 * hızlı ve tarayıcı sürümünden bağımsız.
 *
 * Kullanım: node mcp/name-check.mjs <slug>
 */
import fs from 'node:fs';
import { chromium } from 'playwright';
import { mountDraft, checkServer, START_HINT } from './measure.mjs';

const slug = process.argv[2] || 'yazilim-2026';
const draft = JSON.parse(fs.readFileSync(`cv-data/drafts/${slug}.json`, 'utf8'));

const srv = await checkServer();
if (!srv.ok) {
  console.error(`HATA: önizleme sunucusu kapalı. ${START_HINT}`);
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1200 } });
await mountDraft(page, draft, slug);
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1500);

const client = await page.context().newCDPSession(page);
await client.send('Accessibility.enable');
const { nodes } = await client.send('Accessibility.getFullAXTree');

const expected = 'EMİRHAN YILMAZ';
const wrong = 'EMIRHAN YILMAZ';

const names = nodes
  .map((n) => n.name?.value)
  .filter((v) => typeof v === 'string' && v.trim().toLowerCase().includes('em') && v.trim().toLowerCase().includes('y'));

const found = names.filter((n) => n === expected || n === wrong || /^EM.?RHAN Y.?LMAZ$/.test(n.trim()));

const lang = await page.evaluate(() => document.querySelector('#cv-preview-page')?.getAttribute('lang'));
const cssTransform = await page.evaluate(() => {
  const el = document.querySelector('#cv-preview-page h1') || document.querySelector('#cv-preview-page h2');
  return getComputedStyle(el).textTransform;
});

await browser.close();

console.log(`slug          : ${slug}`);
console.log(`lang          : ${lang}`);
console.log(`text-transform: ${cssTransform}`);
console.log(`AX adları     : ${JSON.stringify(names.slice(0, 3))}`);
console.log(`eşleşen       : ${JSON.stringify(found)}`);

const ok = found.includes(expected);
const hasWrong = found.includes(wrong);

if (ok && !hasWrong) {
  console.log(`SONUÇ         : ✓ ${expected}`);
  process.exit(0);
}
console.error(`SONUÇ         : ✗ beklenen "${expected}", bulunan ${JSON.stringify(found)}`);
process.exit(2);
