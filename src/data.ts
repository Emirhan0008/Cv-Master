import { CVData } from './types';

export const INITIAL_CV_SAMPLES: CVData[] = [
  {
    id: 'sample-1',
    title: 'Caner Yılmaz - Kıdemli Yazılım Mühendisi',
    updatedAt: new Date().toISOString(),
    personalInfo: {
      name: 'Caner Yılmaz',
      title: 'Senior Full-Stack Developer',
      email: 'caner.yilmaz@email.com',
      phone: '+90 532 123 45 67',
      location: 'İstanbul, Türkiye',
      website: 'https://caneryilmaz.dev',
      summary: '8 yılı aşkın deneyimli Full-Stack Yazılım Mühendisi. Dağıtık Go/React mimarileri ve bulut entegrasyonu uzmanı.',
      photoVisible: true,
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=300&h=300',
    },
    workExperiences: [
      {
        id: 'w-1',
        company: 'Nova Tech Systems',
        role: 'Lead Software Architect',
        location: 'İstanbul, TR',
        startDate: '2023-01',
        endDate: '',
        current: true,
        description: '• Dağıtık mikroservis altyapısıyla API gecikmelerini %35 azalttım.\n• React ve Go kullanan 12 kişilik teknik ekibe liderlik ettim.\n• CI/CD süreçlerini Kubernetes ile optimize ettim.'
      }
    ],
    educations: [
      {
        id: 'e-1',
        school: 'Orta Doğu Teknik Üniversitesi',
        degree: 'Lisans',
        field: 'Bilgisayar Mühendisliği',
        location: 'Ankara',
        startDate: '2014-09',
        endDate: '2018-06',
        current: false,
        description: 'Onur derecesi (3.72/4.00).'
      }
    ],
    projects: [
      {
        id: 'p-1',
        name: 'Enterprise Cloud Commerce',
        role: 'Ana Geliştirici & Mimar',
        url: 'https://github.com/example/cloud-commerce',
        description: 'Anlık 50.000+ kullanıcıya hizmet veren Go/Kubernetes tabanlı e-ticaret sepet altyapısı.',
        technologies: 'Go, React, PostgreSQL, Kubernetes'
      }
    ],
    skills: [
      {
        id: 's-1',
        categoryName: 'Diller & Teknolojiler',
        skills: [
          { name: 'TypeScript / Go / Python', level: 5 },
          { name: 'React / Next.js / Tailwind', level: 5 }
        ]
      },
      {
        id: 's-2',
        categoryName: 'Sistem & DevOps',
        skills: [
          { name: 'PostgreSQL & Redis', level: 4 },
          { name: 'Docker & Kubernetes & CI/CD', level: 4 }
        ]
      }
    ],
    socialLinks: [
      { id: 'sl-1', platform: 'LinkedIn', url: 'https://linkedin.com/in/caneryilmaz' },
      { id: 'sl-2', platform: 'GitHub', url: 'https://github.com/caneryilmaz' }
    ],
    customSections: [
      {
        id: 'c-1',
        title: 'Sertifikalar & Diller',
        content: '• AWS Solutions Architect\n• İngilizce (C2), Almanca (B1)'
      }
    ],
    sectionOrder: ['personal', 'summary', 'experience', 'education', 'skills', 'projects', 'custom'],
    styles: {
      template: 'modern',
      primaryColor: '#0f172a',
      secondaryColor: '#3b82f6',
      accentColor: '#10b981',
      textColor: '#334155',
      backgroundColor: '#f8fafc',
      font: 'inter',
      fontSize: 'xs',
      lineHeight: 'tight',
      density: 'compact',
      shadowIntensity: 'subtle',
      glassEffect: true,
      pageGuide: true,
      qrCodeUrl: 'https://caneryilmaz.dev',
      qrCodePosition: 'header'
    }
  },
  {
    id: 'sample-2',
    title: 'Aylin Kaya - Tasarımcı & Kreatif Direktör',
    updatedAt: new Date().toISOString(),
    personalInfo: {
      name: 'Aylin Kaya',
      title: 'UI/UX & 3D Art Director',
      email: 'aylin.kaya@creative.com',
      phone: '+90 555 987 65 43',
      location: 'İzmir, Türkiye',
      website: 'https://aylinkaya.studio',
      summary: '6 yıllık deneyimli Görsel Sanatçı ve UI Tasarımcısı. Derinlikli gölgeler ve minimalist arayüz tasarımlarında uzmanım.',
      photoVisible: true,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300&h=300',
    },
    workExperiences: [
      {
        id: 'w-1',
        company: 'Studio Pixel Perfect',
        role: 'Kreatif Direktör',
        location: 'İzmir, TR',
        startDate: '2022-03',
        endDate: '',
        current: true,
        description: '• Mobil uygulamalar için interaktif 3D kullanıcı deneyimleri tasarladım.\n• Figma tasarım sistemleri inşa ederek yazılım ekibi süreçlerini %40 hızlandırdım.'
      }
    ],
    educations: [
      {
        id: 'e-1',
        school: 'Dokuz Eylül Üniversitesi',
        degree: 'Yüksek Lisans',
        field: 'Güzel Sanatlar / Grafik',
        location: 'İzmir',
        startDate: '2019-09',
        endDate: '2021-06',
        current: false,
        description: 'İnteraktif Arayüzlerde Derinlik ve Üç Boyut Algısı tezi.'
      }
    ],
    projects: [
      {
        id: 'p-1',
        name: 'Metaverse Spatial UI',
        role: 'Baş Tasarımcı',
        url: 'https://aylinkaya.studio/meta-spatial',
        description: 'Sanal galeri alanları için tamamen cam görünümlü (glassmorphism) 3D arayüz kiti.',
        technologies: 'Figma, Three.js, Spline'
      }
    ],
    skills: [
      {
        id: 's-1',
        categoryName: 'Tasarım Araçları',
        skills: [
          { name: 'Figma & Blender & Spline', level: 5 },
          { name: 'Photoshop & Illustrator', level: 5 }
        ]
      },
      {
        id: 's-2',
        categoryName: 'Arayüz Teknolojileri',
        skills: [
          { name: 'HTML5 / CSS3 / Tailwind', level: 4 },
          { name: 'Framer Motion / GSAP', level: 4 }
        ]
      }
    ],
    socialLinks: [
      { id: 'sl-1', platform: 'Behance', url: 'https://behance.net/aylinkaya' },
      { id: 'sl-2', platform: 'LinkedIn', url: 'https://linkedin.com/in/aylinkaya' }
    ],
    customSections: [],
    sectionOrder: ['personal', 'summary', 'experience', 'education', 'skills', 'projects'],
    styles: {
      template: 'depth3d',
      primaryColor: '#7c3aed',
      secondaryColor: '#db2777',
      accentColor: '#2563eb',
      textColor: '#1e293b',
      backgroundColor: '#f5f3ff',
      font: 'spaceGrotesk',
      fontSize: 'xs',
      lineHeight: 'tight',
      density: 'compact',
      shadowIntensity: 'depth3d',
      glassEffect: true,
      pageGuide: true,
      qrCodeUrl: 'https://aylinkaya.studio',
      qrCodePosition: 'footer'
    }
  },
  {
    id: 'sample-3',
    title: 'Zeynep Demir - Ürün Yönetimi Direktörü (Minimalist)',
    updatedAt: new Date().toISOString(),
    personalInfo: {
      name: 'Zeynep Demir',
      title: 'Head of Product Management',
      email: 'zeynep.demir@email.com',
      phone: '+90 541 987 65 43',
      location: 'İzmir, Türkiye',
      website: 'https://zeynepdemir.co',
      summary: 'SaaS ve B2B platform geliştirme süreçlerinde 10 yıllık liderlik tecrübesine sahip, veri odaklı Ürün Direktörü.',
      photoVisible: false,
      avatarUrl: ''
    },
    workExperiences: [
      {
        id: 'w-3-1',
        company: 'CloudFlow Tech INC',
        role: 'Director of Product',
        location: 'Remote, TR',
        startDate: '2022-03',
        endDate: '',
        current: true,
        description: '• Aylık 1.2M aktif kullanıcılı SaaS bulut otomasyon ürün yol haritasını sıfırdan çizdim.\n• Kullanıcı edinme dönüşümlerini A/B testleriyle %22 artırdım.'
      }
    ],
    educations: [
      {
        id: 'e-3-1',
        school: 'Boğaziçi Üniversitesi',
        degree: 'Lisans',
        field: 'Endüstri Mühendisliği',
        location: 'İstanbul',
        startDate: '2010-09',
        endDate: '2014-06',
        current: false,
        description: 'Yüksek Onur Derecesi.'
      }
    ],
    projects: [
      {
        id: 'p-3-1',
        name: 'CoreFlow Enterprise',
        role: 'Ürün Lideri / Kurucu Ortak',
        url: '',
        description: 'Otomatik faturalama SaaS çözümü. 150+ kurumsal müşteriye ulaştı.',
        technologies: ''
      }
    ],
    skills: [
      {
        id: 'sk-3-1',
        categoryName: 'Ürün & Yönetim',
        skills: [
          { name: 'Ürün Yol Haritası & Strateji', level: 5 },
          { name: 'A/B Testleri & Metrikler', level: 5 }
        ]
      }
    ],
    socialLinks: [
      { id: 'sl-3-1', platform: 'LinkedIn', url: 'https://linkedin.com/in/zeynepdemir' }
    ],
    customSections: [],
    sectionOrder: ['personal', 'summary', 'experience', 'education', 'skills', 'projects'],
    styles: {
      template: 'minimalist-clean',
      primaryColor: '#1e293b',
      secondaryColor: '#64748b',
      accentColor: '#0f172a',
      textColor: '#1e293b',
      backgroundColor: '#ffffff',
      font: 'inter',
      fontSize: 'xs',
      lineHeight: 'tight',
      density: 'compact',
      shadowIntensity: 'none',
      glassEffect: false,
      pageGuide: true,
      qrCodeUrl: 'https://zeynepdemir.co',
      qrCodePosition: 'none'
    }
  },
  {
    id: 'sample-4',
    title: 'Barış Özcan - Kreatif Tasarım Yönetmeni (Serif)',
    updatedAt: new Date().toISOString(),
    personalInfo: {
      name: 'Barış Özcan',
      title: 'Kreatif Direktör & Tasarımcı',
      email: 'baris.studio@email.com',
      phone: '+90 533 555 44 33',
      location: 'İstanbul, Türkiye',
      website: 'https://barisozcan.studio',
      summary: 'Marka kimliği, mizanpaj ve dijital tasarım alanında 7 yıllık ödüllü çalışmalara yön veren kreatif direktör.',
      photoVisible: false,
      avatarUrl: ''
    },
    workExperiences: [
      {
        id: 'w-4-1',
        company: 'Hece Yayıncılık & Tasarım',
        role: 'Art Director',
        location: 'İstanbul',
        startDate: '2021-05',
        endDate: '',
        current: true,
        description: '• 40+ prestij markanın kurumsal dergi ve kitaplarını tasarladım.\n• Tipografi ve görsel desenlerle zamansız marka dilleri tasarladım.'
      }
    ],
    educations: [
      {
        id: 'e-4-1',
        school: 'Mimar Sinan GSU',
        degree: 'Lisans',
        field: 'Grafik Tasarım Bölümü',
        location: 'İstanbul',
        startDate: '2012-09',
        endDate: '2017-06',
        current: false,
        description: 'Bölüm Birincilik Derecesi.'
      }
    ],
    projects: [
      {
        id: 'p-4-1',
        name: 'Geçmişin İzleri Serisi',
        role: 'Kreatif Sanatçı',
        url: '',
        description: 'Gravür sanatı ve el yapımı özel ciltleme tekniklerinin harmanlandığı özel kitap serisi.',
        technologies: ''
      }
    ],
    skills: [
      {
        id: 'sk-4-1',
        categoryName: 'Tasarım Disiplinleri',
        skills: [
          { name: 'Tipografi & Sayfa Mizanpajı', level: 5 },
          { name: 'Adobe InDesign & Illustrator', level: 5 }
        ]
      }
    ],
    socialLinks: [
      { id: 'sl-4-1', platform: 'Behance', url: 'https://behance.net/barisozcan' }
    ],
    customSections: [],
    sectionOrder: ['personal', 'summary', 'experience', 'education', 'skills', 'projects'],
    styles: {
      template: 'editorial-serif',
      primaryColor: '#451a03',
      secondaryColor: '#b45309',
      accentColor: '#78350f',
      textColor: '#1a1d20',
      backgroundColor: '#fdfdfc',
      font: 'playfair',
      fontSize: 'xs',
      lineHeight: 'tight',
      density: 'compact',
      shadowIntensity: 'none',
      glassEffect: false,
      pageGuide: true,
      qrCodeUrl: 'https://barisozcan.studio',
      qrCodePosition: 'none'
    }
  },
  {
    id: 'sample-5',
    title: 'Dr. Arda Tutan - Veri Bilimci (Tech Monospace)',
    updatedAt: new Date().toISOString(),
    personalInfo: {
      name: 'Dr. Arda Tutan',
      title: 'Machine Learning Principal Scientist',
      email: 'arda.tutan@terminal.ai',
      phone: '+90 505 444 11 22',
      location: 'Ankara, Türkiye',
      website: 'https://ardatutan.ai',
      summary: 'Büyük dil modelleri (LLM) ince ayar ve AI çıkarım optimizasyonları alanında derin araştırmalar yapan veri bilimci.',
      photoVisible: false,
      avatarUrl: ''
    },
    workExperiences: [
      {
        id: 'w-5-1',
        company: 'NeuralGate Research Labs',
        role: 'Principal LLM Engineer',
        location: 'Ankara, TR',
        startDate: '2023-08',
        endDate: '',
        current: true,
        description: '• Büyük Dil Modellerinde çıkarım hızını %40 artıran C++ optimizasyon kütüphanesi yazdım.\n• GPU bellek tüketim optimizasyonu için veri sıkıştırma mimarileri geliştirdim.'
      }
    ],
    educations: [
      {
        id: 'e-5-1',
        school: 'Bilkent Üniversitesi',
        degree: 'Doktora (PhD)',
        field: 'Yapay Zeka ve Makine Öğrenmesi',
        location: 'Ankara',
        startDate: '2016-09',
        endDate: '2021-06',
        current: false,
        description: 'Dağıtık Gradyan Hesaplama Tezi.'
      }
    ],
    projects: [
      {
        id: 'p-5-1',
        name: 'Llama Tensor Engine',
        role: 'Baş Geliştirici',
        url: '',
        description: 'Semantik veri taramalarını GPU üzerinde 10 kat hızlandıran açık kaynaklı kütüphane.',
        technologies: ''
      }
    ],
    skills: [
      {
        id: 'sk-5-1',
        categoryName: 'Teknik Altyapı',
        skills: [
          { name: 'PyTorch / TensorFlow / C++', level: 5 },
          { name: 'CUDA Kernel Programming', level: 4 }
        ]
      }
    ],
    socialLinks: [
      { id: 'sl-5-1', platform: 'GitHub', url: 'https://github.com/ardatutan' }
    ],
    customSections: [],
    sectionOrder: ['personal', 'summary', 'experience', 'education', 'skills', 'projects'],
    styles: {
      template: 'tech-mono',
      primaryColor: '#090d16',
      secondaryColor: '#10b981',
      accentColor: '#06b6d4',
      textColor: '#090d16',
      backgroundColor: '#ffffff',
      font: 'jetbrains',
      fontSize: 'xs',
      lineHeight: 'tight',
      density: 'compact',
      shadowIntensity: 'none',
      glassEffect: false,
      pageGuide: true,
      qrCodeUrl: 'https://ardatutan.ai',
      qrCodePosition: 'none'
    }
  }
];
