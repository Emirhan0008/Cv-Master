/**
 * Üst üste binme denetimi — 11 şablonun her birinde görünür metin
 * kutularının çakışmasını ölçer.
 *
 * Neden gerekli: kullanıcı şartı "PNG/PDF'te yazılar üst üste binmemeli".
 * Görsel inceleme 11 şablon × 100+ satırı tek tek gözle doğrulayamaz;
 * geometrik kesişim ölçümü bunu kesin yapar.
 *
 * Kural: iki yaprak metin kutusu hem yatay hem dikey olarak %25'ten fazla
 * kesişiyorsa "çakışma" sayılır. Süsleme (ikon, çizgi) hariç tutulur —
 * yalnız metin taşıyan yapraklar.
 */
import fs from 'node:fs';
import { chromium } from 'playwright';
import { mountDraft } from './measure.mjs';

const TEMPLATES = [
  'corporate', 'modern', 'depth3d', 'modern-geometric', 'split-sidebar',
  'minimalist-clean', 'editorial-serif', 'tech-mono', 'crimson-split',
  'teal-timeline', 'dark-gold-arch',
];

const base = JSON.parse(fs.readFileSync('W:/Cv-Master/cv-data/drafts/mavi-mega-rehber-2026.json', 'utf8'));
base.styles.pageGuide = false;

const findOverlaps = () => {
  const root = document.querySelector('#cv-preview-page');
  const rb = root.getBoundingClientRect();

  const boxes = [];
  for (const el of root.querySelectorAll('*')) {
    if (el.children.length > 0) continue;
    const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (!t) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    const b = el.getBoundingClientRect();
    if (b.width < 2 || b.height < 2) continue;
    boxes.push({
      t: t.slice(0, 26),
      x: b.left - rb.left,
      y: b.top - rb.top,
      w: b.width,
      h: b.height,
    });
  }

  const hits = [];
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i];
      const b = boxes[j];
      const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (ox <= 1 || oy <= 1) continue;
      const inter = ox * oy;
      const small = Math.min(a.w * a.h, b.w * b.h);
      if (small <= 0) continue;
      const oran = inter / small;
      // %25'ten fazla örtüşme = gerçek çakışma
      if (oran > 0.25) {
        hits.push({
          a: a.t,
          b: b.t,
          oran: +oran.toFixed(2),
          y: Math.round(Math.min(a.y, b.y)),
          x: Math.round(Math.min(a.x, b.x)),
        });
      }
    }
  }
  return { leaves: boxes.length, hits };
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1500, height: 1400 } });
const report = {};

for (const tpl of TEMPLATES) {
  const page = await ctx.newPage();
  await mountDraft(page, base, 'ov-' + tpl, { template: tpl });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2200);

  const screen = await page.evaluate(findOverlaps);
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(1600);
  const print = await page.evaluate(findOverlaps);

  report[tpl] = { screen, print };
  const sh = screen.hits.length;
  const ph = print.hits.length;
  console.log(
    tpl.padEnd(18),
    'yaprak=' + String(print.leaves).padStart(3),
    'ekranÇakışma=' + String(sh).padStart(2),
    'printÇakışma=' + String(ph).padStart(2),
    ph || sh ? '' : 'temiz',
  );
  for (const h of print.hits.slice(0, 4)) {
    console.log('    ⚠', `%${Math.round(h.oran * 100)}`, JSON.stringify(h.a), '⨯', JSON.stringify(h.b), `@${h.x},${h.y}`);
  }
  await page.close();
}
await browser.close();

const total = Object.values(report).reduce((n, r) => n + r.print.hits.length, 0);
console.log('\n' + (total === 0 ? '✓ 11 şablonda üst üste binen metin yok' : `⚠ toplam ${total} çakışma`));
fs.writeFileSync(
  'C:/Users/YILMAZ/AppData/Local/Temp/opencode/tpl2/overlap.json',
  JSON.stringify(report, null, 2),
);
