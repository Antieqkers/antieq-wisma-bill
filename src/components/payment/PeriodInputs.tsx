
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays } from "lucide-react";

interface PeriodInputsProps {
  month: string;
  year: number;
  onMonthChange: (month: string) => void;
  onYearChange: (year: number) => void;
}

export default function PeriodInputs({ month, year, onMonthChange, onYearChange }: PeriodInputsProps) {
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="month" className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          Bulan Pembayaran
        </Label>
        <Select onValueChange={onMonthChange} value={month} required>
          <SelectTrigger className="border-primary/20 focus:border-primary">
            <SelectValue placeholder="Pilih bulan" />
          </SelectTrigger>
          <SelectContent>
            {months.map((monthName) => (
              <SelectItem key={monthName} value={monthName}>{monthName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="year">Tahun</Label>
        <Input
          id="year"
          type="number"
          value={year}
          onChange={(e) => onYearChange(parseInt(e.target.value))}
          className="border-primary/20 focus:border-primary"
        />
      </div>
    </div>
  );
}
