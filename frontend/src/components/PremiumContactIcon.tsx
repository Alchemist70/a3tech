import React from 'react';
import { Box, SxProps } from '@mui/material';
import { WorkspacePremium } from '@mui/icons-material';

interface PremiumContactIconProps {
  sx?: SxProps;
}

const PremiumContactIcon: React.FC<PremiumContactIconProps> = ({ sx = {} }) => {
  return (
    <Box sx={{ position: 'relative', ...sx }}>
      <WorkspacePremium 
        sx={{ 
          color: '#FFD700',
          filter: 'drop-shadow(0px 0px 2px rgba(0,0,0,0.5))'
        }} 
      />
    </Box>
  );
};

export default PremiumContactIcon;
