```typescript
import { api } from './config';
import type { ApiResponse } from './types';

export const uploadApi = {
  uploadFile: async (file: File): Promise<ApiResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await api.post<ApiResponse>('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message || 'خطا در آپلود فایل');
      }
      throw new Error('خطا در آپلود فایل');
    }
  },
};
```