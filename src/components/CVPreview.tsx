import React, { useState, useRef, useEffect, MouseEvent } from 'react';
import { CVData } from '../types';
import QRCodeGen from './QRCodeGen';
import { sanitizeCVData } from '../utils/sanitizer';
import { 
  Briefcase, 
  GraduationCap, 
  Code, 
  FolderGit2, 
  Award, 
  Languages, 
  Heart, 
  User, 
  Sparkles, 
  FileText,
  Blocks,
  Globe,
  Settings,
  Box,
  MapPin,
  Calendar,
  Layers,
  Cpu,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Mail,
  Phone,
  Undo
} from 'lucide-react';

interface CVPreviewProps {
  cvData: CVData;
  setCvData?: React.Dispatch<React.SetStateAction<CVData>>;
  onUndo?: () => void;
  canUndo?: boolean;
}

export default function CVPreview({ cvData, setCvData, onUndo, canUndo }: CVPreviewProps) {
  const safeData = sanitizeCVData(cvData);
  const { personalInfo, workExperiences, educations, projects, skills, socialLinks, customSections, sectionOrder, styles } = safeData;

  const updateValue = (path: string[], value: string) => {
    if (!setCvData) return;
    setCvData(prev => {
      const next = { ...prev };
      const p0 = path[0];
      if (p0 === 'personalInfo') {
        const field = path[1];
        next.personalInfo = {
          ...next.personalInfo,
          [field]: value
        };
      } else if (p0 === 'workExperiences') {
        const id = path[1];
        const field = path[2];
        next.workExperiences = next.workExperiences.map(item => {
          if (item.id === id) {
            return { ...item, [field]: value };
          }
          return item;
        });
      } else if (p0 === 'educations') {
        const id = path[1];
        const field = path[2];
        next.educations = next.educations.map(item => {
          if (item.id === id) {
            return { ...item, [field]: value };
          }
          return item;
        });
      } else if (p0 === 'projects') {
        const id = path[1];
        const field = path[2];
        next.projects = next.projects.map(item => {
          if (item.id === id) {
            return { ...item, [field]: value };
          }
          return item;
        });
      } else if (p0 === 'skills') {
        const categoryId = path[1];
        if (path[2] === 'categoryName') {
          next.skills = next.skills.map(cat => {
            if (cat.id === categoryId) {
              return { ...cat, categoryName: value };
            }
            return cat;
          });
        } else if (path[2] === 'skillName') {
          const sIdx = parseInt(path[3], 10);
          next.skills = next.skills.map(cat => {
            if (cat.id === categoryId) {
              const updatedSkills = [...cat.skills];
              if (updatedSkills[sIdx]) {
                updatedSkills[sIdx] = { ...updatedSkills[sIdx], name: value };
              }
              return { ...cat, skills: updatedSkills };
            }
            return cat;
          });
        }
      } else if (p0 === 'customSections') {
        const id = path[1];
        const field = path[2];
        next.customSections = next.customSections.map(item => {
          if (item.id === id) {
            return { ...item, [field]: value };
          }
          return item;
        });
      }
      return next;
    });
  };

  interface EditableProps {
    path: string[];
    text: string;
    placeholder?: string;
    multiline?: boolean;
    className?: string;
  }

  const Editable = ({ path, text, placeholder = '...', multiline = false, className = '' }: EditableProps) => {
    const [localValue, setLocalValue] = useState(text || '');

    useEffect(() => {
      setLocalValue(text || '');
    }, [text]);

    if (!setCvData) {
      return <span className={className}>{text || ''}</span>;
    }

    const handleBlur = (e: React.FocusEvent<HTMLSpanElement>) => {
      const newVal = e.currentTarget.textContent || '';
      setLocalValue(newVal);
      updateValue(path, newVal);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
      if (e.key === 'Enter' && !multiline) {
        e.preventDefault();
        e.currentTarget.blur();
      }
    };

    const displayClass = (className.includes('inline') || className.includes('block') || className.includes('flex'))
      ? ''
      : multiline ? 'block w-full' : 'inline max-w-full';

    return (
      <span
        contentEditable
        suppressContentEditableWarning
        data-editable="true"
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`focus:outline-none focus:ring-1 focus:ring-amber-500/50 hover:bg-amber-500/10 focus:bg-amber-500/15 rounded transition duration-150 cursor-text max-w-full break-words [overflow-wrap:anywhere] ${displayClass} ${className} ${!text ? 'border-b border-dashed border-amber-400 text-slate-400 min-w-[20px] print:hidden' : ''}`}
        title="Düzenlemek için tıklayın"
      >
        {localValue}
      </span>
    );
  };

  const isGenericCategory = (name: string | undefined): boolean => {
    if (!name) return true;
    const norm = name.trim().toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ı/g, 'i')
      .replace(/ş/g, 's')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c');
    
    return (
      norm.includes('yetkinlik') ||
      norm.includes('beceri') ||
      norm.includes('yetenek') ||
      norm.includes('skill') ||
      norm.includes('abilit')
    );
  };

  const shouldShowCategoryHeader = (catName: string | undefined): boolean => {
    if (!catName) return false;
    if (skills.length <= 1) return false;
    return !isGenericCategory(catName);
  };

  // Modern 3D Holographic Interactive Perspective States
  const [is3DActive, setIs3DActive] = useState(false);
  const [rotateX, setRotateX] = useState(12);
  const [rotateY, setRotateY] = useState(-10);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dynamic Interactive Zoom States for comfortable view rendering
  const [zoomScale, setZoomScale] = useState(1.0);
  const [mobileFit, setMobileFit] = useState(true);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(794);
  const [previewHeight, setPreviewHeight] = useState(1123);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const element = wrapperRef.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width || 794);
      }
    });

    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const pageEl = document.getElementById('cv-preview-page');
    if (pageEl) {
      const updateHeight = () => {
        setPreviewHeight(pageEl.scrollHeight);
      };
      updateHeight();
      const timer = setTimeout(updateHeight, 150);
      return () => clearTimeout(timer);
    }
  }, [cvData, containerWidth, zoomScale]);

  // Auto-scale ratio for mobile devices to keep uncompromised A4 proportions without content squishing
  const autoScale = (mobileFit && containerWidth < 794) ? containerWidth / 794 : 1.0;
  const renderedScale = zoomScale * autoScale;
  const scaledHeight = previewHeight * renderedScale;

  const handleZoomIn = () => {
    setZoomScale(prev => Math.min(1.5, Math.round((prev + 0.1) * 10) / 10));
  };

  const handleZoomOut = () => {
    setZoomScale(prev => Math.max(0.6, Math.round((prev - 0.1) * 10) / 10));
  };

  const handleZoomReset = () => {
    setZoomScale(1.0);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!is3DActive || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left; // x coordinate within element
    const y = e.clientY - rect.top;  // y coordinate within element
    
    // Normalize coordinates around center (from -0.5 to 0.5)
    const normX = x / rect.width - 0.5;
    const normY = y / rect.height - 0.5;
    
    // Set rot degrees (tilt range: -15deg to 15deg)
    setRotateX(-normY * 30 + 5); 
    setRotateY(normX * 30 - 5);
  };

  const handleMouseLeave = () => {
    // Return to soft resting angle
    setRotateX(12);
    setRotateY(-10);
  };

  const getSectionIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('deneyim') || t.includes('tecrübe') || t.includes('experience') || t.includes('iş')) 
      return <Briefcase className="w-4 h-4 text-inherit shrink-0 transition" />;
    if (t.includes('eğitim') || t.includes('okul') || t.includes('education') || t.includes('akademik')) 
      return <GraduationCap className="w-4 h-4 text-inherit shrink-0 transition" />;
    if (t.includes('proje') || t.includes('project')) 
      return <FolderGit2 className="w-4 h-4 text-inherit shrink-0 transition" />;
    if (t.includes('yetenek') || t.includes('skill') || t.includes('yetkinlik') || t.includes('teknik') || t.includes('programming')) 
      return <Code className="w-4 h-4 text-inherit shrink-0 transition" />;
    if (t.includes('dil') || t.includes('yabancı') || t.includes('language') || t.includes('lisan')) 
      return <Languages className="w-4 h-4 text-inherit shrink-0 transition" />;
    if (t.includes('sertifika') || t.includes('ödül') || t.includes('award') || t.includes('certif') || t.includes('kurs')) 
      return <Award className="w-4 h-4 text-inherit shrink-0 transition" />;
    if (t.includes('özet') || t.includes('hakkında') || t.includes('summary') || t.includes('profil') || t.includes('kişisel')) 
      return <User className="w-4 h-4 text-inherit shrink-0 transition" />;
    if (t.includes('ilgi') || t.includes('hobi') || t.includes('interest')) 
      return <Heart className="w-4 h-4 text-inherit shrink-0 transition" />;
    return <FileText className="w-4 h-4 text-inherit shrink-0 transition" />;
  };

  // Font mapping
  const fontClass = {
    inter: 'font-inter',
    spaceGrotesk: 'font-space-grotesk',
    playfair: 'font-playfair',
    jetbrains: 'font-jetbrains',
  }[styles.font] || 'font-inter';

  // Font size mapping
  const fontSizeClass = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  }[styles.fontSize] || 'text-sm';

  // Dynamic scaling for hardcoded small body texts (like work descriptions and contact notes) to avoid single page spillover
  const textXsClass = {
    xs: 'text-[10px]',
    sm: 'text-[11.5px]',
    md: 'text-xs',
    lg: 'text-sm',
  }[styles.fontSize] || 'text-[11.5px]';

  // Line height mapping
  const lineHeightClass = {
    tight: 'leading-tight',
    normal: 'leading-normal',
    relaxed: 'leading-relaxed',
  }[styles.lineHeight || 'normal'] || 'leading-normal';

  // Spacing / Density mapping - tighter compact settings for perfect 1-page fit
  const paddingClass = {
    compact: 'p-4 md:p-5 gap-y-2.5',
    comfortable: 'p-10 gap-y-5',
    loose: 'p-14 gap-y-8',
  }[styles.density] || 'p-10 gap-y-5';

  const sectionGapClass = {
    compact: 'space-y-1.5',
    comfortable: 'space-y-3.5',
    loose: 'space-y-5',
  }[styles.density] || 'space-y-3.5';

  const itemGapClass = {
    compact: 'space-y-0.5',
    comfortable: 'space-y-2',
    loose: 'space-y-3',
  }[styles.density] || 'space-y-2';

  // Dynamic layout margins for secondary sections
  const sidebarPadding = {
    compact: 'p-4 gap-y-3.5',
    comfortable: 'p-6 gap-y-6',
    loose: 'p-8 gap-y-8',
  }[styles.density] || 'p-6 gap-y-6';

  const rightPanelPaddingClass = {
    compact: 'p-5 gap-y-3',
    comfortable: 'p-8 gap-y-6',
    loose: 'p-10 gap-y-8',
  }[styles.density] || 'p-8 gap-y-6';

  const rightPanelSectionsGapClass = {
    compact: 'gap-y-2.5',
    comfortable: 'gap-y-5',
    loose: 'gap-y-8',
  }[styles.density] || 'gap-y-5';

  // 3D Shadow depth level
  const shadowClass = {
    none: 'shadow-none',
    subtle: 'shadow-sm border border-slate-100',
    depth3d: 'shadow-[0_20px_40px_rgba(124,58,237,0.12)] border-t border-l border-white/20 relative group hover:scale-[1.01] hover:shadow-[0_25px_50px_rgba(124,58,237,0.18)] transition-all duration-300 rounded-2xl',
  }[styles.shadowIntensity] || 'shadow-none';

  const isSidebarTemplate = ['split-sidebar', 'modern-geometric', 'crimson-split', 'teal-timeline', 'dark-gold-arch'].includes(styles.template);

  // Strict QR placement: If the user selected 'sidebar' but template has no sidebar, fallback to header so QR never vanishes
  const qrPosition = styles.qrCodePosition ?? (isSidebarTemplate ? 'sidebar' : 'header');
  const effectiveQRPosition = (!isSidebarTemplate && qrPosition === 'sidebar')
    ? 'header'
    : qrPosition;

  const isHeaderQR = !!(styles.qrCodeUrl && effectiveQRPosition === 'header');
  const isFooterQR = !!(styles.qrCodeUrl && effectiveQRPosition === 'footer');
  const isSidebarQR = !!(styles.qrCodeUrl && isSidebarTemplate && effectiveQRPosition === 'sidebar');

  const getBlockCardClass = (sectionId: string) => {
    if (styles.template !== 'depth3d') return 'w-full';
    return "p-5 rounded-2xl bg-white/95 border border-white/60 shadow-[0_15px_30px_rgba(0,0,0,0.06),0_10px_15px_-3px_rgba(0,0,0,0.04),inset_0_1px_2px_rgba(255,255,255,0.8),inset_0_-1px_3px_rgba(0,0,0,0.02)] border-b-4 border-r-2 border-slate-300/40 hover:border-b-8 hover:border-r-4 hover:-translate-y-1.5 hover:shadow-[0_25px_45px_rgba(0,0,0,0.1),0_12px_20px_-3px_rgba(0,0,0,0.06)] hover:brightness-[1.01] transition-all duration-300 relative z-10 w-full";
  };

  // Base64 or standard visual background for the template
  const bgStyles = styles.template === 'depth3d' 
    ? { 
        backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(244, 245, 247, 1) 0%, rgba(235, 238, 243, 1) 90%)',
        backgroundColor: '#ebf0f5'
      }
    : (styles.template === 'split-sidebar' || styles.template === 'crimson-split' || styles.template === 'teal-timeline' || styles.template === 'dark-gold-arch')
    ? { backgroundColor: '#ffffff' }
    : styles.template === 'modern-geometric'
    ? { backgroundColor: '#ffffff' }
    : styles.template === 'minimalist-clean'
    ? { backgroundColor: '#ffffff', color: '#1e293b' }
    : styles.template === 'editorial-serif'
    ? { backgroundColor: '#fdfdfc', color: '#1a1d20' }
    : styles.template === 'tech-mono'
    ? { backgroundColor: '#ffffff', color: '#090d16' }
    : { backgroundColor: '#ffffff' };

  const actualPaddingClass = (styles.template === 'split-sidebar' || styles.template === 'modern-geometric' || styles.template === 'crimson-split' || styles.template === 'teal-timeline' || styles.template === 'dark-gold-arch')
    ? 'p-0 gap-y-0'
    : paddingClass;

  // Sidebar header helper for split sidebar
  const renderSidebarSectionHeader = (title: string, customColor?: string) => {
    return (
      <div className="border-b pb-1.5 mb-2.5 mt-0.5 flex items-center gap-2" style={{ borderColor: `${customColor || '#ffffff'}30` }}>
        <div style={{ color: customColor || '#ffffff' }} className="opacity-90 flex items-center justify-center shrink-0">
          {getSectionIcon(title)}
        </div>
        <h4 className="font-extrabold tracking-widest uppercase text-[10px] leading-none m-0 p-0 flex-1 min-w-0" style={{ color: customColor || '#ffffff', fontFamily: 'Space Grotesk, sans-serif' }}>
          {title}
        </h4>
      </div>
    );
  };

  // Render Section elements
  const renderSectionHeader = (title: string) => {
    const icon = getSectionIcon(title);
    const isComp = styles.density === 'compact';

    if (styles.template === 'depth3d') {
      return (
        <div className={`flex items-center gap-2.5 ${isComp ? 'mb-2.5' : 'mb-3.5'} relative select-none z-10`}>
          <div className="p-1.5 rounded-xl text-white shadow-sm flex items-center justify-center shrink-0" style={{ backgroundColor: styles.primaryColor }}>
            {icon}
          </div>
          <h3 className="font-extrabold tracking-widest text-[#0f172a] uppercase text-xs leading-none m-0 p-0" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {title}
          </h3>
          <span className="flex-1 h-[2px] rounded-full opacity-30" style={{ backgroundColor: styles.primaryColor }} />
        </div>
      );
    }

    if (styles.template === 'modern') {
      return (
        <div className={`${isComp ? 'mb-2.5' : 'mb-3.5'} relative group`}>
          <div className="flex items-center gap-2.5">
            <span className="text-slate-400 shrink-0 flex items-center justify-center" style={{ color: styles.secondaryColor || styles.primaryColor }}>
              {icon}
            </span>
            <h3 className="font-bold text-xs tracking-widest uppercase leading-none m-0 p-0" style={{ color: styles.primaryColor }}>
              {title}
            </h3>
          </div>
          <div className="h-[2px] w-full mt-2 bg-slate-100 flex rounded overflow-hidden">
            <div className="h-full w-1/3 rounded" style={{ backgroundColor: styles.primaryColor }} />
          </div>
        </div>
      );
    }

    if (styles.template === 'modern-geometric') {
      return (
        <div className={`${isComp ? 'mb-2.5' : 'mb-3.5'} relative group`}>
          <div className="flex items-center gap-2.5">
            <span className="p-1 rounded bg-slate-900 text-amber-400 shrink-0 select-none flex items-center justify-center">
              {icon}
            </span>
            <h3 className="font-black tracking-widest text-[#1b2a47] uppercase text-xs leading-none m-0 p-0" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {title}
            </h3>
            <span className="flex-1 border-t-2 border-dashed border-slate-200" />
          </div>
        </div>
      );
    }

    if (styles.template === 'split-sidebar') {
      return (
        <div className={`w-full ${isComp ? 'mb-2' : 'mb-2.5'}`}>
          <div className="flex items-center gap-2 pb-1.5 group">
            <span className="p-1 rounded bg-slate-100 text-[#0f172a] shrink-0 flex items-center justify-center" style={{ color: styles.primaryColor }}>
              {icon}
            </span>
            <h3 className="font-black tracking-wider uppercase text-xs text-slate-900 leading-none m-0 p-0" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {title}
            </h3>
          </div>
          <div className="h-[1px] w-full" style={{ backgroundColor: `${styles.primaryColor}25` }} />
        </div>
      );
    }

    if (styles.template === 'minimalist-clean') {
      return (
        <div className={`w-full ${isComp ? 'mb-2' : 'mb-2.5'} mt-1`}>
          <div className="flex items-center gap-2 pb-1.5">
            <span className="text-slate-800 flex items-center justify-center shrink-0">{icon}</span>
            <h3 className="font-black tracking-widest uppercase text-[10.5px] text-slate-900 leading-none m-0 p-0">
              {title}
            </h3>
          </div>
          <div className="h-[2px] w-full bg-slate-900" />
        </div>
      );
    }

    if (styles.template === 'editorial-serif') {
      return (
        <div className={`border-b ${isComp ? 'pb-1 mb-2' : 'pb-1.5 mb-2.5'} mt-1`} style={{ borderColor: `${styles.primaryColor}40` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="opacity-75 not-italic font-sans text-slate-500 flex items-center justify-center shrink-0">{icon}</span>
              <h3 className="font-serif italic font-bold text-[14px] text-slate-950 leading-none m-0 p-0">{title}</h3>
            </div>
            <span className="text-[9px] tracking-normal font-sans text-slate-400 not-italic uppercase font-semibold leading-none">§ section</span>
          </div>
        </div>
      );
    }

    if (styles.template === 'crimson-split') {
      return (
        <div className={`text-center ${isComp ? 'mb-3' : 'mb-5'} relative select-none mt-2`}>
          <h3 className="font-serif italic font-extrabold tracking-wide text-[13px] md:text-base leading-snug m-0 p-0" style={{ color: styles.primaryColor }}>
            {title}
          </h3>
          <div className="w-16 h-[1.5px] bg-slate-300 mx-auto mt-2 opacity-60" />
        </div>
      );
    }

    if (styles.template === 'teal-timeline') {
      return (
        <div className={`${isComp ? 'mb-3.5' : 'mb-5'} relative select-none mt-1`}>
          <div className="inline-block px-4 py-1.5 rounded-sm text-white font-bold tracking-widest uppercase text-[10px] leading-none" style={{ backgroundColor: styles.primaryColor }}>
            {title}
          </div>
          <div className="w-full h-[1px] mt-1.5" style={{ backgroundColor: `${styles.primaryColor}25` }} />
        </div>
      );
    }

    if (styles.template === 'dark-gold-arch') {
      return (
        <div className={`${isComp ? 'mb-3.5' : 'mb-5'} relative select-none mt-1`}>
          <div 
            className="w-full py-2 px-5 rounded-full text-white font-black tracking-widest uppercase text-[10px] shadow-sm flex items-center justify-between leading-none" 
            style={{ 
              background: `linear-gradient(135deg, ${styles.secondaryColor} 0%, #B8860B 100%)`,
              fontFamily: 'Space Grotesk, sans-serif'
            }}
          >
            <span>{title}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white opacity-80 shrink-0" />
          </div>
        </div>
      );
    }

    if (styles.template === 'tech-mono') {
      return (
        <div className={`w-full ${isComp ? 'mb-2' : 'mb-3'} select-none font-mono`}>
          <div className="flex items-center gap-2 pb-1 group">
            <span className="text-emerald-500 font-extrabold text-xs select-none shrink-0 leading-none">#</span>
            <span className="text-amber-500 flex items-center justify-center shrink-0">{icon}</span>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-950 leading-none m-0 p-0">
              {title}
            </h3>
            <span className="flex-1 text-right text-[10px] text-slate-400 font-normal leading-none">--exec</span>
          </div>
          <div className="w-full border-b border-dashed border-slate-300" />
        </div>
      );
    }

    // Corporate default
    return (
      <div className={`w-full ${isComp ? 'mb-2' : 'mb-2.5'}`}>
        <div className="flex items-center gap-2 pb-1.5">
          <span className="flex items-center justify-center shrink-0" style={{ color: styles.primaryColor }}>{icon}</span>
          <h3 className="font-extrabold tracking-widest uppercase text-xs leading-none m-0 p-0" style={{ color: styles.primaryColor }}>
            {title}
          </h3>
        </div>
        <div className="h-[1.5px] w-full" style={{ backgroundColor: `${styles.primaryColor}35` }} />
      </div>
    );
  };

  const renderPersonal = () => {
    if (styles.template === 'depth3d') {
      return (
        <div className="p-6 rounded-2xl bg-white/95 border border-white/60 shadow-[0_15px_30px_rgba(0,0,0,0.06),0_10px_15px_-3px_rgba(0,0,0,0.04),inset_0_1px_2px_rgba(255,255,255,0.8),inset_0_-1px_3px_rgba(0,0,0,0.02)] border-b-4 border-r-2 border-slate-300/40 hover:-translate-y-1 hover:shadow-[0_20px_35px_rgba(0,0,0,0.09)] transition-all duration-300 flex flex-col md:flex-row gap-5 items-center justify-between select-text relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
            {personalInfo.photoVisible && personalInfo.avatarUrl && (
              <img
                src={personalInfo.avatarUrl}
                alt={personalInfo.name}
                className="w-28 h-28 rounded-2xl object-cover border-4 border-violet-100 shadow-[0_10px_20px_rgba(0,0,0,0.12),0_3px_6px_rgba(0,0,0,0.08)] [transform:translateZ(15px)]"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
              />
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 leading-none animate-fade-in" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                <Editable path={['personalInfo', 'name']} text={personalInfo.name} />
              </h1>
              <div className="text-[11px] font-extrabold tracking-widest uppercase mt-2.5 px-3 py-1.5 rounded-lg text-white shadow-[0_4px_10px_rgba(124,58,237,0.25)] flex items-center gap-1.5 self-start justify-center md:justify-start" style={{ backgroundColor: styles.primaryColor }}>
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <Editable path={['personalInfo', 'title']} text={personalInfo.title} />
              </div>
              <div className="text-xs text-slate-500 mt-3 font-mono flex flex-wrap justify-center md:justify-start items-center gap-x-4 gap-y-1.5 select-none">
                {personalInfo.email && (
                  <span className="inline-flex items-center gap-1 max-w-full" id="depth3d-email">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="break-all"><Editable path={['personalInfo', 'email']} text={personalInfo.email} /></span>
                  </span>
                )}
                {personalInfo.phone && (
                  <span className="inline-flex items-center gap-1 max-w-full break-words" id="depth3d-phone">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <Editable path={['personalInfo', 'phone']} text={personalInfo.phone} />
                  </span>
                )}
                {personalInfo.location && (
                  <span className="inline-flex items-center gap-1 max-w-full break-words" id="depth3d-location">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <Editable path={['personalInfo', 'location']} text={personalInfo.location} />
                  </span>
                )}
                {personalInfo.birthDate && (
                  <span className="inline-flex items-center gap-1 max-w-full break-words" id="depth3d-birthdate">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <Editable path={['personalInfo', 'birthDate']} text={personalInfo.birthDate} />
                  </span>
                )}
                {personalInfo.birthPlace && (
                  <span className="inline-flex items-center gap-1 max-w-full break-words" id="depth3d-birthplace">
                    <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Doğum Yeri:</span>
                    <Editable path={['personalInfo', 'birthPlace']} text={personalInfo.birthPlace} />
                  </span>
                )}
                {personalInfo.maritalStatus && (
                  <span className="inline-flex items-center gap-1 max-w-full break-words" id="depth3d-maritalstatus">
                    <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Medeni Durum:</span>
                    <Editable path={['personalInfo', 'maritalStatus']} text={personalInfo.maritalStatus} />
                  </span>
                )}
                {personalInfo.driverLicense && (
                  <span className="inline-flex items-center gap-1 max-w-full break-words" id="depth3d-driverlicense">
                    <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Ehliyet:</span>
                    <Editable path={['personalInfo', 'driverLicense']} text={personalInfo.driverLicense} />
                  </span>
                )}
                {personalInfo.website && (
                  <span className="inline-flex items-center gap-1 text-indigo-600 font-bold hover:text-indigo-500 max-w-full" id="depth3d-website">
                    <Globe className="w-3.5 h-3.5 shrink-0" />
                    <span className="break-all"><Editable path={['personalInfo', 'website']} text={personalInfo.website} /></span>
                  </span>
                )}
                {socialLinks && socialLinks.length > 0 && socialLinks.map((sLink) => (
                  <span key={sLink.id} className="inline-flex items-center gap-1 text-slate-700 max-w-full font-sans">
                    <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">{sLink.platform}:</span>
                    <span className="break-all underline text-indigo-600 font-medium">{sLink.url}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
          {isHeaderQR && (
            <div className="flex-shrink-0 scale-90 bg-white p-2 border border-slate-100 rounded-xl shadow-[0_8px_16px_rgba(0,0,0,0.08)]">
              <QRCodeGen value={styles.qrCodeUrl} size={65} fgColor={styles.primaryColor} />
            </div>
          )}
        </div>
      );
    }

    if (styles.template === 'modern') {
      return (
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div className="flex items-center gap-4">
            {personalInfo.photoVisible && personalInfo.avatarUrl && (
              <img
                src={personalInfo.avatarUrl}
                alt={personalInfo.name}
                className="w-24 h-24 rounded-xl object-cover shadow-sm border border-slate-200"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
              />
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 leading-none">
                <Editable path={['personalInfo', 'name']} text={personalInfo.name} />
              </h1>
              <p className="text-sm font-medium mt-1.5" style={{ color: styles.secondaryColor }}>
                <Editable path={['personalInfo', 'title']} text={personalInfo.title} />
              </p>
              <div className="text-xs text-slate-500 mt-2.5 flex flex-wrap justify-center md:justify-start items-center gap-x-3 gap-y-1.5 select-none font-sans">
                {personalInfo.email && (
                  <span className="inline-flex items-center gap-1 max-w-full">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="break-all"><Editable path={['personalInfo', 'email']} text={personalInfo.email} /></span>
                  </span>
                )}
                {personalInfo.phone && (
                  <>
                    <span className="h-3 w-px bg-slate-300 shrink-0 self-center inline-block" />
                    <span className="inline-flex items-center gap-1 max-w-full break-words">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <Editable path={['personalInfo', 'phone']} text={personalInfo.phone} />
                    </span>
                  </>
                )}
                {personalInfo.location && (
                  <>
                    <span className="h-3 w-px bg-slate-300 shrink-0 self-center inline-block" />
                    <span className="inline-flex items-center gap-1 max-w-full break-words">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <Editable path={['personalInfo', 'location']} text={personalInfo.location} />
                    </span>
                  </>
                )}
                {personalInfo.birthDate && (
                  <>
                    <span className="h-3 w-px bg-slate-300 shrink-0 self-center inline-block" />
                    <span className="inline-flex items-center gap-1 max-w-full break-words">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <Editable path={['personalInfo', 'birthDate']} text={personalInfo.birthDate} />
                    </span>
                  </>
                )}
                {personalInfo.birthPlace && (
                  <>
                    <span className="h-3 w-px bg-slate-300 shrink-0 self-center inline-block" />
                    <span className="inline-flex items-center gap-1 max-w-full break-words font-sans">
                      <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Doğum Yeri:</span>
                      <Editable path={['personalInfo', 'birthPlace']} text={personalInfo.birthPlace} />
                    </span>
                  </>
                )}
                {personalInfo.maritalStatus && (
                  <>
                    <span className="h-3 w-px bg-slate-300 shrink-0 self-center inline-block" />
                    <span className="inline-flex items-center gap-1 max-w-full break-words font-sans">
                      <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Medeni Durum:</span>
                      <Editable path={['personalInfo', 'maritalStatus']} text={personalInfo.maritalStatus} />
                    </span>
                  </>
                )}
                {personalInfo.driverLicense && (
                  <>
                    <span className="h-3 w-px bg-slate-300 shrink-0 self-center inline-block" />
                    <span className="inline-flex items-center gap-1 max-w-full break-words font-sans">
                      <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Ehliyet:</span>
                      <Editable path={['personalInfo', 'driverLicense']} text={personalInfo.driverLicense} />
                    </span>
                  </>
                )}
                {personalInfo.website && (
                  <>
                    <span className="h-3 w-px bg-slate-300 shrink-0 self-center inline-block" />
                    <span className="inline-flex items-center gap-1 max-w-full">
                      <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="break-all" style={{ color: styles.primaryColor }}>
                        <Editable path={['personalInfo', 'website']} text={personalInfo.website} />
                      </span>
                    </span>
                  </>
                )}
                {socialLinks && socialLinks.length > 0 && socialLinks.map((sLink) => (
                  <React.Fragment key={sLink.id}>
                    <span className="h-3 w-px bg-slate-300 shrink-0 self-center inline-block" />
                    <span className="inline-flex items-center gap-1 max-w-full font-sans">
                      <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">{sLink.platform}:</span>
                      <span className="break-all underline" style={{ color: styles.primaryColor }}>{sLink.url}</span>
                    </span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
          {isHeaderQR && (
            <div className="flex-shrink-0">
              <QRCodeGen value={styles.qrCodeUrl} size={70} fgColor={styles.primaryColor} />
            </div>
          )}
        </div>
      );
    }

    if (styles.template === 'minimalist-clean') {
      return (
        <div className="pb-3 border-b border-slate-200 flex justify-between items-start gap-4">
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-black tracking-widest text-slate-900 uppercase">
              <Editable path={['personalInfo', 'name']} text={personalInfo.name} />
            </h1>
            <p className="text-xs uppercase tracking-widest font-semibold text-slate-500 mt-1">
              <Editable path={['personalInfo', 'title']} text={personalInfo.title} />
            </p>
            <div className="text-[10px] text-slate-500 mt-2.5 flex flex-wrap justify-center items-center gap-x-2.5 gap-y-1.5 select-none font-sans">
            {personalInfo.email && (
              <span className="inline-flex items-center gap-1 max-w-full">
                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="break-all"><Editable path={['personalInfo', 'email']} text={personalInfo.email} /></span>
              </span>
            )}
            {personalInfo.phone && (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0 self-center inline-block" />
                <span className="inline-flex items-center gap-1 max-w-full break-words">
                  <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                  <Editable path={['personalInfo', 'phone']} text={personalInfo.phone} />
                </span>
              </>
            )}
            {personalInfo.location && (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0 self-center inline-block" />
                <span className="inline-flex items-center gap-1 max-w-full break-words">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <Editable path={['personalInfo', 'location']} text={personalInfo.location} />
                </span>
              </>
            )}
            {personalInfo.birthDate && (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0 self-center inline-block" />
                <span className="inline-flex items-center gap-1 max-w-full break-words">
                  <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                  <Editable path={['personalInfo', 'birthDate']} text={personalInfo.birthDate} />
                </span>
              </>
            )}
            {personalInfo.birthPlace && (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0 self-center inline-block" />
                <span className="inline-flex items-center gap-1 max-w-full break-words font-sans">
                  <span className="text-[9px] uppercase font-bold text-slate-400 shrink-0">Doğum Yeri:</span>
                  <Editable path={['personalInfo', 'birthPlace']} text={personalInfo.birthPlace} />
                </span>
              </>
            )}
            {personalInfo.maritalStatus && (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0 self-center inline-block" />
                <span className="inline-flex items-center gap-1 max-w-full break-words font-sans">
                  <span className="text-[9px] uppercase font-bold text-slate-400 shrink-0">Medeni Durum:</span>
                  <Editable path={['personalInfo', 'maritalStatus']} text={personalInfo.maritalStatus} />
                </span>
              </>
            )}
            {personalInfo.driverLicense && (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0 self-center inline-block" />
                <span className="inline-flex items-center gap-1 max-w-full break-words font-sans">
                  <span className="text-[9px] uppercase font-bold text-slate-400 shrink-0">Ehliyet:</span>
                  <Editable path={['personalInfo', 'driverLicense']} text={personalInfo.driverLicense} />
                </span>
              </>
            )}
            {personalInfo.website && (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0 self-center inline-block" />
                <span className="inline-flex items-center gap-1 max-w-full">
                  <Globe className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="break-all underline hover:text-slate-800">
                    <Editable path={['personalInfo', 'website']} text={personalInfo.website} />
                  </span>
                </span>
              </>
            )}
            {socialLinks && socialLinks.length > 0 && socialLinks.map((sLink) => (
              <React.Fragment key={sLink.id}>
                <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0 self-center inline-block" />
                <span className="inline-flex items-center gap-1 max-w-full font-sans">
                  <span className="text-[9px] uppercase font-bold text-slate-400 shrink-0">{sLink.platform}:</span>
                  <span className="break-all underline hover:text-slate-800">{sLink.url}</span>
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>
        {isHeaderQR && (
          <div className="shrink-0 self-center">
            <QRCodeGen value={styles.qrCodeUrl} size={65} fgColor={styles.primaryColor} />
          </div>
        )}
      </div>
    );
  }

    if (styles.template === 'editorial-serif') {
      return (
        <div className="pb-4 border-b border-slate-300 flex justify-between items-start gap-4">
          <div className="flex-1 text-center">
            <h1 className="text-3xl font-serif font-black tracking-wide text-slate-900">
              <Editable path={['personalInfo', 'name']} text={personalInfo.name} />
            </h1>
            <p className="text-xs font-serif italic text-slate-600 mt-1">
              <Editable path={['personalInfo', 'title']} text={personalInfo.title} />
            </p>
            <div className="text-xs text-slate-600 mt-2.5 flex flex-wrap justify-center items-center gap-x-2.5 gap-y-1.5 select-none font-sans">
            {personalInfo.email && (
              <span className="inline-flex items-center gap-1 max-w-full">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="break-all"><Editable path={['personalInfo', 'email']} text={personalInfo.email} /></span>
              </span>
            )}
            {personalInfo.phone && (
              <>
                <span className="text-slate-300 font-serif italic shrink-0 self-center select-none inline-block">—</span>
                <span className="inline-flex items-center gap-1 max-w-full break-words">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <Editable path={['personalInfo', 'phone']} text={personalInfo.phone} />
                </span>
              </>
            )}
            {personalInfo.location && (
              <>
                <span className="text-slate-300 font-serif italic shrink-0 self-center select-none inline-block">—</span>
                <span className="inline-flex items-center gap-1 max-w-full break-words">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <Editable path={['personalInfo', 'location']} text={personalInfo.location} />
                </span>
              </>
            )}
            {personalInfo.birthDate && (
              <>
                <span className="text-slate-300 font-serif italic shrink-0 self-center select-none inline-block">—</span>
                <span className="inline-flex items-center gap-1 max-w-full break-words">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <Editable path={['personalInfo', 'birthDate']} text={personalInfo.birthDate} />
                </span>
              </>
            )}
            {personalInfo.birthPlace && (
              <>
                <span className="text-slate-300 font-serif italic shrink-0 self-center select-none inline-block">—</span>
                <span className="inline-flex items-center gap-1 max-w-full break-words font-sans">
                  <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Doğum Yeri:</span>
                  <Editable path={['personalInfo', 'birthPlace']} text={personalInfo.birthPlace} />
                </span>
              </>
            )}
            {personalInfo.maritalStatus && (
              <>
                <span className="text-slate-300 font-serif italic shrink-0 self-center select-none inline-block">—</span>
                <span className="inline-flex items-center gap-1 max-w-full break-words font-sans">
                  <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Medeni Durum:</span>
                  <Editable path={['personalInfo', 'maritalStatus']} text={personalInfo.maritalStatus} />
                </span>
              </>
            )}
            {personalInfo.driverLicense && (
              <>
                <span className="text-slate-300 font-serif italic shrink-0 self-center select-none inline-block">—</span>
                <span className="inline-flex items-center gap-1 max-w-full break-words font-sans">
                  <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Ehliyet:</span>
                  <Editable path={['personalInfo', 'driverLicense']} text={personalInfo.driverLicense} />
                </span>
              </>
            )}
            {personalInfo.website && (
              <>
                <span className="text-slate-300 font-serif italic shrink-0 self-center select-none inline-block">—</span>
                <span className="inline-flex items-center gap-1 max-w-full">
                  <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="break-all underline font-medium">
                    <Editable path={['personalInfo', 'website']} text={personalInfo.website} />
                  </span>
                </span>
              </>
            )}
            {socialLinks && socialLinks.length > 0 && socialLinks.map((sLink) => (
              <React.Fragment key={sLink.id}>
                <span className="text-slate-300 font-serif italic shrink-0 self-center select-none inline-block">—</span>
                <span className="inline-flex items-center gap-1 max-w-full font-sans">
                  <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">{sLink.platform}:</span>
                  <span className="break-all underline font-medium">{sLink.url}</span>
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>
        {isHeaderQR && (
          <div className="shrink-0 self-center">
            <QRCodeGen value={styles.qrCodeUrl} size={65} fgColor={styles.primaryColor} />
          </div>
        )}
      </div>
    );
  }

    if (styles.template === 'tech-mono') {
      return (
        <div className="border border-slate-200 bg-slate-50/50 p-4 rounded-lg font-mono">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <div>
              <div className="text-[10px] text-emerald-600 font-bold">/* USER PROFILE */</div>
              <h1 className="text-lg font-bold tracking-tight text-slate-950">
                {`[`}<Editable path={['personalInfo', 'name']} text={personalInfo.name} />{`]`}
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {`// `}<Editable path={['personalInfo', 'title']} text={personalInfo.title} />
              </p>
            </div>
            {isHeaderQR && (
              <div className="bg-white p-1 rounded border border-slate-200">
                <QRCodeGen value={styles.qrCodeUrl} size={55} fgColor="#0f172a" />
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap text-[10px] text-slate-600 mt-3 pt-3 border-t border-dashed border-slate-200 font-mono">
            {personalInfo.email && <div className="w-full sm:w-[48%] mr-[2%] mb-1"><span className="text-slate-400">email:</span> "<Editable path={['personalInfo', 'email']} text={personalInfo.email} />"</div>}
            {personalInfo.phone && <div className="w-full sm:w-[48%] mr-[2%] mb-1"><span className="text-slate-400">phone:</span> "<Editable path={['personalInfo', 'phone']} text={personalInfo.phone} />"</div>}
            {personalInfo.location && <div className="w-full sm:w-[48%] mr-[2%] mb-1"><span className="text-slate-400">address:</span> "<Editable path={['personalInfo', 'location']} text={personalInfo.location} />"</div>}
            {personalInfo.birthDate && <div className="w-full sm:w-[48%] mr-[2%] mb-1"><span className="text-slate-400">birthDate:</span> "<Editable path={['personalInfo', 'birthDate']} text={personalInfo.birthDate} />"</div>}
            {personalInfo.birthPlace && <div className="w-full sm:w-[48%] mr-[2%] mb-1"><span className="text-slate-400">birthPlace:</span> "<Editable path={['personalInfo', 'birthPlace']} text={personalInfo.birthPlace} />"</div>}
            {personalInfo.maritalStatus && <div className="w-full sm:w-[48%] mr-[2%] mb-1"><span className="text-slate-400">maritalStatus:</span> "<Editable path={['personalInfo', 'maritalStatus']} text={personalInfo.maritalStatus} />"</div>}
            {personalInfo.driverLicense && <div className="w-full sm:w-[48%] mr-[2%] mb-1"><span className="text-slate-400">driverLicense:</span> "<Editable path={['personalInfo', 'driverLicense']} text={personalInfo.driverLicense} />"</div>}
            {personalInfo.website && (
              <div className="w-full sm:w-[48%] mr-[2%] mb-1">
                <span className="text-slate-400">site:</span>{" "}
                <span className="underline hover:text-indigo-600 font-mono">
                  "<Editable path={['personalInfo', 'website']} text={personalInfo.website} />"
                </span>
              </div>
            )}
            {socialLinks && socialLinks.length > 0 && socialLinks.map((sLink) => (
              <div key={sLink.id} className="w-full sm:w-[48%] mr-[2%] mb-1">
                <span className="text-slate-400">{sLink.platform.toLowerCase()}:</span>{" "}
                <span className="underline hover:text-emerald-600 font-mono">"{sLink.url}"</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Corporate Default Template
    return (
      <div className="border-b-2 pb-4 flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-4" style={{ borderColor: styles.primaryColor }}>
        <div className="flex flex-col md:flex-row items-center gap-5">
          {personalInfo.photoVisible && personalInfo.avatarUrl && (
            <img
              src={personalInfo.avatarUrl}
              alt={personalInfo.name}
              className="w-24 h-24 rounded-full object-cover border border-slate-300 shadow-inner"
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
            />
          )}
          <div>
            <h1 className="text-3xl font-semibold tracking-normal text-slate-900 uppercase">
              <Editable path={['personalInfo', 'name']} text={personalInfo.name} />
            </h1>
            <p className="text-sm uppercase font-semibold text-slate-500 tracking-wider">
              <Editable path={['personalInfo', 'title']} text={personalInfo.title} />
            </p>
            <div className="text-xs text-slate-700 mt-2.5 flex flex-wrap justify-center md:justify-start items-center gap-x-2.5 gap-y-1.5 select-none font-sans">
              {personalInfo.email && (
                <span className="inline-flex items-center gap-1 max-w-full">
                  <Mail className="w-3.5 h-3.5 shrink-0" style={{ color: styles.primaryColor }} />
                  <span className="break-all"><Editable path={['personalInfo', 'email']} text={personalInfo.email} /></span>
                </span>
              )}
              {personalInfo.phone && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0 self-center inline-block" />
                  <span className="inline-flex items-center gap-1 max-w-full break-words">
                    <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: styles.primaryColor }} />
                    <Editable path={['personalInfo', 'phone']} text={personalInfo.phone} />
                  </span>
                </>
              )}
              {personalInfo.location && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0 self-center inline-block" />
                  <span className="inline-flex items-center gap-1 max-w-full break-words">
                    <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: styles.primaryColor }} />
                    <Editable path={['personalInfo', 'location']} text={personalInfo.location} />
                  </span>
                </>
              )}
              {personalInfo.birthDate && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0 self-center inline-block" />
                  <span className="inline-flex items-center gap-1 max-w-full break-words">
                    <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: styles.primaryColor }} />
                    <Editable path={['personalInfo', 'birthDate']} text={personalInfo.birthDate} />
                  </span>
                </>
              )}
              {personalInfo.birthPlace && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0 self-center inline-block" />
                  <span className="inline-flex items-center gap-1 max-w-full break-words font-sans">
                    <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Doğum Yeri:</span>
                    <Editable path={['personalInfo', 'birthPlace']} text={personalInfo.birthPlace} />
                  </span>
                </>
              )}
              {personalInfo.maritalStatus && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0 self-center inline-block" />
                  <span className="inline-flex items-center gap-1 max-w-full break-words font-sans">
                    <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Medeni Durum:</span>
                    <Editable path={['personalInfo', 'maritalStatus']} text={personalInfo.maritalStatus} />
                  </span>
                </>
              )}
              {personalInfo.driverLicense && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0 self-center inline-block" />
                  <span className="inline-flex items-center gap-1 max-w-full break-words font-sans">
                    <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Ehliyet:</span>
                    <Editable path={['personalInfo', 'driverLicense']} text={personalInfo.driverLicense} />
                  </span>
                </>
              )}
              {personalInfo.website && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0 self-center inline-block" />
                  <span className="inline-flex items-center gap-1 max-w-full">
                    <Globe className="w-3.5 h-3.5 shrink-0" style={{ color: styles.primaryColor }} />
                    <span className="break-all hover:underline">
                      <Editable path={['personalInfo', 'website']} text={personalInfo.website} />
                    </span>
                  </span>
                </>
              )}
              {socialLinks && socialLinks.length > 0 && socialLinks.map((sLink) => (
                <React.Fragment key={sLink.id}>
                  <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0 self-center inline-block" />
                  <span className="inline-flex items-center gap-1 max-w-full font-sans">
                    <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">{sLink.platform}:</span>
                    <span className="break-all hover:underline" style={{ color: styles.primaryColor }}>{sLink.url}</span>
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
        {isHeaderQR && (
          <div className="flex-shrink-0">
            <QRCodeGen value={styles.qrCodeUrl} size={75} fgColor="#0f172a" />
          </div>
        )}
      </div>
    );
  };

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'summary':
        if (!personalInfo.summary) return null;
        return (
          <div key="summary" className={getBlockCardClass('summary')}>
            {renderSectionHeader('Profesyonel Özet')}
            <div className="text-slate-600 leading-relaxed text-left whitespace-pre-wrap">
              <Editable path={['personalInfo', 'summary']} text={personalInfo.summary} multiline={true} />
            </div>
          </div>
        );

      case 'experience':
        if (workExperiences.length === 0) return null;
        const isModernLayoutExp = ['split-sidebar', 'modern-geometric', 'depth3d', 'modern', 'teal-timeline', 'dark-gold-arch'].includes(styles.template);
        return (
          <div key="experience" className={getBlockCardClass('experience')}>
            {renderSectionHeader('İş Deneyimleri')}
            <div className={`relative ${isModernLayoutExp ? `border-l-2 ml-2 pl-5 py-1 ${styles.density === 'compact' ? 'space-y-2' : styles.density === 'loose' ? 'space-y-6' : 'space-y-4'}` : sectionGapClass}`} style={isModernLayoutExp ? { borderColor: `${styles.primaryColor}20` } : {}}>
              {workExperiences.map((exp) => (
                <div key={exp.id} className="relative flex flex-col items-start w-full group">
                  {/* Timeline pointer */}
                  {isModernLayoutExp && (
                    <span 
                      className="absolute -left-[28px] top-[3px] w-3.5 h-3.5 rounded-full border-2 bg-white flex items-center justify-center shadow-xs z-10" 
                      style={{ borderColor: styles.primaryColor }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: styles.primaryColor }} />
                    </span>
                  )}
                  {/* Header row containing title details on left and date on right */}
                  <div className="flex flex-row justify-between items-start w-full gap-2 md:gap-4">
                    <div className="flex-1 min-w-0 pr-2">
                      <h4 className="font-bold text-slate-800 break-words [overflow-wrap:anywhere] leading-5 m-0 p-0">
                        <Editable path={['workExperiences', exp.id, 'role']} text={exp.role} />
                      </h4>
                      <p className={`${textXsClass} font-semibold text-slate-500 mt-1 break-words [overflow-wrap:anywhere] leading-normal`}>
                        <span style={{ color: styles.primaryColor }}><Editable path={['workExperiences', exp.id, 'company']} text={exp.company} /></span> <span className="text-slate-300 font-normal">|</span> <Editable path={['workExperiences', exp.id, 'location']} text={exp.location} />
                      </p>
                    </div>
                    <div className="text-[11px] font-mono font-semibold text-slate-500 shrink-0 select-none whitespace-nowrap flex items-center gap-1 leading-5">
                      <Editable path={['workExperiences', exp.id, 'startDate']} text={exp.startDate} /> - <Editable path={['workExperiences', exp.id, 'endDate']} text={exp.current ? 'Günümüz' : exp.endDate} />
                    </div>
                  </div>
                  {/* Description row spanning full width underneath */}
                  {exp.description && (
                    <div className={`text-slate-600 ${styles.density === 'compact' ? 'mt-0.5' : 'mt-1.5'} ${textXsClass} whitespace-pre-line leading-relaxed w-full break-words [overflow-wrap:anywhere]`}>
                      <Editable path={['workExperiences', exp.id, 'description']} text={exp.description} multiline={true} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'education':
        if (educations.length === 0) return null;
        const isModernLayoutEdu = ['split-sidebar', 'modern-geometric', 'depth3d', 'modern', 'teal-timeline', 'dark-gold-arch'].includes(styles.template);
        return (
          <div key="education" className={getBlockCardClass('education')}>
            {renderSectionHeader('Eğitim Bilgileri')}
            <div className={`relative ${isModernLayoutEdu ? `border-l-2 ml-2 pl-5 py-1 ${styles.density === 'compact' ? 'space-y-2' : styles.density === 'loose' ? 'space-y-6' : 'space-y-4'}` : sectionGapClass}`} style={isModernLayoutEdu ? { borderColor: `${styles.primaryColor}20` } : {}}>
              {educations.map((edu) => (
                <div key={edu.id} className="relative flex flex-col items-start w-full group">
                  {/* Timeline pointer */}
                  {isModernLayoutEdu && (
                    <span 
                      className="absolute -left-[28px] top-[3px] w-3.5 h-3.5 rounded-full border-2 bg-white flex items-center justify-center shadow-xs z-10" 
                      style={{ borderColor: styles.secondaryColor || styles.primaryColor }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: styles.secondaryColor || styles.primaryColor }} />
                    </span>
                  )}
                  {/* Header row containing school details on left and date on right */}
                  <div className="flex flex-row justify-between items-start w-full gap-2 md:gap-4">
                    <div className="flex-1 min-w-0 pr-2">
                      <h4 className="font-bold text-slate-800 break-words [overflow-wrap:anywhere] leading-5 m-0 p-0">
                        <Editable path={['educations', edu.id, 'school']} text={edu.school} />
                      </h4>
                      <p className={`${textXsClass} font-semibold mt-1 break-words [overflow-wrap:anywhere] leading-normal`} style={{ color: styles.secondaryColor }}>
                        <Editable path={['educations', edu.id, 'degree']} text={edu.degree} /> - <Editable path={['educations', edu.id, 'field']} text={edu.field} /> <span className="text-slate-300 font-normal">|</span> <Editable path={['educations', edu.id, 'location']} text={edu.location} />
                      </p>
                    </div>
                    <div className="text-[11px] font-mono font-semibold text-slate-500 shrink-0 select-none whitespace-nowrap flex items-center gap-1 leading-5">
                      <Editable path={['educations', edu.id, 'startDate']} text={edu.startDate} /> - <Editable path={['educations', edu.id, 'endDate']} text={edu.current ? 'Günümüz' : edu.endDate} />
                    </div>
                  </div>
                  {/* Description row spanning full width underneath */}
                  {edu.description && (
                    <div className={`text-slate-500 ${styles.density === 'compact' ? 'mt-0.5' : 'mt-1.5'} ${textXsClass} whitespace-pre-line w-full break-words [overflow-wrap:anywhere]`}>
                      <Editable path={['educations', edu.id, 'description']} text={edu.description} multiline={true} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'projects':
        if (projects.length === 0) return null;
        return (
          <div key="projects" className={getBlockCardClass('projects')}>
            {renderSectionHeader('Projeler')}
            <div className={sectionGapClass}>
              {projects.map((proj) => (
                <div key={proj.id} className="block">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-slate-800 flex-1 min-w-0 break-words [overflow-wrap:anywhere]">
                      <Editable path={['projects', proj.id, 'name']} text={proj.name} />
                    </h4>
                    {proj.url && (
                      <span className="text-xs text-indigo-500 font-medium shrink-0 max-w-[45%] break-all text-right">
                        <Editable path={['projects', proj.id, 'url']} text={proj.url} />
                      </span>
                    )}
                  </div>
                  {proj.role && <p className={`${textXsClass} font-semibold text-slate-400`}><Editable path={['projects', proj.id, 'role']} text={proj.role} /></p>}
                  <div className={`text-slate-600 mt-1 ${textXsClass} leading-relaxed`}>
                    <Editable path={['projects', proj.id, 'description']} text={proj.description} multiline={true} />
                  </div>
                  {proj.technologies && (
                    <div className="flex flex-wrap gap-1 mt-1.5 items-center max-w-full">
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">Araçlar:</span>
                      <Editable path={['projects', proj.id, 'technologies']} text={proj.technologies} className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded font-mono break-words [overflow-wrap:anywhere] max-w-full" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'skills':
        if (skills.length === 0) return null;
        return (
          <div key="skills" className={getBlockCardClass('skills')}>
            {renderSectionHeader('Yetkinlikler ve Beceriler')}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {skills.map((cat) => (
                <div key={cat.id} className="space-y-1.5">
                  {shouldShowCategoryHeader(cat.categoryName) && (
                    <h5 className="font-semibold text-xs text-slate-700 bg-slate-50 border-l-2 border-indigo-400 pl-2 py-0.5 uppercase tracking-wide">
                      <Editable path={['skills', cat.id, 'categoryName']} text={cat.categoryName} />
                    </h5>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1">
                    {cat.skills.map((skill, sIdx) => {
                      if (styles.template === 'depth3d') {
                        return (
                          <span key={sIdx} className="bg-white/90 shadow-sm border border-slate-100 rounded-lg px-2.5 py-1 text-xs text-slate-700 inline-flex items-center max-w-full flex-wrap gap-1 mb-1">
                            <Editable path={['skills', cat.id, 'skillName', sIdx.toString()]} text={skill.name} className="px-0 py-0 text-slate-700 leading-snug break-words" />
                            <span className="inline-flex text-amber-500 transform scale-75 align-middle leading-none shrink-0">
                              {'★'.repeat(skill.level)}{'☆'.repeat(5 - skill.level)}
                            </span>
                          </span>
                        );
                      }

                      return (
                        <div key={sIdx} className="text-slate-700 text-xs font-semibold flex items-center gap-1.5 py-0.5 max-w-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 inline-block"></span>
                          <span className="min-w-0 break-words">
                            <Editable path={['skills', cat.id, 'skillName', sIdx.toString()]} text={skill.name} className="px-0 py-0 text-slate-700 leading-normal" />
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">({skill.level}/5)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'custom':
        if (customSections.length === 0) return null;
        const filteredCustomSections = customSections.filter(sec => {
          if (!sec.title || !sec.content) return false;
          // In double-column templates (split sidebar, modern geometric), skills/technologies/languages go to the left.
          // If custom sections contain these topics, filter them to avoid duplication.
          const isDoubleColumn = ['split-sidebar', 'modern-geometric'].includes(styles.template);
          if (isDoubleColumn) {
            const titleLower = sec.title.toLowerCase();
            const isSkillOrLanguageType = 
              titleLower.includes('beceri') || 
              titleLower.includes('yetenek') || 
              titleLower.includes('yetkinlik') || 
              titleLower.includes('skill') || 
              titleLower.includes('dil') || 
              titleLower.includes('araç') || 
              titleLower.includes('teknoloji');
            if (isSkillOrLanguageType) return false;
          }
          return true;
        });

        if (filteredCustomSections.length === 0) return null;

        return (
          <div key="custom" className="space-y-4">
            {filteredCustomSections.map((sec) => {
              return (
                <div key={sec.id} className={getBlockCardClass(`custom-${sec.id}`)}>
                  {sec.title && renderSectionHeader(sec.title)}
                  <div className={`text-slate-600 leading-relaxed ${textXsClass} whitespace-pre-line mt-1`}>
                    <Editable path={['customSections', sec.id, 'content']} text={sec.content} multiline={true} />
                  </div>
                </div>
              );
            })}
          </div>
        );

      default:
        return null;
    }
  };

  const is3DStyle = {
    transition: 'all 0.5s ease-in-out',
  };

  return (
    <div 
      ref={wrapperRef}
      className={`relative w-full max-w-[210mm] mx-auto pt-12 md:pt-14 print:pt-0 ${mobileFit ? 'overflow-x-hidden' : 'overflow-x-auto custom-scrollbar'}`}
    >
      {/* Dynamic Overlay A4 Page Break Guide */}
      {styles.pageGuide && (
        <div className="absolute left-0 right-0 top-[297mm] h-[2px] pointer-events-none border-t border-dashed border-rose-400 flex items-center justify-end z-55 mr-4 select-none no-print">
          <span className="bg-rose-500 text-white text-[9px] font-bold py-0.5 px-2 rounded-full uppercase tracking-wider relative -top-3 shadow shadow-rose-400">
            A4 Sayfa Sınırı (Sayfa 1 Bitişi)
          </span>
        </div>
      )}

      {/* Interactive Zoom Control Panel (Positioned completely outside the A4 preview frame in the top gutter margin) */}
      <div className="absolute top-1.5 md:top-2 right-4 md:right-0 z-50 flex items-center gap-1.5 bg-[#16191E]/90 backdrop-blur-md border border-[#2D3139]/80 rounded-full p-1 shadow-2xl select-none no-print">
        {/* Canlı Düzenleme Indicator (Pulsing Dot Only) */}
        <div className="flex items-center justify-center p-1.5 bg-teal-500/10 border border-teal-500/20 rounded-full mr-1 select-none" title="Canlı Düzenleme Aktif">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-450 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400"></span>
          </span>
        </div>

        {onUndo && (
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded-full hover:bg-white/10 text-teal-400 hover:text-teal-300 disabled:text-gray-600 disabled:opacity-30 transition disabled:hover:bg-transparent cursor-pointer flex items-center justify-center relative group"
            title="Son Değişikliği Geri Al (Undo) ↩️"
          >
            <Undo className="w-3.5 h-3.5" />
            {canUndo && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-teal-450 animate-pulse shadow-[0_0_6px_rgba(20,184,166,0.8)]" />
            )}
          </button>
        )}

        {onUndo && <span className="w-px h-3.5 bg-[#2D3139] mx-1" />}

        <button
          onClick={handleZoomOut}
          disabled={zoomScale <= 0.6}
          className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
          title="Uzaklaştır (%60 min)"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleZoomReset}
          className="px-2 py-0.5 text-[10px] font-extrabold text-[#E0E2E6] hover:text-teal-400 bg-[#2D3139]/50 rounded-full hover:bg-[#2D3139] transition cursor-pointer font-mono"
          title="Varsayılana Sıfırla (%100)"
        >
          {Math.round(zoomScale * 100)}%
        </button>
        <button
          onClick={handleZoomIn}
          disabled={zoomScale >= 1.5}
          className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
          title="Yakınlaştır (%150 maks)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        {containerWidth < 794 && (
          <button
            onClick={() => setMobileFit(prev => !prev)}
            className="ml-1 px-2.5 py-1 text-[10px] font-bold text-teal-300 hover:text-white bg-teal-950/40 border border-teal-500/30 rounded-full hover:bg-teal-900/50 transition cursor-pointer flex items-center gap-1"
            title={mobileFit ? "Gerçek boyuta geç (Yatay kaydırma)" : "Ekrana sığdır"}
          >
            {mobileFit ? (
              <>
                <Maximize2 className="w-3 h-3 text-teal-400" /> Tam Boyut
              </>
            ) : (
              <>
                <Minimize2 className="w-3 h-3 text-teal-400" /> Ekrana Sığdır
              </>
            )}
          </button>
        )}
      </div>

      {/* Zoomable Container Wrapper */}
      <div 
        id="cv-zoom-wrapper"
        className="relative origin-top py-2 print:transform-none print:m-0 print:p-0 print:w-full mx-auto"
        style={{
          width: '794px',
          transform: `scale(${renderedScale})`,
          transformOrigin: 'top center',
          transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
          height: `${scaledHeight}px`,
        }}
      >
        {/* Actual A4 Page */}
        <div
          id="cv-preview-page"
          ref={containerRef}
          style={{ 
            ...bgStyles, 
            ...is3DStyle,
            width: '794px',
            minWidth: '794px',
            maxWidth: '794px',
          }}
          className={`min-h-[297mm] origin-center flex flex-col justify-between align-stretch text-slate-800 ${fontClass} ${fontSizeClass} ${lineHeightClass} ${styles.shadowIntensity !== 'none' ? 'shadow-xl' : 'border border-slate-200 shadow-sm'} ${actualPaddingClass} tracking-normal print:shadow-none print:border-none print:w-[210mm] print:min-w-[210mm] print:max-w-[210mm] relative overflow-hidden`}
        >
        {styles.template === 'depth3d' && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0 opacity-50 no-print">
            <div className="absolute -top-12 -left-12 w-64 h-64 rounded-full bg-violet-400/20 blur-[80px]" />
            <div className="absolute top-1/2 right-0 w-80 h-80 rounded-full bg-indigo-350/20 blur-[80px]" />
            <div className="absolute -bottom-20 left-10 w-72 h-72 rounded-full bg-teal-300/20 blur-[80px]" />
          </div>
        )}
        {styles.template === 'split-sidebar' ? (
          // Split Sidebar Layout (Image 2 style)
          <div className="flex-1 flex min-h-[297mm] h-full items-stretch overflow-hidden">
            {/* Left Sidebar (Solid cobalt or customized theme color background with custom curved wave) */}
            <div className={`w-[34%] text-white ${sidebarPadding} flex flex-col select-text shrink-0 rounded-br-[45px] shadow-inner pb-12 border-r border-white/10`} style={{ backgroundColor: styles.primaryColor }}>
              {/* Photo component */}
              {personalInfo.photoVisible && personalInfo.avatarUrl ? (
                <div className="flex justify-center mb-2.5">
                  <img
                    src={personalInfo.avatarUrl}
                    alt={personalInfo.name}
                    className={`rounded-full object-cover border-[5px] border-white/20 hover:border-white/40 shadow-xl transition-all duration-350 hover:scale-105 ${styles.density === 'compact' ? 'w-20 h-20' : 'w-32 h-32'}`}
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                  />
                </div>
              ) : (
                <div className={styles.density === 'compact' ? 'h-4' : 'h-10'} />
              )}

              {/* Sidebar Contact details section */}
              <div className={styles.density === 'compact' ? 'space-y-2' : 'space-y-4'}>
                {renderSidebarSectionHeader('KİŞİSEL / İLETİŞİM')}
                <div className={`${styles.density === 'compact' ? 'space-y-1.5' : 'space-y-3'} text-[11px] text-white/90`}>
                  {personalInfo.phone && (
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase text-white/40 font-bold">Telefon</span>
                      <Editable path={['personalInfo', 'phone']} text={personalInfo.phone} className="font-medium" />
                    </div>
                  )}
                  {personalInfo.email && (
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase text-white/40 font-bold">E-Posta</span>
                      <Editable path={['personalInfo', 'email']} text={personalInfo.email} className="font-medium break-all" />
                    </div>
                  )}
                  {personalInfo.location && (
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase text-white/40 font-bold">Adres</span>
                      <Editable path={['personalInfo', 'location']} text={personalInfo.location} className="font-medium" />
                    </div>
                  )}
                  {personalInfo.birthDate && (
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase text-white/40 font-bold">Doğum Tarihi</span>
                      <Editable path={['personalInfo', 'birthDate']} text={personalInfo.birthDate} className="font-medium" />
                    </div>
                  )}
                  {personalInfo.birthPlace && (
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase text-white/40 font-bold">Doğum Yeri</span>
                      <Editable path={['personalInfo', 'birthPlace']} text={personalInfo.birthPlace} className="font-medium" />
                    </div>
                  )}
                  {personalInfo.maritalStatus && (
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase text-white/40 font-bold">Medeni Durum</span>
                      <Editable path={['personalInfo', 'maritalStatus']} text={personalInfo.maritalStatus} className="font-medium" />
                    </div>
                  )}
                  {personalInfo.driverLicense && (
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase text-white/40 font-bold">Ehliyet</span>
                      <Editable path={['personalInfo', 'driverLicense']} text={personalInfo.driverLicense} className="font-medium" />
                    </div>
                  )}
                  {personalInfo.website && (
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase text-white/40 font-bold">Web / Portfolyo</span>
                      <span className="underline font-medium hover:text-white break-all">
                        <Editable path={['personalInfo', 'website']} text={personalInfo.website} />
                      </span>
                    </div>
                  )}
                  {socialLinks && socialLinks.length > 0 && (
                    <div className="flex flex-col pt-1">
                      <span className="text-[9px] uppercase text-white/40 font-bold">Sosyal Medya / Bağlantılar</span>
                      <div className="space-y-0.5 mt-0.5">
                        {socialLinks.map((link) => (
                          <div key={link.id} className="flex items-center gap-1 text-[10px] text-white/90">
                            <span className="text-white/60 font-semibold text-[9px] uppercase">{link.platform}:</span>
                            <span className="underline hover:text-white break-all">{link.url}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Strict Sidebar QR placement: fixed directly after contact info so it never gets clipped */}
              {isSidebarQR && (
                <div className={`${styles.density === 'compact' ? 'my-2 p-2' : 'my-3.5 p-2.5'} bg-white/10 rounded-xl border border-white/20 flex flex-col items-center gap-1.5 shadow-sm shrink-0`}>
                  <span className="text-[9px] text-white/90 text-center uppercase tracking-wider font-bold">Dijital Portfolyo</span>
                  <div className="bg-white p-1 rounded-lg shadow-sm">
                    <QRCodeGen value={styles.qrCodeUrl} size={styles.density === 'compact' ? 52 : 64} fgColor="#000000" />
                  </div>
                </div>
              )}

              {/* Sidebar Skills category ratings */}
              {skills.length > 0 && (
                <div className={styles.density === 'compact' ? 'space-y-2' : 'space-y-4'}>
                  {renderSidebarSectionHeader('YETKİNLİKLER VE BECERİLER')}
                  <div className={styles.density === 'compact' ? 'space-y-2' : 'space-y-3.5'}>
                    {skills.map((cat) => (
                      <div key={cat.id} className="space-y-0.5">
                        {shouldShowCategoryHeader(cat.categoryName) && (
                          <span className="text-[9px] font-bold tracking-wider text-white/60 block uppercase">
                            <Editable path={['skills', cat.id, 'categoryName']} text={cat.categoryName} />
                          </span>
                        )}
                        <div className={`${styles.density === 'compact' ? 'space-y-0.5 p-1' : 'space-y-1 p-1.5'} bg-white/5 rounded border border-white/5`}>
                          {cat.skills.map((sk, sIdx) => {
                            const percent = (sk.level / 5) * 100;
                            return (
                              <div key={sIdx} className="space-y-0.5">
                                <div className="flex justify-between items-start gap-1.5 text-[10px] text-white">
                                  <div className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">
                                    <Editable path={['skills', cat.id, 'skillName', sIdx.toString()]} text={sk.name} />
                                  </div>
                                  <span className="text-white/50 text-[9px] shrink-0 font-mono">({sk.level}/5)</span>
                                </div>
                                <div className="w-full bg-white/20 h-1 overflow-hidden rounded-full">
                                  <div className="bg-white h-full rounded-full" style={{ width: `${percent}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Main Panel (Pure White structured content block) */}
            <div className={`w-[66%] bg-white ${rightPanelPaddingClass} flex flex-col justify-between select-text overflow-hidden`}>
              <div className={styles.density === 'compact' ? 'space-y-3' : 'space-y-6'}>
                
                {/* Image 2 style name header layout */}
                <div className={`border-b ${styles.density === 'compact' ? 'pb-1.5' : 'pb-4'} flex justify-between items-start gap-4`} style={{ borderColor: `${styles.primaryColor}20` }}>
                  <div>
                    <h1 className={`${styles.density === 'compact' ? 'text-xl md:text-2xl' : 'text-3xl'} font-black tracking-tight text-slate-850`}>
                      <Editable path={['personalInfo', 'name']} text={personalInfo.name} />
                    </h1>
                    <p className={`text-xs uppercase font-extrabold tracking-widest ${styles.density === 'compact' ? 'mt-0.5' : 'mt-1.5'}`} style={{ color: styles.primaryColor }}>
                      <Editable path={['personalInfo', 'title']} text={personalInfo.title} />
                    </p>
                  </div>
                  {isHeaderQR && (
                    <div className="shrink-0">
                      <QRCodeGen value={styles.qrCodeUrl} size={55} fgColor={styles.primaryColor} />
                    </div>
                  )}
                </div>

                {/* Right columns lists */}
                <div className={`flex flex-col ${rightPanelSectionsGapClass} select-text`}>
                  {sectionOrder
                    .filter((x) => x !== 'personal' && x !== 'skills')
                    .map((sectionId) => renderSection(sectionId))}
                </div>

                {/* Footer QR when selected */}
                {isFooterQR && (
                  <div className="border-t pt-3 mt-4 flex justify-between items-center bg-transparent">
                    <span className="text-[10px] text-slate-400 select-none">
                      Portfolyo / LinkedIn detayları için QR kodu taratabilirsiniz.
                    </span>
                    <div className="flex-shrink-0">
                      <QRCodeGen value={styles.qrCodeUrl} size={55} fgColor={styles.primaryColor} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : styles.template === 'modern-geometric' ? (
          // Modern Geometric Layout (Image 1 style with elegant shapes)
          <div className="flex-1 flex min-h-[297mm] h-full items-stretch overflow-hidden">
            {/* Left Column (Geometric deep panel with amber borders) */}
            <div className={`w-[34%] text-[#e2e8f0] ${sidebarPadding} flex flex-col relative select-text shrink-0`} style={{ backgroundColor: styles.primaryColor }}>
              
              {/* Hexagonal avatar framework (SVG clipping to work with html2canvas and standard view) */}
              {personalInfo.photoVisible && personalInfo.avatarUrl ? (
                <div className="flex justify-center mb-2">
                  <div className={`relative transition-all duration-300 select-none ${styles.density === 'compact' ? 'w-24 h-24' : 'w-34 h-34'}`}>
                    <svg viewBox="0 0 100 100" className="w-full h-full select-none pointer-events-none drop-shadow-md">
                      <defs>
                        <clipPath id="avatar-hex-clip-pdf">
                          <polygon points="50,0 93.3,25 93.3,75 50,100 6.7,75 6.7,25" />
                        </clipPath>
                      </defs>
                      {/* Outer orange frame */}
                      <polygon points="50,0 93.3,25 93.3,75 50,100 6.7,75 6.7,25" fill="#f59e0b" />
                      {/* Inner clipped image with uniform border */}
                      <g transform="translate(50, 50) scale(0.92) translate(-50, -50)">
                        <image
                          href={personalInfo.avatarUrl}
                          width="100"
                          height="100"
                          clipPath="url(#avatar-hex-clip-pdf)"
                          preserveAspectRatio="xMidYMid slice"
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                        />
                      </g>
                    </svg>
                  </div>
                </div>
              ) : (
                <div className={styles.density === 'compact' ? 'h-2' : 'h-4'} />
              )}

              {/* PROFILE summary on left sidebar */}
              {personalInfo.summary && (
                <div className={styles.density === 'compact' ? 'space-y-1' : 'space-y-2'}>
                  <div className="bg-[#1e293b]/80 py-1.5 px-3 border-l-4 border-amber-550 shadow-inner">
                    <h4 className="font-extrabold text-[10px] tracking-wider uppercase text-amber-500" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>PROFİL</h4>
                  </div>
                  <div className="text-[11px] leading-relaxed text-left text-slate-300">
                    <Editable path={['personalInfo', 'summary']} text={personalInfo.summary} multiline={true} />
                  </div>
                </div>
              )}

              {/* CONTACT info block details */}
              <div className={styles.density === 'compact' ? 'space-y-1' : 'space-y-2'}>
                <div className="bg-[#1e293b]/80 py-1.5 px-3 border-l-4 border-amber-550 shadow-inner">
                  <h4 className="font-extrabold text-[10px] tracking-wider uppercase text-amber-500" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>İLETİŞİM</h4>
                </div>
                <div className={`${styles.density === 'compact' ? 'space-y-1.5' : 'space-y-2.5'} text-[10px] text-slate-300`}>
                  {personalInfo.phone && (
                    <div>
                      <p className="font-bold text-slate-400 text-[9px] uppercase">Telefon</p>
                      <Editable path={['personalInfo', 'phone']} text={personalInfo.phone} className="font-medium text-white" />
                    </div>
                  )}
                  {personalInfo.email && (
                    <div>
                      <p className="font-bold text-slate-400 text-[9px] uppercase">E-posta</p>
                      <Editable path={['personalInfo', 'email']} text={personalInfo.email} className="font-medium text-white break-all select-all" />
                    </div>
                  )}
                  {personalInfo.location && (
                    <div>
                      <p className="font-bold text-slate-400 text-[9px] uppercase">Adres / Konum</p>
                      <Editable path={['personalInfo', 'location']} text={personalInfo.location} className="font-medium text-white" />
                    </div>
                  )}
                  {personalInfo.birthDate && (
                    <div>
                      <p className="font-bold text-slate-400 text-[9px] uppercase">Doğum Tarihi</p>
                      <Editable path={['personalInfo', 'birthDate']} text={personalInfo.birthDate} className="font-medium text-white" />
                    </div>
                  )}
                  {personalInfo.birthPlace && (
                    <div>
                      <p className="font-bold text-slate-400 text-[9px] uppercase">Doğum Yeri</p>
                      <Editable path={['personalInfo', 'birthPlace']} text={personalInfo.birthPlace} className="font-medium text-white" />
                    </div>
                  )}
                  {personalInfo.maritalStatus && (
                    <div>
                      <p className="font-bold text-slate-400 text-[9px] uppercase">Medeni Durum</p>
                      <Editable path={['personalInfo', 'maritalStatus']} text={personalInfo.maritalStatus} className="font-medium text-white" />
                    </div>
                  )}
                  {personalInfo.driverLicense && (
                    <div>
                      <p className="font-bold text-slate-400 text-[9px] uppercase">Ehliyet</p>
                      <Editable path={['personalInfo', 'driverLicense']} text={personalInfo.driverLicense} className="font-medium text-white" />
                    </div>
                  )}
                  {personalInfo.website && (
                    <div>
                      <p className="font-bold text-slate-400 text-[9px] uppercase">Websitesi</p>
                      <span className="underline text-amber-400 font-medium">
                        <Editable path={['personalInfo', 'website']} text={personalInfo.website} />
                      </span>
                    </div>
                  )}
                  {socialLinks && socialLinks.length > 0 && (
                    <div className="pt-1">
                      <p className="font-bold text-slate-400 text-[9px] uppercase">Sosyal Medya / Bağlantılar</p>
                      <div className="space-y-0.5 mt-0.5">
                        {socialLinks.map((link) => (
                          <div key={link.id} className="flex items-center gap-1 text-[9.5px]">
                            <span className="text-amber-400 font-semibold uppercase">{link.platform}:</span>
                            <span className="underline text-slate-200 break-all">{link.url}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Strict Sidebar QR placement: fixed directly after contact info */}
              {isSidebarQR && (
                <div className={`${styles.density === 'compact' ? 'my-2 p-2' : 'my-3 p-2.5'} bg-[#1e293b]/90 border-l-4 border-amber-500 rounded shadow-md flex flex-col items-center gap-1.5 shrink-0`}>
                  <span className="text-[9px] uppercase text-amber-400 font-bold tracking-widest">DİJİTAL PORTFOLYO</span>
                  <div className="bg-white p-1 rounded shadow">
                    <QRCodeGen value={styles.qrCodeUrl} size={styles.density === 'compact' ? 50 : 60} fgColor="#1b2a47" />
                  </div>
                </div>
              )}

              {/* Custom dynamic flag or tags inside the sidebar for Image 1 feel */}
              {skills.length > 0 && (
                <div className={styles.density === 'compact' ? 'space-y-2' : 'space-y-3'}>
                  <div className="bg-[#1e293b]/85 py-1.5 px-3 border-l-4 border-amber-550 shadow-inner">
                    <h4 className="font-extrabold text-[10px] tracking-wider uppercase text-amber-500" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>YETKİNLİKLER VE BECERİLER</h4>
                  </div>
                  <div className="space-y-2">
                    {skills.map((cat) => (
                      <div key={cat.id} className="space-y-1" id={`sidebar-skill-cat-${cat.id}`}>
                        {shouldShowCategoryHeader(cat.categoryName) && (
                          <span className="text-[8px] font-extrabold tracking-widest text-[#94a3b8] uppercase select-none block mb-0.5">
                            <Editable path={['skills', cat.id, 'categoryName']} text={cat.categoryName} />
                          </span>
                        )}
                        <div className="space-y-1.5 pt-0.5">
                          {cat.skills.map((sk, sIdx) => (
                            <div key={sIdx} className="text-slate-200 text-[10.5px] font-semibold flex items-start gap-2 max-w-full" id={`sidebar-skill-item-${cat.id}-${sIdx}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 inline-block mt-1"></span>
                              <div className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">
                                <Editable path={['skills', cat.id, 'skillName', sIdx.toString()]} text={sk.name} className="px-0 py-0 bg-transparent text-slate-200 leading-normal" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column Layout */}
            <div className={`w-[66%] bg-white ${rightPanelPaddingClass} flex flex-col justify-between select-text overflow-hidden`}>
              <div className={styles.density === 'compact' ? 'space-y-3' : 'space-y-6'}>
                
                {/* Image 1 Header: Large Slanted / Ribbon polygon banner */}
                <div className={`relative ${styles.density === 'compact' ? 'mb-3' : 'mb-6'} flex justify-between items-center gap-3`}>
                  <div className={`flex-1 ${styles.density === 'compact' ? 'py-2.5 px-4' : 'py-4 px-6'} bg-[#1b2a47] border-l-8 border-amber-550 relative flex flex-col justify-center shadow-md text-white select-text shrink-0`} 
                       style={{ clipPath: 'polygon(0% 0%, 93% 0%, 100% 50%, 93% 100%, 0% 100%)' }}>
                    <h1 className={`${styles.density === 'compact' ? 'text-xl' : 'text-2xl'} font-black uppercase tracking-widest leading-none select-text`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      <Editable path={['personalInfo', 'name']} text={personalInfo.name} />
                    </h1>
                    <p className="text-[11px] uppercase font-bold text-amber-400 mt-2 tracking-widest select-text">
                      <Editable path={['personalInfo', 'title']} text={personalInfo.title} />
                    </p>
                  </div>
                  {isHeaderQR && (
                    <div className="shrink-0 pr-1">
                      <QRCodeGen value={styles.qrCodeUrl} size={55} fgColor="#1b2a47" />
                    </div>
                  )}
                </div>

                {/* Right column sections (excluding personal info, summary and skills, since they are rendered in left sidebar) */}
                <div className={`flex flex-col ${rightPanelSectionsGapClass} select-text`}>
                  {sectionOrder
                    .filter((x) => x !== 'personal' && x !== 'summary' && x !== 'skills')
                    .map((sectionId) => renderSection(sectionId))}
                </div>

                {/* Footer QR when selected */}
                {isFooterQR && (
                  <div className="border-t pt-3 mt-4 flex justify-between items-center bg-transparent">
                    <span className="text-[10px] text-slate-400 select-none">
                      Portfolyo / LinkedIn detayları için QR kodu taratabilirsiniz.
                    </span>
                    <div className="flex-shrink-0">
                      <QRCodeGen value={styles.qrCodeUrl} size={55} fgColor={styles.primaryColor} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : styles.template === 'crimson-split' ? (
          // Crimson & Serif Classic Layout (Image 1 style)
          <div className="flex-1 flex min-h-[297mm] h-full items-stretch overflow-hidden">
            {/* Left Sidebar (Solid crimson/rose red) */}
            <div className={`w-[34%] text-white ${sidebarPadding} flex flex-col select-text shrink-0 pb-12 border-r border-white/10`} style={{ backgroundColor: styles.primaryColor }}>
              {/* Photo component */}
              {personalInfo.photoVisible && personalInfo.avatarUrl ? (
                <div className="flex justify-center mb-5 mt-2">
                  <img
                    src={personalInfo.avatarUrl}
                    alt={personalInfo.name}
                    className={`rounded-full object-cover border-[6px] border-white/10 hover:border-white/20 shadow-xl transition-all duration-350 hover:scale-105 ${styles.density === 'compact' ? 'w-28 h-28' : 'w-36 h-36'}`}
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                  />
                </div>
              ) : (
                <div className={styles.density === 'compact' ? 'h-4' : 'h-10'} />
              )}

              {/* Name and subtitle in sidebar */}
              <div className="text-center mb-6 px-2">
                <h2 className="font-serif italic font-bold tracking-wide text-lg md:text-xl text-white">
                  <Editable path={['personalInfo', 'name']} text={personalInfo.name} />
                </h2>
                <p className="text-[10px] uppercase tracking-widest text-white/70 mt-1 font-sans">
                  <Editable path={['personalInfo', 'title']} text={personalInfo.title} />
                </p>
                <div className="w-12 h-[1px] bg-white/20 mx-auto mt-4" />
              </div>

              {/* Contact details section */}
              <div className={styles.density === 'compact' ? 'space-y-2' : 'space-y-4'}>
                <div className="border-b pb-1 mb-2.5 mt-0.5 flex items-center justify-center gap-1.5" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
                  <h4 className="font-serif italic font-bold tracking-wider text-[11px] text-white">
                    İletişim Bilgileri
                  </h4>
                </div>
                <div className={`${styles.density === 'compact' ? 'space-y-1.5' : 'space-y-3'} text-[10px] text-center text-white/90 font-serif`}>
                  {personalInfo.phone && (
                    <div className="flex flex-col">
                      <span className="text-[8px] uppercase tracking-wider text-white/40 font-sans font-bold">Telefon</span>
                      <Editable path={['personalInfo', 'phone']} text={personalInfo.phone} className="font-medium" />
                    </div>
                  )}
                  {personalInfo.email && (
                    <div className="flex flex-col">
                      <span className="text-[8px] uppercase tracking-wider text-white/40 font-sans font-bold">E-posta</span>
                      <Editable path={['personalInfo', 'email']} text={personalInfo.email} className="font-medium break-all" />
                    </div>
                  )}
                  {personalInfo.location && (
                    <div className="flex flex-col">
                      <span className="text-[8px] uppercase tracking-wider text-white/40 font-sans font-bold">Adres / Konum</span>
                      <Editable path={['personalInfo', 'location']} text={personalInfo.location} className="font-medium" />
                    </div>
                  )}
                  {personalInfo.birthDate && (
                    <div className="flex flex-col">
                      <span className="text-[8px] uppercase tracking-wider text-white/40 font-sans font-bold">Doğum Tarihi</span>
                      <Editable path={['personalInfo', 'birthDate']} text={personalInfo.birthDate} className="font-medium" />
                    </div>
                  )}
                  {personalInfo.birthPlace && (
                    <div className="flex flex-col">
                      <span className="text-[8px] uppercase tracking-wider text-white/40 font-sans font-bold">Doğum Yeri</span>
                      <Editable path={['personalInfo', 'birthPlace']} text={personalInfo.birthPlace} className="font-medium" />
                    </div>
                  )}
                  {personalInfo.maritalStatus && (
                    <div className="flex flex-col">
                      <span className="text-[8px] uppercase tracking-wider text-white/40 font-sans font-bold">Medeni Durum</span>
                      <Editable path={['personalInfo', 'maritalStatus']} text={personalInfo.maritalStatus} className="font-medium" />
                    </div>
                  )}
                  {personalInfo.driverLicense && (
                    <div className="flex flex-col">
                      <span className="text-[8px] uppercase tracking-wider text-white/40 font-sans font-bold">Ehliyet</span>
                      <Editable path={['personalInfo', 'driverLicense']} text={personalInfo.driverLicense} className="font-medium" />
                    </div>
                  )}
                  {personalInfo.website && (
                    <div className="flex flex-col">
                      <span className="text-[8px] uppercase tracking-wider text-white/40 font-sans font-bold">Websitesi</span>
                      <span className="underline font-medium break-all max-w-full">
                        <Editable path={['personalInfo', 'website']} text={personalInfo.website} />
                      </span>
                    </div>
                  )}
                  {socialLinks && socialLinks.length > 0 && (
                    <div className="flex flex-col pt-1">
                      <span className="text-[8px] uppercase tracking-wider text-white/40 font-sans font-bold">Sosyal Medya / Bağlantılar</span>
                      <div className="space-y-0.5 mt-0.5">
                        {socialLinks.map((link) => (
                          <div key={link.id} className="flex items-center justify-center gap-1 text-[9.5px]">
                            <span className="text-white/60 font-semibold uppercase">{link.platform}:</span>
                            <span className="underline text-white/90 break-all">{link.url}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Strict Sidebar QR placement: fixed directly after contact info */}
              {isSidebarQR && (
                <div className={`${styles.density === 'compact' ? 'my-2 p-1.5' : 'my-3 p-2.5'} bg-white/10 rounded-lg border border-white/20 flex flex-col items-center gap-1 shadow-sm shrink-0`}>
                  <span className="text-[8.5px] uppercase font-sans font-bold text-white/80 tracking-wider">DİJİTAL PORTFOLYO</span>
                  <div className="bg-white p-1 rounded shadow-sm">
                    <QRCodeGen value={styles.qrCodeUrl} size={styles.density === 'compact' ? 48 : 58} fgColor={styles.primaryColor} />
                  </div>
                </div>
              )}

              {/* Skills as classical bullet points in sidebar */}
              {skills.length > 0 && (
                <div className={`mt-5 ${styles.density === 'compact' ? 'space-y-2' : 'space-y-4'}`}>
                  <div className="border-b pb-1 mb-2.5 mt-0.5 flex items-center justify-center gap-1.5" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
                    <h4 className="font-serif italic font-bold tracking-wider text-[11px] text-white">
                      Temel Beceriler
                    </h4>
                  </div>
                  <div className="space-y-2 text-left pl-2">
                    {skills.map((cat) => (
                      <div key={cat.id} className="space-y-1">
                        {cat.skills.map((sk, sIdx) => (
                          <div key={sIdx} className="text-white/90 text-[10.5px] font-serif leading-snug flex items-start gap-1.5 max-w-full">
                            <span className="text-white/60 select-none shrink-0">•</span>
                            <div className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">
                              <Editable path={['skills', cat.id, 'skillName', sIdx.toString()]} text={sk.name} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column Layout */}
            <div className={`w-[66%] bg-white ${rightPanelPaddingClass} flex flex-col justify-between select-text overflow-hidden`}>
              <div className={styles.density === 'compact' ? 'space-y-3' : 'space-y-6'}>
                {/* Header QR if selected */}
                {isHeaderQR && (
                  <div className="flex justify-end pb-2 mb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] uppercase font-bold text-slate-400 font-sans">Portfolyo QR</span>
                      <QRCodeGen value={styles.qrCodeUrl} size={50} fgColor={styles.primaryColor} />
                    </div>
                  </div>
                )}

                {/* Playfair / Serif heading right column */}
                {personalInfo.summary && (
                  <div className="mb-5">
                    <div className="text-center mb-3">
                      <h3 className="font-serif italic font-extrabold tracking-wide text-sm md:text-base" style={{ color: styles.primaryColor }}>
                        Profesyonel Özet
                      </h3>
                      <div className="w-16 h-[1.5px] bg-slate-300 mx-auto mt-1.5 opacity-60" />
                    </div>
                    <div className="text-slate-700 leading-relaxed text-left text-xs whitespace-pre-wrap font-serif">
                      <Editable path={['personalInfo', 'summary']} text={personalInfo.summary} multiline={true} />
                    </div>
                  </div>
                )}

                {/* Right columns lists */}
                <div className={`flex flex-col ${rightPanelSectionsGapClass} select-text font-serif`}>
                  {sectionOrder
                    .filter((x) => x !== 'personal' && x !== 'summary' && x !== 'skills')
                    .map((sectionId) => renderSection(sectionId))}
                </div>

                {/* Footer QR when selected */}
                {isFooterQR && (
                  <div className="border-t pt-3 mt-4 flex justify-between items-center bg-transparent font-sans">
                    <span className="text-[10px] text-slate-400 select-none">
                      Portfolyo / LinkedIn detayları için QR kodu taratabilirsiniz.
                    </span>
                    <div className="flex-shrink-0">
                      <QRCodeGen value={styles.qrCodeUrl} size={55} fgColor={styles.primaryColor} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : styles.template === 'teal-timeline' ? (
          // Teal Timeline Layout (Image 2 style with diagonal accent graphics)
          <div className="flex-1 flex min-h-[297mm] h-full items-stretch overflow-hidden">
            {/* Left Sidebar */}
            <div className={`w-[34%] text-white ${sidebarPadding} flex flex-col select-text shrink-0 relative pb-12 border-r border-[#004D4C]/10 overflow-hidden`} style={{ backgroundColor: styles.primaryColor }}>
              
              {/* Slanted graphics matching Natalie Edwards image */}
              <div className="absolute top-0 right-0 left-0 h-44 bg-slate-100 pointer-events-none opacity-10 transform -skew-y-12 origin-top-left -mt-16 z-0" />
              <div className="absolute top-0 right-0 left-0 h-10 bg-amber-400 pointer-events-none opacity-20 transform -skew-y-12 origin-top-left mt-8 z-0" />

              {/* Photo component circular overlap */}
              {personalInfo.photoVisible && personalInfo.avatarUrl ? (
                <div className="flex justify-center mb-6 relative z-10">
                  <div className="relative">
                    {/* Double circles representing dark bands near profile photo */}
                    <div className="absolute -inset-1.5 rounded-full border border-white/20 animate-pulse" />
                    <img
                      src={personalInfo.avatarUrl}
                      alt={personalInfo.name}
                      className={`rounded-full object-cover border-[4px] border-white shadow-lg relative z-10 ${styles.density === 'compact' ? 'w-22 h-22' : 'w-30 h-30'}`}
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                    />
                  </div>
                </div>
              ) : (
                <div className="h-10" />
              )}

              {/* Sidebar Section: CONTACT */}
              <div className="space-y-3 relative z-10">
                <div className="border-b pb-1 mb-2.5 flex items-center gap-1.5 border-white/20">
                  <h4 className="font-bold tracking-widest uppercase text-[10px]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    İLETİŞİM
                  </h4>
                </div>
                <div className="space-y-3 text-[10.5px] text-white/95">
                  {personalInfo.phone && (
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-bold text-amber-400 shrink-0 select-none">T:</span>
                      <Editable path={['personalInfo', 'phone']} text={personalInfo.phone} className="font-semibold" />
                    </div>
                  )}
                  {personalInfo.email && (
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-bold text-amber-400 shrink-0 select-none">@:</span>
                      <Editable path={['personalInfo', 'email']} text={personalInfo.email} className="font-semibold break-all" />
                    </div>
                  )}
                  {personalInfo.location && (
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-bold text-amber-400 shrink-0 select-none">A:</span>
                      <Editable path={['personalInfo', 'location']} text={personalInfo.location} className="font-semibold" />
                    </div>
                  )}
                  {personalInfo.birthDate && (
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-bold text-amber-400 shrink-0 select-none">D:</span>
                      <div className="flex flex-col">
                        <span className="text-[8px] uppercase text-white/40 font-bold">Doğum Tarihi</span>
                        <Editable path={['personalInfo', 'birthDate']} text={personalInfo.birthDate} className="font-semibold" />
                      </div>
                    </div>
                  )}
                  {personalInfo.birthPlace && (
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-bold text-amber-400 shrink-0 select-none">Y:</span>
                      <div className="flex flex-col">
                        <span className="text-[8px] uppercase text-white/40 font-bold">Doğum Yeri</span>
                        <Editable path={['personalInfo', 'birthPlace']} text={personalInfo.birthPlace} className="font-semibold" />
                      </div>
                    </div>
                  )}
                  {personalInfo.maritalStatus && (
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-bold text-amber-400 shrink-0 select-none">M:</span>
                      <div className="flex flex-col">
                        <span className="text-[8px] uppercase text-white/40 font-bold">Medeni Durum</span>
                        <Editable path={['personalInfo', 'maritalStatus']} text={personalInfo.maritalStatus} className="font-semibold" />
                      </div>
                    </div>
                  )}
                  {personalInfo.driverLicense && (
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-bold text-amber-400 shrink-0 select-none">E:</span>
                      <div className="flex flex-col">
                        <span className="text-[8px] uppercase text-white/40 font-bold">Ehliyet</span>
                        <Editable path={['personalInfo', 'driverLicense']} text={personalInfo.driverLicense} className="font-semibold" />
                      </div>
                    </div>
                  )}
                  {personalInfo.website && (
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-bold text-amber-400 shrink-0 select-none">W:</span>
                      <div className="flex flex-col">
                        <span className="text-[8px] uppercase text-white/40 font-bold">Websitesi</span>
                        <span className="underline font-semibold break-all text-amber-300">
                          <Editable path={['personalInfo', 'website']} text={personalInfo.website} />
                        </span>
                      </div>
                    </div>
                  )}
                  {socialLinks && socialLinks.length > 0 && (
                    <div className="flex items-start gap-2 pt-1 border-t border-white/10">
                      <span className="text-[10px] font-bold text-amber-400 shrink-0 select-none">S:</span>
                      <div className="flex flex-col space-y-0.5">
                        <span className="text-[8px] uppercase text-white/40 font-bold">Sosyal Medya</span>
                        {socialLinks.map((link) => (
                          <div key={link.id} className="text-[9.5px]">
                            <span className="font-semibold text-white/70">{link.platform}: </span>
                            <span className="underline break-all text-amber-300">{link.url}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Strict Sidebar QR placement: fixed directly after contact info */}
              {isSidebarQR && (
                <div className="my-3 p-2 bg-white/10 rounded border border-white/20 flex flex-col items-center gap-1 shadow-sm shrink-0 relative z-10">
                  <span className="text-[8.5px] uppercase font-bold text-amber-300 tracking-wider">DİJİTAL PORTFOLYO</span>
                  <div className="bg-white p-1 rounded-sm shadow-sm">
                    <QRCodeGen value={styles.qrCodeUrl} size={styles.density === 'compact' ? 48 : 58} fgColor="#004D4C" />
                  </div>
                </div>
              )}

              {/* Sidebar Section: SKILLS with rating circles! */}
              {skills.length > 0 && (
                <div className="mt-6 space-y-4 relative z-10">
                  <div className="border-b pb-1 mb-2.5 flex items-center gap-1.5 border-white/20">
                    <h4 className="font-bold tracking-widest uppercase text-[10px]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      BECERİLER
                    </h4>
                  </div>
                  <div className="space-y-3">
                    {skills.map((cat) => (
                      <div key={cat.id} className="space-y-2">
                        {shouldShowCategoryHeader(cat.categoryName) && (
                          <span className="text-[8px] font-extrabold tracking-widest text-white/50 uppercase block">
                            <Editable path={['skills', cat.id, 'categoryName']} text={cat.categoryName} />
                          </span>
                        )}
                        <div className="space-y-1.5">
                          {cat.skills.map((sk, sIdx) => {
                            // Map score out of 5 stars into circles
                            const levelScore = sk.level;
                            return (
                              <div key={sIdx} className="flex flex-col gap-0.5">
                                <div className="flex justify-between items-start gap-1.5 text-[10px] font-bold text-white">
                                  <div className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">
                                    <Editable path={['skills', cat.id, 'skillName', sIdx.toString()]} text={sk.name} />
                                  </div>
                                  <span className="text-white/40 text-[8.5px] shrink-0 font-mono">({levelScore}/5)</span>
                                </div>
                                <div className="flex gap-1 mt-0.5 select-none pointer-events-none">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <span 
                                      key={i} 
                                      className={`w-2 h-2 rounded-full border border-white/20 ${i < levelScore ? 'bg-amber-400 shadow-xs' : 'bg-white/10'}`} 
                                      />
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column Layout */}
            <div className={`w-[66%] bg-white ${rightPanelPaddingClass} flex flex-col justify-between select-text overflow-hidden`}>
              <div className={styles.density === 'compact' ? 'space-y-3' : 'space-y-6'}>
                
                {/* Natalie Edwards style Header info */}
                <div className="border-b pb-4 border-slate-100 mb-2 flex justify-between items-start gap-4">
                  <div>
                    <h1 className="text-3xl font-black uppercase tracking-wider text-slate-900 leading-none">
                      <Editable path={['personalInfo', 'name']} text={personalInfo.name} />
                    </h1>
                    <p className="text-xs uppercase font-extrabold tracking-widest text-[#005E5D] mt-2.5" style={{ color: styles.primaryColor }}>
                      <Editable path={['personalInfo', 'title']} text={personalInfo.title} />
                    </p>
                  </div>
                  {isHeaderQR && (
                    <div className="shrink-0">
                      <QRCodeGen value={styles.qrCodeUrl} size={55} fgColor={styles.primaryColor} />
                    </div>
                  )}
                </div>

                {/* About me summary */}
                {personalInfo.summary && (
                  <div>
                    {renderSectionHeader('Hakkımda')}
                    <div className="text-slate-600 leading-relaxed text-left text-xs whitespace-pre-wrap mt-2">
                      <Editable path={['personalInfo', 'summary']} text={personalInfo.summary} multiline={true} />
                    </div>
                  </div>
                )}

                {/* Right column sections (educations, experience, projects, custom) */}
                <div className="flex flex-col gap-5 select-text">
                  {sectionOrder
                    .filter((x) => x !== 'personal' && x !== 'summary' && x !== 'skills')
                    .map((sectionId) => renderSection(sectionId))}
                </div>

                {/* Footer QR when selected */}
                {isFooterQR && (
                  <div className="border-t pt-3 mt-4 flex justify-between items-center bg-transparent">
                    <span className="text-[10px] text-slate-400 select-none">
                      Portfolyo / LinkedIn detayları için QR kodu taratabilirsiniz.
                    </span>
                    <div className="flex-shrink-0">
                      <QRCodeGen value={styles.qrCodeUrl} size={55} fgColor={styles.primaryColor} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : styles.template === 'dark-gold-arch' ? (
          // Charcoal & Gold Arch Layout (Image 3 style)
          <div className="flex-1 flex min-h-[297mm] h-full items-stretch overflow-hidden">
            {/* Left Sidebar (Dark Charcoal with unique Arched Top Design) */}
            <div className={`w-[34%] text-[#e2e8f0] ${sidebarPadding} flex flex-col select-text shrink-0 relative pb-12 border-r border-[#1a1a1a] shadow-2xl`} style={{ backgroundColor: styles.primaryColor }}>
              
              {/* Arched Top visual container */}
              <div className="bg-[#242424] rounded-[35px] border border-amber-550/20 p-4 mt-2 mb-6 shadow-md relative overflow-hidden flex flex-col items-center">
                {/* Glowing arch shape */}
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600" />
                
                {/* Circular Profile Photo in Arch */}
                {personalInfo.photoVisible && personalInfo.avatarUrl ? (
                  <div className="relative mb-3">
                    <div className="absolute -inset-1 rounded-full bg-gradient-to-b from-amber-400 to-yellow-600 shadow-md p-[2px]">
                      <div className="bg-[#242424] w-full h-full rounded-full" />
                    </div>
                    <img
                      src={personalInfo.avatarUrl}
                      alt={personalInfo.name}
                      className={`rounded-full object-cover relative z-10 border-2 border-transparent ${styles.density === 'compact' ? 'w-22 h-22' : 'w-30 h-30'}`}
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                    />
                  </div>
                ) : (
                  <div className="h-6" />
                )}

                {/* Name & Title inside the arch */}
                <h2 className="font-extrabold text-sm md:text-base text-white uppercase text-center tracking-wider leading-snug w-full" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  <Editable path={['personalInfo', 'name']} text={personalInfo.name} />
                </h2>
                <p className="text-[10px] uppercase text-amber-400 font-black mt-1 tracking-widest text-center" style={{ color: styles.secondaryColor }}>
                  <Editable path={['personalInfo', 'title']} text={personalInfo.title} />
                </p>

                {/* Profile short summary if available inside sidebar */}
                {personalInfo.summary && (
                  <p className="text-[9px] text-[#a3a3a3] text-center leading-relaxed mt-2.5 line-clamp-4 border-t border-white/5 pt-2 w-full">
                    <Editable path={['personalInfo', 'summary']} text={personalInfo.summary} />
                  </p>
                )}
              </div>

              {/* Sidebar Section: CONTACT */}
              <div className="space-y-3">
                <div className="border-b pb-1 mb-2 mt-1 border-white/5">
                  <h4 className="font-black text-[10px] tracking-widest uppercase text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    İLETİŞİM
                  </h4>
                </div>
                <div className="space-y-2.5 text-[10px] text-slate-300">
                  {personalInfo.phone && (
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <Editable path={['personalInfo', 'phone']} text={personalInfo.phone} className="text-white font-medium" />
                    </div>
                  )}
                  {personalInfo.email && (
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <Editable path={['personalInfo', 'email']} text={personalInfo.email} className="text-white font-medium break-all" />
                    </div>
                  )}
                  {personalInfo.location && (
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <Editable path={['personalInfo', 'location']} text={personalInfo.location} className="text-white font-medium" />
                    </div>
                  )}
                  {personalInfo.birthDate && (
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-[8px] uppercase text-slate-400 font-bold">Doğum Tarihi</span>
                        <Editable path={['personalInfo', 'birthDate']} text={personalInfo.birthDate} className="text-white font-medium" />
                      </div>
                    </div>
                  )}
                  {personalInfo.birthPlace && (
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-[8px] uppercase text-slate-400 font-bold">Doğum Yeri</span>
                        <Editable path={['personalInfo', 'birthPlace']} text={personalInfo.birthPlace} className="text-white font-medium" />
                      </div>
                    </div>
                  )}
                  {personalInfo.maritalStatus && (
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-[8px] uppercase text-slate-400 font-bold">Medeni Durum</span>
                        <Editable path={['personalInfo', 'maritalStatus']} text={personalInfo.maritalStatus} className="text-white font-medium" />
                      </div>
                    </div>
                  )}
                  {personalInfo.driverLicense && (
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-[8px] uppercase text-slate-400 font-bold">Ehliyet</span>
                        <Editable path={['personalInfo', 'driverLicense']} text={personalInfo.driverLicense} className="text-white font-medium" />
                      </div>
                    </div>
                  )}
                  {personalInfo.website && (
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-[8px] uppercase text-slate-400 font-bold">Websitesi</span>
                        <span className="underline text-amber-400 font-medium break-all">
                          <Editable path={['personalInfo', 'website']} text={personalInfo.website} />
                        </span>
                      </div>
                    </div>
                  )}
                  {socialLinks && socialLinks.length > 0 && (
                    <div className="pt-1 border-t border-white/5 space-y-1">
                      <span className="text-[8px] uppercase text-slate-400 font-bold block">Sosyal Medya / Bağlantılar</span>
                      {socialLinks.map((link) => (
                        <div key={link.id} className="flex items-center gap-2 text-[9.5px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                          <span className="text-amber-400 font-semibold">{link.platform}:</span>
                          <span className="underline text-slate-300 break-all">{link.url}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Strict Sidebar QR placement: fixed directly after contact info */}
              {isSidebarQR && (
                <div className="my-3 p-2 bg-black/50 rounded-xl border border-amber-500/30 flex flex-col items-center gap-1.5 shadow-md shrink-0">
                  <span className="text-[8.5px] uppercase font-bold text-amber-400 tracking-wider">DİJİTAL PORTFOLYO</span>
                  <div className="bg-white p-1 rounded shadow-inner">
                    <QRCodeGen value={styles.qrCodeUrl} size={styles.density === 'compact' ? 46 : 56} fgColor="#000000" />
                  </div>
                </div>
              )}

              {/* Sidebar Section: SKILL with elegant gold stars */}
              {skills.length > 0 && (
                <div className="mt-5 space-y-3">
                  <div className="border-b pb-1 mb-2 mt-1 border-white/5">
                    <h4 className="font-black text-[10px] tracking-widest uppercase text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      BECERİLER
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {skills.slice(0, 1).map((cat) => (
                      <div key={cat.id} className="space-y-2">
                        {cat.skills.map((sk, sIdx) => {
                          const rating = sk.level;
                          return (
                            <div key={sIdx} className="flex justify-between items-start gap-1 text-[10.5px] max-w-full">
                              <div className="text-slate-300 font-medium min-w-0 flex-1 break-words [overflow-wrap:anywhere] mr-1">
                                <Editable path={['skills', cat.id, 'skillName', sIdx.toString()]} text={sk.name} />
                              </div>
                              <div className="flex gap-0.5 shrink-0 text-amber-400 select-none pt-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <span key={i} className="text-[10px]">
                                    {i < rating ? '★' : '☆'}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column Layout */}
            <div className={`w-[66%] bg-white ${rightPanelPaddingClass} flex flex-col justify-between select-text overflow-hidden`}>
              <div className={styles.density === 'compact' ? 'space-y-3' : 'space-y-6'}>
                
                {/* Header QR if selected */}
                {isHeaderQR && (
                  <div className="flex justify-end pb-2 mb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] uppercase font-bold text-slate-400">Portfolyo QR</span>
                      <QRCodeGen value={styles.qrCodeUrl} size={50} fgColor={styles.primaryColor} />
                    </div>
                  </div>
                )}

                {/* Right main sections (excludes personal context as it sits in sidebar) */}
                <div className="flex flex-col gap-4 select-text">
                  {sectionOrder
                    .filter((x) => x !== 'personal' && x !== 'summary')
                    .map((sectionId) => {
                      return renderSection(sectionId);
                    })}
                </div>

                {/* Footer QR when selected */}
                {isFooterQR && (
                  <div className="border-t pt-3 mt-4 flex justify-between items-center bg-transparent">
                    <span className="text-[10px] text-slate-400 select-none">
                      Portfolyo / LinkedIn detayları için QR kodu taratabilirsiniz.
                    </span>
                    <div className="flex-shrink-0">
                      <QRCodeGen value={styles.qrCodeUrl} size={55} fgColor={styles.primaryColor} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Standard traditional layouts (Corporate, Modern, 3D Glassmorphism)
          <div className={`flex flex-col ${styles.density === 'compact' ? 'gap-3.5' : 'gap-6'} select-text`}>
            {/* Header section (Personal info always at the top) */}
            {renderPersonal()}

            {/* Dynamic Re-orderable CV sections */}
            <div className={`flex flex-col ${styles.density === 'compact' ? 'gap-3' : 'gap-5'} select-text`}>
              {sectionOrder.map((sectionId) => renderSection(sectionId))}
            </div>
          </div>
        )}

        {/* Footer (QR position bottom, or social info bottom details) */}
        {isFooterQR && !['split-sidebar', 'modern-geometric', 'crimson-split', 'teal-timeline', 'dark-gold-arch'].includes(styles.template) && (
          <div className="border-t pt-4 mt-6 flex justify-between items-center bg-transparent">
            <span className="text-xs text-slate-400 select-none">
              Portfolyo / LinkedIn detayları için QR kodu cep telefonunuzla taratabilirsiniz.
            </span>
            <div className="flex-shrink-0 scale-95">
              <QRCodeGen value={styles.qrCodeUrl} size={65} fgColor={styles.primaryColor} />
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
  );
}
