/**
 * Şablon matrisi — her tasarımda CLI'ın çalıştığını doğrular.
 *
 *   node mcp/templates-check.mjs [slug]
 *
 * Her şablon için: style → validate → pdf çalıştırır; sayfa sayısı,
 * taşma (mm), kırpılan öğe, dosya boyutu ve bütçe raporlanır.
 * Bitince taslak son şablonda bırakılmaz: --restore (varsayılan modern-geometric)
 * ile geri döner ve Downloads'a son PDF'i yazar.
 *
 * Çıkış kodu: hepsi geçerse 0, en az bir şablon başarısızsa 1.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SLUG = process.argv[2] || 'rehber-ogretmen-ilkokul-2026';
const RESTORE = 'modern-geometric';
const OUT_DIR = path.join(process.env.TEMP || '.', 'opencode', 'cv-templates');

const TEMPLATES = [
  'corporate',
  'modern',
  'modern-geometric',
  'split-sidebar',
  'depth3d',
  'minimalist-clean',
  'editorial-serif',
  'tech-mono',
  'crimson-split',
  'teal-timeline',
  'dark-gold-arch',
];

function run(args) {
  const r = spawnSync(process.execPath, ['mcp/cli.mjs', ...args], {
    cwd: PROJECT_DIR,
    encoding: 'utf8',
    timeout: 180000,
  });
  return { code: r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
}

function parseJson(text) {
  const start = text.indexOf('{');
  if (start < 0) return null;
  try {
    return JSON.parse(text.slice(start));
  } catch {
    return null;
  }
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const results = [];

for (const template of TEMPLATES) {
  const style = run(['style', SLUG, '--template', template]);
  const styleJson = parseJson(style.out);
  const styleOk = style.code === 0 && styleJson?.ok === true;

  const val = parseJson(run(['validate', SLUG]).out) || {};
  const stats = val.stats || {};

  const pdfFile = path.join(OUT_DIR, `cv-${template}.pdf`);
  const pdf = run(['pdf', SLUG, '--out', pdfFile]);
  const pages = /Sayfa:\s*(\d+)/.exec(pdf.out);
  const overflow = /Tasma:\s*(-?[\d.]+)\s*mm/.exec(pdf.out);
  const clipped = /Kirpilan oge:\s*(\d+)/.exec(pdf.out);
  const pdfOk = pdf.code === 0 && fs.existsSync(pdfFile);
  const bytes = pdfOk ? fs.statSync(pdfFile).size : 0;

  const row = {
    template,
    styleOk,
    pdfOk,
    pages: pages ? Number(pages[1]) : null,
    overflowMm: overflow ? Number(overflow[1]) : null,
    clipped: clipped ? Number(clipped[1]) : null,
    kb: Math.round(bytes / 1024),
    chars: stats.chars ?? null,
    budget: stats.budget ?? null,
    fill: stats.fillRatio ?? null,
    errors: (val.errors || []).length,
  };
  results.push(row);

  const pass = row.styleOk && row.pdfOk && row.pages === 1 && row.clipped === 0;
  console.log(
    `${pass ? '✓' : '✗'} ${template.padEnd(18)} style=${row.styleOk ? 'OK ' : 'FAIL'} ` +
      `pdf=${row.pdfOk ? 'OK ' : 'FAIL'} sayfa=${row.pages} tasma=${row.overflowMm}mm ` +
      `kirpilan=${row.clipped} ${row.kb}KB doluluk=${Math.round((row.fill || 0) * 100)}%`,
  );
}

// Son şablonu geri al ve son PDF'i Downloads'a yaz
run(['style', SLUG, '--template', RESTORE]);
const finalPdf = path.join(process.env.HOME || process.env.USERPROFILE || '.', 'Downloads', `${SLUG}.pdf`);
run(['pdf', SLUG, '--out', finalPdf]);

const failures = results.filter(
  (r) => !r.styleOk || !r.pdfOk || r.pages !== 1 || r.clipped !== 0,
);

const summary = {
  total: results.length,
  passed: results.length - failures.length,
  failed: failures.length,
  failureTemplates: failures.map((f) => f.template),
  restoredTemplate: RESTORE,
  finalPdf,
  outDir: OUT_DIR,
  results,
};

fs.writeFileSync(path.join(OUT_DIR, 'matrix.json'), JSON.stringify(summary, null, 2));

console.log(
  `\n${summary.passed}/${summary.total} şablon geçti` +
    (failures.length ? ` — başarısız: ${failures.map((f) => f.template).join(', ')}` : '') +
    `\nSon şablon: ${RESTORE} · PDF: ${finalPdf}` +
    `\nMatris: ${path.join(OUT_DIR, 'matrix.json')}`,
);

process.exit(failures.length ? 1 : 0);
