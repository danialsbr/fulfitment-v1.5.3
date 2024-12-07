import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns-jalali';
import { useTranslation } from '../../hooks/useTranslation';
import { fulfillmentApi } from '../../services/api';
import type { Log } from '../../services/api/types';

export function LogPage() {
  const t = useTranslation();
  const { data: logs, isLoading } = useQuery({
    queryKey: ['logs'],
    queryFn: () => fulfillmentApi.logs.getAll(),
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-blue-500" />
          <h2 className="text-lg font-semibold">{t.fulfillment.viewLogs}</h2>
        </div>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : !logs || logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            هیچ لاگی ثبت نشده است
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log: Log) => (
              <div
                key={log.id}
                className={`flex items-start gap-4 p-4 rounded-lg ${
                  log.status === 'error' ? 'bg-red-50' : 'bg-gray-50'
                }`}
              >
                {getStatusIcon(log.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium ${
                      log.status === 'error' ? 'text-red-900' : 'text-gray-900'
                    }`}>
                      {log.message}
                    </p>
                    <span className="text-xs text-gray-500">
                      {log.timestamp}
                    </span>
                  </div>
                  {log.details && (
                    <p className={`mt-1 text-sm ${
                      log.status === 'error' ? 'text-red-500' : 'text-gray-500'
                    }`}>
                      {log.details}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}