/**
 * fit — "Bu CV A4 tek sayfaya gerçekten sığıyor mu?"
 *
 *   node mcp/fit.mjs <slug> [--templates a,b] [--all] [--verbose] [--json]
 *
 * Karakter bütçesi (validate) yalnızca ön kontroldür; asıl ölçü budur.
 * Varsayılan olarak SADECE taslağın mevcut şablonunu ölçer (hızlı, ~6 sn).
 * --all / --templates ile birden fazla şablonu karşılaştırır.
 *
 * Çıkış kodu: hepsi sığıyorsa 0, en az biri taşıyorsa 2, ortam hatası 1.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TEMPLATES, templateById } from './core.mjs';
import {
  A4_HEIGHT_PX,
  PREVIEW_URL,
  START_HINT,
  checkServer,
  estimateTrimChars,
  fits,
  mountDraft,
  measureA4,
} from './measure.mjs';

const PROJECT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return undefined;
  const v = argv[i + 1];
  return v && !v.startsWith('--') ? v : true;
};
const has = (name) => argv.includes(`--${name}`);

const slug = argv.find((a) => !a.startsWith('--') && !a.startsWith('-'));
if (!slug) {
  console.error('HATA: slug gerekli. Örnek: node mcp/fit.mjs rehber-ogretmen-ilkokul-2026');
  process.exit(1);
}

const draftPath = path.join(PROJECT_DIR, 'cv-data', 'drafts', `${slug}.json`);
if (!fs.existsSync(draftPath)) {
  console.error(`HATA: taslak yok: ${draftPath}`);
  console.error('İpucu: node mcp/cli.mjs list');
  process.exit(1);
}
const draft = JSON.parse(fs.readFileSync(draftPath, 'utf8'));
const current = draft.styles?.template;

let templates;
if (has('all')) {
  templates = TEMPLATES;
} else {
  const only = flag('templates');
  if (typeof only === 'string') {
    const ids = only.split(',').map((s) => s.trim()).filter(Boolean);
    const unknown = ids.filter((id) => !templateById(id));
    if (unknown.length) {
      console.error(`HATA: bilinmeyen şablon: ${unknown.join(', ')}`);
      console.error(`Geçerli: ${TEMPLATES.map((t) => t.id).join(', ')}`);
      process.exit(1);
    }
    templates = ids.map((id) => templateById(id));
  } else {
    const tpl = templateById(current);
    if (!tpl) {
      console.error(`HATA: taslağın şablonu bilinmiyor: "${current}". --all ile hepsini ölçebilirsiniz.`);
      process.exit(1);
    }
    templates = [tpl];
  }
}

const up = await checkServer();
if (!up.ok) {
  console.error(`HATA: önizleme sunucusu kapalı — ${PREVIEW_URL}`);
  console.error(`      ${up.error || `HTTP ${up.status}`}`);
  console.error(`      Başlat: ${START_HINT}`);
  process.exit(1);
}

const { chromium } = await import('playwright');
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } });
const page = await ctx.newPage();

const results = [];
try {
  for (const tpl of templates) {
    await mountDraft(page, draft, slug, { template: tpl.id });
    const m = await measureA4(page, { offenders: has('verbose') || has('json') });
    const trim = estimateTrimChars(m);
    results.push({
      id: tpl.id,
      name: tpl.name,
      budget: tpl.pageBudget,
      fits: fits(m),
      ...m,
      trimChars: trim,
    });
  }
} finally {
  await ctx.close();
  await browser.close();
}

if (has('json')) {
  process.stdout.write(
    JSON.stringify(
      {
        slug,
        previewUrl: PREVIEW_URL,
        a4Px: Math.round(A4_HEIGHT_PX),
        currentTemplate: current,
        results,
        blocking: results.filter((r) => !r.fits).length,
      },
      null,
      2,
    ) + '\n',
  );
} else {
  console.log(`\nA4 = ${Math.round(A4_HEIGHT_PX)} px (297 mm) · ${PREVIEW_URL} · ${slug}`);
  if (templates.length === 1) console.log(`Şablon: ${templates[0].id}${templates[0].id === current ? ' (taslaktaki)' : ''}`);
  console.log('');
  console.log('ŞABLON              DURUM   YÜKSEKLİK        TAŞMA      METİN   BÜTÇE');
  for (const r of results) {
    const mark = r.id === current ? '*' : ' ';
    console.log(
      `${mark}${r.id.padEnd(18)} ${(r.fits ? 'SIGAR' : 'TASAR').padEnd(6)} ` +
        `${String(r.contentHeight).padStart(6)}px  ${String(r.overflowMm).padStart(8)}mm  ` +
        `${String(r.textChars).padStart(6)}  %${String(Math.round((r.textChars / r.budget) * 100)).padStart(4)}`,
    );
  }
  console.log('');

  const bad = results.filter((r) => !r.fits);
  for (const r of bad) {
    console.log(`✗ ${r.id}: ${r.overflowMm} mm taşıyor → ~${r.trimChars} karakter kısaltın`);
    if (r.offenders?.length) {
      for (const o of r.offenders.filter((x) => !x.decorative).slice(0, 6)) {
        const mm = ((Math.max(o.overBottom, o.overRight) / 96) * 25.4).toFixed(1);
        console.log(`    +${mm}mm <${o.tag}> "${o.text || '(boş)'}"`);
      }
    }
  }
  if (bad.length) {
    console.log('');
    console.log('Kısaltma sırası: uzun deneyim açıklaması → uzun proje açıklaması → özet → eğitim açıklaması');
    console.log('Alternatifler: staj/eski kaydı çıkar, proje sayısını azalt, density="compact"');
  } else {
    console.log(`✓ ${results.length} şablonun tamamı A4 tek sayfaya sığıyor.`);
  }
  console.log('');
}

const blocking = results.filter((r) => !r.fits).length;
process.exit(blocking ? 2 : 0);
