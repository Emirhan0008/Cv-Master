/**
 * Şablon doğrulama koşumu — ekran ile print/PDF geometrisini karşılaştırır.
 *
 * Kullanım: node mcp/tpl-verify.mjs [--json] [--only tpl1,tpl2]
 *
 * Ölçtüğü şeyler (her şablon için, ekran VE print):
 *   - içerik yüksekliği (A4 = 1122.52 px)
 *   - fotoğraf: var mı, kutu ölçüsü, yarıçap, içerik kırpılıyor mu
 *     (modern-geometric fotoğrafı <svg><image href> ile çizer; `img` seçicisi
 *      onu görmez — bu yüzden iki seçici de denenir)
 *   - iletişim 8 alanının görünürlüğü ve ikon/etiket tipi
 *   - beceri kategori başlıkları
 *   - geçersiz Tailwind sınıfı kalıntısı (amber-550 gibi renk → currentColor)
 *   - ekran vs print yükseklik farkı
 */
import fs from 'node:fs';
import { chromium } from 'playwright';
import { mountDraft, A4_HEIGHT_PX } from './measure.mjs';

export const TEMPLATES = [
  'corporate', 'modern', 'depth3d', 'modern-geometric', 'split-sidebar',
  'minimalist-clean', 'editorial-serif', 'tech-mono', 'crimson-split',
  'teal-timeline', 'dark-gold-arch',
];

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const onlyIdx = args.indexOf('--only');
const templates = onlyIdx >= 0 ? args[onlyIdx + 1].split(',') : TEMPLATES;

const base = JSON.parse(
  fs.readFileSync('W:/Cv-Master/cv-data/drafts/mavi-mega-rehber-2026.json', 'utf8'),
);
base.styles.pageGuide = false;

const probe = probeFn;

