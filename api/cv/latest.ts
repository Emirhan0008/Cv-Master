/**
 * /api/cv/latest â€” en son yazÄ±lan CV.
 *
 * GET /api/cv/latest?token=...  â†’ { slug, title, updatedAt, data }
 *
 * Site bu ucu Ã§aÄŸÄ±rarak CLI'Ä±n gÃ¶nderdiÄŸi CV'yi iÃ§e aktarÄ±r.
 */

import { checkAuth, getLatest, getCV, assertSlug, storeInfo } from '../_store.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'YalnÄ±zca GET destekleniyor.' });
  }

  const auth = checkAuth(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error, store: storeInfo });

  try {
    const slug = req.query?.slug ? assertSlug(req.query.slug) : null;
    const record = slug ? await getCV(slug) : await getLatest();

    if (!record) {
      return res.status(404).json({ error: 'KayÄ±tlÄ± CV yok.', store: storeInfo });
    }

    return res.status(200).json({
      slug: record.slug,
      title: record.title,
      updatedAt: record.updatedAt,
      data: record.data,
    });
  } catch (error: any) {
    return res.status(400).json({ error: error?.message || 'Okuma baÅŸarÄ±sÄ±z.' });
  }
}
