
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tenant, PaymentFormData } from "@/lib/supabaseTypes";
import { calculatePayment, PaymentResult } from "@/lib/paymentCalculator";
import { createInitialFormData, getMonthNumber } from "./PaymentFormData";

export function usePaymentForm(onPaymentSubmit: (paymentData: PaymentFormData, result: PaymentResult) => void) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [previousBalance, setPreviousBalance] = useState(0);
  const [formData, setFormData] = useState<PaymentFormData>(createInitialFormData());
  const [description, setDescription] = useState("");
  const [calculationResult, setCalculationResult] = useState<PaymentResult | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTenants();
  }, []);

  useEffect(() => {
    if (selectedTenant) {
      fetchPreviousBalance();
    }
  }, [selectedTenant, formData.month, formData.year]);

  useEffect(() => {
    const result = calculatePayment(formData);
    setCalculationResult(result);
  }, [formData]);

  const fetchTenants = async () => {
    try {
      console.log('Fetching tenants...');
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('room_number');

      if (error) {
        console.error('Error fetching tenants:', error);
        throw error;
      }
      
      console.log('Fetched tenants:', data);
      setTenants(data || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data penghuni",
        variant: "destructive"
      });
    }
  };

  const fetchPreviousBalance = async () => {
    if (!selectedTenant) return;

    try {
      console.log('Calculating previous balance for tenant:', selectedTenant.id);
      
      // Gunakan fungsi database untuk menghitung tunggakan
      const { data, error } = await supabase
        .rpc('calculate_outstanding_balance', {
          tenant_id: selectedTenant.id
        });

      if (error) {
        console.error('Error calculating balance:', error);
        throw error;
      }
      
      console.log('Calculated balance:', data);
      const balance = data || 0;
      setPreviousBalance(balance);
      setFormData(prev => ({
        ...prev,
        previousBalance: balance
      }));
    } catch (error) {
      console.error('Error fetching previous balance:', error);
      // Fallback: hitung manual jika fungsi database gagal
      await calculateManualBalance();
    }
  };

  const calculateManualBalance = async () => {
    if (!selectedTenant) return;

    try {
      console.log('Calculating manual balance for tenant:', selectedTenant.id);
      
      // Hitung bulan yang sudah berlalu sejak check-in
      const checkinDate = new Date(selectedTenant.checkin_date);
      const currentDate = new Date();
      const monthsPassed = (currentDate.getFullYear() - checkinDate.getFullYear()) * 12 + 
                          (currentDate.getMonth() - checkinDate.getMonth());
      
      console.log('Months passed since checkin:', monthsPassed);
      
      if (monthsPassed < 1) {
        setPreviousBalance(0);
        setFormData(prev => ({ ...prev, previousBalance: 0 }));
        return;
      }

      // Total yang seharusnya dibayar
      const totalShouldPay = selectedTenant.monthly_rent * monthsPassed;
      
      // Total yang sudah dibayar
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('payment_amount')
        .eq('tenant_id', selectedTenant.id);

      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError);
        throw paymentsError;
      }

      const totalPaid = payments?.reduce((sum, payment) => sum + payment.payment_amount, 0) || 0;
      const outstanding = Math.max(totalShouldPay - totalPaid, 0);
      
      console.log('Manual calculation - Should pay:', totalShouldPay, 'Paid:', totalPaid, 'Outstanding:', outstanding);
      
      setPreviousBalance(outstanding);
      setFormData(prev => ({
        ...prev,
        previousBalance: outstanding
      }));
    } catch (error) {
      console.error('Error in manual balance calculation:', error);
      setPreviousBalance(0);
      setFormData(prev => ({ ...prev, previousBalance: 0 }));
    }
  };

  const handleTenantChange = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (tenant) {
      setSelectedTenant(tenant);
      setFormData(prev => ({
        ...prev,
        tenant_id: tenantId,
        tenantName: tenant.name,
        roomNumber: tenant.room_number,
        rentAmount: tenant.monthly_rent
      }));
    }
  };

  const handleInputChange = (field: keyof PaymentFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData(createInitialFormData());
    setSelectedTenant(null);
    setPreviousBalance(0);
    setCalculationResult(null);
    setDescription("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calculationResult || !selectedTenant) {
      toast({
        title: "Error",
        description: "Pilih penghuni terlebih dahulu",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Submitting payment data:', formData);
      console.log('Calculation result:', calculationResult);

      // Siapkan data pembayaran sesuai dengan schema database
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

      // Insert pembayaran ke database
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

      // Update balance penghuni jika ada sisa tagihan
      if (calculationResult.remainingBalance !== 0) {
        try {
          const { error: updateError } = await supabase
            .rpc('update_tenant_balance', {
              tenant_id: selectedTenant.id
            });

          if (updateError) {
            console.error('Error updating tenant balance:', updateError);
          } else {
            console.log('Tenant balance updated successfully');
          }
        } catch (balanceError) {
          console.error('Balance update error:', balanceError);
        }
      }

      toast({
        title: "Berhasil",
        description: "Pembayaran berhasil disimpan dan kwitansi telah dibuat",
        variant: "default"
      });

      // Callback untuk membuat kwitansi
      onPaymentSubmit(formData, calculationResult);
      resetForm();

    } catch (error: any) {
      console.error('Error saving payment:', error);
      
      // Error handling yang lebih spesifik
      let errorMessage = "Gagal menyimpan pembayaran";
      if (error?.message?.includes('duplicate key')) {
        errorMessage = "Nomor kwitansi sudah ada, silakan coba lagi";
      } else if (error?.message?.includes('foreign key')) {
        errorMessage = "Data penghuni tidak valid";
      } else if (error?.message?.includes('check constraint')) {
        errorMessage = "Data pembayaran tidak valid";
      } else if (error?.message) {
        errorMessage = `Gagal menyimpan pembayaran: ${error.message}`;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  return {
    tenants,
    selectedTenant,
    previousBalance,
    formData,
    description,
    calculationResult,
    setDescription,
    handleTenantChange,
    handleInputChange,
    handleSubmit
  };
}
