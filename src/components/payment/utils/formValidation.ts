
import { PaymentFormData } from "@/lib/supabaseTypes";
import { PaymentResult } from "@/lib/paymentCalculator";

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export const validatePaymentForm = (
  formData: PaymentFormData,
  calculationResult: PaymentResult | null,
  selectedTenant: any
): ValidationResult => {
  if (!calculationResult || !selectedTenant) {
    return {
      isValid: false,
      errorMessage: "Pilih penghuni terlebih dahulu"
    };
  }

  if (!formData.paymentAmount || formData.paymentAmount <= 0) {
    return {
      isValid: false,
      errorMessage: "Masukkan jumlah pembayaran yang valid"
    };
  }

  if (!formData.paymentMethod) {
    return {
      isValid: false,
      errorMessage: "Pilih metode pembayaran"
    };
  }

  return { isValid: true };
};

export const getErrorMessage = (error: any): string => {
  let errorMessage = "Gagal menyimpan pembayaran";
  
  if (error?.message?.includes('duplicate key')) {
    errorMessage = "Nomor kwitansi sudah ada, silakan coba lagi";
  } else if (error?.message?.includes('foreign key')) {
    errorMessage = "Data penghuni tidak valid";
  } else if (error?.message?.includes('check constraint')) {
    errorMessage = "Data pembayaran tidak valid";
  } else if (error?.message?.includes('violates row-level security')) {
    errorMessage = "Tidak memiliki akses untuk menyimpan data";
  } else if (error?.message) {
    errorMessage = `Gagal menyimpan pembayaran: ${error.message}`;
  }
  
  return errorMessage;
};
