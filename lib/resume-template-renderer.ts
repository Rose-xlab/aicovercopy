// lib/resume-template-renderer.ts
import { ResumeData, Skill, Hobby, ResumeTemplate } from "@/types/resume";
import { wrapTemplateWithMargins, enhanceTemplateCss } from '@/lib/resume-template-wrapper';

/**
 * Render a resume template with the provided resume data
 * @param template The resume template object (expects properties like htmlContent, cssContent)
 * @param resume The resume data
 * @returns HTML string of the rendered template
 */
export function renderResumeTemplate(template: any, resume: ResumeData): string {
  try {
    // Access camelCase properties, as confirmed by console logs of the 'template' object during export.
    let html = template.htmlContent; 
    const css = template.cssContent;

    // Robust check for html before trying to use string methods
    if (typeof html !== 'string') {
      console.error("Template HTML content is missing, null, or not a string. Template data (from renderer):", JSON.stringify(template, null, 2));
      // Provide a fallback HTML. If this happens, it means the 'htmlContent' property on the received 'template' object
      // was not a string (e.g., undefined, null, or another type).
      html = "<p>Error: Template content is missing or invalid. Please check the template data.</p>";
    } else if (html.indexOf('<') !== -1) {
      // Only perform substring if '<' exists. This assumes the goal is to remove any leading non-HTML text.
      html = html.substring(html.indexOf('<'));
    } else if (html.trim() !== '') {
      // If html is a non-empty string but does not contain '<', log a warning.
      // Depending on requirements, you might want to wrap it in <p> or handle differently.
      console.warn("Template HTML content does not contain '<'. Substring operation skipped. Original HTML:", html);
    }
    // If html was initially an empty string or only whitespace, it will remain so, which is fine.

    // Replace basic personal information
    html = html.replace(/{{name}}/g, `${resume.personalInfo.firstName} ${resume.personalInfo.lastName}`);
    html = html.replace(/{{first-name}}/g, resume.personalInfo.firstName);
    html = html.replace(/{{last-name}}/g, resume.personalInfo.lastName);
    html = html.replace(/{{title}}/g, resume.personalInfo.title);
    html = html.replace(/{{email}}/g, resume.personalInfo.contact.email);
    html = html.replace(/{{phone}}/g, resume.personalInfo.contact.phone || '');
    html = html.replace(/{{address}}/g, resume.personalInfo.contact.location || '');
    html = html.replace(/{{linkedin}}/g, resume.personalInfo.contact.linkedIn || '');
    html = html.replace(/{{website}}/g, resume.personalInfo.contact.website || '');
    html = html.replace(/{{summary}}/g, resume.personalInfo.summary || '');

    // Replace sections
    html = html.replace(/{{professional-summary}}/g, renderSummarySection(resume));
    html = html.replace(/{{work-experience}}/g, renderWorkExperienceSection(resume));
    html = html.replace(/{{education}}/g, renderEducationSection(resume));
    html = html.replace(/{{skills}}/g, renderSkillsSection(resume));
    html = html.replace(/{{projects}}/g, renderProjectsSection(resume));
    html = html.replace(/{{certifications}}/g, renderCertificationsSection(resume));
    html = html.replace(/{{languages}}/g, renderLanguagesSection(resume));

    // Add new sections
    html = html.replace(/{{hobbies}}/g, renderInterestsSection(resume));
    html = html.replace(/{{interests}}/g, renderInterestsSection(resume));
    html = html.replace(/{{internships}}/g, renderInternshipsSection(resume));
    html = html.replace(/{{references}}/g, renderReferencesSection(resume));
    html = html.replace(/{{custom-sections}}/g, renderCustomSections(resume));

    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    html = html.replace(/{{current-date}}/g, formattedDate);

    const enhancedCss = enhanceTemplateCss(typeof css === 'string' ? css : '');

    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${resume.personalInfo.firstName} ${resume.personalInfo.lastName} - Resume</title>
        <style>
          body { margin: 0; padding: 0; background-color: white; color: #333; font-family: Arial, Helvetica, sans-serif; line-height: 1.5; }
          .resume-container { box-sizing: border-box; max-width: 8.5in; margin: 0 auto; padding: 0.5in; background-color: white; }
          .section-heading { margin-top: 0.25in; margin-bottom: 0.125in; }
          .section-content { margin-bottom: 0.25in; }
          @media print {
            body { margin: 0; padding: 0; }
            .resume-container { padding: 0.5in; margin: 0; max-width: none; width: 100%; }
          }
          ${enhancedCss}
        </style>
      </head>
      <body>
        <div class="resume-container">
          ${html}
        </div>
      </body>
      </html>
    `;

    return fullHtml;
  } catch (error) {
    console.error("Error rendering resume template:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return `
      <!DOCTYPE html>
      <html>
      <body>
        <p>Error rendering resume template. Please try another template or contact support.</p>
        <p>Details: ${errorMessage.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
      </body>
      </html>
    `;
  }
}

// --- All helper functions (renderSummarySection, renderWorkExperienceSection, etc.) remain unchanged from your original file ---
// Ensure these functions correctly use properties from the 'resume: ResumeData' object (which is camelCase)

function renderSummarySection(resume: ResumeData): string {
  if (!resume.personalInfo.summary) {
    return '';
  }
  return `
    <div class="summary-section">
      <div class="section-content">
        <p>${resume.personalInfo.summary}</p>
      </div>
    </div>
  `;
}

function renderWorkExperienceSection(resume: ResumeData): string {
  if (!resume.workExperience || resume.workExperience.length === 0) {
    return '';
  }
  let experienceHTML = `
    <div class="experience-section">
      <div class="section-content">
  `;
  for (const experience of resume.workExperience) {
    experienceHTML += `
      <div class="experience-item">
        <div class="experience-header">
          <div class="job-title-company">
            <h3 class="job-title">${experience.position}</h3>
            <div class="company">${experience.company}</div>
          </div>
          <div class="experience-date">
            ${experience.startDate} - ${experience.isOngoing ? 'Present' : (experience.endDate || '')}
          </div>
        </div>
        ${experience.location ? `<div class="job-location">${experience.location}</div>` : ''}
        ${experience.description ? `<p class="job-description">${experience.description}</p>` : ''}
        ${renderAchievements(experience.achievements)}
      </div>
    `;
  }
  experienceHTML += `
      </div>
    </div>
  `;
  return experienceHTML;
}

function renderAchievements(achievements: string[] | undefined): string {
  if (!achievements || achievements.length === 0) {
    return '';
  }
  let achievementsHTML = '<ul class="achievements-list">';
  for (const achievement of achievements) {
    achievementsHTML += `<li>${achievement}</li>`;
  }
  achievementsHTML += '</ul>';
  return achievementsHTML;
}

function renderEducationSection(resume: ResumeData): string {
  if (!resume.education || resume.education.length === 0) {
    return '';
  }
  let educationHTML = `
    <div class="education-section">
      <div class="section-content">
  `;
  for (const education of resume.education) {
    educationHTML += `
      <div class="education-item">
        <div class="education-header">
          <div class="degree-institution">
            <h3 class="degree">${education.degree}${education.fieldOfStudy ? ` in ${education.fieldOfStudy}` : ''}</h3>
            <div class="institution">${education.institution}</div>
          </div>
          <div class="education-date">
            ${education.startDate} - ${education.isOngoing ? 'Present' : (education.endDate || '')}
          </div>
        </div>
        ${education.description ? `<p class="education-description">${education.description}</p>` : ''}
        ${education.achievements && education.achievements.length > 0 ? renderAchievements(education.achievements) : ''}
      </div>
    `;
  }
  educationHTML += `
      </div>
    </div>
  `;
  return educationHTML;
}

function renderSkillsSection(resume: ResumeData): string {
  if (!resume.skills || resume.skills.length === 0) {
    return '';
  }
  const skillsByCategory: Record<string, Skill[]> = {};
  for (const skill of resume.skills) {
    const category = skill.category || 'Other';
    if (!skillsByCategory[category]) {
      skillsByCategory[category] = [];
    }
    skillsByCategory[category].push(skill);
  }
  let skillsHTML = `
    <div class="skills-section">
      <div class="section-content">
  `;
  for (const [category, skills] of Object.entries(skillsByCategory)) {
    skillsHTML += `
      <div class="skill-category">
        <h3 class="category-heading">${category}</h3>
        <div class="skills-list">
    `;
    for (const skill of skills) {
      skillsHTML += `
        <div class="skill-item">
          <span class="skill-name">${skill.name}</span>
          ${skill.level ? `<span class="skill-level">${skill.level}</span>` : ''}
        </div>
      `;
    }
    skillsHTML += `
        </div>
      </div>
    `;
  }
  skillsHTML += `
      </div>
    </div>
  `;
  return skillsHTML;
}

function renderProjectsSection(resume: ResumeData): string {
  if (!resume.projects || resume.projects.length === 0) {
    return '';
  }
  let projectsHTML = `
    <div class="projects-section">
      <div class="section-content">
  `;
  for (const project of resume.projects) {
    projectsHTML += `
      <div class="project-item">
        <div class="project-header">
          <h3 class="project-name">${project.name}</h3>
          ${project.url ? `<a href="${project.url}" target="_blank" class="project-link">View Project</a>` : ''}
        </div>
        <p class="project-description">${project.description}</p>
        <div class="project-technologies">
          <span class="technologies-label">Technologies:</span>
          <span class="technologies-list">${project.technologies.join(', ')}</span>
        </div>
        ${project.achievements && project.achievements.length > 0 ? renderAchievements(project.achievements) : ''}
      </div>
    `;
  }
  projectsHTML += `
      </div>
    </div>
  `;
  return projectsHTML;
}

function renderCertificationsSection(resume: ResumeData): string {
  if (!resume.certifications || resume.certifications.length === 0) {
    return '';
  }
  let certificationsHTML = `
    <div class="certifications-section">
      <div class="section-content certifications-list">
  `;
  for (const certification of resume.certifications) {
    certificationsHTML += `
      <div class="certification-item">
        <h3 class="certification-name">${certification.name}</h3>
        <div class="certification-details">
          <span class="certification-issuer">${certification.issuer}</span>
          <span class="certification-date">${certification.date}</span>
          ${certification.expiryDate ? `<span class="certification-expiry">Expires: ${certification.expiryDate}</span>` : ''}
        </div>
        ${certification.url ? `<a href="${certification.url}" target="_blank" class="certification-link">View Certificate</a>` : ''}
      </div>
    `;
  }
  certificationsHTML += `
      </div>
    </div>
  `;
  return certificationsHTML;
}

function renderLanguagesSection(resume: ResumeData): string {
  if (!resume.languages || resume.languages.length === 0) {
    return '';
  }
  let languagesHTML = `
    <div class="languages-section">
      <div class="section-content languages-list">
  `;
  for (const language of resume.languages) {
    languagesHTML += `
      <div class="language-item">
        <span class="language-name">${language.name}</span>
        <span class="language-proficiency">${language.proficiency}</span>
      </div>
    `;
  }
  languagesHTML += `
      </div>
    </div>
  `;
  return languagesHTML;
}

function renderInterestsSection(resume: ResumeData): string {
  if (resume.interests && resume.interests.length > 0) {
    let interestsHTML = `
      <div class="hobbies-section">
        <div class="section-content">
    `;
    if (typeof resume.interests[0] === 'string') {
      interestsHTML += `
        <div class="hobbies-list">
          ${(resume.interests as string[]).map(hobby => `
            <span class="hobby-item">${hobby}</span>
          `).join(', ')}
        </div>
      `;
    } else {
      interestsHTML += `
        <div class="hobbies-list">
          ${(resume.interests as Hobby[]).map(hobby => `
            <div class="hobby-item">
              <h3 class="hobby-name">${hobby.name}</h3>
              ${hobby.description ? `<p class="hobby-description">${hobby.description}</p>` : ''}
            </div>
          `).join('')}
        </div>
      `;
    }
    interestsHTML += `
        </div>
      </div>
    `;
    return interestsHTML;
  }
  // @ts-ignore - Keep for backward compatibility
  if (resume.hobbies && resume.hobbies.length > 0) {
    let hobbiesHTML = `
      <div class="hobbies-section">
        <h2 class="section-heading">Hobbies & Interests</h2>
        <div class="section-content">
    `;
    // @ts-ignore
    if (typeof resume.hobbies[0] === 'string') {
      hobbiesHTML += `
        <div class="hobbies-list">
          ${
        // @ts-ignore
        (resume.hobbies as string[]).map(hobby => `
            <span class="hobby-item">${hobby}</span>
          `).join(', ')
        }
        </div>
      `;
    } else {
      hobbiesHTML += `
        <div class="hobbies-list">
          ${
        // @ts-ignore
        (resume.hobbies as Hobby[]).map(hobby => `
            <div class="hobby-item">
              <h3 class="hobby-name">${hobby.name}</h3>
              ${hobby.description ? `<p class="hobby-description">${hobby.description}</p>` : ''}
            </div>
          `).join('')
        }
        </div>
      `;
    }
    hobbiesHTML += `
        </div>
      </div>
    `;
    return hobbiesHTML;
  }
  return '';
}

function renderInternshipsSection(resume: ResumeData): string {
  if (!resume.internships || resume.internships.length === 0) {
    return '';
  }
  let internshipsHTML = `
    <div class="internships-section">
      <div class="section-content">
  `;
  for (const internship of resume.internships) {
    internshipsHTML += `
      <div class="internship-item">
        <div class="internship-header">
          <div class="position-company">
            <h3 class="position">${internship.position}</h3>
            <div class="company">${internship.company}</div>
          </div>
          <div class="internship-date">
            ${internship.startDate} - ${internship.isOngoing ? 'Present' : (internship.endDate || '')}
          </div>
        </div>
        ${internship.location ? `<div class="internship-location">${internship.location}</div>` : ''}
        ${internship.description ? `<p class="internship-description">${internship.description}</p>` : ''}
        ${renderAchievements(internship.achievements)}
      </div>
    `;
  }
  internshipsHTML += `
      </div>
    </div>
  `;
  return internshipsHTML;
}

function renderReferencesSection(resume: ResumeData): string {
  if (resume.referenceText) {
    return `
      <div class="references-section">
        <div class="section-content">
          <p class="reference-statement">${resume.referenceText}</p>
        </div>
      </div>
    `;
  }
  if (!resume.references || resume.references.length === 0) {
    return '';
  }
  let referencesHTML = `
    <div class="references-section">
      <h2 class="section-heading">References</h2>
      <div class="section-content">
  `;
  const includedReferences = resume.references.filter(ref => ref.includeInResume);
  if (includedReferences.length === 0) {
    referencesHTML += `
      <p class="reference-statement">References available upon request</p>
    `;
  } else {
    for (const reference of includedReferences) {
      referencesHTML += `
        <div class="reference-item">
          <h3 class="reference-name">${reference.name}</h3>
          <div class="reference-position">${reference.position}${reference.company ? ` at ${reference.company}` : ''}</div>
          ${reference.relationship ? `<div class="reference-relationship">${reference.relationship}</div>` : ''}
          <div class="reference-contact">
            <span class="reference-email">${reference.email}</span>
            ${reference.phone ? `<span class="reference-phone"> | ${reference.phone}</span>` : ''}
          </div>
        </div>
      `;
    }
  }
  referencesHTML += `
      </div>
    </div>
  `;
  return referencesHTML;
}

function renderCustomSections(resume: ResumeData): string {
  if (!resume.customSections || resume.customSections.length === 0) {
    return '';
  }
  let customSectionsHTML = '';
  for (const section of resume.customSections) {
    customSectionsHTML += `
      <div class="custom-section">
        <h2 class="section-heading">${section.title}</h2>
        <div class="section-content">
          ${section.city || section.startDate || section.endDate ? `
          <div class="custom-section-header">
            ${section.city ? `<div class="custom-section-location">${section.city}</div>` : ''}
            ${section.startDate || section.endDate ? `
              <div class="custom-section-date">
                ${section.startDate || ''}${section.startDate && section.endDate ? ' - ' : ''}${section.endDate || ''}
              </div>
            ` : ''}
          </div>
          ` : ''}
          <div class="custom-content">
            ${formatCustomContent(section.content)}
          </div>
        </div>
      </div>
    `;
  }
  return customSectionsHTML;
}

function formatCustomContent(content: string): string {
  if (!content) return '';
  let formatted = content
    .split('\n\n')
    .filter(para => para.trim())
    .map(para => `<p>${para.trim()}</p>`)
    .join('');
  formatted = formatted.replace(/\n/g, '<br>');
  formatted = formatted.replace(/<p>[\s]*[-*][\s]+(.*?)<\/p>/g, '<ul><li>$1</li></ul>');
  formatted = formatted.replace(/<\/ul><ul>/g, '');
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
  return formatted;
}
