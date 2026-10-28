import { useEffect, useState } from 'react';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  Cloud, LogIn, LogOut, Upload, Download, RefreshCw, CheckCircle2,
  AlertTriangle, Loader2, User as UserIcon,
} from 'lucide-react';
import { auth, googleAuthProvider, isCloudConfigured } from '../lib/firebase';
import { listCloudCVs, saveCloudCV, syncProfile, safeParseCV } from '../lib/firestore';
import type { CVData } from '../types';

interface CloudSyncManagerProps {
  cvData: CVData;
  triggerAlert?: (type: 'success' | 'info' | 'error', text: string) => void;
  /** Buluttan gelen CV'yi uygulamaya yükler. */
  onRestoreCV?: (cv: CVData) => void;
}

interface CloudItem {
  localId: string;
  title: string;
  data: string;
  updatedAt: string | null;
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('tr-TR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export default function CloudSyncManager({ cvData, triggerAlert, onRestoreCV }: CloudSyncManagerProps) {
  const [user, setUser] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<CloudItem[]>([]);
  const [lastSync, setLastSync] = useState<string>('');

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        syncProfile(u.uid, u.email, u.displayName).catch(() => undefined);
      } else {
        setItems([]);
      }
    });
    return () => unsub();
  }, []);

  const handleSignIn = async () => {
    if (!auth) return;
    setBusy(true);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      await syncProfile(result.user.uid, result.user.email, result.user.displayName);
      triggerAlert?.('success', `Hoş geldin ${result.user.displayName || result.user.email}! Bulut senkron aktif.`);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        triggerAlert?.('info', 'Giriş iptal edildi.');
      } else if (code === 'auth/unauthorized-domain') {
        triggerAlert?.('error', 'Bu alan adı Firebase yetkili alan adlarına eklenmemiş.');
      } else {
        triggerAlert?.('error', `Giriş başarısız: ${err?.message || err}`);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    if (!auth) return;
    await signOut(auth);
    triggerAlert?.('info', 'Bulut oturumu kapatıldı. Verilerin yerel olarak duruyor.');
  };

  const handleUpload = async () => {
    if (!user) return;
    setBusy(true);
    try {
      await saveCloudCV(user.uid, cvData);
      const now = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      setLastSync(now);
      triggerAlert?.('success', `CV buluta kaydedildi (${now}).`);
      await refreshList();
    } catch (err: any) {
      triggerAlert?.('error', `Buluta kaydedilemedi: ${err?.message || err}`);
    } finally {
      setBusy(false);
    }
  };

  const refreshList = async () => {
    if (!user) return;
    try {
      const list = await listCloudCVs(user.uid);
      setItems(list);
    } catch (err: any) {
      triggerAlert?.('error', `Bulut listesi alınamadı: ${err?.message || err}`);
    }
  };

  const handleRestore = (item: CloudItem) => {
    const parsed = safeParseCV(item.data);
    if (!parsed) {
      triggerAlert?.('error', 'Bulut kaydı okunamadı (bozuk veri).');
      return;
    }
    onRestoreCV?.(parsed);
    triggerAlert?.('success', `"${item.title}" buluttan geri yüklendi.`);
  };

  // --- Yapılandırma yok ---
  if (!isCloudConfigured) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-[10px] leading-relaxed text-gray-400">
          <strong className="text-amber-300">Bulut yapılandırılmamış.</strong><br />
          Firebase ortam değişkenleri (<code className="text-teal-400">VITE_FIREBASE_*</code>) tanımlı değil.
          Yerel kayıt ve JSON yedekleme çalışmaya devam eder.
        </div>
      </div>
    );
  }

  // --- Giriş yapılmamış ---
  if (!user) {
    return (
      <div className="space-y-2.5">
        <p className="text-[10px] leading-relaxed text-gray-400">
          Google ile giriş yaparsan CV'lerin buluta yedeklenir ve
          <strong className="text-[#E0E2E6]"> tüm cihazlarından</strong> erişebilirsin.
          Giriş yapmasan da her şey bu tarayıcıda çalışmaya devam eder.
        </p>
        <button
          onClick={handleSignIn}
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white text-[#1F2937] hover:bg-gray-100 text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-60"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
          Google ile giriş yap
        </button>
      </div>
    );
  }

  // --- Giriş yapılmış ---
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2 rounded-lg border border-teal-500/30 bg-teal-500/5 px-2.5 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <UserIcon className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-[#E0E2E6] truncate">
              {user.displayName || 'Kullanıcı'}
            </div>
            <div className="text-[9px] text-gray-500 truncate">{user.email}</div>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          title="Oturumu kapat"
          className="shrink-0 p-1.5 rounded-md text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleUpload}
          disabled={busy}
          className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-60"
        >
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
          Buluta Kaydet
        </button>
        <button
          onClick={refreshList}
          disabled={busy}
          className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg bg-[#1E222A] border border-[#2D3139] hover:border-teal-500/50 text-gray-300 hover:text-teal-300 text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className="w-3 h-3" />
          Bulutu Getir
        </button>
      </div>

      {lastSync && (
        <div className="flex items-center gap-1 text-[9px] text-teal-400">
          <CheckCircle2 className="w-3 h-3" />
          Son kayıt: {lastSync}
        </div>
      )}

      {items.length > 0 && (
        <div className="space-y-1.5 mt-1">
          <div className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">
            Buluttaki CV'ler ({items.length})
          </div>
          {items.map((item) => (
            <div
              key={item.localId}
              className="flex items-center justify-between gap-2 rounded-md bg-[#16191F] border border-[#2D3139]/60 px-2 py-1.5"
            >
              <div className="min-w-0">
                <div className="text-[10px] text-[#E0E2E6] truncate">{item.title}</div>
                <div className="text-[8px] text-gray-500">{formatDate(item.updatedAt)}</div>
              </div>
              <button
                onClick={() => handleRestore(item)}
                title="Bu CV'yi yükle"
                className="shrink-0 p-1.5 rounded text-gray-400 hover:text-teal-300 hover:bg-teal-500/10 transition-colors cursor-pointer"
              >
                <Download className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 && (
        <div className="flex items-center gap-1.5 text-[9px] text-gray-500">
          <Cloud className="w-3 h-3" />
          Henüz bulut kaydı yok. "Buluta Kaydet" ile başla.
        </div>
      )}
    </div>
  );
}
