// utils/resume-comparison.ts
import { ResumeData, Skill, WorkExperience, Project } from '@/types/resume';

/**
 * Interface for tracking changes between original and tailored resume
 */
export interface ResumeDiff {
  summary: {
    original: string;
    tailored: string;
    changed: boolean;
  };
  skills: {
    added: Skill[];
    removed: Skill[];
    unchanged: Skill[];
    changed: boolean;
  };
  workExperience: {
    items: {
      id: string;
      position: string;
      company: string;
      descriptionChanged: boolean;
      achievementsChanged: boolean;
      original: WorkExperience;
      tailored: WorkExperience;
    }[];
    changed: boolean;
  };
  projects: {
    items: {
      id: string;
      name: string;
      descriptionChanged: boolean;
      technologiesChanged: boolean;
      achievementsChanged: boolean;
      original: Project;
      tailored: Project;
    }[];
    changed: boolean;
  };
  changedSections: string[];
}

/**
 * Compare original resume with tailored resume to identify changes
 */
export function compareResumes(originalResume: ResumeData, tailoredResume: ResumeData): ResumeDiff {
  // Create the diff object
  const diff: ResumeDiff = {
    summary: {
      original: originalResume.personalInfo?.summary || '',
      tailored: tailoredResume.personalInfo?.summary || '',
      changed: originalResume.personalInfo?.summary !== tailoredResume.personalInfo?.summary
    },
    skills: {
      added: [],
      removed: [],
      unchanged: [],
      changed: false
    },
    workExperience: {
      items: [],
      changed: false
    },
    projects: {
      items: [],
      changed: false
    },
    changedSections: []
  };
  
  // Track changed sections
  if (diff.summary.changed) {
    diff.changedSections.push('summary');
  }
  
  // Compare skills
  const originalSkillNames = new Set(originalResume.skills.map(s => s.name.toLowerCase()));
  const tailoredSkillNames = new Set(tailoredResume.skills.map(s => s.name.toLowerCase()));
  
  // Find added skills
  diff.skills.added = tailoredResume.skills.filter(skill => 
    !originalSkillNames.has(skill.name.toLowerCase())
  );
  
  // Find removed skills
  diff.skills.removed = originalResume.skills.filter(skill => 
    !tailoredSkillNames.has(skill.name.toLowerCase())
  );
  
  // Find unchanged skills
  diff.skills.unchanged = originalResume.skills.filter(skill => 
    tailoredSkillNames.has(skill.name.toLowerCase())
  );
  
  // Check if skills changed
  diff.skills.changed = diff.skills.added.length > 0 || diff.skills.removed.length > 0;
  
  if (diff.skills.changed) {
    diff.changedSections.push('skills');
  }
  
  // Compare work experience
  // Create a map of work experiences by ID
  const tailoredExpMap = new Map(
    tailoredResume.workExperience.map(exp => [exp.id, exp])
  );
  
  // Compare each original experience with its tailored version
  originalResume.workExperience.forEach(originalExp => {
    const tailoredExp = tailoredExpMap.get(originalExp.id);
    
    if (tailoredExp) {
      const descriptionChanged = originalExp.description !== tailoredExp.description;
      const achievementsChanged = JSON.stringify(originalExp.achievements) !== 
                                 JSON.stringify(tailoredExp.achievements);
      
      if (descriptionChanged || achievementsChanged) {
        diff.workExperience.changed = true;
        diff.workExperience.items.push({
          id: originalExp.id,
          position: originalExp.position,
          company: originalExp.company,
          descriptionChanged,
          achievementsChanged,
          original: originalExp,
          tailored: tailoredExp
        });
      }
    }
  });
  
  if (diff.workExperience.changed) {
    diff.changedSections.push('workExperience');
  }
  
  // Compare projects if they exist
  if (originalResume.projects && tailoredResume.projects) {
    // Create a map of projects by ID
    const tailoredProjMap = new Map(
      tailoredResume.projects.map(proj => [proj.id, proj])
    );
    
    // Compare each original project with its tailored version
    originalResume.projects.forEach(originalProj => {
      const tailoredProj = tailoredProjMap.get(originalProj.id);
      
      if (tailoredProj) {
        const descriptionChanged = originalProj.description !== tailoredProj.description;
        const technologiesChanged = JSON.stringify(originalProj.technologies) !== 
                                  JSON.stringify(tailoredProj.technologies);
        const achievementsChanged = JSON.stringify(originalProj.achievements || []) !== 
                                  JSON.stringify(tailoredProj.achievements || []);
        
        if (descriptionChanged || technologiesChanged || achievementsChanged) {
          diff.projects.changed = true;
          diff.projects.items.push({
            id: originalProj.id,
            name: originalProj.name,
            descriptionChanged,
            technologiesChanged,
            achievementsChanged,
            original: originalProj,
            tailored: tailoredProj
          });
        }
      }
    });
    
    if (diff.projects.changed) {
      diff.changedSections.push('projects');
    }
  }
  
  return diff;
}

/**
 * Calculate the ATS score improvement between original and tailored resume
 * based on keyword matching with the job description
 */
export function calculateATSImprovement(
  originalResume: ResumeData,
  tailoredResume: ResumeData,
  jobKeywords: string[]
): { 
  originalScore: number; 
  tailoredScore: number; 
  improvement: number;
  matchedKeywords: string[];
} {
  const keywords = jobKeywords.map(kw => kw.toLowerCase());
  
  // Calculate original score
  const originalMatches = getKeywordMatches(originalResume, keywords);
  const originalScore = originalMatches.length / keywords.length;
  
  // Calculate tailored score
  const tailoredMatches = getKeywordMatches(tailoredResume, keywords);
  const tailoredScore = tailoredMatches.length / keywords.length;
  
  // Calculate improvement
  const improvement = tailoredScore - originalScore;
  
  return {
    originalScore,
    tailoredScore,
    improvement,
    matchedKeywords: tailoredMatches
  };
}

/**
 * Get keywords from job description that match in the resume
 */
function getKeywordMatches(resume: ResumeData, keywords: string[]): string[] {
  const matchedKeywords = new Set<string>();
  
  // Create a single string with all resume textual content
  const resumeText = [
    // Personal info
    resume.personalInfo?.title || '',
    resume.personalInfo?.summary || '',
    
    // Skills
    ...(resume.skills || []).map(s => s.name),
    ...(resume.skills || []).map(s => s.category || ''),
    
    // Work experience
    ...(resume.workExperience || []).flatMap(exp => [
      exp.position,
      exp.company,
      exp.description || '',
      ...(exp.achievements || [])
    ]),
    
    // Education
    ...(resume.education || []).flatMap(edu => [
      edu.degree,
      edu.fieldOfStudy || '',
      edu.institution,
      edu.description || '',
      ...(edu.achievements || [])
    ]),
    
    // Projects
    ...(resume.projects || []).flatMap(proj => [
      proj.name,
      proj.description || '',
      ...(proj.technologies || []),
      ...(proj.achievements || [])
    ]),
    
    // Certifications
    ...(resume.certifications || []).flatMap(cert => [
      cert.name, 
      cert.issuer
    ])
  ].join(' ').toLowerCase();
  
  // Check for each keyword in the resume text
  for (const keyword of keywords) {
    if (resumeText.includes(keyword.toLowerCase())) {
      matchedKeywords.add(keyword);
    }
  }
  
  return Array.from(matchedKeywords);
}