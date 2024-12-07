import { api } from './config';
import type { ApiResponse, SystemStatus } from './types';

export const systemApi = {
  checkStatus: async () => {
    try {
      const response = await api.get<ApiResponse<SystemStatus>>('/system/status');
      return response;
    } catch (error) {
      console.error('System status check failed:', error);
      throw error;
    }
  },

  ping: async () => {
    try {
      const start = Date.now();
      await api.get('/ping');
      return Date.now() - start;
    } catch (error) {
      console.error('Ping failed:', error);
      throw error;
    }
  },
};