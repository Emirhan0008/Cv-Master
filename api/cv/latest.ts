/**
 * /api/cv/latest — en son yazılan CV.
 *
 * GET /api/cv/latest?token=...  → { slug, title, updatedAt, data }
 *
 * Site bu ucu çağırarak CLI'ın gönderdiği CV'yi içe aktarır.
 */

import { checkAuth, getLatest, getCV, assertSlug, storeInfo } from '../_store';

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Yalnızca GET destekleniyor.' });
  }

  const auth = checkAuth(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error, store: storeInfo });

  try {
    const slug = req.query?.slug ? assertSlug(req.query.slug) : null;
    const record = slug ? await getCV(slug) : await getLatest();

    if (!record) {
      return res.status(404).json({ error: 'Kayıtlı CV yok.', store: storeInfo });
    }

    return res.status(200).json({
      slug: record.slug,
      title: record.title,
      updatedAt: record.updatedAt,
      data: record.data,
    });
  } catch (error: any) {
    return res.status(400).json({ error: error?.message || 'Okuma başarısız.' });
  }
}
