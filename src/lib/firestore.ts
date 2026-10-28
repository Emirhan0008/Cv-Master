import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { CVData } from '../types';

/**
 * Firestore veri modeli:
 *   users/{uid}                  -> { email, displayName, updatedAt }
 *   users/{uid}/cvs/{localId}    -> { title, data(JSON string), updatedAt }
 *
 * Güvenlik: `firestore.rules` sadece request.auth.uid == uid olan erişime izin verir.
 */

export interface CloudCVRecord {
  localId: string;
  title: string;
  data: string;
  updatedAt: string | null;
}

function requireDb() {
  if (!db) throw new Error('Bulut yapılandırılmamış (Firebase ayarları eksik).');
  return db;
}

function userDoc(uid: string) {
  return doc(requireDb(), 'users', uid);
}

function cvsCollection(uid: string) {
  return collection(requireDb(), 'users', uid, 'cvs');
}

/** Kullanıcı profil dokümanını oluşturur/günceller. */
export async function syncProfile(uid: string, email: string | null, displayName: string | null) {
  await setDoc(
    userDoc(uid),
    {
      email: email || '',
      displayName: displayName || '',
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

/** Buluttaki tüm CV'leri getirir. */
export async function listCloudCVs(uid: string): Promise<CloudCVRecord[]> {
  const snap = await getDocs(query(cvsCollection(uid), orderBy('updatedAt', 'desc')));
  return snap.docs.map((d) => {
    const v = d.data() as { title?: string; data?: string; updatedAt?: { toDate?: () => Date } };
    let iso: string | null = null;
    try {
      iso = v.updatedAt?.toDate ? v.updatedAt.toDate().toISOString() : null;
    } catch {
      iso = null;
    }
    return {
      localId: d.id,
      title: v.title || 'İsimsiz Özgeçmiş',
      data: v.data || '{}',
      updatedAt: iso,
    };
  });
}

/** Tek bir CV'yi buluta kaydeder (varsa üzerine yazar). */
export async function saveCloudCV(uid: string, cv: CVData) {
  const localId = cv.id || `${Date.now()}`;
  await setDoc(doc(cvsCollection(uid), localId), {
    title: cv.title || cv.personalInfo?.name || 'İsimsiz Özgeçmiş',
    data: JSON.stringify(cv),
    updatedAt: serverTimestamp(),
  });
  return localId;
}

/** Buluttan bir CV'yi siler. */
export async function deleteCloudCV(uid: string, localId: string) {
  await deleteDoc(doc(cvsCollection(uid), localId));
}

/** Bulutta kayıt var mı? (ilk senkron kontrolü için) */
export async function hasCloudCV(uid: string, localId: string): Promise<boolean> {
  const snap = await getDoc(doc(cvsCollection(uid), localId));
  return snap.exists();
}

export function safeParseCV(raw: string): CVData | null {
  try {
    return JSON.parse(raw) as CVData;
  } catch {
    return null;
  }
}
