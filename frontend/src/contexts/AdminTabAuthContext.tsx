import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

interface AdminTabAuthContextType {
  isTabVerified: (tabIndex: number) => boolean;
  verifyTabPassword: (password: string, tabIndex: number) => Promise<boolean>;
  clearTabPassword: () => void;
  requiresPassword: (tabIndex: number) => boolean;
}

export const AdminTabAuthContext = createContext<AdminTabAuthContextType | undefined>(undefined);

export const useAdminTabAuth = () => {
  const context = useContext(AdminTabAuthContext);
  if (context === undefined) {
    throw new Error('useAdminTabAuth must be used within an AdminTabAuthProvider');
  }
  return context;
};

// Tabs that require password protection (0-indexed)
const PROTECTED_TABS = [0, 1, 3, 4, 5, 6, 7, 8, 9, 10, 19]; // Projects, Blogs, About, Contact, Research Areas, Project Details, Blog Details, Knowledge Base, Topics, Topic Details, Users

export const AdminTabAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [verifiedTabs, setVerifiedTabs] = useState<number[]>([]);

  // Initialize from sessionStorage (per-tab tokens)
  useEffect(() => {
    try {
      const found: number[] = [];
      PROTECTED_TABS.forEach((idx) => {
        const key = `admin_tab_pw_${idx}`;
        if (sessionStorage.getItem(key)) found.push(idx);
      });
      if (found.length) setVerifiedTabs(found);
    } catch (e) {
      // ignore
    }
  }, []);

  const verifyTabPassword = async (password: string, tabIndex: number): Promise<boolean> => {
    try {
      const res = await api.post('/admin-tab-auth/verify-tab-password', { password });
      if (res?.data?.success && res?.data?.token) {
        try {
          const key = `admin_tab_pw_${tabIndex}`;
          sessionStorage.setItem(key, res.data.token);
        } catch (e) {
          // ignore
        }
        setVerifiedTabs((prev) => Array.from(new Set([...prev, tabIndex])));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Tab password verification failed:', err);
      return false;
    }
  };

  const clearTabPassword = () => {
    try {
      PROTECTED_TABS.forEach((idx) => {
        const key = `admin_tab_pw_${idx}`;
        sessionStorage.removeItem(key);
      });
    } catch (e) {
      // ignore
    }
    setVerifiedTabs([]);
  };

  const requiresPassword = (tabIndex: number): boolean => {
    return PROTECTED_TABS.includes(tabIndex);
  };

  const isTabVerified = (tabIndex: number): boolean => {
    return verifiedTabs.includes(tabIndex);
  };

  return (
    <AdminTabAuthContext.Provider
      value={{
        isTabVerified,
        verifyTabPassword,
        clearTabPassword,
        requiresPassword,
      }}
    >
      {children}
    </AdminTabAuthContext.Provider>
  );
};
