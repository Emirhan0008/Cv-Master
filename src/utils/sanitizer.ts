import { CVData } from '../types';

/**
 * Validates and deeply sanitizes incoming CV JSON data.
 * Merges legacy schemas or partial imports with safe default properties
 * so that dereferencing properties in templates never causes runtime crashes.
 */
export function sanitizeCVData(incoming: any): CVData {
  const def: CVData = {
    id: incoming?.id || 'cv-' + Date.now(),
    title: incoming?.title || 'Özgeçmiş',
    updatedAt: incoming?.updatedAt || new Date().toISOString(),
    personalInfo: {
      name: incoming?.personalInfo?.name || '',
      title: incoming?.personalInfo?.title || '',
      email: incoming?.personalInfo?.email || '',
      phone: incoming?.personalInfo?.phone || '',
      location: incoming?.personalInfo?.location || '',
      website: incoming?.personalInfo?.website || '',
      summary: incoming?.personalInfo?.summary || '',
      photoVisible: !!incoming?.personalInfo?.photoVisible,
      avatarUrl: incoming?.personalInfo?.avatarUrl || '',
      birthDate: incoming?.personalInfo?.birthDate || '',
      birthPlace: incoming?.personalInfo?.birthPlace || '',
      maritalStatus: incoming?.personalInfo?.maritalStatus || '',
      driverLicense: incoming?.personalInfo?.driverLicense || ''
    },
    workExperiences: Array.isArray(incoming?.workExperiences) ? incoming.workExperiences.map((exp: any, idx: number) => ({
      id: exp?.id || `exp-${idx}-${Date.now()}`,
      company: exp?.company || '',
      role: exp?.role || '',
      location: exp?.location || '',
      startDate: exp?.startDate || '',
      endDate: exp?.endDate || '',
      current: !!exp?.current,
      description: exp?.description || ''
    })) : [],
    educations: Array.isArray(incoming?.educations) ? incoming.educations.map((edu: any, idx: number) => ({
      id: edu?.id || `edu-${idx}-${Date.now()}`,
      school: edu?.school || '',
      degree: edu?.degree || '',
      field: edu?.field || '',
      location: edu?.location || '',
      startDate: edu?.startDate || '',
      endDate: edu?.endDate || '',
      current: !!edu?.current,
      description: edu?.description || ''
    })) : [],
    projects: Array.isArray(incoming?.projects) ? incoming.projects.map((proj: any, idx: number) => ({
      id: proj?.id || `proj-${idx}-${Date.now()}`,
      name: proj?.name || '',
      role: proj?.role || '',
      url: proj?.url || '',
      description: proj?.description || '',
      technologies: proj?.technologies || ''
    })) : [],
    skills: Array.isArray(incoming?.skills) ? incoming.skills.map((cat: any, idx: number) => ({
      id: cat?.id || `cat-${idx}-${Date.now()}`,
      categoryName: cat?.categoryName || 'Yetenekler',
      skills: Array.isArray(cat?.skills) ? cat.skills.map((sk: any) => ({
        name: sk?.name || '',
        level: typeof sk?.level === 'number' ? sk.level : 3
      })) : []
    })) : [],
    socialLinks: Array.isArray(incoming?.socialLinks) ? incoming.socialLinks.map((link: any, idx: number) => ({
      id: link?.id || `soc-${idx}-${Date.now()}`,
      platform: link?.platform || 'LinkedIn',
      url: link?.url || ''
    })) : [],
    customSections: Array.isArray(incoming?.customSections) ? incoming.customSections.map((sec: any, idx: number) => ({
      id: sec?.id || `cust-${idx}-${Date.now()}`,
      title: sec?.title || 'Sertifika / Kurs',
      content: sec?.content || ''
    })) : [],
    sectionOrder: Array.isArray(incoming?.sectionOrder) ? incoming.sectionOrder : ['personal', 'summary', 'experience', 'education', 'skills', 'projects'],
    styles: {
      template: incoming?.styles?.template || 'corporate',
      primaryColor: incoming?.styles?.primaryColor || '#0f172a',
      secondaryColor: incoming?.styles?.secondaryColor || '#3b82f6',
      accentColor: incoming?.styles?.accentColor || '#10b981',
      textColor: incoming?.styles?.textColor || '#334155',
      backgroundColor: incoming?.styles?.backgroundColor || '#ffffff',
      font: incoming?.styles?.font || 'inter',
      fontSize: incoming?.styles?.fontSize || 'sm',
      lineHeight: incoming?.styles?.lineHeight || 'normal',
      density: incoming?.styles?.density || 'comfortable',
      shadowIntensity: incoming?.styles?.shadowIntensity || 'none',
      glassEffect: !!incoming?.styles?.glassEffect,
      pageGuide: incoming?.styles?.pageGuide !== false,
      qrCodeUrl: incoming?.styles?.qrCodeUrl || '',
      qrCodePosition: ['header', 'footer', 'sidebar', 'none'].includes(incoming?.styles?.qrCodePosition) 
        ? incoming.styles.qrCodePosition 
        : 'none'
    }
  };

  return def;
}
