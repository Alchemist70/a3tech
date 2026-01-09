// Block type for concept descriptions
export type ConceptBlock =
  | { type: 'text'; content: string }
  | { type: 'image' | 'diagram' | 'video'; url: string };

export interface Project {
  id: string;
  _id?: string;
  title: string;
  subtitle: string;
  description: string;
  detailedDescription?: string;
  category: string;
  image: string;
  technologies: string[];
  tags: string[];
  featured: boolean;
  createdAt: string;
  links: {
    github?: string;
    demo?: string;
    documentation?: string;
  };
  media?: {
    images?: string[];
    videos?: string[];
    diagrams?: string[];
    codeSnippets?: string[];
  };
  educationalContent: {
    [key in 'beginner' | 'intermediate' | 'advanced']: {
      overview: string;
      prerequisites: string[];
      concepts: Array<{
        title: string;
        description: ConceptBlock[]; // Array of blocks (text/media)
        images?: string[]; // legacy, for migration only
        videos?: string[];
        diagrams?: string[];
      }>;
      resources: {
        title: string;
        url: string;
        type: 'video' | 'article' | 'code';
      }[];
      quizzes: {
        question: string;
        options: string[];
        answer: number;
        explanations: string[];
      }[];
    };
  };
}