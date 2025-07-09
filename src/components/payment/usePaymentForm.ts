
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Tenant, PaymentFormData } from "@/lib/supabaseTypes";
import { calculatePayment, PaymentResult } from "@/lib/paymentCalculator";
import { createInitialFormData } from "./PaymentFormData";
import { fetchTenants } from "./utils/tenantOperations";
import { calculateOutstandingBalance, calculateManualBalance } from "./utils/balanceCalculations";
import { submitPayment, updateTenantBalance } from "./utils/paymentSubmission";
import { validatePaymentForm, getErrorMessage } from "./utils/formValidation";

export function usePaymentForm(onPaymentSubmit: (paymentData: PaymentFormData, result: PaymentResult) => void) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [previousBalance, setPreviousBalance] = useState(0);
  const [formData, setFormData] = useState<PaymentFormData>(createInitialFormData());
  const [description, setDescription] = useState("");
  const [calculationResult, setCalculationResult] = useState<PaymentResult | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadTenants();
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

  const loadTenants = async () => {
    try {
      const tenantsData = await fetchTenants();
      setTenants(tenantsData);
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
      const outstandingBalance = await calculateOutstandingBalance(selectedTenant);
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
      try {
        const manualBalance = await calculateManualBalance(selectedTenant);
        setPreviousBalance(manualBalance);
        setFormData(prev => ({
          ...prev,
          previousBalance: manualBalance
        }));
      } catch (fallbackError) {
        console.error('Error in manual balance calculation:', fallbackError);
        setPreviousBalance(0);
        setFormData(prev => ({ ...prev, previousBalance: 0 }));
      }
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
    
    const validation = validatePaymentForm(formData, calculationResult, selectedTenant);
    if (!validation.isValid) {
      toast({
        title: "Error",
        description: validation.errorMessage,
        variant: "destructive"
      });
      return;
    }

    try {
      const insertedData = await submitPayment(formData, calculationResult!, selectedTenant!, description);

      // Update tenant balance
      try {
        await updateTenantBalance(selectedTenant!.id);
      } catch (balanceError) {
        console.error('Balance update error:', balanceError);
        toast({
          title: "Warning",
          description: "Pembayaran tersimpan tapi gagal update saldo. Silakan refresh halaman.",
          variant: "default"
        });
      }

      toast({
        title: "Berhasil",
        description: "Pembayaran berhasil disimpan dan kwitansi telah dibuat",
        variant: "default"
      });

      // Callback to create receipt
      onPaymentSubmit(formData, calculationResult!);
      resetForm();

    } catch (error: any) {
      console.error('Error saving payment:', error);
      
      const errorMessage = getErrorMessage(error);
      
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
