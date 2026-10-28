import React, { useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User,
  GoogleAuthProvider
} from 'firebase/auth';
import { 
  auth, 
  googleAuthProvider 
} from '../lib/firebase.ts';
import { 
  Cloud, 
  Database, 
  HardDrive, 
  RefreshCw, 
  LogOut, 
  Trash2, 
  History, 
  CheckCircle2, 
  AlertTriangle, 
  DownloadCloud, 
  UserCheck 
} from 'lucide-react';
import { CVData } from '../types.ts';

interface CloudSyncManagerProps {
  cvData: CVData;
  triggerAlert?: (type: 'success' | 'info' | 'error', text: string) => void;
  onImportBackup: (rawJson: string) => void;
}

interface DBCVRecord {
  id: number;
  localId: string;
  title: string;
  data: string;
  driveFileId: string | null;
  driveSyncedAt: string | null;
  updatedAt: string;
}

interface DriveFileRecord {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
}

interface SyncLogRecord {
  id: number;
  action: string;
  status: string;
  message: string;
  createdAt: string;
}

// In-memory access token cache as strictly constrained by security guidelines
let inMemoryGoogleAccessToken: string | null = null;
let isSigningIn = false;

export default function CloudSyncManager({ 
  cvData, 
  triggerAlert, 
  onImportBackup 
}: CloudSyncManagerProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dbCvs, setDbCvs] = useState<DBCVRecord[]>([]);
  const [driveBackups, setDriveBackups] = useState<DriveFileRecord[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLogRecord[]>([]);

  const [isSavingDb, setIsSavingDb] = useState(false);
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'sql' | 'drive' | 'logs'>('sql');

  // Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (current) => {
      setUser(current);
      if (current) {
        // If logged in, fetch data
        fetchCloudData();
      } else {
        // Clear variables
        inMemoryGoogleAccessToken = null;
        setDbCvs([]);
        setDriveBackups([]);
        setSyncLogs([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const getHeaders = async () => {
    if (!user) return {};
    const idToken = await user.getIdToken();
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${idToken}`
    };
  };

  const fetchCloudData = async () => {
    if (!auth.currentUser) return;
    setIsLoading(true);
    try {
      const headers = await getHeaders();

      // 1. Sync User Profile with backend Cloud SQL
      await fetch('/api/user/sync-profile', { method: 'POST', headers });

      // 2. Fetch CVs saved in PG
      const cvsRes = await fetch('/api/user/db-cvs', { headers });
      if (cvsRes.ok) {
        const payload = await cvsRes.json();
        setDbCvs(payload.cvs || []);
      }

      // 3. Fetch sync logs
      const logsRes = await fetch('/api/user/sync-logs', { headers });
      if (logsRes.ok) {
        const payload = await logsRes.json();
        setSyncLogs(payload.logs || []);
      }

      // 4. Fetch Google Drive Backups if token is cached
      if (inMemoryGoogleAccessToken) {
        await fetchDriveList();
      }
    } catch (error) {
      console.error("Cloud data loading error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDriveList = async () => {
    if (!inMemoryGoogleAccessToken) return;
    try {
      const headers = await getHeaders();
      const res = await fetch('/api/drive/list', {
        method: 'POST',
        headers,
        body: JSON.stringify({ googleAccessToken: inMemoryGoogleAccessToken })
      });
      if (res.ok) {
        const payload = await res.json();
        setDriveBackups(payload.files || []);
      }
    } catch (err) {
      console.error("Drive Listing failed:", err);
    }
  };

  // Google Sign In
  const handleGoogleSignIn = async () => {
    if (isSigningIn) return;
    isSigningIn = true;
    try {
      if (triggerAlert) triggerAlert('info', 'Google ile giriş yapılıyor, lütfen pop-up\'ı onaylayın...');
      const result = await signInWithPopup(auth, googleAuthProvider);
      
      const credential = GoogleAuthProvider.credentialFromResult(result);

      if (credential?.accessToken) {
        // Cache the token strictly in-memory
        inMemoryGoogleAccessToken = credential.accessToken;
      }

      if (triggerAlert) triggerAlert('success', `Hoş geldiniz, ${result.user.displayName || 'Kullanıcı'}!`);
      fetchCloudData();
    } catch (error: any) {
      console.error("Sign in error:", error);
      if (triggerAlert) triggerAlert('error', `Giriş yapılamadı: ${error.message}`);
    } finally {
      isSigningIn = false;
    }
  };

  const handleLogout = async () => {
    try {
      const confirmed = window.confirm("Hesabınızdan çıkış yapmak istediğinize emin misiniz? Bulut yedeklerine erişiminiz geçici olarak kapanacaktır.");
      if (!confirmed) return;

      await signOut(auth);
      inMemoryGoogleAccessToken = null;
      if (triggerAlert) triggerAlert('info', 'Hesap çıkışı yapıldı. Tüm yerel veriler güvendedir.');
    } catch (error: any) {
      if (triggerAlert) triggerAlert('error', `Çıkış hatası: ${error.message}`);
    }
  };

  // Save active CV only to PostgreSQL Database
  const handleSaveToPostgres = async () => {
    if (!user) return;
    setIsSavingDb(true);
    if (triggerAlert) triggerAlert('info', 'Özgeçmiş Cloud SQL veritabanına yedekleniyor...');
    try {
      const headers = await getHeaders();
      const res = await fetch('/api/user/save-cv', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          localId: cvData.id,
          title: cvData.title || cvData.personalInfo.name || 'İsimsiz Özgeçmiş',
          data: cvData,
        })
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      if (triggerAlert) triggerAlert('success', 'Özgeçmişiniz bulut veritabanına (PostgreSQL) başarıyla kaydedildi!');
      fetchCloudData();
    } catch (err: any) {
      console.error(err);
      if (triggerAlert) triggerAlert('error', `Buluta kaydetme başarısız: ${err.message}`);
    } finally {
      setIsSavingDb(false);
    }
  };

  // Sync / Upload current CV to Google Drive
  const handleSyncToDrive = async () => {
    if (!user) return;
    if (!inMemoryGoogleAccessToken) {
      // Re-prompt auth popup to get access token securely
      const confirmed = window.confirm("Google Drive yedekleme için yetki anahtarı yenilenmelidir. Lütfen tekrar giriş yapın.");
      if (confirmed) {
        handleGoogleSignIn();
      }
      return;
    }

    setIsSyncingDrive(true);
    if (triggerAlert) triggerAlert('info', 'Özgeçmiş Google Drive Bulut klasörüne senkronize ediliyor ve yedekleniyor...');
    try {
      const headers = await getHeaders();
      const res = await fetch('/api/drive/sync', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          localId: cvData.id,
          title: cvData.title || cvData.personalInfo.name || 'İsimsiz Özgeçmiş',
          data: cvData,
          googleAccessToken: inMemoryGoogleAccessToken,
        })
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt);
      }

      if (triggerAlert) triggerAlert('success', 'Özgeçmişiniz Google Drive hesabınıza (CV Master Backups klasörü) başarıyla yedeklendi!');
      fetchCloudData();
    } catch (err: any) {
      console.error(err);
      if (triggerAlert) triggerAlert('error', `Google Drive senkronizasyonu başarısız: ${err.message}`);
    } finally {
      setIsSyncingDrive(false);
    }
  };

  // Restore/Import backup from DB
  const handleLoadFromDB = (record: DBCVRecord) => {
    try {
      const cvObj = JSON.parse(record.data);
      onImportBackup(JSON.stringify(cvObj));
      if (triggerAlert) triggerAlert('success', `"${record.title}" özgeçmişi buluttan başarıyla yüklendi!`);
    } catch (err) {
      if (triggerAlert) triggerAlert('error', 'Yedek verisi çözümlenemedi.');
    }
  };

  // Restore/Import backup from Google Drive
  const handleLoadFromDrive = async (fileId: string, fileName: string) => {
    if (!inMemoryGoogleAccessToken) return;
    if (triggerAlert) triggerAlert('info', 'Google Drive yedeği indiriliyor...');
    try {
      const headers = await getHeaders();
      const res = await fetch('/api/drive/import', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          fileId,
          googleAccessToken: inMemoryGoogleAccessToken
        })
      });

      if (!res.ok) {
        throw new Error("Dosya indirilemedi");
      }

      const payload = await res.json();
      onImportBackup(payload.content);
      if (triggerAlert) triggerAlert('success', `"${fileName}" Google Drive yedeğinden başarıyla ithal edildi!`);
    } catch (err: any) {
      if (triggerAlert) triggerAlert('error', `İthal hatası: ${err.message}`);
    }
  };

  // Delete DB CV Record
  const handleDeleteFromDB = async (localId: string, title: string) => {
    const confirmed = window.confirm(`"${title}" isimli bulut özgeçmiş kaydını veritabanından kalıcı olarak silmek istediğinize emin misiniz?`);
    if (!confirmed) return;

    try {
      const headers = await getHeaders();
      const res = await fetch(`/api/user/delete-cv/${localId}`, {
        method: 'DELETE',
        headers
      });

      if (!res.ok) throw new Error("Silme başarısız.");

      if (triggerAlert) triggerAlert('success', 'Özgeçmiş bulut veritabanından silindi.');
      fetchCloudData();
    } catch (err: any) {
      if (triggerAlert) triggerAlert('error', err.message);
    }
  };

  return (
    <div className="bg-[#16191E] border border-[#2D3139] p-4 rounded-xl space-y-4">
      {/* Widget Header with Status */}
      <div className="flex justify-between items-center pb-2.5 border-b border-[#2D3139]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-teal-500/10 text-teal-400 rounded-lg">
            <Cloud className="w-4 h-4 animate-pulse text-teal-400" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Bulut Entegrasyon Merkezi</h4>
            <p className="text-[10px] text-gray-400">PostgreSQL ve Google Drive Canlı Yedekleme</p>
          </div>
        </div>

        {/* Reload button when authenticated */}
        {user && (
          <button 
            onClick={fetchCloudData}
            disabled={isLoading}
            className={`p-1.5 rounded-lg border border-[#2D3139] bg-[#0F1115] text-gray-400 hover:text-white transition ${isLoading ? 'animate-spin' : ''}`}
            title="Verileri Yenile"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* BEFORE SIGN IN - Landing */}
      {!user ? (
        <div className="space-y-3 py-2 text-center animate-fade-in">
          <p className="text-xs text-gray-400 leading-relaxed max-w-xs mx-auto">
            Özgeçmişlerinizi kaybetmemek için Google hesabınızla giriş yapın. Veritabanına (Cloud SQL) ve kendi Google Drive bulut klasörünüze anında senkronize edebilirsiniz.
          </p>
          
          <button
            onClick={handleGoogleSignIn}
            className="w-full relative flex items-center justify-center gap-2.5 py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white border border-teal-500 hover:border-teal-400 rounded-xl text-xs font-black uppercase tracking-wide cursor-pointer shadow-lg hover:shadow-teal-500/20 active:scale-95 transition-all duration-300"
          >
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4.5 h-4.5 shrink-0">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            </svg>
            Google ile Giriş Yap & Sync Et
          </button>
        </div>
      ) : (
        /* AFTER SIGN IN - Profile & Controls */
        <div className="space-y-4 animate-fade-in text-left">
          {/* Active User profile details */}
          <div className="flex items-center justify-between bg-[#0F1115] border border-[#2D3139] px-3 py-2 rounded-xl">
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative shrink-0">
                <img 
                  src={user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'} 
                  alt="Avatar" 
                  className="w-8 h-8 rounded-full border border-teal-500/50" 
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#0F1115] rounded-full" />
              </div>
              <div className="truncate pr-1">
                <h5 className="text-xs font-black text-white truncate">{user.displayName || 'Kullanıcı'}</h5>
                <p className="text-[10px] text-gray-400 font-mono truncate">{user.email}</p>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="p-1.5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded-lg transition shrink-0"
              title="Çıkış Yap"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Actions (Backup current view) */}
          <div className="bg-[#1A1E26] border border-teal-500/10 p-3 rounded-xl space-y-2">
            <span className="text-[9.5px] font-black uppercase text-teal-400 tracking-wider flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-teal-400" /> MEVCUT CV BULUT KONTROLLERİ
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleSaveToPostgres}
                disabled={isSavingDb}
                className="cursor-pointer bg-teal-600 hover:bg-teal-500 text-white text-[10.5px] font-black uppercase py-2 px-2.5 rounded-lg flex items-center justify-center gap-1 transition"
              >
                <Database className={`w-3.5 h-3.5 ${isSavingDb ? 'animate-spin' : ''}`} />
                {isSavingDb ? 'Yedekleniyor' : 'DB\'ye Yedekle'}
              </button>
              <button
                onClick={handleSyncToDrive}
                disabled={isSyncingDrive}
                className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white text-[10.5px] font-black uppercase py-2 px-2.5 rounded-lg flex items-center justify-center gap-1 transition"
              >
                <HardDrive className={`w-3.5 h-3.5 ${isSyncingDrive ? 'animate-spin' : ''}`} />
                {isSyncingDrive ? 'Senkronize...' : 'Drive\'a Gönder'}
              </button>
            </div>
          </div>

          {/* Tab Sub Menu for lists */}
          <div className="flex bg-[#0F1115] border border-[#2D3139] rounded-lg p-0.5 text-center text-xs">
            <button
              onClick={() => setActiveSubTab('sql')}
              className={`flex-1 py-1 px-1 text-[10px] font-bold rounded-md transition ${activeSubTab === 'sql' ? 'bg-[#1C2026] text-white' : 'text-gray-400 hover:text-white'}`}
            >
              DB Sürümleri ({dbCvs.length})
            </button>
            <button
              onClick={() => {
                setActiveSubTab('drive');
                if (driveBackups.length === 0 && inMemoryGoogleAccessToken) {
                  fetchDriveList();
                }
              }}
              className={`flex-1 py-1 px-1 text-[10px] font-bold rounded-md transition ${activeSubTab === 'drive' ? 'bg-[#1C2026] text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Drive Klasörüm ({driveBackups.length})
            </button>
            <button
              onClick={() => setActiveSubTab('logs')}
              className={`flex-1 py-1 px-1 text-[10px] font-bold rounded-md transition ${activeSubTab === 'logs' ? 'bg-[#1C2026] text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Günlükler
            </button>
          </div>

          {/* List Display Contents */}
          <div className="max-h-[175px] overflow-y-auto custom-scrollbar space-y-1 rounded-lg">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-6 text-gray-500">
                <RefreshCw className="w-5 h-5 animate-spin mb-1 text-teal-400" />
                <span className="text-[10px]">Veriler yükleniyor...</span>
              </div>
            ) : (
              <>
                {/* 1. DB (Postgres) backups list */}
                {activeSubTab === 'sql' && (
                  dbCvs.length === 0 ? (
                    <p className="text-center text-[10.5px] text-gray-400 py-6 font-mono">
                      Henüz PostgreSQL veritabanında yedek özgeçmişiniz yok.
                    </p>
                  ) : (
                    dbCvs.map((rec) => (
                      <div key={rec.id} className="flex justify-between items-center bg-[#0F1115] border border-[#2D3139] rounded-lg p-2 hover:border-gray-500 transition duration-150">
                        <div className="truncate pr-1.5">
                          <h6 className="text-[11px] font-extrabold text-white truncate">{rec.title}</h6>
                          <p className="text-[9px] text-gray-400 font-mono">Son Güncelleme: {new Date(rec.updatedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => handleLoadFromDB(rec)}
                            className="text-[9px] font-bold py-1 px-2 border border-teal-500/20 text-teal-400 hover:text-white hover:bg-teal-600 rounded-md transition"
                            title="Buluttan İndir ve Düzenle"
                          >
                            Kurtar
                          </button>
                          <button
                            onClick={() => handleDeleteFromDB(rec.localId, rec.title)}
                            className="p-1 text-red-400 hover:text-red-500"
                            title="Sil"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )
                )}

                {/* 2. Google Drive backups list */}
                {activeSubTab === 'drive' && (
                  !inMemoryGoogleAccessToken ? (
                    <div className="p-4 text-center">
                      <p className="text-[10.5px] text-amber-400 mb-2 flex items-center justify-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Drive erişimi için yetki yenileyin.
                      </p>
                      <button 
                        onClick={handleGoogleSignIn}
                        className="py-1 px-3 bg-[#0F1115] border border-[#2D3139] text-white rounded-md text-[10px] hover:border-white transition"
                      >
                        Yetkilendir
                      </button>
                    </div>
                  ) : driveBackups.length === 0 ? (
                    <div className="py-6 text-center text-gray-500">
                      <HardDrive className="w-5 h-5 mx-auto mb-1 text-gray-500 opacity-60" />
                      <p className="text-[10.5px] leading-snug">
                        Google Drive "CV Master Backups" klasörünüz boş.<br />
                        <b>Drive'a Gönder</b> tuşu ile anında yedekleyin!
                      </p>
                    </div>
                  ) : (
                    driveBackups.map((rec) => (
                      <div key={rec.id} className="flex justify-between items-center bg-[#0F1115] border border-[#2D3139] rounded-lg p-2 hover:border-gray-500 transition duration-150">
                        <div className="truncate pr-1.5 flex gap-1.5 items-center">
                          <HardDrive className="w-3 h-3 text-blue-400 shrink-0" />
                          <div className="truncate">
                            <h6 className="text-[11px] font-extrabold text-slate-200 truncate">{rec.name.replace('.json', '')}</h6>
                            <p className="text-[8.5px] text-gray-500 font-mono">{rec.modifiedTime ? new Date(rec.modifiedTime).toLocaleDateString() : 'Bilinmeyen Tarih'}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleLoadFromDrive(rec.id, rec.name)}
                          className="text-[9px] font-bold py-1 px-2 border border-blue-500/20 text-blue-400 hover:text-white hover:bg-blue-600 rounded-md transition shrink-0"
                          title="Google Drive yedek dosyasından ithal et"
                        >
                          <DownloadCloud className="w-3 h-3 inline mr-1" /> İthal
                        </button>
                      </div>
                    ))
                  )
                )}

                {/* 3. Sync Action logs list */}
                {activeSubTab === 'logs' && (
                  syncLogs.length === 0 ? (
                    <p className="text-center text-[10.5px] text-gray-500 py-6 font-mono flex items-center justify-center gap-1">
                      <History className="w-3.5 h-3.5" /> İşlem geçmişiniz temiz.
                    </p>
                  ) : (
                    syncLogs.map((log) => (
                      <div key={log.id} className="bg-[#0F1115] border border-[#2D3139] p-2 rounded-lg text-[9.5px]">
                        <div className="flex justify-between items-center">
                          <span className={`font-black uppercase tracking-wider ${log.status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                            {log.status === 'success' ? '✔ BAŞARILI' : '✘ HATA'}
                          </span>
                          <span className="text-gray-500 font-mono text-[8.5px]">{new Date(log.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <p className="text-gray-300 mt-1 leading-snug">{log.message}</p>
                      </div>
                    ))
                  )
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
