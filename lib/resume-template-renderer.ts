// C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\lib\resume-template-renderer.ts

import { ResumeData, Skill } from "@/types/resume";
import { enhanceTemplateCss } from "@/lib/resume-template-wrapper";

// --- TEMPLATE UUIDs ---
const TEMPLATE_IDS = {
    PROFESSIONAL: 'e3f065c8-de33-455e-b198-596c32630c39',
    BURGUNDY_CV: '600e19da-bab2-4851-a5da-0444869e3524',
    GREEN_ACCENT: '0ac3bcf7-5412-4c02-b4d2-00f6b3295e9e',
    MODERN_RESUME: '47ca7196-6d0f-4067-a387-ec6f9e29132a',
    PURPLE_SIDEBAR: '47ca7196-6d0f-4067-a387-ec6f9e29132a', // Using duplicate UUID as provided
    MINIMALIST_TECH: '762c29fb-21b5-453e-a273-e196aacb6151',
    BLUE_SIDEBAR: '7c540faa-899e-461e-bde6-073f03925908',
    MINIMAL_CLEAN: '7f7c873a-a3de-48b8-9e7a-157f0cbe5cc6',
    TERRACOTTA_ACCENT: 'b2338331-79a7-47fe-9221-351e50985a54',
    SAGE_GREEN: 'c4f0f16e-232e-4119-af30-143e14d1e099',
    HEALTHCARE_PROFESSIONAL: 'c80d7eee-9e08-4a99-9ef3-262efef2066f',
    ORANGE_SIDEBAR: 'd8312712-48f6-4e9a-9b17-75ddc6586b7d'
};

// --- HELPER FUNCTIONS ---
const isHardSkill = (skill: Skill): boolean => {
    const hardSkillCategories = ['technical', 'programming languages', 'tools', 'software', 'frameworks', 'databases', 'hard skills'];
    return hardSkillCategories.includes(skill.category?.toLowerCase() || '');
};

const isSoftSkill = (skill: Skill): boolean => {
    const softSkillCategories = ['soft skills', 'interpersonal', 'communication'];
    return softSkillCategories.includes(skill.category?.toLowerCase() || '');
};

const getStarCount = (level: string): number => {
    const levelMap: Record<string, number> = { "Beginner": 1, "Intermediate": 2, "Advanced": 3, "Expert": 4 };
    return levelMap[level] || 2;
};

const getProgressPercent = (level: string): number => {
    const levelMap: Record<string, number> = { "Beginner": 25, "Intermediate": 50, "Advanced": 75, "Expert": 100 };
    return levelMap[level] || 50;
};

function renderAchievements(achievements: string[] | undefined): string {
    if (!achievements || achievements.length === 0) return "";
    let list = '<ul class="achievements-list">';
    for (const achievement of achievements) { list += `<li>${achievement}</li>`; }
    list += "</ul>";
    return list;
}

// --- TEMPLATE-AWARE SECTION RENDERERS ---

function renderSummarySection(resume: ResumeData, templateId: string): string {
    if (!resume.personalInfo.summary) return "";
    let heading = "Professional Summary";
    switch (templateId) {
        case TEMPLATE_IDS.BURGUNDY_CV:
        case TEMPLATE_IDS.PURPLE_SIDEBAR:
        case TEMPLATE_IDS.BLUE_SIDEBAR:
        case TEMPLATE_IDS.MINIMAL_CLEAN:
        case TEMPLATE_IDS.HEALTHCARE_PROFESSIONAL:
            heading = "Summary"; break;
        case TEMPLATE_IDS.GREEN_ACCENT:
        case TEMPLATE_IDS.MODERN_RESUME:
        case TEMPLATE_IDS.ORANGE_SIDEBAR:
            heading = "PROFESSIONAL SUMMARY"; break;
        case TEMPLATE_IDS.MINIMALIST_TECH:
            heading = "PROFILE"; break;
    }
    const sectionClass = (templateId === TEMPLATE_IDS.TERRACOTTA_ACCENT || templateId === TEMPLATE_IDS.SAGE_GREEN) ? 'professional-summary' : 'summary-section';
    const headingTag = (templateId === TEMPLATE_IDS.TERRACOTTA_ACCENT || templateId === TEMPLATE_IDS.SAGE_GREEN) ? '' : `<h2 class="section-heading">${heading}</h2>`;
    
    return `<section class="${sectionClass}">${headingTag}<div class="section-content"><p>${resume.personalInfo.summary}</p></div></section>`;
}

