
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tenant } from "@/lib/supabaseTypes";
import { formatCurrency } from "@/lib/paymentCalculator";
import { useWhatsAppAutomation } from "@/hooks/useWhatsAppAutomation";

interface TenantWithArrears extends Tenant {
  arrears: number;
  monthsArrears: number;
  selected: boolean;
}

export default function WhatsAppBulkSender() {
  const [tenants, setTenants] = useState<TenantWithArrears[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const { toast } = useToast();
  const { sendArrearsReminder, sendBillingReminder } = useWhatsAppAutomation();

  useEffect(() => {
    fetchTenantsWithArrears();
  }, []);

  useEffect(() => {
    const count = tenants.filter(t => t.selected).length;
    setSelectedCount(count);
  }, [tenants]);

  const fetchTenantsWithArrears = async () => {
    setIsLoading(true);
    try {
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select('*')
        .order('room_number');

      if (tenantsError) throw tenantsError;

      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*');

      if (paymentsError) throw paymentsError;

      const tenantsWithArrears: TenantWithArrears[] = [];
      const currentDate = new Date();

      (tenantsData && Array.isArray(tenantsData) ? tenantsData : []).forEach(tenant => {
        const checkinDate = new Date(tenant.checkin_date);
        const monthsPassed = Math.max(0, 
          (currentDate.getFullYear() - checkinDate.getFullYear()) * 12 + 
          (currentDate.getMonth() - checkinDate.getMonth())
        );

        if (monthsPassed > 0) {
          const totalShouldPaid = tenant.monthly_rent * monthsPassed;
          const tenantPayments = (payments && Array.isArray(payments)) ? payments.filter(p => p.tenant_id === tenant.id) : [];
          const totalPaid = tenantPayments.reduce((sum, p) => sum + p.payment_amount, 0);
          const arrears = totalShouldPaid - totalPaid;

          tenantsWithArrears.push({
            ...tenant,
            arrears: Math.max(0, arrears),
            monthsArrears: Math.ceil(Math.max(0, arrears) / tenant.monthly_rent),
            selected: false
          });
        }
      });

      setTenants(tenantsWithArrears);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data penghuni",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTenantSelection = (tenantId: string) => {
    setTenants(prev => prev.map(tenant => 
      tenant.id === tenantId 
        ? { ...tenant, selected: !tenant.selected }
        : tenant
    ));
  };

  const selectAll = () => {
    const hasUnselected = tenants.some(t => !t.selected);
    setTenants(prev => prev.map(tenant => ({
      ...tenant,
      selected: hasUnselected
    })));
  };

  const sendArrearsMessages = () => {
    const selectedTenants = tenants.filter(t => t.selected && t.arrears > 0);
    
    if (selectedTenants.length === 0) {
      toast({
        title: "Peringatan",
        description: "Pilih penghuni yang akan dikirim pengingat tunggakan",
        variant: "destructive"
      });
      return;
    }

    selectedTenants.forEach((tenant, index) => {
      setTimeout(() => {
        sendArrearsReminder(tenant, tenant.arrears);
      }, index * 2000); // Delay 2 detik antar pesan
    });

    toast({
      title: "Berhasil",
      description: `Mengirim pengingat tunggakan ke ${selectedTenants.length} penghuni`
    });
  };

  const sendBillingMessages = () => {
    const selectedTenants = tenants.filter(t => t.selected);
    
    if (selectedTenants.length === 0) {
      toast({
        title: "Peringatan",
        description: "Pilih penghuni yang akan dikirim tagihan",
        variant: "destructive"
      });
      return;
    }

    const currentMonth = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    
    selectedTenants.forEach((tenant, index) => {
      setTimeout(() => {
        sendBillingReminder(tenant, tenant.monthly_rent, currentMonth);
      }, index * 2000); // Delay 2 detik antar pesan
    });

    toast({
      title: "Berhasil",
      description: `Mengirim tagihan ke ${selectedTenants.length} penghuni`
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Kirim WhatsApp Massal</h2>
        </div>
        <div className="flex gap-2">
          <Button onClick={selectAll} variant="outline">
            {tenants.every(t => t.selected) ? 'Batal Pilih Semua' : 'Pilih Semua'}
          </Button>
          <Button onClick={sendArrearsMessages} className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Kirim Pengingat Tunggakan ({selectedCount})
          </Button>
          <Button onClick={sendBillingMessages} variant="outline" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Kirim Tagihan ({selectedCount})
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Penghuni</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center p-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={tenants.length > 0 && tenants.every(t => t.selected)}
                      onCheckedChange={selectAll}
                    />
                  </TableHead>
                  <TableHead>Kamar</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Telepon</TableHead>
                  <TableHead>Sewa Bulanan</TableHead>
                  <TableHead>Tunggakan</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <Checkbox
                        checked={tenant.selected}
                        onCheckedChange={() => toggleTenantSelection(tenant.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{tenant.room_number}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell>{tenant.phone || '-'}</TableCell>
                    <TableCell>{formatCurrency(tenant.monthly_rent)}</TableCell>
                    <TableCell>
                      {tenant.arrears > 0 ? (
                        <span className="font-bold text-red-600">
                          {formatCurrency(tenant.arrears)}
                        </span>
                      ) : (
                        <span className="text-green-600">Tidak ada</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {tenant.arrears > 0 ? (
                        <Badge variant="destructive">Menunggak</Badge>
                      ) : (
                        <Badge className="bg-success">Lancar</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
