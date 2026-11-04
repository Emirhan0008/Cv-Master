/**
 * Ortak A4 ölçüm modülü — pdf / debug / gallery / fit aynı sayıyı görsün.
 *
 * Neden ayrı dosya: aynı ölçüm 4 yerde kopyalanmıştı ve zamanla ayrıştı
 * (galeri ekran medyasında, PDF print medyasında ölçüyordu → aynı CV için
 * farklı "taşma" sayıları). Tek kaynak: bu dosya.
 *
 * Kritik kural:
 *   #cv-preview-page min-height:297mm + overflow:visible olduğu için element
 *   A4'ten UZUN olabilir. Baseline elementin kendi kutusu DEĞİL, gerçek A4
 *   yüksekliğidir (1122.52 px). Aksi halde 1. sayfa dışında kalan içerik
 *   PDF'te sessizce kırpılır.
 */

/** A4 yüksekliği CSS px (96 dpi): 297 mm */
export const A4_HEIGHT_PX = (297 / 25.4) * 96;
/** A4 genişliği CSS px (96 dpi): 210 mm */
export const A4_WIDTH_PX = (210 / 25.4) * 96;

export const PREVIEW_URL = (process.env.CV_PREVIEW_URL || 'http://localhost:3010').replace(/\/+$/, '');

export const START_HINT = 'PORT=3010 npx tsx server.ts   (PowerShell: $env:PORT=3010; npx tsx server.ts)';

/** Dev sunucu ayakta mı? Net hata mesajı için önce bunu çağır. */
export async function checkServer(url = PREVIEW_URL, timeoutMs = 4000) {
  try {
    const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(timeoutMs) });
    return { ok: res.ok || res.status === 404, url, status: res.status };
  } catch (err) {
    return { ok: false, url, error: err?.message || String(err) };
  }
}

/**
 * Taslağı önizleme sayfasına yükler (localStorage → reload → #cv-preview-page).
 * @param {import('playwright').Page} page
 * @param {object} draft  CV JSON'u
 * @param {string} slug
 */
export async function mountDraft(page, draft, slug, { template } = {}) {
  const rec = JSON.parse(JSON.stringify(draft));
  rec.id = slug;
  rec.updatedAt = new Date().toISOString();
  if (template) rec.styles = { ...(rec.styles || {}), template };

  await page.goto(PREVIEW_URL, { waitUntil: 'domcontentloaded' });
  await page.evaluate((data) => {
    localStorage.setItem('cv_builder_saved_cvs', JSON.stringify([data]));
    localStorage.setItem('cv_builder_active_id', data.id);
  }, rec);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#cv-preview-page', { state: 'visible', timeout: 15000 });
  await page.waitForTimeout(800);
  return rec;
}

/**
 * Gerçek A4 taşmasını ölçer. PDF ile aynı sonucu vermesi için print medyası
 * uygulanmış olmalı (bkz. measureA4).
 */
export async function measurePage(page, { offenders = false } = {}) {
  return page.evaluate(
    ({ A4, wantOffenders }) => {
      const root = document.querySelector('#cv-preview-page');
      if (!root) return { error: '#cv-preview-page bulunamadı' };
      const box = root.getBoundingClientRect();
      const pageWidth = box.width;
      const list = [];
      let bottom = 0;
      let textChars = 0;

      for (const el of root.querySelectorAll('*')) {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;

        const txt = (el.textContent || '').trim();
        if (el.children.length === 0 && txt) {
          textChars += txt.length;
          const r = el.getBoundingClientRect();
          if (r.height > 0) {
            const rel = r.bottom - box.top;
            if (rel > bottom) bottom = rel;
          }
        }

        if (!wantOffenders) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) continue;
        const relBottom = r.bottom - box.top;
        const relRight = r.right - box.left;
        if (relBottom > A4 + 1 || relRight > pageWidth + 1) {
          list.push({
            tag: el.tagName.toLowerCase(),
            text: txt.slice(0, 60),
            overBottom: Math.round(relBottom - A4),
            overRight: Math.round(relRight - pageWidth),
            printable: !!(el.offsetParent || cs.position === 'fixed'),
            decorative: cs.position === 'absolute' && !txt,
          });
        }
      }

      const contentHeight = Math.round(bottom);
      const overflowPx = Math.round(bottom - A4);
      return {
        contentHeight,
        overflowPx,
        overflowMm: +(((bottom - A4) / 96) * 25.4).toFixed(1),
        clippedLeaves: overflowPx > 1 ? list.filter((o) => !o.decorative).length : 0,
        textChars,
        a4: Math.round(A4),
        offenders: wantOffenders ? list.slice(0, 15) : [],
        totalOffenders: list.length,
      };
    },
    { A4: A4_HEIGHT_PX, wantOffenders: offenders },
  );
}

/** Print medyasına geçip ölçer — PDF ile birebir aynı geometri. */
export async function measureA4(page, opts = {}) {
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(opts.settleMs ?? 350);
  return measurePage(page, opts);
}

/**
 * Taşmayı kapatmak için kabaca kaç görünür karakter kırpılmalı?
 * (karakter başına düşen px, mevcut doluluktan tahmin edilir)
 */
export function estimateTrimChars(m) {
  if (!m || m.overflowPx <= 1 || !m.contentHeight || !m.textChars) return 0;
  return Math.max(1, Math.round((m.textChars * m.overflowPx) / m.contentHeight));
}

export function fits(m) {
  return !!m && m.overflowPx <= 1 && (m.clippedLeaves || 0) === 0;
}

/** Tek satırlık okunur özet: "SIGAR 1123px (0mm) · 2665 krkt" */
export function summary(m, budget) {
  if (!m || m.error) return `ölçülemedi (${m?.error || '?'})`;
  const state = fits(m) ? 'SIGAR' : 'TASAR';
  const pct = budget ? ` · bütçe %${Math.round((m.textChars / budget) * 100)}` : '';
  return `${state} ${m.contentHeight}px (${m.overflowMm}mm) · ${m.textChars} krkt${pct}`;
}
