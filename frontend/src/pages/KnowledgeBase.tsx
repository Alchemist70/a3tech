import React, { useState } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Collapse, Paper } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useNavigate } from 'react-router-dom';

const subjects = [
  {
    category: 'Biology For Engineers',
    topics: [
      'Cell Structure',
      'Genetics',
      'Microbiology',
      'Biological Systems',
    ],
  },
  {
    category: 'Biochemistry For Engineers',
    topics: [
      'Enzymes',
      'Metabolism',
      'Proteins',
      'Nucleic Acids',
    ],
  },
  {
    category: 'Physiology For Engineers',
    topics: [
      'Human Physiology',
      'Neurophysiology',
      'Cardiovascular System',
      'Respiratory System',
    ],
  },
  {
    category: 'Chemistry For Engineers',
    topics: [
      'Organic Chemistry',
      'Inorganic Chemistry',
      'Physical Chemistry',
      'Analytical Chemistry',
    ],
  },
  {
    category: 'Physics For Engineers',
    topics: [
      'Mechanics',
      'Thermodynamics',
      'Electromagnetism',
      'Quantum Physics',
    ],
  },
  {
    category: 'Mathematics For Engineers',
    topics: [
      'Calculus',
      'Linear Algebra',
      'Probability & Statistics',
      'Differential Equations',
    ],
  },
  {
    category: 'Computer Science For Engineers',
    topics: [
      'Programming Basics',
      'Data Structures',
      'Algorithms',
      'Databases',
    ],
  },
];

const KnowledgeBase: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const navigate = useNavigate();

  const handleClick = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleTopicClick = (categoryName: string, topic: string) => {
    const categorySlug = categoryName.toLowerCase().replace(/\s+/g, '-');
    const topicSlug = topic.toLowerCase().replace(/\s+/g, '-');
    navigate(`/knowledge-base/${categorySlug}/${topicSlug}`);
  };

  return (
    <Box sx={{ maxWidth: 800, margin: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Knowledge Base
      </Typography>
      <Typography variant="body1" gutterBottom>
        Not familiar with Research or Project concepts? Explore the foundational subjects below to get started!
      </Typography>
      <Paper elevation={2} sx={{ mt: 3 }}>
        <List>
          {subjects.map((subject, idx) => (
            <React.Fragment key={subject.category}>
              <ListItem button onClick={() => handleClick(idx)}>
                <ListItemText primary={subject.category} />
                <ExpandMoreIcon
                  style={{
                    transform: openIndex === idx ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: '0.2s',
                  }}
                />
              </ListItem>
              <Collapse in={openIndex === idx} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {subject.topics.map((topic) => (
                    <ListItem 
                      key={topic} 
                      button
                      onClick={() => handleTopicClick(subject.category, topic)}
                      sx={{ 
                        pl: 4,
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      <ListItemText primary={topic} />
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default KnowledgeBase;
