import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const meetingApi = {
  // Upload multipart form data
  upload: async (formData: FormData) => {
    return api.post('/meetings/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Get all meetings
  getAll: async () => {
    return api.get('/meetings/');
  },
  
  // Get a single meeting
  getOne: async (id: string) => {
    return api.get(`/meetings/${id}`);
  },
  
  // Resend email
  resendEmail: async (id: string) => {
    return api.post(`/email/resend/${id}`);
  }
};
