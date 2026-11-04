/**
 * Şablon galerisi — tüm tasarımları tek seferde render edip önizleme üretir.
 *
 *   node mcp/gallery.mjs <slug> [--out <dizin>] [--templates a,b,c] [--no-sheet]
 *
 * Üretilenler (varsayılan: ~/Downloads/cv-preview-<slug>/):
 *   gallery.html   → tıklanabilir önizleme galerisi (tarayıcıda açılır)
 *   gallery.png    → tek sayfa "contact sheet" (hepsi bir arada)
 *   gallery.json   → sıra numarası → şablon eşlemesi (pick komutu bunu kullanır)
 *   <id>.png       → her şablonun A4 önizlemesi
 *
 * Ölçüm: her şablon için tek sayfa tahmini, karakter/bütçe oranı ve
 * gerçek DOM taşması (mm) raporlanır.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { TEMPLATES } from './core.mjs';
import {
  PREVIEW_URL,
  START_HINT,
  checkServer,
  fits,
  mountDraft,
  measureA4,
} from './measure.mjs';

const PROJECT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOWNLOADS = path.join(process.env.USERPROFILE || process.env.HOME || PROJECT_DIR, 'Downloads');
const BASE_URL = PREVIEW_URL;

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const v = process.argv[i + 1];
  return v && !v.startsWith('--') ? v : true;
}

const slug = process.argv.slice(2).find((a) => !a.startsWith('--') && !a.startsWith('-'));
if (!slug) {
  console.error('HATA: slug gerekli. Örnek: node mcp/gallery.mjs rehber-ogretmen-ilkokul-2026');
  process.exit(1);
}

const draftPath = path.join(PROJECT_DIR, 'cv-data', 'drafts', `${slug}.json`);
if (!fs.existsSync(draftPath)) {
  console.error('HATA: taslak bulunamadı:', draftPath);
  process.exit(1);
}

const outDir = arg('out') && arg('out') !== true
  ? path.resolve(String(arg('out')))
  : path.join(DOWNLOADS, `cv-preview-${slug}`);

const only = arg('templates');
const filterSet = typeof only === 'string'
  ? new Set(only.split(',').map((s) => s.trim()).filter(Boolean))
  : null;

const templates = filterSet ? TEMPLATES.filter((t) => filterSet.has(t.id)) : TEMPLATES;
if (!templates.length) {
  console.error('HATA: eşleşen şablon yok:', only);
  process.exit(1);
}

const draft = JSON.parse(fs.readFileSync(draftPath, 'utf8'));
const cvTitle = draft.title || draft.personalInfo?.name || slug;

fs.mkdirSync(outDir, { recursive: true });

// Eski çalıştırmadan kalan NN-*.png dosyaları temizle: farklı şablon setiyle
// üretilmiş eskizler kalırsa 01-corporate.png ile 01-modern-geometric.png yan
// yana durur ve numara→şablon eşlemesi yanıltır.
for (const f of fs.readdirSync(outDir)) {
  if (/^\d{2}-.+\.png$/i.test(f) || f === 'gallery.png' || f === 'gallery.json' || f === 'gallery.html') {
    try {
      fs.rmSync(path.join(outDir, f), { force: true });
    } catch {
      /* yoksay */
    }
  }
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

