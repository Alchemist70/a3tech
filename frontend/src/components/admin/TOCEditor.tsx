import React from 'react';
import { Box, TextField, IconButton, Button } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

type Props = {
  items: string[];
  onChange: (items: string[]) => void;
  readOnly?: boolean;
};

const TOCEditor: React.FC<Props> = ({ items, onChange, readOnly = false }) => {
  const handleChange = (idx: number, v: string) => {
    const copy = [...items];
    copy[idx] = v;
    onChange(copy);
  };
  const handleAdd = () => onChange([...items, '']);
  const handleRemove = (idx: number) => onChange(items.filter((_, i) => i !== idx));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {items.map((it, idx) => (
        <Box key={idx} sx={{ display: 'flex', gap: 1 }}>
          <TextField fullWidth size="small" value={it} onChange={e => handleChange(idx, e.target.value)} InputProps={{ readOnly }} />
          {!readOnly && (
            <IconButton size="small" onClick={() => handleRemove(idx)}>
              <DeleteIcon />
            </IconButton>
          )}
        </Box>
      ))}
      {!readOnly && (
        <Button size="small" variant="outlined" onClick={handleAdd}>Add TOC Item</Button>
      )}
    </Box>
  );
};

export default TOCEditor;
