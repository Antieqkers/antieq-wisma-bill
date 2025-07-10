
import { PaymentFormData } from "@/lib/supabaseTypes";

export const createInitialFormData = (): PaymentFormData => ({
  tenant_id: "",
  tenantName: "",
  roomNumber: "",
  month: "",
  year: new Date().getFullYear(),
  rentAmount: 500000,
  previousBalance: 0,
  paymentAmount: 0,
  discountAmount: 0,
  paymentMethod: "cash",
  transferReference: "",
  bankName: ""
});

export const getMonthNumber = (monthName: string): number => {
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  return months.indexOf(monthName) + 1;
};

export const getPaymentStatusDisplay = (remainingBalance: number) => {
  if (remainingBalance > 0) {
    return { status: "Kurang Bayar", color: "warning" };
  } else if (remainingBalance < 0) {
    return { status: "Lebih Bayar", color: "success" };
  } else {
    return { status: "Lunas", color: "success" };
  }
};
