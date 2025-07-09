
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
    if (!selectedTenant) {
      console.log('No selected tenant, skipping balance calculation');
      return;
    }

    try {
      console.log('Calculating outstanding balance for tenant:', selectedTenant.id, selectedTenant.name);
      
      // Get current system date
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-based
      const currentYear = currentDate.getFullYear();
      
      console.log('Current system date:', currentMonth, currentYear);
      
      // Calculate total rent that should have been paid up to current month
      const checkinDate = new Date(selectedTenant.checkin_date);
      const checkinMonth = checkinDate.getMonth() + 1;
      const checkinYear = checkinDate.getFullYear();
      
      console.log('Checkin date:', checkinMonth, checkinYear);
      
      // Calculate months from checkin to current month (sistem calendar aktif)
      let monthsFromCheckinToCurrent = 0;
      if (currentYear === checkinYear) {
        monthsFromCheckinToCurrent = Math.max(currentMonth - checkinMonth + 1, 0);
      } else {
        // Months in checkin year + months in years between + months in current year
        const monthsInCheckinYear = 12 - checkinMonth + 1;
        const yearsBetween = currentYear - checkinYear - 1;
        const monthsInCurrentYear = currentMonth;
        monthsFromCheckinToCurrent = monthsInCheckinYear + (yearsBetween * 12) + monthsInCurrentYear;
      }
      
      console.log('Months from checkin to current month (sistem aktif):', monthsFromCheckinToCurrent);
      
      if (monthsFromCheckinToCurrent < 1) {
        console.log('Less than 1 month passed, no outstanding balance');
        setPreviousBalance(0);
        setFormData(prev => ({ ...prev, previousBalance: 0 }));
        return;
      }

      // Calculate total amount that should have been paid from checkin to current month
      const totalShouldPayToCurrent = selectedTenant.monthly_rent * monthsFromCheckinToCurrent;
      console.log('Total should pay from checkin to current month:', totalShouldPayToCurrent);

      // Get all payments made by this tenant
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('payment_amount, remaining_balance, payment_date, period_month, period_year')
        .eq('tenant_id', selectedTenant.id)
        .order('payment_date', { ascending: true });

      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError);
        throw paymentsError;
      }

      console.log('Payments found:', payments);

      let totalPaid = 0;
      if (payments && payments.length > 0) {
        // Sum all payments made
        totalPaid = payments.reduce((sum, payment) => {
          console.log('Payment amount:', payment.payment_amount);
          return sum + (payment.payment_amount || 0);
        }, 0);
      }

      console.log('Total paid by tenant:', totalPaid);

      // Calculate outstanding balance (tunggakan keseluruhan)
      // = Total yang harus dibayar sampai bulan aktif sistem - Total yang sudah dibayar
      const outstandingBalance = Math.max(totalShouldPayToCurrent - totalPaid, 0);
      
      console.log('Calculated outstanding balance (tunggakan keseluruhan sampai bulan aktif sistem):', outstandingBalance);
      
      setPreviousBalance(outstandingBalance);
      setFormData(prev => ({
        ...prev,
        previousBalance: outstandingBalance
      }));

    } catch (error) {
      console.error('Error calculating outstanding balance:', error);
      toast({
        title: "Warning",
        description: "Gagal menghitung tunggakan, menggunakan perhitungan manual",
        variant: "destructive"
      });
      
      // Fallback calculation
      await calculateManualBalance();
    }
  };

  const calculateManualBalance = async () => {
    if (!selectedTenant) return;

    try {
      console.log('Performing manual balance calculation for tenant:', selectedTenant.id);
      
      // Get current system date for calculation limit
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      
      // Calculate months passed from checkin to current month only
      const checkinDate = new Date(selectedTenant.checkin_date);
      const checkinMonth = checkinDate.getMonth() + 1;
      const checkinYear = checkinDate.getFullYear();
      
      let monthsPassed = 0;
      if (currentYear === checkinYear) {
        monthsPassed = Math.max(currentMonth - checkinMonth + 1, 0);
      } else {
        const monthsInCheckinYear = 12 - checkinMonth + 1;
        const yearsBetween = currentYear - checkinYear - 1;
        const monthsInCurrentYear = currentMonth;
        monthsPassed = monthsInCheckinYear + (yearsBetween * 12) + monthsInCurrentYear;
      }
      
      console.log('Manual calculation - Months passed to current month:', monthsPassed);
      
      if (monthsPassed < 1) {
        setPreviousBalance(0);
        setFormData(prev => ({ ...prev, previousBalance: 0 }));
        return;
      }

      // Total that should be paid up to current month
      const totalShouldPay = selectedTenant.monthly_rent * monthsPassed;
      console.log('Manual calculation - Total should pay up to current month:', totalShouldPay);
      
      // Total that has been paid
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('payment_amount')
        .eq('tenant_id', selectedTenant.id);

      if (paymentsError) {
        console.error('Error fetching payments for manual calculation:', paymentsError);
        throw paymentsError;
      }

      const totalPaid = payments?.reduce((sum, payment) => sum + (payment.payment_amount || 0), 0) || 0;
      const outstanding = Math.max(totalShouldPay - totalPaid, 0);
      
      console.log('Manual calculation - Total paid:', totalPaid, 'Outstanding up to current month:', outstanding);
      
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
      console.log('Selected tenant changed to:', tenant.name, 'Room:', tenant.room_number);
      setSelectedTenant(tenant);
      setFormData(prev => ({
        ...prev,
        tenant_id: tenantId,
        tenantName: tenant.name,
        roomNumber: tenant.room_number,
        rentAmount: tenant.monthly_rent,
        previousBalance: 0 // Reset previous balance, will be calculated in useEffect
      }));
    }
  };

  const handleInputChange = (field: keyof PaymentFormData, value: string | number) => {
    console.log('Input changed:', field, value);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    console.log('Resetting form');
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

    if (!formData.paymentAmount || formData.paymentAmount <= 0) {
      toast({
        title: "Error",
        description: "Masukkan jumlah pembayaran yang valid",
        variant: "destructive"
      });
      return;
    }

    if (!formData.paymentMethod) {
      toast({
        title: "Error",
        description: "Pilih metode pembayaran",
        variant: "destructive"
      });
      return;
    }

    try {
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

      // Update tenant balance using the fixed database function
      try {
        const { error: updateError } = await supabase
          .rpc('update_tenant_balance', {
            p_tenant_id: selectedTenant.id
          });

        if (updateError) {
          console.error('Error updating tenant balance:', updateError);
          // Don't throw here, as the payment was already saved
          toast({
            title: "Warning",
            description: "Pembayaran tersimpan tapi gagal update saldo. Silakan refresh halaman.",
            variant: "default"
          });
        } else {
          console.log('Tenant balance updated successfully');
        }
      } catch (balanceError) {
        console.error('Balance update error:', balanceError);
        // Don't throw here, as the payment was already saved
      }

      toast({
        title: "Berhasil",
        description: "Pembayaran berhasil disimpan dan kwitansi telah dibuat",
        variant: "default"
      });

      // Callback to create receipt
      onPaymentSubmit(formData, calculationResult);
      resetForm();

    } catch (error: any) {
      console.error('Error saving payment:', error);
      
      // More specific error handling
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
