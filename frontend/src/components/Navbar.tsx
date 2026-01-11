import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
  Divider,
  Avatar,
  ListItemIcon,
  ListItemText,
  TextField,
  InputAdornment,
} from '@mui/material';
import { Menu as MenuIcon, AccountCircle, Logout, Login, PersonAdd, PersonOutline, WorkspacePremium, Settings as SettingsIcon, Search as SearchIcon } from '@mui/icons-material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import { usePremiumStatus } from '../hooks/usePremiumStatus';
import PremiumContactIcon from './PremiumContactIcon';
import styles from './Navbar.module.css';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const { openLogin, openSignup } = useAuthModal();
  const [adminUser, setAdminUser] = useState<{ name?: string; email?: string } | null>(null);
  const { isPremium } = usePremiumStatus();
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  const handleAdminLogout = () => {
    handleMenuClose();
    // CRITICAL: Clear all auth (admin AND public user) to prevent sessions from interfering
    try {
      localStorage.removeItem('admin_auth_token');
      localStorage.removeItem('admin_user');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    } catch (e) {
      // ignore any errors during cleanup
    }
    setAdminUser(null);
    navigate('/admin/login');
  };

  const handleUserLogout = () => {
    handleMenuClose();
    // CRITICAL: Clear all auth (user AND admin) to prevent sessions from interfering
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      localStorage.removeItem('admin_auth_token');
      localStorage.removeItem('admin_user');
    } catch (e) {
      // ignore any errors during cleanup
    }
    logout();
    openLogin();
  };
  
  // Use 'sm' breakpoint so the permanent sidebar remains for most desktop/tablet sizes
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Load admin user from localStorage only when on admin routes
  useEffect(() => {
    try {
      const raw = localStorage.getItem('admin_user');
      if (raw && location.pathname.startsWith('/admin')) {
        setAdminUser(JSON.parse(raw));
      } else {
        setAdminUser(null);
      }
    } catch (e) {
      setAdminUser(null);
    }
  }, [location.pathname]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/projects?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  return (
    <>
  <AppBar position="sticky" elevation={2} sx={(theme) => ({ zIndex: theme.zIndex.drawer + 1, background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`, color: '#ffffff', borderBottom: 'none', borderRadius: 0, marginLeft: 0, width: '100%', className: styles["navbar"] })}>
        <Toolbar>
          {/* Sidebar toggle for desktop */}
          {!isAdminRoute && !isMobile && onToggleSidebar && (
            <IconButton 
              onClick={onToggleSidebar} 
              sx={{ color: '#ffffff', mr: 1 }} 
              aria-label="toggle sidebar"
            >
              <MenuIcon />
            </IconButton>
          )}
          
          {/* Hamburger for mobile */}
          {!isAdminRoute && isMobile && onToggleSidebar && (
            <IconButton edge="start" onClick={onToggleSidebar} sx={{ color: '#ffffff', mr: 1 }} aria-label="open drawer">
              <MenuIcon />
            </IconButton>
          )}

          <Box 
            component={Link} 
            to={isAdminRoute ? "/admin" : "/"} 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              flexGrow: 1, 
              textDecoration: 'none', 
              marginLeft: { xs: 0, sm: 2, md: 8 },
              minWidth: 0, // Allow shrinking on mobile
            }}
          >
            <img 
              src={`${process.env.PUBLIC_URL}/logotech.png`} 
              alt="A3 Logo" 
              style={{ 
                height: isMobile ? 32 : 45, 
                width: isMobile ? 32 : 45, 
                marginRight: isMobile ? 6 : 12, 
                filter: 'brightness(0.8) contrast(1.2) drop-shadow(0 2px 3px rgba(0,0,0,0.4))',
                objectFit: 'contain'
              }} 
            />
            <Typography
              variant="h6"
              className={styles["navbar-logo"]}
              component="span"
              sx={{ 
                color: '#ffffff', 
                fontWeight: 700,
                fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' },
                display: { xs: isMobile ? 'none' : 'flex', sm: 'flex' },
                alignItems: 'center',
              }}
            >
              <span className={styles["a3-text"]}>A3</span> <span className={styles["tech-text"]}>Tech</span>
            </Typography>
          </Box>
          {/* Search Bar - hidden on very small screens */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, flex: 1, maxWidth: { md: 400, lg: 500 }, mx: { md: 1, lg: 2 } }}>
            <TextField
              placeholder="Search projects, topics..."
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearch}
              sx={{
                width: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: 1,
                '& .MuiOutlinedInput-root': {
                  color: '#ffffff',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#ffffff',
                  },
                },
                '& .MuiOutlinedInput-input::placeholder': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  opacity: 1,
                },
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => {
                        if (searchQuery.trim()) {
                          navigate(`/projects?search=${encodeURIComponent(searchQuery)}`);
                          setSearchQuery('');
                        }
                      }}
                      sx={{ color: '#ffffff' }}
                    >
                      <SearchIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2, md: 3 }, marginRight: { xs: 1, sm: 2, md: 8 } }}>
            {/* User greeting */}
            {isAuthenticated || adminUser ? (
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 500, 
                  color: '#ffffff', 
                  display: { xs: 'none', lg: 'block' },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                }}
              >
                Welcome, <strong>{isAdminRoute ? adminUser?.name || 'Admin' : user?.name || 'User'}</strong>
              </Typography>
            ) : null}

            {isAuthenticated || adminUser ? (
              <>
                {/* User avatar/menu button */}
                <IconButton onClick={handleMenuOpen} sx={{ color: '#ffffff' }}>
                  {isAdminRoute ? (
                    // Admin route - show admin avatar
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32,
                        bgcolor: 'primary.main',
                        color: '#fff'
                      }}
                    >
                      {adminUser?.name?.charAt(0).toUpperCase() || 'A'}
                    </Avatar>
                  ) : (
                    // Regular route - show user avatar with premium status
                    user?.name ? (
                      <Box sx={{ position: 'relative' }}>
                        <Avatar 
                          sx={{ 
                            width: 32, 
                            height: 32,
                            bgcolor: isPremium ? 'warning.main' : 'primary.main',
                            color: isPremium ? 'text.primary' : 'inherit'
                          }}
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </Avatar>
                        {isPremium && (
                          <PremiumContactIcon 
                            sx={{ 
                              position: 'absolute',
                              top: -8,
                              right: -8,
                              width: 16,
                              height: 16,
                            }} 
                          />
                        )}
                      </Box>
                    ) : (
                      <AccountCircle fontSize="large" />
                    )
                  )}
                </IconButton>
                {/* User menu */}
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                  <MenuItem onClick={handleMenuClose}>
                    <ListItemIcon>
                      {isAdminRoute ? (
                        <WorkspacePremium fontSize="small" sx={{ color: 'primary.main' }} />
                      ) : isPremium ? (
                        <WorkspacePremium fontSize="small" sx={{ color: 'warning.main' }} />
                      ) : (
                        <PersonOutline fontSize="small" />
                      )}
                    </ListItemIcon>
                    <ListItemText 
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>
                            {isAdminRoute ? adminUser?.name || 'Admin' : user?.name || 'Profile'}
                          </span>
                          {!isAdminRoute && isPremium && (
                            <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 'bold' }}>
                              PREMIUM
                            </Typography>
                          )}
                          {isAdminRoute && (
                            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                              ADMIN
                            </Typography>
                          )}
                        </Box>
                      }
                      secondary={isAdminRoute ? adminUser?.email : user?.email} 
                    />
                  </MenuItem>
                  <Divider />
                  {isAdminRoute ? (
                    // Admin menu items
                    <MenuItem onClick={handleAdminLogout}>
                      <ListItemIcon>
                        <Logout fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Admin Logout" />
                    </MenuItem>
                  ) : (
                    // Regular user menu items
                    <>
                        <MenuItem component={Link} to="/bookmarks" onClick={handleMenuClose}>
                          <ListItemText primary="My Bookmarks" />
                        </MenuItem>
                        <MenuItem component={Link} to="/settings" onClick={handleMenuClose}>
                          <ListItemIcon>
                            <SettingsIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary="Settings" />
                        </MenuItem>
                        <Divider />
                      <MenuItem component={Link} to="/about" onClick={handleMenuClose}>
                        <ListItemText primary="About" />
                      </MenuItem>
                      <MenuItem component={Link} to="/contact" onClick={handleMenuClose}>
                        <ListItemText primary="Contact" />
                      </MenuItem>
                      <Divider />
                      <MenuItem onClick={handleUserLogout}>
                        <ListItemIcon>
                          <Logout fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Logout" />
                      </MenuItem>
                    </>
                  )}
                </Menu>
              </>
            ) : !isAdminRoute && (
              <>
                {/* Login/Signup buttons (hide on admin routes) */}
                <Button
                  startIcon={<PersonAdd />}
                  onClick={openSignup}
                  sx={{ 
                    color: '#ffffff', 
                    textTransform: 'none',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    padding: { xs: '4px 8px', sm: '6px 16px' },
                    '& .MuiButton-startIcon': {
                      marginRight: { xs: 0.5, sm: 1 },
                    },
                  }}
                >
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Sign up</Box>
                </Button>
                <Button
                  startIcon={<Login />}
                  onClick={openLogin}
                  sx={{ 
                    color: '#ffffff', 
                    textTransform: 'none',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    padding: { xs: '4px 8px', sm: '6px 16px' },
                    '& .MuiButton-startIcon': {
                      marginRight: { xs: 0.5, sm: 1 },
                    },
                  }}
                >
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Login</Box>
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>
    </>
  );
}

export default Navbar;
