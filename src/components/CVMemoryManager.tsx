import React, { useState, useMemo, useRef } from 'react';
import { 
  Database, 
  FolderOpen, 
  Save, 
  Copy, 
  Edit3, 
  Trash2, 
  Download, 
  Upload, 
  Search, 
  Sparkles, 
  Clock, 
  Check, 
  X, 
  Plus, 
  FileJson, 
  CheckCircle2, 
  AlertCircle, 
  HardDrive, 
  RefreshCw,
  Layers,
  ChevronDown,
  ChevronUp,
  Sliders,
  FileText
} from 'lucide-react';
import { CVData } from '../types';

export interface CVMemoryManagerProps {
  cvData: CVData;
  savedCVs: CVData[];
  onLoadCV: (id: string) => void;
  onSaveCV: (customTitle?: string) => void;
  onSaveAsNewCV: (title: string) => void;
  onDuplicateCV: (id: string) => void;
  onRenameCV: (id: string, newTitle: string) => void;
  onDeleteCV: (id: string) => void;
  onCreateNew: () => void;
  onExportSingleCV: (id: string) => void;
  onExportAllCVs: () => void;
  onImportBackup: (rawJson: string) => void;
  onResetSamples: () => void;
  triggerAlert?: (type: 'success' | 'info' | 'error', text: string) => void;
  isModal?: boolean;
  onClose?: () => void;
}

