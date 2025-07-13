
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Receipt } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { usePaymentForm } from "@/components/payment/usePaymentForm";
import { PaymentFormData } from "@/lib/supabaseTypes";
import { PaymentResult } from "@/lib/paymentCalculator";

interface PaymentFormProps {
  onPaymentSubmit: (paymentData: PaymentFormData, result: PaymentResult) => void;
}

const PaymentForm = ({ onPaymentSubmit }: PaymentFormProps) => {
  const {
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
  } = usePaymentForm((paymentData, result) => {
    handlePaymentComplete(paymentData, result);
  });

  const [date, setDate] = useState<Date | undefined>(new Date());

  const handlePaymentComplete = (paymentData: PaymentFormData, result: PaymentResult) => {
    // Auto-send WhatsApp confirmation if enabled
    if (selectedTenant) {
      // Import and use the hook
      import('@/hooks/useWhatsAppAutomation').then(({ useWhatsAppAutomation }) => {
        const { sendAutoPaymentConfirmation } = useWhatsAppAutomation();
        sendAutoPaymentConfirmation(paymentData, result, selectedTenant);
      });
    }
    
    onPaymentSubmit(paymentData, result);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
          <Receipt className="h-6 w-6" />
          Form Pembayaran Sewa Kamar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="tenant">Pilih Penghuni</Label>
            <Select onValueChange={handleTenantChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih penghuni..." />
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="month">Bulan</Label>
              <Select onValueChange={(value) => handleInputChange('month', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih bulan..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Januari">Januari</SelectItem>
                  <SelectItem value="Februari">Februari</SelectItem>
                  <SelectItem value="Maret">Maret</SelectItem>
                  <SelectItem value="April">April</SelectItem>
                  <SelectItem value="Mei">Mei</SelectItem>
                  <SelectItem value="Juni">Juni</SelectItem>
                  <SelectItem value="Juli">Juli</SelectItem>
                  <SelectItem value="Agustus">Agustus</SelectItem>
                  <SelectItem value="September">September</SelectItem>
                  <SelectItem value="Oktober">Oktober</SelectItem>
                  <SelectItem value="November">November</SelectItem>
                  <SelectItem value="Desember">Desember</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="year">Tahun</Label>
              <Input
                type="number"
                id="year"
                value={formData.year}
                onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rentAmount">Tarif Sewa</Label>
              <Input
                type="number"
                id="rentAmount"
                value={formData.rentAmount}
                onChange={(e) => handleInputChange('rentAmount', parseFloat(e.target.value))}
                disabled={!selectedTenant}
              />
            </div>
            <div>
              <Label htmlFor="previousBalance">Tunggakan Bulan Lalu</Label>
              <Input
                type="number"
                id="previousBalance"
                value={previousBalance}
                onChange={(e) => handleInputChange('previousBalance', parseFloat(e.target.value))}
                disabled={!selectedTenant}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discountAmount">Diskon</Label>
              <Input
                type="number"
                id="discountAmount"
                value={formData.discountAmount}
                onChange={(e) => handleInputChange('discountAmount', parseFloat(e.target.value))}
                placeholder="Masukkan jumlah diskon"
              />
            </div>
            <div>
              <Label htmlFor="paymentAmount">Jumlah Pembayaran</Label>
              <Input
                type="number"
                id="paymentAmount"
                value={formData.paymentAmount}
                onChange={(e) => handleInputChange('paymentAmount', parseFloat(e.target.value))}
                placeholder="Masukkan jumlah pembayaran"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="paymentMethod">Metode Pembayaran</Label>
            <Select onValueChange={(value) => handleInputChange('paymentMethod', value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih metode pembayaran..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Tunai</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
                <SelectItem value="ewallet">E-Wallet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.paymentMethod === 'transfer' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bankName">Nama Bank</Label>
                <Input
                  type="text"
                  id="bankName"
                  value={formData.bankName}
                  onChange={(e) => handleInputChange('bankName', e.target.value)}
                  placeholder="Masukkan nama bank"
                />
              </div>
              <div>
                <Label htmlFor="transferReference">Referensi Transfer</Label>
                <Input
                  type="text"
                  id="transferReference"
                  value={formData.transferReference}
                  onChange={(e) => handleInputChange('transferReference', e.target.value)}
                  placeholder="Masukkan nomor referensi transfer"
                />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="description">Catatan</Label>
            <Textarea
              id="description"
              placeholder="Catatan pembayaran atau deskripsi tambahan..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full">
            Buat Kwitansi
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PaymentForm;
