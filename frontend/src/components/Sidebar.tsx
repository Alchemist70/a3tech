import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Button, Box } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import FolderIcon from '@mui/icons-material/Folder';
import BookIcon from '@mui/icons-material/Book';
import HelpIcon from '@mui/icons-material/Help';
import ScienceIcon from '@mui/icons-material/Science';
import DownloadIcon from '@mui/icons-material/Download';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import Collapse from '@mui/material/Collapse';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styles from './Sidebar.module.css';
import api from '../api';
import { usePWAInstall } from '../hooks/usePWAInstall';

// Removed: knowledgeBaseSubjects (now dynamic)


interface Subject {
  _id?: string;
  id?: string;
  name: string;
  slug?: string;
}

const Sidebar: React.FC<{ open: boolean; onClose: () => void; variant?: 'permanent' | 'temporary' | 'persistent' }> = ({ open, onClose, variant = 'permanent' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = React.useState(false);
  const [openKbDropdown, setOpenKbDropdown] = React.useState(false);
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [researchAreas, setResearchAreas] = React.useState<any[]>([]);
  const { canInstall, installApp, isInstalled } = usePWAInstall();

  // Fetch research areas from backend so the public sidebar is driven by admin-managed content
  React.useEffect(() => {
    let mounted = true;
    const fetchResearchAreas = async () => {
      try {
        const res = await api.get('/research-areas');
        // API may return { data: [...] } or an array directly
        let data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        if (!Array.isArray(data)) data = [];
        // Data may be array of strings or objects. Normalize to objects with title and optional order.
        // Important: do NOT assign a default numeric order to string entries — that forces them
        // to the top. Preserve explicit numeric `order` when provided by admin, otherwise
        // fall back to alphabetical sorting by title.
        const areas = data
          .map((d: any) => {
            if (typeof d === 'string') return { title: d, order: undefined };
            return { ...d, title: d.title || d.name || '', order: typeof d.order === 'number' ? d.order : undefined };
          })
          .filter((a: any) => a.title);

        // Sort strategy:
        // - Items with an explicit numeric `order` come first (ascending)
        // - Items without `order` are sorted alphabetically by title (case-insensitive)
        areas.sort((a: any, b: any) => {
          const ao = typeof a.order === 'number' ? a.order : null;
          const bo = typeof b.order === 'number' ? b.order : null;
          if (ao !== null && bo !== null) {
            if (ao !== bo) return ao - bo;
            // if identical numeric order, fall back to title
          } else if (ao !== null) {
            return -1; // a has explicit order, b doesn't -> a before b
          } else if (bo !== null) {
            return 1; // b has explicit order, a doesn't -> b before a
          }
          // Neither has explicit order -> alphabetical by title
          return String(a.title).localeCompare(String(b.title), undefined, { sensitivity: 'base' });
        });
        if (mounted) setResearchAreas(areas);
      } catch (err) {
        // Keep existing behavior if backend not available — show nothing
        if (mounted) setResearchAreas([]);
      }
    };
    fetchResearchAreas();
    return () => { mounted = false; };
  }, []);

  React.useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await api.get('/knowledge-base/subjects', { withCredentials: true });
        const data = res.data;
        setSubjects(Array.isArray(data) ? data : (data?.data || []));
      } catch {
        setSubjects([]);
      }
    };
    fetchSubjects();
  }, []);

  const handleKbDropdownClick = () => {
    setOpenKbDropdown((prev) => !prev);
  };

  const handleKbSubjectClick = (subject: Subject) => {
    if (subject.slug) {
      navigate(`/knowledge-base/${subject.slug}`);
      setOpenKbDropdown(false);
    }
  };

  const handleDropdownClick = () => {
    setOpenDropdown((prev) => !prev);
  };

  const handleResearchAreaClick = (area: string) => {
    const keyword = area.toLowerCase().replace(/\s+/g, '-');
    navigate(`/projects?category=${encodeURIComponent(keyword)}`);
  };

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      classes={{ paper: styles.sidebarDrawer }}
      ModalProps={{
        keepMounted: true, // Better mobile performance
      }}
      sx={{
        // For temporary drawer on mobile - let MUI handle positioning and sizing
        ...(variant === 'temporary' && {
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            backgroundColor: 'inherit',
            overflow: 'auto',
          },
        }),
        // For persistent drawer on desktop
        ...(variant === 'persistent' && {
          '& .MuiDrawer-paper': {
            position: 'fixed',
            top: 64,
            left: 0,
            height: 'calc(100vh - 64px)',
            zIndex: 1200,
          },
        }),
      }}
    >
      <React.Fragment>
        <Box className={styles.sidebarTop}>
          {/* Show Download App button only when installable and not already in app mode */}
          {canInstall && !isInstalled && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<DownloadIcon />}
              className={styles.downloadAppBtn}
              onClick={() => installApp()}
              fullWidth
            >
              Download App
            </Button>
          )}
        </Box>
        <List>
          <ListItem
            button
            onClick={handleKbDropdownClick}
            selected={location.pathname.startsWith('/knowledge-base') || openKbDropdown}
          >
            <ListItemIcon><MenuBookIcon /></ListItemIcon>
            <ListItemText primary="Knowledge Base" className={styles.sidebarListItemText} />
            <ExpandMoreIcon
              style={{
                transform: openKbDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: '0.2s'
              }}
            />
          </ListItem>
          <Collapse in={openKbDropdown} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {subjects.map((subject) => (
                <ListItem
                  button
                  key={subject.slug || subject._id || subject.id}
                  sx={{ pl: 4 }}
                  onClick={() => handleKbSubjectClick(subject)}
                >
                  <ListItemText
                    primary={subject.name}
                    className={styles.sidebarSubItemText}
                  />
                </ListItem>
              ))}
            </List>
          </Collapse>
          <ListItem
            button
            component={Link}
            to="/"
            selected={location.pathname === '/'}
          >
            <ListItemIcon><HomeIcon /></ListItemIcon>
            <ListItemText primary="Home" className={styles.sidebarListItemText} />
          </ListItem>
          <ListItem
            button
            component={Link}
            to="/projects"
            selected={location.pathname.startsWith('/projects')}
          >
            <ListItemIcon><FolderIcon /></ListItemIcon>
            <ListItemText primary="Projects" className={styles.sidebarListItemText} />
          </ListItem>
          <ListItem
            button
            component={Link}
            to="/blog"
            selected={location.pathname.startsWith('/blog')}
          >
            <ListItemIcon><BookIcon /></ListItemIcon>
            <ListItemText primary="Blog" className={styles.sidebarListItemText} />
          </ListItem>
          {/* Bookmarks removed from sidebar per request */}
          <ListItem
            button
            component={Link}
            to="/faq"
            selected={location.pathname.startsWith('/faq')}
          >
            <ListItemIcon><HelpIcon /></ListItemIcon>
            <ListItemText primary="FAQS" className={styles.sidebarListItemText} />
          </ListItem>
          <ListItem
            button
            onClick={handleDropdownClick}
            selected={openDropdown}
          >
            <ListItemIcon><ScienceIcon /></ListItemIcon>
            <ListItemText primary="Research Areas" className={styles.sidebarListItemText} />
            <ExpandMoreIcon
              style={{
                transform: openDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: '0.2s'
              }}
            />
          </ListItem>
          <Collapse in={openDropdown} timeout="auto" unmountOnExit>
            <List component="div" disablePadding aria-label="Research areas (ordered by site admin)">
              <span className={styles.visuallyHidden}>Research areas ordered by site admin</span>
              {researchAreas.map((area: any) => (
                <ListItem
                  button
                  key={area._id || area.title}
                  sx={{ pl: 4 }}
                  onClick={() => handleResearchAreaClick(area.title)}
                >
                  <ListItemText
                    primary={area.title}
                    className={styles.sidebarSubItemText}
                  />
                </ListItem>
              ))}
            </List>
          </Collapse>
        </List>
      </React.Fragment>
    </Drawer>
  );
};

export default Sidebar;
