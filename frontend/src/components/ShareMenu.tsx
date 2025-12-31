import React, { useState } from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import FacebookIcon from '@mui/icons-material/Facebook';
import XIcon from '@mui/icons-material/X';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import EmailIcon from '@mui/icons-material/Email';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import shareToSocialMedia from '../utils';

interface ShareMenuProps {
  title: string;
  url: string;
  description?: string;
  size?: 'small' | 'medium' | 'large';
}

const ShareMenu: React.FC<ShareMenuProps> = ({ title, url, description = '', size = 'medium' }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [copySnackbar, setCopySnackbar] = useState(false);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleShare = (platform: string) => {
    switch (platform) {
      case 'whatsapp':
        shareToSocialMedia.whatsapp({ title, url, text: description });
        break;
      case 'facebook':
        shareToSocialMedia.facebook({ title, url, text: description });
        break;
      case 'twitter':
        shareToSocialMedia.twitter({ title, url, text: description });
        break;
      case 'linkedin':
        shareToSocialMedia.linkedin({ title, url, text: description });
        break;
      case 'email':
        shareToSocialMedia.email({ title, url, text: description });
        break;
      case 'copy':
        shareToSocialMedia.copyToClipboard(url, title).then((success: boolean) => {
          if (success) {
            setCopySnackbar(true);
          }
        });
        break;
      default:
        break;
    }
    handleClose();
  };

  return (
    <>
      <IconButton
        size={size}
        onClick={handleClick}
        sx={(theme) => ({
          bgcolor: theme.palette.primary.main,
          color: '#fff',
          '&:hover': {
            bgcolor: theme.palette.primary.dark,
          },
        })}
        title="Share"
      >
        <ShareIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <MenuItem onClick={() => handleShare('whatsapp')}>
          <ListItemIcon sx={{ color: '#25D366' }}>
            <WhatsAppIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>WhatsApp</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleShare('facebook')}>
          <ListItemIcon sx={{ color: '#1877F2' }}>
            <FacebookIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Facebook</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleShare('twitter')}>
          <ListItemIcon sx={{ color: '#000' }}>
            <XIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Twitter/X</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleShare('linkedin')}>
          <ListItemIcon sx={{ color: '#0A66C2' }}>
            <LinkedInIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>LinkedIn</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleShare('email')}>
          <ListItemIcon sx={{ color: '#EA4335' }}>
            <EmailIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Email</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleShare('copy')}>
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copy Link</ListItemText>
        </MenuItem>
      </Menu>
      <Snackbar open={copySnackbar} autoHideDuration={2000} onClose={() => setCopySnackbar(false)}>
        <Alert onClose={() => setCopySnackbar(false)} severity="success" sx={{ width: '100%' }}>
          Link copied to clipboard!
        </Alert>
      </Snackbar>
    </>
  );
};

export default ShareMenu;