function probeFn(data) {
  const root = document.querySelector('#cv-preview-page');
  const rootBox = root.getBoundingClientRect();
  const txt = root.innerText || '';
  const txtNorm = txt.toLowerCase().replace(/\s+/g, ' ');
  const vis = (el) => {
    const cs = getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && el.getBoundingClientRect().height > 0;
  };

  let contentHeight = 0;
  for (const el of root.querySelectorAll('*')) {
    if (el.children.length === 0 && (el.textContent || '').trim() && vis(el)) {
      const b = el.getBoundingClientRect().bottom - rootBox.top;
      if (b > contentHeight) contentHeight = b;
    }
  }

  // fotoğraf: <img src=data:> veya <image href=data:>
  const img = root.querySelector('img[src^="data:"]');
  const svgImage = root.querySelector('image[href^="data:"]');
  let photo = { kind: 'YOK' };
  const target = img || svgImage;
  if (target) {
    const cs = getComputedStyle(target);
    const b = target.getBoundingClientRect();
    const minSide = Math.min(b.width, b.height);
    const radius = parseFloat(cs.borderTopLeftRadius) || 0;
    photo = {
      kind: img ? 'img' : 'svg-image',
      w: +b.width.toFixed(1),
      h: +b.height.toFixed(1),
      radius: cs.borderTopLeftRadius,
      radiusPx: +radius.toFixed(1),
      overflow: cs.overflow,
      clipPath: cs.clipPath,
      // yuvarlak mı: yarıçap kısa kenarın yarısına yakın veya ≥4px ve kırpma var
      rounded: radius > 2,
      clipped: cs.overflow === 'hidden' || cs.clipPath !== 'none',
    };
  }

  // bölüm sayıları: id'ler her şablonda yok — metinden say
  const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ');
  const has = (needle) => txtNorm.includes(norm(needle));
  const cnt = (arr) => (arr || []).filter((x) => x && has(x)).length;

  // iletişim: değer + etiket tipi
  const contact = {};
  const map = {
    phone: norm('538 933'),
    email: norm('emirhan0008@gmail.com'),
    location: norm('gürsu'),
    website: norm('emirhanyilmaz.vercel.app'),
    birthDate: norm('28.03.1995'),
    birthPlace: norm('artvin'),
    maritalStatus: norm('bekar'),
    driverLicense: norm('ehliyet'),
  };
  for (const [k, v] of Object.entries(map)) contact[k] = txtNorm.includes(v);

  const wordLabels = ['telefon', 'e-posta', 'adres / konum', 'doğum tarihi', 'doğum yeri', 'medeni durum', 'ehliyet', 'websitesi'];
  const wordCount = wordLabels.filter((w) => txtNorm.includes(w)).length;
  const codeLabels = ['email:', 'phone:', 'address:', 'birthdate:', 'birthplace:', 'maritalstatus:', 'driverlicense:', 'site:'];
  const codeCount = codeLabels.filter((c) => txtNorm.includes(c)).length;

  /* İletişim etiketi tipi — İKON SAYISI GLOBAL DEĞİL, DEĞERE YAKIN sayılır.
     Global `svg` saymak yanıltıyordu: bölüm başlığı ikonları da sayılıp
     tech-mono "6/8 ikon" görünüyordu; oysa tech-mono bilinçli olarak
     `email:` / `phone:` kod etiketi kullanır (tasarım dili). Bu yüzden her
     iletişim DEĞERİNİN yanında (en fazla 3 üst ata içinde) lucide ikon
     aranır. */
  const valueNeedles = [
    '538 933 5550',
    'emirhan0008@gmail.com',
    'Bursa / Gürsu',
    'emirhanyilmaz.vercel.app',
    '28.03.1995',
    'Artvin / Yusufeli',
  ];
  let withIcon = 0;
  for (const needle of valueNeedles) {
    const el = Array.from(root.querySelectorAll('*')).find(
      (e) => e.children.length === 0 && (e.textContent || '').includes(needle),
    );
    if (!el) continue;
    let row = el.parentElement;
    let found = false;
    for (let i = 0; i < 3 && row && row !== root; i++) {
      const svg = Array.from(row.querySelectorAll('svg')).some((s) =>
        (s.getAttribute('class') || '').includes('lucide'),
      );
      if (svg) { found = true; break; }
      row = row.parentElement;
    }
    if (found) withIcon++;
  }

  const lucide = root.querySelectorAll('svg[class*="lucide"], svg.lucide').length;
  /* Harf kısaltması kontrolü — kullanıcı şartı: "T:", "@:" gibi harf etiketi
     kullanılmayacak, yerine SVG ikon gelecek. Kelime alt etiketi (ör.
     teal-timeline'da ikon üstte + "Doğum Tarihi" altta) tasarım tercihidir,
     kusur değil; bu yüzden ayrı sayılır ve sorun olarak raporlanmaz. */
  const abbrev = (txt.match(/(^|\n)\s*(T|A|D|Y|M|E|W|@)\s*:/g) || []).length;
  contact.iconPerField = withIcon;
  /* tech-mono bilinçli olarak `email:` / `phone:` kod etiketi kullanır —
     tasarım dili budur, kusur değil. `kod` durumu geçerli sayılır. */
  contact.labelStyle =
    codeCount >= 4 ? 'kod'
      : abbrev > 0 ? 'harf'
        : withIcon >= 6 ? 'ikon'
          : 'eksik';
  contact.abbrev = abbrev;
  contact.wordLabels = wordCount;
  contact.codeLabels = codeCount;
  contact.lucide = lucide;

  // beceri kategorileri
  const cats = ['Okul Rehberliği', 'Öğrenci Desteği ve Takip', 'Dijital Araçlar'];
  const catVisible = cats.filter((c) => has(c)).length;

  // geçersiz amber-550 → currentColor
  let badBorder = 0;
  for (const el of root.querySelectorAll('[class*="amber-550"]')) {
    const cs = getComputedStyle(el);
    if (cs.borderLeftColor === cs.color || cs.borderLeftColor === 'rgb(255, 255, 255)') badBorder++;
  }

  return {
    contentHeight: Math.round(contentHeight),
    overflowPx: Math.round(contentHeight - 1122.52),
    photo,
    counts: {
      exp: cnt((data.workExperiences || []).map((w) => w.company)),
      proj: cnt((data.projects || []).map((p) => p.name)),
      edu: cnt((data.educations || []).map((e) => e.school)),
      skillCats: cnt((data.skills || []).map((s) => s.categoryName)),
      custom: cnt((data.customSections || []).map((c) => c.title)),
    },
    contact,
    catVisible,
    svgs: root.querySelectorAll('svg').length,
    badBorder,
    textChars: txt.replace(/\s+/g, '').length,
  };
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1500, height: 1400 } });
const rows = [];

