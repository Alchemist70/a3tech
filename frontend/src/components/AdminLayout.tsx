import React from 'react';
import { Box, AppBar, Toolbar, Typography } from '@mui/material';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky" elevation={0} sx={{ 
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Toolbar>
          <Box component="img" src="/favicon.png" sx={{ height: 40, width: 40, mr: 1 }} />
          <Typography variant="h6" color="text.primary">
            A3 Tech Admin
          </Typography>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1 }}>
        {children}
      </Box>
    </Box>
  );
};

export default AdminLayout;