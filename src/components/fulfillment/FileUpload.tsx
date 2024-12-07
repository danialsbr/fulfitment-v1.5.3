```typescript
import React, { useState } from 'react';
import { Upload, CheckCircle, XCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fulfillmentApi } from '../../services/api';
import { useTranslation } from '../../hooks/useTranslation';

export function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const queryClient = useQueryClient();
  const t = useTranslation();

  const uploadMutation = useMutation({
    mutationFn: (file: File) => fulfillmentApi.upload.uploadFile(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['logs'] });
      setFile(null);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith('.xlsx')) {
      setFile(selectedFile);
    } else {
      uploadMutation.error = new Error('فقط فایل‌های Excel (.xlsx) پذیرفته می‌شوند');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (file) {
      try {
        await uploadMutation.mutateAsync(file);
      } catch (error) {
        console.error('Upload error:', error);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <Upload className="h-6 w-6 text-blue-500" />
        <h2 className="text-lg font-semibold">آپلود فایل سفارشات</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <input
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center gap-2 cursor-pointer"
          >
            <Upload className="h-8 w-8 text-gray-400" />
            <span className="text-sm text-gray-600">
              فایل اکسل را انتخاب کنید یا اینجا رها کنید
            </span>
            {file && (
              <span className="text-sm text-blue-500 font-medium mt-2">
                {file.name}
              </span>
            )}
          </label>
        </div>

        <button
          type="submit"
          disabled={!file || uploadMutation.isPending}
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {uploadMutation.isPending ? 'در حال آپلود...' : 'آپلود فایل'}
        </button>

        {uploadMutation.isSuccess && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
            <CheckCircle className="h-5 w-5" />
            <span>{uploadMutation.data?.message || 'فایل با موفقیت آپلود شد'}</span>
          </div>
        )}

        {uploadMutation.isError && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
            <XCircle className="h-5 w-5" />
            <span>
              {uploadMutation.error instanceof Error 
                ? uploadMutation.error.message 
                : 'خطا در آپلود فایل'}
            </span>
          </div>
        )}
      </form>
    </div>
  );
}
```