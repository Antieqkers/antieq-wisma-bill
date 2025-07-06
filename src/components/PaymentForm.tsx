import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, User, CreditCard, Receipt, Calculator } from "lucide-react";
import { calculatePayment, PaymentData, PaymentResult } from "@/lib/paymentCalculator";

interface PaymentFormProps {
  onPaymentSubmit: (paymentData: PaymentData, result: PaymentResult) => void;
}

export default function PaymentForm({ onPaymentSubmit }: PaymentFormProps) {
  const [formData, setFormData] = useState<PaymentData>({
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
    const result = calculatePayment(formData);
    setCalculationResult(result);
  }, [formData]);

  const handleInputChange = (field: keyof PaymentData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (calculationResult) {
      onPaymentSubmit(formData, calculationResult);
    }
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
          {/* Tenant Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tenantName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nama Penyewa
              </Label>
              <Input
                id="tenantName"
                value={formData.tenantName}
                onChange={(e) => handleInputChange("tenantName", e.target.value)}
                placeholder="Masukkan nama penyewa"
                required
                className="border-primary/20 focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roomNumber">Nomor Kamar</Label>
              <Input
                id="roomNumber"
                value={formData.roomNumber}
                onChange={(e) => handleInputChange("roomNumber", e.target.value)}
                placeholder="Contoh: A101"
                required
                className="border-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {/* Period Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month" className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Bulan
              </Label>
              <Select onValueChange={(value) => handleInputChange("month", value)} required>
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
              <Label htmlFor="rentAmount">Tarif Sewa (Rp)</Label>
              <Input
                id="rentAmount"
                type="number"
                value={formData.rentAmount}
                onChange={(e) => handleInputChange("rentAmount", parseInt(e.target.value))}
                className="border-primary/20 focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="previousBalance">Tunggakan Sebelumnya (Rp)</Label>
              <Input
                id="previousBalance"
                type="number"
                value={formData.previousBalance}
                onChange={(e) => handleInputChange("previousBalance", parseInt(e.target.value))}
                className="border-primary/20 focus:border-primary"
              />
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
            <Select onValueChange={(value) => handleInputChange("paymentMethod", value)} defaultValue="cash">
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
                    Perhitungan Otomatis
                  </h3>
                  <Badge variant={paymentStatus.color as any}>
                    {paymentStatus.status}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Tagihan:</span>
                    <span className="font-medium">Rp {calculationResult.totalDue.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Setelah Diskon:</span>
                    <span className="font-medium">Rp {calculationResult.totalAfterDiscount.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sisa/Kelebihan:</span>
                    <span className={`font-medium ${calculationResult.remainingBalance > 0 ? 'text-warning' : calculationResult.remainingBalance < 0 ? 'text-success' : 'text-foreground'}`}>
                      Rp {Math.abs(calculationResult.remainingBalance).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Button type="submit" className="w-full" size="lg">
            <Receipt className="h-4 w-4 mr-2" />
            Buat Kwitansi
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}