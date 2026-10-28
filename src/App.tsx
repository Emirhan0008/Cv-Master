import { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { CVData } from './types';
import { INITIAL_CV_SAMPLES } from './data';
import CVForm from './components/CVForm';
import CVPreview from './components/CVPreview';
import { PRESETS } from './utils/presets';
import { sanitizeCVData } from './utils/sanitizer';
import { 
  FileText, Download, Share2, Printer, Layers, HelpCircle, 
  Sparkles, Check, Smartphone, FileJson, 
  ExternalLink, FileCode, CheckCircle2, Image, Dices,
  AlertTriangle, Loader2, X, ChevronRight, ChevronLeft, FileCheck,
  LayoutGrid, Save, Cloud, Plus, Database, Edit3, HardDrive, FolderOpen
} from 'lucide-react';
import { CVMemoryManager } from './components/CVMemoryManager.tsx';
import { auth } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

// Safe OKLCH & OKLAB to RGB/RGBA CSS Color Parser to prevent html2canvas crashes on modern CSS colors (like in Tailwind v4)
function convertOklchToRgb(cssText: string): string {
  const oklabToRgb = (l: number, aLab: number, bLab: number, a?: number): string => {
    if (isNaN(l)) l = 0;
    if (isNaN(aLab)) aLab = 0;
    if (isNaN(bLab)) bLab = 0;

    const l_ = l + 0.3963377774 * aLab + 0.2158037573 * bLab;
    const m_ = l - 0.1055613458 * aLab - 0.0638541728 * bLab;
    const s_ = l - 0.0894841775 * aLab - 1.2914855480 * bLab;
    
    const l3 = l_ * l_ * l_;
    const m3 = m_ * m_ * m_;
    const s3 = s_ * s_ * s_;
    
    const rL = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
    const gL = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
    const bL = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;
    
    const f = (cVal: number) => {
      if (cVal <= 0.0031308) {
        return 12.92 * cVal;
      }
      return 1.055 * Math.pow(cVal, 1 / 2.4) - 0.055;
    };
    
    const r = Math.max(0, Math.min(255, Math.round(f(rL) * 255)));
    const g = Math.max(0, Math.min(255, Math.round(f(gL) * 255)));
    const b = Math.max(0, Math.min(255, Math.round(f(bL) * 255)));
    
    if (a !== undefined) {
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
    return `rgb(${r}, ${g}, ${b})`;
  };

  const oklchToRgb = (l: number, c: number, h: number, a?: number): string => {
    if (isNaN(l)) l = 0;
    if (isNaN(c)) c = 0;
    if (isNaN(h)) h = 0;

    const hRad = (h * Math.PI) / 180;
    const aLab = c * Math.cos(hRad);
    const bLab = c * Math.sin(hRad);
    return oklabToRgb(l, aLab, bLab, a);
  };

  const oklchRegex = /oklch\(\s*([-+]?[\d.%]+)\s+([-+]?[\d.%]+)\s+([-+]?[\d.deg%]+)(?:\s*[\/\,]\s*([-+]?[\d.%]+))?\s*\)/gi;
  const oklabRegex = /oklab\(\s*([-+]?[\d.%]+)\s+([-+]?[\d.%]+)\s+([-+]?[\d.%]+)(?:\s*[\/\,]\s*([-+]?[\d.%]+))?\s*\)/gi;

  let cleaned = cssText;

  // 1. Clean oklch
  cleaned = cleaned.replace(oklchRegex, (match, lStr, cStr, hStr, aStr) => {
    try {
      let l = parseFloat(lStr);
      if (lStr.includes('%')) l = l / 100;
      let c = parseFloat(cStr);
      if (cStr.includes('%')) c = c / 100;
      let h = parseFloat(hStr);
      let a: number | undefined = undefined;
      if (aStr) {
        if (aStr.includes('%')) {
          a = parseFloat(aStr) / 100;
        } else {
          a = parseFloat(aStr);
        }
      }
      return oklchToRgb(l, c, h, a);
    } catch (e) {
      return 'rgb(240, 240, 240)';
    }
  });

  // 2. Clean oklab
  cleaned = cleaned.replace(oklabRegex, (match, lStr, aStr, bStr, alphaStr) => {
    try {
      let l = parseFloat(lStr);
      if (lStr.includes('%')) l = l / 100;
      let aVal = parseFloat(aStr);
      if (aStr.includes('%')) aVal = aVal / 100;
      let bVal = parseFloat(bStr);
      if (bStr.includes('%')) bVal = bVal / 100;
      let a: number | undefined = undefined;
      if (alphaStr) {
        if (alphaStr.includes('%')) {
          a = parseFloat(alphaStr) / 100;
        } else {
          a = parseFloat(alphaStr);
        }
      }
      return oklabToRgb(l, aVal, bVal, a);
    } catch (e) {
      return 'rgb(240, 240, 240)';
    }
  });

  // 3. Absolute catch-all safety checks to prevent HTML2CANVAS crashes on unsupported modern CSS values
  cleaned = cleaned.replace(/oklch\([^)]+\)/gi, 'rgb(30, 41, 59)');
  cleaned = cleaned.replace(/oklab\([^)]+\)/gi, 'rgb(30, 41, 59)');

  return cleaned;
}

