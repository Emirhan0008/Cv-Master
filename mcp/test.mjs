/**
 * Hızlı duman testi: çekirdek mantığı geçici bir dizinde dener.
 * Çalıştırma: npm run cv:test
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cvm-test-'));
process.env.CV_MASTER_DIR = tmp;

const { runCommand } = await import('./core.mjs');

let pass = 0;
let fail = 0;

function check(name, fn) {
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    fail++;
    console.log(`  ✗ ${name}\n      ${e.message}`);
  }
}

const eq = (a, b, msg) => {
  if (a !== b) throw new Error(`${msg || ''} beklenen=${JSON.stringify(b)} gelen=${JSON.stringify(a)}`);
};
const ok = (v, msg) => { if (!v) throw new Error(msg || 'false döndü'); };

console.log('Cv-Master CLI/MCP çekirdek testi');
console.log(`  geçici dizin: ${tmp}\n`);

check('şema 10 şablon ve sınırları döndürür', () => {
  const s = runCommand('schema');
  eq(s.templates.length, 11, 'şablon sayısı');
  ok(s.limits.summary > 0, 'limits.summary');
  ok(Array.isArray(s.fieldSchema.personalInfo ? Object.keys(s.fieldSchema.personalInfo) : []));
});

check('taslak oluşturur', () => {
  const r = runCommand('create', { slug: 'test-cv', title: 'Test CV', template: 'split-sidebar' });
  ok(r.ok);
  eq(r.template, 'split-sidebar');
  ok(fs.existsSync(path.join(tmp, 'cv-data', 'drafts', 'test-cv.json')));
});

check('tek çağrıda tüm içeriği yazar', () => {
  const r = runCommand('apply', {
    slug: 'test-cv',
    personalInfo: {
      name: 'Test Kişi', title: 'Rehber Öğretmen', email: 'test@ornek.com',
      phone: '+90 500 000 00 00', location: 'Bursa / Gürsu', summary: 'Kısa özet.',
    },
    workExperiences: [
      { company: 'Okul A', role: 'Öğretmen', startDate: '2023-09', endDate: '2026-06', description: 'Ders yürüttüm.' },
      { company: 'Okul B', role: 'Öğretmen', startDate: '2026-09', current: true, endDate: '2026-12', description: 'Devam ediyor.' },
    ],
    educations: [{ school: 'Aksaray Üniversitesi', degree: 'Lisans', field: 'PDR', startDate: '2013-09', endDate: '2018-06' }],
    projects: [{ name: 'Proje', description: 'Bir işe yarıyor.', technologies: 'React' }],
    skills: [{ categoryName: 'Yetkinlik', skills: ['Bir', { name: 'İki', level: 5 }] }],
    socialLinks: [{ platform: 'LinkedIn', url: 'https://linkedin.com/in/x' }],
    customSections: [{ title: 'Sertifikalar', content: '• A\n• B' }],
    sectionOrder: ['personal', 'summary', 'projects', 'experience', 'education', 'skills', 'custom'],
  });
  ok(r.ok, 'apply ok');
  eq(r.validation.errors.length, 0, 'hata yok');
  eq(r.validation.stats.experience, 2);
});

check('current=true iken endDate temizlenir', () => {
  const { cv } = runCommand('read', { slug: 'test-cv' });
  const devam = cv.workExperiences.find((e) => e.current);
  eq(devam.endDate, '', 'endDate');
});

check('"Günümüz" metni tarihe yazılmaz', () => {
  runCommand('apply', {
    slug: 'test-cv',
    workExperiences: [{ company: 'X', role: 'Y', startDate: '2020-01', endDate: 'Günümüz', description: '' }],
  });
  const { cv } = runCommand('read', { slug: 'test-cv' });
  eq(cv.workExperiences[0].endDate, '', 'endDate');
});

check('YYYY/MM → YYYY-MM normalize edilir', () => {
  runCommand('apply', {
    slug: 'test-cv',
    educations: [{ school: 'S', field: 'F', startDate: '2013/9', endDate: '2018/6' }],
  });
  const { cv } = runCommand('read', { slug: 'test-cv' });
  eq(cv.educations[0].startDate, '2013-09');
  eq(cv.educations[0].endDate, '2018-06');
});

check('yetkinlik seviyesi 1-5 aralığına kırpılır', () => {
  runCommand('apply', { slug: 'test-cv', skills: [{ categoryName: 'C', skills: [{ name: 'A', level: 9 }, { name: 'B', level: -3 }] }] });
  const { cv } = runCommand('read', { slug: 'test-cv' });
  eq(cv.skills[0].skills[0].level, 5);
  eq(cv.skills[0].skills[1].level, 1);
});

check('şablon değişince palet varsayılana döner', () => {
  const r = runCommand('style', { slug: 'test-cv', template: 'crimson-split' });
  eq(r.styles.template, 'crimson-split');
  eq(r.styles.primaryColor, '#A22A38');
});

check('şablonla birlikte verilen açık renk ezilmez', () => {
  // Regresyon: applyPatch şablon varsayılanlarını sonradan yazıp kullanıcının
  // aynı payload'da verdiği rengi sessizce siliyordu.
  const r = runCommand('style', {
    slug: 'test-cv',
    template: 'modern-geometric',
    primaryColor: '#0b1f3a',
    secondaryColor: '#1d4ed8',
    accentColor: '#0ea5e9',
    font: 'inter',
  });
  eq(r.styles.template, 'modern-geometric');
  eq(r.styles.primaryColor, '#0b1f3a', 'primaryColor korunmalı');
  eq(r.styles.secondaryColor, '#1d4ed8', 'secondaryColor korunmalı');
  eq(r.styles.accentColor, '#0ea5e9', 'accentColor korunmalı');
  eq(r.styles.font, 'inter', 'font korunmalı');
});

check('şablonla verilmeyen renk varsayılandan gelir', () => {
  const r = runCommand('style', { slug: 'test-cv', template: 'corporate', primaryColor: '#123456' });
  eq(r.styles.primaryColor, '#123456', 'açık renk');
  eq(r.styles.accentColor, '#0284c7', 'şablon varsayılanı');
});

check('bilinmeyen şablon hataya düşmez, korunur', () => {
  const r = runCommand('style', { slug: 'test-cv', template: 'yok-boyle' });
  ok(r.notes.some((n) => n.includes('Bilinmeyen şablon')));
  ok(r.styles.template !== 'yok-boyle');
});

check('eksik zorunlu alanı yakalar', () => {
  runCommand('create', { slug: 'bos-cv' });
  const r = runCommand('validate', { slug: 'bos-cv' });
  eq(r.ok, false);
  ok(r.errors.some((e) => e.includes('personalInfo.name')));
  ok(r.errors.some((e) => e.includes('educations')));
});

check('tek sayfa bütçesi aşımını bildirir', () => {
  runCommand('create', { slug: 'dolu-cv', template: 'modern-geometric' });
  runCommand('apply', {
    slug: 'dolu-cv',
    personalInfo: { name: 'A', title: 'B', email: 'a@b.co', summary: 'x'.repeat(520) },
    workExperiences: Array.from({ length: 4 }, (_, i) => ({
      company: `Şirket ${i}`, role: 'Rol', startDate: '2020-01', endDate: '2021-01', description: 'y'.repeat(340),
    })),
    educations: [{ school: 'S', field: 'F' }],
    projects: Array.from({ length: 5 }, (_, i) => ({ name: `P${i}`, description: 'z'.repeat(280), technologies: 'a' })),
    skills: [{ categoryName: 'Kategori', skills: ['Bir', 'İki', 'Üç', 'Dört'] }],
  });
  const r = runCommand('validate', { slug: 'dolu-cv' });
  ok(r.stats.fillRatio > 1, `doluluk ${r.stats.fillRatio}`);
  ok(r.warnings.some((w) => w.includes('bütçesi aşılıyor')));
  ok(r.suggestions.length > 0, 'kısaltma önerisi yok');
});

check('ikinci taslak ayrı dosyaya yazılır', () => {
  const r = runCommand('list');
  ok(r.count >= 3, `count=${r.count}`);
});

check('dışa aktarım uygulama şemasıyla uyumlu', () => {
  const r = runCommand('export', { slug: 'test-cv' });
  ok(r.ok);
  const cv = JSON.parse(fs.readFileSync(r.exportPath, 'utf8'));
  for (const k of ['id', 'title', 'personalInfo', 'workExperiences', 'educations', 'projects', 'skills', 'socialLinks', 'customSections', 'sectionOrder', 'styles']) {
    ok(k in cv, `${k} eksik`);
  }
  ok(['corporate', 'modern', 'depth3d', 'modern-geometric', 'split-sidebar', 'minimalist-clean', 'editorial-serif', 'tech-mono', 'crimson-split', 'teal-timeline', 'dark-gold-arch'].includes(cv.styles.template));
  ok(['x'].every(() => ['inter', 'spaceGrotesk', 'playfair', 'jetbrains'].includes(cv.styles.font)));
});

check('geçersiz slug reddedilir', () => {
  let threw = false;
  try { runCommand('read', { slug: '../../etc/passwd' }); } catch { threw = true; }
  ok(threw, 'yol kaçışı engellenmedi');
});

fs.rmSync(tmp, { recursive: true, force: true });

console.log(`\n  ${pass} geçti, ${fail} başarısız`);
process.exit(fail === 0 ? 0 : 1);
