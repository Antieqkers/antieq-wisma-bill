
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Settings, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WhatsAppSettings {
  autoConfirmPayment: boolean;
  autoReminderArrears: boolean;
  autoBilling: boolean;
  reminderDaysBefore: number;
  customMessage: {
    payment: string;
    arrears: string;
    billing: string;
  };
}

export default function WhatsAppAutomation() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<WhatsAppSettings>({
    autoConfirmPayment: true,
    autoReminderArrears: true,
    autoBilling: false,
    reminderDaysBefore: 3,
    customMessage: {
      payment: "Halo {nama}, pembayaran sewa kamar {kamar} untuk periode {periode} sebesar {jumlah} telah kami terima. Kwitansi: {kwitansi}. Terima kasih - ANTIEQ WISMA KOST",
      arrears: "Halo {nama}, ini adalah pengingat pembayaran sewa kamar {kamar} di ANTIEQ WISMA KOST. Tunggakan Anda saat ini {tunggakan}. Mohon segera melakukan pembayaran. Terima kasih.",
      billing: "Halo {nama}, tagihan sewa kamar {kamar} untuk bulan {bulan} sebesar {jumlah} sudah jatuh tempo. Mohon segera melakukan pembayaran. Terima kasih - ANTIEQ WISMA KOST"
    }
  });

  const handleSettingChange = (key: keyof WhatsAppSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleCustomMessageChange = (type: keyof typeof settings.customMessage, value: string) => {
    setSettings(prev => ({
      ...prev,
      customMessage: {
        ...prev.customMessage,
        [type]: value
      }
    }));
  };

  const saveSettings = () => {
    localStorage.setItem('whatsapp_settings', JSON.stringify(settings));
    toast({
      title: "Berhasil",
      description: "Pengaturan WhatsApp berhasil disimpan"
    });
  };

  const testMessage = (type: keyof typeof settings.customMessage) => {
    const testData = {
      nama: "John Doe",
      kamar: "A01",
      periode: "Januari 2024",
      jumlah: "Rp 500.000",
      kwitansi: "KWT-2024-001",
      tunggakan: "Rp 1.000.000",
      bulan: "Februari 2024"
    };

    let message = settings.customMessage[type];
    Object.entries(testData).forEach(([key, value]) => {
      message = message.replace(new RegExp(`{${key}}`, 'g'), value);
    });

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-6 w-6 text-green-600" />
        <h2 className="text-2xl font-bold">Otomatisasi WhatsApp</h2>
      </div>

      {/* Pengaturan Otomatisasi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Pengaturan Otomatisasi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-payment">Konfirmasi Pembayaran Otomatis</Label>
            <Switch
              id="auto-payment"
              checked={settings.autoConfirmPayment}
              onCheckedChange={(checked) => handleSettingChange('autoConfirmPayment', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="auto-arrears">Pengingat Tunggakan Otomatis</Label>
            <Switch
              id="auto-arrears"
              checked={settings.autoReminderArrears}
              onCheckedChange={(checked) => handleSettingChange('autoReminderArrears', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="auto-billing">Tagihan Bulanan Otomatis</Label>
            <Switch
              id="auto-billing"
              checked={settings.autoBilling}
              onCheckedChange={(checked) => handleSettingChange('autoBilling', checked)}
            />
          </div>

          <div className="flex items-center gap-4">
            <Label htmlFor="reminder-days">Kirim pengingat (hari sebelum jatuh tempo):</Label>
            <Input
              id="reminder-days"
              type="number"
              min="1"
              max="30"
              value={settings.reminderDaysBefore}
              onChange={(e) => handleSettingChange('reminderDaysBefore', parseInt(e.target.value))}
              className="w-20"
            />
          </div>
        </CardContent>
      </Card>

      {/* Template Pesan */}
      <Card>
        <CardHeader>
          <CardTitle>Template Pesan WhatsApp</CardTitle>
          <p className="text-sm text-muted-foreground">
            Gunakan variabel: {"{nama}"}, {"{kamar}"}, {"{periode}"}, {"{jumlah}"}, {"{kwitansi}"}, {"{tunggakan}"}, {"{bulan}"}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Konfirmasi Pembayaran */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Konfirmasi Pembayaran</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => testMessage('payment')}
                className="flex items-center gap-1"
              >
                <Send className="h-3 w-3" />
                Test
              </Button>
            </div>
            <Textarea
              value={settings.customMessage.payment}
              onChange={(e) => handleCustomMessageChange('payment', e.target.value)}
              rows={3}
            />
          </div>

          {/* Pengingat Tunggakan */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Pengingat Tunggakan</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => testMessage('arrears')}
                className="flex items-center gap-1"
              >
                <Send className="h-3 w-3" />
                Test
              </Button>
            </div>
            <Textarea
              value={settings.customMessage.arrears}
              onChange={(e) => handleCustomMessageChange('arrears', e.target.value)}
              rows={3}
            />
          </div>

          {/* Tagihan Bulanan */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Tagihan Bulanan</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => testMessage('billing')}
                className="flex items-center gap-1"
              >
                <Send className="h-3 w-3" />
                Test
              </Button>
            </div>
            <Textarea
              value={settings.customMessage.billing}
              onChange={(e) => handleCustomMessageChange('billing', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tombol Simpan */}
      <Card>
        <CardContent className="pt-6">
          <Button onClick={saveSettings} className="w-full">
            Simpan Pengaturan
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
