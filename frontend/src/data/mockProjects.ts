import { Project } from '../types/Project';

export const mockProjects: Project[] = [
  {
  id: '68c5774eb5fbd2194636ac05',
  _id: '68c5774eb5fbd2194636ac05',
    title: 'Biomarker Discovery Platform',
    subtitle: 'AI-powered multi-omics biomarker discovery',
    description: 'A cutting-edge computational platform that leverages artificial intelligence and multi-omics data integration for the discovery and validation of novel biomarkers.',
    category: 'Bioinformatics',
    image: '/images/biomarker-discovery.jpg',
    technologies: ['Python', 'TensorFlow', 'R', 'SQL', 'Docker', 'Scikit-learn', 'Pandas', 'NumPy', 'Bioconductor'],
    tags: ['AI', 'Biomarker', 'Multi-omics', 'Healthcare'],
    featured: true,
    createdAt: '2025-01-01T00:00:00Z',
    links: {
      github: 'https://github.com/example/biomarker-discovery',
      demo: 'https://biomarker-demo.example.com',
      documentation: 'https://docs.biomarker-platform.example.com'
    },
    educationalContent: {
      beginner: {
        overview: `Welcome to the foundational level of biomarker discovery!

This comprehensive introduction will guide you through the essential concepts of biomarkers and their critical role in modern medicine. You'll start with basic definitions and gradually build up to understanding how these biological indicators are revolutionizing healthcare.

Key Learning Outcomes:
• Understand what biomarkers are and their fundamental types
• Master basic biological concepts necessary for biomarker research
• Learn essential statistical methods for data analysis
• Develop fundamental programming skills for biological data processing
• Get started with basic bioinformatics tools and databases`,
        prerequisites: [
          'Basic understanding of biology (high school level)',
          'Elementary Python programming knowledge',
          'Basic statistics concepts',
          'Familiarity with using scientific software'
        ],
        concepts: [
          {
            title: 'Foundations of Biomarkers',
            description: [
              { type: 'text', content: `Introduction to what biomarkers are and their basic types:\n\n1. Molecular Biomarkers:\n- DNA mutations\n- RNA expression levels\n- Protein levels\n- Metabolites\n\n2. Imaging Biomarkers:\n- MRI scans\n- CT scans\n- PET scans\n- Ultrasound markers\n\n3. Physiological Biomarkers:\n- Blood pressure\n- Heart rate\n- Temperature\n- Respiratory rate\n\n4. Digital Biomarkers:\n- Wearable device data\n- Mobile health app data\n- Digital activity patterns` }
            ],
          },
          {
            title: 'Basic Data Analysis',
            description: [
              { type: 'text', content: 'Understanding fundamental statistical methods for biomarker analysis' }
            ]
          },
          {
            title: 'Introduction to Tools',
            description: [
              { type: 'text', content: 'Overview of basic tools used in biomarker discovery' }
            ]
          }
        ],
        resources: [
          {
            title: 'Introduction to Biomarkers',
            type: 'article',
            url: 'https://example.com/biomarkers-intro'
          },
          {
            title: 'Biomarker Basics',
            type: 'video',
            url: 'https://example.com/biomarker-video'
          },
          {
            title: 'Basic Data Analysis',
            type: 'code',
            url: 'https://example.com/biomarker-code'
          }
        ],
        quizzes: [
          {
            question: "What is biomarker discovery?",
            options: [
              "Finding new biological indicators",
              "Testing existing markers",
              "Studying diseases",
              "None of the above"
            ],
            answer: 0,
            explanations: [
              "Correct! Biomarker discovery involves finding new biological indicators.",
              "Incorrect. Testing existing markers is different from discovery.",
              "Incorrect. While related, this is too broad.",
              "Incorrect. Biomarker discovery is about finding new indicators."
            ]
          },
          {
            question: 'What is a biomarker?',
            options: [
              'A measurable indicator of biological state',
              'A type of medication',
              'A medical device',
              'A laboratory technique'
            ],
            answer: 0,
            explanations: [
              'Correct! A biomarker is a measurable indicator that can reveal information about biological processes.',
              'Incorrect. While biomarkers can help determine medication effectiveness, they are not medications themselves.',
              'Incorrect. Biomarkers are biological indicators, not devices.',
              'Incorrect. Laboratory techniques may be used to measure biomarkers, but are not biomarkers themselves.'
            ]
          }
        ]
      },
      intermediate: {
        overview: 'Welcome to the intermediate level!',
        prerequisites: [
          'Solid understanding of biomarker basics',
          'Intermediate Python skills',
          'Statistical analysis experience'
        ],
        concepts: [
          {
            title: 'Advanced Analysis Techniques',
            description: [
              { type: 'text', content: 'Deep dive into biomarker analysis methods' }
            ]
          }
        ],
        resources: [
          {
            title: 'Advanced Biomarker Analysis',
            type: 'article',
            url: 'https://example.com/advanced-analysis'
          }
        ],
        quizzes: [
          {
            question: "Which technique is most commonly used in biomarker analysis?",
            options: [
              "Mass spectrometry",
              "Microscopy",
              "DNA sequencing",
              "PCR"
            ],
            answer: 0,
            explanations: [
              "Correct! Mass spectrometry is a key technique in biomarker analysis.",
              "Incorrect. While useful, microscopy is not the primary technique.",
              "Incorrect. DNA sequencing is more relevant to genomics.",
              "Incorrect. PCR is more relevant to genetic analysis."
            ]
          },
          {
            question: 'Which statistical method is most appropriate for biomarker validation?',
            options: [
              'ROC Analysis',
              'Simple t-test',
              'Basic correlation',
              'Descriptive statistics'
            ],
            answer: 0,
            explanations: [
              'Correct! ROC analysis is a key method for evaluating biomarker performance.',
              'Incorrect. While t-tests are useful, they are not the most comprehensive for validation.',
              'Incorrect. Correlation alone is insufficient for proper validation.',
              'Incorrect. Descriptive statistics are too basic for validation purposes.'
            ]
          }
        ]
      },
      advanced: {
        overview: 'Master state-of-the-art techniques in AI-powered cancer diagnosis, including multi-modal learning and explainable AI.',
        prerequisites: [
          'Strong statistical background',
          'Advanced programming skills',
          'Research experience'
        ],
        concepts: [
          {
            title: 'Machine Learning in Biomarker Discovery',
            description: [
              { type: 'text', content: 'Advanced ML techniques for biomarker identification' }
            ]
          }
        ],
        resources: [
          {
            title: 'ML in Biomarkers',
            type: 'article',
            url: 'https://example.com/ml-biomarkers'
          }
        ],
        quizzes: [
          {
            question: 'What is the main advantage of using deep learning for biomarker discovery?',
            options: [
              'Ability to find complex patterns',
              'Faster processing',
              'Lower cost',
              'Simpler implementation'
            ],
            answer: 0,
            explanations: [
              'Correct! Deep learning can identify complex, non-linear patterns in biomarker data.',
              'Incorrect. Deep learning often requires more processing time.',
              'Incorrect. Deep learning solutions can be more expensive.',
              'Incorrect. Deep learning implementations are typically more complex.'
            ]
          }
        ]
      }
    }
  },
  {
    id: '68c57456b5fbd2194636abd0',
    _id: '68c57456b5fbd2194636abd0',
    title: 'Placeholder Project',
    subtitle: 'This is a placeholder for a missing project',
    description: 'This project was added to resolve a missing project error. Please update with real data.',
    category: 'Placeholder',
    image: '/images/placeholder.jpg',
    technologies: ['N/A'],
    tags: ['placeholder'],
    featured: false,
    createdAt: '2025-01-01T00:00:00Z',
    links: {},
    media: { images: ['/images/placeholder.jpg'], videos: [], diagrams: [], codeSnippets: [] },
    educationalContent: {
      beginner: { overview: '', prerequisites: [], concepts: [], resources: [], quizzes: [] },
      intermediate: { overview: '', prerequisites: [], concepts: [], resources: [], quizzes: [] },
      advanced: { overview: '', prerequisites: [], concepts: [], resources: [], quizzes: [] }
    }
  },
  {
  id: '68c574b9b5fbd2194636abd3',
  _id: '68c574b9b5fbd2194636abd3',
    title: 'Real-Time Gesture and Continuous Authentication System for Software Defined Vehicles',
    subtitle: 'Multimodal Biometric Security for Next-Gen Automotive Systems',
    description: 'A comprehensive security and interaction framework for Software Defined Vehicles (SDVs) integrating facial recognition, gesture-based controls, and voice commands for continuous driver authentication.',
    category: 'Automotive Security',
    image: '/images/automotive-security.jpg',
    technologies: ['Python', 'OpenCV', 'TensorFlow', 'Flask', 'Docker'],
    tags: ['sdv', 'biometrics', 'security', 'automotive'],
    featured: true,
    createdAt: '2025-01-03T00:00:00Z',
    links: {
      github: 'https://github.com/example/automotive-security',
      demo: 'https://automotive-demo.example.com',
      documentation: 'https://docs.automotive-security.example.com'
    },
    educationalContent: {
      beginner: {
        overview: 'Introduction to automotive security and the basics of biometric authentication in vehicles.',
        prerequisites: ['Basic understanding of security concepts', 'Interest in automotive technology'],
        concepts: [
          { title: 'What is an SDV?', description: [ { type: 'text', content: 'Overview of Software Defined Vehicles and their importance.' } ] },
          { title: 'Biometric Authentication', description: [ { type: 'text', content: 'Introduction to facial, gesture, and voice biometrics.' } ] }
        ],
        resources: [
          { title: 'SDV Basics', type: 'article', url: 'https://example.com/sdv-basics' },
          { title: 'Intro to Biometrics', type: 'video', url: 'https://example.com/biometrics-intro' }
        ],
        quizzes: [
          { question: 'What is a Software Defined Vehicle?', options: ['A vehicle controlled by software', 'A type of electric car', 'A self-driving car', 'A flying car'], answer: 0, explanations: ['Correct! SDVs are vehicles where software controls many functions.', 'Not all electric cars are SDVs.', 'Self-driving is a feature, not a definition.', 'Flying cars are not SDVs.'] }
        ]
      },
      intermediate: {
        overview: 'Explore multimodal authentication and security challenges in SDVs.',
        prerequisites: ['Basic SDV knowledge', 'Familiarity with Python'],
        concepts: [
          { title: 'Gesture Recognition', description: [ { type: 'text', content: 'How gesture-based controls work in vehicles.' } ] },
          { title: 'Continuous Authentication', description: [ { type: 'text', content: 'Why continuous authentication is important for security.' } ] }
        ],
        resources: [
          { title: 'Gesture Control in Cars', type: 'article', url: 'https://example.com/gesture-cars' }
        ],
        quizzes: [
          { question: 'Which biometric is NOT used in this SDV system?', options: ['Facial recognition', 'Fingerprint', 'Gesture', 'Voice'], answer: 1, explanations: ['Facial, gesture, and voice are used.', 'Correct! Fingerprint is not used in this system.', 'Gesture is used.', 'Voice is used.'] }
        ]
      },
      advanced: {
        overview: 'Advanced security protocols and integration of AI in SDV authentication.',
        prerequisites: ['Experience with AI/ML', 'Understanding of security protocols'],
        concepts: [
          { title: 'AI in Security', description: [ { type: 'text', content: 'How AI enhances security in SDVs.' } ] }
        ],
        resources: [
          { title: 'AI Security Protocols', type: 'article', url: 'https://example.com/ai-security' }
        ],
        quizzes: [
          { question: 'What is the main benefit of continuous authentication?', options: ['Improved security', 'Faster driving', 'Lower cost', 'Better fuel efficiency'], answer: 0, explanations: ['Correct! Continuous authentication improves security.', 'Not related.', 'Not related.', 'Not related.'] }
        ]
      }
    }
  },
  {
  id: '68c5774eb5fbd2194636ac06',
  _id: '68c5774eb5fbd2194636ac06',
    title: 'Federated Learning for Cancer Diagnosis',
    subtitle: 'Addressing Data Heterogeneity in Clinical Prognosis Prediction',
    description: 'A comprehensive federated learning methodology that enables collaborative model training across healthcare institutions while preserving patient privacy and addressing data heterogeneity challenges.',
    category: 'Federated Learning',
    image: '/images/federated-learning.jpg',
    technologies: ['Python', 'PyTorch', 'NumPy', 'Pandas', 'Docker'],
    tags: ['federated-learning', 'cancer-diagnosis', 'privacy-preserving', 'AI'],
    featured: true,
    createdAt: '2025-01-02T00:00:00Z',
    links: {
      github: 'https://github.com/example/federated-cancer',
      demo: 'https://federated-demo.example.com',
      documentation: 'https://docs.federated-cancer.example.com'
    },
    media: {
      images: ['/images/federated-learning.jpg'],
      videos: [],
      diagrams: [],
      codeSnippets: []
    },
    educationalContent: {
      beginner: {
        overview: 'Introduction to federated learning and its application in cancer diagnosis.',
        prerequisites: ['Basic Python', 'Interest in healthcare AI'],
        concepts: [
          { title: 'What is Federated Learning?', description: [ { type: 'text', content: 'Collaborative model training without sharing raw data.' } ] },
          { title: 'Cancer Diagnosis Basics', description: [ { type: 'text', content: 'Overview of cancer diagnosis and prognosis.' } ] }
        ],
        resources: [
          { title: 'Federated Learning Intro', type: 'article', url: 'https://example.com/federated-intro' },
          { title: 'Cancer Diagnosis 101', type: 'video', url: 'https://example.com/cancer-diagnosis' }
        ],
        quizzes: [
          { question: 'What is the main advantage of federated learning?', options: ['Data privacy', 'Faster training', 'Cheaper hardware', 'More data'], answer: 0, explanations: ['Correct! Federated learning preserves data privacy.', 'Not always.', 'Not necessarily.', 'Not always.'] }
        ]
      },
      intermediate: {
        overview: 'Explore data heterogeneity and privacy in federated learning.',
        prerequisites: ['Intermediate Python', 'Basic ML knowledge'],
        concepts: [
          { title: 'Data Heterogeneity', description: [ { type: 'text', content: 'Challenges of non-IID data in federated learning.' } ] },
          { title: 'Privacy Techniques', description: [ { type: 'text', content: 'How privacy is preserved in federated systems.' } ] }
        ],
        resources: [
          { title: 'Non-IID Data', type: 'article', url: 'https://example.com/non-iid' }
        ],
        quizzes: [
          { question: 'Which is a privacy technique in federated learning?', options: ['Differential privacy', 'Data centralization', 'Manual review', 'Open data'], answer: 0, explanations: ['Correct! Differential privacy is used.', 'Centralization is the opposite.', 'Manual review is not a privacy technique.', 'Open data is not private.'] }
        ]
      },
      advanced: {
        overview: 'Advanced federated learning algorithms and clinical deployment.',
        prerequisites: ['Advanced ML', 'Experience with federated systems'],
        concepts: [
          { title: 'Algorithm Optimization', description: [ { type: 'text', content: 'Optimizing federated learning for clinical use.' } ] }
        ],
        resources: [
          { title: 'Federated Optimization', type: 'article', url: 'https://example.com/federated-opt' }
        ],
        quizzes: [
          { question: 'What is a challenge in clinical federated learning?', options: ['Data heterogeneity', 'Too much data sharing', 'No privacy concerns', 'No need for security'], answer: 0, explanations: ['Correct! Data heterogeneity is a key challenge.', 'Federated learning avoids data sharing.', 'Privacy is a concern.', 'Security is important.'] }
        ]
      }
    }
  },
];