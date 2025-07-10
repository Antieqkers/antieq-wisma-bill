
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, MessageCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Payment, Tenant } from "@/lib/supabaseTypes";
import { formatCurrency } from "@/lib/paymentCalculator";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface PaymentWithTenant extends Payment {
  tenants: Tenant;
}

interface TenantArrears {
  tenant: Tenant;
  totalArrears: number;
  monthsArrears: number;
  lastPaymentDate?: string;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID');
};

export default function TenantsArrearsReport() {
  const [tenantArrears, setTenantArrears] = useState<TenantArrears[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { toast } = useToast();

  useEffect(() => {
    fetchArrearsData();
  }, [selectedDate]);

  const fetchArrearsData = async () => {
    setIsLoading(true);
    try {
      // Fetch all tenants
      const { data: tenants, error: tenantsError } = await supabase
        .from('tenants')
        .select('*')
        .order('room_number');

      if (tenantsError) throw tenantsError;

      // Fetch all payments
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*');

      if (paymentsError) throw paymentsError;

      // Calculate arrears for each tenant
      const arrearsData: TenantArrears[] = [];
      const targetDate = new Date(selectedDate);

      tenants?.forEach(tenant => {
        const checkinDate = new Date(tenant.checkin_date);
        const monthsPassed = Math.max(0, 
          (targetDate.getFullYear() - checkinDate.getFullYear()) * 12 + 
          (targetDate.getMonth() - checkinDate.getMonth())
        );

        if (monthsPassed > 0) {
          const totalShouldPaid = tenant.monthly_rent * monthsPassed;
          const tenantPayments = payments?.filter(p => p.tenant_id === tenant.id) || [];
          const totalPaid = tenantPayments.reduce((sum, p) => sum + p.payment_amount, 0);
          const arrears = totalShouldPaid - totalPaid;

          if (arrears > 0) {
            const lastPayment = tenantPayments
              .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())[0];

            arrearsData.push({
              tenant,
              totalArrears: arrears,
              monthsArrears: Math.ceil(arrears / tenant.monthly_rent),
              lastPaymentDate: lastPayment?.payment_date
            });
          }
        }
      });

      setTenantArrears(arrearsData.sort((a, b) => b.totalArrears - a.totalArrears));
    } catch (error) {
      console.error('Error fetching arrears data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data tunggakan",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(16);
    doc.text('LAPORAN TUNGGAKAN PENGHUNI', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text('ANTIEQ WISMA KOST', 105, 30, { align: 'center' });
    doc.text(`Per Tanggal: ${formatDate(selectedDate)}`, 105, 40, { align: 'center' });

    // Table data
    const tableData = tenantArrears.map(item => [
      item.tenant.room_number,
      item.tenant.name,
      item.tenant.phone || '-',
      formatCurrency(item.totalArrears),
      `${item.monthsArrears} bulan`,
      item.lastPaymentDate ? formatDate(item.lastPaymentDate) : 'Belum pernah bayar'
    ]);

    // Add table
    (doc as any).autoTable({
      head: [['Kamar', 'Nama', 'Telepon', 'Tunggakan', 'Durasi', 'Bayar Terakhir']],
      body: tableData,
      startY: 50,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    // Summary
    const totalArrears = tenantArrears.reduce((sum, item) => sum + item.totalArrears, 0);
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text(`Total Penghuni Menunggak: ${tenantArrears.length}`, 20, finalY);
    doc.text(`Total Tunggakan: ${formatCurrency(totalArrears)}`, 20, finalY + 10);

    doc.save(`laporan-tunggakan-${selectedDate}.pdf`);
  };

  const exportToExcel = () => {
    const csvContent = [
      ['Kamar', 'Nama', 'Telepon', 'Tunggakan', 'Durasi (Bulan)', 'Bayar Terakhir'].join(','),
      ...tenantArrears.map(item => [
        item.tenant.room_number,
        item.tenant.name,
        item.tenant.phone || '',
        item.totalArrears,
        item.monthsArrears,
        item.lastPaymentDate ? formatDate(item.lastPaymentDate) : 'Belum pernah bayar'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-tunggakan-${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sendWhatsAppReminder = (tenant: Tenant, arrears: number) => {
    const message = `Halo ${tenant.name}, ini adalah pengingat pembayaran sewa kamar ${tenant.room_number} di ANTIEQ WISMA KOST. Tunggakan Anda saat ini ${formatCurrency(arrears)}. Mohon segera melakukan pembayaran. Terima kasih.`;
    const whatsappUrl = `https://wa.me/${tenant.phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const sendWhatsAppInfo = (tenant: Tenant) => {
    const message = `Halo ${tenant.name}, berikut informasi kamar Anda di ANTIEQ WISMA KOST:\n- Kamar: ${tenant.room_number}\n- Sewa Bulanan: ${formatCurrency(tenant.monthly_rent)}\n- Check-in: ${formatDate(tenant.checkin_date)}\n\nUntuk informasi lebih lanjut, hubungi kami di 0821 8753 5727.`;
    const whatsappUrl = `https://wa.me/${tenant.phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          Laporan Tunggakan Penghuni
        </h2>
        <div className="flex gap-2">
          <Button onClick={generatePDF} className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Cetak PDF
          </Button>
          <Button onClick={exportToExcel} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Date Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Tanggal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Label htmlFor="date">Per Tanggal:</Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-48"
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {tenantArrears.length}
            </div>
            <p className="text-sm text-muted-foreground">Penghuni Menunggak</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(tenantArrears.reduce((sum, item) => sum + item.totalArrears, 0))}
            </div>
            <p className="text-sm text-muted-foreground">Total Tunggakan</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {tenantArrears.reduce((sum, item) => sum + item.monthsArrears, 0)}
            </div>
            <p className="text-sm text-muted-foreground">Total Bulan Tunggakan</p>
          </CardContent>
        </Card>
      </div>

      {/* Arrears Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center p-8">Loading...</div>
          ) : tenantArrears.length === 0 ? (
            <div className="flex justify-center p-8 text-green-600">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 mx-auto mb-2 text-green-600" />
                <p className="text-lg font-medium">Tidak Ada Tunggakan</p>
                <p className="text-sm text-muted-foreground">Semua penghuni sudah membayar tepat waktu</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kamar</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Telepon</TableHead>
                  <TableHead>Tunggakan</TableHead>
                  <TableHead>Durasi</TableHead>
                  <TableHead>Bayar Terakhir</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi WhatsApp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenantArrears.map((item) => (
                  <TableRow key={item.tenant.id}>
                    <TableCell>
                      <Badge variant="outline">{item.tenant.room_number}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{item.tenant.name}</TableCell>
                    <TableCell>{item.tenant.phone || '-'}</TableCell>
                    <TableCell className="font-bold text-red-600">
                      {formatCurrency(item.totalArrears)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">{item.monthsArrears} bulan</Badge>
                    </TableCell>
                    <TableCell>
                      {item.lastPaymentDate ? formatDate(item.lastPaymentDate) : 
                       <Badge variant="outline" className="text-red-600">Belum pernah bayar</Badge>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">Menunggak</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendWhatsAppReminder(item.tenant, item.totalArrears)}
                          disabled={!item.tenant.phone}
                          className="h-8 w-8 p-0"
                          title="Kirim Pengingat Pembayaran"
                        >
                          <MessageCircle className="h-3 w-3 text-red-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendWhatsAppInfo(item.tenant)}
                          disabled={!item.tenant.phone}
                          className="h-8 w-8 p-0"
                          title="Kirim Info Kost"
                        >
                          <MessageCircle className="h-3 w-3 text-blue-600" />
                        </Button>
                      </div>
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
