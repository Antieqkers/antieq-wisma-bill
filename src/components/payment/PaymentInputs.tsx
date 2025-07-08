
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Info } from "lucide-react";
import { formatCurrency } from "@/lib/paymentCalculator";

interface PaymentInputsProps {
  rentAmount: number;
  previousBalance: number;
  paymentAmount: number;
  discountAmount: number;
  paymentMethod: string;
  description: string;
  onInputChange: (field: string, value: string | number) => void;
  onDescriptionChange: (value: string) => void;
}

export default function PaymentInputs({
  rentAmount,
  previousBalance,
  paymentAmount,
  discountAmount,
  paymentMethod,
  description,
  onInputChange,
  onDescriptionChange
}: PaymentInputsProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="rentAmount">Tarif Sewa Bulan Ini</Label>
          <Input
            id="rentAmount"
            type="number"
            value={rentAmount}
            onChange={(e) => onInputChange("rentAmount", parseInt(e.target.value) || 0)}
            className="border-primary/20 focus:border-primary"
            readOnly
          />
          <p className="text-xs text-muted-foreground">
            Tarif sewa bulanan standar
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="previousBalance" className="flex items-center gap-2">
            Tunggakan Keseluruhan
            {previousBalance > 0 && <AlertTriangle className="h-4 w-4 text-warning" />}
          </Label>
          <Input
            id="previousBalance"
            type="text"
            value={formatCurrency(previousBalance)}
            className={`border-primary/20 focus:border-primary ${
              previousBalance > 0 ? 'bg-warning/10 border-warning/30' : 'bg-muted'
            }`}
            readOnly
          />
          <div className="text-xs space-y-1">
            {previousBalance > 0 ? (
              <p className="text-warning flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Akumulasi tunggakan dari semua periode sebelumnya
              </p>
            ) : (
              <p className="text-success flex items-center gap-1">
                <Info className="h-3 w-3" />
                Tidak ada tunggakan - semua pembayaran up to date
              </p>
            )}
            <p className="text-muted-foreground">
              *Dihitung otomatis berdasarkan riwayat pembayaran sejak check-in
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="paymentAmount">Jumlah Dibayar Hari Ini</Label>
          <Input
            id="paymentAmount"
            type="number"
            value={paymentAmount || ''}
            onChange={(e) => onInputChange("paymentAmount", parseInt(e.target.value) || 0)}
            className="border-primary/20 focus:border-primary"
            placeholder="Masukkan jumlah pembayaran"
            required
          />
          <p className="text-xs text-muted-foreground">
            Jumlah uang yang diterima dari penghuni
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="discountAmount">Diskon (Opsional)</Label>
          <Input
            id="discountAmount"
            type="number"
            value={discountAmount || ''}
            onChange={(e) => onInputChange("discountAmount", parseInt(e.target.value) || 0)}
            className="border-primary/20 focus:border-primary"
            placeholder="0"
          />
          <p className="text-xs text-muted-foreground">
            Potongan harga khusus jika ada
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="paymentMethod">Metode Pembayaran</Label>
        <Select onValueChange={(value) => onInputChange("paymentMethod", value)} value={paymentMethod}>
          <SelectTrigger className="border-primary/20 focus:border-primary">
            <SelectValue placeholder="Pilih metode pembayaran" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">💵 Tunai (Cash)</SelectItem>
            <SelectItem value="transfer">🏦 Transfer Bank</SelectItem>
            <SelectItem value="ewallet">📱 E-Wallet (OVO/GoPay/Dana)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Catatan Tambahan (Opsional)</Label>
        <Textarea
          id="description"
          placeholder="Contoh: Pembayaran tepat waktu, atau catatan khusus lainnya..."
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="border-primary/20 focus:border-primary"
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Catatan ini akan muncul di kwitansi pembayaran
        </p>
      </div>
    </>
  );
}
