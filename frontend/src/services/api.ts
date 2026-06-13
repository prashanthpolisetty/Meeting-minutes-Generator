import axios from 'axios';

// Create a configured axios instance
export const api = axios.create({
  baseURL: 'http://localhost:8000/api',
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
