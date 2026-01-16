import { Project } from '../types/Project';

// Map category names to valid backend enum values
const CATEGORY_MAP: Record<string, string> = {
  'ai-ml': 'ai-ml',
  'ai': 'ai-ml',
  'machine learning': 'ai-ml',
  'ml': 'ai-ml',
  'artificial intelligence': 'ai-ml',
  'federated-learning': 'federated-learning',
  'federated learning': 'federated-learning',
  'federated learning and privacy': 'federated-learning',
  'privacy': 'federated-learning',
  'biomarker-discovery': 'biomarker-discovery',
  'biomarker discovery': 'biomarker-discovery',
  'biomarker': 'biomarker-discovery',
  'computer-vision': 'computer-vision',
  'computer vision': 'computer-vision',
  'vision': 'computer-vision',
  'cv': 'computer-vision',
  'security': 'security',
  'cybersecurity': 'security',
  'automotive': 'automotive',
  'vehicles': 'automotive',
  'self-driving': 'automotive',
};

function mapCategoryToBackend(category: string): string {
  if (!category) return 'ai-ml';
  const normalized = category.toLowerCase().trim();
  return CATEGORY_MAP[normalized] || 'ai-ml';
}

function truncateDescription(desc: string, maxLength: number = 500): string {
  if (!desc) return '';
  const trimmed = String(desc).trim();
  if (trimmed.length <= maxLength) return trimmed;
  // Truncate and try to break at word boundary
  let truncated = trimmed.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxLength - 50) {
    truncated = truncated.substring(0, lastSpace);
  }
  return truncated + '...';
}

