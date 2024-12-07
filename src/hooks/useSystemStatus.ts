import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fulfillmentApi } from '../services/api';

export function useSystemStatus() {
  const [latency, setLatency] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);

  const { data: status, isError } = useQuery({
    queryKey: ['system-status'],
    queryFn: () => fulfillmentApi.system.checkStatus(),
    refetchInterval: 30000,
    retry: 2,
    onSuccess: () => setIsConnected(true),
    onError: () => setIsConnected(false)
  });

  useEffect(() => {
    const checkLatency = async () => {
      const start = Date.now();
      try {
        await fulfillmentApi.system.ping();
        setLatency(Date.now() - start);
        setIsConnected(true);
      } catch {
        setLatency(0);
        setIsConnected(false);
      }
    };

    const interval = setInterval(checkLatency, 10000);
    checkLatency();
    return () => clearInterval(interval);
  }, []);

  return {
    isConnected,
    latency,
    status: status?.data || {
      status: 'error',
      stats: {
        total_orders: 0,
        total_logs: 0
      }
    }
  };
}