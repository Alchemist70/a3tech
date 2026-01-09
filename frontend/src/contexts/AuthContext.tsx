import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

interface User {
  _id: string;
  name: string;
  email: string;
  role?: string;
  schoolName?: string;
  schoolEmail?: string;
  educationLevel?: string;
  purpose?: string;
  address?: string;
  city?: string;
  country?: string;
  isSubscribed?: boolean;
  googleId?: string;
  profilePhoto?: string;
  profileLocked?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, secretCode?: string) => Promise<User>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  updateUser: (userData: User) => void;
  setToken: (token: string | null) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token and user from localStorage on mount
  useEffect(() => {
    // Load token and user from localStorage; if token exists but user missing,
    // treat as authenticated and fetch profile from backend to populate user.
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user');

    let mounted = true;

    const bootstrap = async () => {
      if (storedToken) {
        setToken(storedToken);
      }

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);

          // If the stored user lacks premium-related flags, refresh from backend
          const hasPremiumFlags = (parsedUser && (parsedUser.hasOwnProperty('isPremium') || parsedUser.hasOwnProperty('isGoldMember') || parsedUser.hasOwnProperty('isSubscribed')));
          if (hasPremiumFlags) {
            setUser(parsedUser);
            console.debug('[AuthContext] Loaded user from localStorage (has premium flags):', {
              email: parsedUser.email,
              isSubscribed: parsedUser.isSubscribed,
              isGoldMember: parsedUser.isGoldMember,
              isPremium: parsedUser.isPremium
            });
            if (mounted) setIsLoading(false);
            return;
          }

          // Stored user present but missing premium flags - fetch authoritative profile
          setUser(parsedUser); // set minimal user while we refresh
          try {
            const res = await api.get('/users/profile');
            if (res?.data?.data) {
              const profile = res.data.data;
              if (mounted) setUser(profile);
              try { localStorage.setItem('user', JSON.stringify(profile)); } catch (e) {}
              console.debug('[AuthContext] Refreshed user profile from backend during bootstrap (stored user lacked premium flags)');
              if (mounted) setIsLoading(false);
              return;
            }
          } catch (err: any) {
            const status = err?.response?.status ?? undefined;
            const message = err?.message ?? String(err);
            console.warn('[AuthContext] Failed to refresh profile during bootstrap:', status || message);
            // keep parsedUser as fallback
            if (mounted) setIsLoading(false);
            return;
          }
        } catch (err) {
          console.error('[AuthContext] Failed to parse stored user:', err);
          localStorage.removeItem('user');
        }
      }

      // If we have a token but no stored user, try to fetch profile from backend
      if (storedToken && !storedUser) {
        try {
          const res = await api.get('/users/profile');
          if (res?.data?.data) {
            const profile = res.data.data;
            if (mounted) setUser(profile);
            try {
              localStorage.setItem('user', JSON.stringify(profile));
            } catch (e) {}
            console.debug('[AuthContext] Retrieved user profile from backend during bootstrapping');
          }
        } catch (err: any) {
          const status = err?.response?.status ?? undefined;
          const message = err?.message ?? String(err);
          console.error('[AuthContext] Failed to fetch profile during bootstrap:', status || message);
          // Only clear token for authentication errors (invalid/expired). For other errors (429 rate-limit), keep token.
          if (status === 401 || status === 403) {
            try { localStorage.removeItem('auth_token'); } catch (e) {}
            if (mounted) setToken(null);
          }
        }
      }

      if (mounted) setIsLoading(false);
    };

    bootstrap();

    return () => { mounted = false; };
  }, []);

  const login = async (email: string, password: string, secretCode?: string): Promise<User> => {
    const res = await api.post('/auth/login', { email, password, secretCode });
    const newToken = res.data?.token;
    let userData = res.data?.data;

    if (newToken && userData) {
      // Persist token immediately so subsequent requests include it
      localStorage.setItem('auth_token', newToken);
      setToken(newToken);

      // Try to fetch authoritative profile (may include isGoldMember/isSubscribed)
      try {
        const profileRes = await api.get('/users/profile');
        if (profileRes?.data?.data) {
          userData = profileRes.data.data;
        }
      } catch (e) {
        // If profile fetch fails, fall back to returned userData from login
        console.warn('[AuthContext] Could not fetch profile after login, using login payload', e);
      }

      // Persist user and update context
      try { localStorage.setItem('user', JSON.stringify(userData)); } catch (e) {}
      setUser(userData);
      return userData;
    } else {
      throw new Error('Invalid login response');
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore logout errors
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    }
  };

  const register = async (name: string, email: string, password: string, schoolName?: string, schoolEmail?: string, educationLevel?: string, purpose?: string, address?: string, city?: string, country?: string) => {
    await api.post('/auth/register', { 
      name, 
      email, 
      password,
      schoolName,
      schoolEmail,
      educationLevel,
      purpose,
      address,
      city,
      country
    });
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const setTokenValue = (newToken: string | null) => {
    setToken(newToken);
    if (newToken) {
      localStorage.setItem('auth_token', newToken);
    } else {
      localStorage.removeItem('auth_token');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
        register,
        updateUser,
        setToken: setTokenValue,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};