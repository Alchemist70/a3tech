import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, List, ListItem, ListItemText, Paper } from '@mui/material';

const subjects = [
  {
    category: 'Biology For Engineers',
    slug: 'biology-for-engineers',
    topics: [
      'Cell Structure',
      'Genetics',
      'Microbiology',
      'Biological Systems',
    ],
  },
  {
    category: 'Biochemistry For Engineers',
    slug: 'biochemistry-for-engineers',
    topics: [
      'Enzymes',
      'Metabolism',
      'Proteins',
      'Nucleic Acids',
    ],
  },
  {
    category: 'Physiology For Engineers',
    slug: 'physiology-for-engineers',
    topics: [
      'Human Physiology',
      'Neurophysiology',
      'Cardiovascular System',
      'Respiratory System',
    ],
  },
  {
    category: 'Chemistry For Engineers',
    slug: 'chemistry-for-engineers',
    topics: [
      'Organic Chemistry',
      'Inorganic Chemistry',
      'Physical Chemistry',
      'Analytical Chemistry',
    ],
  },
  {
    category: 'Physics For Engineers',
    slug: 'physics-for-engineers',
    topics: [
      'Mechanics',
      'Thermodynamics',
      'Electromagnetism',
      'Quantum Physics',
    ],
  },
  {
    category: 'Mathematics For Engineers',
    slug: 'mathematics-for-engineers',
    topics: [
      'Calculus',
      'Linear Algebra',
      'Probability & Statistics',
      'Differential Equations',
    ],
  },
  {
    category: 'Computer Science For Engineers',
    slug: 'computer-science-for-engineers',
    topics: [
      'Programming Basics',
      'Data Structures',
      'Algorithms',
      'Databases',
    ],
  },
];

const SubjectTopics: React.FC = () => {
  const { subjectSlug } = useParams();
  const navigate = useNavigate();
  const subject = subjects.find(s => s.slug === subjectSlug);

  if (!subject) {
    return <Typography variant="h5">Subject not found.</Typography>;
  }

  return (
    <Box sx={{ maxWidth: 700, margin: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>{subject.category}</Typography>
      <Typography variant="body1" gutterBottom>Choose a topic to learn more:</Typography>
      <Paper elevation={2} sx={{ mt: 3 }}>
        <List>
          {subject.topics.map(topic => (
            <ListItem button key={topic} onClick={() => navigate(`/knowledge-base/${subject.slug}/${encodeURIComponent(topic.toLowerCase().replace(/\s+/g, '-'))}`)}>
              <ListItemText primary={topic} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default SubjectTopics;
