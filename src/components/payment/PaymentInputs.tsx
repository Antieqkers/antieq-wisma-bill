
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Info, Calculator, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/paymentCalculator";

interface PaymentInputsProps {
  rentAmount: number;
  previousBalance: number;
  paymentAmount: number;
  discountAmount: number;
  paymentMethod: string;
  transferReference?: string;
  bankName?: string;
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
  transferReference,
  bankName,
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
              <div className="space-y-1">
                <p className="text-warning flex items-center gap-1">
                  <Calculator className="h-3 w-3" />
                  Akumulasi semua sewa dari check-in sampai bulan aktif sistem
                </p>
                <p className="text-muted-foreground bg-amber-50 p-2 rounded border border-amber-200">
                  <strong>Rumus:</strong> (Sewa Bulanan × Jumlah Bulan) - Total Yang Sudah Dibayar
                </p>
              </div>
            ) : (
              <p className="text-success flex items-center gap-1">
                <Info className="h-3 w-3" />
                Tidak ada tunggakan - pembayaran up to date
              </p>
            )}
            <p className="text-muted-foreground">
              *Dihitung otomatis berdasarkan kalender sistem yang aktif
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
          <div className="text-xs space-y-1">
            <p className="text-muted-foreground">
              Jumlah uang yang diterima dari penghuni
            </p>
            {paymentAmount > 0 && rentAmount > 0 && (
              <div className="bg-blue-50 p-2 rounded border border-blue-200">
                <p className="text-blue-700 font-medium">
                  Sisa dari pembayaran ini: {formatCurrency(Math.max(rentAmount - paymentAmount, 0))}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  *Sisa ini akan menjadi tunggakan bulan berikutnya jika tidak lunas
                </p>
              </div>
            )}
          </div>
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

      {paymentMethod === 'transfer' && (
        <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700 font-medium">
            <CreditCard className="h-4 w-4" />
            Detail Transfer Bank
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Nama Bank</Label>
              <Input
                id="bankName"
                type="text"
                value={bankName || ''}
                onChange={(e) => onInputChange("bankName", e.target.value)}
                className="border-primary/20 focus:border-primary"
                placeholder="Contoh: BCA, Mandiri, BRI"
                required
              />
              <p className="text-xs text-muted-foreground">
                Nama bank asal transfer
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="transferReference">Referensi/ID Transfer</Label>
              <Input
                id="transferReference"
                type="text"
                value={transferReference || ''}
                onChange={(e) => onInputChange("transferReference", e.target.value)}
                className="border-primary/20 focus:border-primary"
                placeholder="Nomor referensi transfer"
                required
              />
              <p className="text-xs text-muted-foreground">
                Nomor referensi dari bukti transfer
              </p>
            </div>
          </div>
        </div>
      )}

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
