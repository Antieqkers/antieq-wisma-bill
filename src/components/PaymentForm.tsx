
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, User, CreditCard, Receipt, Calculator } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tenant, PaymentFormData } from "@/lib/supabaseTypes";
import { calculatePayment, PaymentResult } from "@/lib/paymentCalculator";

interface PaymentFormProps {
  onPaymentSubmit: (paymentData: PaymentFormData, result: PaymentResult) => void;
}

export default function PaymentForm({ onPaymentSubmit }: PaymentFormProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [previousBalance, setPreviousBalance] = useState(0);
  const { toast } = useToast();

  const [formData, setFormData] = useState<PaymentFormData>({
    tenant_id: "",
    tenantName: "",
    roomNumber: "",
    month: "",
    year: new Date().getFullYear(),
    rentAmount: 500000,
    previousBalance: 0,
    paymentAmount: 0,
    discountAmount: 0,
    paymentMethod: "cash"
  });

  const [calculationResult, setCalculationResult] = useState<PaymentResult | null>(null);

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
      
      // Calculate outstanding balance based on checkin date
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
      // Set balance to 0 if there's an error
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

      // Prepare payment data for database
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
        notes: `Pembayaran sewa bulan ${formData.month} ${formData.year}`
      };

      console.log('Inserting payment data:', paymentData);

      // Insert payment record
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

      // Update tenant balance if needed
      if (calculationResult.remainingBalance !== 0) {
        try {
          const { error: updateError } = await supabase
            .rpc('update_tenant_balance', {
              tenant_id: selectedTenant.id
            });

          if (updateError) {
            console.error('Error updating tenant balance:', updateError);
            // Don't throw here as the payment was successful
          }
        } catch (balanceError) {
          console.error('Balance update error:', balanceError);
          // Continue as payment was successful
        }
      }

      toast({
        title: "Berhasil",
        description: "Pembayaran berhasil disimpan",
        variant: "default"
      });

      // Call the callback to show receipt
      onPaymentSubmit(formData, calculationResult);

      // Reset form
      setFormData({
        tenant_id: "",
        tenantName: "",
        roomNumber: "",
        month: "",
        year: new Date().getFullYear(),
        rentAmount: 500000,
        previousBalance: 0,
        paymentAmount: 0,
        discountAmount: 0,
        paymentMethod: "cash"
      });
      setSelectedTenant(null);
      setPreviousBalance(0);
      setCalculationResult(null);

    } catch (error) {
      console.error('Error saving payment:', error);
      toast({
        title: "Error",
        description: `Gagal menyimpan pembayaran: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  const getMonthNumber = (monthName: string): number => {
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return months.indexOf(monthName) + 1;
  };

  const getPaymentStatus = () => {
    if (!calculationResult) return { status: "calculating", color: "secondary" };
    
    if (calculationResult.remainingBalance > 0) {
      return { status: "Kurang Bayar", color: "warning" };
    } else if (calculationResult.remainingBalance < 0) {
      return { status: "Lebih Bayar", color: "success" };
    } else {
      return { status: "Lunas", color: "success" };
    }
  };

  const paymentStatus = getPaymentStatus();

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="bg-gradient-to-r from-primary to-primary-light text-primary-foreground">
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-6 w-6" />
          Input Pembayaran Sewa Kamar
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tenant Selection */}
          <div className="space-y-2">
            <Label htmlFor="tenant" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Pilih Penghuni
            </Label>
            <Select onValueChange={handleTenantChange} value={formData.tenant_id} required>
              <SelectTrigger className="border-primary/20 focus:border-primary">
                <SelectValue placeholder="Pilih penghuni" />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name} - Kamar {tenant.room_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTenant && (
            <>
              {/* Tenant Info Display */}
              <div className="bg-muted/50 p-4 rounded-lg border">
                <h3 className="font-semibold mb-2">Informasi Penghuni</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Tanggal Masuk:</span>
                    <p className="font-medium">{new Date(selectedTenant.checkin_date).toLocaleDateString('id-ID')}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Sewa Bulanan:</span>
                    <p className="font-medium">Rp {selectedTenant.monthly_rent.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              </div>

              {/* Period Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="month" className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Bulan Pembayaran
                  </Label>
                  <Select onValueChange={(value) => handleInputChange("month", value)} value={formData.month} required>
                    <SelectTrigger className="border-primary/20 focus:border-primary">
                      <SelectValue placeholder="Pilih bulan" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
                        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
                      ].map((month) => (
                        <SelectItem key={month} value={month}>{month}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Tahun</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => handleInputChange("year", parseInt(e.target.value))}
                    className="border-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rentAmount">Tarif Sewa Bulan Ini (Rp)</Label>
                  <Input
                    id="rentAmount"
                    type="number"
                    value={formData.rentAmount}
                    onChange={(e) => handleInputChange("rentAmount", parseInt(e.target.value))}
                    className="border-primary/20 focus:border-primary"
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="previousBalance">Tunggakan Otomatis (Rp)</Label>
                  <Input
                    id="previousBalance"
                    type="number"
                    value={previousBalance}
                    className="border-primary/20 focus:border-primary bg-muted"
                    readOnly
                  />
                  <p className="text-xs text-muted-foreground">
                    *Dihitung otomatis dari tanggal masuk penghuni
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentAmount">Jumlah Dibayar (Rp)</Label>
                  <Input
                    id="paymentAmount"
                    type="number"
                    value={formData.paymentAmount}
                    onChange={(e) => handleInputChange("paymentAmount", parseInt(e.target.value))}
                    className="border-primary/20 focus:border-primary"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountAmount">Diskon (Rp)</Label>
                  <Input
                    id="discountAmount"
                    type="number"
                    value={formData.discountAmount}
                    onChange={(e) => handleInputChange("discountAmount", parseInt(e.target.value))}
                    className="border-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Metode Pembayaran</Label>
                <Select onValueChange={(value) => handleInputChange("paymentMethod", value)} value={formData.paymentMethod}>
                  <SelectTrigger className="border-primary/20 focus:border-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Tunai</SelectItem>
                    <SelectItem value="transfer">Transfer Bank</SelectItem>
                    <SelectItem value="ewallet">E-Wallet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Calculation Preview */}
              {calculationResult && (
                <Card className="bg-muted/50 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Calculator className="h-5 w-5" />
                        Perhitungan Pembayaran
                      </h3>
                      <Badge variant={paymentStatus.color as any}>
                        {paymentStatus.status}
                      </Badge>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Sewa Bulan Ini:</span>
                            <span className="font-medium">Rp {formData.rentAmount.toLocaleString("id-ID")}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tunggakan:</span>
                            <span className="font-medium text-warning">Rp {formData.previousBalance.toLocaleString("id-ID")}</span>
                          </div>
                          <div className="flex justify-between border-t pt-1">
                            <span className="font-semibold">Total Tagihan:</span>
                            <span className="font-semibold">Rp {calculationResult.totalDue.toLocaleString("id-ID")}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Diskon:</span>
                            <span className="font-medium text-success">-Rp {formData.discountAmount.toLocaleString("id-ID")}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Setelah Diskon:</span>
                            <span className="font-medium">Rp {calculationResult.totalAfterDiscount.toLocaleString("id-ID")}</span>
                          </div>
                          <div className="flex justify-between border-t pt-1">
                            <span className="font-semibold">Dibayar:</span>
                            <span className="font-semibold text-primary">Rp {formData.paymentAmount.toLocaleString("id-ID")}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t pt-3">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">
                            {calculationResult.remainingBalance > 0 ? 'Sisa Tagihan:' : 
                             calculationResult.remainingBalance < 0 ? 'Kelebihan Bayar:' : 'Status:'}
                          </span>
                          <span className={`font-bold text-lg ${
                            calculationResult.remainingBalance > 0 ? 'text-warning' : 
                            calculationResult.remainingBalance < 0 ? 'text-success' : 'text-primary'
                          }`}>
                            {calculationResult.remainingBalance === 0 ? 'LUNAS' : 
                             `Rp ${Math.abs(calculationResult.remainingBalance).toLocaleString("id-ID")}`}
                          </span>
                        </div>
                        {calculationResult.remainingBalance > 0 && (
                          <p className="text-xs text-warning mt-1">
                            *Sisa tagihan akan otomatis terakumulasi ke bulan berikutnya
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button type="submit" className="w-full" size="lg">
                <Receipt className="h-4 w-4 mr-2" />
                Buat Kwitansi Pembayaran
              </Button>
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
