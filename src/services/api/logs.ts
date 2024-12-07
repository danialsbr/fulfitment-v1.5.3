import { api } from './config';
import type { ApiResponse, Log } from './types';

export const logsApi = {
  getAll: async () => {
    const response = await api.get<ApiResponse<Log[]>>('/logs');
    return response.data;
  },
};