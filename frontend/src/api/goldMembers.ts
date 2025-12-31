import api from './index';

interface GoldMember {
  _id: string;
  email: string;
  addedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface AddGoldMemberRequest {
  email: string;
  notes?: string;
}

// Get all gold members
export const fetchGoldMembers = async (): Promise<GoldMember[]> => {
  try {
    const response = await api.get('/gold-members');
    return response.data;
  } catch (error) {
    console.error('Error fetching gold members:', error);
    throw error;
  }
};

// Add a new gold member
export const addGoldMember = async (data: AddGoldMemberRequest): Promise<GoldMember> => {
  try {
    const response = await api.post('/gold-members', data);
    return response.data;
  } catch (error) {
    console.error('Error adding gold member:', error);
    throw error;
  }
};

// Remove a gold member
export const removeGoldMember = async (id: string): Promise<void> => {
  try {
    await api.delete(`/gold-members/${id}`);
  } catch (error) {
    console.error('Error removing gold member:', error);
    throw error;
  }
};

// Update gold member notes
export const updateGoldMember = async (id: string, notes: string): Promise<GoldMember> => {
  try {
    const response = await api.patch(`/gold-members/${id}`, { notes });
    return response.data;
  } catch (error) {
    console.error('Error updating gold member:', error);
    throw error;
  }
};