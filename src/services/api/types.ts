export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
  timestamp?: string;
}

export interface SystemStatus {
  status: 'operational' | 'maintenance' | 'error';
  message: string;
  timestamp: string;
  stats: {
    total_orders: number;
    total_logs: number;
  };
}

export interface Order {
  id: string;
  sku: string;
  title: string;
  color: string;
  quantity: number;
  scanned: number;
  status: OrderStatus;
  price: string;
  scanTimestamp?: string;
  state?: string;
  city?: string;
  payment?: string;
}

export type OrderStatus = 'Fulfilled' | 'Pending' | 'Error';

export type TransferType = 'پست' | 'اسنپ باکس' | 'ماهکس';

export interface Log {
  id: string;
  timestamp: string;
  message: string;
  status: 'success' | 'error' | 'warning';
  details?: string;
}