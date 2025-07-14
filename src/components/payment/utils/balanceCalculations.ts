
import { supabase } from "@/integrations/supabase/client";
import { Tenant } from "@/lib/supabaseTypes";

export const calculateOutstandingBalance = async (selectedTenant: Tenant): Promise<number> => {
  try {
    console.log('Calculating outstanding balance for tenant:', selectedTenant.id, selectedTenant.name);
    
    // Get current system date
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-based
    const currentYear = currentDate.getFullYear();
    
    console.log('Current system date:', currentMonth, currentYear);
    
    // Calculate total rent that should have been paid up to current month
    const checkinDate = new Date(selectedTenant.checkin_date);
    const checkinMonth = checkinDate.getMonth() + 1;
    const checkinYear = checkinDate.getFullYear();
    
    console.log('Checkin date:', checkinMonth, checkinYear);
    
    // Calculate months from checkin to current month (sistem calendar aktif)
    let monthsFromCheckinToCurrent = 0;
    if (currentYear === checkinYear) {
      monthsFromCheckinToCurrent = Math.max(currentMonth - checkinMonth + 1, 0);
    } else {
      // Months in checkin year + months in years between + months in current year
      const monthsInCheckinYear = 12 - checkinMonth + 1;
      const yearsBetween = currentYear - checkinYear - 1;
      const monthsInCurrentYear = currentMonth;
      monthsFromCheckinToCurrent = monthsInCheckinYear + (yearsBetween * 12) + monthsInCurrentYear;
    }
    
    console.log('Months from checkin to current month (sistem aktif):', monthsFromCheckinToCurrent);
    
    if (monthsFromCheckinToCurrent < 1) {
      console.log('Less than 1 month passed, no outstanding balance');
      return 0;
    }

    // Calculate total amount that should have been paid from checkin to current month
    const totalShouldPayToCurrent = selectedTenant.monthly_rent * monthsFromCheckinToCurrent;
    console.log('Total should pay from checkin to current month:', totalShouldPayToCurrent);

    // Get all payments made by this tenant
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('payment_amount, remaining_balance, payment_date, period_month, period_year')
      .eq('tenant_id', selectedTenant.id)
      .order('payment_date', { ascending: true });

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
      throw paymentsError;
    }

    console.log('Payments found:', payments);

    let totalPaid = 0;
    if (payments && Array.isArray(payments) && payments.length > 0) {
      // Sum all payments made
      totalPaid = payments.reduce((sum, payment) => {
        console.log('Payment amount:', payment.payment_amount);
        return sum + (payment.payment_amount || 0);
      }, 0);
    }

    console.log('Total paid by tenant:', totalPaid);

    // Calculate outstanding balance (tunggakan keseluruhan)
    // = Total yang harus dibayar sampai bulan aktif sistem - Total yang sudah dibayar
    const outstandingBalance = Math.max(totalShouldPayToCurrent - totalPaid, 0);
    
    console.log('Calculated outstanding balance (tunggakan keseluruhan sampai bulan aktif sistem):', outstandingBalance);
    
    return outstandingBalance;

  } catch (error) {
    console.error('Error calculating outstanding balance:', error);
    throw error;
  }
};

export const calculateManualBalance = async (selectedTenant: Tenant): Promise<number> => {
  try {
    console.log('Performing manual balance calculation for tenant:', selectedTenant.id);
    
    // Get current system date for calculation limit
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    // Calculate months passed from checkin to current month only
    const checkinDate = new Date(selectedTenant.checkin_date);
    const checkinMonth = checkinDate.getMonth() + 1;
    const checkinYear = checkinDate.getFullYear();
    
    let monthsPassed = 0;
    if (currentYear === checkinYear) {
      monthsPassed = Math.max(currentMonth - checkinMonth + 1, 0);
    } else {
      const monthsInCheckinYear = 12 - checkinMonth + 1;
      const yearsBetween = currentYear - checkinYear - 1;
      const monthsInCurrentYear = currentMonth;
      monthsPassed = monthsInCheckinYear + (yearsBetween * 12) + monthsInCurrentYear;
    }
    
    console.log('Manual calculation - Months passed to current month:', monthsPassed);
    
    if (monthsPassed < 1) {
      return 0;
    }

    // Total that should be paid up to current month
    const totalShouldPay = selectedTenant.monthly_rent * monthsPassed;
    console.log('Manual calculation - Total should pay up to current month:', totalShouldPay);
    
    // Total that has been paid
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('payment_amount')
      .eq('tenant_id', selectedTenant.id);

    if (paymentsError) {
      console.error('Error fetching payments for manual calculation:', paymentsError);
      throw paymentsError;
    }

    const totalPaid = (payments && Array.isArray(payments)) ? payments.reduce((sum, payment) => sum + (payment.payment_amount || 0), 0) : 0;
    const outstanding = Math.max(totalShouldPay - totalPaid, 0);
    
    console.log('Manual calculation - Total paid:', totalPaid, 'Outstanding up to current month:', outstanding);
    
    return outstanding;
  } catch (error) {
    console.error('Error in manual balance calculation:', error);
    return 0;
  }
};
