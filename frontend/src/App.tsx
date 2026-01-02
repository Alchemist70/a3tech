import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import { CustomThemeProvider, useTheme as useCustomTheme } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { AuthModalProvider } from './contexts/AuthModalContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatWidget from './components/ChatWidget/ChatWidget';
import LoginModal from './components/modals/LoginModal';
import SignupModal from './components/modals/SignupModal';
import Home from './pages/Home';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Blog from './pages/Blog';
import FAQ from './pages/FAQ';
import About from './pages/About';
import Contact from './pages/Contact';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import Admin from './pages/Admin';
import BlogDetail from './pages/BlogDetail';
import Bookmarks from './pages/Bookmarks';
import AdminBlogDetail from './pages/admin/AdminBlogDetail';
import KnowledgeBase from './pages/KnowledgeBase';
import TopicPage from './pages/TopicPage';
import TopicDetail from './pages/TopicDetail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminLogin from './pages/AdminLogin';
import AdminSignup from './pages/AdminSignup';
import ProtectedRoute from './components/ProtectedRoute';
import GoldMemberRoute from './components/GoldMemberRoute';
import Subscription from './pages/Subscription';
import Payment from './pages/Payment';
import Sidebar from './components/Sidebar';
import AuthCallback from './pages/AuthCallback';

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { darkMode } = useCustomTheme();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // On mobile, sidebar should start closed. Reset on every mount and when isMobile changes.
  useEffect(() => {
    setSidebarOpen(false);
  }, [isMobile]);

  // Apply dark background overlay in dark mode
  useEffect(() => {
    const htmlElement = document.documentElement;
    const bodyElement = document.body;
    
    if (darkMode) {
      // Add dark overlay to background image
      htmlElement.style.setProperty('--bg-overlay', 'rgba(15, 23, 42, 0.85)');
      bodyElement.style.backgroundColor = '#0f172a';
    } else {
      htmlElement.style.setProperty('--bg-overlay', 'transparent');
      bodyElement.style.backgroundColor = 'transparent';
    }
  }, [darkMode]);

  // Determine sidebar variant: temporary on mobile, persistent on larger screens (persistent can be toggled)
  const sidebarVariant = isMobile ? 'temporary' : 'persistent';

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: darkMode ? '#0f172a' : 'transparent' }}>
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <Box sx={{ display: 'flex', flexGrow: 1 }}>
          <Sidebar 
            open={sidebarOpen} 
            onClose={() => setSidebarOpen(false)} 
            variant={sidebarVariant}
          />
          <Box 
            component="main" 
            sx={{ 
              flexGrow: 1, 
              pl: { 
                xs: 0, 
                sm: (sidebarOpen && !isMobile) ? '240px' : 0,
                md: (sidebarOpen && !isMobile) ? '240px' : 0
              }, 
              transition: 'padding-left 0.3s ease', 
              backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.3)' : 'transparent',
              width: { xs: '100%', sm: 'auto' },
              overflowX: 'hidden',
            }}
          >
                  <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/projects" element={
                  <GoldMemberRoute>
                    <Projects />
                  </GoldMemberRoute>
                } />
                <Route path="/projects/:id" element={
                  <GoldMemberRoute>
                    <ProjectDetail />
                  </GoldMemberRoute>
                } />
                <Route path="/blog" element={
                  <ProtectedRoute>
                    <Blog />
                  </ProtectedRoute>
                } />
                <Route path="/blog/:title" element={
                  <ProtectedRoute>
                    <BlogDetail />
                  </ProtectedRoute>
                } />
                <Route path="/bookmarks" element={
                  <ProtectedRoute>
                    <Bookmarks />
                  </ProtectedRoute>
                } />
                <Route path="/faq" element={
                  <ProtectedRoute>
                    <FAQ />
                  </ProtectedRoute>
                } />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/knowledge-base" element={<KnowledgeBase />} />
                
                {/* Admin routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/signup" element={<AdminSignup />} />
                <Route path="/admin" element={
                  <ProtectedRoute requireAdmin={true}>
                    <Admin />
                  </ProtectedRoute>
                } />
                <Route path="/admin/blogs/:title" element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminBlogDetail />
                  </ProtectedRoute>
                } />
                <Route path="/knowledge-base/:subjectSlug" element={
                  <GoldMemberRoute>
                    <TopicPage />
                  </GoldMemberRoute>
                } />
                <Route path="/knowledge-base/:subjectSlug/:topicSlug" element={
                  <GoldMemberRoute>
                    <TopicDetail />
                  </GoldMemberRoute>
                } />
                <Route path="/knowledge-base/:subjectSlug/:topicSlug/:detailSlug" element={
                  <GoldMemberRoute>
                    <TopicDetail />
                  </GoldMemberRoute>
                } />
                {/* New subscription and payment routes */}
                <Route path="/subscription" element={<Subscription />} />
                <Route path="/payment" element={<Payment />} />
                <Route path="/auth-callback" element={<AuthCallback />} />
                <Route path="*" element={<NotFound />} />
                  </Routes>
                </Box>
              </Box>
              <Footer />
            </Box>
      {/* Auth modals */}
      <LoginModal />
      <SignupModal />
    </>
  );
}

function App() {
  return (
    <CustomThemeProvider>
      <Router>
        <AuthProvider>
          <AuthModalProvider>
            <AppContent />
            {/* Global chat widget (fixed, won't affect routing) */}
            <ChatWidget />
          </AuthModalProvider>
        </AuthProvider>
      </Router>
    </CustomThemeProvider>
  );
}

export default App;