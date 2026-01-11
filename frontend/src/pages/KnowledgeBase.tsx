import React, { useState, useEffect } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Collapse, Paper, CircularProgress } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useNavigate } from 'react-router-dom';
import api from '../api';

interface Subject {
  _id: string;
  name: string;
  slug: string;
}

interface Topic {
  _id: string;
  name: string;
  slug: string;
  subjectId: string;
}

interface ExpandedSubject extends Subject {
  topics: Topic[];
}

const KnowledgeBase: React.FC = () => {
  const [subjects, setSubjects] = useState<ExpandedSubject[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch subjects
        const subjectsRes = await api.get('/knowledge-base/subjects', { withCredentials: true });
        const subjectsData: Subject[] = Array.isArray(subjectsRes?.data) ? subjectsRes.data : [];

        // Fetch all topics
        const topicsRes = await api.get('/topics', { withCredentials: true });
        const topicsData: Topic[] = Array.isArray(topicsRes?.data) ? topicsRes.data : [];

        // Map topics to their subjects
        const subjectsWithTopics: ExpandedSubject[] = subjectsData.map(subject => ({
          ...subject,
          topics: topicsData.filter(topic => topic.subjectId === subject._id),
        }));

        setSubjects(subjectsWithTopics);
      } catch (err) {
        console.error('Failed to fetch subjects or topics:', err);
        setSubjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleClick = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleTopicClick = (subject: Subject, topic: Topic) => {
    navigate(`/knowledge-base/${subject.slug}/${topic.slug}`);
  };

  return (
    <Box sx={{ maxWidth: 800, margin: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Knowledge Base
      </Typography>
      <Typography variant="body1" gutterBottom>
        Not familiar with Research or Project concepts? Explore the foundational subjects below to get started!
      </Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : subjects.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          No subjects available.
        </Typography>
      ) : (
        <Paper elevation={2} sx={{ mt: 3 }}>
          <List>
            {subjects.map((subject, idx) => (
              <React.Fragment key={subject._id}>
                <ListItem button onClick={() => handleClick(idx)}>
                  <ListItemText primary={subject.name} />
                  <ExpandMoreIcon
                    style={{
                      transform: openIndex === idx ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: '0.2s',
                    }}
                  />
                </ListItem>
                <Collapse in={openIndex === idx} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {subject.topics.length === 0 ? (
                      <ListItem sx={{ pl: 4 }}>
                        <ListItemText 
                          primary="No topics available" 
                          primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                        />
                      </ListItem>
                    ) : (
                      subject.topics.map((topic) => (
                        <ListItem
                          key={topic._id}
                          button
                          onClick={() => handleTopicClick(subject, topic)}
                          sx={{
                            pl: 4,
                            '&:hover': {
                              backgroundColor: 'action.hover',
                            },
                          }}
                        >
                          <ListItemText primary={topic.name} />
                        </ListItem>
                      ))
                    )}
                  </List>
                </Collapse>
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default KnowledgeBase;
