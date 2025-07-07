
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from "lucide-react";
import { Tenant } from "@/lib/supabaseTypes";

interface TenantSelectorProps {
  tenants: Tenant[];
  selectedTenantId: string;
  onTenantChange: (tenantId: string) => void;
}

export default function TenantSelector({ tenants, selectedTenantId, onTenantChange }: TenantSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="tenant" className="flex items-center gap-2">
        <User className="h-4 w-4" />
        Pilih Penghuni
      </Label>
      <Select onValueChange={onTenantChange} value={selectedTenantId} required>
        <SelectTrigger className="border-primary/20 focus:border-primary">
          <SelectValue placeholder="Pilih penghuni" />
        </SelectTrigger>
        <SelectContent>
          {tenants.map((tenant) => (
            <SelectItem key={tenant.id} value={tenant.id}>
              {tenant.name} - Kamar {tenant.room_number}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
