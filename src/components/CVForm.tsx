import React, { useState } from 'react';
import { 
  CVData, WorkExperience, Education, Project, SkillCategory, 
  CustomSection, CCStyles, SocialLink 
} from '../types';
import { 
  User, Briefcase, GraduationCap, Code, Star, Heart, 
  Settings, ArrowUp, ArrowDown, Plus, Trash2, Sliders, 
  FileJson, Palette, Sparkles, Copy, Layout, Smartphone, 
  Globe, ChevronDown, ChevronUp, ChevronRight, LayoutGrid, Upload, X, Image,
  FolderOpen, Cloud, Database, HardDrive, History, GripVertical,
  Save, Check, Edit3, FileText, CheckCircle2
} from 'lucide-react';
import { processImportData } from '../utils/dataParser';
import { PRESETS } from '../utils/presets';
import { CVMemoryManager } from './CVMemoryManager.tsx';

interface CVFormProps {
  cvData: CVData;
  setCvData: React.Dispatch<React.SetStateAction<CVData>>;
  savedCVs: CVData[];
  onSaveCV: (customTitle?: string) => void;
  onLoadCV: (id: string) => void;
  onDeleteCV: (id: string) => void;
  onCreateNew: () => void;
  onImportBackup: (rawJson: string) => void;
  triggerAlert?: (type: 'success' | 'info' | 'error', text: string) => void;
  side?: 'left' | 'right' | 'both';
  onDuplicateCV?: (id: string) => void;
  onRenameCV?: (id: string, newTitle: string) => void;
  onSaveAsNewCV?: (title: string) => void;
  onExportSingleCV?: (id: string) => void;
  onExportAllCVs?: () => void;
  onResetSamples?: () => void;
  onOpenMemoryModal?: () => void;
}

const tabStyles = {
  personal: {
    activeBg: 'bg-rose-500/10',
    activeText: 'text-rose-400',
    activeBorder: 'border-rose-500',
    activeShadow: 'shadow-[0_0_12px_rgba(244,63,94,0.15)]',
    hoverBorder: 'hover:border-rose-500/40',
    hoverText: 'hover:text-rose-300'
  },
  experience: {
    activeBg: 'bg-blue-500/10',
    activeText: 'text-blue-400',
    activeBorder: 'border-blue-500',
    activeShadow: 'shadow-[0_0_12px_rgba(59,130,246,0.15)]',
    hoverBorder: 'hover:border-blue-500/40',
    hoverText: 'hover:text-blue-300'
  },
  education: {
    activeBg: 'bg-emerald-500/10',
    activeText: 'text-emerald-400',
    activeBorder: 'border-emerald-500',
    activeShadow: 'shadow-[0_0_12px_rgba(16,185,129,0.15)]',
    hoverBorder: 'hover:border-emerald-500/40',
    hoverText: 'hover:text-emerald-300'
  },
  skills: {
    activeBg: 'bg-amber-500/10',
    activeText: 'text-amber-400',
    activeBorder: 'border-amber-500',
    activeShadow: 'shadow-[0_0_12px_rgba(245,158,11,0.15)]',
    hoverBorder: 'hover:border-amber-500/40',
    hoverText: 'hover:text-amber-300'
  },
  projects: {
    activeBg: 'bg-violet-500/10',
    activeText: 'text-violet-400',
    activeBorder: 'border-violet-500',
    activeShadow: 'shadow-[0_0_12px_rgba(139,92,246,0.15)]',
    hoverBorder: 'hover:border-violet-500/40',
    hoverText: 'hover:text-violet-300'
  },
  custom: {
    activeBg: 'bg-pink-500/10',
    activeText: 'text-pink-400',
    activeBorder: 'border-pink-500',
    activeShadow: 'shadow-[0_0_12px_rgba(236,72,153,0.15)]',
    hoverBorder: 'hover:border-pink-500/40',
    hoverText: 'hover:text-pink-300'
  },
  reorder: {
    activeBg: 'bg-cyan-500/10',
    activeText: 'text-cyan-400',
    activeBorder: 'border-cyan-500',
    activeShadow: 'shadow-[0_0_12px_rgba(6,182,212,0.15)]',
    hoverBorder: 'hover:border-cyan-500/40',
    hoverText: 'hover:text-cyan-300'
  },
  design: {
    activeBg: 'bg-orange-500/10',
    activeText: 'text-orange-400',
    activeBorder: 'border-orange-500',
    activeShadow: 'shadow-[0_0_12px_rgba(249,115,22,0.15)]',
    hoverBorder: 'hover:border-orange-500/40',
    hoverText: 'hover:text-orange-300'
  },
  saved: {
    activeBg: 'bg-teal-500/10',
    activeText: 'text-teal-400',
    activeBorder: 'border-teal-500',
    activeShadow: 'shadow-[0_0_12px_rgba(20,184,166,0.15)]',
    hoverBorder: 'hover:border-teal-500/40',
    hoverText: 'hover:text-teal-300'
  },
  presets: {
    activeBg: 'bg-fuchsia-500/10',
    activeText: 'text-fuchsia-400',
    activeBorder: 'border-fuchsia-500',
    activeShadow: 'shadow-[0_0_12px_rgba(217,70,239,0.15)]',
    hoverBorder: 'hover:border-fuchsia-500/40',
    hoverText: 'hover:text-fuchsia-300'
  }
};

