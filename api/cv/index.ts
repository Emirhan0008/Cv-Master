/**
 * /api/cv â€” CV toplama ucu.
 *
 * GET    /api/cv            â†’ kayÄ±tlÄ± CV listesi (slug, baÅŸlÄ±k, tarih)
 * POST   /api/cv            â†’ CV yazar. GÃ¶vde: tek CV objesi veya {slug, cv}
 * DELETE /api/cv?slug=...   â†’ CV siler
 *
 * Kimlik doÄŸrulama: `Authorization: Bearer <CV_API_TOKEN>` (veya ?token=)
 */

import { checkAuth, putCV, readIndex, deleteCV, storeInfo } from '../_store.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'GET, POST, DELETE, OPTIONS');
    return res.status(204).end();
  }

  const auth = checkAuth(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error, store: storeInfo });

  try {
    if (req.method === 'GET') {
      const drafts = await readIndex();
      return res.status(200).json({ count: drafts.length, drafts, store: storeInfo });
    }

    if (req.method === 'POST') {
      const body = req.body ?? {};
      // Ä°ki biÃ§im desteklenir: { slug, cv: {...} } veya doÄŸrudan CV objesi
      const cv = body.cv ?? body;
      const slug = body.slug ?? body.cvSlug ?? undefined;
      const entry = await putCV(cv, slug);
      return res.status(200).json({ ok: true, ...entry, store: storeInfo });
    }

    if (req.method === 'DELETE') {
      const slug = req.query?.slug ?? req.body?.slug;
      if (!slug) return res.status(400).json({ error: 'slug gerekli.' });
      const removed = await deleteCV(String(slug));
      if (!removed) return res.status(404).json({ error: `CV bulunamadÄ±: ${slug}` });
      return res.status(200).json({ ok: true, deleted: slug });
    }

    res.setHeader('Allow', 'GET, POST, DELETE, OPTIONS');
    return res.status(405).json({ error: 'Desteklenmeyen metot.' });
  } catch (error: any) {
    return res.status(400).json({ error: error?.message || 'Ä°ÅŸlem baÅŸarÄ±sÄ±z.' });
  }
}
