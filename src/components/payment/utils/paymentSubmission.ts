
import { supabase } from "@/integrations/supabase/client";
import { PaymentFormData, Tenant } from "@/lib/supabaseTypes";
import { PaymentResult } from "@/lib/paymentCalculator";
import { getMonthNumber } from "../PaymentFormData";

export const submitPayment = async (
  formData: PaymentFormData,
  calculationResult: PaymentResult,
  selectedTenant: Tenant,
  description: string
): Promise<any> => {
  console.log('Submitting payment data:', formData);
  console.log('Calculation result:', calculationResult);

  // Prepare payment data according to database schema
  const paymentData = {
    tenant_id: selectedTenant.id,
    receipt_number: calculationResult.receiptNumber,
    payment_date: new Date().toISOString().split('T')[0],
    period_month: getMonthNumber(formData.month),
    period_year: formData.year,
    rent_amount: formData.rentAmount,
    previous_balance: formData.previousBalance,
    payment_amount: formData.paymentAmount,
    discount_amount: formData.discountAmount || 0,
    remaining_balance: calculationResult.remainingBalance,
    payment_status: calculationResult.paymentStatus,
    payment_method: formData.paymentMethod,
    notes: description && description.trim() ? description.trim() : `Pembayaran sewa bulan ${formData.month} ${formData.year}`
  };

  console.log('Inserting payment data:', paymentData);

  // Insert payment to database
  const { data: insertedData, error: insertError } = await supabase
    .from('payments')
    .insert([paymentData])
    .select()
    .single();

  if (insertError) {
    console.error('Error inserting payment:', insertError);
    throw insertError;
  }

  console.log('Payment inserted successfully:', insertedData);
  return insertedData;
};

export const updateTenantBalance = async (tenantId: string): Promise<void> => {
  try {
    const { error: updateError } = await supabase
      .rpc('update_tenant_balance', {
        p_tenant_id: tenantId
      });

    if (updateError) {
      console.error('Error updating tenant balance:', updateError);
      throw updateError;
    } else {
      console.log('Tenant balance updated successfully');
    }
  } catch (balanceError) {
    console.error('Balance update error:', balanceError);
    throw balanceError;
  }
};