export default function CVForm({
  cvData,
  setCvData,
  savedCVs,
  onSaveCV,
  onLoadCV,
  onDeleteCV,
  onCreateNew,
  onImportBackup,
  triggerAlert,
  side = 'both',
  onDuplicateCV,
  onRenameCV,
  onSaveAsNewCV,
  onExportSingleCV,
  onExportAllCVs,
  onResetSamples,
  onOpenMemoryModal,
}: CVFormProps) {
  const [activeTab, setActiveTab] = useState<'personal' | 'experience' | 'education' | 'skills' | 'projects' | 'custom' | 'reorder' | 'design' | 'saved' | 'presets'>(
    side === 'right' ? 'presets' : 'personal'
  );
  const [justSaved, setJustSaved] = useState(false);
  const handleQuickSave = () => {
    onSaveCV();
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };
  const [dragActive, setDragActive] = useState(false);
  const [pastedDataText, setPastedDataText] = useState('');
  const [importFeedback, setImportFeedback] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);
  const [showPromptGuide, setShowPromptGuide] = useState(false);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [personalExpanded, setPersonalExpanded] = useState<Record<string, boolean>>({
    basic: false,
    avatar: false,
    summary: false
  });

  // Saved & management tab collapsible states
  const [mgmtSectionLocal, setMgmtSectionLocal] = useState(true);
  const [mgmtSectionCloud, setMgmtSectionCloud] = useState(false);
  const [mgmtSectionImport, setMgmtSectionImport] = useState(false);

  // Split savedCVs into user-saved backups and preloaded system samples
  const userCVsList = savedCVs.filter(x => !x.id.startsWith('sample-'));
  const demoCVsList = savedCVs.filter(x => x.id.startsWith('sample-'));

  // Built-in AI Automation States
  const [isAIImporting, setIsAIImporting] = useState(false);
  const [aiRawText, setAiRawText] = useState('');
  const [isOptimizingSummary, setIsOptimizingSummary] = useState(false);
  const [isOptimizingExp, setIsOptimizingExp] = useState<Record<string, boolean>>({});

  const handleAIImport = async () => {
    if (!aiRawText.trim()) {
      if (triggerAlert) triggerAlert('error', 'Lütfen çözümlemek için bir CV metni girin.');
      return;
    }
    setIsAIImporting(true);
    if (triggerAlert) triggerAlert('info', 'Yapay zeka CV bilgilerinizi analiz ediyor, lütfen bekleyin...');
    try {
      const response = await fetch('/api/ai/import-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: aiRawText })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ağ hatası oluştu.');
      }
      const data = await response.json();
      
      const result = processImportData(JSON.stringify(data), cvData);
      if (result.type === 'unknown') {
        if (triggerAlert) triggerAlert('error', result.message);
      } else {
        if (result.patch) {
          setCvData(prev => ({
            ...prev,
            ...result.patch,
            personalInfo: {
              ...prev.personalInfo,
              ...(result.patch.personalInfo || {})
            },
            styles: {
              ...prev.styles,
              ...(result.patch.styles || {})
            }
          }));
          if (triggerAlert) triggerAlert('success', 'Yapay zeka ile CV bilgileri başarıyla içe aktarıldı ve uygulandı!');
          setAiRawText('');
        }
      }
    } catch (err: any) {
      console.error(err);
      if (triggerAlert) triggerAlert('error', `Yapay zeka analiz hatası: ${err.message || err}`);
    } finally {
      setIsAIImporting(false);
    }
  };

  const handleAIOptimizeSummary = async () => {
    const currentSummary = cvData.personalInfo.summary;
    if (!currentSummary || !currentSummary.trim()) {
      if (triggerAlert) triggerAlert('error', 'Önce optimize etmek için kısa bir özet veya taslak yazın.');
      return;
    }
    setIsOptimizingSummary(true);
    if (triggerAlert) triggerAlert('info', 'Özetiniz yapay zeka ile optimize ediliyor...');
    try {
      const response = await fetch('/api/ai/optimize-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: currentSummary, 
          type: 'summary',
          context: cvData.personalInfo.title
        })
      });
      if (!response.ok) throw new Error('Yapay zeka sunucusu yanıt vermedi.');
      const data = await response.json();
      if (data.result) {
        updatePersonalInfo('summary', data.result);
        if (triggerAlert) triggerAlert('success', 'Profesyonel özetiniz başarıyla optimize edildi!');
      }
    } catch (err: any) {
      if (triggerAlert) triggerAlert('error', `Optimizasyon hatası: ${err.message || err}`);
    } finally {
      setIsOptimizingSummary(false);
    }
  };

  const handleAIOptimizeExperience = async (expId: string, currentText: string, pozisyon: string) => {
    if (!currentText || !currentText.trim()) {
      if (triggerAlert) triggerAlert('error', 'Önce açıklama alanına bir şeyler yazın veya taslak ekleyin.');
      return;
    }
    setIsOptimizingExp(prev => ({ ...prev, [expId]: true }));
    if (triggerAlert) triggerAlert('info', 'İş deneyimi açıklamaları yapay zeka ile güçlendiriliyor...');
    try {
      const response = await fetch('/api/ai/optimize-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: currentText, 
          type: 'experience',
          context: pozisyon
        })
      });
      if (!response.ok) throw new Error('Yapay zeka sunucusu yanıt vermedi.');
      const data = await response.json();
      if (data.result) {
        updateExperience(expId, 'description', data.result);
        if (triggerAlert) triggerAlert('success', 'İş deneyimi açıklaması başarıyla optimize edildi!');
      }
    } catch (err: any) {
      if (triggerAlert) triggerAlert('error', `Güçlendirme hatası: ${err.message || err}`);
    } finally {
      setIsOptimizingExp(prev => ({ ...prev, [expId]: false }));
    }
  };

  const togglePersonalExpand = (key: string) => {
    setPersonalExpanded(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const [avatarDragActive, setAvatarDragActive] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setAvatarDragActive(true);
    } else if (e.type === "dragleave") {
      setAvatarDragActive(false);
    }
  };

  const handleAvatarDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAvatarDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processAvatarFile(e.dataTransfer.files[0]);
    }
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processAvatarFile(e.target.files[0]);
    }
  };

  const processAvatarFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      if (triggerAlert) triggerAlert('error', 'Lütfen geçerli bir görsel dosyası seçin! (.jpg, .png gibi)');
      return;
    }
    if (file.size > 2.5 * 1024 * 1024) {
      if (triggerAlert) triggerAlert('error', 'Dosya boyutu çok yüksek (Maksimum 2.5MB). Lütfen daha küçük bir resim yükleyin.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        updatePersonalInfo('avatarUrl', event.target.result as string);
        if (triggerAlert) triggerAlert('success', 'Profil resmi başarıyla yüklendi! 📸');
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await handleFileUpload(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await handleFileUpload(file);
      e.target.value = ''; // Reset to allow re-uploading the same file
    }
  };

  const handleFileUpload = (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          if (text) {
            triggerSmartImport(text);
            resolve();
          } else {
            setImportFeedback({ type: 'error', text: 'Dosya okunamadı veya içeriği boş.' });
            reject(new Error('Dosya okunamadı.'));
          }
        } catch (err: any) {
          setImportFeedback({ type: 'error', text: `Dosya yükleme hatası: ${err.message || err}` });
          reject(err);
        }
      };
      reader.onerror = (err) => {
        setImportFeedback({ type: 'error', text: 'Dosya okunurken bir hata oluştu.' });
        reject(err);
      };
      reader.readAsText(file);
    });
  };

  const triggerSmartImport = (text: string) => {
    if (!text.trim()) {
      setImportFeedback({ type: 'error', text: 'İçerik boş olamaz!' });
      return;
    }
    try {
      const result = processImportData(text, cvData);
      if (result.type === 'unknown') {
        setImportFeedback({ type: 'error', text: result.message });
        if (triggerAlert) {
          triggerAlert('error', result.message);
        }
      } else {
        setImportFeedback({ type: 'success', text: result.message });
        
        // 1. Update CV data dynamically in app state
        if (result.type === 'json' && result.patch && (result.patch as any).personalInfo) {
          setCvData(prev => {
            const patched = result.patch as Partial<CVData>;
            return {
              ...prev,
              ...patched,
              personalInfo: {
                ...prev.personalInfo,
                ...(patched.personalInfo || {})
              },
              styles: {
                ...prev.styles,
                ...(patched.styles || {})
              }
            };
          });
        } else {
          setCvData(prev => ({
            ...prev,
            ...result.patch
          }));
        }

        // 2. Clear pasted text area on success
        setPastedDataText('');

        // 3. Inform the user with a global toast alert and automatically teleport them to the updated section
        if (result.type === 'profile') {
          setActiveTab('personal');
          if (triggerAlert) {
            triggerAlert('success', 'LinkedIn profil bilgileriniz başarıyla içe aktarıldı! "Kişisel" sekmesine yönlendirildiniz.');
          }
        } else if (result.type === 'experience') {
          setActiveTab('experience');
          if (triggerAlert) {
            triggerAlert('success', `${result.message} "Deneyim" sekmesinden yeni eklenen kartları inceleyebilirsiniz.`);
          }
        } else if (result.type === 'education') {
          setActiveTab('education');
          if (triggerAlert) {
            triggerAlert('success', `${result.message} "Eğitim" sekmesinden detayları görebilirsiniz.`);
          }
        } else if (result.type === 'skills') {
          setActiveTab('skills');
          if (triggerAlert) {
            triggerAlert('success', `${result.message} "Yetenek" sekmesine ekledik.`);
          }
        } else if (result.type === 'json') {
          setActiveTab('personal');
          if (triggerAlert) {
            triggerAlert('success', 'Tüm CV verileriniz yedek kodundan başarıyla yüklendi!');
          }
        }
      }
    } catch (err: any) {
      const errMsg = `Ayrıştırma hatası: ${err.message || err}`;
      setImportFeedback({ type: 'error', text: errMsg });
      if (triggerAlert) {
        triggerAlert('error', errMsg);
      }
    }
  };

  // Helper to deep update custom nested objects
  const updatePersonalInfo = (field: string, value: any) => {
    setCvData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value
      }
    }));
  };

  const updateStyles = (field: keyof CCStyles, value: any) => {
    setCvData(prev => ({
      ...prev,
      styles: {
        ...prev.styles,
        [field]: value
      }
    }));
  };

  // Convert plain text or markdown bullet lines to formatted bullets vs normal paragraphs
  const convertToBullets = (text: string) => {
    if (!text) return '• ';
    return text
      .split('\n')
      .map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '';
        if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
          // If already has a bullet, return the line (preserving indent or spaces)
          return line;
        }
        return `• ${trimmed}`;
      })
      .join('\n');
  };

  const convertToParagraph = (text: string) => {
    if (!text) return '';
    return text
      .split('\n')
      .map(line => {
        let trimmed = line.trim();
        if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
          trimmed = trimmed.replace(/^[•\-*]\s*/, '');
        }
        return trimmed;
      })
      .join('\n');
  };

  // Pre-set palette handler
  const selectPreset = (preset: 'corporate' | 'modern' | 'depth3d' | 'modern-geometric' | 'split-sidebar' | 'minimalist-clean' | 'editorial-serif' | 'tech-mono' | 'crimson-split' | 'teal-timeline' | 'dark-gold-arch') => {
    const presets: Record<string, Partial<CCStyles>> = {
      corporate: {
        template: 'corporate',
        primaryColor: '#0f172a',
        secondaryColor: '#475569',
        accentColor: '#0284c7',
        textColor: '#334155',
        backgroundColor: '#ffffff',
        font: 'inter',
        fontSize: 'sm',
        shadowIntensity: 'none',
        glassEffect: false
      },
      modern: {
        template: 'modern',
        primaryColor: '#064e3b',
        secondaryColor: '#10b981',
        accentColor: '#f59e0b',
        textColor: '#1f2937',
        backgroundColor: '#f0fdf4',
        font: 'spaceGrotesk',
        fontSize: 'sm',
        shadowIntensity: 'subtle',
        glassEffect: true
      },
      depth3d: {
        template: 'depth3d',
        primaryColor: '#7c3aed',
        secondaryColor: '#db2777',
        accentColor: '#3b82f6',
        textColor: '#0f172a',
        backgroundColor: '#faf5ff',
        font: 'jetbrains',
        fontSize: 'md',
        shadowIntensity: 'depth3d',
        glassEffect: true
      },
      'modern-geometric': {
        template: 'modern-geometric',
        primaryColor: '#1b2a47', // Koyu Geometrik Arkaplan
        secondaryColor: '#f59e0b', // Altın Sarısı / Turuncu Vurgu
        accentColor: '#3b82f6',
        textColor: '#1e293b',
        backgroundColor: '#ffffff',
        font: 'spaceGrotesk',
        fontSize: 'sm',
        shadowIntensity: 'subtle',
        glassEffect: false
      },
      'split-sidebar': {
        template: 'split-sidebar',
        primaryColor: '#2b5c8f', // Sol sütun kobalt / mavi tonu
        secondaryColor: '#334155', // Ana içerik rengi
        accentColor: '#10b981',
        textColor: '#334155',
        backgroundColor: '#f8fafc',
        font: 'inter',
        fontSize: 'sm',
        shadowIntensity: 'none',
        glassEffect: false
      },
      'minimalist-clean': {
        template: 'minimalist-clean',
        primaryColor: '#1e293b',
        secondaryColor: '#64748b',
        accentColor: '#0f172a',
        textColor: '#1e293b',
        backgroundColor: '#ffffff',
        font: 'inter',
        fontSize: 'sm',
        shadowIntensity: 'none',
        glassEffect: false
      },
      'editorial-serif': {
        template: 'editorial-serif',
        primaryColor: '#451a03',
        secondaryColor: '#b45309',
        accentColor: '#78350f',
        textColor: '#1a1d20',
        backgroundColor: '#fdfdfc',
        font: 'playfair',
        fontSize: 'sm',
        shadowIntensity: 'none',
        glassEffect: false
      },
      'tech-mono': {
        template: 'tech-mono',
        primaryColor: '#090d16',
        secondaryColor: '#10b981',
        accentColor: '#06b6d4',
        textColor: '#090d16',
        backgroundColor: '#ffffff',
        font: 'jetbrains',
        fontSize: 'xs',
        shadowIntensity: 'none',
        glassEffect: false
      },
      'crimson-split': {
        template: 'crimson-split',
        primaryColor: '#A22A38',
        secondaryColor: '#5C1D24',
        accentColor: '#1e293b',
        textColor: '#22252a',
        backgroundColor: '#ffffff',
        font: 'playfair',
        fontSize: 'sm',
        shadowIntensity: 'none',
        glassEffect: false
      },
      'teal-timeline': {
        template: 'teal-timeline',
        primaryColor: '#005E5D',
        secondaryColor: '#008B8B',
        accentColor: '#2b5c8f',
        textColor: '#1e293b',
        backgroundColor: '#ffffff',
        font: 'inter',
        fontSize: 'sm',
        shadowIntensity: 'subtle',
        glassEffect: false
      },
      'dark-gold-arch': {
        template: 'dark-gold-arch',
        primaryColor: '#171717',
        secondaryColor: '#D4AF37',
        accentColor: '#FFDF00',
        textColor: '#1a1a1a',
        backgroundColor: '#ffffff',
        font: 'spaceGrotesk',
        fontSize: 'sm',
        shadowIntensity: 'subtle',
        glassEffect: false
      }
    };

    if (presets[preset]) {
      setCvData(prev => ({
        ...prev,
        styles: {
          ...prev.styles,
          ...presets[preset]
        }
      }));
    }
  };

  // Re-ordering helper
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const list = [...cvData.sectionOrder];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    setCvData(prev => ({
      ...prev,
      sectionOrder: list
    }));
  };

  // Re-ordering array items (Deneyim, Eğitim, Proje, Özel Bölüm vb.)
  const reorderList = <K extends keyof CVData>(
    field: K,
    fromIndex: number,
    toIndex: number
  ) => {
    if (fromIndex === toIndex || fromIndex < 0) return;
    setCvData(prev => {
      const list = [...(prev[field] as any[])];
      if (toIndex < 0 || toIndex >= list.length) return prev;
      const [movedItem] = list.splice(fromIndex, 1);
      list.splice(toIndex, 0, movedItem);
      return {
        ...prev,
        [field]: list
      };
    });
  };

  const moveListItem = <K extends keyof CVData>(
    field: K,
    index: number,
    direction: 'up' | 'down'
  ) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    reorderList(field, index, targetIndex);
  };

  // Skill items inside a category reordering
  const moveSkillInCat = (catId: string, skillIndex: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? skillIndex - 1 : skillIndex + 1;
    setCvData(prev => ({
      ...prev,
      skills: prev.skills.map(cat => {
        if (cat.id !== catId) return cat;
        if (targetIdx < 0 || targetIdx >= cat.skills.length) return cat;
        const list = [...cat.skills];
        const [moved] = list.splice(skillIndex, 1);
        list.splice(targetIdx, 0, moved);
        return { ...cat, skills: list };
      })
    }));
  };

  // Generic Drag and Drop State for list items
  const [draggedItemState, setDraggedItemState] = useState<{ section: string; index: number } | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleItemDragStart = (e: React.DragEvent, section: string, index: number) => {
    e.dataTransfer.setData('text/plain', `${section}:${index}`);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItemState({ section, index });
  };

  const handleItemDragOver = (e: React.DragEvent, section: string, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleItemDrop = (e: React.DragEvent, section: keyof CVData, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    if (!draggedItemState || draggedItemState.section !== section) return;
    reorderList(section, draggedItemState.index, dropIndex);
    setDraggedItemState(null);
  };

  const handleItemDragEnd = () => {
    setDraggedItemState(null);
    setDragOverIndex(null);
  };

  // Section label dictionary
  const sectionLabels: Record<string, string> = {
    personal: 'Kişisel',
    summary: 'Özet',
    experience: 'Deneyimler',
    education: 'Eğitim',
    skills: 'Beceriler',
    projects: 'Projeler',
    custom: 'Sertifikalar / Ekstra'
  };

  // Sürükle Bırak Dokunmatik Sıralama için Web API simülasyonu
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  // Deneyim ekle / çıkar
  const addExperience = () => {
    const newExp: WorkExperience = {
      id: 'w-' + Date.now(),
      company: 'Yeni Şirket',
      role: 'Yeni Rol',
      location: 'Konum',
      startDate: '2026-01',
      endDate: '',
      current: true,
      description: '• Görevlerinizi ve başarılarınızı buraya listeleyin.'
    };
    setCvData(prev => ({
      ...prev,
      workExperiences: [...prev.workExperiences, newExp]
    }));
  };

  const removeExperience = (id: string) => {
    setCvData(prev => ({
      ...prev,
      workExperiences: prev.workExperiences.filter(x => x.id !== id)
    }));
  };

  const updateExperience = (id: string, field: keyof WorkExperience, value: any) => {
    setCvData(prev => ({
      ...prev,
      workExperiences: prev.workExperiences.map(x => x.id === id ? { ...x, [field]: value } : x)
    }));
  };

  // Eğitim ekle / çıkar
  const addEducation = () => {
    const newEdu: Education = {
      id: 'e-' + Date.now(),
      school: 'Üniversite Adı',
      degree: 'Derece (Lisans, YL vb.)',
      field: 'Bölüm',
      location: 'Şehir',
      startDate: '2022-09',
      endDate: '2026-06',
      current: false,
      description: ''
    };
    setCvData(prev => ({
      ...prev,
      educations: [...prev.educations, newEdu]
    }));
  };

  const removeEducation = (id: string) => {
    setCvData(prev => ({
      ...prev,
      educations: prev.educations.filter(x => x.id !== id)
    }));
  };

  const updateEducation = (id: string, field: keyof Education, value: any) => {
    setCvData(prev => ({
      ...prev,
      educations: prev.educations.map(x => x.id === id ? { ...x, [field]: value } : x)
    }));
  };

  // Proje ekle / çıkar
  const addProject = () => {
    const newProj: Project = {
      id: 'p-' + Date.now(),
      name: 'Yeni Proje',
      role: 'Rol (Mimar, Geliştirici vb.)',
      url: '',
      description: 'Projenizin temel amacını ve getirdiği çözümü detaylandırın.',
      technologies: 'React, Go, Redis'
    };
    setCvData(prev => ({
      ...prev,
      projects: [...prev.projects, newProj]
    }));
  };

  const removeProject = (id: string) => {
    setCvData(prev => ({
      ...prev,
      projects: prev.projects.filter(x => x.id !== id)
    }));
  };

  const updateProject = (id: string, field: keyof Project, value: any) => {
    setCvData(prev => ({
      ...prev,
      projects: prev.projects.map(x => x.id === id ? { ...x, [field]: value } : x)
    }));
  };

  // Beceri Kategorisi ekle / çıkar
  const addSkillCategory = () => {
    const newCat: SkillCategory = {
      id: 's-' + Date.now(),
      categoryName: 'Yeni Yetenek Grubu',
      skills: [{ name: 'Yetenek Adı', level: 4 }]
    };
    setCvData(prev => ({
      ...prev,
      skills: [...prev.skills, newCat]
    }));
  };

  const removeSkillCategory = (id: string) => {
    setCvData(prev => ({
      ...prev,
      skills: prev.skills.filter(x => x.id !== id)
    }));
  };

  const updateSkillCategoryName = (id: string, newName: string) => {
    setCvData(prev => ({
      ...prev,
      skills: prev.skills.map(x => x.id === id ? { ...x, categoryName: newName } : x)
    }));
  };

  const addSkillToCategory = (catId: string) => {
    setCvData(prev => ({
      ...prev,
      skills: prev.skills.map(cat => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          skills: [...cat.skills, { name: 'Yeni Beceri', level: 3 }]
        };
      })
    }));
  };

  const removeSkillFromCategory = (catId: string, skillIndex: number) => {
    setCvData(prev => ({
      ...prev,
      skills: prev.skills.map(cat => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          skills: cat.skills.filter((_, idx) => idx !== skillIndex)
        };
      })
    }));
  };

  const updateSkillInCategory = (catId: string, skillIndex: number, field: 'name' | 'level', value: any) => {
    setCvData(prev => ({
      ...prev,
      skills: prev.skills.map(cat => {
        if (cat.id !== catId) return cat;
        const list = [...cat.skills];
        list[skillIndex] = { ...list[skillIndex], [field]: value };
        return {
          ...cat,
          skills: list
        };
      })
    }));
  };

  // Özel Bölüm ekle / çıkar
  const addCustomSection = () => {
    const newSec: CustomSection = {
      id: 'c-' + Date.now(),
      title: 'Kişisel Sertifikalar',
      content: '• LinkedIn Certified Cloud Professional (2025)\n• TOEFL IBT: 105 / 120 (Yüksek Düzey)'
    };
    setCvData(prev => ({
      ...prev,
      customSections: [...prev.customSections, newSec]
    }));
  };

  const removeCustomSection = (id: string) => {
    setCvData(prev => ({
      ...prev,
      customSections: prev.customSections.filter(x => x.id !== id)
    }));
  };

  const updateCustomSection = (id: string, field: keyof CustomSection, value: any) => {
    setCvData(prev => ({
      ...prev,
      customSections: prev.customSections.map(x => x.id === id ? { ...x, [field]: value } : x)
    }));
  };

  return (
    <div className="flex flex-col h-full bg-[#16191E] border-r border-[#2D3139]">
      {/* ⭐ TOP PROMINENT: CV KAYDETME VE GERİ ÇAĞIRMA MERKEZİ */}
      <div className="bg-gradient-to-b from-[#181C23] to-[#12151B] border-b-2 border-teal-500/30 p-3 select-none space-y-2 shadow-md shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
            <span className="text-[10px] uppercase font-mono text-gray-400 font-bold tracking-wider shrink-0">Aktif CV:</span>
            <span className="text-xs font-bold text-gray-200 truncate block" title={cvData.title || cvData.personalInfo?.name}>
              {cvData.title || cvData.personalInfo?.name || 'Yeni Özgeçmiş'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (onOpenMemoryModal) {
                onOpenMemoryModal();
              } else {
                setActiveTab('saved');
              }
            }}
            className="text-[9.5px] font-mono text-teal-300 hover:text-white bg-teal-500/10 hover:bg-teal-500/20 px-2 py-0.5 rounded-full border border-teal-500/30 shrink-0 font-bold cursor-pointer transition flex items-center gap-1"
            title="Kayıtlı CV listesini aç"
          >
            <span>{savedCVs.length} Kayıtlı CV</span>
            <ChevronRight className="w-3 h-3 text-teal-400" />
          </button>
        </div>

        {/* Ana Eylemler: KAYDET ve GERİ ÇAĞIR */}
        <div className="grid grid-cols-2 gap-2">
          {/* CV KAYDET */}
          <button
            type="button"
            onClick={handleQuickSave}
            className={`cursor-pointer py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 border transition-all active:scale-95 shadow-md ${
              justSaved
                ? 'bg-emerald-500 text-white border-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.6)] scale-[1.02]'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-emerald-400/50 shadow-[0_0_12px_rgba(16,185,129,0.3)] hover:shadow-[0_0_18px_rgba(16,185,129,0.5)]'
            }`}
            title="Mevcut özgeçmişinizi yerel tarayıcı belleğine anında kaydeder"
          >
            {justSaved ? (
              <>
                <Check className="w-4 h-4 text-white animate-bounce" />
                <span>Kaydedildi! ✓</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-white" />
                <span>CV'yi Kaydet 💾</span>
              </>
            )}
          </button>

          {/* CV GERİ ÇAĞIR */}
          <button
            type="button"
            onClick={() => {
              if (onOpenMemoryModal) {
                onOpenMemoryModal();
              } else {
                setActiveTab('saved');
              }
            }}
            className="cursor-pointer py-2 px-3 bg-[#1A222C] hover:bg-[#222B38] text-teal-300 hover:text-white border-2 border-teal-500/60 hover:border-teal-400 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_0_10px_rgba(20,184,166,0.2)] hover:shadow-[0_0_15px_rgba(20,184,166,0.35)] group"
            title="Önceden kaydettiğiniz tüm özgeçmişleri görüntüleyin ve geri çağırın"
          >
            <FolderOpen className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
            <span>CV Geri Çağır 📂</span>
          </button>
        </div>
      </div>

      {/* Settings / Controls Quick Ribbon */}
      {(side === 'right' || side === 'both') && (
        <div className="bg-[#1A1D23] border-b border-[#2D3139] shadow-xs select-none">
          <div 
            onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
            className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[#20242D] transition"
          >
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-teal-400 animate-pulse" />
              <h3 className="text-xs font-extrabold text-[#E0E2E6] uppercase tracking-wider">Tasarım & Sayfa Ayarları</h3>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-[9.5px] text-teal-400 font-extrabold bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                {cvData.styles.fontSize.toUpperCase()} • {cvData.styles.density === 'compact' ? 'SIKI' : cvData.styles.density === 'comfortable' ? 'ORTA' : 'GENİŞ'}
              </span>
              {isSettingsExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </div>
          </div>
          
          {isSettingsExpanded && (
            <div className="p-3.5 bg-[#16191E]/50 border-t border-[#2D3139]/50 grid grid-cols-1 md:grid-cols-2 gap-2.5 animate-fade-in text-xs">
              {/* A4 Toggle */}
              <div className="flex items-center justify-between p-2 bg-[#0F1115] border border-[#2D3139] rounded-lg">
                <span className="font-semibold text-gray-300">Sayfa Sınır Çizgisi</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={cvData.styles.pageGuide}
                    onChange={(e) => updateStyles('pageGuide', e.target.checked)}
                    className="rounded text-teal-500 border-[#2D3139] w-4 h-4 bg-[#0F1115]"
                  />
                </label>
              </div>

              {/* Density scale controller */}
              <div className="flex items-center justify-between p-2 bg-[#0F1115] border border-[#2D3139] rounded-lg">
                <span className="font-semibold text-gray-300">Kenar Boşluğu:</span>
                <div className="flex items-center gap-0.5 bg-[#16191E] p-0.5 rounded border border-[#2D3139]">
                  {(['compact', 'comfortable', 'loose'] as const).map((dense) => (
                    <button
                      key={dense}
                      onClick={() => updateStyles('density', dense)}
                      className={`text-[9px] font-bold px-2 py-0.5 rounded transition ${
                        cvData.styles.density === dense 
                          ? 'bg-[#1A1D23] text-teal-400 shadow-xs' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {dense === 'compact' ? 'Sıkı' : dense === 'comfortable' ? 'Orta' : 'Geniş'}
                    </button>
                  ))}
                </div>
              </div>

              {/* FontSize scale controller */}
              <div className="flex items-center justify-between p-2 bg-[#0F1115] border border-[#2D3139] rounded-lg">
                <span className="font-semibold text-gray-300">Yazı Boyutu:</span>
                <div className="flex items-center gap-0.5 bg-[#16191E] p-0.5 rounded border border-[#2D3139]">
                  {(['xs', 'sm', 'md', 'lg'] as const).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => updateStyles('fontSize', sz)}
                      className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase transition ${
                        cvData.styles.fontSize === sz 
                          ? 'bg-[#1A1D23] text-teal-400 shadow-xs' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* LineHeight controller */}
              <div className="flex items-center justify-between p-2 bg-[#0F1115] border border-[#2D3139] rounded-lg">
                <span className="font-semibold text-gray-300">Satır Aralığı:</span>
                <div className="flex items-center gap-0.5 bg-[#16191E] p-0.5 rounded border border-[#2D3139]">
                  {(['tight', 'normal', 'relaxed'] as const).map((lh) => (
                    <button
                      key={lh}
                      onClick={() => updateStyles('lineHeight', lh)}
                      className={`text-[9px] font-bold px-2 py-0.5 rounded transition ${
                        cvData.styles.lineHeight === lh 
                          ? 'bg-[#1A1D23] text-teal-400 shadow-xs' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {lh === 'tight' ? 'Sıkı' : lh === 'normal' ? 'Orta' : 'Geniş'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Internal Navigation Tabs - Separated Content & Configuration Sections */}
      <div className="bg-[#101216] p-3.5 border-b border-[#2D3139] flex-shrink-0 select-none space-y-3.5">
        {/* Sol Kenar Grubu: Sadece Sol veya Her İkisi iken gösterilir */}
        {(side === 'left' || side === 'both') && (
          <div>
            <div className="text-[10px] font-bold text-teal-400/80 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              Özgeçmiş Bilgileri
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {(['personal', 'experience', 'education', 'skills', 'projects', 'custom'] as const).map((tab) => {
                const isActive = activeTab === tab;
                const customStyle = tabStyles[tab as keyof typeof tabStyles];
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`cursor-pointer py-1.5 px-2.5 rounded-lg text-[10.5px] font-bold transition-all duration-300 flex items-center justify-start gap-1.5 border-2 ${
                      isActive 
                        ? `${customStyle.activeBg} ${customStyle.activeText} ${customStyle.activeBorder} ${customStyle.activeShadow} font-extrabold` 
                        : `bg-[#16191E] border-[#2D3139] text-gray-400 ${customStyle.hoverBorder} ${customStyle.hoverText} hover:bg-[#1C2027]`
                    }`}
                  >
                    {tab === 'personal' && (
                      <>
                        <User className={`w-3.5 h-3.5 shrink-0 ${isActive ? customStyle.activeText : 'text-gray-500'}`} />
                        <span className="truncate">Kimlik/Özet</span>
                      </>
                    )}
                    {tab === 'experience' && (
                      <>
                        <Briefcase className={`w-3.5 h-3.5 shrink-0 ${isActive ? customStyle.activeText : 'text-gray-500'}`} />
                        <span className="truncate">Deneyim</span>
                      </>
                    )}
                    {tab === 'education' && (
                      <>
                        <GraduationCap className={`w-3.5 h-3.5 shrink-0 ${isActive ? customStyle.activeText : 'text-gray-500'}`} />
                        <span className="truncate">Eğitim</span>
                      </>
                    )}
                    {tab === 'skills' && (
                      <>
                        <Star className={`w-3.5 h-3.5 shrink-0 ${isActive ? customStyle.activeText : 'text-gray-500'}`} />
                        <span className="truncate">Yetenekler</span>
                      </>
                    )}
                    {tab === 'projects' && (
                      <>
                        <Code className={`w-3.5 h-3.5 shrink-0 ${isActive ? customStyle.activeText : 'text-gray-500'}`} />
                        <span className="truncate">Projeler</span>
                      </>
                    )}
                    {tab === 'custom' && (
                      <>
                        <Heart className={`w-3.5 h-3.5 shrink-0 ${isActive ? customStyle.activeText : 'text-gray-500'}`} />
                        <span className="truncate">Ekstra</span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Sol Kenar için Doğrudan Kayıtlı CV'ler / Geri Çağır Sekmesi */}
            {side === 'left' && (
              <div className="mt-2 pt-2 border-t border-[#2D3139]/50 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('saved')}
                  className={`cursor-pointer w-full py-1.5 px-2.5 rounded-lg text-[10.5px] font-bold transition-all duration-300 flex items-center justify-center gap-2 border-2 ${
                    activeTab === 'saved'
                      ? 'bg-teal-500/15 text-teal-300 border-teal-500 shadow-[0_0_12px_rgba(20,184,166,0.2)] font-extrabold'
                      : 'bg-[#16191E] border-[#2D3139] text-gray-300 hover:border-teal-500/40 hover:text-teal-300 hover:bg-[#1C2027]'
                  }`}
                >
                  <FolderOpen className={`w-3.5 h-3.5 ${activeTab === 'saved' ? 'text-teal-400' : 'text-gray-400'}`} />
                  <span>Kayıtlı CV'ler & Geri Çağır ({savedCVs.length})</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Sağ Kenar Grubu: Sadece Sağ veya Her İkisi iken gösterilir */}
        {(side === 'right' || side === 'both') && (
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80" />
              Tasarım, Sıralama & Yönetim ayarları
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {(['reorder', 'design', 'saved'] as const).map((tab) => {
                const isActive = activeTab === tab;
                const customStyle = tabStyles[tab as keyof typeof tabStyles];
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`cursor-pointer py-1.5 px-1.5 rounded-lg text-[10px] font-bold transition-all duration-300 flex items-center justify-center gap-1 border-2 ${
                      isActive 
                        ? `${customStyle.activeBg} ${customStyle.activeText} ${customStyle.activeBorder} ${customStyle.activeShadow} font-extrabold` 
                        : `bg-[#16191E] border-[#2D3139] text-gray-400 ${customStyle.hoverBorder} ${customStyle.hoverText} hover:bg-[#1C2027]`
                    }`}
                  >
                    {tab === 'reorder' && (
                      <>
                        <Layout className={`w-3.5 h-3.5 shrink-0 ${isActive ? customStyle.activeText : 'text-gray-500'}`} />
                        <span className="truncate">Sıralama</span>
                      </>
                    )}
                    {tab === 'design' && (
                      <>
                        <Palette className={`w-3.5 h-3.5 shrink-0 ${isActive ? customStyle.activeText : 'text-gray-500'}`} />
                        <span className="truncate">Renk/Font</span>
                      </>
                    )}
                    {tab === 'saved' && (
                      <>
                        <Database className={`w-3.5 h-3.5 shrink-0 ${isActive ? customStyle.activeText : 'text-gray-500'}`} />
                        <span className="truncate">Bellek</span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* CV Taslakları - Sadece Sağ Sidebar veya Her İkisi iken gösterilir */}
        {(side === 'right' || side === 'both') && (
          <div>
            <div className="mt-3.5">
              <button
                type="button"
                onClick={() => setActiveTab('presets')}
                className={`w-full cursor-pointer py-3 px-3.5 rounded-xl text-xs font-black transition-all duration-300 flex items-center justify-between border-2 relative overflow-hidden group shadow-md ${
                  activeTab === 'presets'
                    ? 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500 shadow-[0_0_20px_rgba(217,70,239,0.25)] font-extrabold'
                    : 'bg-[#16191E] border-fuchsia-500/20 hover:border-fuchsia-500/50 text-[#e2e8f0] hover:bg-[#1C2027]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Sparkles className={`w-4 h-4 shrink-0 transition-transform ${activeTab === 'presets' ? 'text-fuchsia-400 scale-110 animate-pulse' : 'text-gray-500 group-hover:text-fuchsia-400 group-hover:scale-110'}`} />
                  <div className="text-left min-w-0">
                    <span className="block text-xs font-extrabold tracking-widest uppercase text-white">CV TASLAKLARI</span>
                    <span className="block text-[8.5px] text-gray-400 font-medium tracking-tight mt-0.5 truncate font-bold">8 Farklı Hazır Tasarım Şablonu</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {activeTab === 'presets' ? (
                    <span className="text-[8px] bg-fuchsia-500/20 text-fuchsia-300 px-1.5 py-0.5 rounded-md border border-fuchsia-400/40 uppercase font-extrabold tracking-wider animate-pulse">AÇIK</span>
                  ) : (
                    <span className="text-[8px] bg-[#16191E] text-gray-400 px-1.5 py-0.5 rounded-md border border-[#2D3139] uppercase font-extrabold tracking-wider group-hover:text-fuchsia-400 group-hover:border-fuchsia-500/30 transition-all font-bold">SEÇ</span>
                  )}
                  <LayoutGrid className="w-3.5 h-3.5 text-gray-400 group-hover:text-fuchsia-400 transition-colors" />
                </div>
                {/* Elegant background light reflections */}
                {activeTab === 'presets' && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-fuchsia-400/15 rounded-full blur-xl pointer-events-none -mr-4 -mt-4 animate-pulse" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Primary Scrollable Form Area */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar bg-[#16191E]">
        {/* Personal Details */}
        {activeTab === 'personal' && (
          <div className="space-y-4">
            
            {/* 👤 Temel Bilgiler Accordion */}
            <div className="bg-[#1A1D23] border border-[#2D3139] rounded-xl overflow-hidden shadow-xs">
              <div 
                onClick={() => togglePersonalExpand('basic')}
                className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[#20242D] transition border-b border-transparent data-[expanded=true]:border-[#2D3139]/50 select-none group"
                data-expanded={personalExpanded.basic}
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-teal-500/10 text-teal-400 rounded-lg">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">👤 Temel İletişim Bilgileri</h4>
                    <p className="text-[9.5px] text-gray-400">Ad, Rol, E-posta, Telefon, Konum, Web Sitesi</p>
                  </div>
                </div>
                <div className="text-gray-400 group-hover:text-white transition">
                  {personalExpanded.basic ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {personalExpanded.basic && (
                <div className="p-4 bg-[#16191E]/30 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Ad Soyad</label>
                    <input 
                      type="text" 
                      value={cvData.personalInfo.name} 
                      onChange={(e) => updatePersonalInfo('name', e.target.value)}
                      className="w-full bg-[#0F1115] border border-[#2D3139] text-[#E0E2E6] placeholder-gray-500 rounded p-2 text-sm focus:outline-none focus:border-teal-500"
                      placeholder="Caner Yılmaz" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Rol / Ünvan</label>
                    <input 
                      type="text" 
                      value={cvData.personalInfo.title} 
                      onChange={(e) => updatePersonalInfo('title', e.target.value)}
                      className="w-full bg-[#0F1115] border border-[#2D3139] text-[#E0E2E6] placeholder-gray-500 rounded p-2 text-sm focus:outline-none focus:border-teal-500" 
                      placeholder="Senior Full Stack Architect"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">E-posta</label>
                    <input 
                      type="email" 
                      value={cvData.personalInfo.email} 
                      onChange={(e) => updatePersonalInfo('email', e.target.value)}
                      className="w-full bg-[#0F1115] border border-[#2D3139] text-[#E0E2E6] placeholder-gray-500 rounded p-2 text-sm focus:outline-none focus:border-teal-500" 
                      placeholder="caner@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Telefon</label>
                    <input 
                      type="text" 
                      value={cvData.personalInfo.phone} 
                      onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                      className="w-full bg-[#0F1115] border border-[#2D3139] text-[#E0E2E6] placeholder-gray-500 rounded p-2 text-sm focus:outline-none focus:border-teal-500" 
                      placeholder="+90 555 123 4567"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Konum</label>
                    <input 
                      type="text" 
                      value={cvData.personalInfo.location} 
                      onChange={(e) => updatePersonalInfo('location', e.target.value)}
                      className="w-full bg-[#0F1115] border border-[#2D3139] text-[#E0E2E6] placeholder-gray-500 rounded p-2 text-sm focus:outline-none focus:border-teal-500" 
                      placeholder="İstanbul, Türkiye"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Portfolyo / Web Sitesi</label>
                    <input 
                      type="text" 
                      value={cvData.personalInfo.website} 
                      onChange={(e) => updatePersonalInfo('website', e.target.value)}
                      className="w-full bg-[#0F1115] border border-[#2D3139] text-[#E0E2E6] placeholder-gray-500 rounded p-2 text-sm focus:outline-none focus:border-teal-500" 
                      placeholder="https://caneryilmaz.dev"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Doğum Tarihi</label>
                    <input 
                      type="text" 
                      value={cvData.personalInfo.birthDate || ''} 
                      onChange={(e) => updatePersonalInfo('birthDate', e.target.value)}
                      className="w-full bg-[#0F1115] border border-[#2D3139] text-[#E0E2E6] placeholder-gray-500 rounded p-2 text-sm focus:outline-none focus:border-teal-500" 
                      placeholder="15.06.1997"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Doğum Yeri</label>
                    <input 
                      type="text" 
                      value={cvData.personalInfo.birthPlace || ''} 
                      onChange={(e) => updatePersonalInfo('birthPlace', e.target.value)}
                      className="w-full bg-[#0F1115] border border-[#2D3139] text-[#E0E2E6] placeholder-gray-500 rounded p-2 text-sm focus:outline-none focus:border-teal-500" 
                      placeholder="Erzurum"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Medeni Durum</label>
                    <input 
                      type="text" 
                      value={cvData.personalInfo.maritalStatus || ''} 
                      onChange={(e) => updatePersonalInfo('maritalStatus', e.target.value)}
                      className="w-full bg-[#0F1115] border border-[#2D3139] text-[#E0E2E6] placeholder-gray-500 rounded p-2 text-sm focus:outline-none focus:border-teal-500" 
                      placeholder="Bekar"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Ehliyet</label>
                    <input 
                      type="text" 
                      value={cvData.personalInfo.driverLicense || ''} 
                      onChange={(e) => updatePersonalInfo('driverLicense', e.target.value)}
                      className="w-full bg-[#0F1115] border border-[#2D3139] text-[#E0E2E6] placeholder-gray-500 rounded p-2 text-sm focus:outline-none focus:border-teal-500" 
                      placeholder="B (Yolcu Otomobili)"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 📸 Fotoğraf ve QR Kod Accordion */}
            <div className="bg-[#1A1D23] border border-[#2D3139] rounded-xl overflow-hidden shadow-xs">
              <div 
                onClick={() => togglePersonalExpand('avatar')}
                className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[#20242D] transition border-b border-transparent data-[expanded=true]:border-[#2D3139]/50 select-none group"
                data-expanded={personalExpanded.avatar}
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-teal-500/10 text-teal-400 rounded-lg">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">📸 Fotoğraf ve QR Kod</h4>
                    <p className="text-[9.5px] text-gray-400">Profil fotoğrafı, dinamik QR Kod, hazır resimler ve görünürlük tercihleri</p>
                  </div>
                </div>
                <div className="text-gray-400 group-hover:text-white transition">
                  {personalExpanded.avatar ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {personalExpanded.avatar && (
                <div className="p-4 bg-[#16191E]/30 space-y-4 border-t border-[#2D3139]/40 animate-fade-in text-slate-100">
                  
                  {/* Highly Visible Toggle Control Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    
                    {/* Fotoğrafı Göster Toggle */}
                    <div className="p-3 bg-slate-900/60 border border-teal-500/20 rounded-xl flex items-center justify-between select-none">
                      <span className="text-xs font-bold text-white flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${cvData.personalInfo.photoVisible ? 'bg-teal-400 animate-pulse' : 'bg-gray-600'}`} />
                        Fotoğrafı Göster
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={cvData.personalInfo.photoVisible}
                          onChange={(e) => updatePersonalInfo('photoVisible', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-[#252830] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-200 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500" />
                      </label>
                    </div>

                    {/* QR Kod Göster Toggle */}
                    <div className="p-3 bg-slate-900/60 border border-teal-500/20 rounded-xl flex items-center justify-between select-none">
                      <span className="text-xs font-bold text-white flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${cvData.styles.qrCodePosition !== 'none' ? 'bg-teal-400 animate-pulse' : 'bg-gray-600'}`} />
                        QR Kodunu Göster
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={cvData.styles.qrCodePosition !== 'none' && !!cvData.styles.qrCodeUrl}
                          onChange={(e) => {
                            if (e.target.checked) {
                              updateStyles('qrCodePosition', 'header');
                              if (!cvData.styles.qrCodeUrl) {
                                updateStyles('qrCodeUrl', 'https://linkedin.com');
                              }
                            } else {
                              updateStyles('qrCodePosition', 'none');
                            }
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-[#252830] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-200 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500" />
                      </label>
                    </div>

                  </div>

                  {/* Fotoğraf Detayları & Yükleme (Sadece Fotoğraf Aktifken Gösterilir) */}
                  {cvData.personalInfo.photoVisible && (
                    <div className="p-3.5 bg-slate-900/30 border border-[#2D3139]/80 rounded-xl space-y-3.5">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-center">
                        
                        {/* Mevcut Görsel */}
                        <div className="sm:col-span-3 flex flex-col items-center justify-center p-2.5 bg-slate-950/40 border border-[#2D3139]/60 rounded-xl text-center self-stretch">
                          {cvData.personalInfo.avatarUrl ? (
                            <div className="relative group/avatar w-14 h-14 rounded-lg overflow-hidden shadow-md">
                              <img 
                                src={cvData.personalInfo.avatarUrl} 
                                alt="Profil" 
                                className="w-full h-full object-cover" 
                                referrerPolicy="no-referrer"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  updatePersonalInfo('avatarUrl', '');
                                  if (triggerAlert) triggerAlert('info', 'Fotoğraf kaldırıldı.');
                                }}
                                className="absolute inset-0 bg-red-950/90 hover:bg-red-900 flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition duration-150 cursor-pointer text-white"
                                title="Görseli Kaldır"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span className="text-[8px] font-bold mt-0.5 uppercase">Kaldır</span>
                              </button>
                            </div>
                          ) : (
                            <div className="w-14 h-14 bg-slate-800/40 rounded-lg flex items-center justify-center border border-dashed border-[#2D3139]">
                              <User className="w-6 h-6 text-gray-500" />
                            </div>
                          )}
                        </div>

                        {/* Yükleme Kutusu */}
                        <div className="sm:col-span-9">
                          <div
                            onDragEnter={handleAvatarDrag}
                            onDragOver={handleAvatarDrag}
                            onDragLeave={handleAvatarDrag}
                            onDrop={handleAvatarDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border border-dashed ${
                              avatarDragActive 
                                ? 'border-teal-500 bg-teal-500/10 text-teal-300' 
                                : 'border-[#2D3139] hover:border-teal-500 bg-slate-900/10 hover:bg-slate-950/20 text-gray-300'
                            } rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition duration-150 select-none`}
                          >
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarFileChange}
                              className="hidden"
                            />
                            <Upload className="w-4 h-4 mb-1 text-teal-400" />
                            <p className="text-[11px] font-bold">Fotoğraf Yükle veya Sürükle</p>
                          </div>
                        </div>

                      </div>

                      {/* Örnek Fotoğraflar */}
                      <div className="space-y-1.5 pt-1.5 border-t border-[#2D3139]/40">
                        <span className="block text-[9px] uppercase font-bold text-amber-500 tracking-wider">⚡ Hızlı Seçim İçin Hazır Fotoğraflar</span>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { name: 'Caner', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=210&h=210&fit=crop&crop=face' },
                            { name: 'Gizem', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=210&h=210&fit=crop&crop=face' },
                            { name: 'Serkan', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=210&h=210&fit=crop&crop=face' },
                            { name: 'Zeynep', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=210&h=210&fit=crop&crop=face' },
                          ].map((avatar, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                updatePersonalInfo('avatarUrl', avatar.url);
                                if (triggerAlert) triggerAlert('success', 'Örnek fotoğraf seçildi! 📸');
                              }}
                              className={`group/preset p-1 rounded-lg border bg-slate-900/40 flex items-center gap-1.5 hover:bg-[#1A1D23] transition duration-150 cursor-pointer ${
                                cvData.personalInfo.avatarUrl === avatar.url 
                                  ? 'border-teal-500 bg-teal-500/5' 
                                  : 'border-[#2D3139] hover:border-[#424855]'
                              }`}
                            >
                              <img 
                                src={avatar.url} 
                                alt={avatar.name} 
                                className="w-5 h-5 rounded-full object-cover border border-white/5" 
                                referrerPolicy="no-referrer"
                              />
                              <span className="text-[9px] font-bold text-gray-400 group-hover/preset:text-white truncate">{avatar.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Manuel URL */}
                      <input 
                        type="text" 
                        value={cvData.personalInfo.avatarUrl || ''} 
                        onChange={(e) => updatePersonalInfo('avatarUrl', e.target.value)}
                        className="w-full bg-slate-950/60 border border-[#2D3139] text-[#E0E2E6] placeholder-gray-500 rounded p-1.5 text-[11px] focus:outline-none focus:border-teal-500 font-mono" 
                        placeholder="Manuel Profil Fotoğrafı URL Linki"
                      />
                    </div>
                  )}

                  {/* QR Kod Detayları (Sadece QR Kod Aktifken Gösterilir) */}
                  {cvData.styles.qrCodePosition !== 'none' && (
                    <div className="p-3.5 bg-slate-900/30 border border-[#2D3139]/80 rounded-xl space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">QR Kod Köprü Bağlantısı</label>
                          <input 
                            type="text" 
                            value={cvData.styles.qrCodeUrl || ''} 
                            onChange={(e) => updateStyles('qrCodeUrl', e.target.value)}
                            className="w-full bg-slate-950/60 border border-[#2D3139] text-[#E0E2E6] placeholder-gray-500 rounded p-1.5 text-[11px] focus:outline-none focus:border-teal-500 font-mono" 
                            placeholder="Örn: https://linkedin.com/in/adiniz"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Karekodun Sayfadaki Yeri</label>
                          <select 
                            value={cvData.styles.qrCodePosition}
                            onChange={(e) => updateStyles('qrCodePosition', e.target.value as any)}
                            className="w-full bg-slate-950/60 border border-[#2D3139] text-[#E0E2E6] rounded p-1.5 text-[11px] focus:outline-none focus:border-teal-500 font-semibold"
                          >
                            <option value="none">QR Kodu Gizle</option>
                            <option value="header">Üst Sağ Başlık (Header)</option>
                            <option value="sidebar">Sol / Yan Panel (Sidebar)</option>
                            <option value="footer">Alt Bilgi Sayfa Sonu (Footer)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>

            {/* 📝 Profesyonel Özet Accordion */}
            <div className="bg-[#1A1D23] border border-[#2D3139] rounded-xl overflow-hidden shadow-xs">
              <div 
                onClick={() => togglePersonalExpand('summary')}
                className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[#20242D] transition border-b border-transparent data-[expanded=true]:border-[#2D3139]/50 select-none group"
                data-expanded={personalExpanded.summary}
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-teal-500/10 text-teal-400 rounded-lg">
                    <Heart className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">📝 Profesyonel Özet & Tanıtım</h4>
                    <p className="text-[9.5px] text-gray-400">Yıllara yayılan özet kariyer deneyimi ve hedefler</p>
                  </div>
                </div>
                <div className="text-gray-400 group-hover:text-white transition">
                  {personalExpanded.summary ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {personalExpanded.summary && (
                <div className="p-4 bg-[#16191E]/30">
                  <div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start md:items-center gap-2 mb-1.5">
                      <label className="block text-xs font-semibold text-gray-400 pt-0.5">Profesyonel Özet / Kariyer Hedefi</label>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updatePersonalInfo('summary', convertToBullets(cvData.personalInfo.summary))}
                          className="text-[9.5px] font-bold text-teal-400 hover:text-teal-300 px-1.5 py-0.5 rounded border border-[#2D3139] bg-[#0F1115] transition shrink-0 cursor-pointer"
                          title="Metni madde işaretli listeye dönüştürür."
                        >
                          • Liste Yap
                        </button>
                        <button
                          type="button"
                          onClick={() => updatePersonalInfo('summary', convertToParagraph(cvData.personalInfo.summary))}
                          className="text-[9.5px] font-bold text-gray-400 hover:text-white px-1.5 py-0.5 rounded border border-[#2D3139] bg-[#0F1115] transition shrink-0 cursor-pointer"
                          title="Madde işaretlerini kaldırıp düz paragrafa dönüştürür."
                        >
                          Düz Metin
                        </button>
                        <button
                          type="button"
                          onClick={handleAIOptimizeSummary}
                          disabled={isOptimizingSummary}
                          className="text-[9.5px] font-bold text-amber-400 hover:text-amber-300 border border-amber-500/20 hover:border-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded transition shrink-0 cursor-pointer flex items-center gap-1 disabled:opacity-50"
                          title="Yazınızı Yapay Zeka (AI) destekli profesyonel bir kariyer özetine dönüştürür."
                        >
                          <Sparkles className={`w-3 h-3 ${isOptimizingSummary ? 'animate-spin text-amber-400' : 'text-amber-500 animate-pulse'}`} />
                          {isOptimizingSummary ? 'AI Çalışıyor...' : 'AI ile Optimize Et'}
                        </button>
                      </div>
                    </div>
                    <textarea 
                      rows={4}
                      value={cvData.personalInfo.summary} 
                      onChange={(e) => updatePersonalInfo('summary', e.target.value)}
                      className="w-full bg-[#0F1115] border border-[#2D3139] text-[#E0E2E6] placeholder-gray-500 rounded p-2 text-sm focus:outline-none focus:border-teal-500 leading-relaxed font-sans" 
                      placeholder="Yıllara yayılan deneyiminizi, kritik başarılarınızı ve teknik liderlik vizyonunuzu buraya yazın..."
                    />
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Work Experiences */}
        {activeTab === 'experience' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-[#2D3139] pb-1">
              <h4 className="font-bold text-[#E0E2E6] text-sm">İş Deneyimleri Listesi</h4>
              <button 
                onClick={addExperience}
                className="cursor-pointer flex items-center gap-1.5 text-xs font-extrabold uppercase text-teal-400 hover:text-white bg-[#0F1115] hover:bg-teal-500/10 border-2 border-teal-500 hover:border-teal-400 px-3 py-1.5 rounded-lg transition-all duration-300 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Ekle
              </button>
            </div>

            {/* Reorder Tip */}
            {cvData.workExperiences.length > 1 && (
              <div className="p-2.5 bg-teal-500/10 border border-teal-500/20 rounded-xl flex items-center justify-between text-[11px] text-teal-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <GripVertical className="w-4 h-4 text-teal-400 shrink-0" />
                  Sıralamayı değiştirmek için kartları <strong className="font-bold text-white">tutup sürükleyin</strong> veya <strong className="font-bold text-white">ok butonlarını</strong> kullanın.
                </span>
              </div>
            )}

            {cvData.workExperiences.length === 0 ? (
              <p className="text-center text-xs text-gray-500 py-6">Henüz eklenmiş bir iş deneyimi yok.</p>
            ) : (
              <div className="space-y-4">
                {cvData.workExperiences.map((exp, idx) => {
                  const isExpanded = expandedItems[exp.id] ?? false;
                  return (
                    <div 
                      key={exp.id} 
                      draggable={true}
                      onDragStart={(e) => handleItemDragStart(e, 'workExperiences', idx)}
                      onDragOver={(e) => handleItemDragOver(e, 'workExperiences', idx)}
                      onDrop={(e) => handleItemDrop(e, 'workExperiences', idx)}
                      onDragEnd={handleItemDragEnd}
                      className={`bg-[#1A1D23] border-2 transition-all duration-200 rounded-xl overflow-hidden shadow-xs ${
                        dragOverIndex === idx && draggedItemState?.section === 'workExperiences'
                          ? 'border-teal-400 bg-teal-500/10 scale-[1.01]'
                          : 'border-[#2D3139]'
                      }`}
                    >
                      {/* Accordion Toggle Header */}
                      <div 
                        onClick={() => toggleExpand(exp.id)}
                        className="p-3 flex items-center justify-between cursor-pointer hover:bg-[#20242D] transition border-b border-transparent data-[expanded=true]:border-[#2D3139]/50 select-none group"
                        data-expanded={isExpanded}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <div 
                            className="p-1 text-gray-500 hover:text-teal-400 cursor-grab active:cursor-grabbing shrink-0 transition"
                            title="Tutup sürükleyerek sırasını değiştirin"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col gap-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[9px] font-extrabold text-teal-400 uppercase bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full shrink-0">
                                Deneyim #{idx + 1}
                              </span>
                              <span className="text-xs font-bold text-white truncate max-w-[220px]">
                                {exp.company || 'Şirket Belirtilmemiş'}
                              </span>
                            </div>
                            {(exp.role || exp.startDate) && (
                              <span className="text-[11px] text-gray-400 truncate max-w-[280px]">
                                {exp.role || 'Rol Belirtilmemiş'}
                                {exp.startDate && ` (${exp.startDate} - ${exp.current ? 'Devam Ediyor' : exp.endDate || '...'})`}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-0.5 bg-[#0F1115] p-0.5 rounded-lg border border-[#2D3139]">
                            <button 
                              type="button"
                              onClick={() => moveListItem('workExperiences', idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 text-gray-400 hover:text-teal-400 rounded disabled:opacity-20 disabled:pointer-events-none transition cursor-pointer"
                              title="Yukarı Taşı"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              type="button"
                              onClick={() => moveListItem('workExperiences', idx, 'down')}
                              disabled={idx === cvData.workExperiences.length - 1}
                              className="p-1 text-gray-400 hover:text-teal-400 rounded disabled:opacity-20 disabled:pointer-events-none transition cursor-pointer"
                              title="Aşağı Taşı"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button 
                            type="button"
                            onClick={() => removeExperience(exp.id)}
                            className="p-1.5 text-gray-400 hover:text-[#ef4444] transition rounded-lg hover:bg-red-500/10 cursor-pointer"
                            title="Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            type="button"
                            onClick={() => toggleExpand(exp.id)}
                            className="p-1.5 text-gray-400 group-hover:text-white transition rounded-lg hover:bg-[#2D3139] cursor-pointer"
                            title={isExpanded ? "Daralt" : "Genişlet"}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Accordion Content */}
                      {isExpanded && (
                        <div className="p-4 bg-[#16191E]/30 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase">Şirket / Organizasyon</label>
                              <input 
                                type="text" 
                                value={exp.company} 
                                onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                                className="w-full bg-[#0F1115] border border-[#2D3139] text-[#E0E2E6] rounded p-1.5 text-xs focus:outline-none focus:border-teal-500" 
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase">Rol / Görev Ünvanı</label>
                              <input 
                                type="text" 
                                value={exp.role} 
                                onChange={(e) => updateExperience(exp.id, 'role', e.target.value)}
                                className="w-full bg-[#0F1115] border border-[#2D3139] text-[#E0E2E6] rounded p-1.5 text-xs focus:outline-none focus:border-teal-500" 
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase">Şehir / Konum</label>
                              <input 
                                type="text" 
                                value={exp.location} 
                                onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                                className="w-full bg-[#0F1115] border border-[#2D3139] text-[#E0E2E6] rounded p-1.5 text-xs focus:outline-none focus:border-teal-500" 
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase">Başlangıç</label>
                                <input 
                                  type="text" 
                                  value={exp.startDate} 
                                  onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                                  placeholder="2024-03"
                                  className="w-full bg-[#0F1115] border border-[#2D3139] text-[#E0E2E6] rounded p-1.5 text-xs focus:outline-none focus:border-teal-500" 
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase">Bitiş</label>
                                <input 
                                  type="text" 
                                  value={exp.current ? '' : exp.endDate} 
                                  onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                                  disabled={exp.current}
                                  placeholder={exp.current ? "Devam Ediyor" : "2025-08"}
                                  title={exp.current ? "Hala burada çalışıyorum seçeneği aktif olduğu için bitiş tarihi kilitlidir." : "Bitiş Tarihi"}
                                  className="w-full bg-[#0F1115] border border-[#2D3139] text-[#E0E2E6] rounded p-1.5 text-xs focus:outline-none focus:border-teal-500 disabled:opacity-50 disabled:bg-[#1A1D23] disabled:cursor-not-allowed font-medium" 
                                />
                              </div>
                            </div>
                            <div className="md:col-span-2">
                              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={exp.current}
                                  onChange={(e) => updateExperience(exp.id, 'current', e.target.checked)}
                                  className="rounded text-teal-500 border-[#2D3139] w-3.5 h-3.5 bg-[#0F1115]"
                                />
                                <span className="text-xs text-gray-300 font-medium">Hala burada çalışıyorum</span>
                              </label>
                            </div>
                            <div className="md:col-span-2">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start md:items-center gap-2 mb-1.5">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase pt-0.5 animate-pulse-once">Açıklama (Madde İşaretli / Bullet points)</label>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => updateExperience(exp.id, 'description', convertToBullets(exp.description))}
                                    className="text-[9.5px] font-bold text-teal-400 hover:text-teal-300 px-1.5 py-0.5 rounded border border-[#2D3139] bg-[#0F1115] transition shrink-0 cursor-pointer"
                                    title="Metni madde işaretli listeye dönüştürür."
                                  >
                                    • Liste Yap
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateExperience(exp.id, 'description', convertToParagraph(exp.description))}
                                    className="text-[9.5px] font-bold text-gray-400 hover:text-white px-1.5 py-0.5 rounded border border-[#2D3139] bg-[#0F1115] transition shrink-0 cursor-pointer"
                                    title="Madde işaretlerini kaldırıp düz paragrafa dönüştürür."
                                  >
                                    Düz Metin
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAIOptimizeExperience(exp.id, exp.description, exp.role)}
                                    disabled={isOptimizingExp[exp.id]}
                                    className="text-[9.5px] font-bold text-amber-400 hover:text-amber-300 border border-amber-500/20 hover:border-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded transition shrink-0 cursor-pointer flex items-center gap-1 disabled:opacity-50"
                                    title="İş görevlerini, başarı ve sonuçları ön plana çıkaracak şekilde yapay zeka ile profesyonelleştirir."
                                  >
                                    <Sparkles className={`w-3 h-3 ${isOptimizingExp[exp.id] ? 'animate-spin text-amber-400' : 'text-amber-500 animate-pulse'}`} />
                                    {isOptimizingExp[exp.id] ? 'AI Çalışıyor...' : 'AI ile Optimize Et'}
                                  </button>
                                </div>
                              </div>
                              <textarea 
                                rows={3}
                                value={exp.description} 
                                onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                                className="w-full bg-[#0F1115] border border-[#2D3139] text-[#E0E2E6] rounded p-1.5 text-xs focus:outline-none focus:border-teal-500 font-sans leading-relaxed" 
                                placeholder="• Projeleri yöneterek verimliliği artırdım..."
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Educations */}
        {activeTab === 'education' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-[#2D3139] pb-1">
              <h4 className="font-bold text-[#E0E2E6] text-sm">Eğitim Geçmişi Listesi</h4>
              <button 
                onClick={addEducation}
                className="cursor-pointer flex items-center gap-1.5 text-xs font-extrabold uppercase text-teal-400 hover:text-white bg-[#0F1115] hover:bg-teal-500/10 border-2 border-teal-500 hover:border-teal-400 px-3 py-1.5 rounded-lg transition-all duration-300 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Ekle
              </button>
            </div>

            {/* Reorder Tip */}
            {cvData.educations.length > 1 && (
              <div className="p-2.5 bg-teal-500/10 border border-teal-500/20 rounded-xl flex items-center justify-between text-[11px] text-teal-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <GripVertical className="w-4 h-4 text-teal-400 shrink-0" />
                  Sıralamayı değiştirmek için kartları <strong className="font-bold text-white">tutup sürükleyin</strong> veya <strong className="font-bold text-white">ok butonlarını</strong> kullanın.
                </span>
              </div>
            )}

            {cvData.educations.length === 0 ? (
              <p className="text-center text-xs text-gray-500 py-6">Henüz eklenmiş bir eğitim bilgisi yok.</p>
            ) : (
              <div className="space-y-4">
                {cvData.educations.map((edu, idx) => {
                  const isExpanded = expandedItems[edu.id] ?? false;
                  return (
                    <div 
                      key={edu.id} 
                      draggable={true}
                      onDragStart={(e) => handleItemDragStart(e, 'educations', idx)}
                      onDragOver={(e) => handleItemDragOver(e, 'educations', idx)}
                      onDrop={(e) => handleItemDrop(e, 'educations', idx)}
                      onDragEnd={handleItemDragEnd}
                      className={`bg-[#1A1D23] border-2 transition-all duration-200 rounded-xl overflow-hidden shadow-xs ${
                        dragOverIndex === idx && draggedItemState?.section === 'educations'
                          ? 'border-teal-400 bg-teal-500/10 scale-[1.01]'
                          : 'border-[#2D3139]'
                      }`}
                    >
                      {/* Accordion Toggle Header */}
                      <div 
                        onClick={() => toggleExpand(edu.id)}
                        className="p-3 flex items-center justify-between cursor-pointer hover:bg-[#20242D] transition border-b border-transparent data-[expanded=true]:border-[#2D3139]/50 select-none group"
                        data-expanded={isExpanded}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <div 
                            className="p-1 text-gray-500 hover:text-teal-400 cursor-grab active:cursor-grabbing shrink-0 transition"
                            title="Tutup sürükleyerek sırasını değiştirin"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col gap-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[9px] font-extrabold text-teal-400 uppercase bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full shrink-0">
                                Eğitim #{idx + 1}
                              </span>
                              <span className="text-xs font-bold text-white truncate max-w-[220px]">
                                {edu.school || 'Okul Belirtilmemiş'}
                              </span>
                            </div>
                            {(edu.field || edu.startDate) && (
                              <span className="text-[11px] text-gray-400 truncate max-w-[280px]">
                                {edu.field || 'Bölüm Belirtilmemiş'}
                                {edu.startDate && ` (${edu.startDate} - ${edu.endDate || '...'})`}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-0.5 bg-[#0F1115] p-0.5 rounded-lg border border-[#2D3139]">
                            <button 
                              type="button"
                              onClick={() => moveListItem('educations', idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 text-gray-400 hover:text-teal-400 rounded disabled:opacity-20 disabled:pointer-events-none transition cursor-pointer"
                              title="Yukarı Taşı"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              type="button"
                              onClick={() => moveListItem('educations', idx, 'down')}
                              disabled={idx === cvData.educations.length - 1}
                              className="p-1 text-gray-400 hover:text-teal-400 rounded disabled:opacity-20 disabled:pointer-events-none transition cursor-pointer"
                              title="Aşağı Taşı"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button 
                            type="button"
                            onClick={() => removeEducation(edu.id)}
                            className="p-1.5 text-gray-400 hover:text-[#ef4444] transition rounded-lg hover:bg-red-500/10 cursor-pointer"
                            title="Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            type="button"
                            onClick={() => toggleExpand(edu.id)}
                            className="p-1.5 text-gray-400 group-hover:text-white transition rounded-lg hover:bg-[#2D3139] cursor-pointer"
                            title={isExpanded ? "Daralt" : "Genişlet"}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Accordion Content */}
                      {isExpanded && (
                        <div className="p-4 bg-[#16191E]/30 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase">Okul / Üniversite</label>
                              <input 
                                type="text" 
                                value={edu.school} 
                                onChange={(e) => updateEducation(edu.id, 'school', e.target.value)}
                                className="w-full bg-[#0F1115] border border-[#2D3139] text-[#E0E2E6] rounded p-1.5 text-xs focus:outline-none focus:border-teal-500" 
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase">Bölüm / Alan</label>
                              <input 
                                type="text" 
                                value={edu.field} 
                                onChange={(e) => updateEducation(edu.id, 'field', e.target.value)}
                                className="w-full bg-[#0F1115] border border-[#2D3139] text-[#E0E2E6] rounded p-1.5 text-xs focus:outline-none focus:border-teal-500" 
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase">Derece / Unvan</label>
                              <input 
                                type="text" 
                                value={edu.degree} 
                                onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                                placeholder="Lisans / Onur Derecesi"
                                className="w-full bg-[#0F1115] border border-[#2D3139] text-[#E0E2E6] rounded p-1.5 text-xs focus:outline-none focus:border-teal-500" 
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase">Giriş</label>
                                <input 
                                  type="text" 
                                  value={edu.startDate} 
                                  onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                                  className="w-full bg-[#0F1115] border border-[#2D3139] text-[#E0E2E6] rounded p-1.5 text-xs focus:outline-none focus:border-teal-500" 
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase">Mezuniyet</label>
                                <input 
                                  type="text" 
                                  value={edu.endDate} 
                                  onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                                  className="w-full bg-[#0F1115] border border-[#2D3139] text-[#E0E2E6] rounded p-1.5 text-xs focus:outline-none focus:border-teal-500" 
                                />
                              </div>
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-bold text-gray-400 uppercase">Ekstra Detay (GPA / Onur Tezleri vb.)</label>
                              <input 
                                type="text" 
                                value={edu.description} 
                                onChange={(e) => updateEducation(edu.id, 'description', e.target.value)}
                                className="w-full bg-[#0F1115] border border-[#2D3139] text-[#E0E2E6] rounded p-1.5 text-xs focus:outline-none focus:border-teal-500" 
                                placeholder="Kritik bitirme tezleri, diploma derecesi..."
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Skills Management */}
        {activeTab === 'skills' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-[#2D3139] pb-1">
              <h4 className="font-bold text-[#E0E2E6] text-sm">Yetenek ve Tecrübe Dağılımı</h4>
              <button 
                onClick={addSkillCategory}
                className="cursor-pointer flex items-center gap-1.5 text-xs font-extrabold uppercase text-teal-400 hover:text-white bg-[#0F1115] hover:bg-teal-500/10 border-2 border-teal-500 hover:border-teal-400 px-3 py-1.5 rounded-lg transition-all duration-300 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Kategori Ekle
              </button>
            </div>

            {/* Reorder Tip */}
            {cvData.skills.length > 1 && (
              <div className="p-2.5 bg-teal-500/10 border border-teal-500/20 rounded-xl flex items-center justify-between text-[11px] text-teal-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <GripVertical className="w-4 h-4 text-teal-400 shrink-0" />
                  Kategorilerin sırasını değiştirmek için <strong className="font-bold text-white">sürükleyin</strong> veya <strong className="font-bold text-white">okları</strong> kullanın.
                </span>
              </div>
            )}

            {cvData.skills.length === 0 ? (
              <p className="text-center text-xs text-gray-500 py-6">Kayıtlı herhangi bir yetenek bulunamadı.</p>
            ) : (
              <div className="space-y-4">
                {cvData.skills.map((cat, catIdx) => {
                  const isExpanded = expandedItems[cat.id] ?? false;
                  return (
                    <div 
                      key={cat.id} 
                      draggable={true}
                      onDragStart={(e) => handleItemDragStart(e, 'skills', catIdx)}
                      onDragOver={(e) => handleItemDragOver(e, 'skills', catIdx)}
                      onDrop={(e) => handleItemDrop(e, 'skills', catIdx)}
                      onDragEnd={handleItemDragEnd}
                      className={`bg-[#1A1D23] border-2 transition-all duration-200 rounded-xl overflow-hidden shadow-xs ${
                        dragOverIndex === catIdx && draggedItemState?.section === 'skills'
                          ? 'border-teal-400 bg-teal-500/10 scale-[1.01]'
                          : 'border-[#2D3139]'
                      }`}
                    >
                      {/* Category Header */}
                      <div 
                        onClick={() => toggleExpand(cat.id)}
                        className="flex justify-between items-center bg-[#0F1115] p-3 border-b border-[#2D3139] cursor-pointer hover:bg-[#16191F] transition select-none"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div 
                            className="p-1 text-gray-500 hover:text-teal-400 cursor-grab active:cursor-grabbing shrink-0 transition"
                            title="Tutup sürükleyerek sırasını değiştirin"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="text" 
                              value={cat.categoryName}
                              onChange={(e) => updateSkillCategoryName(cat.id, e.target.value)}
                              className="font-bold text-xs text-teal-400 bg-transparent focus:outline-dotted border-0 select-all w-full"
                              placeholder="Örn: Frontend Dilleri" 
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-0.5 bg-[#1A1D23] p-0.5 rounded-lg border border-[#2D3139]">
                            <button 
                              type="button"
                              onClick={() => moveListItem('skills', catIdx, 'up')}
                              disabled={catIdx === 0}
                              className="p-1 text-gray-400 hover:text-teal-400 rounded disabled:opacity-20 disabled:pointer-events-none transition cursor-pointer"
                              title="Kategoriyi Yukarı Taşı"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              type="button"
                              onClick={() => moveListItem('skills', catIdx, 'down')}
                              disabled={catIdx === cvData.skills.length - 1}
                              className="p-1 text-gray-400 hover:text-teal-400 rounded disabled:opacity-20 disabled:pointer-events-none transition cursor-pointer"
                              title="Kategoriyi Aşağı Taşı"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button 
                            type="button"
                            onClick={() => addSkillToCategory(cat.id)}
                            className="cursor-pointer text-[10px] font-black uppercase text-teal-400 hover:text-white bg-[#1A1D22] hover:bg-teal-650 border border-teal-500/30 hover:border-teal-500 px-2 py-1 rounded transition-all duration-200 flex items-center gap-0.5"
                          >
                            <Plus className="w-3 h-3" /> Ekle
                          </button>
                          <span className="text-[#2D3139]">|</span>
                          <button 
                            type="button"
                            onClick={() => removeSkillCategory(cat.id)}
                            className="text-gray-400 hover:text-[#ef4444] transition p-1 rounded hover:bg-red-500/10 cursor-pointer"
                            title="Kategoriyi Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[#2D3139]">|</span>
                          <button 
                            type="button"
                            onClick={() => toggleExpand(cat.id)}
                            className="p-1 text-gray-400 hover:text-white transition cursor-pointer"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-4 space-y-2">
                          {cat.skills.length === 0 ? (
                            <p className="text-center text-[10px] text-gray-500 py-2">Henüz tecrübe eklenmedi.</p>
                          ) : (
                            cat.skills.map((skill, sIdx) => (
                              <div key={sIdx} className="flex items-center gap-2">
                                <div className="flex items-center gap-0.5 bg-[#0F1115] p-0.5 rounded border border-[#2D3139] shrink-0">
                                  <button 
                                    type="button"
                                    onClick={() => moveSkillInCat(cat.id, sIdx, 'up')}
                                    disabled={sIdx === 0}
                                    className="p-0.5 text-gray-400 hover:text-teal-400 disabled:opacity-20 transition cursor-pointer"
                                    title="Yukarı"
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={() => moveSkillInCat(cat.id, sIdx, 'down')}
                                    disabled={sIdx === cat.skills.length - 1}
                                    className="p-0.5 text-gray-400 hover:text-teal-400 disabled:opacity-20 transition cursor-pointer"
                                    title="Aşağı"
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </button>
                                </div>

                                <input 
                                  type="text" 
                                  value={skill.name}
                                  onChange={(e) => updateSkillInCategory(cat.id, sIdx, 'name', e.target.value)}
                                  className="flex-1 bg-[#0F1115] border border-[#2D3139] text-[#E0E2E6] rounded p-1 text-xs focus:outline-none focus:border-teal-500"
                                  placeholder="Figma / Go / AWS" 
                                />
                                
                                {/* Star Selector (1 to 5) */}
                                <div className="flex items-center gap-1 shrink-0" title={`${skill.level}/5 Seviye`}>
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => updateSkillInCategory(cat.id, sIdx, 'level', star)}
                                      className="text-sm p-0.5 focus:scale-125 transition-all duration-200 cursor-pointer"
                                    >
                                      {star <= skill.level ? (
                                        <span className="text-amber-500">★</span>
                                      ) : (
                                        <span className="text-gray-600">★</span>
                                      )}
                                    </button>
                                  ))}
                                </div>

                                <button 
                                  type="button"
                                  onClick={() => removeSkillFromCategory(cat.id, sIdx)}
                                  className="text-gray-400 hover:text-[#ef4444] transition-colors shrink-0 p-1 cursor-pointer"
                                  title="Yetenegi Sil"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Projects */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-[#2D3139] pb-1">
              <h4 className="font-bold text-[#E0E2E6] text-sm">Projeler Listesi</h4>
              <button 
                onClick={addProject}
                className="cursor-pointer flex items-center gap-1.5 text-xs font-extrabold uppercase text-teal-400 hover:text-white bg-[#0F1115] hover:bg-teal-500/10 border-2 border-teal-500 hover:border-teal-400 px-3 py-1.5 rounded-lg transition-all duration-300 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Ekle
              </button>
            </div>

            {/* Reorder Tip */}
            {cvData.projects.length > 1 && (
              <div className="p-2.5 bg-teal-500/10 border border-teal-500/20 rounded-xl flex items-center justify-between text-[11px] text-teal-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <GripVertical className="w-4 h-4 text-teal-400 shrink-0" />
                  Sıralamayı değiştirmek için kartları <strong className="font-bold text-white">tutup sürükleyin</strong> veya <strong className="font-bold text-white">ok butonlarını</strong> kullanın.
                </span>
              </div>
            )}

            {cvData.projects.length === 0 ? (
              <p className="text-center text-xs text-gray-500 py-6">Kayıtlı herhangi bir proje bulunamadı.</p>
            ) : (
              <div className="space-y-4">
                {cvData.projects.map((proj, idx) => {
                  const isExpanded = expandedItems[proj.id] ?? false;
                  return (
                    <div 
                      key={proj.id} 
                      draggable={true}
                      onDragStart={(e) => handleItemDragStart(e, 'projects', idx)}
                      onDragOver={(e) => handleItemDragOver(e, 'projects', idx)}
                      onDrop={(e) => handleItemDrop(e, 'projects', idx)}
                      onDragEnd={handleItemDragEnd}
                      className={`bg-[#1A1D23] border-2 transition-all duration-200 rounded-xl overflow-hidden shadow-xs ${
                        dragOverIndex === idx && draggedItemState?.section === 'projects'
                          ? 'border-teal-400 bg-teal-500/10 scale-[1.01]'
                          : 'border-[#2D3139]'
                      }`}
                    >
                      {/* Accordion Toggle Header */}
                      <div 
                        onClick={() => toggleExpand(proj.id)}
                        className="p-3 flex items-center justify-between cursor-pointer hover:bg-[#20242D] transition border-b border-transparent data-[expanded=true]:border-[#2D3139]/50 select-none group"
                        data-expanded={isExpanded}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <div 
                            className="p-1 text-gray-500 hover:text-teal-400 cursor-grab active:cursor-grabbing shrink-0 transition"
                            title="Tutup sürükleyerek sırasını değiştirin"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col gap-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[9px] font-extrabold text-[#f59e0b] uppercase bg-[#f59e0b]/10 border border-[#f59e0b]/20 px-2 py-0.5 rounded-full shrink-0">
                                Proje #{idx + 1}
                              </span>
                              <span className="text-xs font-bold text-white truncate max-w-[220px]">
                                {proj.name || 'Proje İsmi Belirtilmemiş'}
                              </span>
                            </div>
                            {(proj.role || proj.technologies) && (
                              <span className="text-[11px] text-gray-400 truncate max-w-[280px]">
                                {proj.role || 'Rol Belirtilmemiş'}
                                {proj.technologies && ` [${proj.technologies}]`}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-0.5 bg-[#0F1115] p-0.5 rounded-lg border border-[#2D3139]">
                            <button 
                              type="button"
                              onClick={() => moveListItem('projects', idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 text-gray-400 hover:text-teal-400 rounded disabled:opacity-20 disabled:pointer-events-none transition cursor-pointer"
                              title="Yukarı Taşı"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              type="button"
                              onClick={() => moveListItem('projects', idx, 'down')}
                              disabled={idx === cvData.projects.length - 1}
                              className="p-1 text-gray-400 hover:text-teal-400 rounded disabled:opacity-20 disabled:pointer-events-none transition cursor-pointer"
                              title="Aşağı Taşı"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button 
                            type="button"
                            onClick={() => removeProject(proj.id)}
                            className="p-1.5 text-gray-400 hover:text-[#ef4444] transition rounded-lg hover:bg-red-500/10 cursor-pointer"
                            title="Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            type="button"
                            onClick={() => toggleExpand(proj.id)}
                            className="p-1.5 text-gray-400 group-hover:text-white transition rounded-lg hover:bg-[#2D3139] cursor-pointer"
                            title={isExpanded ? "Daralt" : "Genişlet"}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Accordion Content */}
                      {isExpanded && (
                        <div className="p-4 bg-[#16191E]/30 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase">Proje İsmi</label>
                              <input 
                                type="text" 
                                value={proj.name} 
                                onChange={(e) => updateProject(proj.id, 'name', e.target.value)}
                                className="w-full bg-[#0F1115] border border-[#2D3139] text-[#E0E2E6] rounded p-1.5 text-xs focus:outline-none focus:border-teal-500" 
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase">Rolünüz</label>
                              <input 
                                type="text" 
                                value={proj.role} 
                                onChange={(e) => updateProject(proj.id, 'role', e.target.value)}
                                className="w-full bg-[#0F1115] border border-[#2D3139] text-[#E0E2E6] rounded p-1.5 text-xs focus:outline-none focus:border-teal-500" 
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-bold text-gray-400 uppercase">Proje Bağlantısı (URL)</label>
                              <input 
                                type="text" 
                                value={proj.url} 
                                onChange={(e) => updateProject(proj.id, 'url', e.target.value)}
                                className="w-full bg-[#0F1115] border border-[#2D3139] text-[#E0E2E6] rounded p-1.5 text-xs focus:outline-none focus:border-teal-500 font-mono" 
                                placeholder="https://github.com/..."
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-bold text-gray-400 uppercase">Proje Teknolojileri (Virgülle Ayırın)</label>
                              <input 
                                type="text" 
                                value={proj.technologies} 
                                onChange={(e) => updateProject(proj.id, 'technologies', e.target.value)}
                                className="w-full bg-[#0F1115] border border-[#2D3139] text-[#E0E2E6] rounded p-1.5 text-xs focus:outline-none focus:border-teal-500 font-mono" 
                                placeholder="Docker, Redis, React, Golang"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <div className="flex justify-between items-center mb-1">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase">Proje Detayları</label>
                                <div className="flex gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => updateProject(proj.id, 'description', convertToBullets(proj.description))}
                                    className="text-[9.5px] font-bold text-teal-400 hover:text-teal-300 px-1.5 py-0.5 rounded border border-[#2D3139] bg-[#0F1115] transition shrink-0 cursor-pointer"
                                    title="Metni madde işaretli listeye dönüştürür."
                                  >
                                    • Liste Yap
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateProject(proj.id, 'description', convertToParagraph(proj.description))}
                                    className="text-[9.5px] font-bold text-gray-400 hover:text-white px-1.5 py-0.5 rounded border border-[#2D3139] bg-[#0F1115] transition shrink-0 cursor-pointer"
                                    title="Madde işaretlerini kaldırıp düz paragrafa dönüştürür."
                                  >
                                    Düz Metin
                                  </button>
                                </div>
                              </div>
                              <textarea 
                                rows={3}
                                value={proj.description} 
                                onChange={(e) => updateProject(proj.id, 'description', e.target.value)}
                                className="w-full bg-[#0F1115] border border-[#2D3139] text-[#E0E2E6] rounded p-1.5 text-xs focus:outline-none focus:border-teal-500 leading-relaxed" 
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Extra Extras / Custom Sections */}
        {activeTab === 'custom' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-[#2D3139] pb-1">
              <h4 className="font-bold text-[#E0E2E6] text-sm">Sertifikalar & Özel Bölümler</h4>
              <button 
                onClick={addCustomSection}
                className="cursor-pointer flex items-center gap-1.5 text-xs font-extrabold uppercase text-teal-400 hover:text-white bg-[#0F1115] hover:bg-teal-500/10 border-2 border-teal-500 hover:border-teal-400 px-3 py-1.5 rounded-lg transition-all duration-300 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Özel Bölüm Ekle
              </button>
            </div>

            {/* Reorder Tip */}
            {cvData.customSections.length > 1 && (
              <div className="p-2.5 bg-teal-500/10 border border-teal-500/20 rounded-xl flex items-center justify-between text-[11px] text-teal-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <GripVertical className="w-4 h-4 text-teal-400 shrink-0" />
                  Sıralamayı değiştirmek için kartları <strong className="font-bold text-white">tutup sürükleyin</strong> veya <strong className="font-bold text-white">ok butonlarını</strong> kullanın.
                </span>
              </div>
            )}

            {cvData.customSections.length === 0 ? (
              <p className="text-center text-xs text-gray-500 py-6">Ekstra bir özel kategori girilmedi.</p>
            ) : (
              <div className="space-y-4">
                {cvData.customSections.map((sec, idx) => {
                  const isExpanded = expandedItems[sec.id] ?? false;
                  return (
                    <div 
                      key={sec.id} 
                      draggable={true}
                      onDragStart={(e) => handleItemDragStart(e, 'customSections', idx)}
                      onDragOver={(e) => handleItemDragOver(e, 'customSections', idx)}
                      onDrop={(e) => handleItemDrop(e, 'customSections', idx)}
                      onDragEnd={handleItemDragEnd}
                      className={`bg-[#1A1D23] border-2 transition-all duration-200 rounded-xl overflow-hidden shadow-xs ${
                        dragOverIndex === idx && draggedItemState?.section === 'customSections'
                          ? 'border-teal-400 bg-teal-500/10 scale-[1.01]'
                          : 'border-[#2D3139]'
                      }`}
                    >
                      {/* Accordion Toggle Header */}
                      <div 
                        onClick={() => toggleExpand(sec.id)}
                        className="p-3 flex items-center justify-between cursor-pointer hover:bg-[#20242D] transition border-b border-transparent data-[expanded=true]:border-[#2D3139]/50 select-none group"
                        data-expanded={isExpanded}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <div 
                            className="p-1 text-gray-500 hover:text-teal-400 cursor-grab active:cursor-grabbing shrink-0 transition"
                            title="Tutup sürükleyerek sırasını değiştirin"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col gap-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[9px] font-extrabold text-purple-400 uppercase bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full shrink-0">
                                Özel Bölüm #{idx + 1}
                              </span>
                              <span className="text-xs font-bold text-white truncate max-w-[220px]">
                                {sec.title || 'Başlık Belirtilmemiş'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-0.5 bg-[#0F1115] p-0.5 rounded-lg border border-[#2D3139]">
                            <button 
                              type="button"
                              onClick={() => moveListItem('customSections', idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 text-gray-400 hover:text-teal-400 rounded disabled:opacity-20 disabled:pointer-events-none transition cursor-pointer"
                              title="Yukarı Taşı"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              type="button"
                              onClick={() => moveListItem('customSections', idx, 'down')}
                              disabled={idx === cvData.customSections.length - 1}
                              className="p-1 text-gray-400 hover:text-teal-400 rounded disabled:opacity-20 disabled:pointer-events-none transition cursor-pointer"
                              title="Aşağı Taşı"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button 
                            type="button"
                            onClick={() => removeCustomSection(sec.id)}
                            className="p-1.5 text-gray-400 hover:text-[#ef4444] transition rounded-lg hover:bg-red-500/10 cursor-pointer"
                            title="Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            type="button"
                            onClick={() => toggleExpand(sec.id)}
                            className="p-1.5 text-gray-400 group-hover:text-white transition rounded-lg hover:bg-[#2D3139] cursor-pointer"
                            title={isExpanded ? "Daralt" : "Genişlet"}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Accordion Content */}
                      {isExpanded && (
                        <div className="p-4 bg-[#16191E]/30 space-y-3">
                          <div className="space-y-3">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase">Bölüm Başlığı</label>
                              <input 
                                type="text" 
                                value={sec.title} 
                                onChange={(e) => updateCustomSection(sec.id, 'title', e.target.value)}
                                className="w-full bg-[#0F1115] border border-[#2D3139] text-[#E0E2E6] rounded p-1.5 text-xs focus:outline-none focus:border-teal-500 font-bold" 
                              />
                            </div>
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase">İçerik (Satır Satır Listeleyebilirsiniz)</label>
                                <div className="flex gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => updateCustomSection(sec.id, 'content', convertToBullets(sec.content))}
                                    className="text-[9.5px] font-bold text-teal-400 hover:text-teal-300 px-1.5 py-0.5 rounded border border-[#2D3139] bg-[#0F1115] transition shrink-0 cursor-pointer"
                                    title="Metni madde işaretli listeye dönüştürür."
                                  >
                                    • Liste Yap
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateCustomSection(sec.id, 'content', convertToParagraph(sec.content))}
                                    className="text-[9.5px] font-bold text-gray-400 hover:text-white px-1.5 py-0.5 rounded border border-[#2D3139] bg-[#0F1115] transition shrink-0 cursor-pointer"
                                    title="Madde işaretlerini kaldırıp düz paragrafa dönüştürür."
                                  >
                                    Düz Metin
                                  </button>
                                </div>
                              </div>
                              <textarea 
                                rows={3}
                                value={sec.content} 
                                onChange={(e) => updateCustomSection(sec.id, 'content', e.target.value)}
                                className="w-full bg-[#0F1115] border border-[#2D3139] text-[#E0E2E6] rounded p-1.5 text-xs focus:outline-none focus:border-teal-500 font-sans leading-relaxed" 
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Section Reorder - Sürükle Bırak Mobil Dokunmatik Uyumlu */}
        {activeTab === 'reorder' && (
          <div className="space-y-4">
            <h4 className="font-bold text-[#E0E2E6] text-sm border-b border-[#2D3139] pb-1">Bölüm Sıralamasını Düzenle</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              CV ana bölümlerinin (Özet, Deneyimler, Eğitim, Beceriler vb.) sırasını değiştirmek için kartları <strong className="text-teal-400">tutup sürükleyebilir</strong> veya yanlarındaki <strong className="text-teal-400">ok butonlarını</strong> kullanabilirsiniz.
            </p>

            <div className="space-y-2 mt-4">
              {cvData.sectionOrder.map((sectionId, idx) => {
                const label = sectionLabels[sectionId] || sectionId;
                return (
                  <div 
                    key={sectionId} 
                    draggable={sectionId !== 'personal'}
                    onDragStart={(e) => handleItemDragStart(e, 'sectionOrder', idx)}
                    onDragOver={(e) => handleItemDragOver(e, 'sectionOrder', idx)}
                    onDrop={(e) => handleItemDrop(e, 'sectionOrder', idx)}
                    onDragEnd={handleItemDragEnd}
                    className={`flex justify-between items-center bg-[#1A1D23] border-2 rounded-xl p-3 shadow-xs select-none transition ${
                      dragOverIndex === idx && draggedItemState?.section === 'sectionOrder'
                        ? 'border-teal-400 bg-teal-500/10 scale-[1.01]'
                        : 'border-[#2D3139] hover:border-teal-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {sectionId !== 'personal' ? (
                        <div 
                          className="p-1 text-gray-500 hover:text-teal-400 cursor-grab active:cursor-grabbing shrink-0 transition"
                          title="Tutup sürükleyerek sırasını değiştirin"
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-6" />
                      )}
                      <span className="text-xs font-mono font-medium text-teal-400 bg-[#0F1115] px-2 py-0.5 rounded border border-[#2D3139]">
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-[#E0E2E6] capitalize">
                        {label === 'personal' ? 'Kimlik Başlığı (Sabit)' : label}
                      </span>
                    </div>

                    {/* Controls up/down */}
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => moveSection(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-gray-450 hover:text-teal-400 hover:bg-[#0F1115] rounded disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                        title="Yukarı Taşı"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSection(idx, 'down')}
                        disabled={idx === cvData.sectionOrder.length - 1}
                        className="p-1 text-gray-450 hover:text-teal-400 hover:bg-[#0F1115] rounded disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                        title="Aşağı Taşı"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Design Settings (Colors, Typography and QR) */}
        {activeTab === 'design' && (
          <div className="space-y-6">
            <div>
              <h4 className="font-bold text-[#E0E2E6] text-sm border-b border-[#2D3139] pb-1">Tasarım Ayarları (Renk, Yazı & Stil)</h4>
              <p className="text-xs text-gray-400 leading-relaxed mt-1">
                Karakter yazı kombinasyonlarını, detay çizgi gölgelerini ve marka renk paletinizi belirleyerek tasarım detaylarını kişiselleştirin.
              </p>
            </div>

            {/* Smart Colors and Custom Typo section */}
            <div className="space-y-4 pt-1">
              <h4 className="font-bold text-[#E0E2E6] text-sm">Akıllı Renk Paleti ve Tipografi Ayarı</h4>
              
              <div className="space-y-3">
                {/* Primary Color Picker */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400">Ana Tema Rengi</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={cvData.styles.primaryColor} 
                      onChange={(e) => updateStyles('primaryColor', e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-[#2D3139] bg-[#0F1115]" 
                    />
                    <span className="text-[10px] font-mono text-gray-500">{cvData.styles.primaryColor}</span>
                  </div>
                </div>

                {/* Secondary Color Picker */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400">İkincil Detay Rengi</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={cvData.styles.secondaryColor} 
                      onChange={(e) => updateStyles('secondaryColor', e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-[#2D3139] bg-[#0F1115]" 
                    />
                    <span className="text-[10px] font-mono text-gray-500">{cvData.styles.secondaryColor}</span>
                  </div>
                </div>

                {/* Text Color Picker */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400">Yazı Rengi</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={cvData.styles.textColor} 
                      onChange={(e) => updateStyles('textColor', e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-[#2D3139] bg-[#0F1115]" 
                    />
                    <span className="text-[10px] font-mono text-gray-500">{cvData.styles.textColor}</span>
                  </div>
                </div>

                {/* Fonts options */}
                <div className="pt-2">
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Karakter Yazı Tipi Kombinasyonu</label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { id: 'inter', label: 'Inter (Dengeli)' },
                      { id: 'spaceGrotesk', label: 'Space Grotesk (Tech)' },
                      { id: 'playfair', label: 'Playfair (Serif)' },
                      { id: 'jetbrains', label: 'JetBrains (Developer)' }
                    ] as const).map((fontItem) => (
                      <button
                        key={fontItem.id}
                        onClick={() => updateStyles('font', fontItem.id)}
                        className={`text-xs p-2 rounded-lg border text-left font-medium transition ${
                          cvData.styles.font === fontItem.id 
                            ? 'bg-[#1A1D23] border-teal-500 text-teal-400' 
                            : 'bg-[#0F1115] border-[#2D3139] text-[#E0E2E6] hover:border-gray-500'
                        }`}
                      >
                        {fontItem.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Local QR integration */}
                <div className="pt-2">
                  <label className="block text-xs font-medium text-gray-400 mb-1">Yerel QR Kod Bağlantı Linki (API Bağlantısız Yerel)</label>
                  <input 
                    type="text" 
                    value={cvData.styles.qrCodeUrl} 
                    onChange={(e) => updateStyles('qrCodeUrl', e.target.value)}
                    className="w-full bg-[#0F1115] border border-[#2D3139] text-[#E0E2E6] rounded p-1.5 text-xs focus:outline-none focus:border-teal-500" 
                    placeholder="https://linkedin.com/..."
                  />
                  
                  {/* QR Position */}
                  <label className="block text-xs font-medium text-gray-400 mt-2">QR Kodun Şablondaki Pozisyonu</label>
                  <select 
                    value={cvData.styles.qrCodePosition}
                    onChange={(e) => updateStyles('qrCodePosition', e.target.value as any)}
                    className="w-full mt-1 bg-[#0F1115] border border-[#2D3139] text-[#E0E2E6] rounded p-1.5 text-xs focus:outline-none focus:border-teal-500 font-medium"
                  >
                    <option value="none">QR Kodu Gizle</option>
                    <option value="header">Üst Sağ Başlık (Header)</option>
                    <option value="sidebar">Sol / Yan Panel (Sidebar)</option>
                    <option value="footer">Alt Bilgi Sayfa Sonu (Footer)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CV TASLAKLARI (Şablon Kataloğu) Panel */}
        {activeTab === 'presets' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h4 className="font-extrabold text-[#E0E2E6] text-sm border-b border-[#2D3139] pb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                CV TASLAKLARI (Şablon Kataloğu)
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed mt-1">
                Özgeçmişinizin sütun yerleşimini (Tek Sütun, Yan Sütun, 3D), yazı tiplerini ve renk düzenini tek tıkla değiştirmek için aşağıdaki profesyonel taslaklardan birini seçiniz.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {PRESETS.map((preset) => {
                const isSelected = cvData.styles.template === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setCvData(prev => ({
                        ...prev,
                        styles: {
                          ...prev.styles,
                          ...preset.styles
                        }
                      }));
                      if (triggerAlert) {
                        triggerAlert('success', `"${preset.name}" şablonu yüklendi!`);
                      }
                    }}
                    className={`cursor-pointer p-3 rounded-xl border text-left transition-all duration-200 relative overflow-hidden flex flex-col justify-between min-h-[105px] ${
                      isSelected
                        ? 'border-teal-400 bg-teal-500/10 ring-1 ring-teal-400/20 shadow-[0_0_15px_rgba(20,184,166,0.15)] bg-teal-555/5'
                        : 'border-[#2D3139] bg-[#16191E] hover:border-[#424855] hover:bg-[#1C2027]'
                    }`}
                  >
                    <div className="flex justify-between items-center gap-1 mb-1.5 w-full">
                      <span className={`text-[8.5px] font-black uppercase px-1.5 py-0.5 rounded tracking-wide ${preset.colorClass}`}>
                        {preset.tag.split(' ')[0]}
                      </span>
                      {isSelected ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_8px_#14b8a6]" />
                      ) : null}
                    </div>
                    
                    <div className="mt-auto">
                      <h5 className="font-extrabold text-[11px] text-white tracking-tight leading-snug truncate">
                        {preset.name.split(' & ')[0]}
                      </h5>
                      <p className="text-[9px] text-gray-400 leading-tight mt-0.5 line-clamp-2">
                        {preset.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            
            <div className="p-3 bg-[#111317] border border-[#2D3139]/50 rounded-xl space-y-1.5">
              <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider block">Hızlı İpucu 💡</span>
              <p className="text-[10.5px] text-gray-400 leading-relaxed font-normal">
                Her bir taslak; kendine has yazı tipi, renk kartelası ve bileşen yoğunluğuna sahiptir. Seçtiğiniz taslak üzerinde ayrıca <b>Renk & Font</b> sekmesinden isterseniz detaylı ince ayarlar yapmaya devam edebilirsiniz!
              </p>
            </div>
          </div>
        )}

        {/* Database management for saved CVs */}
        {activeTab === 'saved' && (
          <div className="space-y-4">
            {/* 1. SECTION: Interactive CV Memory & Storage Manager */}
            <div className="border border-[#2D3139]/80 rounded-xl bg-[#111317]/60 p-3.5 space-y-3">
              <CVMemoryManager
                cvData={cvData}
                savedCVs={savedCVs}
                onLoadCV={onLoadCV}
                onSaveCV={onSaveCV}
                onSaveAsNewCV={onSaveAsNewCV || ((title) => onSaveCV(title))}
                onDuplicateCV={onDuplicateCV || (() => {})}
                onRenameCV={onRenameCV || (() => {})}
                onDeleteCV={onDeleteCV}
                onCreateNew={onCreateNew}
                onExportSingleCV={onExportSingleCV || (() => {})}
                onExportAllCVs={onExportAllCVs || (() => {})}
                onImportBackup={onImportBackup}
                onResetSamples={onResetSamples || (() => {})}
                triggerAlert={triggerAlert}
                isModal={false}
              />
            </div>

            {/* 2. SECTION: Cloud Entegrasyon */}
            <div className="border border-[#2D3139]/80 rounded-xl bg-[#111317]/45 overflow-hidden">
              <div 
                onClick={() => setMgmtSectionCloud(!mgmtSectionCloud)}
                className="flex justify-between items-center bg-[#1A1D23] hover:bg-[#20242B] px-3.5 py-2.5 cursor-pointer select-none group transition-all"
              >
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <h4 className="font-extrabold text-[#E0E2E6] text-xs uppercase tracking-wider">Yedekleme</h4>
                    <p className="text-[9px] text-gray-400">Tarayıcı belleği • JSON dışa/içe aktarma</p>
                  </div>
                </div>
                {mgmtSectionCloud ? (
                  <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-teal-400 transition" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-teal-400 transition" />
                )}
              </div>

              {mgmtSectionCloud && (
                <div className="p-3 border-t border-[#2D3139]/40 animate-fade-in space-y-3">
                  <p className="text-[10px] leading-relaxed text-gray-400">
                    Tüm CV'leriniz bu tarayıcının yerel deposunda (<code className="text-teal-400">localStorage</code>) saklanır.
                    Yedek almak veya başka bir cihaza taşımak için aşağıdaki <strong className="text-[#E0E2E6]">JSON Dışa Aktar</strong> özelliğini kullanın.
                  </p>
                  <button
                    onClick={onExportAllCVs}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    <HardDrive className="w-3.5 h-3.5" />
                    Tüm CV'leri JSON olarak indir
                  </button>
                </div>
              )}
            </div>

            {/* 4. SECTION: Intelligent Import */}
            <div className="border border-[#2D3139]/80 rounded-xl bg-[#111317]/45 overflow-hidden">
              <div 
                onClick={() => setMgmtSectionImport(!mgmtSectionImport)}
                className="flex justify-between items-center bg-[#1A1D23] hover:bg-[#20242B] px-3.5 py-2.5 cursor-pointer select-none group transition-all"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <h4 className="font-extrabold text-[#E0E2E6] text-xs uppercase tracking-wider">Akıllı İçe Aktarıcı</h4>
                    <p className="text-[9px] text-gray-400">Yapay Zeka (AI), LinkedIn CSV veya JSON yedekleme</p>
                  </div>
                </div>
                {mgmtSectionImport ? (
                  <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-teal-400 transition" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-teal-400 transition" />
                )}
              </div>

              {mgmtSectionImport && (
                <div className="p-3.5 border-t border-[#2D3139]/40 animate-fade-in space-y-4">
                  <div>
                    <p className="text-[10px] text-gray-400 leading-relaxed font-semibold">
                      LinkedIn profili <b>İş Deneyimi</b>, <b>Eğitim</b> veya <b>Yetenekler</b> CSV dosyalarını ya da daha önce indirdiğiniz JSON yedeklerinizi buraya yükleyin veya yapıştırın.
                    </p>
                  </div>

                  {/* ChatGPT / Gemini AI Prompt Guide */}
                  <div className="bg-[#16191E] border border-[#2D3139] p-3 rounded-xl space-y-2.5 transition duration-200">
                    <div 
                      onClick={() => setShowPromptGuide(!showPromptGuide)}
                      className="flex items-center justify-between cursor-pointer group select-none"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-teal-400 group-hover:scale-110 transition-transform animate-pulse" />
                        <span className="text-[11px] font-bold text-white group-hover:text-teal-400 transition-colors">
                          Yapay Zeka (ChatGPT/Gemini) ile CV Aktarımı 🤖
                        </span>
                      </div>
                      {showPromptGuide ? (
                        <ChevronUp className="w-3.5 h-3.5 text-gray-450" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-gray-450" />
                      )}
                    </div>

                    {showPromptGuide && (
                      <div className="space-y-3 mt-1.5 border-t border-[#2D3139]/85 pt-3 text-[10px] text-gray-400 leading-relaxed">
                        <p>
                          Mevcut Word, PDF veya metin halindeki özgeçmişinizi bu sisteme tek tıkla aktarmak çok kolay!
                          Aşağıdaki özel promptu kopyalayıp <strong>ChatGPT, Gemini veya Claude</strong> gibi bir yapay zekaya gönderin. Yanına da kendi özgeçmişinizi yapıştırın. Yapay zekanın size vereceği JSON sonucunu kopyalayıp aşağıdaki kutuya yapıştırmanız yeterlidir!
                        </p>
                        
                        <div className="space-y-1">
                          <div className="flex justify-between items-center bg-[#0F1115] px-2.5 py-1.5 rounded-t-lg border border-b-0 border-[#2D3139]">
                            <span className="font-bold text-[#E0E2E6]">Hazır AI Promptu</span>
                            <button
                              onClick={() => {
                                const promptText = `Aşağıdaki JSON şablonunu al ve benim vereceğim ham CV metnindeki bilgileri eksiksiz bir şekilde bu JSON yapısına dönüştür. JSON içeriği dışında başka hiçbir açıklama, markdown kodu (\`\`\`json veya \`\`\` blokları dahil) veya başlangıç/bitiş yazısı ekleme; sadece çalışmaya hazır saf, geçerli bir JSON objesi döndür.

Şablon:
{
  "kisisel_bilgiler": {
    "ad_soyad": "[Ad Soyad]",
    "dogum_tarihi": "[GG.AA.YYYY veya boş]",
    "dogum_yeri": "[Şehir veya boş]",
    "medeni_durum": "[Bekar/Evli veya boş]",
    "ehliyet": "[Sürücü belgesi sınıfları veya boş]"
  },
  "iletisim": {
    "telefon": "[Telefon Numarası]",
    "e_posta": "[E-posta Adresi]",
    "adres": "[Tam Adres]"
  },
  "profesyonel_ozet": "[Kendinden bahsettiğin kısa özet / kariyer hedefi yazısı]",
  "is_deneyimleri": [
    {
      "kurum_firma": "[Firma/Kurum Adı]",
      "pozisyon": "[Pozisyon/Göreviniz]",
      "tarih": "[Başlangıç - Bitiş Tarihleri örn: '2022 - 2024' veya 'Mayıs 2023 - Halen']",
      "aciklama": "[Bu pozisyondaki sorumluluklarınız ve başarılarınız]"
    }
  ],
  "egitim_bilgileri": [
    {
      "universite": "[Okul/Üniversite Adı]",
      "bolum": "[Bölüm/Alan]",
      "tarih": "[Başlangıç - Bitiş Tarihleri örn: '2017 - 2021' ya da 'Devam Ediyor']"
    }
  ],
  "beceriler": [
    "[Yetenek 1]",
    "[Yetenek 2]"
  ],
  "ilgi_alanlari_ve_hobiler": [
    "[Hobi 1]",
    "[Hobi 2]"
  ]
}

İşte benim özgeçmiş detaylarım:

[Kendi CV Detaylarınızı buraya ekleyip gönderin]`;

                                navigator.clipboard.writeText(promptText);
                                if (triggerAlert) {
                                  triggerAlert('success', 'Hazır AI Promptu panoya kopyalandı! Şimdi dilediğiniz yapay zeka aracına (Gemini, ChatGPT, Claude vb.) gönderip yanına kendi özgeçmiş metninizi yapıştırabilirsiniz.');
                                }
                              }}
                              className="cursor-pointer text-[9px] font-black uppercase tracking-wider bg-teal-600 hover:bg-teal-500 text-white px-2 py-1 rounded transition shadow border border-teal-500 flex items-center gap-1"
                            >
                              <Copy className="w-2.5 h-2.5" /> Promptu Kopyala 📋
                            </button>
                          </div>
                          <pre className="p-2.5 bg-[#0F1115] border border-[#2D3139] rounded-b-lg overflow-x-auto text-[8px] max-h-40 font-mono text-gray-350">
{`{
  "kisel_bilgiler": {
    "ad_soyad": "Coşkuner OCAK",
    "dogum_tarihi": "15.06.1997",
    ...
  },
  "iletisim": { ... },
  "profesyonel_ozet": "...",
  "is_deneyimleri": [ ... ],
  "egitim_bilgileri": [ ... ],
  "beceriler": [ "Excel", "CRM", ... ],
  "ilgi_alanlari_ve_hobiler": [ "Doğa Yürüyüşü", ... ]
}`}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Direct AI CV Importer: One-Click Text Parsing */}
                  <div className="bg-[#16191E] border border-amber-500/20 p-4 rounded-xl space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
                    <div className="flex flex-wrap items-center gap-1.5 border-b border-[#2D3139] pb-2">
                      <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                      <span className="text-[11px] font-extrabold text-white uppercase tracking-wider">
                        Otomatik Yapay Zeka (AI) ile CV Aktarımı
                      </span>
                      <span className="text-[8px] bg-amber-500/20 text-amber-450 border border-amber-500/30 px-1.5 py-0.5 rounded font-black">PREMIUM</span>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-relaxed font-semibold">
                      Eski CV metninizi, LinkedIn hakkımda yazınızı veya ham çalışma bilgilerinizi aşağıdaki alana yapıştırın. Yapay zeka tüm bilgileri otomatik olarak ayrıştırır ve CV formunuzu tam doldurur!
                    </p>
                    <textarea
                      rows={4}
                      value={aiRawText}
                      onChange={(e) => setAiRawText(e.target.value)}
                      placeholder={`Örnek: Coşkuner Ocak, 15 Haziran 1997 doğumluyum. 2019-2023 yılları arasında ABC Yazılım şirketinde Senior Front-end Developer olarak çalıştım. React ve Tailwind kullandım...`}
                      className="w-full bg-[#0F1115] border border-[#2D3139] focus:border-amber-500 text-[#E0E2E6] rounded-xl p-2.5 text-[10px] font-sans focus:outline-none transition leading-relaxed"
                    />
                    <button
                      onClick={handleAIImport}
                      disabled={isAIImporting || !aiRawText.trim()}
                      className="cursor-pointer w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-600 hover:to-amber-500 text-white text-[11px] font-extrabold uppercase tracking-widest py-2.5 rounded-lg text-center transition border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Sparkles className={`w-4 h-4 ${isAIImporting ? 'animate-spin' : ''}`} />
                      {isAIImporting ? 'Yapay Zeka Analiz Ediyor...' : 'AI ile Analiz Et ve CV\'ye Aktar ⚡'}
                    </button>
                  </div>

                  {/* Drag and Drop Zone */}
                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                      dragActive 
                        ? 'border-teal-400 bg-teal-500/10' 
                        : 'border-[#2D3139] bg-[#0F1115] hover:border-[#424855]'
                    }`}
                  >
                    <p className="text-xs text-[#E0E2E6] font-bold">
                      Dosyayı Sürükleyip Buraya Bırakın
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      Desteklenen formatlar: .json, .csv
                    </p>
                    <div className="mt-3">
                      <label 
                        htmlFor="device-file-upload-input"
                        className="cursor-pointer inline-flex items-center px-3 py-1.5 bg-[#16191E] border border-[#2D3139] text-[#E0E2E6] hover:bg-[#1C2027] hover:border-teal-500 text-xs font-bold rounded-lg transition"
                      >
                        Cihazdan Dosya Seç
                      </label>
                      <input 
                        id="device-file-upload-input"
                        type="file" 
                        accept=".json,.csv,.txt,text/csv,text/plain,application/json" 
                        onChange={handleFileChange}
                        className="hidden" 
                      />
                    </div>
                  </div>

                  {/* Paste Text Area */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-wider">
                      Veri Kopyala & Yapıştır (JSON veya LinkedIn CSV)
                    </label>
                    <textarea
                      rows={3}
                      value={pastedDataText}
                      onChange={(e) => setPastedDataText(e.target.value)}
                      placeholder={`Mevcut veriyi buraya yapıştırın. LinkedIn'den çektiğiniz CSV içeriğini veya indirdiğiniz JSON yedeği direkt yapıştırıp uygulayabilirsiniz.`}
                      className="w-full bg-[#0F1115] border border-[#2D3139] text-[#E0E2E6] rounded-xl p-2.5 text-[10px] font-mono focus:outline-none focus:border-teal-500 transition"
                    />
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          triggerSmartImport(pastedDataText);
                        }}
                        className="cursor-pointer flex-1 bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-black uppercase tracking-wide py-2 rounded-lg text-center transition border border-teal-500"
                      >
                        Veriyi Çözümle & Uygula 🚀
                      </button>
                      <button
                        onClick={() => setPastedDataText('')}
                        className="cursor-pointer px-3 bg-[#0F1115] hover:bg-[#1C2026] text-gray-400 hover:text-white border border-[#2D3139] text-[11px] font-bold rounded-lg transition"
                      >
                        Temizle
                      </button>
                    </div>
                  </div>

                  {/* Import status message */}
                  {importFeedback && (
                    <div className={`p-3 rounded-xl border text-xs font-bold leading-relaxed ${
                      importFeedback.type === 'success' 
                        ? 'bg-teal-550/10 text-teal-400 border-teal-500/20' 
                        : importFeedback.type === 'error'
                          ? 'bg-red-950/20 text-red-400 border-red-900/30'
                          : 'bg-indigo-950/20 text-indigo-400 border-indigo-900/30'
                    }`}>
                      <div className="flex items-start gap-1.5">
                        <span className="mt-0.5">
                          {importFeedback.type === 'success' ? '✓' : '⚠'}
                        </span>
                        <span>{importFeedback.text}</span>
                      </div>
                    </div>
                  )}

                  {/* Download Backup Button */}
                  <div className="pt-3 border-t border-[#2D3139]">
                    <button
                      onClick={() => {
                        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(cvData, null, 2))}`;
                        const downloadAnchor = document.createElement('a');
                        downloadAnchor.setAttribute('href', jsonString);
                        downloadAnchor.setAttribute('download', `${cvData.personalInfo.name.replace(/\s+/g, '_')}_CV_Backup.json`);
                        document.body.appendChild(downloadAnchor);
                        downloadAnchor.click();
                        downloadAnchor.remove();
                      }}
                      className="cursor-pointer w-full bg-[#0F1115] border border-[#2D3139] hover:border-teal-500/30 hover:bg-[#1C2026] text-[#E0E2E6] text-[11px] font-extrabold uppercase py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition"
                    >
                      <FileJson className="w-3.5 h-3.5 text-teal-400" /> Yerel Cihaza JSON Yedek İndir 💾
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
