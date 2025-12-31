import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import api from '../api';
import Spinner from './Spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children,
  requireAdmin = false 
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { openLogin } = useAuthModal();
  const location = useLocation();

  // Allow either the public auth context or a separate admin session stored in localStorage
  // Admin session keys: admin_auth_token, admin_user
  const [adminVerified, setAdminVerified] = useState<boolean | null>(null);
  const [adminChecking, setAdminChecking] = useState(false);

  useEffect(() => {
    let mounted = true;
    const checkAdmin = async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('admin_auth_token') : null;
        console.debug('[ProtectedRoute] admin token present:', !!token);
        if (!token) {
          console.debug('[ProtectedRoute] no admin token found');
          if (mounted) setAdminVerified(false);
          return;
        }
        try {
          setAdminChecking(true);
          console.debug('[ProtectedRoute] verifying admin token via /admin/auth/me');
          const res = await api.get('/admin/auth/me');
          console.debug('[ProtectedRoute] /admin/auth/me response:', res?.status, res?.data);
          if (mounted) setAdminVerified(res.data?.success && res.data?.data?.role === 'admin');
        } catch (e: any) {
          // log detailed error for debugging, then clear invalid admin session
          console.error('[ProtectedRoute] admin check failed:', e?.response?.status, e?.response?.data || e.message);
          try { localStorage.removeItem('admin_auth_token'); localStorage.removeItem('admin_user'); } catch (err) {}
          if (mounted) setAdminVerified(false);
        } finally {
          if (mounted) setAdminChecking(false);
        }
    };
    checkAdmin();
    return () => { mounted = false; };
  }, []);

  // If still loading, show loading state.
  // For admin routes we must wait until adminVerified is known (not null)
  if (isLoading || (requireAdmin && (adminChecking || adminVerified === null))) {
    return <Spinner />;
  }

  // For admin routes
  if (requireAdmin) {
    // Check if user is admin either through public auth or admin session
    const isAdmin = (isAuthenticated && user?.role === 'admin') || adminVerified === true;
    
    if (!isAdmin) {
      // Clear any invalid admin session
      localStorage.removeItem('admin_auth_token');
      localStorage.removeItem('admin_user');
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    return <>{children}</>;
  }

  // For non-admin protected routes
  if (!isAuthenticated) {
    openLogin();
    return <>{children}</>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;