
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Receipt } from "lucide-react";
import { PaymentFormData } from "@/lib/supabaseTypes";
import { PaymentResult } from "@/lib/paymentCalculator";
import { usePaymentForm } from "./payment/usePaymentForm";
import TenantSelector from "./payment/TenantSelector";
import TenantInfo from "./payment/TenantInfo";
import PeriodInputs from "./payment/PeriodInputs";
import PaymentInputs from "./payment/PaymentInputs";
import PaymentCalculation from "./payment/PaymentCalculation";

interface PaymentFormProps {
  onPaymentSubmit: (paymentData: PaymentFormData, result: PaymentResult) => void;
}

export default function PaymentForm({ onPaymentSubmit }: PaymentFormProps) {
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
  } = usePaymentForm(onPaymentSubmit);

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
          <TenantSelector
            tenants={tenants}
            selectedTenantId={formData.tenant_id}
            onTenantChange={handleTenantChange}
          />

          {selectedTenant && (
            <>
              <TenantInfo tenant={selectedTenant} />

              <PeriodInputs
                month={formData.month}
                year={formData.year}
                onMonthChange={(month) => handleInputChange("month", month)}
                onYearChange={(year) => handleInputChange("year", year)}
              />

              <PaymentInputs
                rentAmount={formData.rentAmount}
                previousBalance={previousBalance}
                paymentAmount={formData.paymentAmount}
                discountAmount={formData.discountAmount}
                paymentMethod={formData.paymentMethod}
                description={description}
                onInputChange={handleInputChange}
                onDescriptionChange={setDescription}
              />

              {calculationResult && (
                <PaymentCalculation
                  calculationResult={calculationResult}
                  rentAmount={formData.rentAmount}
                  previousBalance={formData.previousBalance}
                  discountAmount={formData.discountAmount}
                  paymentAmount={formData.paymentAmount}
                />
              )}

              <Button type="submit" className="w-full" size="lg">
                <Receipt className="h-4 w-4 mr-2" />
                Buat Kwitansi Pembayaran
              </Button>
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