function renderWorkExperienceSection(resume: ResumeData, templateId: string): string {
    if (!resume.workExperience || resume.workExperience.length === 0) return "";
    let heading = "Work Experience";
    switch(templateId) {
        case TEMPLATE_IDS.GREEN_ACCENT:
        case TEMPLATE_IDS.MODERN_RESUME:
        case TEMPLATE_IDS.ORANGE_SIDEBAR:
            heading = "EXPERIENCE"; break;
        case TEMPLATE_IDS.MINIMALIST_TECH:
            heading = "EMPLOYMENT HISTORY"; break;
        case TEMPLATE_IDS.TERRACOTTA_ACCENT:
        case TEMPLATE_IDS.SAGE_GREEN:
            heading = "Career Experience"; break;
    }

    let html = `<section class="experience-section"><h2 class="section-heading">${heading}</h2><div class="section-content">`;
    for (const exp of resume.workExperience) {
        switch (templateId) {
            case TEMPLATE_IDS.GREEN_ACCENT:
                html += `<div class="experience-item"><div class="experience-header"><h3 class="job-company-location">${exp.company}${exp.location ? `, ${exp.location}` : ''}</h3></div><h4 class="job-title">${exp.position}</h4><div class="experience-date">${exp.startDate} - ${exp.isOngoing ? "Present" : exp.endDate || ""}</div><div class="job-description">${renderAchievements(exp.achievements)}</div></div>`;
                break;
            case TEMPLATE_IDS.ORANGE_SIDEBAR:
                 html += `<div class="experience-item"><div class="experience-header"><h4 class="job-title">${exp.position}</h4><span class="experience-date">${exp.startDate} - ${exp.isOngoing ? "Present" : exp.endDate || ""}</span></div><p class="company">${exp.company}${exp.location ? `, ${exp.location}` : ''}</p>${renderAchievements(exp.achievements)}</div>`;
                break;
            default:
                html += `<div class="experience-item"><div class="experience-header"><div class="job-title-company"><h3 class="job-title">${exp.position}</h3><div class="company">${exp.company}${exp.location ? `, ${exp.location}` : ''}</div></div><div class="experience-date">${exp.startDate} - ${exp.isOngoing ? "Present" : exp.endDate || ""}</div></div>${exp.description ? `<p class="job-description">${exp.description}</p>` : ''}${renderAchievements(exp.achievements)}</div>`;
        }
    }
    html += `</div></section>`;
    return html;
}

function renderEducationSection(resume: ResumeData, templateId: string): string {
    if (!resume.education || resume.education.length === 0) return "";
    let heading = "Education";
    if ([TEMPLATE_IDS.GREEN_ACCENT, TEMPLATE_IDS.MODERN_RESUME, TEMPLATE_IDS.MINIMALIST_TECH, TEMPLATE_IDS.ORANGE_SIDEBAR].includes(templateId)) heading = "EDUCATION";
    
    let html = `<section class="education-section"><h2 class="section-heading">${heading}</h2><div class="section-content">`;
    for (const edu of resume.education) {
         switch (templateId) {
            case TEMPLATE_IDS.GREEN_ACCENT:
                html += `<div class="education-item"><div class="education-year">${edu.startDate} - ${edu.isOngoing ? "Present" : edu.endDate || ""}</div><h3 class="institution">${edu.institution}</h3><div class="degree">${edu.degree}${edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ''}</div></div>`;
                break;
             case TEMPLATE_IDS.BURGUNDY_CV:
                html += `<div class="education-item"><div class="education-header"><div class="degree-institution"><h3 class="degree">${edu.degree}${edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ''}</h3><div class="institution-location">${edu.institution}</div></div><div class="education-date">${edu.startDate} - ${edu.isOngoing ? "Present" : edu.endDate || ""}</div></div></div>`;
                break;
            default:
                html += `<div class="education-item"><div class="education-header"><div class="degree-institution"><h3 class="degree">${edu.degree}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ""}</h3><div class="institution">${edu.institution}</div></div><div class="education-date">${edu.startDate} - ${edu.isOngoing ? "Present" : edu.endDate || ""}</div></div>${renderAchievements(edu.achievements)}</div>`;
         }
    }
    html += `</div></section>`;
    return html;
}

