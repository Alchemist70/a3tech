import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const CustomThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Apply a data-theme attribute so CSS can override regardless of OS preference
  useEffect(() => {
    try {
      const el = document.documentElement;
      if (darkMode) el.setAttribute('data-theme', 'dark');
      else el.setAttribute('data-theme', 'light');
    } catch (e) {
      // ignore
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prev: boolean) => !prev);
  };

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: darkMode ? '#4a9eff' : '#0b5ed7',
        light: darkMode ? '#80c5ff' : '#0d66cc',
        dark: darkMode ? '#2980d9' : '#084c9e',
        contrastText: '#ffffff',
      },
      secondary: {
        main: darkMode ? '#7dd3fc' : '#0dcaf0',
        light: darkMode ? '#a5e4ff' : '#87ceeb',
        dark: darkMode ? '#0891b2' : '#088395',
        contrastText: '#ffffff',
      },
      success: {
        main: darkMode ? '#86efac' : '#198754',
        light: darkMode ? '#bbf7d0' : '#6ea86e',
        dark: darkMode ? '#22c55e' : '#0b5344',
      },
      warning: {
        main: darkMode ? '#fbbf24' : '#ffc107',
        light: darkMode ? '#fcd34d' : '#ffdb58',
        dark: darkMode ? '#f59e0b' : '#cc8800',
      },
      error: {
        main: darkMode ? '#f87171' : '#dc3545',
        light: darkMode ? '#fca5a5' : '#f1808e',
        dark: darkMode ? '#ef4444' : '#a71d2a',
      },
      background: {
        default: darkMode ? '#0f172a' : '#f8f9fa',
        paper: darkMode ? '#1e293b' : '#ffffff',
      },
      text: {
        primary: darkMode ? '#f1f5f9' : '#1f2937',
        secondary: darkMode ? '#cbd5e1' : '#6b7280',
        disabled: darkMode ? '#64748b' : '#d1d5db',
      },
      divider: darkMode ? '#334155' : '#e5e7eb',
    },
    typography: {
      fontFamily: '"Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 800,
        fontSize: '2.5rem',
        letterSpacing: '-0.02em',
        color: darkMode ? '#f1f5f9' : '#0f172a',
      },
      h2: {
        fontWeight: 700,
        fontSize: '2rem',
        color: darkMode ? '#f1f5f9' : '#1e293b',
      },
      h3: {
        fontWeight: 700,
        fontSize: '1.5rem',
        color: darkMode ? '#f1f5f9' : '#1e293b',
      },
      h4: {
        fontWeight: 600,
        fontSize: '1.25rem',
        color: darkMode ? '#f1f5f9' : '#334155',
      },
      h5: {
        fontWeight: 600,
        fontSize: '1rem',
      },
      h6: {
        fontWeight: 600,
        fontSize: '0.875rem',
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.5,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: '0.95rem',
            padding: '10px 20px',
            transition: 'all 0.2s ease',
          },
          contained: {
            backgroundColor: darkMode ? '#4a9eff' : '#0b5ed7',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: darkMode ? '#2980d9' : '#084c9e',
              boxShadow: '0 4px 12px rgba(11, 94, 215, 0.3)',
            },
          },
          outlined: {
            borderColor: darkMode ? '#4a9eff' : '#0b5ed7',
            color: darkMode ? '#4a9eff' : '#0b5ed7',
            '&:hover': {
              backgroundColor: darkMode ? 'rgba(74, 158, 255, 0.1)' : 'rgba(11, 94, 215, 0.05)',
              borderColor: darkMode ? '#80c5ff' : '#0d66cc',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
            boxShadow: darkMode 
              ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
              : '0 2px 8px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: darkMode 
                ? '0 8px 20px rgba(0, 0, 0, 0.4)' 
                : '0 8px 16px rgba(0, 0, 0, 0.12)',
              transform: 'translateY(-2px)',
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: darkMode ? '#1e293b' : '#ffffff',
            color: darkMode ? '#f1f5f9' : '#0f172a',
            borderBottom: darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
            boxShadow: darkMode 
              ? '0 2px 8px rgba(0, 0, 0, 0.3)' 
              : '0 1px 3px rgba(0, 0, 0, 0.1)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: darkMode ? '#1e293b' : '#ffffff',
            borderRadius: 12,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              '&:hover fieldset': {
                borderColor: darkMode ? '#4a9eff' : '#0b5ed7',
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            fontWeight: 500,
          },
          filled: {
            backgroundColor: darkMode ? '#334155' : '#e2e8f0',
          },
        },
      },
    },
  });

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};
