// lib/resume-template-renderer.ts
import { ResumeData, Skill, Hobby } from "@/types/resume";

/**
 * Render a resume template with the provided resume data
 * @param template The resume template
 * @param resume The resume data
 * @returns HTML string of the rendered template
 */
export function renderResumeTemplate(template: any, resume: ResumeData): string {
  try {
    // Replace template placeholders with resume data
    let html = template.html_content;
    
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
    html = html.replace(/{{hobbies}}/g, renderInterestsSection(resume)); // Keep the template variable as hobbies for backward compatibility
    html = html.replace(/{{interests}}/g, renderInterestsSection(resume)); // Also support interests placeholder
    html = html.replace(/{{internships}}/g, renderInternshipsSection(resume));
    html = html.replace(/{{references}}/g, renderReferencesSection(resume));
    html = html.replace(/{{custom-sections}}/g, renderCustomSections(resume));
    
    // Replace custom date placeholder with current date
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    html = html.replace(/{{current-date}}/g, formattedDate);
    
    // Add the template CSS
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${resume.personalInfo.firstName} ${resume.personalInfo.lastName} - Resume</title>
        <style>
          ${template.css_content}
        </style>
      </head>
      <body>
        ${html}
      </body>
      </html>
    `;
    
    return fullHtml;
  } catch (error) {
    console.error("Error rendering resume template:", error);
    return `
      <!DOCTYPE html>
      <html>
      <body>
        <p>Error rendering resume template. Please try another template or contact support.</p>
        <pre>${error}</pre>
      </body>
      </html>
    `;
  }
}

/**
 * Render the professional summary section
 */
function renderSummarySection(resume: ResumeData): string {
  if (!resume.personalInfo.summary) {
    return '';
  }
  
  return `
    <div class="summary-section">
      <h2 class="section-heading">Professional Summary</h2>
      <div class="section-content">
        <p>${resume.personalInfo.summary}</p>
      </div>
    </div>
  `;
}

/**
 * Render the work experience section
 */
function renderWorkExperienceSection(resume: ResumeData): string {
  if (!resume.workExperience || resume.workExperience.length === 0) {
    return '';
  }
  
  let experienceHTML = `
    <div class="experience-section">
      <h2 class="section-heading">Work Experience</h2>
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
            ${experience.startDate} - ${experience.isOngoing ? 'Present' : experience.endDate}
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

/**
 * Render achievements as a bulleted list
 */
function renderAchievements(achievements: string[]): string {
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

/**
 * Render the education section
 */
function renderEducationSection(resume: ResumeData): string {
  if (!resume.education || resume.education.length === 0) {
    return '';
  }
  
  let educationHTML = `
    <div class="education-section">
      <h2 class="section-heading">Education</h2>
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
            ${education.startDate} - ${education.isOngoing ? 'Present' : education.endDate}
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

/**
 * Render the skills section, grouped by category
 */
function renderSkillsSection(resume: ResumeData): string {
  if (!resume.skills || resume.skills.length === 0) {
    return '';
  }
  
  // Group skills by category
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
      <h2 class="section-heading">Skills</h2>
      <div class="section-content">
  `;
  
  // Render each category
  for (const [category, skills] of Object.entries(skillsByCategory)) {
    skillsHTML += `
      <div class="skill-category">
        <h3 class="category-heading">${category}</h3>
        <div class="skills-list">
    `;
    
    // Render skills in this category
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

/**
 * Render the projects section
 */
function renderProjectsSection(resume: ResumeData): string {
  if (!resume.projects || resume.projects.length === 0) {
    return '';
  }
  
  let projectsHTML = `
    <div class="projects-section">
      <h2 class="section-heading">Projects</h2>
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

/**
 * Render the certifications section
 */
function renderCertificationsSection(resume: ResumeData): string {
  if (!resume.certifications || resume.certifications.length === 0) {
    return '';
  }
  
  let certificationsHTML = `
    <div class="certifications-section">
      <h2 class="section-heading">Certifications</h2>
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

/**
 * Render the languages section
 */
function renderLanguagesSection(resume: ResumeData): string {
  if (!resume.languages || resume.languages.length === 0) {
    return '';
  }
  
  let languagesHTML = `
    <div class="languages-section">
      <h2 class="section-heading">Languages</h2>
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

/**
 * Render the interests/hobbies section
 */
function renderInterestsSection(resume: ResumeData): string {
  // Check for interests first (new field name)
  if (resume.interests && resume.interests.length > 0) {
    let interestsHTML = `
      <div class="hobbies-section">
        <h2 class="section-heading">Hobbies & Interests</h2>
        <div class="section-content">
    `;
    
    // Check if interests are structured objects or simple strings
    if (typeof resume.interests[0] === 'string') {
      // Simple strings rendering
      interestsHTML += `
        <div class="hobbies-list">
          ${(resume.interests as string[]).map(hobby => `
            <span class="hobby-item">${hobby}</span>
          `).join(', ')}
        </div>
      `;
    } else {
      // Structured interests rendering
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
  
  // For backward compatibility, check for hobbies as well (old field name)
  // @ts-ignore - hobbies field might exist in older data
  if (resume.hobbies && resume.hobbies.length > 0) {
    let hobbiesHTML = `
      <div class="hobbies-section">
        <h2 class="section-heading">Hobbies & Interests</h2>
        <div class="section-content">
    `;
    
    // Check if hobbies are structured objects or simple strings
    // @ts-ignore - hobbies field might exist in older data
    if (typeof resume.hobbies[0] === 'string') {
      // Simple strings rendering
      hobbiesHTML += `
        <div class="hobbies-list">
          ${
            // @ts-ignore - hobbies field might exist in older data
            (resume.hobbies as string[]).map(hobby => `
              <span class="hobby-item">${hobby}</span>
            `).join(', ')
          }
        </div>
      `;
    } else {
      // Structured hobbies rendering
      hobbiesHTML += `
        <div class="hobbies-list">
          ${
            // @ts-ignore - hobbies field might exist in older data
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
  
  // If neither interests nor hobbies exist, return empty string
  return '';
}

/**
 * Render the internships section
 */
function renderInternshipsSection(resume: ResumeData): string {
  if (!resume.internships || resume.internships.length === 0) {
    return '';
  }
  
  let internshipsHTML = `
    <div class="internships-section">
      <h2 class="section-heading">Internships</h2>
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
            ${internship.startDate} - ${internship.isOngoing ? 'Present' : internship.endDate}
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

/**
 * Render the references section
 */
function renderReferencesSection(resume: ResumeData): string {
  // If there's a general reference statement, use that instead of individual references
  if (resume.referenceText) {
    return `
      <div class="references-section">
        <h2 class="section-heading">References</h2>
        <div class="section-content">
          <p class="reference-statement">${resume.referenceText}</p>
        </div>
      </div>
    `;
  }
  
  // Otherwise, check if we have individual references to display
  if (!resume.references || resume.references.length === 0) {
    return '';
  }
  
  let referencesHTML = `
    <div class="references-section">
      <h2 class="section-heading">References</h2>
      <div class="section-content">
  `;
  
  // Only include references marked for inclusion
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

/**
 * Render custom sections
 */
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

/**
 * Format custom section content with basic markdown-like support
 */
function formatCustomContent(content: string): string {
  if (!content) return '';
  
  // Convert line breaks to paragraph tags
  let formatted = content
    .split('\n\n')
    .filter(para => para.trim())
    .map(para => `<p>${para.trim()}</p>`)
    .join('');
  
  // Convert single line breaks within paragraphs
  formatted = formatted.replace(/\n/g, '<br>');
  
  // Convert bullet points
  formatted = formatted.replace(/<p>[\s]*[-*][\s]+(.*?)<\/p>/g, '<ul><li>$1</li></ul>');
  formatted = formatted.replace(/<\/ul><ul>/g, '');
  
  // Basic markdown-like formatting
  // Bold
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  return formatted;
}