import { CVData, WorkExperience, Education, SkillCategory, Skill, SocialLink, Project, CustomSection } from '../types';

/**
 * Parses dynamic links (e.g. from Websites or Instant Messengers columns)
 * supporting markdown links like [Label](url) and comma-separated urls.
 */
export function extractLinks(val: string): { label: string; url: string }[] {
  if (!val) return [];
  const links: { label: string; url: string }[] = [];
  
  // Match markdown links: [Label](url)
  const markdownRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = markdownRegex.exec(val)) !== null) {
    links.push({
      label: match[1].trim(),
      url: match[2].trim()
    });
  }
  
  // If no markdown links matched and it's a non-empty string, try parsing custom formats
  if (links.length === 0) {
    const parts = val.split(',').map(p => p.trim()).filter(Boolean);
    for (const part of parts) {
      const urlRegex = /(https?:\/\/[^\s]+)/gi;
      const urlMatch = part.match(urlRegex);
      if (urlMatch) {
        const url = urlMatch[0];
        const label = part.replace(url, '').replace(/[\[\]()]/g, '').trim() || 'Link';
        links.push({ label, url });
      } else if (part.startsWith('@')) {
        links.push({ label: 'Twitter', url: `https://x.com/${part.substring(1)}` });
      } else if (part.includes(':')) {
        const pIdx = part.indexOf(':');
        const label = part.substring(0, pIdx).trim();
        const url = part.substring(pIdx + 1).trim();
        if (url && label) {
          links.push({ label, url });
        }
      }
    }
  }
  return links;
}

/**
 * Cleans school names and company name prefixes/suffixes from the profile headline to extract a clean personal title.
 */