export function buildProjectPayload(
  project: Project,
  resourceStrings: Record<'beginner' | 'intermediate' | 'advanced', string>,
  quizStrings: Record<'beginner' | 'intermediate' | 'advanced', string>,
  prereqStrings: Record<'beginner' | 'intermediate' | 'advanced', string>
): Omit<Project, 'id'> {
  const levels: Array<'beginner' | 'intermediate' | 'advanced'> = ['beginner', 'intermediate', 'advanced'];
  const educationalContent: any = {};
  levels.forEach(level => {
    const ec = project.educationalContent[level];
    educationalContent[level] = {
      overview: ec.overview || '',
      prerequisites: prereqStrings[level]
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0),
      concepts: Array.isArray(ec.concepts)
        ? ec.concepts.map(c => {
            // Normalize description to ConceptBlock[]
            let desc: any = c.description;
            if (typeof desc === 'string') {
              // Try to parse as JSON, else treat as plain text
              try {
                const parsed = JSON.parse(desc);
                if (Array.isArray(parsed)) {
                  desc = parsed;
                } else {
                  desc = [{ type: 'text', content: desc }];
                }
              } catch {
                desc = [{ type: 'text', content: desc }];
              }
            } else if (!Array.isArray(desc)) {
              desc = [{ type: 'text', content: '' }];
            }
            // If array, ensure each block is valid
            if (Array.isArray(desc)) {
              desc = desc.map((block: any) => {
                if (typeof block === 'string') {
                  return { type: 'text', content: block };
                }
                if (block && typeof block === 'object' && typeof block.type === 'string') {
                  if (['text', 'image', 'diagram', 'video', 'table', 'chart'].includes(block.type)) {
                    return block;
                  }
                }
                return { type: 'text', content: '' };
              });
            }
            return {
              title: c.title || '',
              description: desc,
              images: Array.isArray(c.images) ? c.images : [],
              videos: Array.isArray(c.videos) ? c.videos : [],
              diagrams: Array.isArray(c.diagrams) ? c.diagrams : [],
            };
          })
        : [],
      resources: resourceStrings[level]
        .split('\n')
        .map(line => {
          const [title, url, type] = line.split('::').map(s => s.trim());
          if (!title || !url || !type) return null;
          if (type !== 'article' && type !== 'code' && type !== 'video') return null;
          return { title, url, type };
        })
        .filter((x): x is { title: string; url: string; type: string } => x !== null),
      // Prefer structured quizzes present on the project object (from interactive editor).
      // Fall back to parsing the textarea `quizStrings[level]` to keep backwards compatibility.
      quizzes: (Array.isArray(ec.quizzes) && ec.quizzes.length > 0)
        ? ec.quizzes.map((q: any) => {
            const question = typeof q.question === 'string' ? q.question : '';
            const options = Array.isArray(q.options) ? q.options.map((o: any) => String(o || '')) : [];
            const answer = typeof q.answer === 'number' ? q.answer : parseInt(String(q.answer || '0'), 10) || 0;
            const explanations = Array.isArray(q.explanations) ? q.explanations.map((e: any) => String(e || '')) : [];
            return { question, options, answer, explanations };
          })
        : quizStrings[level]
            .split('\n')
            .map(line => {
              const rawParts = line.split('||').map(p => p.trim()).filter(p => p.length > 0);
              if (rawParts.length < 3) return null; // need at least question, one option, and an answer
              const parts = rawParts;
              const question = parts[0] || '';

              // Find the right-most token that is a valid integer index (answer).
              // This allows any number of explanations after the answer token.
              let answerPos = -1;
              let answerIndex = 0;
              for (let i = parts.length - 1; i >= 1; i--) {
                const token = parts[i];
                // Accept integer-looking tokens (e.g. "0", "1"). Strict match to avoid picking explanation text that contains numbers.
                if (/^-?\d+$/.test(token)) {
                  answerPos = i;
                  answerIndex = parseInt(token, 10);
                  break;
                }
              }
              if (answerPos === -1) {
                // No explicit answer found — default to first option (0)
                answerPos = Math.min(parts.length - 1, 2); // ensure at least
                answerIndex = 0;
              }

              // Options are the tokens between question (idx 0) and the answer token (exclusive)
              const options = parts.slice(1, answerPos).map(p => String(p));

              // Explanations are anything after the answer token
              const explanations = answerPos + 1 <= parts.length - 1 ? parts.slice(answerPos + 1).map(p => String(p)) : [];

              // Clamp answerIndex to valid range
              if (!Number.isFinite(answerIndex) || options.length === 0) answerIndex = 0;
              if (answerIndex < 0) answerIndex = 0;
              if (answerIndex >= options.length) answerIndex = Math.max(0, options.length - 1);

              return { question, options, answer: answerIndex, explanations };
            })
            .filter((x): x is { question: string; options: string[]; answer: number; explanations: string[] } => x !== null),
    };
  });
  // Map the frontend-rich educationalContent shape to the backend legacy schema
  const mapLevelToLegacy = (lvl: any) => {
    if (!lvl || typeof lvl !== 'object') return {};
    const concepts = Array.isArray(lvl.concepts) ? lvl.concepts : [];
    const keyConcepts: string[] = concepts.map((c: any) => {
      if (!c) return '';
      if (typeof c === 'string') return c;
      if (c.title && typeof c.title === 'string' && c.title.trim()) return c.title.trim();
      // fallback to first text block in description
      if (Array.isArray(c.description) && c.description.length > 0) {
        const first = c.description[0];
        if (typeof first === 'string') return first;
        if (first && typeof first === 'object' && typeof first.content === 'string') return first.content;
      }
      return '';
    }).filter(Boolean);

    return {
      // beginner legacy mapping will be handled by caller based on level
      overview: lvl.overview || '',
      // keep prerequisites as-is so they aren't lost (some backends map these elsewhere)
      prerequisites: Array.isArray(lvl.prerequisites) ? lvl.prerequisites : [],
      // legacy-compatible fields
      summary: lvl.overview || '',
      keyConcepts,
      realWorldApplications: Array.isArray(lvl.prerequisites) ? lvl.prerequisites : [],
      methodology: lvl.overview || '',
      technicalApproach: keyConcepts.join('; '),
      challenges: [],
      solutions: [],
      implementation: lvl.overview || '',
      performanceMetrics: [],
      researchContributions: keyConcepts,
      futureWork: [],
    };
  };

  const legacyEducationalContent: any = {};
  levels.forEach(level => {
    const mapped = mapLevelToLegacy(educationalContent[level]);
    if (level === 'beginner') {
      legacyEducationalContent[level] = {
        summary: mapped.summary,
        keyConcepts: mapped.keyConcepts,
        realWorldApplications: mapped.realWorldApplications,
        // keep the rich shape as well to preserve full content if backend supports it
        overview: educationalContent[level].overview,
        prerequisites: educationalContent[level].prerequisites,
        concepts: educationalContent[level].concepts,
        resources: educationalContent[level].resources,
        quizzes: educationalContent[level].quizzes,
      };
    } else if (level === 'intermediate') {
      legacyEducationalContent[level] = {
        methodology: mapped.methodology,
        technicalApproach: mapped.technicalApproach,
        challenges: mapped.challenges,
        solutions: mapped.solutions,
        overview: educationalContent[level].overview,
        prerequisites: educationalContent[level].prerequisites,
        concepts: educationalContent[level].concepts,
        resources: educationalContent[level].resources,
        quizzes: educationalContent[level].quizzes,
      };
    } else {
      legacyEducationalContent[level] = {
        implementation: mapped.implementation,
        performanceMetrics: mapped.performanceMetrics,
        researchContributions: mapped.researchContributions,
        futureWork: mapped.futureWork,
        overview: educationalContent[level].overview,
        prerequisites: educationalContent[level].prerequisites,
        concepts: educationalContent[level].concepts,
        resources: educationalContent[level].resources,
        quizzes: educationalContent[level].quizzes,
      };
    }
  });

  const payload: Omit<Project, 'id'> = {
    ...project,
    // send legacy-shaped educationalContent (but preserve rich fields inside it)
    educationalContent: legacyEducationalContent,
    // Ensure required fields are never undefined
    title: project.title && String(project.title).trim() ? String(project.title).trim() : 'Untitled Project',
    subtitle: project.subtitle && String(project.subtitle).trim() ? String(project.subtitle).trim() : 'No subtitle',
    // Truncate description to max 500 chars (backend requirement)
    description: truncateDescription(project.description ? String(project.description).trim() : 'No description', 500),
    detailedDescription: project.detailedDescription && String(project.detailedDescription).trim() ? String(project.detailedDescription).trim() : (project.description && String(project.description).trim() ? String(project.description).trim() : 'No description'),
    // Map category to valid backend enum
    category: mapCategoryToBackend(project.category || ''),
  } as any;
  delete (payload as any).id;
  return payload;
}
