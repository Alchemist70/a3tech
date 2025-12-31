import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  CircularProgress, 
  Alert, 
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip
} from '@mui/material';
import { CheckCircle, Cancel, Add as AddIcon } from '@mui/icons-material';
import { fetchGoldMembers, addGoldMember, removeGoldMember } from '../../api/goldMembers';
import { fetchUsersWithGoldMemberStatus, UserWithGoldMemberStatus } from '../../api/users';

const AdminUsersTab: React.FC = () => {
  const [goldEmail, setGoldEmail] = useState('');
  const [goldError, setGoldError] = useState<string | null>(null);
  const [goldLoading, setGoldLoading] = useState(false);
  const [users, setUsers] = useState<UserWithGoldMemberStatus[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const usersData = await fetchUsersWithGoldMemberStatus();
      setUsers(usersData);
      setGoldError(null);
    } catch (err: any) {
      setGoldError('Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleToggleGoldMember = async (user: UserWithGoldMemberStatus) => {
    try {
      setGoldLoading(true);
      setGoldError(null);

      if (user.isGoldMember && user.goldMemberId) {
        // Remove from gold members
        await removeGoldMember(user.goldMemberId);
      } else {
        // Add to gold members
        await addGoldMember({ email: user.email });
      }
      
      // Reload users to get updated status
      await loadUsers();
    } catch (err: any) {
      setGoldError(err?.response?.data?.message || 'Failed to update gold member status');
      console.error('Error toggling gold member:', err);
    } finally {
      setGoldLoading(false);
    }
  };

  const handleAddGoldMemberByEmail = async () => {
    const email = (goldEmail || '').trim().toLowerCase();
    if (!email) {
      setGoldError('Email required');
      return;
    }

    try {
      setGoldLoading(true);
      setGoldError(null);
      await addGoldMember({ email });
      setGoldEmail('');
      await loadUsers(); // Reload to update the list
    } catch (err: any) {
      setGoldError(err?.response?.data?.message || 'Failed to add gold member');
      console.error('Error adding gold member:', err);
    } finally {
      setGoldLoading(false);
    }
  };

  // Load users on mount
  useEffect(() => {
    loadUsers();
  }, []);

  const goldMemberCount = users.filter(u => u.isGoldMember).length;

  return (
    <Box>
      <Typography variant="h6">Users Management</Typography>
      <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
        View all registered users and manage their Gold Member status for full access without subscription.
      </Typography>

      {/* Add Gold Member by Email Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Add Gold Member by Email</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField 
            label="Email" 
            size="small" 
            value={goldEmail} 
            onChange={e => setGoldEmail(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddGoldMemberByEmail();
              }
            }}
            fullWidth
          />
          <Button 
            variant="contained" 
            onClick={handleAddGoldMemberByEmail}
            disabled={goldLoading || usersLoading}
            startIcon={<AddIcon />}
          >
            Add
          </Button>
        </Box>
      </Paper>

      {goldError && <Alert severity="error" sx={{ mb: 2 }}>{goldError}</Alert>}
      {(goldLoading || usersLoading) && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {/* Users Table */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1">
            All Registered Users ({users.length})
          </Typography>
          <Chip 
            label={`${goldMemberCount} Gold Member${goldMemberCount !== 1 ? 's' : ''}`}
            color="primary"
            variant="outlined"
          />
        </Box>

        {users.length === 0 && !usersLoading && (
          <Alert severity="info">No registered users found.</Alert>
        )}

        {users.length > 0 && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Name</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Gold Member</strong></TableCell>
                  <TableCell><strong>Registered</strong></TableCell>
                  <TableCell><strong>Last Login</strong></TableCell>
                  <TableCell align="center"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id} hover>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <Chip label="Active" color="success" size="small" variant="filled" sx={{ color: '#ffffff' }} />
                      ) : (
                        <Chip label="Inactive" color="default" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      {user.isGoldMember ? (
                        <Chip 
                          icon={<CheckCircle />} 
                          label="Gold Member" 
                          size="small" 
                          variant="filled"
                          sx={{ backgroundColor: '#c38800', color: '#000', fontWeight: 600 }}
                        />
                      ) : (
                        <Chip 
                          icon={<Cancel />} 
                          label="Regular" 
                          color="default" 
                          size="small" 
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {user.createdAt ? new Date(user.createdAt).toLocaleString() : '—'}
                    </TableCell>
                    <TableCell>
                      {user.lastLogin 
                        ? new Date(user.lastLogin).toLocaleString() 
                        : 'Never'}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={user.isGoldMember ? 'Remove Gold Member status' : 'Add Gold Member status'}>
                        <IconButton
                          color={user.isGoldMember ? 'error' : 'primary'}
                          onClick={() => handleToggleGoldMember(user)}
                          disabled={goldLoading || usersLoading}
                          size="small"
                        >
                          {user.isGoldMember ? <Cancel /> : <CheckCircle />}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
};

export default AdminUsersTab;