for (const tpl of templates) {
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message.slice(0, 100)));
  await mountDraft(page, base, 'verify-' + tpl, { template: tpl });
  // Web fontu (Inter) yüklenmeden ölçmek yanlış yükseklik verir: fallback
  // fontla satır yükseklikleri farklı olur ve "ekran ≠ print" sanılır.
  // Ayrıca otomatik sığdırma (auto-fit zoom) fontlar geldikten SONRA yeniden
  // hesaplanır; 900 ms'de ölçmek ara değeri yakalayıp sahte fark üretiyordu
  // (crimson-split 39px, gerçekte 0). İki medya da oturana kadar bekle.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2000);
  const screen = await page.evaluate(probe, base);
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(1600);
  const print = await page.evaluate(probe, base);
  rows.push({ tpl, screen, print, errs });
  await page.close();
}
await browser.close();

const A4 = Math.round(A4_HEIGHT_PX);
const issues = [];
for (const r of rows) {
  const p = r.print;
  if (p.overflowPx > 1) issues.push(`${r.tpl}: print taşma +${p.overflowPx}px`);
  if (p.counts.exp === 0) issues.push(`${r.tpl}: deneyim görünmüyor`);
  if (p.photo.kind === 'YOK') issues.push(`${r.tpl}: fotoğraf yok`);
  if (p.photo.kind !== 'YOK' && p.photo.rounded && !p.photo.clipped) issues.push(`${r.tpl}: fotoğraf print'te kırpılmıyor (kare riski)`);
  if (p.contact.labelStyle === 'harf') issues.push(`${r.tpl}: iletişimde harf kısaltması etiketi (${p.contact.abbrev})`);
  if (p.contact.labelStyle === 'eksik') issues.push(`${r.tpl}: iletişim ikonları eksik (${p.contact.iconPerField}/6 değer)`);
  if (p.catVisible < 3) issues.push(`${r.tpl}: beceri kategorisi ${p.catVisible}/3`);
  if (p.badBorder > 0) issues.push(`${r.tpl}: amber-550 geçersiz → ${p.badBorder} kenarlık currentColor`);
  if (Math.abs(p.contentHeight - r.screen.contentHeight) > 3)
    issues.push(`${r.tpl}: ekran/print yükseklik farkı ${p.contentHeight - r.screen.contentHeight}px`);
  if (r.errs.length) issues.push(`${r.tpl}: sayfa hatası ${r.errs[0]}`);
}

if (asJson) {
  console.log(JSON.stringify({ rows, issues }, null, 2));
} else {
  console.log('A4 = ' + A4 + 'px\n');
  const H = (s) => String(s).padEnd(9);
  console.log('ŞABLON'.padEnd(18), H('EKRAN'), H('PRINT'), H('FARK'), H('FOTO'), H('İKON'), H('KAT'), H('HATA'));
  for (const r of rows) {
    const p = r.print;
    const photo = p.photo.kind === 'YOK' ? 'YOK' : `${p.photo.kind === 'img' ? 'img' : 'svg'}:${Math.round(p.photo.w)}x${Math.round(p.photo.h)}${p.photo.rounded ? (p.photo.clipped ? ' R' : ' !KARE') : ''}`;
    console.log(
      r.tpl.padEnd(18),
      H(r.screen.contentHeight),
      H(p.contentHeight),
      H(p.contentHeight - r.screen.contentHeight),
      H(photo),
      H(p.contact.labelStyle),
      H(p.catVisible + '/3'),
      H(p.badBorder || '-'),
    );
  }
  console.log('\n' + (issues.length ? `⚠ ${issues.length} SORUN:` : '✓ sorun yok'));
  issues.forEach((i) => console.log('  - ' + i));
}
process.exitCode = issues.length ? 2 : 0;
