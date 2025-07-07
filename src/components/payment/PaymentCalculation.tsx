
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator } from "lucide-react";
import { PaymentResult } from "@/lib/paymentCalculator";
import { getPaymentStatusDisplay } from "./PaymentFormData";

interface PaymentCalculationProps {
  calculationResult: PaymentResult;
  rentAmount: number;
  previousBalance: number;
  discountAmount: number;
  paymentAmount: number;
}

export default function PaymentCalculation({
  calculationResult,
  rentAmount,
  previousBalance,
  discountAmount,
  paymentAmount
}: PaymentCalculationProps) {
  const paymentStatus = getPaymentStatusDisplay(calculationResult.remainingBalance);

  return (
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
                <span className="font-medium">Rp {rentAmount.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between">
                <span>Tunggakan:</span>
                <span className="font-medium text-warning">Rp {previousBalance.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between border-t pt-1">
                <span className="font-semibold">Total Tagihan:</span>
                <span className="font-semibold">Rp {calculationResult.totalDue.toLocaleString("id-ID")}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Diskon:</span>
                <span className="font-medium text-success">-Rp {discountAmount.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between">
                <span>Setelah Diskon:</span>
                <span className="font-medium">Rp {calculationResult.totalAfterDiscount.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between border-t pt-1">
                <span className="font-semibold">Dibayar:</span>
                <span className="font-semibold text-primary">Rp {paymentAmount.toLocaleString("id-ID")}</span>
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
  );
}
