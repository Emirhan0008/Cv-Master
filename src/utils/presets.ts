import { CCStyles } from '../types';

export interface PresetDef {
  id: 'corporate' | 'modern' | 'depth3d' | 'modern-geometric' | 'split-sidebar' | 'minimalist-clean' | 'editorial-serif' | 'tech-mono' | 'crimson-split' | 'teal-timeline' | 'dark-gold-arch';
  name: string;
  tag: string;
  description: string;
  colorClass: string;
  borderColor: string;
  styles: Partial<CCStyles>;
}

export const PRESETS: PresetDef[] = [
  {
    id: 'corporate',
    name: 'Geleneksel & Kurumsal',
    tag: 'Kurumsal',
    description: 'Klasik tek sütun resmi şablon',
    colorClass: 'bg-slate-900 text-teal-400',
    borderColor: 'border-slate-800',
    styles: {
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
    }
  },
  {
    id: 'modern',
    name: 'Yenilikçi & Modern',
    tag: 'Teknoloji & Tasarım',
    description: 'Yeşil tonlarında yuvarlatılmış kartlı modern düzen',
    colorClass: 'bg-emerald-950/40 text-emerald-400',
    borderColor: 'border-emerald-500/30',
    styles: {
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
    }
  },
  {
    id: 'modern-geometric',
    name: 'Geometrik & Altın Şema',
    tag: 'Mühendislik & Üretim',
    description: 'Geometrik başlık bloku ve altın renk tonu',
    colorClass: 'bg-amber-955/40 text-amber-500',
    borderColor: 'border-amber-500/30',
    styles: {
      template: 'modern-geometric',
      primaryColor: '#1b2a47',
      secondaryColor: '#f59e0b',
      accentColor: '#3b82f6',
      textColor: '#1e293b',
      backgroundColor: '#ffffff',
      font: 'spaceGrotesk',
      fontSize: 'sm',
      shadowIntensity: 'subtle',
      glassEffect: false
    }
  },
  {
    id: 'split-sidebar',
    name: 'İki Sütunlu Yan Panel',
    tag: 'Akademik & Danışmanlık',
    description: 'Sol tarafta detaylı dikey bilgi paneli şablonu',
    colorClass: 'bg-blue-950/40 text-blue-400',
    borderColor: 'border-blue-500/30',
    styles: {
      template: 'split-sidebar',
      primaryColor: '#2b5c8f',
      secondaryColor: '#334155',
      accentColor: '#10b981',
      textColor: '#334155',
      backgroundColor: '#f8fafc',
      font: 'inter',
      fontSize: 'sm',
      shadowIntensity: 'none',
      glassEffect: false
    }
  },
  {
    id: 'depth3d',
    name: '3D Gölge Katmanlı Şablon',
    tag: 'Kreatif Tasarım (Gölgelendirme)',
    description: 'Katmanlı derinliğe sahip havalı 3D gölge taslağı',
    colorClass: 'bg-purple-950/40 text-purple-400',
    borderColor: 'border-purple-500/30',
    styles: {
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
    }
  },
  {
    id: 'minimalist-clean',
    name: 'Minimalist & Arı Düzlük',
    tag: 'Sade & Her Sektör',
    description: 'Yalın ve okunabilirliği en üst seviyeye çıkaran çizgi sanatı',
    colorClass: 'bg-gray-900/60 text-gray-300',
    borderColor: 'border-gray-500/20',
    styles: {
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
    }
  },
  {
    id: 'editorial-serif',
    name: 'Editorial Serif Akışı',
    tag: 'Lüks & Kitap Tarzı',
    description: 'Edebi, sanatsal veya premium lüks marka şablonu',
    colorClass: 'bg-amber-900/40 text-amber-500',
    borderColor: 'border-amber-700/30',
    styles: {
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
    }
  },
  {
    id: 'tech-mono',
    name: 'Tech Monospace Koducu',
    tag: 'Terminal & Konsol',
    description: 'Yazılımcılar ve geliştiriciler için monospace terminal akışı',
    colorClass: 'bg-cyan-950/40 text-cyan-400',
    borderColor: 'border-cyan-500/30',
    styles: {
      template: 'tech-mono',
      primaryColor: '#0f172a',
      secondaryColor: '#0891b2',
      accentColor: '#10b981',
      textColor: '#0f172a',
      backgroundColor: '#fafbfc',
      font: 'jetbrains',
      fontSize: 'sm',
      shadowIntensity: 'none',
      glassEffect: false
    }
  },
  {
    id: 'crimson-split',
    name: 'Crimson & Serif Classic (A. Towers)',
    tag: 'Lüks & Finans',
    description: 'Zengin kırmızı sol panel, beyaz zemin ve asil serif başlıklar ile geleneksel bir duruş',
    colorClass: 'bg-rose-950/40 text-rose-400 border-rose-500/30',
    borderColor: 'border-rose-500/30',
    styles: {
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
    }
  },
  {
    id: 'teal-timeline',
    name: 'Teal Timeline & Dots (N. Edwards)',
    tag: 'Tasarım & Proje',
    description: 'Teal dikey zaman çizelgeleri, sol tarafta özel nokta puanları ve estetik arayüz',
    colorClass: 'bg-teal-950/40 text-teal-400 border-teal-500/30',
    borderColor: 'border-teal-500/30',
    styles: {
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
    }
  },
  {
    id: 'dark-gold-arch',
    name: 'Charcoal & Gold Arch (M. Maxwell)',
    tag: 'Kreatif & Sanat',
    description: 'Kemerli dikey koyu panel, altın yaldızlı başlık kapsülleri ve özel yıldız puanlı beceri göstergesi',
    colorClass: 'bg-amber-950/60 text-amber-400 border-amber-500/45',
    borderColor: 'border-amber-500/40',
    styles: {
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
  }
];
