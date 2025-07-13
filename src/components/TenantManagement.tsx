import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tenant } from "@/lib/supabaseTypes";

const TenantManagement = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    room_number: "",
    phone: "",
    email: "",
    monthly_rent: 500000,
    checkin_date: ""
  });
  const { toast } = useToast();

  const loadTenants = async () => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('room_number');

      if (error) throw error;
      setTenants(data || []);
    } catch (error) {
      console.error('Error loading tenants:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data penghuni",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadTenants();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingTenant) {
        const { error } = await supabase
          .from('tenants')
          .update(formData)
          .eq('id', editingTenant.id);
        
        if (error) throw error;
        toast({
          title: "Berhasil",
          description: "Data penghuni berhasil diperbarui"
        });
      } else {
        const { error } = await supabase
          .from('tenants')
          .insert(formData);
        
        if (error) throw error;
        toast({
          title: "Berhasil",
          description: "Penghuni baru berhasil ditambahkan"
        });
      }

      // Reset form and reload data
      setFormData({
        name: "",
        room_number: "",
        phone: "",
        email: "",
        monthly_rent: 500000,
        checkin_date: ""
      });
      setEditingTenant(null);
      setIsDialogOpen(false);
      loadTenants();
    } catch (error: any) {
      console.error('Error saving tenant:', error);
      toast({
        title: "Error",
        description: error.message || "Terjadi kesalahan saat menyimpan data",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setFormData({
      name: tenant.name,
      room_number: tenant.room_number,
      phone: tenant.phone || "",
      email: tenant.email || "",
      monthly_rent: tenant.monthly_rent,
      checkin_date: tenant.checkin_date
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus penghuni ini?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Berhasil",
        description: "Penghuni berhasil dihapus"
      });
      
      loadTenants();
    } catch (error: any) {
      console.error('Error deleting tenant:', error);
      toast({
        title: "Error",
        description: error.message || "Terjadi kesalahan saat menghapus data",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      room_number: "",
      phone: "",
      email: "",
      monthly_rent: 500000,
      checkin_date: ""
    });
    setEditingTenant(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <User className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Manajemen Penghuni</h2>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tambah Penghuni
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTenant ? "Edit Penghuni" : "Tambah Penghuni Baru"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nama Lengkap *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="room_number">Nomor Kamar *</Label>
                <Input
                  id="room_number"
                  value={formData.room_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, room_number: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Nomor Telepon</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="08xxxxxxxxxx"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="monthly_rent">Tarif Bulanan *</Label>
                <Input
                  id="monthly_rent"
                  type="number"
                  value={formData.monthly_rent}
                  onChange={(e) => setFormData(prev => ({ ...prev, monthly_rent: parseInt(e.target.value) }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="checkin_date">Tanggal Masuk *</Label>
                <Input
                  id="checkin_date"
                  type="date"
                  value={formData.checkin_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, checkin_date: e.target.value }))}
                  required
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit">
                  {editingTenant ? "Update" : "Simpan"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Batal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Kamar</TableHead>
              <TableHead>Telepon</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Tanggal Masuk</TableHead>
              <TableHead>Tarif Bulanan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((tenant) => (
              <TableRow key={tenant.id}>
                <TableCell className="font-medium">{tenant.name}</TableCell>
                <TableCell>{tenant.room_number}</TableCell>
                <TableCell>{tenant.phone || "-"}</TableCell>
                <TableCell>{tenant.email || "-"}</TableCell>
                <TableCell>{new Date(tenant.checkin_date).toLocaleDateString('id-ID')}</TableCell>
                <TableCell>Rp {tenant.monthly_rent.toLocaleString('id-ID')}</TableCell>
                <TableCell>
                  <Badge className="bg-green-500 text-white">Aktif</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(tenant)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(tenant.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TenantManagement;
