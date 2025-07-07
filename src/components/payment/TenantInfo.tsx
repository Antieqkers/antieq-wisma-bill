
import { Tenant } from "@/lib/supabaseTypes";

interface TenantInfoProps {
  tenant: Tenant;
}

export default function TenantInfo({ tenant }: TenantInfoProps) {
  return (
    <div className="bg-muted/50 p-4 rounded-lg border">
      <h3 className="font-semibold mb-2">Informasi Penghuni</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Tanggal Masuk:</span>
          <p className="font-medium">{new Date(tenant.checkin_date).toLocaleDateString('id-ID')}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Sewa Bulanan:</span>
          <p className="font-medium">Rp {tenant.monthly_rent.toLocaleString('id-ID')}</p>
        </div>
      </div>
    </div>
  );
}
