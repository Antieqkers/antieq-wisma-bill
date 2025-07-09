
import { useState } from "react";
import { Building2, Users, CreditCard, FileText, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PaymentForm from "@/components/PaymentForm";
import ReceiptComponent from "@/components/Receipt";
import TenantManagement from "@/components/TenantManagement";
import MonthlyReport from "@/components/MonthlyReport";
import ExpenseManager from "@/components/ExpenseManager";
import FinancialReport from "@/components/FinancialReport";
import { PaymentFormData } from "@/lib/supabaseTypes";
import { PaymentResult } from "@/lib/paymentCalculator";

type ViewType = "form" | "receipt" | "tenants" | "reports" | "expenses" | "financial";

const Index = () => {
  const [currentView, setCurrentView] = useState<ViewType>("form");
  const [paymentData, setPaymentData] = useState<PaymentFormData | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);

  const handlePaymentSubmit = (data: PaymentFormData, result: PaymentResult) => {
    setPaymentData(data);
    setPaymentResult(result);
    setCurrentView("receipt");
  };

  const handleBackToForm = () => {
    setCurrentView("form");
  };

  const getPageTitle = () => {
    switch(currentView) {
      case "form": return "Input Pembayaran Sewa Kamar";
      case "receipt": return "Kwitansi Pembayaran";
      case "tenants": return "Manajemen Penghuni";
      case "reports": return "Laporan Bulanan";
      case "expenses": return "Manajemen Pengeluaran";
      case "financial": return "Laporan Keuangan";
      default: return "Input Pembayaran Sewa Kamar";
    }
  };

  const getPageDescription = () => {
    switch(currentView) {
      case "form": return "Lengkapi form di bawah untuk membuat kwitansi pembayaran";
      case "receipt": return "Kwitansi resmi pembayaran sewa kamar ANTIEQ WISMA KOST";
      case "tenants": return "Kelola data penghuni kost";
      case "reports": return "Laporan transaksi pembayaran per bulan";
      case "expenses": return "Kelola pengeluaran operasional kost";
      case "financial": return "Analisis keuangan dan laporan laba rugi";
      default: return "Lengkapi form di bawah untuk membuat kwitansi pembayaran";
    }
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
              <p className="text-sm opacity-90">Sistem Manajemen Pembayaran Sewa Kamar</p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-2 py-4">
            <Button
              variant={currentView === "form" ? "default" : "ghost"}
              onClick={() => setCurrentView("form")}
              className="flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Pembayaran
            </Button>
            <Button
              variant={currentView === "tenants" ? "default" : "ghost"}
              onClick={() => setCurrentView("tenants")}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Penghuni
            </Button>
            <Button
              variant={currentView === "reports" ? "default" : "ghost"}
              onClick={() => setCurrentView("reports")}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Laporan
            </Button>
            <Button
              variant={currentView === "expenses" ? "default" : "ghost"}
              onClick={() => setCurrentView("expenses")}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Pengeluaran
            </Button>
            <Button
              variant={currentView === "financial" ? "default" : "ghost"}
              onClick={() => setCurrentView("financial")}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Keuangan
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {currentView !== "receipt" && (
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-2xl font-bold text-foreground">
              {getPageTitle()}
            </h2>
            <p className="text-muted-foreground">
              {getPageDescription()}
            </p>
          </div>
        )}

        {currentView === "form" && (
          <PaymentForm onPaymentSubmit={handlePaymentSubmit} />
        )}

        {currentView === "receipt" && paymentData && paymentResult && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                Kwitansi Pembayaran
              </h2>
              <p className="text-muted-foreground">
                Kwitansi resmi pembayaran sewa kamar ANTIEQ WISMA KOST
              </p>
            </div>
            <ReceiptComponent 
              paymentData={paymentData} 
              paymentResult={paymentResult} 
              onBack={handleBackToForm}
            />
          </div>
        )}

        {currentView === "tenants" && <TenantManagement />}

        {currentView === "reports" && <MonthlyReport />}

        {currentView === "expenses" && <ExpenseManager />}

        {currentView === "financial" && <FinancialReport />}
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
              <p>JL. Drs HASAN KADIR desa BUTU kec TILONGKABILA</p>
              <p>BONEBOLANGO GORONTALO</p>
              <p>Telp: 0821 8753 5727 | WhatsApp: 0821 8753 5727</p>
              <p>Email: info@antieqwisma.com</p>
            </div>
            <div className="text-xs opacity-75 pt-4 border-t border-primary-light">
              <p>&copy; 2024 ANTIEQ WISMA KOST. Sistem Manajemen Pembayaran Sewa Kamar.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
