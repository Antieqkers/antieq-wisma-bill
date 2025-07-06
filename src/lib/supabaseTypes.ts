
export interface Tenant {
  id: string;
  name: string;
  room_number: string;
  phone?: string;
  email?: string;
  checkin_date: string;
  monthly_rent: number;
  created_at?: string;
  updated_at?: string;
}

export interface Payment {
  id: string;
  tenant_id: string;
  receipt_number: string;
  payment_date: string;
  period_month: number;
  period_year: number;
  rent_amount: number;
  previous_balance: number;
  payment_amount: number;
  discount_amount: number;
  remaining_balance: number;
  payment_status: 'lunas' | 'kurang_bayar' | 'lebih_bayar';
  payment_method: 'cash' | 'transfer' | 'ewallet';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TenantBalance {
  id: string;
  tenant_id: string;
  current_balance: number;
  last_payment_date?: string;
  next_due_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentFormData {
  tenant_id: string;
  tenantName: string;
  roomNumber: string;
  month: string;
  year: number;
  rentAmount: number;
  previousBalance: number;
  paymentAmount: number;
  discountAmount: number;
  paymentMethod: 'cash' | 'transfer' | 'ewallet';
}