async function main() {
  const up = await checkServer(BASE_URL);
  if (!up.ok) {
    console.error(`HATA: önizleme sunucusu kapalı — ${BASE_URL}`);
    console.error(`      ${up.error || `HTTP ${up.status}`}`);
    console.error(`      Başlat: ${START_HINT}`);
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 1400 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();

  const results = [];

  for (let i = 0; i < templates.length; i++) {
    const tpl = templates[i];

    await mountDraft(page, draft, slug, { template: tpl.id });

    // Ekran görüntüsü ekran medyasında (baskı gölgeleri olmadan güzel görünür),
    // ölçüm PRINT medyasında yapılır — PDF ile birebir aynı geometri.
    // emulateMedia sayfa düzeyinde kalıcıdır; her turda geri alınmalı.
    await page.emulateMedia({ media: 'screen' });
    await page.waitForTimeout(150);
    const png = path.join(outDir, `${String(i + 1).padStart(2, '0')}-${tpl.id}.png`);
    await page.locator('#cv-preview-page').first().screenshot({ path: png });

    const metrics = await measureA4(page);
    const singlePage = fits(metrics);
    const fill = +(metrics.textChars / tpl.pageBudget).toFixed(2);

    results.push({
      index: i + 1,
      id: tpl.id,
      name: tpl.name,
      tag: tpl.tag,
      bestFor: tpl.bestFor,
      layout: tpl.layout,
      budget: tpl.pageBudget,
      chars: metrics.textChars,
      fillPct: Math.round(fill * 100),
      overflowMm: metrics.overflowMm,
      overflowPx: metrics.overflowPx,
      clipped: metrics.clippedLeaves,
      singlePage,
      png: path.basename(png),
    });

    console.log(
      `${String(i + 1).padStart(2, '0')}. ${tpl.id.padEnd(18)} ${singlePage ? 'tek sayfa' : 'TAŞMA'} ` +
        `taşma=${metrics.overflowMm}mm kırpılan=${metrics.clippedLeaves} doluluk=%${Math.round(fill * 100)}`,
    );
  }

  const manifest = { slug, title: cvTitle, generatedAt: new Date().toISOString(), outDir, results };
  fs.writeFileSync(path.join(outDir, 'gallery.json'), JSON.stringify(manifest, null, 2), 'utf8');

  const cards = results
    .map(
      (r) => `
    <figure class="card${r.singlePage ? '' : ' warn'}">
      <div class="badge">${r.index}</div>
      <div class="shot"><img src="${esc(r.png)}" alt="${esc(r.name)}" loading="lazy"></div>
      <figcaption>
        <h2>${esc(r.name)}</h2>
        <p class="tag">${esc(r.tag)} · ${esc(r.layout)} düzen</p>
        <p class="meta">
          <span class="${r.singlePage ? 'ok' : 'bad'}">${r.singlePage ? 'tek sayfa ✓' : 'taşma var ⚠'}</span>
          <span>${r.overflowMm} mm</span>
          <span>doluluk %${r.fillPct}</span>
        </p>
        <p class="best">${esc(r.bestFor)}</p>
        <code>node mcp/cli.mjs pick ${esc(slug)} --template ${r.index} --pdf</code>
      </figcaption>
    </figure>`,
    )
    .join('\n');

  const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>CV şablon galerisi — ${esc(cvTitle)}</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #0b1020; color: #e8ecf5;
         font: 15px/1.5 "Segoe UI", Inter, system-ui, sans-serif; padding: 32px 28px 56px; }
  header { max-width: 1500px; margin: 0 auto 26px; }
  h1 { font-size: 25px; margin: 0 0 6px; letter-spacing: -.3px; }
  .sub { color: #8f9bb3; font-size: 13px; margin: 0; }
  .sub b { color: #c9d3e6; font-weight: 600; }
  .grid { max-width: 1500px; margin: 0 auto; display: grid; gap: 26px 22px;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); }
  .card { margin: 0; background: #141b30; border: 1px solid #23304d; border-radius: 14px;
          overflow: hidden; position: relative; display: flex; flex-direction: column; }
  .card.warn { border-color: #6b3a2f; }
  .badge { position: absolute; top: 10px; left: 10px; z-index: 2; width: 30px; height: 30px;
           display: grid; place-items: center; border-radius: 9px; background: #f59e0b;
           color: #1a1205; font-weight: 800; font-size: 14px; box-shadow: 0 2px 10px #0007; }
  .shot { background: #fff; max-height: 420px; overflow: hidden; }
  .shot img { width: 100%; display: block; }
  figcaption { padding: 13px 15px 15px; display: flex; flex-direction: column; gap: 5px; }
  h2 { font-size: 15px; margin: 0; }
  .tag { margin: 0; color: #93a2bd; font-size: 12px; }
  .meta { margin: 2px 0; display: flex; gap: 9px; flex-wrap: wrap; font-size: 12px; color: #a9b7d0; }
  .ok { color: #4ade80; font-weight: 600; }
  .bad { color: #f87171; font-weight: 700; }
  .best { margin: 0; font-size: 12px; color: #7f8da6; }
  code { margin-top: 6px; display: block; background: #0a1022; border: 1px solid #223052;
         color: #7dd3fc; border-radius: 8px; padding: 7px 9px; font-size: 11.5px;
         font-family: "JetBrains Mono", Consolas, monospace; overflow-x: auto; white-space: nowrap; }
</style>
</head>
<body>
<header>
  <h1>${esc(cvTitle)}</h1>
  <p class="sub"><b>${esc(slug)}</b> · ${results.length} şablon · ${results.filter((r) => r.singlePage).length} tanesi tek sayfa ·
     seçmek için kartın altındaki komutu çalıştırın (veya bana numarayı söyleyin)</p>
</header>
<main class="grid">
${cards}
</main>
</body>
</html>
`;

  const htmlPath = path.join(outDir, 'gallery.html');
  fs.writeFileSync(htmlPath, html, 'utf8');

  // Contact sheet (tek PNG, hepsi bir arada)
  if (arg('no-sheet') !== true) {
    const sheetPage = await ctx.newPage();
    await sheetPage.setViewportSize({ width: 1580, height: 1200 });
    await sheetPage.goto('file:///' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'load' });
    await sheetPage.waitForTimeout(1200);
    await sheetPage.screenshot({ path: path.join(outDir, 'gallery.png'), fullPage: true });
    await sheetPage.close();
  }

  await ctx.close();
  await browser.close();

  const single = results.filter((r) => r.singlePage).length;
  console.log('');
  console.log(`Galeri : ${htmlPath}`);
  if (arg('no-sheet') !== true) console.log(`Özet PNG: ${path.join(outDir, 'gallery.png')}`);
  console.log(`Manifest: ${path.join(outDir, 'gallery.json')}`);
  console.log(`Tek sayfa: ${single}/${results.length}`);
  console.log('');
  console.log('Seçmek için:  node mcp/cli.mjs pick ' + slug + ' --template <numara> --pdf');
}

main().catch((err) => {
  console.error('HATA:', err?.message || err);
  process.exit(1);
});
