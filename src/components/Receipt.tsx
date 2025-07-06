
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
                <p className="text-sm text-muted-foreground">Periode Pembayaran</p>
                <p className="font-semibold text-lg">{paymentData.month} {paymentData.year}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Metode Pembayaran</p>
                <p className="font-semibold capitalize">{paymentData.paymentMethod === 'cash' ? 'Tunai' : paymentData.paymentMethod === 'transfer' ? 'Transfer Bank' : 'E-Wallet'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status Pembayaran</p>
                <p className={`font-semibold ${
                  paymentResult.paymentStatus === 'lunas' ? 'text-success' :
                  paymentResult.paymentStatus === 'kurang_bayar' ? 'text-warning' : 'text-accent'
                }`}>
                  {paymentResult.paymentStatus === 'lunas' ? 'LUNAS' :
                   paymentResult.paymentStatus === 'kurang_bayar' ? 'KURANG BAYAR' : 'LEBIH BAYAR'}
                </p>
              </div>
            </div>
          </div>

          <Separator className="my-6 bg-receipt-border" />

          {/* Detailed Payment Breakdown */}
          <div className="space-y-6 mb-8">
            <h3 className="text-xl font-bold text-receipt-header">RINCIAN PEMBAYARAN LENGKAP</h3>
            
            {/* Main Calculation Table */}
            <div className="bg-muted/30 p-6 rounded-lg border border-receipt-border">
              <div className="space-y-4">
                {/* Current Month Rent */}
                <div className="flex justify-between items-center py-2 border-b border-muted">
                  <div>
                    <span className="font-medium">Tarif Sewa Bulan {paymentData.month} {paymentData.year}</span>
                    <p className="text-sm text-muted-foreground">Sewa bulanan standar</p>
                  </div>
                  <span className="font-semibold text-lg">{formatCurrency(paymentData.rentAmount)}</span>
                </div>
                
                {/* Outstanding Balance */}
                {paymentData.previousBalance > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-muted">
                    <div>
                      <span className="font-medium text-warning">Tunggakan Bulan Sebelumnya</span>
                      <p className="text-sm text-muted-foreground">Akumulasi dari tanggal masuk penghuni</p>
                    </div>
                    <span className="font-semibold text-lg text-warning">{formatCurrency(paymentData.previousBalance)}</span>
                  </div>
                )}
                
                {/* Subtotal */}
                <div className="flex justify-between items-center py-2 bg-muted/50 px-4 rounded">
                  <span className="font-bold text-lg">TOTAL TAGIHAN</span>
                  <span className="font-bold text-xl">{formatCurrency(paymentResult.totalDue)}</span>
                </div>
                
                {/* Discount */}
                {paymentData.discountAmount > 0 && (
                  <>
                    <div className="flex justify-between items-center py-2">
                      <div>
                        <span className="font-medium text-success">Diskon Pembayaran</span>
                        <p className="text-sm text-muted-foreground">Potongan harga khusus</p>
                      </div>
                      <span className="font-semibold text-lg text-success">-{formatCurrency(paymentData.discountAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 bg-muted/50 px-4 rounded">
                      <span className="font-bold">TOTAL SETELAH DISKON</span>
                      <span className="font-bold text-lg">{formatCurrency(paymentResult.totalAfterDiscount)}</span>
                    </div>
                  </>
                )}
                
                <Separator className="bg-receipt-border my-4" />
                
                {/* Payment Amount */}
                <div className="flex justify-between items-center py-3 bg-primary/10 px-4 rounded-lg">
                  <div>
                    <span className="font-bold text-lg text-primary">Jumlah Yang Dibayar</span>
                    <p className="text-sm text-muted-foreground">Pembayaran hari ini</p>
                  </div>
                  <span className="font-bold text-2xl text-primary">{formatCurrency(paymentData.paymentAmount)}</span>
                </div>
                
                {/* Remaining Balance or Overpayment */}
                {paymentResult.remainingBalance !== 0 && (
                  <div className={`flex justify-between items-center py-3 px-4 rounded-lg ${
                    paymentResult.remainingBalance > 0 ? 'bg-warning/10' : 'bg-success/10'
                  }`}>
                    <div>
                      <span className={`font-bold text-lg ${
                        paymentResult.remainingBalance > 0 ? 'text-warning' : 'text-success'
                      }`}>
                        {paymentResult.remainingBalance > 0 ? 'SISA TAGIHAN' : 'KELEBIHAN PEMBAYARAN'}
                      </span>
                      <p className="text-sm text-muted-foreground">
                        {paymentResult.remainingBalance > 0 
                          ? 'Akan terakumulasi ke bulan berikutnya' 
                          : 'Akan dipotong dari tagihan bulan depan'}
                      </p>
                    </div>
                    <span className={`font-bold text-2xl ${
                      paymentResult.remainingBalance > 0 ? 'text-warning' : 'text-success'
                    }`}>
                      {formatCurrency(Math.abs(paymentResult.remainingBalance))}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Amount in Words */}
          <div className="mb-8">
            <p className="text-sm text-muted-foreground mb-2">Terbilang (Jumlah Dibayar):</p>
            <div className="border border-receipt-border rounded-lg p-4 bg-muted/20">
              <p className="text-lg font-semibold italic capitalize">
                {numberToWords(paymentData.paymentAmount)}
              </p>
            </div>
          </div>

          <Separator className="my-6 bg-receipt-border" />

          {/* Summary Box */}
          {paymentResult.remainingBalance !== 0 && (
            <div className={`mb-6 p-4 rounded-lg border-2 ${
              paymentResult.remainingBalance > 0 ? 'border-warning bg-warning/5' : 'border-success bg-success/5'
            }`}>
              <h4 className="font-bold mb-2">PENTING - INFORMASI PEMBAYARAN:</h4>
              {paymentResult.remainingBalance > 0 ? (
                <div className="space-y-1 text-sm">
                  <p>• Status: <strong className="text-warning">KURANG BAYAR</strong></p>
                  <p>• Sisa tagihan sebesar <strong>{formatCurrency(paymentResult.remainingBalance)}</strong></p>
                  <p>• Sisa ini akan <strong>otomatis terakumulasi</strong> ke tagihan bulan berikutnya</p>
                  <p>• Harap dilunasi pada pembayaran periode selanjutnya</p>
                </div>
              ) : (
                <div className="space-y-1 text-sm">
                  <p>• Status: <strong className="text-success">LEBIH BAYAR</strong></p>
                  <p>• Kelebihan sebesar <strong>{formatCurrency(Math.abs(paymentResult.remainingBalance))}</strong></p>
                  <p>• Kelebihan akan <strong>otomatis dipotong</strong> dari tagihan bulan depan</p>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground font-semibold">Catatan Penting:</p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Kwitansi ini sah dan resmi sebagai bukti pembayaran</li>
                <li>• Simpan kwitansi dengan baik untuk referensi</li>
                <li>• Pembayaran bulan berikutnya: tanggal 1-5 setiap bulan</li>
                <li>• Tunggakan dihitung otomatis dari tanggal masuk penghuni</li>
                {paymentResult.remainingBalance > 0 && (
                  <li className="text-warning font-medium">
                    • <strong>Wajib lunasi sisa tagihan: {formatCurrency(paymentResult.remainingBalance)}</strong>
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
              ANTIEQ WISMA KOST - Sistem Pembayaran Terintegrasi dengan Perhitungan Tunggakan Otomatis
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Terima kasih atas kepercayaan dan kerjasama Anda
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
