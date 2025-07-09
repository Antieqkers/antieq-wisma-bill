
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { PaymentResult, formatCurrency } from "@/lib/paymentCalculator";
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

  const getStatusIcon = () => {
    switch (calculationResult.paymentStatus) {
      case "lunas":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "kurang_bayar":
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case "lebih_bayar":
        return <Info className="h-4 w-4 text-info" />;
      default:
        return <Calculator className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    switch (calculationResult.paymentStatus) {
      case "lunas":
        return "text-success";
      case "kurang_bayar":
        return "text-warning";
      case "lebih_bayar":
        return "text-info";
      default:
        return "text-primary";
    }
  };

  // Generate outstanding balance description
  const getOutstandingDescription = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    let description = '';
    
    // Calculate how many months of rent are included
    const monthsCount = Math.ceil(previousBalance / rentAmount);
    
    if (monthsCount > 1) {
      // Show breakdown of months
      const startMonth = currentMonth - monthsCount + 1;
      const months = [];
      
      for (let i = 0; i < monthsCount; i++) {
        let monthIndex = startMonth + i - 1;
        let year = currentYear;
        
        if (monthIndex < 0) {
          monthIndex += 12;
          year -= 1;
        } else if (monthIndex >= 12) {
          monthIndex -= 12;
          year += 1;
        }
        
        months.push(monthNames[monthIndex]);
      }
      
      if (months.length > 1) {
        const lastMonth = months.pop();
        description = `Akumulasi sewa ${months.join(' + ')} + ${lastMonth}`;
      } else {
        description = `Sewa ${months[0]}`;
      }
    } else {
      description = `Sewa ${monthNames[currentMonth - 1]} ${currentYear}`;
    }
    
    return description;
  };

  return (
    <Card className="bg-muted/50 border-primary/20">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Perhitungan Pembayaran
          </h3>
          <Badge variant={paymentStatus.color as any} className="flex items-center gap-1">
            {getStatusIcon()}
            {paymentStatus.status}
          </Badge>
        </div>
        
        <div className="space-y-4">
          {/* Rincian Tagihan - Only show Tunggakan Sebelumnya */}
          <div className="bg-white/50 p-4 rounded-lg border">
            <h4 className="font-medium text-sm text-muted-foreground mb-3">RINCIAN TAGIHAN</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <span className="font-medium text-stone-800">Tunggakan Sebelumnya:</span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getOutstandingDescription()}
                  </p>
                </div>
                <span className={`font-medium ${previousBalance > 0 ? 'text-warning' : 'text-muted-foreground'}`}>
                  {formatCurrency(previousBalance)}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-semibold">Total Tagihan:</span>
                <span className="font-semibold">{formatCurrency(calculationResult.totalDue)}</span>
              </div>
              {discountAmount > 0 && (
                <>
                  <div className="flex justify-between">
                    <span>Diskon:</span>
                    <span className="font-medium text-success">-{formatCurrency(discountAmount)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-semibold">Setelah Diskon:</span>
                    <span className="font-semibold">{formatCurrency(calculationResult.totalAfterDiscount)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Pembayaran */}
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
            <h4 className="font-medium text-sm text-muted-foreground mb-3">PEMBAYARAN</h4>
            <div className="flex justify-between items-center">
              <span className="font-semibold">Jumlah Dibayar:</span>
              <span className="font-bold text-lg text-primary">{formatCurrency(paymentAmount)}</span>
            </div>
          </div>

          {/* Status Pembayaran */}
          <div className={`p-4 rounded-lg border ${
            calculationResult.remainingBalance > 0 ? 'bg-warning/10 border-warning/20' : 
            calculationResult.remainingBalance < 0 ? 'bg-info/10 border-info/20' : 
            'bg-success/10 border-success/20'
          }`}>
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold flex items-center gap-2">
                {getStatusIcon()}
                {calculationResult.remainingBalance > 0 ? 'Sisa Tagihan:' : 
                 calculationResult.remainingBalance < 0 ? 'Kelebihan Bayar:' : 'Status Pembayaran:'}
              </span>
              <span className={`font-bold text-lg ${getStatusColor()}`}>
                {calculationResult.remainingBalance === 0 ? 'LUNAS' : 
                 formatCurrency(Math.abs(calculationResult.remainingBalance))}
              </span>
            </div>
            
            {calculationResult.remainingBalance > 0 && (
              <p className="text-xs text-warning mt-2 flex items-start gap-2">
                <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                Sisa tagihan akan otomatis terakumulasi ke bulan berikutnya dan dihitung dalam total tunggakan keseluruhan
              </p>
            )}
            
            {calculationResult.remainingBalance < 0 && (
              <p className="text-xs text-info mt-2 flex items-start gap-2">
                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                Kelebihan pembayaran akan dipotong dari tagihan bulan depan
              </p>
            )}
            
            {calculationResult.remainingBalance === 0 && (
              <p className="text-xs text-success mt-2 flex items-start gap-2">
                <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                Pembayaran lunas untuk periode ini
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