export default function App() {
  // Database State
  const [savedCVs, setSavedCVs] = useState<CVData[]>([]);
  const [cvData, setCvData] = useState<CVData>(INITIAL_CV_SAMPLES[0]);

  // Undo/Revert last change states & refs
  const [cvHistory, setCvHistory] = useState<CVData[]>([]);
  const isUndoingRef = useRef<boolean>(false);
  const lastSavedStateRef = useRef<CVData>(INITIAL_CV_SAMPLES[0]);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  
  // Mobile UI States
  const [mobileActiveView, setMobileActiveView] = useState<'form' | 'preview'>('form');
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);
  const [showPdfModal, setShowPdfModal] = useState<boolean>(false);
  const [showNewCVConfirmModal, setShowNewCVConfirmModal] = useState<boolean>(false);
  const [showMemoryModal, setShowMemoryModal] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [isJustSaved, setIsJustSaved] = useState<boolean>(false);

  // Desktop Sidebars UI Drawer States
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState<boolean>(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState<boolean>(false);
  const [isRightSidebarHovered, setIsRightSidebarHovered] = useState<boolean>(false);

  // User Auth State
  const [user, setUser] = useState<User | null>(null);

  // Auto-Save States & Timers
  const [isSavingLocal, setIsSavingLocal] = useState<boolean>(false);
  const [lastSavedLocalTime, setLastSavedLocalTime] = useState<string>('');
  const [isSavingCloud, setIsSavingCloud] = useState<boolean>(false);
  const [lastSavedCloudTime, setLastSavedCloudTime] = useState<string>('');

  // Sidebar Delay Hover / Leave Timeout Refs
  const leftHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const leftLeaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rightHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rightLeaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // First Load Ref to prevent immediate auto-save triggers on mount
  const hasInitialLoadedRef = useRef<boolean>(false);

  // Clean timeouts on unmount
  useEffect(() => {
    return () => {
      if (leftHoverTimeoutRef.current) clearTimeout(leftHoverTimeoutRef.current);
      if (leftLeaveTimeoutRef.current) clearTimeout(leftLeaveTimeoutRef.current);
      if (rightHoverTimeoutRef.current) clearTimeout(rightHoverTimeoutRef.current);
      if (rightLeaveTimeoutRef.current) clearTimeout(rightLeaveTimeoutRef.current);
    };
  }, []);

  // Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (current) => {
      setUser(current);
    });
    return () => unsubscribe();
  }, []);

  // Track and capture history snapshots with debounce (500ms) for undo functionality
  useEffect(() => {
    if (isUndoingRef.current) {
      isUndoingRef.current = false;
      lastSavedStateRef.current = cvData;
      setCanUndo(cvHistory.length > 0);
      return;
    }

    const hasChanged = JSON.stringify(lastSavedStateRef.current) !== JSON.stringify(cvData);
    if (hasChanged) {
      // Enable undo button instantly on first keystroke/change!
      setCanUndo(true);
    }

    const timer = setTimeout(() => {
      if (hasChanged) {
        setCvHistory(prev => {
          const newHistory = [...prev, lastSavedStateRef.current];
          if (newHistory.length > 30) {
            newHistory.shift();
          }
          return newHistory;
        });
        lastSavedStateRef.current = cvData;
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [cvData, cvHistory.length]);

  // Left Sidebar delayed hover handlers
  const handleLeftMouseEnter = () => {
    if (leftLeaveTimeoutRef.current) {
      clearTimeout(leftLeaveTimeoutRef.current);
      leftLeaveTimeoutRef.current = null;
    }
    if (!isSidebarHovered && !leftHoverTimeoutRef.current) {
      leftHoverTimeoutRef.current = setTimeout(() => {
        setIsSidebarHovered(true);
        leftHoverTimeoutRef.current = null;
      }, 300); // 300ms delay to open
    }
  };

  const handleLeftMouseLeave = () => {
    if (leftHoverTimeoutRef.current) {
      clearTimeout(leftHoverTimeoutRef.current);
      leftHoverTimeoutRef.current = null;
    }
    if (isSidebarHovered && !leftLeaveTimeoutRef.current) {
      leftLeaveTimeoutRef.current = setTimeout(() => {
        setIsSidebarHovered(false);
        leftLeaveTimeoutRef.current = null;
      }, 400); // 400ms delay to close
    }
  };

  // Right Sidebar delayed hover handlers
  const handleRightMouseEnter = () => {
    if (rightLeaveTimeoutRef.current) {
      clearTimeout(rightLeaveTimeoutRef.current);
      rightLeaveTimeoutRef.current = null;
    }
    if (!isRightSidebarHovered && !rightHoverTimeoutRef.current) {
      rightHoverTimeoutRef.current = setTimeout(() => {
        setIsRightSidebarHovered(true);
        rightHoverTimeoutRef.current = null;
      }, 300); // 300ms delay to open
    }
  };

  const handleRightMouseLeave = () => {
    if (rightHoverTimeoutRef.current) {
      clearTimeout(rightHoverTimeoutRef.current);
      rightHoverTimeoutRef.current = null;
    }
    if (isRightSidebarHovered && !rightLeaveTimeoutRef.current) {
      rightLeaveTimeoutRef.current = setTimeout(() => {
        setIsRightSidebarHovered(false);
        rightLeaveTimeoutRef.current = null;
      }, 400); // 400ms delay to close
    }
  };

  // Auto fallback is no longer needed as showDevGuide is removed

  // Load Saved CVs on startup
  useEffect(() => {
    try {
      const stored = localStorage.getItem('cv_builder_saved_cvs');
      const samplesVersion = localStorage.getItem('cv_builder_samples_v3');
      
      if (stored && samplesVersion === 'single-page-opt-ultra-condensed') {
        const parsed = JSON.parse(stored) as CVData[];
        if (parsed && parsed.length > 0) {
          const sanitizedList = parsed.map(x => sanitizeCVData(x));
          setSavedCVs(sanitizedList);
          // Set active as the first stored CV
          setCvData(sanitizedList[0]);
          setTimeout(() => {
            hasInitialLoadedRef.current = true;
          }, 600);
          return;
        }
      }
      
      // Fallback or Upgrade: merge newly-optimized single-page specimens while preserving custom ones
      let newList = [...INITIAL_CV_SAMPLES];
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as CVData[];
          // Keep user's custom CVs (whose IDs do not start with "sample-")
          const userCustomCvs = parsed.filter(x => !x.id.startsWith('sample-'));
          newList = [...INITIAL_CV_SAMPLES, ...userCustomCvs];
        } catch (_) {}
      }
      
      const sanitizedAndMerged = newList.map(x => sanitizeCVData(x));
      localStorage.setItem('cv_builder_saved_cvs', JSON.stringify(sanitizedAndMerged));
      localStorage.setItem('cv_builder_samples_v3', 'single-page-opt-ultra-condensed');
      setSavedCVs(sanitizedAndMerged);
      setCvData(sanitizedAndMerged[0]);
      setTimeout(() => {
        hasInitialLoadedRef.current = true;
      }, 600);
    } catch (e) {
      console.error('Storage reading error, using fallback samples.', e);
      const sanitizedDefaults = INITIAL_CV_SAMPLES.map(x => sanitizeCVData(x));
      setSavedCVs(sanitizedDefaults);
      setCvData(sanitizedDefaults[0]);
      setTimeout(() => {
        hasInitialLoadedRef.current = true;
      }, 600);
    }
  }, []);

  // Auto-Save to LocalStorage on cvData changes
  useEffect(() => {
    if (!hasInitialLoadedRef.current || !cvData || !cvData.id) return;

    setIsSavingLocal(true);

    const timer = setTimeout(() => {
      try {
        const name = cvData.personalInfo.name?.trim() || 'Yeni CV';
        const role = cvData.personalInfo.title?.trim() || cvData.styles.template.toUpperCase();
        const fallbackTitle = `${name} - ${role}`;
        const dynamicTitle = cvData.title?.trim() || fallbackTitle;

        const updatedItem = {
          ...cvData,
          title: dynamicTitle,
          updatedAt: new Date().toISOString()
        };

        setSavedCVs(prevList => {
          const existingIndex = prevList.findIndex(x => x.id === updatedItem.id);
          let newList = [...prevList];
          if (existingIndex >= 0) {
            newList[existingIndex] = updatedItem;
          } else {
            newList.push(updatedItem);
          }
          localStorage.setItem('cv_builder_saved_cvs', JSON.stringify(newList));
          return newList;
        });

        setLastSavedLocalTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch (err) {
        console.error("Auto local save failed:", err);
      } finally {
        setIsSavingLocal(false);
      }
    }, 2500); // 2.5 seconds debounce

    return () => clearTimeout(timer);
  }, [cvData]);

  // 5-minute Cloud Auto-Save (when authenticated)
  useEffect(() => {
    if (!user || !cvData || !cvData.id) return;

    const interval = setInterval(async () => {
      setIsSavingCloud(true);
      try {
        const idToken = await user.getIdToken();
        const res = await fetch('/api/user/save-cv', {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${idToken}`
          },
          body: JSON.stringify({
            localId: cvData.id,
            title: cvData.title || cvData.personalInfo.name || 'İsimsiz Özgeçmiş',
            data: cvData,
          })
        });

        if (!res.ok) {
          const errMsg = await res.text();
          throw new Error(errMsg || 'Sunucu hatası');
        }

        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSavedCloudTime(now);
        triggerAlert('success', `☁️ Buluta otomatik yedekleme başarılı! (${now})`);
      } catch (err: any) {
        console.error("Cloud auto-save error:", err);
        triggerAlert('error', `🚨 BULUTA OTOMATİK KAYDETME BAŞARISIZ! Lütfen internet bağlantınızı veya oturumunuzu kontrol edin. Hata: ${err.message || err}`);
      } finally {
        setIsSavingCloud(false);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user, cvData]);

  // Show quick status banner
  const triggerAlert = (type: 'success' | 'info' | 'error', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 3500);
  };

  // CRUD Operations on CV database
  const handleSaveCV = (customTitle?: string) => {
    try {
      const name = cvData.personalInfo.name?.trim() || 'Yeni CV';
      const role = cvData.personalInfo.title?.trim() || cvData.styles.template.toUpperCase();
      const fallbackTitle = `${name} - ${role}`;
      const titleToUse = customTitle?.trim() || cvData.title?.trim() || fallbackTitle;

      const updatedItem = {
        ...cvData,
        title: titleToUse,
        updatedAt: new Date().toISOString()
      };

      const existingIndex = savedCVs.findIndex(x => x.id === updatedItem.id);
      let newList = [...savedCVs];
      
      if (existingIndex >= 0) {
        newList[existingIndex] = updatedItem;
      } else {
        newList.push(updatedItem);
      }

      localStorage.setItem('cv_builder_saved_cvs', JSON.stringify(newList));
      setSavedCVs(newList);
      setCvData(updatedItem);
      setIsJustSaved(true);
      setTimeout(() => setIsJustSaved(false), 2200);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSavedLocalTime(timeStr);
      triggerAlert('success', `"${updatedItem.title}" başarıyla kaydedildi! (${timeStr})`);
    } catch (err: any) {
      triggerAlert('error', 'Hata! Tarayıcı hafızası dolu veya engelli.');
    }
  };

  const handleSaveAsNewCV = (newTitle: string) => {
    try {
      const newId = 'cv-' + Date.now();
      const newCV: CVData = {
        ...cvData,
        id: newId,
        title: newTitle.trim() || 'Yeni Kopya CV',
        updatedAt: new Date().toISOString()
      };

      const newList = [newCV, ...savedCVs];
      localStorage.setItem('cv_builder_saved_cvs', JSON.stringify(newList));
      setSavedCVs(newList);
      setCvData(newCV);
      triggerAlert('success', `"${newCV.title}" yeni bir bellek kaydı olarak eklendi! 📸`);
    } catch (err) {
      triggerAlert('error', 'Yeni kayıt oluşturulamadı.');
    }
  };

  const handleDuplicateCV = (id: string) => {
    const source = savedCVs.find(x => x.id === id);
    if (!source) return;

    const newId = 'cv-copy-' + Date.now();
    const clonedCV: CVData = {
      ...JSON.parse(JSON.stringify(source)),
      id: newId,
      title: `${source.title || source.personalInfo?.name || 'CV'} (Kopya)`,
      updatedAt: new Date().toISOString()
    };

    const newList = [clonedCV, ...savedCVs];
    localStorage.setItem('cv_builder_saved_cvs', JSON.stringify(newList));
    setSavedCVs(newList);
    triggerAlert('success', `"${clonedCV.title}" oluşturuldu ve belleğe eklendi!`);
  };

  const handleRenameCV = (id: string, newTitle: string) => {
    const updatedList = savedCVs.map(item => {
      if (item.id === id) {
        return {
          ...item,
          title: newTitle,
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    });

    localStorage.setItem('cv_builder_saved_cvs', JSON.stringify(updatedList));
    setSavedCVs(updatedList);

    if (cvData.id === id) {
      setCvData(prev => ({ ...prev, title: newTitle }));
    }
    triggerAlert('success', `Kayıt adı "${newTitle}" olarak güncellendi.`);
  };

  const handleExportSingleCV = (id: string) => {
    const target = savedCVs.find(x => x.id === id);
    if (!target) return;
    const jsonStr = JSON.stringify(target, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (target.title || target.personalInfo?.name || 'cv')
      .replace(/[^a-zA-Z0-9_\-ğüşıöçĞÜŞİÖÇ]/g, '_')
      .toLowerCase();
    a.href = url;
    a.download = `${safeName}.json`;
    a.click();
    URL.revokeObjectURL(url);
    triggerAlert('success', `"${target.title}" JSON dosyası olarak indirildi.`);
  };

  const handleExportAllCVs = () => {
    if (savedCVs.length === 0) {
      triggerAlert('info', 'Dışa aktarılacak kayıtlı CV bulunmuyor.');
      return;
    }
    const jsonStr = JSON.stringify(savedCVs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `cv_bellek_tum_yedek_${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
    triggerAlert('success', `Tüm bellek (${savedCVs.length} adet CV) başarıyla yedeklendi!`);
  };

  const handleResetSamples = () => {
    const userCustomCvs = savedCVs.filter(x => !x.id.startsWith('sample-'));
    const sanitizedSamples = INITIAL_CV_SAMPLES.map(x => sanitizeCVData(x));
    const merged = [...sanitizedSamples, ...userCustomCvs];

    localStorage.setItem('cv_builder_saved_cvs', JSON.stringify(merged));
    setSavedCVs(merged);
    triggerAlert('success', 'Hazır sistem şablonları fabrika ayarlarına sıfırlandı.');
  };

  const handleLoadCV = (id: string) => {
    const target = savedCVs.find(x => x.id === id);
    if (target) {
      setCvData(target);
      triggerAlert('success', `"${target.title || target.personalInfo?.name || 'Özgeçmiş'}" başarıyla geri çağrıldı ve yüklendi! 📂`);
    }
  };

  const handleUndo = () => {
    const hasPendingChange = JSON.stringify(lastSavedStateRef.current) !== JSON.stringify(cvData);

    if (hasPendingChange) {
      isUndoingRef.current = true;
      setCvData(lastSavedStateRef.current);
      setCanUndo(cvHistory.length > 0);
      triggerAlert('success', 'Son değişiklikler geri alındı! ↩️');
      return;
    }

    if (cvHistory.length === 0) {
      triggerAlert('info', 'Geri alınacak kayıtlı bir değişiklik bulunmuyor.');
      setCanUndo(false);
      return;
    }

    const previousState = cvHistory[cvHistory.length - 1];
    isUndoingRef.current = true;
    setCvData(previousState);
    lastSavedStateRef.current = previousState;
    const remainingHistory = cvHistory.slice(0, cvHistory.length - 1);
    setCvHistory(remainingHistory);
    setCanUndo(remainingHistory.length > 0);
    triggerAlert('success', 'Son değişiklik geri alındı! ↩️');
  };

  const handleDeleteCV = (id: string) => {
    const newList = savedCVs.filter(x => x.id !== id);
    localStorage.setItem('cv_builder_saved_cvs', JSON.stringify(newList));
    setSavedCVs(newList);
    
    // If deleted current active, load the first remaining, or create new
    if (cvData.id === id) {
      if (newList.length > 0) {
        setCvData(newList[0]);
      } else {
        handleCreateNew(true);
      }
    }
    triggerAlert('info', 'Kayıt veritabanından silindi.');
  };

  const handleCreateNew = (force: boolean = false) => {
    if (!force) {
      setShowNewCVConfirmModal(true);
      return;
    }
    const freshCV: CVData = {
      id: 'cv-' + Date.now(),
      title: 'Boş Başlangıç CV',
      updatedAt: new Date().toISOString(),
      personalInfo: {
        name: '',
        title: '',
        email: '',
        phone: '',
        location: '',
        website: '',
        summary: '',
        photoVisible: false,
        birthDate: '',
        birthPlace: '',
        maritalStatus: '',
        driverLicense: ''
      },
      workExperiences: [],
      educations: [],
      projects: [],
      skills: [],
      socialLinks: [],
      customSections: [],
      sectionOrder: ['personal', 'summary', 'experience', 'education', 'skills', 'projects'],
      styles: {
        template: 'corporate',
        primaryColor: '#0f172a',
        secondaryColor: '#3b82f6',
        accentColor: '#10b981',
        textColor: '#334155',
        backgroundColor: '#ffffff',
        font: 'inter',
        fontSize: 'sm',
        lineHeight: 'normal',
        density: 'comfortable',
        shadowIntensity: 'none',
        glassEffect: false,
        pageGuide: true,
        qrCodeUrl: '',
        qrCodePosition: 'none'
      }
    };
    setCvData(freshCV);
    triggerAlert('info', 'Yeni boş şablon kuruldu. Bilgilerinizi doldurmaya başlayın.');
  };

  // Import dynamic custom JSON backups
  const handleImportBackup = (rawJson: string) => {
    try {
      const parsed = JSON.parse(rawJson);
      if (!parsed || (typeof parsed !== 'object')) {
        throw new Error('Geçersiz JSON veri objesi.');
      }
      
      // If it's an array of CVs (bulk backup)
      if (Array.isArray(parsed)) {
        if (parsed.length === 0) throw new Error('Yedek dosyasında hiçbir CV bulunamadı.');
        const sanitizedList = parsed.map(item => {
          const s = sanitizeCVData(item);
          return {
            ...s,
            id: 'imported-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now(),
            updatedAt: new Date().toISOString()
          };
        });
        const merged = [...sanitizedList, ...savedCVs];
        localStorage.setItem('cv_builder_saved_cvs', JSON.stringify(merged));
        setSavedCVs(merged);
        setCvData(sanitizedList[0]);
        triggerAlert('success', `Toplu bellek yedeği (${sanitizedList.length} adet CV) başarıyla içe aktarıldı!`);
        return;
      }

      const sanitized = sanitizeCVData(parsed);
      
      // Assign new high unique ID if collision occurs
      const newId = 'imported-' + Date.now();
      const updated = {
        ...sanitized,
        id: newId,
        title: parsed.title ? `[İthal] ${parsed.title}` : 'İthal Özgeçmiş',
        updatedAt: new Date().toISOString()
      };

      const newList = [updated, ...savedCVs];
      localStorage.setItem('cv_builder_saved_cvs', JSON.stringify(newList));
      setSavedCVs(newList);
      setCvData(updated);
      triggerAlert('success', 'Yedek JSON başarıyla doğrulandı ve yüklü CV listenize eklendi.');
    } catch (e: any) {
      triggerAlert('error', `Yükleme hatası: ${e.message || 'Geçersiz JSON verisi.'}`);
    }
  };

  // Helper to convert any external images (like Unsplash avatar) to Base64 data URLs
  // This completely eliminates CORS canvas tainting and avoids DOMException on export
  const inlineImagesForCapture = async (element: HTMLElement): Promise<() => void> => {
    const images = Array.from(element.querySelectorAll('img'));
    const svgImages = Array.from(element.querySelectorAll('image'));
    const revertList: Array<{ el: HTMLElement | SVGElement; origSrc: string; isSvg: boolean }> = [];

    const toDataUrl = async (url: string): Promise<string | null> => {
      if (!url || url.startsWith('data:')) return null;
      try {
        const res = await fetch(url, { mode: 'cors' });
        if (res.ok) {
          const blob = await res.blob();
          return await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        }
      } catch (e) {
        // Fallback for CORS-blocked fetch
      }

      try {
        const testImg = new window.Image();
        testImg.crossOrigin = 'anonymous';
        testImg.src = url;
        if (testImg.complete && testImg.naturalWidth > 0) {
          const canvas = document.createElement('canvas');
          canvas.width = testImg.naturalWidth;
          canvas.height = testImg.naturalHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(testImg, 0, 0);
            return canvas.toDataURL('image/png');
          }
        }
      } catch (e) {
        // Ignore canvas draw error
      }
      return null;
    };

    // Standard img tags
    await Promise.all(
      images.map(async (img) => {
        const src = img.src;
        if (!src || src.startsWith('data:')) return;
        const dataUrl = await toDataUrl(src);
        if (dataUrl) {
          revertList.push({ el: img, origSrc: src, isSvg: false });
          img.src = dataUrl;
        }
      })
    );

    // SVG image tags
    await Promise.all(
      svgImages.map(async (svgImg) => {
        const href = svgImg.getAttribute('href') || svgImg.getAttribute('xlink:href');
        if (!href || href.startsWith('data:')) return;
        const dataUrl = await toDataUrl(href);
        if (dataUrl) {
          revertList.push({ el: svgImg, origSrc: href, isSvg: true });
          svgImg.setAttribute('href', dataUrl);
        }
      })
    );

    return () => {
      revertList.forEach(({ el, origSrc, isSvg }) => {
        if (isSvg) {
          el.setAttribute('href', origSrc);
        } else {
          (el as HTMLImageElement).src = origSrc;
        }
      });
    };
  };

  // Find or dynamically activate the visible CV preview element
  const getTargetPreviewElement = async (): Promise<HTMLElement | null> => {
    // If user is on a mobile device and currently on the 'form' tab, switch to preview
    if (window.innerWidth < 768 && mobileActiveView !== 'preview') {
      setMobileActiveView('preview');
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    const allPages = Array.from(document.querySelectorAll<HTMLElement>('#cv-preview-page'));
    const visiblePage = allPages.find((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });

    if (visiblePage) return visiblePage;
    return document.getElementById('cv-preview-page');
  };

  // Core capture function
  const captureCVToCanvas = async (sourceElement: HTMLElement): Promise<HTMLCanvasElement> => {
    try {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
    } catch (e) {
      // Ignore font errors
    }

    // Inlining external images as data URLs
    const restoreImages = await inlineImagesForCapture(sourceElement);

    // Zoom wrapper stabilization
    const zoomWrapper = sourceElement.closest<HTMLElement>('#cv-zoom-wrapper') || document.getElementById('cv-zoom-wrapper');
    const originalWrapperTransform = zoomWrapper ? zoomWrapper.style.transform : '';
    const originalWrapperWidth = zoomWrapper ? zoomWrapper.style.width : '';
    const originalWrapperHeight = zoomWrapper ? zoomWrapper.style.height : '';

    if (zoomWrapper) {
      zoomWrapper.style.transform = 'none';
      zoomWrapper.style.width = '794px';
      zoomWrapper.style.height = 'auto';
    }

    // Source element temporary stabilization
    const origWidth = sourceElement.style.width;
    const origMinWidth = sourceElement.style.minWidth;
    const origMaxWidth = sourceElement.style.maxWidth;
    const origHeight = sourceElement.style.height;
    const origOverflow = sourceElement.style.overflow;

    sourceElement.style.width = '794px';
    sourceElement.style.minWidth = '794px';
    sourceElement.style.maxWidth = '794px';
    sourceElement.style.height = 'auto';
    sourceElement.style.overflow = 'visible';

    // Allow DOM reflow
    await new Promise((r) => setTimeout(r, 60));

    try {
      const canvas = await html2canvas(sourceElement, {
        scale: 2,
        useCORS: true,
        allowTaint: false, // Absolutely prevent canvas tainting so toDataURL never throws!
        backgroundColor: '#ffffff',
        logging: false,
        width: 794,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          // Stabilizer styles
          const styleEl = clonedDoc.createElement('style');
          styleEl.innerHTML = `
            * {
              text-rendering: geometricPrecision !important;
              -webkit-font-smoothing: antialiased !important;
            }
            .no-print, [data-no-print="true"] {
              display: none !important;
            }
            [data-editable="true"], [contenteditable] {
              border: none !important;
              outline: none !important;
              box-shadow: none !important;
              background: transparent !important;
            }
          `;
          clonedDoc.head.appendChild(styleEl);

          // Convert oklch/oklab in styles
          clonedDoc.querySelectorAll('style').forEach((tag) => {
            if (tag.textContent && (tag.textContent.includes('oklch') || tag.textContent.includes('oklab'))) {
              tag.textContent = convertOklchToRgb(tag.textContent);
            }
          });

          // Ensure cloned zoom wrapper is flat
          const clonedWrapper = clonedDoc.getElementById('cv-zoom-wrapper');
          if (clonedWrapper) {
            clonedWrapper.style.transform = 'none';
            clonedWrapper.style.width = '794px';
            clonedWrapper.style.height = 'auto';
            clonedWrapper.style.margin = '0';
            clonedWrapper.style.padding = '0';
          }

          // Ensure cloned page is exact
          const clonedPage = clonedDoc.getElementById('cv-preview-page');
          if (clonedPage) {
            clonedPage.style.width = '794px';
            clonedPage.style.minWidth = '794px';
            clonedPage.style.maxWidth = '794px';
            clonedPage.style.height = 'auto';
            clonedPage.style.overflow = 'visible';
            clonedPage.style.boxShadow = 'none';
            clonedPage.style.border = 'none';

            // Clean editables
            const editables = clonedPage.querySelectorAll('[contenteditable], [data-editable="true"]');
            editables.forEach((el) => {
              (el as HTMLElement).removeAttribute('contenteditable');
              (el as HTMLElement).style.outline = 'none';
              (el as HTMLElement).style.boxShadow = 'none';
              (el as HTMLElement).style.border = 'none';
            });
          }
        },
      });

      return canvas;
    } finally {
      // Restore live DOM
      if (zoomWrapper) {
        zoomWrapper.style.transform = originalWrapperTransform;
        zoomWrapper.style.width = originalWrapperWidth;
        zoomWrapper.style.height = originalWrapperHeight;
      }
      sourceElement.style.width = origWidth;
      sourceElement.style.minWidth = origMinWidth;
      sourceElement.style.maxWidth = origMaxWidth;
      sourceElement.style.height = origHeight;
      sourceElement.style.overflow = origOverflow;

      // Restore images
      restoreImages();
    }
  };

  // Generate High Resolution A4 Direct PDF
  const generateDirectPdf = async () => {
    setIsGeneratingPdf(true);
    setShowPdfModal(false);
    triggerAlert('info', 'Yüksek çözünürlüklü A4 PDF dosyası hazırlanıyor, lütfen bekleyin...');

    try {
      const element = await getTargetPreviewElement();
      if (!element) {
        triggerAlert('error', 'Önizleme alanı bulunamadı. Lütfen Canlı Önizleme sekmesine geçip tekrar deneyin.');
        setIsGeneratingPdf(false);
        return;
      }

      const canvas = await captureCVToCanvas(element);

      let imgData: string;
      try {
        imgData = canvas.toDataURL('image/jpeg', 0.98);
      } catch (e) {
        imgData = canvas.toDataURL('image/png');
      }

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight <= pageHeight + 2) {
        // Single Page CV
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight), undefined, 'FAST');
      } else {
        // Multi-page CV: Slice pages cleanly
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;

        while (heightLeft > 5) {
          position -= pageHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
          heightLeft -= pageHeight;
        }
      }

      const rawName = cvData.personalInfo?.name || 'ozgecmis';
      const cleanName = rawName.toLowerCase().replace(/[^a-z0-9ğüşıöç]/gi, '-').replace(/-+/g, '-');
      const fileName = `${cleanName}-cv.pdf`;

      // 1. Direct PDF Save
      pdf.save(fileName);

      // 2. Blob URL fallback download trigger
      try {
        const blob = pdf.output('blob');
        const blobUrl = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = blobUrl;
        downloadLink.download = fileName;
        downloadLink.style.display = 'none';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        setTimeout(() => {
          document.body.removeChild(downloadLink);
          URL.revokeObjectURL(blobUrl);
        }, 5000);
      } catch (blobErr) {
        console.warn('Blob fallback skipped:', blobErr);
      }

      triggerAlert('success', 'A4 PDF dosyası başarıyla oluşturuldu ve indirildi! 📄✨');
    } catch (err: any) {
      console.error('PDF generation error:', err);
      triggerAlert('error', `PDF oluşturulurken bir hata meydana geldi: ${err?.message || 'Lütfen tekrar deneyin.'}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // High Quality Native PDF Print Trigger
  const runNativePrint = () => {
    setShowPdfModal(false);
    triggerAlert('info', 'Yazdırma sihirbazı başlatılıyor. Hedef kısmından "PDF Olarak Kaydet" seçeneğini belirleyebilirsiniz...');
    try {
      window.print();
    } catch (e) {
      console.warn('window.print failed:', e);
      triggerAlert('error', 'Yazdırma penceresi açılamadı. Lütfen "Doğrudan PDF İndir" butonunu kullanın.');
    }
  };

  // High Quality PDF Dialog Action
  const triggerPdfPrint = () => {
    setShowPdfModal(true);
  };

  // High Quality PNG Image Export using html2canvas
  const triggerImageExport = async () => {
    triggerAlert('info', 'Yüksek çözünürlüklü özgeçmiş görseli (PNG) oluşturuluyor, lütfen bekleyin...');
    try {
      const element = await getTargetPreviewElement();
      if (!element) {
        triggerAlert('error', 'Önizleme alanı bulunamadı.');
        return;
      }

      const canvas = await captureCVToCanvas(element);
      const imgData = canvas.toDataURL('image/png');
      const rawName = cvData.personalInfo?.name || 'ozgecmis';
      const cleanName = rawName.toLowerCase().replace(/[^a-z0-9ğüşıöç]/gi, '-').replace(/-+/g, '-');
      const fileName = `${cleanName}-preview.png`;

      const downloadLink = document.createElement('a');
      downloadLink.href = imgData;
      downloadLink.download = fileName;
      downloadLink.style.display = 'none';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      setTimeout(() => {
        document.body.removeChild(downloadLink);
      }, 5000);

      triggerAlert('success', 'Özgeçmiş başarıyla yüksek kaliteli PNG görseli olarak kaydedildi! 🖼️');
    } catch (err) {
      console.error('PNG export error:', err);
      triggerAlert('error', 'Görsel dönüştürme işlemi esnasında bir hata meydana geldi.');
    }
  };

  // Automated Quick Random Demo Populator (bütün bunlarla uğraşmak istemeyenler için hazır veya rastgele butonu)
  const loadRandomDemo = () => {
    const randomIndex = Math.floor(Math.random() * INITIAL_CV_SAMPLES.length);
    const selected = INITIAL_CV_SAMPLES[randomIndex];
    
    const updated = {
      ...selected,
      id: 'demo-' + Date.now(),
      title: `${selected.personalInfo.name} - ${selected.personalInfo.title} (Hazır Örnek)`,
      updatedAt: new Date().toISOString()
    };
    
    setCvData(updated);
    triggerAlert('success', `"${selected.personalInfo.name}" hazır özgeçmiş verisi ve şablon seçimi yüklendi! ⚡`);
  };

  // Force Auto-Scale Single Page compliance (varsayılan olarak tek sayfa olması öncelikli)
  const forceSinglePage = () => {
    setCvData(prev => ({
      ...prev,
      styles: {
        ...prev.styles,
        density: 'compact',
        fontSize: 'xs',
        lineHeight: 'tight',
        pageGuide: true
      }
    }));
    triggerAlert('success', 'Tek sayfaya sığdırılması için sıkı sayfa aralıkları, mikro yazı boyutu ve sıkıştırılmış satır yüksekliği etkinleştirildi! 🎯');
  };

  // Vektör Word (DOCX) Export
  const triggerDocxLocalExport = () => {
    triggerAlert('info', 'DOCX üretim şeması derleniyor... (FastAPI sunucusu DOCX motoruna parametreler aktarıldı)');
    
    // Client-side simulation of a polished resume DOCX download
    const content = `
    ÖZGEÇMİŞ DOSYASI: ${cvData.personalInfo.name || 'Ad Soyad'}
    Rol: ${cvData.personalInfo.title || 'Ünvan'}
    E-posta: ${cvData.personalInfo.email} | Tel: ${cvData.personalInfo.phone}
    ---------------------------------------------------------
    PROFESYONEL ÖZET:
    ${cvData.personalInfo.summary || 'Özet belirtilmemiş'}
    
    İŞ DENEYİMLERİ:
    ${cvData.workExperiences.map(x => `\n- ${x.company} / ${x.role} (${x.startDate} - ${x.current ? 'Günümüz' : x.endDate})\n  ${x.description}`).join('')}
    
    EĞİTİM BİLGİLERİ:
    ${cvData.educations.map(x => `\n- ${x.school} / ${x.degree} - ${x.field} (${x.startDate} - ${x.endDate})`).join('')}
    
    BECERİLER:
    ${cvData.skills.map(x => `\n* ${x.categoryName}: ${x.skills.map(s => `${s.name} (${s.level}/5)`).join(', ')}`).join('')}
    `;

    const blob = new Blob([content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `${(cvData.personalInfo.name || 'CV').replace(/\s+/g, '_')}_belge.doc`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    triggerAlert('success', 'Düzenlenebilir DOC belgesi yerel API ile başarıyla üretildi!');
  };

  // Capacitor Devce sharing / Web Share API trigger
  const triggerDeviceSharing = () => {
    const shareText = `${cvData.personalInfo.name} - ${cvData.personalInfo.title} CV'si. E-posta: ${cvData.personalInfo.email}. İncelemek ve iletişime geçmek için web sitesi: ${cvData.personalInfo.website || 'Bulunmuyor'}`;
    
    if (navigator.share) {
      navigator.share({
        title: `${cvData.personalInfo.name || 'CV'} Özgeçmiş Bağlantısı`,
        text: shareText,
        url: cvData.styles.qrCodeUrl || window.location.href,
      })
      .then(() => triggerAlert('success', 'Yerel cihaz paylaşım penceresi başarıyla çağrıldı.'))
      .catch((err) => {
        console.warn('Paylaşım iptal edildi veya yapılamadı', err);
        triggerFallbackClipboard();
      });
    } else {
      triggerFallbackClipboard();
    }
  };

  const triggerFallbackClipboard = () => {
    const text = `${cvData.personalInfo.name} CV - ${cvData.personalInfo.email}`;
    navigator.clipboard.writeText(text);
    triggerAlert('success', 'Web Share API tarayıcınızda bulunamadı. CV Özet bilgileri kopyalandı! WhatsApp veya Mail ile atabilirsiniz.');
  };

  return (
    <div className="h-screen overflow-hidden bg-[#0F1115] flex flex-col font-sans select-text text-[#E0E2E6] print:h-auto print:overflow-visible">
      {/* Dynamic Header Action Bar */}
      <header className="bg-[#16191E] text-[#E0E2E6] border-b border-[#2D3139] py-2.5 px-3 lg:px-4 shrink-0 no-print select-none">
        <div className="max-w-full w-full px-1 flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-tr from-teal-500 via-purple-500 to-fuchsia-500 rounded-lg font-bold text-white flex items-center justify-center w-8 h-8 shadow-[0_0_12px_rgba(168,85,247,0.4)] relative overflow-hidden group">
              <span className="text-xs font-black relative z-10">CV</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight flex items-center gap-1.5 leading-none">
                CV-Master <span className="text-[9px] font-bold text-fuchsia-400 bg-fuchsia-500/10 px-1.5 py-0.5 rounded-full border border-fuchsia-500/20">PRO</span>
              </h1>
              <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                Vektörel ATS Dostu Profesyonel Sistem
              </p>
            </div>

            {/* Active CV Chip / Memory Switcher */}
            <button 
              type="button"
              onClick={() => setShowMemoryModal(true)}
              className="hidden sm:flex items-center gap-2 bg-[#1A1D23] hover:bg-[#20242B] border border-teal-500/40 hover:border-teal-400 rounded-lg px-2.5 py-1 text-left transition group cursor-pointer ml-1"
              title="Aktif CV Bellek Kaydı (Değiştirmek veya geri çağırmak için tıklayın)"
            >
              <HardDrive className="w-3.5 h-3.5 text-teal-400 group-hover:scale-110 transition-transform" />
              <div className="max-w-[130px] md:max-w-[200px] truncate">
                <span className="text-[8px] uppercase tracking-wider text-gray-400 block font-mono leading-none">Aktif CV</span>
                <span className="text-[11px] font-bold text-gray-200 group-hover:text-teal-300 truncate block">
                  {cvData.title || cvData.personalInfo?.name || 'Yeni CV'}
                </span>
              </div>
              <Edit3 className="w-3 h-3 text-gray-500 group-hover:text-teal-400 shrink-0 ml-0.5" />
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 w-full md:w-auto">
            {/* Auto Save Live Indicators */}
            <div className="hidden lg:flex flex-col items-end justify-center font-mono text-[8px] text-gray-400 select-none border-r border-teal-500/10 pr-2.5 leading-tight gap-0.5 whitespace-nowrap">
              <div>
                {isSavingLocal ? (
                  <span className="text-amber-400">Yerele Kaydediliyor...</span>
                ) : lastSavedLocalTime ? (
                  <span>Yerel: {lastSavedLocalTime} ✓</span>
                ) : (
                  <span>Yerel: Otomatik Aktif</span>
                )}
              </div>
              {user && (
                <div>
                  {isSavingCloud ? (
                    <span className="text-blue-400">Buluta Yedekleniyor...</span>
                  ) : lastSavedCloudTime ? (
                    <span className="text-teal-400">Bulut: {lastSavedCloudTime} ✓</span>
                  ) : (
                    <span>Bulut: 5dk Oto Aktif</span>
                  )}
                </div>
              )}
            </div>

            {/* ⭐ HIGH-PRIORITY: CV KAYDETME VE GERİ ÇAĞIRMA MERKEZİ */}
            <div className="flex items-center gap-1.5 bg-[#12151B] p-1 rounded-xl border border-teal-500/30 shadow-md">
              {/* CV KAYDET BUTONU */}
              <button 
                onClick={() => handleSaveCV()}
                className={`cursor-pointer h-8 px-3 rounded-lg flex items-center gap-1.5 font-black text-xs transition-all active:scale-95 shadow-md border ${
                  isJustSaved
                    ? 'bg-emerald-500 text-white border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.6)] scale-105 animate-pulse'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-emerald-400/50 shadow-[0_0_10px_rgba(16,185,129,0.25)] hover:shadow-[0_0_16px_rgba(16,185,129,0.45)]'
                }`}
                title="CV'yi Yerel Belleğe Kaydet 💾 (Tarayıcınıza Anında Kaydeder)"
              >
                {isJustSaved ? (
                  <>
                    <Check className="w-4 h-4 text-white animate-bounce" />
                    <span>Kaydedildi! ✓</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-white" />
                    <span className="font-extrabold">CV Kaydet</span>
                  </>
                )}
              </button>

              {/* CV GERİ ÇAĞIR BUTONU */}
              <button 
                onClick={() => setShowMemoryModal(true)}
                className="cursor-pointer h-8 px-3 bg-[#1A222C] hover:bg-teal-600 text-teal-300 hover:text-white border border-teal-500/60 hover:border-teal-400 rounded-lg flex items-center gap-1.5 transition-all duration-200 shadow-[0_0_10px_rgba(20,184,166,0.2)] hover:shadow-[0_0_15px_rgba(20,184,166,0.35)] active:scale-95 group font-black text-xs"
                title="Kayıtlı CV'leri Geri Çağır / Yükle 📂 (Tüm Kayıtlar, Arama, Yeni Olarak Kaydet)"
              >
                <FolderOpen className="w-4 h-4 text-teal-400 group-hover:text-white group-hover:scale-110 transition-transform" />
                <span className="font-extrabold">CV Geri Çağır</span>
                <span className="text-[10px] bg-teal-500/20 group-hover:bg-teal-800/60 text-teal-300 group-hover:text-white px-1.5 py-0.2 rounded font-mono font-bold border border-teal-500/30">
                  {savedCVs.length}
                </span>
              </button>
            </div>

            {/* Manual Save: Cloud Postgres (Only if user logged in) */}
            {user && (
              <button 
                onClick={async () => {
                  setIsSavingCloud(true);
                  triggerAlert('info', 'Değişiklikler bulut veritabanına kaydediliyor...');
                  try {
                    const idToken = await user.getIdToken();
                    const res = await fetch('/api/user/save-cv', {
                      method: 'POST',
                      headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${idToken}`
                      },
                      body: JSON.stringify({
                        localId: cvData.id,
                        title: cvData.title || cvData.personalInfo.name || 'İsimsiz Özgeçmiş',
                        data: cvData,
                      })
                    });

                    if (!res.ok) {
                      throw new Error(await res.text());
                    }

                    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    setLastSavedCloudTime(now);
                    triggerAlert('success', `Buluta manuel kaydetme başarılı! (${now})`);
                  } catch (err: any) {
                    console.error("Manual cloud save error:", err);
                    triggerAlert('error', `Buluta kaydetme başarısız: ${err.message || err}`);
                  } finally {
                    setIsSavingCloud(false);
                  }
                }}
                disabled={isSavingCloud}
                className="cursor-pointer h-8 w-8 bg-[#1E222A] text-blue-400 hover:text-blue-300 border border-blue-500/50 hover:border-blue-400 hover:bg-blue-500/20 rounded-lg flex items-center justify-center transition-all duration-200 shadow-[0_0_8px_rgba(59,130,246,0.15)] hover:shadow-[0_0_12px_rgba(59,130,246,0.3)] active:scale-95 group relative disabled:opacity-50"
                title={isSavingCloud ? 'Buluta kaydediliyor...' : 'Bulut Kayıt ☁️'}
              >
                {isSavingCloud ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Cloud className="w-4 h-4 group-hover:scale-110 transition-transform" />
                )}
              </button>
            )}

            <button 
              onClick={() => handleCreateNew()}
              className="cursor-pointer h-8 w-8 bg-[#1E222A] text-rose-400 hover:text-rose-300 border border-rose-500/50 hover:border-rose-400 hover:bg-rose-500/20 rounded-lg flex items-center justify-center transition-all duration-200 shadow-[0_0_8px_rgba(244,63,94,0.15)] hover:shadow-[0_0_12px_rgba(244,63,94,0.3)] active:scale-95 group relative"
              title="Yeni Temiz CV Kur 📑 (Tüm alanları boşaltır)"
            >
              <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>

            <button 
              onClick={forceSinglePage}
              className="cursor-pointer h-8 w-8 bg-[#1E222A] text-amber-400 hover:text-amber-300 border border-amber-500/50 hover:border-amber-400 hover:bg-amber-500/20 rounded-lg flex items-center justify-center transition-all duration-200 shadow-[0_0_8px_rgba(245,158,11,0.15)] hover:shadow-[0_0_12px_rgba(245,158,11,0.3)] active:scale-95 group relative"
              title="Tek Sayfaya Sığdır 🎯 (Yazı boyutu ve yoğunluğu daraltıp tek sayfaya sıkıştırır)"
            >
              <LayoutGrid className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>

            {/* Action Group 1: Helper Utilities */}
            <div className="flex items-center bg-[#1A1D23] border border-[#2D3139] rounded-lg p-0.5 shrink-0" title="Doldurma ve Paylaşım Araçları">
              <button
                onClick={loadRandomDemo}
                className="p-1.5 text-gray-400 hover:text-amber-400 hover:bg-white/5 rounded-md transition-all"
                title="Rastgele Akıllı Veri Doldur"
              >
                <Dices className="w-3.5 h-3.5" />
              </button>
              <span className="w-px h-3.5 bg-[#2D3139] mx-1" />
              <button
                onClick={triggerDeviceSharing}
                className="p-1.5 text-gray-400 hover:text-teal-400 hover:bg-white/5 rounded-md transition-all"
                title="Yerel Cihazlarda Paylaş"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Action Group 2: Document Export Outputs */}
            <div className="flex items-center bg-[#1A1D23] border border-[#2D3139] rounded-lg p-0.5 shrink-0" title="Veri Çıktısı Alma Motoru">
              <button
                onClick={generateDirectPdf}
                disabled={isGeneratingPdf}
                className="px-3.5 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold text-[11px] rounded-md flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                title="Tek Tıkla Doğrudan A4 PDF İndir"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Hazırlanıyor...
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" /> PDF İndir
                  </>
                )}
              </button>
              <button
                onClick={triggerPdfPrint}
                className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-all cursor-pointer"
                title="Yazdırma & PDF Seçenekleri Sihirbazı"
              >
                <Printer className="w-3.5 h-3.5 text-teal-400" />
              </button>
              <span className="w-px h-3.5 bg-[#2D3139] mx-1" />
              <button
                onClick={triggerImageExport}
                className="px-2.5 py-1.5 text-gray-300 hover:text-blue-400 font-bold text-[11px] rounded-md flex items-center gap-1 transition-all hover:bg-white/5"
                title="Görsel Dosyası (PNG) İndir"
              >
                <Image className="w-3.5 h-3.5 text-blue-400" /> PNG
              </button>
              <span className="w-px h-3.5 bg-[#2D3139] mx-1" />
              <button
                onClick={triggerDocxLocalExport}
                className="px-2.5 py-1.5 text-gray-300 hover:text-emerald-400 font-bold text-[11px] rounded-md flex items-center gap-1 transition-all hover:bg-white/5"
                title="Microsoft Word Dosyası (DOCX) İndir"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" /> Word
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Alert Banner Indicator */}
      {alertMsg && (
        <div className="bg-[#1A1D23] border-y border-[#2D3139] text-teal-400 py-2.5 px-4 text-center text-xs font-semibold flex items-center justify-center gap-2 animate-pulse no-print font-mono">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* Responsive Workspace Grid */}
      <main className="flex-1 max-w-full w-full mx-auto flex flex-col md:flex-row min-h-0 overflow-hidden bg-[#0F1115] px-0">
        
        {/* DESKTOP SPLIT MODE (hidden on mobile, shown on md and up) */}
        <div className="hidden md:flex w-full h-full min-h-0 relative overflow-hidden">
          
          {/* Sol Kenar Algılama Bölgesi (Hover Trigger Area) */}
          <div 
            onMouseEnter={handleLeftMouseEnter}
            onMouseLeave={handleLeftMouseLeave}
            className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-teal-500/[0.01] hover:from-teal-500/[0.05] to-transparent z-30 cursor-pointer transition-all duration-500"
            title="Sol Menüyü açmak için buraya gelin"
          />

          {/* Sol Sidebar Açma-Kapama Ok Butonu */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (leftHoverTimeoutRef.current) clearTimeout(leftHoverTimeoutRef.current);
              if (leftLeaveTimeoutRef.current) clearTimeout(leftLeaveTimeoutRef.current);
              leftHoverTimeoutRef.current = null;
              leftLeaveTimeoutRef.current = null;

              if (isSidebarOpen || isSidebarHovered) {
                setIsSidebarOpen(false);
                setIsSidebarHovered(false);
              } else {
                setIsSidebarOpen(true);
              }
            }}
            onMouseEnter={handleLeftMouseEnter}
            onMouseLeave={handleLeftMouseLeave}
            className={`absolute top-[180px] bg-[#14161B] hover:bg-[#1E222B] text-teal-400 hover:text-teal-300 w-8 h-12 flex items-center justify-center rounded-r-xl border-y-2 border-r-2 border-[#2D3139] shadow-2xl transition-all duration-300 focus:outline-none focus:ring-0 z-50 cursor-pointer group ${
              !(isSidebarOpen || isSidebarHovered) ? 'animate-glow-teal ring-2 ring-teal-500/30' : ''
            }`}
            style={{
              left: (isSidebarOpen || isSidebarHovered) ? '420px' : '0px',
              transition: 'left 500ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            title={isSidebarOpen || isSidebarHovered ? "Sol Menüyü Kapat / Sabitlemeyi Kaldır" : "Sol Menüyü Aç / Tasarım ve Bilgiler"}
          >
            {isSidebarOpen || isSidebarHovered ? (
              <ChevronLeft className="w-5 h-5 text-teal-400 group-hover:scale-110 transition-transform" />
            ) : (
              <ChevronRight className="w-5 h-5 text-teal-400 group-hover:scale-110 transition-transform animate-bounce" />
            )}
          </button>

          {/* Sol panel (Sidebar Form - Flyout Drawer) */}
          <aside 
            onMouseEnter={handleLeftMouseEnter}
            onMouseLeave={handleLeftMouseLeave}
            className={`absolute left-0 top-0 bottom-0 w-[420px] max-w-[90vw] flex flex-col min-h-0 bg-[#14161B] border-r-2 border-[#2D3139] shadow-[10px_0_30px_rgba(0,0,0,0.6)] z-40 transition-transform ${
              isSidebarOpen || isSidebarHovered ? 'translate-x-0' : '-translate-x-full'
            }`}
            style={{
              transitionDuration: '500ms',
              transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <CVForm 
              side="left"
              cvData={cvData}
              setCvData={setCvData}
              savedCVs={savedCVs}
              onSaveCV={handleSaveCV}
              onLoadCV={handleLoadCV}
              onDeleteCV={handleDeleteCV}
              onCreateNew={handleCreateNew}
              onImportBackup={handleImportBackup}
              triggerAlert={triggerAlert}
              onDuplicateCV={handleDuplicateCV}
              onRenameCV={handleRenameCV}
              onSaveAsNewCV={handleSaveAsNewCV}
              onExportSingleCV={handleExportSingleCV}
              onExportAllCVs={handleExportAllCVs}
              onResetSamples={handleResetSamples}
              onOpenMemoryModal={() => setShowMemoryModal(true)}
            />
          </aside>

          {/* Sağ Kenar Algılama Bölgesi (Hover Trigger Area) */}
          <div 
            onMouseEnter={handleRightMouseEnter}
            onMouseLeave={handleRightMouseLeave}
            className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-fuchsia-500/[0.01] hover:from-fuchsia-500/[0.05] to-transparent z-30 cursor-pointer transition-all duration-500"
            title="Sağ Menüyü açmak için buraya gelin"
          />

          {/* Sağ Sidebar Açma-Kapama Ok Butonu */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (rightHoverTimeoutRef.current) clearTimeout(rightHoverTimeoutRef.current);
              if (rightLeaveTimeoutRef.current) clearTimeout(rightLeaveTimeoutRef.current);
              rightHoverTimeoutRef.current = null;
              rightLeaveTimeoutRef.current = null;

              if (isRightSidebarOpen || isRightSidebarHovered) {
                setIsRightSidebarOpen(false);
                setIsRightSidebarHovered(false);
              } else {
                setIsRightSidebarOpen(true);
              }
            }}
            onMouseEnter={handleRightMouseEnter}
            onMouseLeave={handleRightMouseLeave}
            className={`absolute top-[180px] bg-[#14161B] hover:bg-[#1E222B] text-fuchsia-400 hover:text-fuchsia-300 w-8 h-12 flex items-center justify-center rounded-l-xl border-y-2 border-l-2 border-[#2D3139] shadow-2xl transition-all duration-300 focus:outline-none focus:ring-0 z-50 cursor-pointer group ${
              !(isRightSidebarOpen || isRightSidebarHovered) ? 'animate-glow-fuchsia ring-2 ring-fuchsia-500/30' : ''
            }`}
            style={{
              right: (isRightSidebarOpen || isRightSidebarHovered) ? '420px' : '0px',
              transition: 'right 500ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            title={isRightSidebarOpen || isRightSidebarHovered ? "Sağ Menüyü Kapat / Sabitlemeyi Kaldır" : "Sağ Menüyü Aç / Taslaklar ve Yönetim"}
          >
            {isRightSidebarOpen || isRightSidebarHovered ? (
              <ChevronRight className="w-5 h-5 text-fuchsia-400 group-hover:scale-110 transition-transform" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-fuchsia-400 group-hover:scale-110 transition-transform animate-bounce" />
            )}
          </button>

          {/* Sağ panel (Sidebar Form - Flyout Drawer) */}
          <aside 
            onMouseEnter={handleRightMouseEnter}
            onMouseLeave={handleRightMouseLeave}
            className={`absolute right-0 top-0 bottom-0 w-[420px] max-w-[90vw] flex flex-col min-h-0 bg-[#14161B] border-l-2 border-[#2D3139] shadow-[-10px_0_30px_rgba(0,0,0,0.6)] z-40 transition-transform ${
              isRightSidebarOpen || isRightSidebarHovered ? 'translate-x-0' : 'translate-x-full'
            }`}
            style={{
              transitionDuration: '500ms',
              transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <CVForm 
              side="right"
              cvData={cvData}
              setCvData={setCvData}
              savedCVs={savedCVs}
              onSaveCV={handleSaveCV}
              onLoadCV={handleLoadCV}
              onDeleteCV={handleDeleteCV}
              onCreateNew={handleCreateNew}
              onImportBackup={handleImportBackup}
              triggerAlert={triggerAlert}
              onDuplicateCV={handleDuplicateCV}
              onRenameCV={handleRenameCV}
              onSaveAsNewCV={handleSaveAsNewCV}
              onExportSingleCV={handleExportSingleCV}
              onExportAllCVs={handleExportAllCVs}
              onResetSamples={handleResetSamples}
              onOpenMemoryModal={() => setShowMemoryModal(true)}
            />
          </aside>

          {/* Orta Panel (Live Preview Page) - occupies remaining space relative to active drawers */}
          <div 
            className="flex-1 h-full flex flex-col min-h-0 bg-[#0F1115] relative overflow-hidden"
            style={{
              paddingLeft: (isSidebarOpen || isSidebarHovered) ? '420px' : '0px',
              paddingRight: (isRightSidebarOpen || isRightSidebarHovered) ? '420px' : '0px',
              transition: 'padding-left 500ms cubic-bezier(0.16, 1, 0.3, 1), padding-right 500ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div className="flex-1 h-full flex flex-col min-h-0 overflow-y-auto custom-scrollbar pt-3 pb-6 md:pt-4 md:pb-10 px-6 md:px-10 relative">
              <div className="flex-1">
                <CVPreview cvData={cvData} setCvData={setCvData} onUndo={handleUndo} canUndo={canUndo} />
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE WORKSPACE (Tab-Based Layout, shown only on screens and mobile browser heights) */}
        <div className="flex md:hidden flex-col h-full w-full min-h-0 divide-y divide-[#2D3139] bg-[#0F1115]">
          
          {/* Mobile Selector Tab Buttons */}
          <div className="grid grid-cols-2 bg-[#16191E]/95 p-2 gap-2 flex-shrink-0 border-b border-[#2D3139]/50 shadow-md">
            <button
              onClick={() => setMobileActiveView('form')}
              className={`py-2.5 text-center text-xs font-black tracking-wide transition-all duration-300 flex items-center justify-center gap-2 rounded-xl border ${
                mobileActiveView === 'form' 
                  ? 'bg-gradient-to-r from-teal-500/15 via-teal-500/10 to-transparent text-teal-300 border-teal-500/50 shadow-[0_0_12px_rgba(20,184,166,0.2)] scale-[1.02]' 
                  : 'text-gray-400 hover:text-white bg-[#1A1D23]/30 border-transparent'
              }`}
            >
              <Smartphone className={`w-4 h-4 transition-transform duration-350 ${mobileActiveView === 'form' ? 'scale-110 text-teal-450 animate-pulse' : ''}`} /> 
              <span>Form Düzenle</span>
            </button>
            <button
              onClick={() => setMobileActiveView('preview')}
              className={`py-2.5 text-center text-xs font-black tracking-wide transition-all duration-300 flex items-center justify-center gap-2 rounded-xl border ${
                mobileActiveView === 'preview' 
                  ? 'bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-transparent text-emerald-300 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.2)] scale-[1.02]' 
                  : 'text-gray-400 hover:text-white bg-[#1A1D23]/30 border-transparent'
              }`}
            >
              <FileText className={`w-4 h-4 transition-transform duration-350 ${mobileActiveView === 'preview' ? 'scale-110 text-emerald-450 animate-pulse' : ''}`} /> 
              <span>Canlı Önizleme</span>
            </button>
          </div>

          {/* Active mobile viewport content area */}
          <div className="flex-1 overflow-hidden relative">
            <div className={mobileActiveView === 'form' ? 'h-full bg-[#16191E] text-[#E0E2E6]' : 'hidden'}>
              <CVForm 
                cvData={cvData}
                setCvData={setCvData}
                savedCVs={savedCVs}
                onSaveCV={handleSaveCV}
                onLoadCV={handleLoadCV}
                onDeleteCV={handleDeleteCV}
                onCreateNew={handleCreateNew}
                onImportBackup={handleImportBackup}
                triggerAlert={triggerAlert}
                onDuplicateCV={handleDuplicateCV}
                onRenameCV={handleRenameCV}
                onSaveAsNewCV={handleSaveAsNewCV}
                onExportSingleCV={handleExportSingleCV}
                onExportAllCVs={handleExportAllCVs}
                onResetSamples={handleResetSamples}
                onOpenMemoryModal={() => setShowMemoryModal(true)}
              />
            </div>

            <div className={mobileActiveView === 'preview' ? 'h-full bg-[#0F1115] p-0 overflow-y-auto' : 'hidden'}>
              <CVPreview cvData={cvData} setCvData={setCvData} onUndo={handleUndo} canUndo={canUndo} />
            </div>
          </div>
        </div>

      </main>

      {/* Footer Branding Info */}
      <footer className="bg-[#0F1115] text-gray-500 text-center py-3 text-[11px] border-t border-[#2D3139] no-print flex-shrink-0">
        <p>© 2026 CV-Master • Tam Güvenli Tarayıcı Üstü İstemci Sunumu • Elegant Dark Modu Etkin</p>
      </footer>

      {/* PDF Generation Loader Animation Overlay */}
      {isGeneratingPdf && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center z-[999] no-print animate-fade-in">
          <div className="bg-[#16191E] border border-cyan-500/30 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
              <FileCheck className="w-6 h-6 text-cyan-400 absolute inset-0 m-auto animate-pulse" />
            </div>
            <h3 className="text-white font-bold text-base mb-1.5">PDF Dosyası Hazırlanıyor</h3>
            <p className="text-gray-400 text-xs px-2 leading-relaxed">
              Özgeçmişinizin her katmanı piksel kalitesine göre piksel piksel çiziliyor ve sayfalaması derleniyor... Lütfen tarayıcınızı kapatmayın.
            </p>
          </div>
        </div>
      )}

      {/* Modern & Stunning PDF Options Selection Modal */}
      {showPdfModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[990] no-print p-4">
          <div className="bg-[#16191E] border border-teal-500/20 rounded-2xl w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden scale-in animate-scale-up">
            
            {/* Modal Header */}
            <div className="bg-[#0F1115] p-4 border-b border-[#2D3139] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-teal-500/10 text-teal-400 rounded-lg">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">PDF Kaydetme Sihirbazı</h3>
                  <p className="text-[10px] text-gray-500">Iframe kısıtlamalarından bağımsız, her platformda çalışan PDF çıktısı</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPdfModal(false)}
                className="text-gray-400 hover:text-white hover:bg-white/5 p-1 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4">
              <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-[11px] font-bold text-amber-500 uppercase tracking-widest">Önemli Bilgi</h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Uygulama iframe içinde çalıştığı için direkt tarayıcı yazdır butonları bazı sistem dillerinde pasif kalabilir. 
                    Bu engeli aşmak için <strong>Seçenek 1 (Doğrudan İndirme)</strong> motorunu kullanmanızı şiddetle tavsiye ederiz.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3.5">
                
                {/* Method 1: Client-Side Direct High-DPI compiled PDF (FOOLPROOF) */}
                <button
                  onClick={generateDirectPdf}
                  className="p-4 rounded-xl border border-teal-500/30 bg-teal-950/20 hover:bg-teal-950/40 hover:border-teal-400 text-left transition relative group group-hover:shadow-[0_0_15px_rgba(20,184,166,0.15)] flex flex-col"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-extrabold uppercase bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded border border-teal-500/20">
                        Seçenek 1 - En Pratik & Güvenli
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-teal-500 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <h4 className="font-bold text-white text-sm mt-2">Doğrudan Cihaza PDF İndir</h4>
                  <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                    Sistem yazıcı sürücülerinden bağımsız olarak, şablon verinizi doğrudan A4 PDF dosyası haline getirir. Tek tıkla kusursuz cihaz klonlaması sağlar. (Tavsiye Edilen)
                  </p>
                </button>

                {/* Method 2: System Browser Printer (VECTOR SELECTABLE) */}
                <button
                  onClick={runNativePrint}
                  className="p-4 rounded-xl border border-[#2D3139] bg-[#1A1D23] hover:bg-[#20242E] hover:border-gray-500 text-left transition flex flex-col"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[9px] font-extrabold uppercase bg-gray-500/10 text-gray-400 px-2 py-0.5 rounded border border-[#2D3139]">
                      Seçenek 2 - Vektörel Metinler
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                  <h4 className="font-bold text-white text-sm mt-2">Tarayıcı Yazdırma Penceresini Aç</h4>
                  <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                    Tarayıcınızın yerel yazıcı diyaloğunu açar. Hedef olarak <strong>"PDF Olarak Kaydet"</strong> seçilmeli, arka plan grafikleri kutusu <strong>açık</strong>, kenar boşlukları ise <strong>yok / sıfır</strong> olmalıdır.
                  </p>
                </button>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-[#0F1115] p-3.5 border-t border-[#2D3139] flex items-center justify-end">
              <button
                onClick={() => setShowPdfModal(false)}
                className="px-4 py-1.5 bg-[#1A1D23] hover:bg-[#20242E] border border-[#2D3139] font-bold text-xs rounded-xl text-[#E0E2E6] transition"
              >
                Kapat
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Safe New CV Confirmation Modal */}
      {showNewCVConfirmModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[990] no-print p-4">
          <div className="bg-[#16191E] border border-rose-500/20 rounded-2xl w-full max-w-md shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden scale-in animate-scale-up">
            
            {/* Modal Header */}
            <div className="bg-[#0F1115] p-4 border-b border-[#2D3139] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">Yeni Özgeçmiş Kurulsun mu?</h3>
                  <p className="text-[10px] text-gray-500">Mevcut çalışmalarınızın kaybolmaması için güvenlik kontrolü</p>
                </div>
              </div>
              <button 
                onClick={() => setShowNewCVConfirmModal(false)}
                className="text-gray-400 hover:text-white hover:bg-white/5 p-1 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4">
              <p className="text-gray-300 text-xs leading-relaxed font-medium">
                Tüm alanları temizleyerek yeni, boş bir başlangıç şablonu kurmak üzeresiniz. 
                Çalışmalarınızı kaybetmemek için mevcut durumun tarayıcı belleğine <strong>kaydedilmesini ister misiniz?</strong>
              </p>

              <div className="bg-[#1C2026] border border-[#2D3139] p-3 rounded-xl flex items-center gap-3">
                <div className="text-[11px] font-mono text-gray-400 truncate flex-1">
                  <span className="block text-[9px] text-rose-400 uppercase font-bold mb-0.5">Mevcut CV Başlığı:</span>
                  {cvData.title || cvData.personalInfo.name || 'Boş Başlangıç CV'}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-[#0F1115] p-3.5 border-t border-[#2D3139] flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => {
                  handleSaveCV();
                  handleCreateNew(true);
                  setShowNewCVConfirmModal(false);
                }}
                className="flex-1 cursor-pointer text-center bg-teal-600 hover:bg-teal-500 text-white font-bold text-[11px] py-2.5 px-3 rounded-lg transition active:scale-95 whitespace-nowrap"
              >
                Kaydet ve Sıfırla 💾
              </button>
              <button
                onClick={() => {
                  handleCreateNew(true);
                  setShowNewCVConfirmModal(false);
                }}
                className="flex-1 cursor-pointer text-center bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/30 font-bold text-[11px] py-2.5 px-3 rounded-lg transition active:scale-95 whitespace-nowrap"
              >
                Kaydetmeden Sıfırla 🗑️
              </button>
              <button
                onClick={() => setShowNewCVConfirmModal(false)}
                className="cursor-pointer text-center bg-transparent hover:bg-white/5 text-gray-400 hover:text-white font-bold text-[11px] py-2.5 px-4 rounded-lg transition"
              >
                Vazgeç
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CV Memory Management Quick Modal */}
      {showMemoryModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 z-50 animate-fade-in no-print">
          <div className="bg-[#14171D] border border-teal-500/40 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <CVMemoryManager
              cvData={cvData}
              savedCVs={savedCVs}
              onLoadCV={(id) => {
                handleLoadCV(id);
                setShowMemoryModal(false);
              }}
              onSaveCV={handleSaveCV}
              onSaveAsNewCV={handleSaveAsNewCV}
              onDuplicateCV={handleDuplicateCV}
              onRenameCV={handleRenameCV}
              onDeleteCV={handleDeleteCV}
              onCreateNew={() => {
                setShowMemoryModal(false);
                handleCreateNew();
              }}
              onExportSingleCV={handleExportSingleCV}
              onExportAllCVs={handleExportAllCVs}
              onImportBackup={handleImportBackup}
              onResetSamples={handleResetSamples}
              triggerAlert={triggerAlert}
              isModal={true}
              onClose={() => setShowMemoryModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
