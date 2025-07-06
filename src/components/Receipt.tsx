
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Printer, Download, ArrowLeft } from "lucide-react";
import { PaymentFormData } from "@/lib/supabaseTypes";
import { PaymentResult, formatCurrency, formatDate, numberToWords } from "@/lib/paymentCalculator";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReceiptProps {
  paymentData: PaymentFormData;
  paymentResult: PaymentResult;
  onBack: () => void;
}

export default function Receipt({ paymentData, paymentResult, onBack }: ReceiptProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('receipt-content');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;
      
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`kwitansi-${paymentResult.receiptNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Gagal mengunduh PDF. Silakan coba lagi.');
    }
  };

  const getPaymentStatusBadge = () => {
    switch (paymentResult.paymentStatus) {
      case "lunas":
        return <Badge className="bg-success text-success-foreground">LUNAS</Badge>;
      case "kurang_bayar":
        return <Badge className="bg-warning text-warning-foreground">KURANG BAYAR</Badge>;
      case "lebih_bayar":
        return <Badge className="bg-accent text-accent-foreground">LEBIH BAYAR</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Control Buttons - Hidden when printing */}
      <div className="flex justify-between print:hidden">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Cetak
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Receipt */}
      <Card id="receipt-content" className="bg-receipt-bg border-receipt-border shadow-lg print:shadow-none print:border-2">
        <CardContent className="p-8 print:p-6">
          {/* Header with Watermark */}
          <div className="relative mb-8">
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
              <div className="text-6xl font-bold text-primary transform rotate-12">
                ANTIEQ WISMA
              </div>
            </div>
            
            {/* Header Content */}
            <div className="relative text-center space-y-2">
              <h1 className="text-3xl font-bold text-receipt-header">ANTIEQ WISMA KOST</h1>
              <div className="text-receipt-text space-y-1">
                <p className="text-lg font-medium">Jl. Contoh Alamat No. 123, Jakarta Selatan</p>
                <p>Telp: (021) 1234-5678 | WhatsApp: 0812-3456-7890</p>
                <p className="text-sm">Email: info@antieqwisma.com</p>
              </div>
              <Separator className="my-4 bg-receipt-border" />
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-receipt-header">KWITANSI PEMBAYARAN</h2>
                {getPaymentStatusBadge()}
              </div>
            </div>
          </div>

          {/* Receipt Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">No. Kwitansi</p>
                <p className="text-lg font-bold text-receipt-header">{paymentResult.receiptNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tanggal</p>
                <p className="font-semibold">{formatDate(paymentResult.paymentDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nama Penyewa</p>
                <p className="font-semibold text-lg">{paymentData.tenantName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nomor Kamar</p>
                <p className="font-semibold text-lg">{paymentData.roomNumber}</p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Periode</p>
                <p className="font-semibold text-lg">{paymentData.month} {paymentData.year}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Metode Pembayaran</p>
                <p className="font-semibold capitalize">{paymentData.paymentMethod === 'cash' ? 'Tunai' : paymentData.paymentMethod === 'transfer' ? 'Transfer Bank' : 'E-Wallet'}</p>
              </div>
            </div>
          </div>

          <Separator className="my-6 bg-receipt-border" />

          {/* Payment Breakdown */}
          <div className="space-y-4 mb-8">
            <h3 className="text-xl font-bold text-receipt-header">RINCIAN PEMBAYARAN</h3>
            
            <div className="bg-muted/30 p-4 rounded-lg border border-receipt-border">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Tarif Sewa Bulan {paymentData.month} {paymentData.year}</span>
                  <span className="font-semibold">{formatCurrency(paymentData.rentAmount)}</span>
                </div>
                
                {paymentData.previousBalance > 0 && (
                  <div className="flex justify-between items-center text-warning">
                    <span>Tunggakan Bulan Sebelumnya</span>
                    <span className="font-semibold">{formatCurrency(paymentData.previousBalance)}</span>
                  </div>
                )}
                
                <Separator className="bg-receipt-border" />
                
                <div className="flex justify-between items-center font-semibold text-lg">
                  <span>Total Tagihan</span>
                  <span>{formatCurrency(paymentResult.totalDue)}</span>
                </div>
                
                {paymentData.discountAmount > 0 && (
                  <>
                    <div className="flex justify-between items-center text-success">
                      <span>Diskon</span>
                      <span className="font-semibold">-{formatCurrency(paymentData.discountAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center font-semibold">
                      <span>Total Setelah Diskon</span>
                      <span>{formatCurrency(paymentResult.totalAfterDiscount)}</span>
                    </div>
                  </>
                )}
                
                <Separator className="bg-receipt-border" />
                
                <div className="flex justify-between items-center text-lg font-bold text-primary">
                  <span>Jumlah Dibayar</span>
                  <span>{formatCurrency(paymentData.paymentAmount)}</span>
                </div>
                
                {paymentResult.remainingBalance !== 0 && (
                  <div className={`flex justify-between items-center font-semibold ${
                    paymentResult.remainingBalance > 0 ? 'text-warning' : 'text-success'
                  }`}>
                    <span>
                      {paymentResult.remainingBalance > 0 ? 'Sisa Tagihan' : 'Kelebihan Bayar'}
                    </span>
                    <span>{formatCurrency(Math.abs(paymentResult.remainingBalance))}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Amount in Words */}
          <div className="mb-8">
            <p className="text-sm text-muted-foreground mb-2">Terbilang:</p>
            <p className="text-lg font-semibold italic border border-receipt-border rounded-lg p-3 bg-muted/20 capitalize">
              {numberToWords(paymentData.paymentAmount)}
            </p>
          </div>

          <Separator className="my-6 bg-receipt-border" />

          {/* Footer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Catatan:</p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Kwitansi ini sah dan resmi</li>
                <li>• Simpan kwitansi sebagai bukti pembayaran</li>
                <li>• Pembayaran selanjutnya tanggal 1-5 setiap bulan</li>
                {paymentResult.remainingBalance > 0 && (
                  <li className="text-warning font-medium">
                    • Harap lunasi sisa tagihan: {formatCurrency(paymentResult.remainingBalance)}
                  </li>
                )}
              </ul>
            </div>
            
            <div className="text-center space-y-16">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Jakarta, {formatDate(paymentResult.paymentDate)}</p>
                <p className="text-sm text-muted-foreground">Pengelola Kost</p>
              </div>
              <div>
                <p className="font-semibold border-t border-receipt-text pt-1 inline-block min-w-32">
                  ANTIEQ WISMA
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="mt-8 pt-4 border-t border-receipt-border text-center">
            <p className="text-xs text-muted-foreground">
              ANTIEQ WISMA KOST - Kost Nyaman, Aman, dan Terpercaya
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Terima kasih atas kepercayaan Anda
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