export const CVMemoryManager: React.FC<CVMemoryManagerProps> = ({
  cvData,
  savedCVs,
  onLoadCV,
  onSaveCV,
  onSaveAsNewCV,
  onDuplicateCV,
  onRenameCV,
  onDeleteCV,
  onCreateNew,
  onExportSingleCV,
  onExportAllCVs,
  onImportBackup,
  onResetSamples,
  triggerAlert,
  isModal = false,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'user' | 'samples'>('all');
  
  // Inline rename state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // API'den Yükle paneli — CLI/MCP'nin gönderdiği CV'yi çeker
  const [showApiPanel, setShowApiPanel] = useState(false);
  const [apiUrl, setApiUrl] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('cv_api_url') || window.location.origin;
  });
  const [apiToken, setApiToken] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('cv_api_token') || '';
  });
  const [apiBusy, setApiBusy] = useState(false);

  const handleApiFetch = async () => {
    const base = (apiUrl || window.location.origin).replace(/\/+$/, '');
    const token = apiToken.trim();
    if (!token) {
      triggerAlert?.('error', 'API token gerekli. Sunucudaki CV_API_TOKEN değerini girin.');
      return;
    }
    setApiBusy(true);
    try {
      localStorage.setItem('cv_api_url', base);
      localStorage.setItem('cv_api_token', token);
      const res = await fetch(`${base}/api/cv/latest`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Sunucu ${res.status}`);
      if (!body.data) throw new Error('Sunucudan CV verisi gelmedi.');
      onImportBackup(JSON.stringify(body.data));
      triggerAlert?.('success', `API'den yüklendi: ${body.title || body.slug}`);
      setShowApiPanel(false);
    } catch (e: any) {
      triggerAlert?.('error', `API hatası: ${e.message || 'bağlantı kurulamadı'}`);
    } finally {
      setApiBusy(false);
    }
  };

  // Save As New (Snapshot) popover state
  const [showSaveAsModal, setShowSaveAsModal] = useState(false);
  const [newSnapshotTitle, setNewSnapshotTitle] = useState('');

  // Delete confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Advanced / Maintenance section toggle
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Split user & demo CVs
  const userCVs = useMemo(() => savedCVs.filter(x => !x.id.startsWith('sample-')), [savedCVs]);
  const sampleCVs = useMemo(() => savedCVs.filter(x => x.id.startsWith('sample-')), [savedCVs]);

  // Compute memory storage usage in LocalStorage
  const storageUsage = useMemo(() => {
    try {
      const raw = localStorage.getItem('cv_builder_saved_cvs') || '';
      const bytes = new Blob([raw]).size;
      const kb = (bytes / 1024).toFixed(1);
      // Quota is typically ~5MB (5120 KB)
      const maxKb = 5120;
      const percent = Math.min(100, Math.max(0.2, (Number(kb) / maxKb) * 100)).toFixed(1);
      return { bytes, kb, percent };
    } catch {
      return { bytes: 0, kb: '0', percent: '0' };
    }
  }, [savedCVs]);

  // Filtered CV list based on search and tab
  const filteredList = useMemo(() => {
    let list = savedCVs;
    if (activeFilter === 'user') {
      list = userCVs;
    } else if (activeFilter === 'samples') {
      list = sampleCVs;
    }

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase().trim();
    return list.filter(item => {
      const titleMatch = (item.title || '').toLowerCase().includes(q);
      const nameMatch = (item.personalInfo?.name || '').toLowerCase().includes(q);
      const roleMatch = (item.personalInfo?.title || '').toLowerCase().includes(q);
      const templateMatch = (item.styles?.template || '').toLowerCase().includes(q);
      return titleMatch || nameMatch || roleMatch || templateMatch;
    });
  }, [savedCVs, userCVs, sampleCVs, activeFilter, searchQuery]);

  // Handle start inline editing
  const startEditing = (item: CVData) => {
    setEditingId(item.id);
    setEditingTitle(item.title || item.personalInfo?.name || 'İsimsiz CV');
  };

  const saveEditing = (id: string) => {
    if (editingTitle.trim()) {
      onRenameCV(id, editingTitle.trim());
    }
    setEditingId(null);
    setEditingTitle('');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  // Handle Snapshot / Save As New
  const handleOpenSnapshot = () => {
    const currentName = cvData.personalInfo?.name?.trim() || 'CV';
    const currentRole = cvData.personalInfo?.title?.trim() || 'Taslak';
    setNewSnapshotTitle(`${currentName} - ${currentRole} (${new Date().toLocaleDateString('tr-TR')})`);
    setShowSaveAsModal(true);
  };

  const handleConfirmSnapshot = () => {
    if (!newSnapshotTitle.trim()) return;
    onSaveAsNewCV(newSnapshotTitle.trim());
    setShowSaveAsModal(false);
  };

  // Handle file import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportBackup(content);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={`flex flex-col text-[#E0E2E6] ${isModal ? 'max-h-[85vh] overflow-hidden' : 'space-y-4'}`}>
      
      {/* MODAL HEADER (Only shown in modal mode) */}
      {isModal && (
        <div className="flex items-center justify-between p-4 bg-[#101318] border-b border-[#2D3139] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-500/15 text-teal-400 rounded-xl border border-teal-500/30">
              <FolderOpen className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                CV Bellek & Geri Çağırma Merkezi
                <span className="text-[10px] font-mono bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full">
                  {savedCVs.length} Kayıt
                </span>
              </h3>
              <p className="text-[10px] text-gray-400">
                Kaydettiğiniz tüm özgeçmişleri görüntüleyin, tek tıkla geri çağırın veya yeni taslak kaydedin.
              </p>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white bg-[#1A1D24] hover:bg-[#252A34] rounded-lg border border-[#2D3139] transition cursor-pointer"
              title="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      <div className={`flex flex-col ${isModal ? 'p-4 overflow-y-auto space-y-4' : 'space-y-4'}`}>
        {/* 1. STATUS & STORAGE HEALTH BAR */}
        <div className="bg-[#15181E] border border-[#2D3139] rounded-xl p-3 shadow-xs space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-teal-500/10 text-teal-400 rounded-lg border border-teal-500/20">
                <HardDrive className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  Tarayıcı Bellek Havuzu
                  <span className="text-[10px] font-mono bg-[#0F1115] text-teal-400 border border-[#2D3139] px-2 py-0.5 rounded-full font-medium">
                    {userCVs.length} Kişisel Kayıt • {sampleCVs.length} Hazır Örnek
                  </span>
                </h4>
                <p className="text-[10px] text-gray-400">
                  Verileriniz gizlilik odaklı olarak cihazınızın yerel depolama alanında saklanır.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] font-mono bg-[#0F1115] px-2.5 py-1 rounded-lg border border-[#2D3139] text-gray-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Otomatik Kayıt Aktif</span>
            </div>
          </div>

          {/* Memory Usage Meter */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-gray-400 font-mono">
              <span>Kullanılan Bellek: <strong className="text-white">{storageUsage.kb} KB</strong> / ~5 MB</span>
              <span className="text-teal-400 font-bold">%{storageUsage.percent}</span>
            </div>
            <div className="w-full h-1.5 bg-[#0F1115] rounded-full overflow-hidden border border-[#2D3139]/60">
              <div 
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(1, Number(storageUsage.percent))}%` }}
              />
            </div>
          </div>
        </div>

        {/* 2. TOP ACTION BUTTONS (TOOLBAR) */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onSaveCV()}
            className="cursor-pointer py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition shadow-[0_0_12px_rgba(16,185,129,0.3)] active:scale-95 border border-emerald-400/40 group"
            title="Mevcut çalışma durumunu aktif slota kaydeder"
          >
            <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>Kaydet</span>
          </button>

          <button
            type="button"
            onClick={handleOpenSnapshot}
            className="cursor-pointer py-2.5 px-2.5 bg-[#1C2027] hover:bg-[#252A34] text-teal-300 border border-teal-500/30 hover:border-teal-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm active:scale-95 group"
            title="Mevcut CV'den yeni bir kopya oluşturur"
          >
            <Copy className="w-3.5 h-3.5 text-teal-400 group-hover:scale-110 transition-transform" />
            <span>Kopya Kaydet</span>
          </button>

          <button
            type="button"
            onClick={onExportAllCVs}
            className="cursor-pointer py-2.5 px-2.5 bg-[#1C2027] hover:bg-[#252A34] text-amber-300 border border-amber-500/30 hover:border-amber-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm active:scale-95 group"
            title="Tüm kayıtlı CV'leri tek bir JSON dosyası olarak indirir"
          >
            <Download className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>Yedekle</span>
          </button>
        </div>

      {/* 3. SEARCH & FILTER SECTION */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Başlık, ad-soyad, unvan veya şablon adı ile ara..."
              className="w-full bg-[#111317] border border-[#2D3139] focus:border-teal-500 rounded-xl py-1.5 pl-8 pr-7 text-xs text-white placeholder-gray-500 outline-none transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Hidden File Input for Import */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".json" 
            className="hidden" 
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer py-1.5 px-3 bg-[#16191E] hover:bg-[#1E232B] border border-[#2D3139] hover:border-teal-500/40 text-gray-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shrink-0"
            title="Daha önce indirilen bir JSON yedeğini içe aktarır"
          >
            <Upload className="w-3.5 h-3.5 text-teal-400" />
            <span>Yedek Yükle (JSON)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowApiPanel((v) => !v)}
            className="cursor-pointer py-1.5 px-3 bg-[#16191E] hover:bg-[#1E232B] border border-[#2D3139] hover:border-teal-500/40 text-gray-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shrink-0"
            title="CLI/MCP ile gönderilen CV'yi sunucudan çeker"
          >
            <RefreshCw className="w-3.5 h-3.5 text-teal-400" />
            <span>API'den Yükle</span>
          </button>
        </div>

        {showApiPanel && (
          <div className="p-2.5 bg-[#111317] border border-[#2D3139] rounded-xl space-y-2">
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Terminalde <code className="text-teal-300">node mcp/cli.mjs push &lt;slug&gt;</code> çalıştırın.
              Buradaki sunucu adresi ve token, sunucudaki <code className="text-teal-300">CV_API_TOKEN</code> ile aynı olmalı.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-[1.3fr_1fr_auto] gap-1.5">
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="http://localhost:3010"
                className="bg-[#16191E] border border-[#2D3139] focus:border-teal-500 rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder-gray-600 outline-none transition"
              />
              <input
                type="password"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                placeholder="CV_API_TOKEN"
                className="bg-[#16191E] border border-[#2D3139] focus:border-teal-500 rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder-gray-600 outline-none transition"
              />
              <button
                type="button"
                onClick={handleApiFetch}
                disabled={apiBusy}
                className="cursor-pointer px-3 py-1.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg text-[11px] font-bold transition"
              >
                {apiBusy ? 'Getiriliyor…' : 'Getir'}
              </button>
            </div>
          </div>
        )}

        {/* Filter Tabs — yalnızca ayrıştırılacak bir kategori varsa gösterilir */}
        {sampleCVs.length > 0 && (
        <div className="flex items-center gap-1.5 p-1 bg-[#111317] border border-[#2D3139] rounded-xl text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`flex-1 py-1 px-2 rounded-lg transition text-center cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Tüm Kayıtlar ({savedCVs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('user')}
            className={`flex-1 py-1 px-2 rounded-lg transition text-center cursor-pointer ${
              activeFilter === 'user'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Kişisel Kayıtlarım ({userCVs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('samples')}
            className={`flex-1 py-1 px-2 rounded-lg transition text-center cursor-pointer ${
              activeFilter === 'samples'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Hazır Şablonlar ({sampleCVs.length})
          </button>
        </div>
        )}
      </div>

      {/* 4. CV LIST ITEMS */}
      <div className={`space-y-2 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#2D3139] scrollbar-track-transparent ${
        isModal ? 'max-h-[460px]' : 'max-h-[380px]'
      }`}>
        {filteredList.length === 0 ? (
          <div className="text-center py-8 px-4 bg-[#111317] border border-dashed border-[#2D3139] rounded-2xl space-y-2">
            <FileText className="w-8 h-8 text-gray-500 mx-auto" />
            <p className="text-xs text-gray-400 font-medium">
              {searchQuery ? 'Arama kriterlerinize uygun kayıt bulunamadı.' : 'Henüz bu kategoride kayıtlı bir CV bulunmuyor.'}
            </p>
            {activeFilter === 'user' && !searchQuery && (
              <button
                type="button"
                onClick={handleOpenSnapshot}
                className="cursor-pointer text-xs font-bold text-teal-400 hover:text-teal-300 bg-teal-500/10 border border-teal-500/20 py-1.5 px-3 rounded-lg inline-flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>İlk Kişisel Kaydını Oluştur</span>
              </button>
            )}
          </div>
        ) : (
          filteredList.map((item) => {
            const isActive = cvData.id === item.id;
            const isSample = item.id.startsWith('sample-');
            const isEditing = editingId === item.id;
            const isDeleting = confirmDeleteId === item.id;

            const expCount = item.workExperiences?.length || 0;
            const eduCount = item.educations?.length || 0;
            const skillCatCount = item.skills?.length || 0;
            const projCount = item.projects?.length || 0;
            const templateName = item.styles?.template || 'Standart';

            return (
              <div
                key={item.id}
                className={`group relative bg-[#15181E] border-2 rounded-xl p-3 transition-all duration-200 ${
                  isActive 
                    ? 'border-teal-500 bg-gradient-to-r from-teal-500/[0.08] to-transparent shadow-[0_0_15px_rgba(20,184,166,0.15)]' 
                    : 'border-[#2D3139] hover:border-[#3D424E]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  
                  {/* Left: Info & Title */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isActive && (
                        <span className="text-[9px] font-black uppercase tracking-wider bg-teal-500 text-[#0F1115] px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0F1115] animate-ping" />
                          Aktif Düzenleniyor
                        </span>
                      )}

                      {isSample ? (
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-md">
                          Hazır Sistem Şablonu
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded-md">
                          Kişisel Bellek
                        </span>
                      )}

                      <span className="text-[9px] font-mono text-gray-400 bg-[#0F1115] px-2 py-0.5 rounded-md border border-[#2D3139]">
                        Şablon: {templateName}
                      </span>
                    </div>

                    {/* Title or Inline Edit */}
                    {isEditing ? (
                      <div className="flex items-center gap-1.5 pt-1">
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEditing(item.id);
                            if (e.key === 'Escape') cancelEditing();
                          }}
                          autoFocus
                          className="flex-1 bg-[#0F1115] border border-teal-500 text-white text-xs px-2 py-1 rounded-lg outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => saveEditing(item.id)}
                          className="p-1 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition"
                          title="Onayla"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="p-1 bg-[#20242D] hover:bg-[#2A303C] text-gray-300 rounded-lg transition"
                          title="Vazgeç"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <h5 
                          className={`font-bold text-xs truncate max-w-full cursor-pointer hover:underline ${
                            isActive ? 'text-teal-300' : 'text-white'
                          }`}
                          onClick={() => !isActive && onLoadCV(item.id)}
                          title="Çalışma alanına yüklemek için tıklayın"
                        >
                          {item.title || item.personalInfo?.name || 'İsimsiz Özgeçmiş'}
                        </h5>

                        <button
                          type="button"
                          onClick={() => startEditing(item)}
                          className="text-gray-500 hover:text-teal-400 p-0.5 opacity-60 group-hover:opacity-100 transition cursor-pointer"
                          title="Kaydı Yeniden Adlandır"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Meta Stats Row */}
                    <div className="flex items-center gap-3 text-[10px] text-gray-400 font-medium flex-wrap">
                      <span className="truncate max-w-[220px]">
                        {item.personalInfo?.name || 'İsim girilmedi'} {item.personalInfo?.title ? `• ${item.personalInfo.title}` : ''}
                      </span>
                      <span className="text-gray-600">•</span>
                      <span className="font-mono text-gray-400">
                        {expCount} Deneyim, {eduCount} Eğitim, {projCount} Proje, {skillCatCount} Beceri
                      </span>
                      {item.updatedAt && (
                        <>
                          <span className="text-gray-600">•</span>
                          <span className="font-mono text-[9px] text-gray-500 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(item.updatedAt).toLocaleDateString('tr-TR')} {new Date(item.updatedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    
                    {/* Delete Confirm State */}
                    {isDeleting ? (
                      <div className="flex items-center gap-1 bg-red-500/10 border border-red-500/30 p-1 rounded-lg">
                        <span className="text-[10px] text-red-300 font-bold px-1">Silinsin mi?</span>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteCV(item.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-bold cursor-pointer transition"
                        >
                          Evet
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-1.5 py-0.5 bg-[#20242D] text-gray-300 rounded text-[10px] cursor-pointer"
                        >
                          İptal
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Load / Recall Button */}
                        {isActive ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-extrabold text-xs shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Aktif CV</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              onLoadCV(item.id);
                              if (isModal && onClose) onClose();
                            }}
                            className="cursor-pointer px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)] hover:shadow-[0_0_16px_rgba(16,185,129,0.5)] border border-emerald-400/50 hover:scale-105 active:scale-95 transition-all group"
                            title="Bu özgeçmişi düzenleme alanına geri çağır ve aç"
                          >
                            <FolderOpen className="w-3.5 h-3.5 text-white group-hover:scale-110 transition-transform" />
                            <span>Geri Çağır ⚡</span>
                          </button>
                        )}

                        {/* Duplicate Button */}
                        <button
                          type="button"
                          onClick={() => onDuplicateCV(item.id)}
                          className="cursor-pointer p-1.5 bg-[#1C2027] hover:bg-[#252A34] text-gray-300 hover:text-teal-300 border border-[#2D3139] hover:border-teal-500/40 rounded-lg transition"
                          title="Bu CV'yi Çoğalt (Yeni Kopya Oluştur)"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Export Single JSON */}
                        <button
                          type="button"
                          onClick={() => onExportSingleCV(item.id)}
                          className="cursor-pointer p-1.5 bg-[#1C2027] hover:bg-[#252A34] text-gray-300 hover:text-amber-300 border border-[#2D3139] hover:border-amber-500/40 rounded-lg transition"
                          title="Bu CV'yi JSON dosyası olarak indir"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(item.id)}
                          className="cursor-pointer p-1.5 bg-[#1C2027] hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-[#2D3139] hover:border-red-500/30 rounded-lg transition"
                          title="Bu kaydı sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. ADVANCED TOOLS & MAINTENANCE DRAWER */}
      <div className="border border-[#2D3139] rounded-xl bg-[#111317] overflow-hidden">
        <div
          onClick={() => setShowAdvancedTools(!showAdvancedTools)}
          className="flex justify-between items-center px-3.5 py-2.5 bg-[#15181E] hover:bg-[#1C2027] cursor-pointer select-none transition"
        >
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-xs font-bold text-gray-300">Gelişmiş Bellek & Bakım Araçları</span>
          </div>
          {showAdvancedTools ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>

        {showAdvancedTools && (
          <div className="p-3 border-t border-[#2D3139] space-y-3 animate-fade-in text-xs">
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={onResetSamples}
                className="flex-1 cursor-pointer py-2 px-3 bg-[#1C2027] hover:bg-[#252A34] text-amber-300 border border-amber-500/20 hover:border-amber-500/40 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition"
                title="Orijinal hazır sistem örneklerini fabrika ayarlarına döndürür"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Hazır Sistem Örneklerini Sıfırla</span>
              </button>

              <button
                type="button"
                onClick={onExportAllCVs}
                className="flex-1 cursor-pointer py-2 px-3 bg-[#1C2027] hover:bg-[#252A34] text-teal-300 border border-teal-500/20 hover:border-teal-500/40 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tüm Belleği Dışa Aktar (.json)</span>
              </button>
            </div>
            <p className="text-[10.5px] text-gray-400 leading-relaxed">
              İpucu: Belleğinizi düzenli olarak dışa aktararak bilgisayarınızda veya Google Drive'ınızda güvenli bir yedek tutabilirsiniz.
            </p>
          </div>
        )}
      </div>

      {/* 6. MODAL: SAVE AS NEW SNAPSHOT DIALOG */}
      {showSaveAsModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-[1000] p-4 animate-fade-in">
          <div className="bg-[#16191E] border border-teal-500/30 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-up">
            <div className="bg-[#0F1115] p-3.5 border-b border-[#2D3139] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-teal-500/10 text-teal-400 rounded-lg">
                  <Copy className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm">Farklı Kaydet (Yeni Slot / Snapshot)</h4>
                  <p className="text-[10px] text-gray-400">Mevcut CV'nizi bozmadan yeni bir versiyon üretin</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSaveAsModal(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <label className="block text-xs font-bold text-gray-300">
                Yeni Kayıt Başlığı
              </label>
              <input
                type="text"
                value={newSnapshotTitle}
                onChange={(e) => setNewSnapshotTitle(e.target.value)}
                placeholder="Örn: Kıdemli Yazılım Mühendisi - İngilizce"
                className="w-full bg-[#0F1115] border border-[#2D3139] focus:border-teal-500 rounded-xl p-2.5 text-xs text-white outline-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmSnapshot();
                }}
              />
              <p className="text-[10.5px] text-gray-400 leading-relaxed">
                Bu işlem mevcut çalışma durumunuzun birebir kopyasını alır ve belleğe yeni bir bağımsız slot olarak ekler.
              </p>
            </div>

            <div className="bg-[#0F1115] p-3 border-t border-[#2D3139] flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowSaveAsModal(false)}
                className="cursor-pointer py-2 px-3 text-xs text-gray-400 hover:text-white rounded-lg transition"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleConfirmSnapshot}
                disabled={!newSnapshotTitle.trim()}
                className="cursor-pointer py-2 px-4 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition active:scale-95 flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Belleğe Ekle</span>
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};
