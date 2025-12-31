
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Grid, Breadcrumbs, Link, CircularProgress, Button } from '@mui/material';

interface Topic {
  _id?: string;
  id?: string;
  subjectId: string;
  name: string;
  slug?: string;
  uuid?: string;
}

interface TopicDetail {
  _id?: string;
  id?: string;
  topicUUID: string;
  subjectId: string;
  slug?: string;
  description?: string;
  content?: string;
}

interface Subject {
  _id?: string;
  id?: string;
  name: string;
  slug?: string;
}

const TopicPage: React.FC = () => {
  const { subjectSlug } = useParams<{ subjectSlug: string }>();
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [topicDetails, setTopicDetails] = useState<TopicDetail[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [subjectsRes, topicsRes, detailsRes] = await Promise.all([
          import('../api').then(mod => mod.default.get('/knowledge-base/subjects', { withCredentials: true })),
          import('../api').then(mod => mod.default.get('/topics', { withCredentials: true })),
          import('../api').then(mod => mod.default.get('/topic-details', { withCredentials: true })),
        ]);
        const subjectsData = subjectsRes?.data || [];
        const topicsData = topicsRes?.data || [];
        const detailsData = detailsRes?.data || [];
        const foundSubject = Array.isArray(subjectsData)
          ? subjectsData.find((s: Subject) => s.slug === subjectSlug)
          : null;
        setSubject(foundSubject || null);
        setTopics(
          foundSubject
            ? (Array.isArray(topicsData)
                ? topicsData.filter((t: Topic) => t.subjectId === (foundSubject._id || foundSubject.id))
                : [])
            : []
        );
        setTopicDetails(Array.isArray(detailsData) ? detailsData : []);
      } catch {
        setSubject(null);
        setTopics([]);
        setTopicDetails([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [subjectSlug]);

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', mt: 6, px: 2 }}>
      <Box sx={{ mb: 4 }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => navigate('/knowledge-base')}
          sx={{ mb: 2 }}
        >
          ← Back to Knowledge Base
        </Button>
        <Breadcrumbs sx={{ mb: 2 }} aria-label="breadcrumb">
          <Link underline="hover" color="primary" onClick={() => navigate('/')} sx={{ cursor: 'pointer' }}>Home</Link>
          <Link underline="hover" color="primary" onClick={() => navigate('/knowledge-base')} sx={{ cursor: 'pointer' }}>Knowledge Base</Link>
          <Typography color="text.primary" sx={{ fontWeight: 600 }}>{subject?.name || 'Topics'}</Typography>
        </Breadcrumbs>
      </Box>
      <Box
        sx={(theme) => ({
          p: { xs: 3, md: 4 },
          borderRadius: 2,
          mb: 4,
          color: theme.palette.primary.contrastText,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
          boxShadow: theme.shadows[4],
        })}
      >
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 800 }}>
          {subject?.name ? `${subject.name} Topics` : 'Topics'}
        </Typography>
        <Typography variant="h6" color="inherit" sx={{ opacity: 0.95 }}>
          Explore topics and lessons to deepen your knowledge
        </Typography>
      </Box>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : topics.length === 0 ? (
        <Typography variant="h6" color="text.secondary" align="center" sx={{ mt: 6 }}>
          No topics found for this subject.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {topics.map(topic => (
            <Grid item xs={12} sm={6} md={4} key={topic._id || topic.id}>
              <Card
                sx={(theme) => ({
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  height: '100%',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8],
                    borderColor: theme.palette.primary.main,
                  }
                })}
                onClick={() => {
                  if (!topic.slug) {
                    console.warn('Topic is missing slug:', topic);
                    alert('This topic is missing a slug and cannot be opened. Please check the admin panel.');
                    return;
                  }
                  const detail = topicDetails.find(
                    d => d.topicUUID === topic.uuid
                  );
                  if (detail) {
                    navigate(`/knowledge-base/${subject?.slug}/${topic.slug}/${detail.slug}`);
                  } else {
                    navigate(`/knowledge-base/${subject?.slug}/${topic.slug}`);
                  }
                }}
              >
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700 }} color="primary.main" gutterBottom>
                    {topic.name}
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

export default TopicPage;
