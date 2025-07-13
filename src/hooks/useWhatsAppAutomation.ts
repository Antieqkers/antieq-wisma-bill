
import { useEffect } from "react";
import { formatCurrency } from "@/lib/paymentCalculator";
import { PaymentFormData, Tenant } from "@/lib/supabaseTypes";
import { PaymentResult } from "@/lib/paymentCalculator";

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

const defaultSettings: WhatsAppSettings = {
  autoConfirmPayment: true,
  autoReminderArrears: true,
  autoBilling: false,
  reminderDaysBefore: 3,
  customMessage: {
    payment: "Halo {nama}, pembayaran sewa kamar {kamar} untuk periode {periode} sebesar {jumlah} telah kami terima. Kwitansi: {kwitansi}. Terima kasih - ANTIEQ WISMA KOST",
    arrears: "Halo {nama}, ini adalah pengingat pembayaran sewa kamar {kamar} di ANTIEQ WISMA KOST. Tunggakan Anda saat ini {tunggakan}. Mohon segera melakukan pembayaran. Terima kasih.",
    billing: "Halo {nama}, tagihan sewa kamar {kamar} untuk bulan {bulan} sebesar {jumlah} sudah jatuh tempo. Mohon segera melakukan pembayaran. Terima kasih - ANTIEQ WISMA KOST"
  }
};

export const useWhatsAppAutomation = () => {
  const getSettings = (): WhatsAppSettings => {
    try {
      const saved = localStorage.getItem('whatsapp_settings');
      return saved ? JSON.parse(saved) : defaultSettings;
    } catch {
      return defaultSettings;
    }
  };

  const sendAutoPaymentConfirmation = (
    paymentData: PaymentFormData,
    paymentResult: PaymentResult,
    tenant: Tenant
  ) => {
    const settings = getSettings();
    
    if (!settings.autoConfirmPayment || !tenant.phone) {
      return;
    }

    let message = settings.customMessage.payment;
    const replacements = {
      nama: tenant.name,
      kamar: tenant.room_number,
      periode: `${paymentData.month}/${paymentData.year}`,
      jumlah: formatCurrency(paymentData.paymentAmount),
      kwitansi: paymentResult.receiptNumber
    };

    Object.entries(replacements).forEach(([key, value]) => {
      message = message.replace(new RegExp(`{${key}}`, 'g'), value);
    });

    // Auto-send WhatsApp message
    const whatsappUrl = `https://wa.me/${tenant.phone}?text=${encodeURIComponent(message)}`;
    
    // Open in new tab with small delay to avoid popup blocker
    setTimeout(() => {
      window.open(whatsappUrl, '_blank');
    }, 1000);
  };

  const sendArrearsReminder = (tenant: Tenant, arrears: number) => {
    const settings = getSettings();
    
    if (!settings.autoReminderArrears || !tenant.phone) {
      return;
    }

    let message = settings.customMessage.arrears;
    const replacements = {
      nama: tenant.name,
      kamar: tenant.room_number,
      tunggakan: formatCurrency(arrears)
    };

    Object.entries(replacements).forEach(([key, value]) => {
      message = message.replace(new RegExp(`{${key}}`, 'g'), value);
    });

    const whatsappUrl = `https://wa.me/${tenant.phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const sendBillingReminder = (tenant: Tenant, amount: number, month: string) => {
    const settings = getSettings();
    
    if (!settings.autoBilling || !tenant.phone) {
      return;
    }

    let message = settings.customMessage.billing;
    const replacements = {
      nama: tenant.name,
      kamar: tenant.room_number,
      jumlah: formatCurrency(amount),
      bulan: month
    };

    Object.entries(replacements).forEach(([key, value]) => {
      message = message.replace(new RegExp(`{${key}}`, 'g'), value);
    });

    const whatsappUrl = `https://wa.me/${tenant.phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return {
    getSettings,
    sendAutoPaymentConfirmation,
    sendArrearsReminder,
    sendBillingReminder
  };
};
