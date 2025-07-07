
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

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
          <Label htmlFor="rentAmount">Tarif Sewa Bulan Ini (Rp)</Label>
          <Input
            id="rentAmount"
            type="number"
            value={rentAmount}
            onChange={(e) => onInputChange("rentAmount", parseInt(e.target.value))}
            className="border-primary/20 focus:border-primary"
            readOnly
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="previousBalance">Tunggakan Otomatis (Rp)</Label>
          <Input
            id="previousBalance"
            type="number"
            value={previousBalance}
            className="border-primary/20 focus:border-primary bg-muted"
            readOnly
          />
          <p className="text-xs text-muted-foreground">
            *Dihitung otomatis dari tanggal masuk penghuni
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="paymentAmount">Jumlah Dibayar (Rp)</Label>
          <Input
            id="paymentAmount"
            type="number"
            value={paymentAmount}
            onChange={(e) => onInputChange("paymentAmount", parseInt(e.target.value))}
            className="border-primary/20 focus:border-primary"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="discountAmount">Diskon (Rp)</Label>
          <Input
            id="discountAmount"
            type="number"
            value={discountAmount}
            onChange={(e) => onInputChange("discountAmount", parseInt(e.target.value))}
            className="border-primary/20 focus:border-primary"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="paymentMethod">Metode Pembayaran</Label>
        <Select onValueChange={(value) => onInputChange("paymentMethod", value)} value={paymentMethod}>
          <SelectTrigger className="border-primary/20 focus:border-primary">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">Tunai</SelectItem>
            <SelectItem value="transfer">Transfer Bank</SelectItem>
            <SelectItem value="ewallet">E-Wallet</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Keterangan (Opsional)</Label>
        <Textarea
          id="description"
          placeholder="Masukkan keterangan tambahan jika diperlukan..."
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="border-primary/20 focus:border-primary"
          rows={3}
        />
      </div>
    </>
  );
}
