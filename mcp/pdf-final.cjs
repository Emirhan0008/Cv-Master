const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const PROJECT_DIR = path.resolve(__dirname, '..');

/** A4 yüksekliği CSS px (96 dpi): 297 mm */
const A4_HEIGHT_PX = (297 / 25.4) * 96;

function loadCV(slug) {
  const draftPath = path.join(PROJECT_DIR, 'cv-data', 'drafts', slug + '.json');
  if (!fs.existsSync(draftPath)) {
    console.error('HATA: CV bulunamadi:', slug);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(draftPath, 'utf8'));
}

function countPdfPages(file) {
  const text = fs.readFileSync(file).toString('latin1');
  const direct = (text.match(/\/Type\s*\/Page[^s]/g) || []).length;
  const counts = text.match(/\/Count\s+(\d+)/g) || [];
  const fromTree = counts.length ? Math.max(...counts.map((c) => parseInt(c.replace(/\D/g, ''), 10))) : 0;
  return Math.max(direct, fromTree);
}

async function main() {
  const slug = process.argv[2];
  if (!slug) { console.error('HATA: slug gerekli'); process.exit(1); }

  const outPath = process.argv[3]
    ? path.resolve(process.argv[3])
    : path.join(process.env.USERPROFILE || process.env.HOME || process.cwd(), 'Downloads', slug + '.pdf');

  const cv = loadCV(slug);
  const cvTitle = cv.title || (cv.personalInfo && cv.personalInfo.name) || slug;

  console.log('[PDF] Playwright PDF generation for:', cvTitle);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1200, height: 800 } });
  const page = await context.newPage();

  try {
    const cvRecord = Object.assign({}, cv, { id: slug, updatedAt: new Date().toISOString() });

    await page.goto('http://localhost:3010', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    await page.evaluate((cvData) => {
      localStorage.setItem('cv_builder_saved_cvs', JSON.stringify([cvData]));
      localStorage.setItem('cv_builder_active_id', cvData.id || 'temp-cv');
    }, cvRecord);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.waitForSelector('#cv-preview-page', { state: 'visible', timeout: 10000 });
    await page.waitForTimeout(1000);

    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(500);

    // Olcum: icerik A4 sinirini asiyor mu?
    // ONEMLI: #cv-preview-page elementi A4'ten uzun olabilir. Baseline elementin
    // kendi kutusu DEGIL, gercek A4 yuksekligidir (1122.52 px). Aksi halde sayfa 1
    // disinda kalan icerik sessizce kirpilir ve "tasma yok" diye raporlanir.
    const fit = await page.evaluate((A4) => {
      const root = document.querySelector('#cv-preview-page');
      const box = root.getBoundingClientRect();
      let bottom = 0;
      let clipped = 0;
      for (const el of root.querySelectorAll('*')) {
        if (el.children.length > 0) continue;
        if (!(el.textContent || '').trim()) continue;
        const r = el.getBoundingClientRect();
        if (r.height <= 0) continue;
        const rel = r.bottom - box.top;
        if (rel > bottom) bottom = rel;
        if (rel > A4 + 1) clipped++;
      }
      return {
        contentHeight: Math.round(bottom),
        overflowPx: Math.round(bottom - A4),
        overflowMm: +(((bottom - A4) / 96) * 25.4).toFixed(1),
        clippedLeaves: clipped,
      };
    }, A4_HEIGHT_PX);

    await page.pdf({
      path: outPath,
      width: '210mm',
      height: '297mm',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      preferCSSPageSize: true,
    });

    const stats = fs.statSync(outPath);
    const pages = countPdfPages(outPath);

    console.log('[PDF] Sayfa:', pages, '| Boyut:', Math.round(stats.size / 1024), 'KB');
    console.log('[PDF] Icerik yuksekligi:', fit.contentHeight, 'px / A4', Math.round(A4_HEIGHT_PX), 'px');
    console.log('[PDF] Tasma:', fit.overflowMm, 'mm | Kirpilan oge:', fit.clippedLeaves);
    console.log('[PDF] Dosya:', outPath);

    if (fit.overflowPx > 1) {
      console.error(
        `[PDF] HATA: icerik A4 sinirini ${fit.overflowMm} mm asiyor — PDF'te ALT KISIM KIRPILIR.`,
      );
      console.error('[PDF] Cozum: icerigi kisaltin veya styles.density="compact" yapin.');
      process.exitCode = 2;
    }

    if (pages !== 1) {
      console.error('[PDF] UYARI: tek sayfa bekleniyordu,', pages, 'sayfa uretildi.');
      process.exitCode = 2;
    }
  } catch (err) {
    console.error('HATA:', err);
    process.exit(1);
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch(err => { console.error('HATA:', err); process.exit(1); });
