import { useState } from "react";
import { Building2 } from "lucide-react";
import PaymentForm from "@/components/PaymentForm";
import Receipt from "@/components/Receipt";
import { PaymentData, PaymentResult } from "@/lib/paymentCalculator";

const Index = () => {
  const [currentView, setCurrentView] = useState<"form" | "receipt">("form");
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);

  const handlePaymentSubmit = (data: PaymentData, result: PaymentResult) => {
    setPaymentData(data);
    setPaymentResult(result);
    setCurrentView("receipt");
  };

  const handleBackToForm = () => {
    setCurrentView("form");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-primary-light text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-3">
            <Building2 className="h-8 w-8" />
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-bold">ANTIEQ WISMA KOST</h1>
              <p className="text-sm opacity-90">Sistem Pembayaran Sewa Kamar</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {currentView === "form" ? (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                Input Pembayaran Sewa Kamar
              </h2>
              <p className="text-muted-foreground">
                Lengkapi form di bawah untuk membuat kwitansi pembayaran
              </p>
            </div>
            <PaymentForm onPaymentSubmit={handlePaymentSubmit} />
          </div>
        ) : (
          paymentData && paymentResult && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-foreground">
                  Kwitansi Pembayaran
                </h2>
                <p className="text-muted-foreground">
                  Kwitansi resmi pembayaran sewa kamar ANTIEQ WISMA KOST
                </p>
              </div>
              <Receipt 
                paymentData={paymentData} 
                paymentResult={paymentResult} 
                onBack={handleBackToForm}
              />
            </div>
          )
        )}
      </main>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Building2 className="h-6 w-6" />
              <span className="text-xl font-bold">ANTIEQ WISMA KOST</span>
            </div>
            <div className="text-sm opacity-90 space-y-1">
              <p>Jl. Contoh Alamat No. 123, Jakarta Selatan</p>
              <p>Telp: (021) 1234-5678 | WhatsApp: 0812-3456-7890</p>
              <p>Email: info@antieqwisma.com</p>
            </div>
            <div className="text-xs opacity-75 pt-4 border-t border-primary-light">
              <p>&copy; 2024 ANTIEQ WISMA KOST. Sistem Pembayaran Sewa Kamar.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;