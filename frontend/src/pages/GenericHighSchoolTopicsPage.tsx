import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Grid, Breadcrumbs, Link, CircularProgress, Button } from '@mui/material';
import api from '../api';

interface Topic {
  _id?: string;
  id?: string;
  sectionId: string;
  name: string;
  slug?: string;
  uuid?: string;
}

interface TopicDetail {
  _id?: string;
  id?: string;
  topicUUID: string;
  sectionId: string;
  slug?: string;
  description?: string;
  content?: string;
}

interface Section {
  _id?: string;
  id?: string;
  name: string;
  slug?: string;
}

interface WaecTopicsPageProps {
  type: 'waec' | 'jamb';
  sectionName: string;
  breadcrumbLabel: string;
}

const GenericHighSchoolTopicsPage: React.FC<WaecTopicsPageProps> = ({ type, sectionName, breadcrumbLabel }) => {
  const { sectionSlug } = useParams<{ sectionSlug: string }>();
  const navigate = useNavigate();
  const [sections, setSections] = useState<Section[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [section, setSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(true);
  const [topicDetails, setTopicDetails] = useState<TopicDetail[]>([]);

  const apiBase = type === 'waec' ? '/waec-sections' : '/jamb-sections';
  const topicsApiBase = type === 'waec' ? '/waec-topics' : '/jamb-topics';
  const detailsApiBase = type === 'waec' ? '/waec-topic-details' : '/jamb-topic-details';
  const homeRoute = `/${type}`;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [sectionsRes, topicsRes, detailsRes] = await Promise.all([
          api.get(apiBase, { withCredentials: true }),
          api.get(topicsApiBase, { withCredentials: true }),
          api.get(detailsApiBase, { withCredentials: true }),
        ]);
        const sectionsData = sectionsRes?.data || [];
        const topicsData = topicsRes?.data || [];
        const detailsData = detailsRes?.data || [];
        
        // Normalize sections data
        const normalizedSections = Array.isArray(sectionsData) ? sectionsData : (Array.isArray(sectionsData?.data) ? sectionsData.data : []);
        setSections(normalizedSections);
        
        // If sectionSlug is provided, find that specific section and its topics
        if (sectionSlug) {
          const foundSection = normalizedSections.find((s: Section) => s.slug === sectionSlug) || null;
          setSection(foundSection);
          setTopics(
            foundSection
              ? (Array.isArray(topicsData)
                  ? topicsData.filter((t: Topic) => t.sectionId === (foundSection._id || foundSection.id))
                  : (Array.isArray(topicsData?.data) 
                      ? topicsData.data.filter((t: Topic) => t.sectionId === (foundSection._id || foundSection.id))
                      : []))
              : []
          );
        } else {
          // No section selected, stay on home/landing page
          setSection(null);
          setTopics([]);
        }
        
        // Normalize topic details
        const normalizedDetails = Array.isArray(detailsData) ? detailsData : (Array.isArray(detailsData?.data) ? detailsData.data : []);
        setTopicDetails(normalizedDetails);
      } catch (err) {
        console.error('Error fetching data:', err);
        setSections([]);
        setSection(null);
        setTopics([]);
        setTopicDetails([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [sectionSlug, apiBase, topicsApiBase, detailsApiBase]);

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', mt: 6, px: 2 }}>
      {!sectionSlug ? (
        // Landing page: Show all sections
        <>
          <Box sx={{ mb: 4 }}>
            <Breadcrumbs sx={{ mb: 2 }} aria-label="breadcrumb">
              <Link underline="hover" color="primary" onClick={() => navigate('/')} sx={{ cursor: 'pointer' }}>Home</Link>
              <Typography color="text.primary" sx={{ fontWeight: 600 }}>{sectionName}</Typography>
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
              {sectionName} Subjects
            </Typography>
            <Typography variant="h6" color="inherit" sx={{ opacity: 0.95 }}>
              Choose a subject to get started
            </Typography>
          </Box>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
              <CircularProgress />
            </Box>
          ) : sections.length === 0 ? (
            <Typography variant="h6" color="text.secondary" align="center" sx={{ mt: 6 }}>
              No subjects available yet.
            </Typography>
          ) : (
            <Grid container spacing={3}>
              {sections.map(sec => (
                <Grid item xs={12} sm={6} md={4} key={sec._id || sec.id}>
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
                      if (sec.slug) {
                        navigate(`/${type}/${sec.slug}`);
                      }
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 700 }} color="primary.main" gutterBottom>
                        {sec.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tap to explore topics
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      ) : (
        // Topics page: Show topics for selected section
        <>
          <Box sx={{ mb: 4 }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => navigate(homeRoute)}
              sx={{ mb: 2 }}
            >
              ← Back to {sectionName}
            </Button>
            <Breadcrumbs sx={{ mb: 2 }} aria-label="breadcrumb">
              <Link underline="hover" color="primary" onClick={() => navigate('/')} sx={{ cursor: 'pointer' }}>Home</Link>
              <Link underline="hover" color="primary" onClick={() => navigate(homeRoute)} sx={{ cursor: 'pointer' }}>{breadcrumbLabel}</Link>
              <Typography color="text.primary" sx={{ fontWeight: 600 }}>{section?.name || 'Topics'}</Typography>
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
              {section?.name ? `${section.name} Topics` : 'Topics'}
            </Typography>
            <Typography variant="h6" color="inherit" sx={{ opacity: 0.95 }}>
              Explore topics and lessons to master {section?.name || 'this subject'}
            </Typography>
          </Box>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
              <CircularProgress />
            </Box>
          ) : topics.length === 0 ? (
            <Typography variant="h6" color="text.secondary" align="center" sx={{ mt: 6 }}>
              No topics found for this section.
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
                        alert('This topic is missing a slug. Please check the admin panel.');
                        return;
                      }
                      const detail = topicDetails.find(
                        d => d.topicUUID === topic.uuid
                      );
                      if (detail) {
                        navigate(`/${type}/${section?.slug}/${topic.slug}/${detail.slug}`);
                      } else {
                        navigate(`/${type}/${section?.slug}/${topic.slug}`);
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
        </>
      )}
    </Box>
  );
};

export default GenericHighSchoolTopicsPage;
