
import { supabase } from "@/integrations/supabase/client";
import { PaymentFormData, Tenant } from "@/lib/supabaseTypes";
import { PaymentResult } from "@/lib/paymentCalculator";

export const submitPayment = async (
  formData: PaymentFormData,
  calculationResult: PaymentResult,
  selectedTenant: Tenant,
  description: string
) => {
  const paymentData = {
    tenant_id: formData.tenant_id,
    payment_date: new Date().toISOString().split('T')[0],
    period_month: new Date().getMonth() + 1,
    period_year: formData.year,
    rent_amount: formData.rentAmount,
    previous_balance: formData.previousBalance || 0,
    payment_amount: formData.paymentAmount,
    discount_amount: formData.discountAmount || 0,
    remaining_balance: calculationResult.remainingBalance,
    payment_status: calculationResult.paymentStatus as "lunas" | "kurang_bayar" | "lebih_bayar",
    payment_method: formData.paymentMethod as "cash" | "transfer" | "ewallet",
    receipt_number: calculationResult.receiptNumber,
    notes: description || null
  };

  console.log('Submitting payment data:', paymentData);

  // Insert payment to database
  const { data: insertedData, error: insertError } = await supabase
    .from('payments')
    .insert(paymentData)
    .select()
    .single();

  if (insertError) {
    console.error('Insert error:', insertError);
    throw insertError;
  }

  console.log('Payment saved successfully:', insertedData);
  return insertedData;
};

export const updateTenantBalance = async (tenantId: string) => {
  console.log('Updating tenant balance for:', tenantId);
  
  const { error } = await supabase.rpc('update_tenant_balance', {
    p_tenant_id: tenantId
  });

  if (error) {
    console.error('Error updating tenant balance:', error);
    throw error;
  }

  console.log('Tenant balance updated successfully');
};
