import React from 'react';
import { Box, CircularProgress } from '@mui/material';

const Spinner: React.FC<{size?: number}> = ({ size = 48 }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <CircularProgress size={size} />
    </Box>
  );
};

export default Spinner;