function renderSkillsSection(resume: ResumeData, templateId: string, type: 'hard' | 'soft' | 'all'): string {
    let skills = resume.skills || [];
    if (type === 'hard') skills = skills.filter(isHardSkill);
    if (type === 'soft') skills = skills.filter(isSoftSkill);
    if (skills.length === 0) return "";

    let heading = "Skills";
    if (type === 'hard') heading = "Hard Skills";
    if (type === 'soft') heading = "Soft Skills";
    
    switch(templateId) {
        case TEMPLATE_IDS.GREEN_ACCENT:
        case TEMPLATE_IDS.MODERN_RESUME:
        case TEMPLATE_IDS.ORANGE_SIDEBAR:
            heading = "CORE QUALIFICATIONS"; break;
        case TEMPLATE_IDS.TERRACOTTA_ACCENT:
            heading = "Technical Proficiencies"; break;
        case TEMPLATE_IDS.MINIMAL_CLEAN:
            if (type === 'all') heading = "Hard Skills"; break;
    }

    let html = `<section class="skills-section"><h2 class="section-heading">${heading}</h2><div class="section-content">`;
    let listContent = '';

    for (const skill of skills) {
        let visualIndicator = '';
        const skillLevel = skill.level || 'Intermediate';

        if ([TEMPLATE_IDS.HEALTHCARE_PROFESSIONAL, TEMPLATE_IDS.MINIMALIST_TECH].includes(templateId)) {
            const percent = getProgressPercent(skillLevel);
            visualIndicator = `<div class="skill-bar-container"><div class="skill-bar" style="width:${percent}%"></div></div>`;
            listContent += `<div class="skill-item"><div class="skill-name">${skill.name}</div>${visualIndicator}</div>`;
        } else if ([TEMPLATE_IDS.BLUE_SIDEBAR, TEMPLATE_IDS.PURPLE_SIDEBAR].includes(templateId)) {
            const filledDots = '●'.repeat(getStarCount(skillLevel));
            const emptyDots = '○'.repeat(4 - getStarCount(skillLevel));
            visualIndicator = `<div class="skill-dots">${filledDots}${emptyDots}</div>`;
            listContent += `<li class="skill-item"><span class="skill-name">${skill.name}</span>${visualIndicator}</li>`;
        } else {
            listContent += `<li class="skill-item">${skill.name}</li>`;
        }
    }
    
    if ([TEMPLATE_IDS.HEALTHCARE_PROFESSIONAL, TEMPLATE_IDS.MINIMALIST_TECH].includes(templateId)) {
        html += listContent; // These templates use divs, not a <ul>
    } else if ([TEMPLATE_IDS.PROFESSIONAL, TEMPLATE_IDS.MINIMAL_CLEAN, TEMPLATE_IDS.TERRACOTTA_ACCENT].includes(templateId)) {
         html += `<div class="skills-list-text">${skills.map(s => `<span class="skill-item-text">${s.name}</span>`).join(', ')}</div>`;
    } else {
        html += `<ul class="skills-list">${listContent}</ul>`;
    }
    
    html += `</div></section>`;
    return html;
}

