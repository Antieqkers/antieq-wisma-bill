
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tenant } from "@/lib/supabaseTypes";

export default function TenantManagement() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    room_number: "",
    phone: "",
    email: "",
    checkin_date: "",
    monthly_rent: 500000
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('room_number');

      if (error) throw error;
      setTenants(data || []);
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
      
      resetForm();
      fetchTenants();
    } catch (error) {
      console.error('Error saving tenant:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan data penghuni",
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
      checkin_date: tenant.checkin_date,
      monthly_rent: tenant.monthly_rent
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus penghuni ini?')) return;
    
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
      fetchTenants();
    } catch (error) {
      console.error('Error deleting tenant:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus penghuni",
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
      checkin_date: "",
      monthly_rent: 500000
    });
    setEditingTenant(null);
    setShowForm(false);
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <User className="h-6 w-6" />
          Manajemen Penghuni
        </h2>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Tambah Penghuni
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingTenant ? 'Edit Penghuni' : 'Tambah Penghuni Baru'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="room_number">Nomor Kamar</Label>
                  <Input
                    id="room_number"
                    value={formData.room_number}
                    onChange={(e) => setFormData({...formData, room_number: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Nomor Telepon</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="checkin_date">Tanggal Masuk</Label>
                  <Input
                    id="checkin_date"
                    type="date"
                    value={formData.checkin_date}
                    onChange={(e) => setFormData({...formData, checkin_date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="monthly_rent">Tarif Bulanan (Rp)</Label>
                  <Input
                    id="monthly_rent"
                    type="number"
                    value={formData.monthly_rent}
                    onChange={(e) => setFormData({...formData, monthly_rent: parseInt(e.target.value)})}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  {editingTenant ? 'Update' : 'Simpan'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Kamar</TableHead>
                <TableHead>Telepon</TableHead>
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
                  <TableCell>
                    <Badge variant="outline">{tenant.room_number}</Badge>
                  </TableCell>
                  <TableCell>{tenant.phone || '-'}</TableCell>
                  <TableCell>{new Date(tenant.checkin_date).toLocaleDateString('id-ID')}</TableCell>
                  <TableCell>Rp {tenant.monthly_rent.toLocaleString('id-ID')}</TableCell>
                  <TableCell>
                    <Badge className="bg-green-500 text-white">Aktif</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(tenant)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(tenant.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
