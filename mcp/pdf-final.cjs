const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const PROJECT_DIR = path.resolve(__dirname, '..');

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

  const { A4_HEIGHT_PX, PREVIEW_URL, START_HINT, checkServer, mountDraft, measureA4 } = await import(
    './measure.mjs'
  );

  const up = await checkServer(PREVIEW_URL);
  if (!up.ok) {
    console.error(`[PDF] HATA: onizleme sunucusu kapali — ${PREVIEW_URL}`);
    console.error(`[PDF]       ${up.error || `HTTP ${up.status}`}`);
    console.error(`[PDF]       Baslat: ${START_HINT}`);
    process.exit(3);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1200, height: 800 } });
  const page = await context.newPage();

  try {
    await mountDraft(page, cv, slug);

    // Olcum print medyasinda: PDF ile birebir ayni geometri.
    // ONEMLI: #cv-preview-page elementi A4'ten uzun olabilir; baseline gercek
    // A4 yuksekligidir (1122.52 px), elementin kendi kutusu degil.
    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(400);
    const fit = await measureA4(page);

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
      console.error('[PDF] Cozum: node mcp/cli.mjs fit ' + slug + '  ile tam sayiyi gorun,');
      console.error('[PDF]         sonra icerigi kisaltin veya styles.density="compact" yapin.');
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
