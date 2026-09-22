import { apiClient } from './api';
import type { User, ChangePasswordPayload, ProfileUpdatePayload } from '../types/auth';

export const profileService = {
  /**
   * Fetches the current user's profile via GET /profile
   */
  async getProfile(): Promise<User> {
    return apiClient<User>('/profile', {
      method: 'GET',
      requiresAuth: true,
    });
  },

  /**
   * Updates profile via PATCH /profile (multipart/form-data)
   */
  async updateProfile(payload: ProfileUpdatePayload): Promise<User> {
    const formData = new FormData();
    if (payload.name !== undefined) {
      formData.append('name', payload.name.trim());
    }
    if (payload.email !== undefined) {
      formData.append('email', payload.email.trim().toLowerCase());
    }
    if (payload.avatar !== undefined && payload.avatar !== null) {
      formData.append('avatar', payload.avatar);
    }

    return apiClient<User>('/profile', {
      method: 'PATCH',
      body: formData,
      requiresAuth: true,
    });
  },

  /**
   * Changes password via POST /profile/change-password
   */
  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    await apiClient<void>('/profile/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
      requiresAuth: true,
    });
  },
};
