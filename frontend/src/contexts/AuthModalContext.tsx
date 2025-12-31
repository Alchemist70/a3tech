import React, { createContext, useState, useContext, ReactNode } from 'react';

interface AuthModalContextType {
  loginOpen: boolean;
  signupOpen: boolean;
  openLogin: () => void;
  closeLogin: () => void;
  openSignup: () => void;
  closeSignup: () => void;
  switchToLogin: () => void;
  switchToSignup: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export const AuthModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);

  return (
    <AuthModalContext.Provider
      value={{
        loginOpen,
        signupOpen,
        openLogin: () => {
          setLoginOpen(true);
          setSignupOpen(false);
        },
        closeLogin: () => setLoginOpen(false),
        openSignup: () => {
          setSignupOpen(true);
          setLoginOpen(false);
        },
        closeSignup: () => setSignupOpen(false),
        switchToLogin: () => {
          setLoginOpen(true);
          setSignupOpen(false);
        },
        switchToSignup: () => {
          setSignupOpen(true);
          setLoginOpen(false);
        }
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
};

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModal must be used within AuthModalProvider');
  }
  return context;
};
