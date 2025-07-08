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
      setPreviousBalance(0);
      setFormData(prev => ({
        ...prev,
        previousBalance: 0
      }));
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

      const paymentData = {
        tenant_id: selectedTenant.id,
        receipt_number: calculationResult.receiptNumber,
        payment_date: new Date().toISOString().split('T')[0],
        period_month: getMonthNumber(formData.month),
        period_year: formData.year,
        rent_amount: formData.rentAmount,
        previous_balance: formData.previousBalance,
        payment_amount: formData.paymentAmount,
        discount_amount: formData.discountAmount,
        remaining_balance: calculationResult.remainingBalance,
        payment_status: calculationResult.paymentStatus,
        payment_method: formData.paymentMethod,
        notes: description && description.trim() ? description.trim() : `Pembayaran sewa bulan ${formData.month} ${formData.year}`
      };

      console.log('Inserting payment data:', paymentData);

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

      if (calculationResult.remainingBalance !== 0) {
        try {
          const { error: updateError } = await supabase
            .rpc('update_tenant_balance', {
              tenant_id: selectedTenant.id
            });

          if (updateError) {
            console.error('Error updating tenant balance:', updateError);
          }
        } catch (balanceError) {
          console.error('Balance update error:', balanceError);
        }
      }

      toast({
        title: "Berhasil",
        description: "Pembayaran berhasil disimpan",
        variant: "default"
      });

      onPaymentSubmit(formData, calculationResult);
      resetForm();

    } catch (error: any) {
      console.error('Error saving payment:', error);
      toast({
        title: "Error",
        description: `Gagal menyimpan pembayaran: ${error.message || 'Unknown error'}`,
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
