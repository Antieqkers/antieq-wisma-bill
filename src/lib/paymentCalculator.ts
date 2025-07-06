export interface PaymentData {
  tenantName: string;
  roomNumber: string;
  month: string;
  year: number;
  rentAmount: number;
  previousBalance: number;
  paymentAmount: number;
  discountAmount: number;
  paymentMethod: string;
}

export interface PaymentResult {
  totalDue: number;
  totalAfterDiscount: number;
  remainingBalance: number;
  paymentStatus: "lunas" | "kurang_bayar" | "lebih_bayar";
  receiptNumber: string;
  paymentDate: Date;
}

export function calculatePayment(data: PaymentData): PaymentResult {
  // Calculate total due (rent + previous balance)
  const totalDue = data.rentAmount + data.previousBalance;
  
  // Apply discount
  const totalAfterDiscount = totalDue - data.discountAmount;
  
  // Calculate remaining balance (negative means overpayment)
  const remainingBalance = totalAfterDiscount - data.paymentAmount;
  
  // Determine payment status
  let paymentStatus: "lunas" | "kurang_bayar" | "lebih_bayar";
  if (remainingBalance > 0) {
    paymentStatus = "kurang_bayar";
  } else if (remainingBalance < 0) {
    paymentStatus = "lebih_bayar";
  } else {
    paymentStatus = "lunas";
  }
  
  // Generate receipt number
  const receiptNumber = generateReceiptNumber();
  
  return {
    totalDue,
    totalAfterDiscount,
    remainingBalance,
    paymentStatus,
    receiptNumber,
    paymentDate: new Date()
  };
}

function generateReceiptNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const timestamp = now.getTime().toString().slice(-4);
  
  return `AW${year}${month}${day}${timestamp}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

export function numberToWords(num: number): string {
  const ones = [
    '', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan',
    'sepuluh', 'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas',
    'enam belas', 'tujuh belas', 'delapan belas', 'sembilan belas'
  ];
  
  const tens = [
    '', '', 'dua puluh', 'tiga puluh', 'empat puluh', 'lima puluh',
    'enam puluh', 'tujuh puluh', 'delapan puluh', 'sembilan puluh'
  ];
  
  function convertHundreds(n: number): string {
    let result = '';
    
    if (n >= 100) {
      const hundreds = Math.floor(n / 100);
      if (hundreds === 1) {
        result += 'seratus ';
      } else {
        result += ones[hundreds] + ' ratus ';
      }
      n %= 100;
    }
    
    if (n >= 20) {
      result += tens[Math.floor(n / 10)];
      if (n % 10 !== 0) {
        result += ' ' + ones[n % 10];
      }
    } else if (n > 0) {
      result += ones[n];
    }
    
    return result.trim();
  }
  
  if (num === 0) return 'nol';
  
  let result = '';
  
  if (num >= 1000000000) {
    const billions = Math.floor(num / 1000000000);
    result += (billions === 1 ? 'satu' : convertHundreds(billions)) + ' miliar ';
    num %= 1000000000;
  }
  
  if (num >= 1000000) {
    const millions = Math.floor(num / 1000000);
    result += (millions === 1 ? 'satu' : convertHundreds(millions)) + ' juta ';
    num %= 1000000;
  }
  
  if (num >= 1000) {
    const thousands = Math.floor(num / 1000);
    if (thousands === 1) {
      result += 'seribu ';
    } else {
      result += convertHundreds(thousands) + ' ribu ';
    }
    num %= 1000;
  }
  
  if (num > 0) {
    result += convertHundreds(num);
  }
  
  return result.trim() + ' rupiah';
}