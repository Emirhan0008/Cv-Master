export interface PersonalInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  summary: string;
  avatarUrl?: string;
  photoVisible: boolean;
  birthDate?: string;
  birthPlace?: string;
  maritalStatus?: string;
  driverLicense?: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface Project {
  id: string;
  name: string;
  role: string;
  url: string;
  description: string;
  technologies: string;
}

export interface Skill {
  name: string;
  level: number; // 1 to 5 stars or percentage
}

export interface SkillCategory {
  id: string;
  categoryName: string;
  skills: Skill[];
}

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
}

export interface CustomSection {
  id: string;
  title: string;
  content: string;
}

export interface CVData {
  id: string;
  title: string; // Internal name for saving multiple CVs (e.g., "Software Engineer CV", "Marketing Manager CV")
  updatedAt: string;
  personalInfo: PersonalInfo;
  workExperiences: WorkExperience[];
  educations: Education[];
  projects: Project[];
  skills: SkillCategory[];
  socialLinks: SocialLink[];
  customSections: CustomSection[];
  sectionOrder: string[]; // e.g., ['summary', 'experience', 'education', 'skills', 'projects', 'custom']
  styles: CCStyles;
}

export interface CCStyles {
  template: 'corporate' | 'modern' | 'depth3d' | 'modern-geometric' | 'split-sidebar' | 'minimalist-clean' | 'editorial-serif' | 'tech-mono' | 'crimson-split' | 'teal-timeline' | 'dark-gold-arch';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  backgroundColor: string;
  font: 'inter' | 'spaceGrotesk' | 'playfair' | 'jetbrains';
  fontSize: 'xs' | 'sm' | 'md' | 'lg';
  lineHeight: 'tight' | 'normal' | 'relaxed';
  density: 'compact' | 'comfortable' | 'loose'; // space and margins
  shadowIntensity: 'none' | 'subtle' | 'depth3d';
  glassEffect: boolean;
  pageGuide: boolean;
  qrCodeUrl: string;
  qrCodePosition: 'header' | 'footer' | 'sidebar' | 'none';
}