export function cleanHeadlineForTitle(headline: string): string {
  if (!headline) return '';
  let cleaned = headline.trim();

  // Remove common student-oriented prefixes like "Şu okulda öğrenci:", "öğrenci:"
  cleaned = cleaned.replace(/^Şu\s+okulda\s+öğrenci\s*:\s*/gi, '');
  cleaned = cleaned.replace(/^Şu\s+okulda\s+öğrenci\s+/gi, '');
  cleaned = cleaned.replace(/^öğrenci\s*:\s*/gi, '');

  // Strip multi-word university/school names (Turkish & English) 
  cleaned = cleaned.replace(/(?:[A-ZÇĞİÖŞÜa-zçğıöşü']+\s+){1,4}(?:Üniversitesi|Üniversitesi|Lisesi|Koleji|Okulu|University|High School)['\w]*\s*(?:'nde|'nda|'de|'da|nde|nda|de|da)?\s*(?:'ndeki|'ndaki|'deki|'daki)?\s*/gi, '');

  // Remove common company prefixes like "X bünyesinde" or "X firmasında" or "at X" or "@ X"
  cleaned = cleaned.replace(/(?:[A-ZÇĞİÖŞÜa-zçğıöşü\d']+\s+){1,3}(?:bünyesinde|bunesinde| firmasında| sirketinde| şirketinde|şirket|sirket|at|@)\s*/gi, '');

  // Remove custom suffixes like "at X Company"
  cleaned = cleaned.replace(/\s+(?:at|@)\s+(?:[A-ZÇĞİÖŞÜa-zçğıöşü\d']+\s*){1,3}/gi, '');

  // Trim whitespace and outer characters like | or -
  cleaned = cleaned.trim().replace(/^[\s|&\-+,:]+|[\s|&\-+,:]+$/g, '').trim();

  const lower = cleaned.toLowerCase();

  // If the title contains words like "öğrenci" (student) or refers to a university/school, search for major
  if (lower.includes('öğrenci') || lower.includes('student') || lower.includes('üniversite') || lower.includes('university') || lower.includes('okulda')) {
    if (lower.includes('bilgisayar mühendis') || lower.includes('computer engineer')) {
      return 'Bilgisayar Mühendisliği';
    } else if (lower.includes('yazılım mühendis') || lower.includes('software engineer')) {
      return 'Yazılım Mühendisliği';
    } else if (lower.includes('elektrik-elektronik') || lower.includes('electrical')) {
      return 'Elektrik-Elektronik Mühendisliği';
    } else if (lower.includes('makine mühendis') || lower.includes('mechanical engineer')) {
      return 'Makine Mühendisliği';
    } else if (lower.includes('endüstri mühendis') || lower.includes('industrial engineer')) {
      return 'Endüstri Mühendisliği';
    } else if (lower.includes('tasarım') || lower.includes('design')) {
      return 'Tasarımcı';
    } else if (lower.includes('bilgisayar') || lower.includes('software') || lower.includes('yazılım')) {
      return 'Yazılım Geliştirici';
    }
    // General student label without specific major should be completely cleared so it won't populate professional role/title
    return '';
  }

  // If the result is too short or refers directly to high schools or colleges, skip it
  if (!cleaned || cleaned.length < 3 || lower.includes('lisesi') || lower.includes('kolej') || lower.includes('okulu')) {
    return '';
  }

  return cleaned;
}

/**
 * Robust CSV parser that handles quotes, linebreaks inside quotes, and auto-detects delimiter.
 */
export function parseCSV(text: string): string[][] {
  const result: string[][] = [];
  if (!text || !text.trim()) return result;

  // Auto-detect delimiter
  let sep = ',';
  const firstLine = text.split(/\r?\n/)[0] || '';
  const commas = (firstLine.match(/,/g) || []).length;
  const semicolons = (firstLine.match(/;/g) || []).length;
  const tabs = (firstLine.match(/\t/g) || []).length;

  if (semicolons > commas && semicolons > tabs) sep = ';';
  else if (tabs > commas && tabs > semicolons) sep = '\t';

  let row: string[] = [];
  let inQuotes = false;
  let entry = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        entry += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === sep && !inQuotes) {
      row.push(entry.trim());
      entry = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(entry.trim());
      if (row.length > 0 && row.some(cell => cell.length > 0)) {
        result.push(row);
      }
      row = [];
      entry = '';
    } else {
      entry += char;
    }
  }

  if (entry.length > 0 || row.length > 0) {
    row.push(entry.trim());
    result.push(row);
  }

  return result;
}

/**
 * Converts a grid of parsed CSV cells into an array of objects based on header row.
 */
export function csvToObjects(rows: string[][]): Record<string, string>[] {
  if (rows.length < 2) return [];
  const headers = rows[0].map(h => h.trim().toLowerCase());
  const objects: Record<string, string>[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const obj: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      if (j < row.length) {
        obj[headers[j]] = row[j];
      } else {
        obj[headers[j]] = '';
      }
    }
    objects.push(obj);
  }
  return objects;
}

interface SmartImportResult {
  type: 'profile' | 'experience' | 'education' | 'skills' | 'json' | 'unknown';
  message: string;
  patch: Partial<CVData>;
}

/**
 * Classifies import text and creates a partial patch or full CVData config
 */
export function processImportData(text: string, currentData: CVData): SmartImportResult {
  const trimmed = text.trim();

  // 1. Try JSON
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      const isFullBackup = parsed.personalInfo && parsed.styles;
      if (isFullBackup) {
        return {
          type: 'json',
          message: 'Bütünleşik CV JSON yedeği başarıyla doğrulandı!',
          patch: parsed
        };
      }

      // Check for custom/Turkish AI JSON or generic resume structure
      const hasCustomKeys = 
        parsed.kisel_bilgiler || parsed.kişisel_bilgiler || 
        parsed.iletisim || parsed.iletişim || 
        parsed.profesyonel_ozet || parsed.profesyonel_özet || 
        parsed.is_deneyimleri || parsed.iş_deneyimleri || 
        parsed.egitim_bilgileri || parsed.eğitim_bilgileri || 
        parsed.beceriler || parsed.yetenekler || 
        parsed.basics || parsed.work || parsed.education || 
        parsed.skills;

      if (hasCustomKeys) {
        // 1. Personal Info
        const kb = parsed.kisel_bilgiler || parsed.kişisel_bilgiler || parsed.basics || {};
        const ilet = parsed.iletisim || parsed.iletişim || parsed.basics || {};
        
        const name = kb.ad_soyad || kb.name || [kb.ad, kb.soyad].filter(Boolean).join(' ') || currentData.personalInfo.name;
        const email = ilet.e_posta || ilet.eposta || ilet.email || currentData.personalInfo.email;
        const phone = ilet.telefon || ilet.phone || currentData.personalInfo.phone;
        const location = ilet.adres || ilet.konum || (ilet.location && (typeof ilet.location === 'object' ? (ilet.location.address || ilet.location.city) : ilet.location)) || currentData.personalInfo.location;
        const summary = parsed.profesyonel_ozet || parsed.profesyonel_özet || parsed.ozet || parsed.basics?.summary || parsed.objective || currentData.personalInfo.summary;
        
        const birthDate = kb.dogum_tarihi || kb.doğum_tarihi || kb.birthDate || kb.birth_date || '';
        const birthPlace = kb.dogum_yeri || kb.doğum_yeri || kb.birthPlace || kb.birth_place || '';
        const maritalStatus = kb.medeni_durum || kb.maritalStatus || kb.marital_status || '';
        const driverLicense = kb.ehliyet || kb.driverLicense || kb.driver_license || '';
        
        // 2. Guess Title
        const promptExperiences = parsed.is_deneyimleri || parsed.iş_deneyimleri || parsed.work || parsed.experiences || [];
        const firstExpRole = promptExperiences[0]?.pozisyon || promptExperiences[0]?.görev || promptExperiences[0]?.role || promptExperiences[0]?.position || promptExperiences[0]?.title || '';
        const title = kb.unvan || kb.unvan_baslik || kb.title || kb.label || firstExpRole || currentData.personalInfo.title;

        // 3. Work Experiences
        const workExperiences: WorkExperience[] = [];
        if (Array.isArray(promptExperiences)) {
          promptExperiences.forEach((item: any, idx: number) => {
            const company = item.kurum_firma || item.kurum || item.firma || item.sirket || item.şirket || item.company || item.companyName || '';
            const role = item.görev || item.gorev || item.pozisyon || item.role || item.title || item.position || '';
            const location = item.konum || item.yer || item.sehir || item.location || '';
            const description = item.aciklama || item.açıklama || item.description || item.summary || '';
            
            let startDate = item.startDate || '';
            let endDate = item.endDate || '';
            let current = item.current || false;
            
            const dateStr = item.tarih || item.date || item.tarihler || item.duration || item.period || '';
            if (dateStr) {
              const parts = dateStr.split(/[-–—]| to /).map((d: any) => d.trim());
              startDate = parts[0] || '';
              if (parts[1]) {
                endDate = parts[1];
                const lowerEnd = endDate.toLowerCase();
                if (lowerEnd.includes('halen') || lowerEnd.includes('devam') || lowerEnd.includes('present') || lowerEnd.includes('şu an') || lowerEnd.includes('su an')) {
                  current = true;
                }
              } else {
                endDate = '';
                current = true;
              }
            }
            
            if (company || role) {
              workExperiences.push({
                id: `exp-json-${Date.now()}-${idx}`,
                company,
                role,
                location,
                startDate,
                endDate,
                current,
                description
              });
            }
          });
        }

        // 4. Educations
        const promptEducations = parsed.egitim_bilgileri || parsed.eğitim_bilgileri || parsed.education || parsed.educations || [];
        const educations: Education[] = [];
        if (Array.isArray(promptEducations)) {
          promptEducations.forEach((item: any, idx: number) => {
            const school = item.universite || item.üniversite || item.okul || item.school || item.institution || '';
            const field = item.bolum || item.bölüm || item.fieldOfStudy || item.field || '';
            const degree = item.derece || item.mezuniyet || item.degree || (field.toLowerCase().includes('lisans') ? 'Lisans' : 'Öğrenim');
            const location = item.konum || item.location || '';
            const description = item.aciklama || item.açıklama || item.description || '';
            
            let startDate = item.startDate || '';
            let endDate = item.endDate || '';
            let current = item.current || false;
            
            const dateStr = item.tarih || item.date || item.tarihler || item.duration || item.period || '';
            if (dateStr) {
              const parts = dateStr.split(/[-–—]| to /).map((d: any) => d.trim());
              startDate = parts[0] || '';
              if (parts[1]) {
                endDate = parts[1];
                const lowerEnd = endDate.toLowerCase();
                if (lowerEnd.includes('halen') || lowerEnd.includes('devam') || lowerEnd.includes('present') || lowerEnd.includes('şu an') || lowerEnd.includes('su an')) {
                  current = true;
                }
              } else {
                endDate = '';
                current = true;
              }
            }
            
            if (school) {
              educations.push({
                id: `edu-json-${Date.now()}-${idx}`,
                school,
                degree,
                field,
                location,
                startDate,
                endDate,
                current,
                description
              });
            }
          });
        }

        // 5. Skills
        const promptSkills = parsed.beceriler || parsed.yetenekler || parsed.skills || [];
        let skills: SkillCategory[] = [...currentData.skills];
        if (Array.isArray(promptSkills) && promptSkills.length > 0) {
          const mappedSkillsList: Skill[] = [];
          
          promptSkills.forEach((item: any) => {
            if (typeof item === 'string') {
              mappedSkillsList.push({ name: item, level: 5 });
            } else if (item && typeof item === 'object') {
              const sName = item.name || item.skill || item.ad || item.beceri || '';
              const sLevelStr = item.level || item.seviye || '5';
              let level = 5;
              if (typeof sLevelStr === 'number') {
                level = sLevelStr;
              } else {
                const parsedLevel = parseInt(sLevelStr, 10);
                if (!isNaN(parsedLevel)) level = parsedLevel;
              }
              if (sName) {
                mappedSkillsList.push({ name: sName, level });
              }
            }
          });

          if (mappedSkillsList.length > 0) {
            skills = [
              ...skills.filter(cat => cat.categoryName !== 'Yetkinlikler ve Beceriler' && cat.categoryName !== 'Yetkinlikler & Teknolojiler' && cat.categoryName !== 'Yapay Zeka ile Tanımlanan Yetkinlikler'),
              {
                id: `skill-cat-prompt-${Date.now()}`,
                categoryName: 'Yetkinlikler ve Beceriler',
                skills: mappedSkillsList
              }
            ];
          }
        }

        // 6. Custom Sections / Meta Details (medeni_durum, ehliyet, ilgi_alanları etc)
        const customSections: CustomSection[] = [...currentData.customSections];
        const hobbies = parsed.ilgi_alanlari_ve_hobiler || parsed.ilgi_alanları_ve_hobiler || parsed.ilgi_alanları || parsed.hobiler || parsed.interests || [];
        if (Array.isArray(hobbies) && hobbies.length > 0) {
          customSections.push({
            id: `custom-hobbies-${Date.now()}`,
            title: 'İlgi Alanları & Hobiler',
            content: hobbies.join(', ')
          });
        }

        return {
          type: 'json',
          message: `${name} için Yapay Zeka Hazır JSON formundaki özgeçmiş verisi başarıyla aktarıldı!`,
          patch: {
            ...currentData,
            personalInfo: {
              ...currentData.personalInfo,
              name,
              email,
              phone,
              location,
              summary,
              title,
              birthDate,
              birthPlace,
              maritalStatus,
              driverLicense
            },
            workExperiences,
            educations,
            skills,
            customSections
          }
        };
      }

      if (parsed.company || parsed.role || Array.isArray(parsed)) {
        // Simple JSON object or array of items list
        const list = Array.isArray(parsed) ? parsed : [parsed];
        return {
          type: 'experience',
          message: `${list.length} adet JSON formatında iş tecrübesi bulundu.`,
          patch: {
            workExperiences: [
              ...currentData.workExperiences,
              ...list.map((item: any, idx) => ({
                id: `exp-json-${Date.now()}-${idx}`,
                company: item.company || item.companyName || '',
                role: item.role || item.title || '',
                location: item.location || '',
                startDate: item.startDate || item.duration || item.period || '',
                endDate: item.endDate || '',
                current: item.current || false,
                description: item.description || ''
              }))
            ]
          }
        };
      }
    } catch (e) {
      // Not a valid JSON, fall through to CSV parser
    }
  }

  // 2. Parse CSV
  const csvRows = parseCSV(trimmed);
  if (csvRows.length < 2) {
    return parsePlainTextWithRegex(trimmed, currentData);
  }

  const objects = csvToObjects(csvRows);
  const headLineKeys = Object.keys(objects[0] || {}).map(k => k.toLowerCase().trim());

  // Identify LinkedIn file types (English and Turkish localized CSV files):
  const isProfile = headLineKeys.some(k => 
    k.includes('first name') || k.includes('last name') || k.includes('summary') || k.includes('email address') ||
    k.includes('adı') || k.includes('adi') || k.includes('soyadı') || k.includes('soyadi') || k.includes('özet') || k.includes('ozet') || k.includes('e-posta') ||
    k === 'headline' || k === 'heading' || k === 'unvan' || k === 'başlık' || k === 'baslik'
  );
  const isExperience = headLineKeys.some(k => 
    k.includes('company name') || k.includes('started on') || k.includes('finished on') || k.includes('job title') || k.includes('company') ||
    k.includes('şirket') || k.includes('sirket') || k.includes('unvan') || k.includes('başlangıç') || k.includes('baslangic') || k.includes('bitiş') || k.includes('bitis') || k.includes('rol')
  );
  const isEducation = headLineKeys.some(k => 
    k.includes('school name') || k.includes('degree name') || k.includes('fields of study') || k.includes('school') ||
    k.includes('okul') || k.includes('derece') || k.includes('öğrenim') || k.includes('ogrenim') || k.includes('alanı') || k.includes('alani')
  );
  const isSkills = headLineKeys.some(k => 
    k === 'name' || k === 'skill' || k.includes('skill name') || 
    k === 'ad' || k === 'adi' || k === 'beceri' || k.includes('yetenek') || k.includes('yetenekler')
  );

  if (isProfile) {
    const row = objects[0] || {};
    const firstName = row['first name'] || row['adı'] || row['adi'] || row['ad'] || '';
    const lastName = row['last name'] || row['soyadı'] || row['soyadi'] || row['soyad'] || '';
    const name = [firstName, lastName].filter(Boolean).join(' ');

    const headline = row['headline'] || row['heading'] || row['title'] || row['unvan'] || row['başlık'] || row['baslik'] || '';
    const summary = row['summary'] || row['özet'] || row['ozet'] || row['özgeçmiş'] || row['ozgecmis'] || row['açıklama'] || row['aciklama'] || '';
    const location = row['geo location'] || row['geographical area'] || row['address'] || row['location'] || row['adres'] || row['konum'] || '';
    const industry = row['industry'] || row['sektör'] || row['sektor'] || '';

    // Smartly cleaned actual job role or title for the profile header.
    const cleanedTitle = cleanHeadlineForTitle(headline);

    // Parse websites and instant messengers for multiple links!
    const rawWebsites = row['websites'] || row['website'] || row['web siteleri'] || row['web sitesi'] || row['web adresi'] || '';
    const rawMessengers = row['instant messengers'] || row['instant messenger'] || row['messenger'] || row['iletişim'] || '';
    const twitterHandle = row['twitter handles'] || row['twitter'] || '';

    const extractedWebsites = extractLinks(rawWebsites);
    const extractedMessengers = extractLinks(rawMessengers);

    let primaryWebsite = '';
    const socialLinks: SocialLink[] = [...currentData.socialLinks];
    const projectsList: Project[] = [...currentData.projects];

    extractedWebsites.forEach((link, idx) => {
      const normalizedUrl = link.url;
      const lowerLabel = link.label.toLowerCase();

      if (idx === 0 && !primaryWebsite) {
        primaryWebsite = normalizedUrl;
      }

      const isGithub = lowerLabel.includes('github');
      const isLinkedin = lowerLabel.includes('linkedin');
      const isTwitter = lowerLabel.includes('twitter') || lowerLabel.includes('x.com');
      const platformName = isGithub ? 'GitHub' : isLinkedin ? 'LinkedIn' : isTwitter ? 'Twitter' : link.label;

      if (!socialLinks.some(s => s.url.toLowerCase() === normalizedUrl.toLowerCase())) {
        socialLinks.push({
          id: `social-csv-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
          platform: platformName,
          url: normalizedUrl
        });
      }

      if (isGithub && !projectsList.some(p => p.url.toLowerCase() === normalizedUrl.toLowerCase())) {
        projectsList.push({
          id: `proj-csv-${Date.now()}-${idx}`,
          name: `${name || 'Geliştirici'} GitHub Portfolyosu`,
          role: 'Yazılım Geliştirici',
          url: normalizedUrl,
          description: 'Halka açık açık kaynak kodlu projelerim, kütüphanelerim ve çalışmalarım.',
          technologies: 'Git, GitHub, Open Source'
        });
      }
    });

    extractedMessengers.forEach((link, idx) => {
      const normalizedUrl = link.url;
      const lowerLabel = link.label.toLowerCase();
      const platformName = lowerLabel.includes('skype') ? 'Skype' : lowerLabel.includes('slack') ? 'Slack' : link.label;

      if (!socialLinks.some(s => s.url.toLowerCase() === normalizedUrl.toLowerCase())) {
        socialLinks.push({
          id: `social-msg-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
          platform: platformName,
          url: normalizedUrl
        });
      }
    });

    if (twitterHandle && twitterHandle.trim()) {
      const cleanHandle = twitterHandle.trim();
      const twitterUrl = cleanHandle.startsWith('@') 
        ? `https://x.com/${cleanHandle.substring(1)}` 
        : cleanHandle.startsWith('http') ? cleanHandle : `https://x.com/${cleanHandle}`;
      
      if (!socialLinks.some(s => s.platform.toLowerCase() === 'twitter' || s.url.toLowerCase() === twitterUrl.toLowerCase())) {
        socialLinks.push({
          id: `social-tw-${Date.now()}`,
          platform: 'Twitter',
          url: twitterUrl
        });
      }
    }

    // Dynamic Heuristic Education Extraction
    const eduList: Education[] = [...currentData.educations];
    const combinedText = `${headline} ${summary} ${industry}`;
    const uniRegex = /(?:[A-ZÇĞİÖŞÜa-zçğıöşü']+\s*)+(University|Üniversitesi|Üniversitesi|Lisesi|Koleji|Okulu)/g;
    const uniMatches = combinedText.match(uniRegex);

    if (uniMatches) {
      uniMatches.forEach((schoolName, idx) => {
        const trimmedSchool = schoolName.trim();
        if (!eduList.some(e => e.school.toLowerCase() === trimmedSchool.toLowerCase())) {
          let fieldOfStudy = 'Öğrenim';
          const lowerText = combinedText.toLowerCase();

          if (lowerText.includes('bilgisayar mühendisliği') || lowerText.includes('computer engineering')) {
            fieldOfStudy = 'Bilgisayar Mühendisliği';
          } else if (lowerText.includes('yazılım mühendisliği') || lowerText.includes('software engineering')) {
            fieldOfStudy = 'Yazılım Mühendisliği';
          } else if (lowerText.includes('elektrik') || lowerText.includes('elektronik')) {
            fieldOfStudy = 'Elektrik-Elektronik Mühendisliği';
          } else if (lowerText.includes('makine mühendisliği') || lowerText.includes('mechanical engineering')) {
            fieldOfStudy = 'Makine Mühendisliği';
          } else if (lowerText.includes('işletme') || lowerText.includes('business administration')) {
            fieldOfStudy = 'İşletme';
          } else if (lowerText.includes('iktisat') || lowerText.includes('economics')) {
            fieldOfStudy = 'İktisat';
          } else if (lowerText.includes('endüstri mühendisliği') || lowerText.includes('industrial engineering')) {
            fieldOfStudy = 'Endüstri Mühendisliği';
          }

          eduList.push({
            id: `edu-extracted-${Date.now()}-${idx}`,
            school: trimmedSchool,
            degree: trimmedSchool.toLowerCase().includes('lise') ? 'Lise Mezunu' : 'Lisans',
            field: fieldOfStudy,
            location: location || 'Türkiye',
            startDate: 'Belirtilmedi',
            endDate: combinedText.toLowerCase().includes('öğrenci') || combinedText.toLowerCase().includes('student') || combinedText.toLowerCase().includes('öğrenci') ? 'Devam Ediyor' : 'Mezun',
            current: combinedText.toLowerCase().includes('öğrenci') || combinedText.toLowerCase().includes('student') || combinedText.toLowerCase().includes('öğrenci'),
            description: ''
          });
        }
      });
    }

    // Dynamic Heuristic Work Experience Extraction from Headline / Summary
    const workExpList: WorkExperience[] = [...currentData.workExperiences];
    let companyName = '';
    let roleName = '';

    const bunyeRegex = /([A-ZÇĞİÖŞÜa-zçğıöşü\d']+(?:\s+[A-ZÇĞİÖŞÜa-zçğıöşü\d']+){0,2})\s+(?:bünyesinde|bunesinde|firmasında|sirketinde|şirketinde)\s+([^|&]+)/i;
    const atRegex = /([^|&]+)\s+(?:at|@)\s+([A-ZÇĞİÖŞÜa-zçğıöşü\d']+(?:\s+[A-ZÇĞİÖŞÜa-zçğıöşü\d']+){0,2})/i;

    const bunyeM = headline.match(bunyeRegex);
    const atM = headline.match(atRegex);

    if (bunyeM) {
      companyName = bunyeM[1].trim();
      roleName = bunyeM[2].trim();
    } else if (atM) {
      roleName = atM[1].trim();
      companyName = atM[2].trim();
    } else {
      const segments = headline.split(/[|•,]/).map(s => s.trim()).filter(s => s.length > 3);
      const activeRoles = segments.filter(s => 
        !s.toLowerCase().includes('üniversite') && 
        !s.toLowerCase().includes('okul') && 
        !s.toLowerCase().includes('lise') && 
        !s.toLowerCase().includes('öğrenci') && 
        !s.toLowerCase().includes('ogrenci') && 
        !s.toLowerCase().includes('student')
      );
      if (activeRoles.length > 0) {
        roleName = activeRoles[0];
        companyName = industry || 'Serbest Çalışan';
      }
    }

    const lowerHeadline = headline.toLowerCase();
    const isStudent = lowerHeadline.includes('öğrenci') || 
                      lowerHeadline.includes('student') || 
                      lowerHeadline.includes('ogrenci') || 
                      lowerHeadline.includes('okulda') || 
                      lowerHeadline.includes('üniversite') || 
                      lowerHeadline.includes('university');

    if (roleName && companyName && !isStudent) {
      const exists = workExpList.some(w => w.role.toLowerCase() === roleName.toLowerCase() && w.company.toLowerCase() === companyName.toLowerCase());
      if (!exists) {
        workExpList.push({
          id: `exp-extracted-${Date.now()}`,
          company: companyName,
          role: roleName,
          location: location || 'Türkiye',
          startDate: 'Belirtilmedi',
          endDate: 'Devam Ediyor',
          current: true,
          description: ''
        });
      }
    }

    // Dynamic Heuristic Skills Extraction
    const targetCategoryTitle = 'Ayrıştırılan Yetkinlikler';
    const existingCategoryIdx = currentData.skills.findIndex(c => c.categoryName === targetCategoryTitle);
    
    const techKeywords = [
      'Python', 'SQL', 'JavaScript', 'TypeScript', 'React', 'HTML', 'CSS', 'C#', 'C++', 'Java', 
      'Node.js', 'Next.js', 'PHP', 'Ruby', 'Go', 'Rust', 'Flutter', 'Swift', 'Kotlin', 'Vue',
      'Yapay Zeka', 'Makine Öğrenmesi', 'Veri Analitiği', 'Deep Learning', 'NLP', 'Data Science', 
      'Machine Learning', 'Tableau', 'Power BI', 'Git', 'GitHub', 'AWS', 'Docker', 'Kubernetes',
      'Firebase', 'MongoDB', 'PostgreSQL', 'CPA', 'Bütçe Planlama', 'Risk Yönetimi', 'Mali İşler',
      'Finansal Raporlama', 'Takım Lideri', 'Proje Yönetimi', 'Agile', 'Scrum', 'Excel', 'Office'
    ];

    const matchedSkills: Skill[] = [];
    techKeywords.forEach(skillKeyword => {
      const escapedKeyword = skillKeyword.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      const keywordRegex = new RegExp(`\\b${escapedKeyword}\\b`, 'i');
      if (keywordRegex.test(combinedText)) {
        matchedSkills.push({
          name: skillKeyword,
          level: 4
        });
      }
    });

    let newSkillsList = [...currentData.skills];
    if (matchedSkills.length > 0) {
      if (existingCategoryIdx !== -1) {
        const existingCategory = newSkillsList[existingCategoryIdx];
        const existingSkillNames = existingCategory.skills.map(s => s.name.toLowerCase());
        const uniqueNewSkills = matchedSkills.filter(s => !existingSkillNames.includes(s.name.toLowerCase()));
        
        newSkillsList[existingCategoryIdx] = {
          ...existingCategory,
          skills: [...existingCategory.skills, ...uniqueNewSkills]
        };
      } else {
        newSkillsList.push({
          id: `skill-cat-extracted-${Date.now()}`,
          categoryName: targetCategoryTitle,
          skills: matchedSkills
        });
      }
    }

    const patch: Partial<CVData> = {
      personalInfo: {
        ...currentData.personalInfo,
        name: name || currentData.personalInfo.name,
        email: row['email address'] || row['email'] || row['e-posta adresi'] || row['e-posta'] || row['eposta'] || currentData.personalInfo.email,
        phone: row['phone numbers'] || row['phone'] || row['telefon numaraları'] || row['telefon numarasi'] || row['telefon'] || currentData.personalInfo.phone,
        location: location || currentData.personalInfo.location,
        summary: summary || currentData.personalInfo.summary,
        title: cleanedTitle || currentData.personalInfo.title,
        website: primaryWebsite || currentData.personalInfo.website,
        photoVisible: currentData.personalInfo.photoVisible,
        avatarUrl: currentData.personalInfo.avatarUrl
      },
      workExperiences: workExpList,
      socialLinks,
      projects: projectsList,
      educations: eduList,
      skills: newSkillsList
    };

    return {
      type: 'profile',
      message: `${name || 'Özgeçmiş sahibi'} için profil bilgileriyle birlikte eğitim, beceriler, projeler ve sosyal ağ bağlantıları akıllıca ayrıştırıldı!`,
      patch
    };
  }

  if (isExperience) {
    const expList: WorkExperience[] = objects.map((obj, idx) => {
      const company = obj['company name'] || obj['company'] || obj['şirket adı'] || obj['sirket adi'] || obj['şirket'] || obj['sirket'] || '';
      const role = obj['title'] || obj['role'] || obj['job title'] || obj['unvan'] || obj['rol'] || '';
      const start = obj['started on'] || obj['start date'] || obj['başlangıç tarihi'] || obj['baslangic tarihi'] || obj['başlangıç'] || obj['baslangic'] || '';
      const end = obj['finished on'] || obj['end date'] || obj['bitiş tarihi'] || obj['bitis tarihi'] || obj['bitiş'] || obj['bitis'] || 'Devam Ediyor';
      const location = obj['location'] || obj['konum'] || '';
      const description = obj['description'] || obj['açıklama'] || obj['aciklama'] || '';

      return {
        id: `exp-csv-${Date.now()}-${idx}`,
        company,
        role,
        location,
        startDate: start,
        endDate: end,
        current: end.toLowerCase().includes('devam') || end.toLowerCase().includes('present') || end === '' || end.toLowerCase().includes('şu an') || end.toLowerCase().includes('su an'),
        description
      };
    });

    return {
      type: 'experience',
      message: `LinkedIn Positions.csv dosyasından ${expList.length} adet iş deneyimi başarıyla ayrıştırıldı ve CV'nize eklendi!`,
      patch: {
        workExperiences: [...currentData.workExperiences, ...expList]
      }
    };
  }

  if (isEducation) {
    const eduList: Education[] = objects.map((obj, idx) => {
      const school = obj['school name'] || obj['school'] || obj['okul adı'] || obj['okul adi'] || obj['okul'] || '';
      const degName = obj['degree name'] || obj['degree'] || obj['derece adı'] || obj['derece adi'] || obj['derece'] || '';
      const fields = obj['fields of study'] || obj['öğrenim alanları'] || obj['ogrenim alanlari'] || obj['bölüm'] || obj['bolum'] || '';
      const degree = degName || 'Mezun';
      const start = obj['started on'] || obj['start date'] || obj['başlangıç tarihi'] || obj['baslangic tarihi'] || '';
      const end = obj['finished on'] || obj['end date'] || obj['bitiş tarihi'] || obj['bitis tarihi'] || '';
      const location = obj['location'] || obj['konum'] || '';

      return {
        id: `edu-csv-${Date.now()}-${idx}`,
        school,
        degree,
        field: fields,
        location,
        startDate: start,
        endDate: end,
        current: !end || end.toLowerCase().includes('devam') || end.toLowerCase().includes('present'),
        description: ''
      };
    });

    return {
      type: 'education',
      message: `LinkedIn Education.csv dosyasından ${eduList.length} eğitim kaydı başarıyla ayrıştırıldı ve CV'nize eklendi!`,
      patch: {
        educations: [...currentData.educations, ...eduList]
      }
    };
  }

  if (isSkills) {
    const skillNames = objects.map(obj => 
      obj['name'] || obj['skill'] || obj['skill name'] || obj['ad'] || obj['adi'] || obj['yetenek'] || obj['yetenek adı'] || obj['yetenek adi'] || obj['beceri'] || obj['yetenekler']
    ).filter(Boolean);

    if (skillNames.length > 0) {
      const targetCategoryTitle = 'LinkedIn Yetkinlikleri';
      const existingCategory = currentData.skills.find(c => c.categoryName === targetCategoryTitle);

      let newSkillsList: SkillCategory[];
      if (existingCategory) {
        // Merge with existing skills in this category
        const existingSkillNames = existingCategory.skills.map(s => s.name);
        const uniqueNewNames = skillNames.filter(name => !existingSkillNames.includes(name));
        const addedSkills: Skill[] = uniqueNewNames.map(name => ({ name, level: 5 }));

        newSkillsList = currentData.skills.map(c => {
          if (c.categoryName === targetCategoryTitle) {
            return {
              ...c,
              skills: [...c.skills, ...addedSkills]
            };
          }
          return c;
        });
      } else {
        newSkillsList = [
          ...currentData.skills,
          {
            id: `skill-cat-csv-${Date.now()}`,
            categoryName: targetCategoryTitle,
            skills: skillNames.map(name => ({ name, level: 5 }))
          }
        ];
      }

      return {
        type: 'skills',
        message: `LinkedIn Skills.csv dosyasından ${skillNames.length} yetkinlik başarıyla ayrıştırıldı!`,
        patch: {
          skills: newSkillsList
        }
      };
    }
  }

  // Fallback: If it's a generic CSV but has some columns, let's treat it as a generic comma value list
  const fallbackResult = parsePlainTextWithRegex(text, currentData);
  if (fallbackResult.type !== 'unknown') {
    return fallbackResult;
  }

  return {
    type: 'unknown',
    message: `Belirtilen CSV kolonları otomatik olarak eşleştirilemedi ve metin analizinde profil bilgisi bulunamadı. Kolonlar: ${headLineKeys.join(', ')}`,
    patch: {}
  };
}

/**
 * Falling back on plain text parsing using regex for LinkedIn profile copies
 */
export function parsePlainTextWithRegex(text: string, currentData: CVData): SmartImportResult {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    return {
      type: 'unknown',
      message: 'İçerik boş veya okunamaz durumda.',
      patch: {}
    };
  }

  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;
  // Matches international and local Turkish numbers e.g. +90 532 ... or 0532 ...
  const phoneRegex = /(?:\+?90|0)?\s?5\d{2}\s?\d{3}\s?\d{2}\s?\d{2}|\+?\d{1,3}[- .]?[-(]?\d{3}[)]?[- .]?\d{3}[- .]?\d{4}/i;
  const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_%\-]+/i;
  const generalUrlRegex = /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/i;

  let name = '';
  let email = '';
  let phone = '';
  let location = '';
  let summary = '';
  let title = '';
  let website = '';

  // 1. Search for contacts in all lines
  for (const line of lines) {
    if (!email) {
      const emailMatch = line.match(emailRegex);
      if (emailMatch) email = emailMatch[0];
    }
    if (!phone) {
      const phoneMatch = line.match(phoneRegex);
      if (phoneMatch) phone = phoneMatch[0];
    }
    if (!website) {
      const liMatch = line.match(linkedinRegex);
      if (liMatch) {
         website = liMatch[0];
      } else {
         const genMatch = line.match(generalUrlRegex);
         if (genMatch && !genMatch[0].includes('@') && !genMatch[0].toLowerCase().includes('email')) {
           website = genMatch[0];
         }
      }
    }
  }

  // 2. Extract Name and Title from the first few non-header lines
  for (let i = 0; i < Math.min(lines.length, 12); i++) {
    const line = lines[i];
    if (line.toLowerCase().includes('page') || line.toLowerCase().includes('sayfa') || line.toLowerCase().includes('linkedin') || emailRegex.test(line) || phoneRegex.test(line)) {
      continue;
    }
    const hasCapitalLetter = /[A-ZÇĞİÖŞÜ]/.test(line);
    const hasDigits = /\d/.test(line);
    const hasSymbols = /[\/@:,]/.test(line);
    const wordCount = line.split(/\s+/).length;
    if (hasCapitalLetter && !hasDigits && !hasSymbols && wordCount >= 2 && wordCount <= 4 && !name) {
      name = line;
      // Assign direct next line as Title if valid
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        if (nextLine.length > 3 && nextLine.length < 100 && !nextLine.includes('@') && !/\d{4}/.test(nextLine)) {
          title = nextLine;
        }
      }
      break;
    }
  }

  // Fallback label queries
  if (!name) {
    for (const line of lines) {
      const match = line.match(/^(?:name|ad soyad|adı soyadı|fullName|adınız|profile of)\s*:\s*(.+)$/i);
      if (match && match[1]) {
        name = match[1].trim();
        break;
      }
    }
  }

  // 3. Find address/location
  for (const line of lines) {
    const locMatch = line.match(/^(?:location|address|konum|adres|yer|şehir|sehir)\s*:\s*(.+)$/i);
    if (locMatch && locMatch[1]) {
      location = locMatch[1].trim();
    } else if (line.toLowerCase().includes('istanbul') || line.toLowerCase().includes('ankara') || line.toLowerCase().includes('izmir') || line.toLowerCase().includes('turkey') || line.toLowerCase().includes('türkiye')) {
      if (line.length < 50 && !location) {
        location = line;
      }
    }
  }

  // 4. Find Summary
  let summaryStartIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (line === 'summary' || line === 'ozet' || line === 'özet' || line === 'about' || line === 'hakkında' || line === 'hakkimda' || line === 'özgeçmiş' || line === 'ozgecmis') {
      summaryStartIndex = i + 1;
      break;
    }
  }

  if (summaryStartIndex !== -1 && summaryStartIndex < lines.length) {
    const summaryLines = [];
    for (let i = summaryStartIndex; i < Math.min(summaryStartIndex + 4, lines.length); i++) {
      const line = lines[i];
      if (['deneyim', 'experience', 'eğitim', 'education', 'yetenekler', 'skills', 'projeler', 'projects'].some(s => line.toLowerCase().includes(s))) {
        break;
      }
      summaryLines.push(line);
    }
    summary = summaryLines.join(' ');
  }

  if (!name && !email && !phone && !summary && !title) {
    return {
      type: 'unknown',
      message: 'Dosya içeriği geçerli bir LinkedIn formatı (CSV, JSON veya Metin) ile eşleşmedi.',
      patch: {}
    };
  }

  const patch: Partial<CVData> = {
    personalInfo: {
      ...currentData.personalInfo,
      name: name || currentData.personalInfo.name,
      title: title || currentData.personalInfo.title,
      email: email || currentData.personalInfo.email,
      phone: phone || currentData.personalInfo.phone,
      location: location || currentData.personalInfo.location,
      summary: summary || currentData.personalInfo.summary,
      website: website || currentData.personalInfo.website,
      photoVisible: currentData.personalInfo.photoVisible,
      avatarUrl: currentData.personalInfo.avatarUrl
    }
  };

  return {
    type: 'profile',
    message: `Ayrıştırılan Profil: ${name || 'Gizli profil'} bilgileri başarıyla içe aktarıldı!`,
    patch
  };
}

