
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
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794, // A4 width in pixels at 96 DPI
        height: 1123 // A4 height in pixels at 96 DPI
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate scaling to fit A4 properly
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / (imgWidth * 0.264583), pdfHeight / (imgHeight * 0.264583));
      
      const scaledWidth = imgWidth * 0.264583 * ratio;
      const scaledHeight = imgHeight * 0.264583 * ratio;
      
      const x = (pdfWidth - scaledWidth) / 2;
      const y = 5;
      
      pdf.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight);
      pdf.save(`kwitansi-${paymentResult.receiptNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Gagal mengunduh PDF. Silakan coba lagi.');
    }
  };

  const getPaymentStatusBadge = () => {
    switch (paymentResult.paymentStatus) {
      case "lunas":
        return <Badge className="bg-green-600 text-white hover:bg-green-700">LUNAS</Badge>;
      case "kurang_bayar":
        return <Badge className="bg-amber-600 text-white hover:bg-amber-700">KURANG BAYAR</Badge>;
      case "lebih_bayar":
        return <Badge className="bg-blue-600 text-white hover:bg-blue-700">LEBIH BAYAR</Badge>;
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

      {/* Receipt - Optimized for A4 */}
      <Card id="receipt-content" className="bg-white border-2 border-stone-200 shadow-lg print:shadow-none print:border-2 max-w-[210mm] mx-auto">
        <CardContent className="p-8 print:p-6 relative">
          {/* Header with Logo */}
          <div className="text-center space-y-4 mb-6">
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <img 
                src="/lovable-uploads/3da050e2-be00-4460-9d02-c768ffe65c14.png" 
                alt="ANTIEQ WISMA KOST Logo" 
                className="h-20 w-auto object-contain"
              />
            </div>
            
            <h1 className="text-3xl font-bold text-stone-800">ANTIEQ WISMA KOST</h1>
            <div className="text-stone-700 space-y-2">
              <p className="text-lg font-medium">JL. Drs HASAN KADIR desa BUTU kec TILONGKABILA</p>
              <p className="text-lg font-medium">BONEBOLANGO GORONTALO</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mt-3">
                <div className="space-y-1">
                  <p><strong>Telp:</strong> 0821 8753 5727</p>
                  <p><strong>WhatsApp:</strong> 0821 8753 5727</p>
                  <p><strong>Email:</strong> info@antieqwisma.com</p>
                </div>
                <div className="space-y-1">
                  <p><strong>Instagram:</strong> @antieqwisma_kost</p>
                  <p><strong>TikTok:</strong> @antieqmediatv</p>
                  <p><strong>Facebook:</strong> @Antieq Wisma Kost</p>
                </div>
              </div>
            </div>
            <Separator className="my-4 bg-stone-300" />
            <h2 className="text-2xl font-bold text-stone-800">KWITANSI PEMBAYARAN</h2>
          </div>

          {/* Receipt Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <p className="text-sm text-stone-600">No. Kwitansi</p>
                <p className="text-lg font-bold text-stone-800">{paymentResult.receiptNumber}</p>
              </div>
              <div>
                <p className="text-sm text-stone-600">Tanggal</p>
                <p className="font-semibold text-stone-800">{formatDate(paymentResult.paymentDate)}</p>
              </div>
              <div>
                <p className="text-sm text-stone-600">Nama Penyewa</p>
                <p className="font-semibold text-lg text-stone-800">{paymentData.tenantName}</p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <p className="text-sm text-stone-600">Nomor Kamar</p>
                <p className="font-semibold text-lg text-stone-800">{paymentData.roomNumber}</p>
              </div>
              <div>
                <p className="text-sm text-stone-600">Periode Pembayaran</p>
                <p className="font-semibold text-lg text-stone-800">{paymentData.month} {paymentData.year}</p>
              </div>
              <div>
                <p className="text-sm text-stone-600">Metode Pembayaran</p>
                <p className="font-semibold text-stone-800 capitalize">{paymentData.paymentMethod === 'cash' ? 'Tunai' : paymentData.paymentMethod === 'transfer' ? 'Transfer Bank' : 'E-Wallet'}</p>
              </div>
            </div>
          </div>

          {/* Watermark - Positioned between Nama Penyewa and Status */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="text-4xl font-bold text-stone-200 transform rotate-12 tracking-wider text-center opacity-30">
                ANTIEQ WISMA<br />
                <span className="text-2xl">MANAJEMEN</span>
              </div>
            </div>
            
            {/* Status Pembayaran */}
            <div className="relative z-20 text-center py-8">
              <div className="space-y-2">
                <p className="text-sm text-stone-600">Status Pembayaran</p>
                <div className="flex justify-center">
                  {getPaymentStatusBadge()}
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6 bg-stone-300" />

          {/* Detailed Payment Breakdown */}
          <div className="space-y-6 mb-6">
            <h3 className="text-xl font-bold text-stone-800">RINCIAN PEMBAYARAN LENGKAP</h3>
            
            {/* Main Calculation Table */}
            <div className="bg-stone-50 p-6 rounded-lg border border-stone-200">
              <div className="space-y-4">
                {/* Current Month Rent */}
                <div className="flex justify-between items-center py-2 border-b border-stone-200">
                  <div>
                    <span className="font-medium text-stone-800">Tarif Sewa Bulan {paymentData.month} {paymentData.year}</span>
                    <p className="text-sm text-stone-600">Sewa bulanan standar</p>
                  </div>
                  <span className="font-semibold text-lg text-stone-800">{formatCurrency(paymentData.rentAmount)}</span>
                </div>
                
                {/* Outstanding Balance */}
                {paymentData.previousBalance > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-stone-200">
                    <div>
                      <span className="font-medium text-amber-700">Tunggakan Bulan Sebelumnya</span>
                      <p className="text-sm text-stone-600">Akumulasi dari tanggal masuk penghuni</p>
                    </div>
                    <span className="font-semibold text-lg text-amber-700">{formatCurrency(paymentData.previousBalance)}</span>
                  </div>
                )}
                
                {/* Subtotal */}
                <div className="flex justify-between items-center py-2 bg-stone-100 px-4 rounded">
                  <span className="font-bold text-lg text-stone-800">TOTAL TAGIHAN</span>
                  <span className="font-bold text-xl text-stone-800">{formatCurrency(paymentResult.totalDue)}</span>
                </div>
                
                {/* Discount */}
                {paymentData.discountAmount > 0 && (
                  <>
                    <div className="flex justify-between items-center py-2">
                      <div>
                        <span className="font-medium text-green-700">Diskon Pembayaran</span>
                        <p className="text-sm text-stone-600">Potongan harga khusus</p>
                      </div>
                      <span className="font-semibold text-lg text-green-700">-{formatCurrency(paymentData.discountAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 bg-stone-100 px-4 rounded">
                      <span className="font-bold text-stone-800">TOTAL SETELAH DISKON</span>
                      <span className="font-bold text-lg text-stone-800">{formatCurrency(paymentResult.totalAfterDiscount)}</span>
                    </div>
                  </>
                )}
                
                <Separator className="bg-stone-300 my-4" />
                
                {/* Payment Amount */}
                <div className="flex justify-between items-center py-3 bg-blue-50 px-4 rounded-lg border border-blue-200">
                  <div>
                    <span className="font-bold text-lg text-blue-800">Jumlah Yang Dibayar</span>
                    <p className="text-sm text-stone-600">Pembayaran hari ini</p>
                  </div>
                  <span className="font-bold text-2xl text-blue-800">{formatCurrency(paymentData.paymentAmount)}</span>
                </div>
                
                {/* Remaining Balance or Overpayment */}
                {paymentResult.remainingBalance !== 0 && (
                  <div className={`flex justify-between items-center py-3 px-4 rounded-lg border ${
                    paymentResult.remainingBalance > 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'
                  }`}>
                    <div>
                      <span className={`font-bold text-lg ${
                        paymentResult.remainingBalance > 0 ? 'text-amber-700' : 'text-green-700'
                      }`}>
                        {paymentResult.remainingBalance > 0 ? 'SISA TAGIHAN' : 'KELEBIHAN PEMBAYARAN'}
                      </span>
                      <p className="text-sm text-stone-600">
                        {paymentResult.remainingBalance > 0 
                          ? 'Akan terakumulasi ke bulan berikutnya' 
                          : 'Akan dipotong dari tagihan bulan depan'}
                      </p>
                    </div>
                    <span className={`font-bold text-2xl ${
                      paymentResult.remainingBalance > 0 ? 'text-amber-700' : 'text-green-700'
                    }`}>
                      {formatCurrency(Math.abs(paymentResult.remainingBalance))}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Amount in Words */}
          <div className="mb-6">
            <p className="text-sm text-stone-600 mb-2">Terbilang (Jumlah Dibayar):</p>
            <div className="border border-stone-300 rounded-lg p-4 bg-stone-50">
              <p className="text-lg font-semibold italic capitalize text-stone-800">
                {numberToWords(paymentData.paymentAmount)}
              </p>
            </div>
          </div>

          <Separator className="my-6 bg-stone-300" />

          {/* Summary Box */}
          {paymentResult.remainingBalance !== 0 && (
            <div className={`mb-6 p-4 rounded-lg border-2 ${
              paymentResult.remainingBalance > 0 ? 'border-amber-400 bg-amber-50' : 'border-green-400 bg-green-50'
            }`}>
              <h4 className="font-bold mb-2 text-stone-800">PENTING - INFORMASI PEMBAYARAN:</h4>
              {paymentResult.remainingBalance > 0 ? (
                <div className="space-y-1 text-sm text-stone-700">
                  <p>• Status: <strong className="text-amber-700">KURANG BAYAR</strong></p>
                  <p>• Sisa tagihan sebesar <strong>{formatCurrency(paymentResult.remainingBalance)}</strong></p>
                  <p>• Sisa ini akan <strong>otomatis terakumulasi</strong> ke tagihan bulan berikutnya</p>
                  <p>• Harap dilunasi pada pembayaran periode selanjutnya</p>
                </div>
              ) : (
                <div className="space-y-1 text-sm text-stone-700">
                  <p>• Status: <strong className="text-green-700">LEBIH BAYAR</strong></p>
                  <p>• Kelebihan sebesar <strong>{formatCurrency(Math.abs(paymentResult.remainingBalance))}</strong></p>
                  <p>• Kelebihan akan <strong>otomatis dipotong</strong> dari tagihan bulan depan</p>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-sm text-stone-600 font-semibold">Catatan Penting:</p>
              <ul className="text-sm space-y-1 text-stone-600">
                <li>• Kwitansi ini sah dan resmi sebagai bukti pembayaran</li>
                <li>• Simpan kwitansi dengan baik untuk referensi</li>
                <li>• Pembayaran bulan berikutnya: tanggal 1-5 setiap bulan</li>
                <li>• Tunggakan dihitung otomatis dari tanggal masuk penghuni</li>
                {paymentResult.remainingBalance > 0 && (
                  <li className="text-amber-700 font-medium">
                    • <strong>Wajib lunasi sisa tagihan: {formatCurrency(paymentResult.remainingBalance)}</strong>
                  </li>
                )}
              </ul>
            </div>
            
            <div className="text-center space-y-16">
              <div>
                <p className="text-sm text-stone-600 mb-2">Gorontalo, {formatDate(paymentResult.paymentDate)}</p>
                <p className="text-sm text-stone-600">Pengelola Kost</p>
              </div>
              <div>
                <p className="font-bold text-stone-800 border-t border-stone-400 pt-1 inline-block min-w-32">
                  ANTIEQ WISMA
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Footer - Enhanced with Bold Text */}
          <div className="mt-8 pt-4 border-t border-stone-300 text-center">
            <p className="text-sm font-bold text-stone-800">
              ANTIEQ WISMA KOST - Sistem Pembayaran Terintegrasi dengan Perhitungan Tunggakan Otomatis
            </p>
            <p className="text-sm font-bold text-stone-700 mt-1">
              Terima kasih atas kepercayaan dan kerjasama Anda
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
