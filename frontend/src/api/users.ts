import api from './index';

export interface UserWithGoldMemberStatus {
  _id: string;
  name: string;
  email: string;
  role: string;
  interests?: string[];
  educationalLevel?: string;
  lastLogin?: string;
  isActive: boolean;
  isSubscribed: boolean;
  createdAt: string;
  updatedAt: string;
  isGoldMember: boolean;
  goldMemberId: string | null;
  goldMemberAddedAt: string | null;
}

// Get all registered users with their Gold Member status (admin only)
export const fetchUsersWithGoldMemberStatus = async (): Promise<UserWithGoldMemberStatus[]> => {
  try {
    const response = await api.get('/admin/users');
    return response.data?.data || [];
  } catch (error) {
    console.error('Error fetching users with gold member status:', error);
    throw error;
  }
};