function renderLanguagesSection(resume: ResumeData, templateId: string): string {
    if (!resume.languages || resume.languages.length === 0) return "";
    let heading = "Languages";
    if ([TEMPLATE_IDS.GREEN_ACCENT, TEMPLATE_IDS.MODERN_RESUME, TEMPLATE_IDS.MINIMALIST_TECH, TEMPLATE_IDS.ORANGE_SIDEBAR, TEMPLATE_IDS.HEALTHCARE_PROFESSIONAL].includes(templateId)) heading = "LANGUAGES";

    let html = `<section class="languages-section"><h2 class="section-heading">${heading}</h2><div class="section-content"><ul>`;
    for (const lang of resume.languages) {
        html += `<li>${lang.name} - ${lang.proficiency}</li>`;
    }
    html += `</ul></div></section>`;
    return html;
}

function renderCertificationsSection(resume: ResumeData, templateId: string): string {
    if (!resume.certifications || resume.certifications.length === 0) return "";
    let html = `<section class="certifications-section"><h2 class="section-heading">Certifications</h2><div class="section-content">`;
    for (const cert of resume.certifications) {
        html += `<div class="cert-item">${cert.name} - ${cert.issuer} (${cert.date})</div>`;
    }
    html += `</div></section>`;
    return html;
}

// Main function to assemble the template
export function renderResumeTemplate(template: any, resume: ResumeData): string {
    try {
        let html = template.htmlContent;
        if (typeof html !== "string") throw new Error("Template HTML missing.");

        // Basic replacements
        html = html.replace(/\{\{name\}\}/g, `${resume.personalInfo.firstName} ${resume.personalInfo.lastName}`);
        html = html.replace(/\{\{email\}\}/g, resume.personalInfo.contact.email || "");
        html = html.replace(/\{\{phone\}\}/g, resume.personalInfo.contact.phone || "");
        html = html.replace(/\{\{address\}\}/g, resume.personalInfo.contact.location || "");
        html = html.replace(/\{\{linkedin\}\}/g, resume.personalInfo.contact.linkedIn || "");
        html = html.replace(/\{\{title\}\}/g, resume.personalInfo.title || "");
        const currentYear = new Date().getFullYear();
        html = html.replace(/\{\{copyright\}\}/g, `© ${currentYear} ${resume.personalInfo.firstName} ${resume.personalInfo.lastName}`);
        html = html.replace(/\{\{photo\}\}/g, resume.personalInfo.image ? `<img src="${resume.personalInfo.image}" alt="Profile photo" class="profile-photo">` : '<div class="photo-placeholder"></div>');

        // Section replacements
        html = html.replace(/\{\{professional-summary\}\}/g, renderSummarySection(resume, template.id));
        html = html.replace(/\{\{work-experience\}\}/g, renderWorkExperienceSection(resume, template.id));
        html = html.replace(/\{\{education\}\}/g, renderEducationSection(resume, template.id));
        html = html.replace(/\{\{languages\}\}/g, renderLanguagesSection(resume, template.id));
        html = html.replace(/\{\{certifications\}\}/g, renderCertificationsSection(resume, template.id));
        
        // Skill replacements
        html = html.replace(/\{\{skills\}\}/g, renderSkillsSection(resume, template.id, 'all'));
        html = html.replace(/\{\{hard-skills\}\}/g, renderSkillsSection(resume, template.id, 'hard'));
        html = html.replace(/\{\{soft-skills\}\}/g, renderSkillsSection(resume, template.id, 'soft'));
        
        // Cleanup unused placeholders
        html = html.replace(/\{\{[^}]+\}\}/g, '');

        // This is the corrected part. We no longer inject any of our own default styles.
        // We only use the CSS provided by the template itself, ensuring a perfect match.
        const fullHtml = `
          <!DOCTYPE html><html><head><meta charset="UTF-8"><title>${resume.personalInfo.firstName} Resume</title>
          <style>
            ${template.cssContent}
          </style></head><body>${html}</body></html>`;
        return fullHtml;

    } catch (error) {
        console.error("Error rendering resume template:", error);
        return `<html><body><p>Error rendering template.</p></body></html>`;
    }
}