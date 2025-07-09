
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
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 595, // A4 width in pixels at 72 DPI
        height: 842 // A4 height in pixels at 72 DPI
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Scale to fit A4 with some margin
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min((pdfWidth - 20) / (imgWidth * 0.264583), (pdfHeight - 20) / (imgHeight * 0.264583));
      
      const scaledWidth = imgWidth * 0.264583 * ratio;
      const scaledHeight = imgHeight * 0.264583 * ratio;
      
      const x = (pdfWidth - scaledWidth) / 2;
      const y = 10;
      
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

      {/* Receipt - Optimized for A4 single page */}
      <Card id="receipt-content" className="bg-white border-2 border-stone-200 shadow-lg print:shadow-none print:border-2 max-w-[190mm] mx-auto">
        <CardContent className="p-6 print:p-4 relative">
          {/* Header with Logo - Compact */}
          <div className="text-center space-y-2 mb-4">
            <div className="flex justify-center mb-2">
              <img 
                src="/lovable-uploads/3da050e2-be00-4460-9d02-c768ffe65c14.png" 
                alt="ANTIEQ WISMA KOST Logo" 
                className="h-16 w-auto object-contain"
              />
            </div>
            
            <h1 className="text-2xl font-bold text-stone-800">ANTIEQ WISMA KOST</h1>
            <div className="text-stone-700 space-y-1">
              <p className="text-sm font-medium">JL. Drs HASAN KADIR desa BUTU kec TILONGKABILA</p>
              <p className="text-sm font-medium">BONEBOLANGO GORONTALO</p>
              <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                <div className="space-y-0.5">
                  <p><strong>Telp:</strong> 0821 8753 5727</p>
                  <p><strong>Email:</strong> info@antieqwisma.com</p>
                </div>
                <div className="space-y-0.5">
                  <p><strong>Instagram:</strong> @antieqwisma_kost</p>
                  <p><strong>Facebook:</strong> @Antieq Wisma Kost</p>
                </div>
              </div>
            </div>
            <Separator className="my-2 bg-stone-300" />
            <h2 className="text-xl font-bold text-stone-800">KWITANSI PEMBAYARAN</h2>
          </div>

          {/* Receipt Details - Compact */}
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="space-y-2">
              <div>
                <p className="text-xs text-stone-600">No. Kwitansi</p>
                <p className="text-sm font-bold text-stone-800">{paymentResult.receiptNumber}</p>
              </div>
              <div>
                <p className="text-xs text-stone-600">Tanggal</p>
                <p className="text-sm font-semibold text-stone-800">{formatDate(paymentResult.paymentDate)}</p>
              </div>
              <div>
                <p className="text-xs text-stone-600">Nama Penyewa</p>
                <p className="text-sm font-semibold text-stone-800">{paymentData.tenantName}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <p className="text-xs text-stone-600">Nomor Kamar</p>
                <p className="text-sm font-semibold text-stone-800">{paymentData.roomNumber}</p>
              </div>
              <div>
                <p className="text-xs text-stone-600">Periode Pembayaran</p>
                <p className="text-sm font-semibold text-stone-800">{paymentData.month} {paymentData.year}</p>
              </div>
              <div>
                <p className="text-xs text-stone-600">Metode Pembayaran</p>
                <p className="text-sm font-semibold text-stone-800 capitalize">{paymentData.paymentMethod === 'cash' ? 'Tunai' : paymentData.paymentMethod === 'transfer' ? 'Transfer Bank' : 'E-Wallet'}</p>
              </div>
            </div>
          </div>

          {/* Watermark positioned between Nama Penyewa and Status */}
          <div className="relative mb-3">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="text-3xl font-bold text-stone-300 transform rotate-12 tracking-wider text-center opacity-40">
                ANTIEQ WISMA<br />
                <span className="text-lg">MANAJEMEN</span>
              </div>
            </div>
            
            {/* Status Pembayaran */}
            <div className="relative z-20 text-center py-4">
              <div className="space-y-1">
                <p className="text-xs text-stone-600">Status Pembayaran</p>
                <div className="flex justify-center">
                  {getPaymentStatusBadge()}
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-3 bg-stone-300" />

          {/* Detailed Payment Breakdown - Compact */}
          <div className="space-y-3 mb-3">
            <h3 className="text-lg font-bold text-stone-800">RINCIAN PEMBAYARAN</h3>
            
            <div className="bg-stone-50 p-3 rounded-lg border border-stone-200">
              <div className="space-y-2 text-sm">
                {/* Current Month Rent */}
                <div className="flex justify-between items-center py-1 border-b border-stone-200">
                  <div>
                    <span className="font-medium text-stone-800">Sewa Bulan {paymentData.month} {paymentData.year}</span>
                  </div>
                  <span className="font-semibold text-stone-800">{formatCurrency(paymentData.rentAmount)}</span>
                </div>
                
                {/* Outstanding Balance */}
                {paymentData.previousBalance > 0 && (
                  <div className="flex justify-between items-center py-1 border-b border-stone-200">
                    <div>
                      <span className="font-medium text-amber-700">Tunggakan Sebelumnya</span>
                      <p className="text-xs text-stone-600">Sisa kurang bayar bulan sebelumnya</p>
                    </div>
                    <span className="font-semibold text-amber-700">{formatCurrency(paymentData.previousBalance)}</span>
                  </div>
                )}
                
                {/* Subtotal */}
                <div className="flex justify-between items-center py-1 bg-stone-100 px-2 rounded">
                  <span className="font-bold text-stone-800">TOTAL TAGIHAN</span>
                  <span className="font-bold text-lg text-stone-800">{formatCurrency(paymentResult.totalDue)}</span>
                </div>
                
                {/* Discount */}
                {paymentData.discountAmount > 0 && (
                  <>
                    <div className="flex justify-between items-center py-1">
                      <span className="font-medium text-green-700">Diskon Pembayaran</span>
                      <span className="font-semibold text-green-700">-{formatCurrency(paymentData.discountAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 bg-stone-100 px-2 rounded">
                      <span className="font-bold text-stone-800">TOTAL SETELAH DISKON</span>
                      <span className="font-bold text-stone-800">{formatCurrency(paymentResult.totalAfterDiscount)}</span>
                    </div>
                  </>
                )}
                
                <Separator className="bg-stone-300 my-2" />
                
                {/* Payment Amount */}
                <div className="flex justify-between items-center py-2 bg-blue-50 px-2 rounded-lg border border-blue-200">
                  <span className="font-bold text-blue-800">Jumlah Yang Dibayar</span>
                  <span className="font-bold text-xl text-blue-800">{formatCurrency(paymentData.paymentAmount)}</span>
                </div>
                
                {/* Remaining Balance or Overpayment */}
                {paymentResult.remainingBalance !== 0 && (
                  <div className={`flex justify-between items-center py-2 px-2 rounded-lg border ${
                    paymentResult.remainingBalance > 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'
                  }`}>
                    <span className={`font-bold ${
                      paymentResult.remainingBalance > 0 ? 'text-amber-700' : 'text-green-700'
                    }`}>
                      {paymentResult.remainingBalance > 0 ? 'SISA TAGIHAN' : 'KELEBIHAN PEMBAYARAN'}
                    </span>
                    <span className={`font-bold text-lg ${
                      paymentResult.remainingBalance > 0 ? 'text-amber-700' : 'text-green-700'
                    }`}>
                      {formatCurrency(Math.abs(paymentResult.remainingBalance))}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Amount in Words - Compact */}
          <div className="mb-3">
            <p className="text-xs text-stone-600 mb-1">Terbilang (Jumlah Dibayar):</p>
            <div className="border border-stone-300 rounded p-2 bg-stone-50">
              <p className="text-sm font-semibold italic capitalize text-stone-800">
                {numberToWords(paymentData.paymentAmount)}
              </p>
            </div>
          </div>

          <Separator className="my-3 bg-stone-300" />

          {/* Summary Box - Compact */}
          {paymentResult.remainingBalance !== 0 && (
            <div className={`mb-3 p-3 rounded-lg border-2 ${
              paymentResult.remainingBalance > 0 ? 'border-amber-400 bg-amber-50' : 'border-green-400 bg-green-50'
            }`}>
              <h4 className="font-bold mb-1 text-sm text-stone-800">INFORMASI PEMBAYARAN:</h4>
              {paymentResult.remainingBalance > 0 ? (
                <div className="space-y-1 text-xs text-stone-700">
                  <p>• Status: <strong className="text-amber-700">KURANG BAYAR</strong></p>
                  <p>• Sisa tagihan: <strong>{formatCurrency(paymentResult.remainingBalance)}</strong></p>
                  <p>• Akan terakumulasi ke tagihan bulan berikutnya</p>
                </div>
              ) : (
                <div className="space-y-1 text-xs text-stone-700">
                  <p>• Status: <strong className="text-green-700">LEBIH BAYAR</strong></p>
                  <p>• Kelebihan: <strong>{formatCurrency(Math.abs(paymentResult.remainingBalance))}</strong></p>
                  <p>• Akan dipotong dari tagihan bulan depan</p>
                </div>
              )}
            </div>
          )}

          {/* Footer - Compact */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <p className="font-semibold text-stone-600">Catatan Penting:</p>
              <ul className="space-y-0.5 text-stone-600">
                <li>• Kwitansi resmi sebagai bukti pembayaran</li>
                <li>• Simpan dengan baik untuk referensi</li>
                <li>• Pembayaran: tanggal 1-5 setiap bulan</li>
                {paymentResult.remainingBalance > 0 && (
                  <li className="text-amber-700 font-medium">
                    • <strong>Wajib lunasi sisa: {formatCurrency(paymentResult.remainingBalance)}</strong>
                  </li>
                )}
              </ul>
            </div>
            
            <div className="text-center space-y-8">
              <div>
                <p className="text-xs text-stone-600 mb-1">Gorontalo, {formatDate(paymentResult.paymentDate)}</p>
                <p className="text-xs text-stone-600">Pengelola Kost</p>
              </div>
              <div>
                <p className="font-bold text-stone-800 border-t border-stone-400 pt-1 inline-block min-w-24 text-sm">
                  ANTIEQ WISMA
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="mt-4 pt-2 border-t border-stone-300 text-center">
            <p className="text-xs font-bold text-stone-800">
              ANTIEQ WISMA KOST - Sistem Pembayaran Terintegrasi
            </p>
            <p className="text-xs font-bold text-stone-700 mt-0.5">
              Terima kasih atas kepercayaan Anda
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
