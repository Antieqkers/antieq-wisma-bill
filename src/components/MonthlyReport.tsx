import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Calendar, Edit, Trash2, Printer } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Payment, Tenant } from "@/lib/supabaseTypes";
import { formatCurrency } from "@/lib/paymentCalculator";

interface PaymentWithTenant extends Payment {
  tenants: Tenant;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID');
};

export default function MonthlyReport() {
  const [payments, setPayments] = useState<PaymentWithTenant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [editingPayment, setEditingPayment] = useState<PaymentWithTenant | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMonthlyPayments();
  }, [selectedMonth, selectedYear]);

  const fetchMonthlyPayments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          tenants (*)
        `)
        .eq('period_month', selectedMonth)
        .eq('period_year', selectedYear)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching monthly payments:', error);
      toast({
        title: "Error",
        description: "Gagal memuat laporan bulanan",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPayment = (payment: PaymentWithTenant) => {
    setEditingPayment(payment);
    setIsEditDialogOpen(true);
  };

  const handleUpdatePayment = async () => {
    if (!editingPayment) return;

    try {
      const { error } = await supabase
        .from('payments')
        .update({
          payment_amount: editingPayment.payment_amount,
          discount_amount: editingPayment.discount_amount,
          notes: editingPayment.notes
        })
        .eq('id', editingPayment.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Pembayaran berhasil diperbarui"
      });

      setIsEditDialogOpen(false);
      setEditingPayment(null);
      fetchMonthlyPayments();
    } catch (error) {
      console.error('Error updating payment:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui pembayaran",
        variant: "destructive"
      });
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pembayaran ini?')) return;

    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Pembayaran berhasil dihapus"
      });

      fetchMonthlyPayments();
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus pembayaran",
        variant: "destructive"
      });
    }
  };

  const handlePrintReceipt = (payment: PaymentWithTenant) => {
    // Create a new window with the receipt content
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Kwitansi ${payment.receipt_number}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .content { margin: 20px 0; }
              .footer { margin-top: 40px; text-align: right; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>ANTIEQ WISMA KOST</h2>
              <p>KWITANSI PEMBAYARAN</p>
              <p>No: ${payment.receipt_number}</p>
            </div>
            <div class="content">
              <p><strong>Nama:</strong> ${payment.tenants.name}</p>
              <p><strong>Kamar:</strong> ${payment.tenants.room_number}</p>
              <p><strong>Periode:</strong> ${payment.period_month}/${payment.period_year}</p>
              <p><strong>Jumlah Bayar:</strong> ${formatCurrency(payment.payment_amount)}</p>
              <p><strong>Tanggal:</strong> ${formatDate(payment.payment_date)}</p>
            </div>
            <div class="footer">
              <p>ANTIEQ WISMA</p>
              <br>
              <p>________________</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const calculateSummary = () => {
    const totalPayments = payments.reduce((sum, payment) => sum + payment.payment_amount, 0);
    const totalOutstanding = payments.reduce((sum, payment) => sum + Math.max(payment.remaining_balance, 0), 0);
    const totalDiscount = payments.reduce((sum, payment) => sum + payment.discount_amount, 0);
    
    return {
      totalPayments,
      totalOutstanding,
      totalDiscount,
      totalTransactions: payments.length
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'lunas':
        return <Badge className="bg-success text-success-foreground">Lunas</Badge>;
      case 'kurang_bayar':
        return <Badge className="bg-warning text-warning-foreground">Kurang Bayar</Badge>;
      case 'lebih_bayar':
        return <Badge className="bg-accent text-accent-foreground">Lebih Bayar</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      // Header
      ['Tanggal', 'No. Kwitansi', 'Nama', 'Kamar', 'Bulan', 'Tahun', 'Tarif Sewa', 'Tunggakan', 'Diskon', 'Dibayar', 'Sisa', 'Status', 'Metode'].join(','),
      // Data
      ...payments.map(payment => [
        formatDate(payment.payment_date),
        payment.receipt_number,
        payment.tenants.name,
        payment.tenants.room_number,
        payment.period_month,
        payment.period_year,
        payment.rent_amount,
        payment.previous_balance,
        payment.discount_amount,
        payment.payment_amount,
        payment.remaining_balance,
        payment.payment_status,
        payment.payment_method
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-${selectedMonth}-${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const summary = calculateSummary();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Laporan Bulanan
        </h2>
        <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filter Periode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="month">Bulan</Label>
              <Input
                id="month"
                type="number"
                min="1"
                max="12"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="year">Tahun</Label>
              <Input
                id="year"
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{summary.totalTransactions}</div>
            <p className="text-sm text-muted-foreground">Total Transaksi</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-success">{formatCurrency(summary.totalPayments)}</div>
            <p className="text-sm text-muted-foreground">Total Pembayaran</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-warning">{formatCurrency(summary.totalOutstanding)}</div>
            <p className="text-sm text-muted-foreground">Total Tunggakan</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-accent">{formatCurrency(summary.totalDiscount)}</div>
            <p className="text-sm text-muted-foreground">Total Diskon</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center p-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>No. Kwitansi</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kamar</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead>Dibayar</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.payment_date)}</TableCell>
                    <TableCell className="font-mono text-sm">{payment.receipt_number}</TableCell>
                    <TableCell className="font-medium">{payment.tenants.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{payment.tenants.room_number}</Badge>
                    </TableCell>
                    <TableCell>{payment.period_month}/{payment.period_year}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(payment.payment_amount)}</TableCell>
                    <TableCell>{getStatusBadge(payment.payment_status)}</TableCell>
                    <TableCell className="capitalize">
                      {payment.payment_method === 'cash' ? 'Tunai' : 
                       payment.payment_method === 'transfer' ? 'Transfer' : 'E-Wallet'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditPayment(payment)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePayment(payment.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrintReceipt(payment)}
                          className="h-8 w-8 p-0"
                        >
                          <Printer className="h-4 w-4" />
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pembayaran</DialogTitle>
          </DialogHeader>
          {editingPayment && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-amount">Jumlah Pembayaran</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  value={editingPayment.payment_amount}
                  onChange={(e) => setEditingPayment({
                    ...editingPayment,
                    payment_amount: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
              <div>
                <Label htmlFor="edit-discount">Diskon</Label>
                <Input
                  id="edit-discount"
                  type="number"
                  value={editingPayment.discount_amount}
                  onChange={(e) => setEditingPayment({
                    ...editingPayment,
                    discount_amount: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
              <div>
                <Label htmlFor="edit-notes">Catatan</Label>
                <Input
                  id="edit-notes"
                  value={editingPayment.notes || ''}
                  onChange={(e) => setEditingPayment({
                    ...editingPayment,
                    notes: e.target.value
                  })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleUpdatePayment}>
                  Simpan
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
