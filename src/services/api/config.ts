import axios from 'axios';
import type { ApiResponse } from './types';

// Allow switching between localhost and public IP
export const API_URL = process.env.NODE_ENV === 'production' 
  ? 'http://5.34.204.56:5001/api'
  : 'http://localhost:5001/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for consistent error handling
api.interceptors.response.use(
  (response) => {
    const data = response.data as ApiResponse;
    if (!data.success) {
      throw new Error(data.message || 'عملیات با خطا مواجه شد');
    }
    return data;
  },
  (error) => {
    const message = error.response?.data?.message || 'خطا در ارتباط با سرور';
    throw new Error(message);
  }
);