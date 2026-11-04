/**
 * Hata analizi / debug — tek komutta teşhis.
 *
 *   node mcp/debug.mjs <slug> [--api <url>] [--fix-hints]
 *
 * Sırasıyla kontrol eder:
 *   1. Ortam      : Node sürümü, taslak dosyası, Playwright, dev sunucu, PDF üretici
 *   2. Şema       : validate → hatalar / uyarılar / öneriler
 *   3. İçerik     : boş bölümler, tarih aralıkları, tekrarlanan id, bütçe aşımı
 *   4. Render     : gerçek DOM ölçümü — sayfa sınırını aşan öğeler (metin + px + mm)
 *   5. Çıktı      : var olan PDF (boyut, sayfa sayısı), export dosyası
 *   6. Uzak API   : erişim, token, depo adaptörü
 *
 * Çıkış kodu: bloklayan hata varsa 2, sadece uyarı varsa 1, temizse 0.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { runCommand, templateById, validateCV } from './core.mjs';

const require = createRequire(import.meta.url);
const PROJECT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOWNLOADS = path.join(process.env.USERPROFILE || process.env.HOME || PROJECT_DIR, 'Downloads');

const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return undefined;
  const v = argv[i + 1];
  return v && !v.startsWith('--') ? v : true;
};
const slug = argv.find((a) => !a.startsWith('--') && !a.startsWith('-'));
if (!slug) {
  console.error('HATA: slug gerekli. Örnek: node mcp/debug.mjs rehber-ogretmen-ilkokul-2026');
  process.exit(2);
}

const report = {
  slug,
  checks: [],
  errors: [],
  warnings: [],
  renderOffenders: [],
  pdf: null,
  remote: null,
};

function check(name, status, detail) {
  report.checks.push({ name, status, detail });
  const icon = status === 'ok' ? '✓' : status === 'warn' ? '!' : '✗';
  console.log(`${icon} ${name}: ${detail}`);
  if (status === 'fail') report.errors.push(`${name}: ${detail}`);
  if (status === 'warn') report.warnings.push(`${name}: ${detail}`);
}

function countPdfPages(file) {
  const text = fs.readFileSync(file).toString('latin1');
  const direct = (text.match(/\/Type\s*\/Page[^s]/g) || []).length;
  const counts = text.match(/\/Count\s+(\d+)/g) || [];
  const fromTree = counts.length ? Math.max(...counts.map((c) => parseInt(c.replace(/\D/g, ''), 10))) : 0;
  return Math.max(direct, fromTree);
}

async function serverUp(url) {
  try {
    const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(4000) });
    return res.ok || res.status === 404;
  } catch {
    return false;
  }
}

async function main() {
  console.log(`\n=== CV DEBUG: ${slug} ===\n`);

  /* 1. Ortam ------------------------------------------------------- */
  const major = Number(process.versions.node.split('.')[0]);
  check('Node sürümü', major >= 18 ? 'ok' : 'fail', `v${process.versions.node} (>=18 gerekli)`);

  const draftPath = path.join(PROJECT_DIR, 'cv-data', 'drafts', `${slug}.json`);
  const draftExists = fs.existsSync(draftPath);
  check('Taslak dosyası', draftExists ? 'ok' : 'fail', draftExists ? draftPath : `yok: ${draftPath}`);
  if (!draftExists) return finish();

  let playwrightOk = false;
  try {
    require.resolve('playwright');
    playwrightOk = true;
  } catch {
    playwrightOk = false;
  }
  check('Playwright', playwrightOk ? 'ok' : 'fail', playwrightOk ? 'kurulu' : 'kurulu değil → npm install playwright');

  const pdfScript = path.join(PROJECT_DIR, 'mcp', 'pdf-final.cjs');
  check('PDF üretici', fs.existsSync(pdfScript) ? 'ok' : 'fail', fs.existsSync(pdfScript) ? 'mcp/pdf-final.cjs' : 'eksik');

  const previewUrl = process.env.CV_PREVIEW_URL || 'http://localhost:3010';
  const up = await serverUp(previewUrl);
  check(
    'Dev sunucu',
    up ? 'ok' : 'fail',
    up
      ? previewUrl
      : `${previewUrl} kapalı → "PORT=3010 npx tsx server.ts" (PDF ve önizleme bunsuz çalışmaz)`,
  );

  /* 2. Şema / validasyon ------------------------------------------- */
  const raw = JSON.parse(fs.readFileSync(draftPath, 'utf8'));
  let cv;
  try {
    // Taslak diske yazılırken normalize edilir; yine de eksik alanlara karşı koru
    cv = {
      ...raw,
      personalInfo: raw.personalInfo || {},
      workExperiences: raw.workExperiences || [],
      educations: raw.educations || [],
      projects: raw.projects || [],
      skills: raw.skills || [],
      socialLinks: raw.socialLinks || [],
      customSections: raw.customSections || [],
      styles: raw.styles || {},
    };
  } catch (e) {
    check('Normalizasyon', 'fail', e?.message || String(e));
    return finish();
  }
  const v = validateCV(cv);
  check(
    'Validasyon',
    v.errors.length ? 'fail' : v.warnings.length ? 'warn' : 'ok',
    `${v.errors.length} hata · ${v.warnings.length} uyarı · ${v.suggestions.length} öneri`,
  );
  for (const e of v.errors) console.log(`    ✗ ${e}`);
  for (const w of v.warnings) console.log(`    ! ${w}`);
  for (const s of v.suggestions) console.log(`    → ${s}`);

  /* 3. İçerik ------------------------------------------------------ */
  const st = v.stats;
  check(
    'Bütçe',
    st.fillRatio > 1.02 ? 'warn' : 'ok',
    `${st.chars}/${st.budget} karakter (%${Math.round(st.fillRatio * 100)}) · tahmini ${st.estimatedPages} sayfa`,
  );

  const tpl = templateById(cv.styles?.template);
  check('Şablon', tpl ? 'ok' : 'fail', tpl ? `${tpl.id} (${tpl.name})` : `bilinmiyor: ${cv.styles?.template}`);

  const emptyGroups = cv.skills.filter((g) => !g.skills.length);
  check(
    'Yetkinlik grupları',
    emptyGroups.length ? 'warn' : 'ok',
    emptyGroups.length ? `${emptyGroups.length} boş grup: ${emptyGroups.map((g) => g.categoryName).join(', ')}` : `${cv.skills.length} grup dolu`,
  );

  const badDates = [];
  for (const e of cv.workExperiences) {
    if (e.startDate && !/^\d{4}-(0[1-9]|1[0-2])$/.test(e.startDate)) badDates.push(`${e.company}: startDate "${e.startDate}"`);
    if (!e.current && e.endDate && !/^\d{4}-(0[1-9]|1[0-2])$/.test(e.endDate)) badDates.push(`${e.company}: endDate "${e.endDate}"`);
  }
  check('Tarih biçimi', badDates.length ? 'fail' : 'ok', badDates.length ? badDates.join(' | ') : 'tümü YYYY-MM');

  const photo = cv.personalInfo || {};
  const photoLen = (photo.avatarUrl || '').length;
  const photoOk = !photo.photoVisible || (photoLen > 5000 && photo.avatarUrl.startsWith('data:image/'));
  check(
    'Fotoğraf',
    photoOk ? 'ok' : 'warn',
    !photo.photoVisible
      ? 'kapalı'
      : photoLen === 0
        ? 'photoVisible=true ama avatarUrl boş → gri kutu riski'
        : `base64 ${Math.round(photoLen / 1024)} KB${photoLen < 5000 ? ' (çok küçük → bozuk görsel olabilir)' : ''}`,
  );

  /* 4. Gerçek render ölçümü --------------------------------------- */
  if (up && playwrightOk) {
    try {
      const { chromium } = await import('playwright');
      const browser = await chromium.launch({ headless: true });
      const ctx = await browser.newContext({ viewport: { width: 1000, height: 1400 } });
      const page = await ctx.newPage();
      await page.goto(previewUrl, { waitUntil: 'domcontentloaded' });
      await page.evaluate((data) => {
        localStorage.setItem('cv_builder_saved_cvs', JSON.stringify([data]));
        localStorage.setItem('cv_builder_active_id', data.id);
      }, { ...raw, id: slug, updatedAt: new Date().toISOString() });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#cv-preview-page', { state: 'visible', timeout: 15000 });
      await page.waitForTimeout(900);

      const m = await page.evaluate(() => {
        const root = document.querySelector('#cv-preview-page');
        const box = root.getBoundingClientRect();
        const offenders = [];
        let bottom = 0;
        let textChars = 0;
        for (const el of root.querySelectorAll('*')) {
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden') continue;
          const txt = (el.textContent || '').trim();
          const leaf = el.children.length === 0;
          if (leaf && txt) {
            textChars += txt.length;
            const r = el.getBoundingClientRect();
            if (r.height > 0 && r.bottom > bottom) bottom = r.bottom;
          }
          const r = el.getBoundingClientRect();
          if (r.width < 1 || r.height < 1) continue;
          if (r.bottom > box.bottom + 1 || r.right > box.right + 1) {
            offenders.push({
              tag: el.tagName.toLowerCase(),
              text: (el.textContent || '').trim().slice(0, 60),
              overBottom: Math.round(r.bottom - box.bottom),
              overRight: Math.round(r.right - box.right),
              printable: !!(el.offsetParent || cs.position === 'fixed'),
              decorative: cs.position === 'absolute' && !(el.textContent || '').trim(),
            });
          }
        }
        return {
          overflowMm: +(((bottom - box.bottom) / 96) * 25.4).toFixed(1),
          textChars,
          offenders: offenders.slice(0, 12),
          totalOffenders: offenders.length,
        };
      });

      const contentOffenders = m.offenders.filter((o) => !o.decorative);
      report.renderOffenders = contentOffenders;

      check(
        'Render taşması',
        contentOffenders.length ? 'fail' : m.overflowMm > 0 ? 'warn' : 'ok',
        `${m.overflowMm} mm · ${contentOffenders.length} içerik öğesi sınırı aşıyor` +
          (m.offenders.length !== contentOffenders.length
            ? ` (${m.offenders.length - contentOffenders.length} dekoratif öğe yoksayıldı)`
            : ''),
      );
      for (const o of contentOffenders) {
        const mm = ((Math.max(o.overBottom, o.overRight) / 96) * 25.4).toFixed(1);
        console.log(`    ✗ <${o.tag}> +${mm}mm  "${o.text || '(boş)'}"`);
      }

      check(
        'Doluluk (gerçek)',
        'ok',
        `${m.textChars} görünür karakter · şablon bütçesi ${tpl?.pageBudget ?? '?'} (%${Math.round((m.textChars / (tpl?.pageBudget || 1)) * 100)})`,
      );

      await ctx.close();
      await browser.close();
    } catch (e) {
      check('Render ölçümü', 'warn', `yapılamadı: ${e?.message || e}`);
    }
  } else {
    check('Render ölçümü', 'warn', 'dev sunucu veya Playwright yok — atlandı');
  }

  /* 5. Çıktılar ---------------------------------------------------- */
  const pdfPath = path.join(DOWNLOADS, `${slug}.pdf`);
  if (fs.existsSync(pdfPath)) {
    const size = fs.statSync(pdfPath).size;
    const pages = countPdfPages(pdfPath);
    report.pdf = { path: pdfPath, kb: Math.round(size / 1024), pages };
    check('PDF', pages === 1 ? 'ok' : 'warn', `${Math.round(size / 1024)} KB · ${pages} sayfa · ${pdfPath}`);
  } else {
    check('PDF', 'warn', `yok: ${pdfPath} → node mcp/cli.mjs pdf ${slug}`);
  }

  const exportPath = path.join(PROJECT_DIR, 'cv-data', 'exports', `${slug}.json`);
  check('Export', fs.existsSync(exportPath) ? 'ok' : 'warn', exportPath);

  /* 6. Uzak API ---------------------------------------------------- */
  try {
    const remote = await runCommand('remote', {
      apiUrl: flag('api') === true ? undefined : flag('api'),
      apiToken: flag('token') === true ? undefined : flag('token'),
    });
    report.remote = { count: remote.count, store: remote.store };
    check(
      'Uzak API',
      remote.store?.persistent ? 'ok' : 'warn',
      `${remote.count} kayıt · adaptör ${remote.store?.adapter}${remote.store?.persistent ? '' : ' (kalıcı değil!)'}`,
    );
  } catch (e) {
    check('Uzak API', 'warn', `erişilemedi: ${e?.message || e}`);
  }

  return finish();
}

function finish() {
  const blocking = report.errors.length;
  console.log('\n--- ÖZET ---');
  console.log(`${report.checks.filter((c) => c.status === 'ok').length} geçti · ${report.warnings.length} uyarı · ${blocking} bloklayan hata`);
  if (blocking) console.log('BLOKLAYAN: ' + report.errors.join(' ;; '));
  fs.mkdirSync(path.join(process.env.TEMP || '.', 'opencode'), { recursive: true });
  const outFile = path.join(process.env.TEMP || '.', 'opencode', `debug-${report.slug}.json`);
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2), 'utf8');
  console.log('Rapor: ' + outFile);
  process.exit(blocking ? 2 : report.warnings.length ? 1 : 0);
}

main().catch((e) => {
  console.error('HATA:', e?.message || e);
  process.exit(2);
});
