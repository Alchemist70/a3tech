import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid, CircularProgress } from '@mui/material';
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

  const handleSubjectClick = (subject: Subject) => {
    navigate(`/knowledge-base/${subject.slug}`);
  };

  return (
    <Box sx={{ maxWidth: 1200, margin: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 800 }}>
        Knowledge Base
      </Typography>
      <Typography variant="body1" gutterBottom sx={{ mb: 4, color: 'text.secondary' }}>
        Not familiar with Research or Project concepts? Explore the foundational subjects below to get started!
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : subjects.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          No subjects available.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {subjects.map((subject) => (
            <Grid item xs={12} sm={6} md={4} key={subject._id}>
              <Card
                sx={(theme) => ({
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8],
                    borderColor: theme.palette.primary.main,
                  }
                })}
                onClick={() => handleSubjectClick(subject)}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }} color="primary.main" gutterBottom>
                    {subject.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {subject.topics.length} {subject.topics.length === 1 ? 'topic' : 'topics'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tap to explore
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default KnowledgeBase;
