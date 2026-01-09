import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import { CustomThemeProvider, useTheme as useCustomTheme } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { AuthModalProvider } from './contexts/AuthModalContext';
import { SafeExamModeProvider } from './contexts/SafeExamModeContext';

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
import WaecTopics from './pages/WaecTopics';
import JambTopics from './pages/JambTopics';
import JambMockTestStart from './pages/JambMockTestStart';
import JambSubjectSelection from './pages/JambSubjectSelection';
import JambConfirmation from './pages/JambConfirmation';
import JambTestInstructions from './pages/JambTestInstructions';
import JambTest from './pages/JambTest';
import JambResult from './pages/JambResult';
import JambCheckResult from './pages/JambCheckResult';
import WaecMockTestStart from './pages/WaecMockTestStart';
import WaecSubjectSelection from './pages/WaecSubjectSelection';
import WaecConfirmation from './pages/WaecConfirmation';
import WaecTestInstructions from './pages/WaecTestInstructions';
import WaecTest from './pages/WaecTest';
import WaecResult from './pages/WaecResult';
import WaecCheckResult from './pages/WaecCheckResult';
import { useSafeExamMode } from './contexts/SafeExamModeContext';

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobileState, setIsMobileState] = useState(false); // Local state backup
  const { darkMode } = useCustomTheme();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isExamMode } = useSafeExamMode();

  // Sync isMobile to local state to handle useMediaQuery inconsistencies after multiple refreshes
  useEffect(() => {
    setIsMobileState(isMobile);
    // Always close sidebar when switching to mobile
    if (isMobile) {
      setSidebarOpen(false);
    }
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
  const sidebarVariant = isMobileState ? 'temporary' : 'persistent';

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: darkMode ? '#0f172a' : 'transparent' }}>
        {!isExamMode && <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />}
        <Box sx={{ display: 'flex', flexGrow: 1 }}>
          {!isExamMode && <Sidebar 
            open={sidebarOpen} 
            onClose={() => setSidebarOpen(false)} 
            variant={sidebarVariant}
          />}
          <Box 
            component="main" 
            sx={{ 
              flexGrow: 1, 
              pl: { 
                xs: 0, 
                sm: (sidebarOpen && !isMobileState) ? '240px' : 0,
                md: (sidebarOpen && !isMobileState) ? '240px' : 0
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
                
                {/* High School (WAEC/JAMB) routes */}
                {/* Keep a single canonical Home at '/' for high-school users; redirect legacy path to root */}
                <Route path="/high-school" element={<Navigate to="/" replace />} />
                <Route path="/waec" element={
                  <GoldMemberRoute>
                    <WaecTopics />
                  </GoldMemberRoute>
                } />
                <Route path="/jamb" element={
                  <GoldMemberRoute>
                    <JambTopics />
                  </GoldMemberRoute>
                } />
                <Route path="/waec/:sectionSlug" element={
                  <GoldMemberRoute>
                    <WaecTopics />
                  </GoldMemberRoute>
                } />
                <Route path="/jamb/:sectionSlug" element={
                  <GoldMemberRoute>
                    <JambTopics />
                  </GoldMemberRoute>
                } />
                <Route path="/waec/:sectionSlug/:topicSlug" element={
                  <GoldMemberRoute>
                    <TopicDetail />
                  </GoldMemberRoute>
                } />
                <Route path="/waec/:sectionSlug/:topicSlug/:detailSlug" element={
                  <GoldMemberRoute>
                    <TopicDetail />
                  </GoldMemberRoute>
                } />
                <Route path="/jamb/:sectionSlug/:topicSlug" element={
                  <GoldMemberRoute>
                    <TopicDetail />
                  </GoldMemberRoute>
                } />
                <Route path="/jamb/:sectionSlug/:topicSlug/:detailSlug" element={
                  <GoldMemberRoute>
                    <TopicDetail />
                  </GoldMemberRoute>
                } />
                
                {/* Mock Test Routes */}
                <Route path="/mock-test/jamb" element={
                  <ProtectedRoute>
                    <JambMockTestStart />
                  </ProtectedRoute>
                } />
                <Route path="/mock-test/jamb/subjects" element={
                  <ProtectedRoute>
                    <JambSubjectSelection />
                  </ProtectedRoute>
                } />
                <Route path="/mock-test/jamb/subjects/:mockTestId" element={
                  <ProtectedRoute>
                    <JambSubjectSelection />
                  </ProtectedRoute>
                } />
                <Route path="/mock-test/jamb/confirm/:mockTestId" element={
                  <ProtectedRoute>
                    <JambConfirmation />
                  </ProtectedRoute>
                } />
                <Route path="/mock-test/jamb/instructions/:mockTestId" element={
                  <ProtectedRoute>
                    <JambTestInstructions />
                  </ProtectedRoute>
                } />
                <Route path="/mock-test/jamb/test/:mockTestId" element={
                  <ProtectedRoute>
                    <JambTest />
                  </ProtectedRoute>
                } />
                <Route path="/mock-test/jamb/result/:mockTestId" element={
                  <ProtectedRoute>
                    <JambResult />
                  </ProtectedRoute>
                } />
                <Route path="/mock-test/jamb/check-result" element={
                  <ProtectedRoute>
                    <JambCheckResult />
                  </ProtectedRoute>
                } />
                <Route path="/mock-test/waec" element={
                  <ProtectedRoute>
                    <WaecMockTestStart />
                  </ProtectedRoute>
                } />
                <Route path="/mock-test/waec/subjects" element={
                  <ProtectedRoute>
                    <WaecSubjectSelection />
                  </ProtectedRoute>
                } />
                <Route path="/mock-test/waec/subjects/:mockTestId" element={
                  <ProtectedRoute>
                    <WaecSubjectSelection />
                  </ProtectedRoute>
                } />
                <Route path="/mock-test/waec/confirm/:mockTestId" element={
                  <ProtectedRoute>
                    <WaecConfirmation />
                  </ProtectedRoute>
                } />
                <Route path="/mock-test/waec/instructions/:mockTestId" element={
                  <ProtectedRoute>
                    <WaecTestInstructions />
                  </ProtectedRoute>
                } />
                <Route path="/mock-test/waec/test/:mockTestId" element={
                  <ProtectedRoute>
                    <WaecTest />
                  </ProtectedRoute>
                } />
                <Route path="/mock-test/waec/result/:mockTestId" element={
                  <ProtectedRoute>
                    <WaecResult />
                  </ProtectedRoute>
                } />
                <Route path="/mock-test/waec/check-result" element={
                  <ProtectedRoute>
                    <WaecCheckResult />
                  </ProtectedRoute>
                } />
                
                {/* JAMB Mock Test Routes */}
                <Route path="/subscription" element={<Subscription />} />
                <Route path="/payment" element={<Payment />} />
                <Route path="/auth-callback" element={<AuthCallback />} />
                <Route path="*" element={<NotFound />} />
                </Routes>
            </Box>
          </Box>
          {!isExamMode && <Footer />}
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
            <SafeExamModeProvider>
              <AppContent />
              {/* Global chat widget wrapper */}
              <ChatWidgetWrapper />
            </SafeExamModeProvider>
          </AuthModalProvider>
        </AuthProvider>
      </Router>
    </CustomThemeProvider>
  );
}

// Wrapper to conditionally show ChatWidget
function ChatWidgetWrapper() {
  const { isExamMode } = useSafeExamMode();
  return !isExamMode ? <ChatWidget /> : null;
}

export default App;