
-- Create enum types
CREATE TYPE payment_status AS ENUM ('lunas', 'kurang_bayar', 'lebih_bayar');
CREATE TYPE payment_method AS ENUM ('cash', 'transfer', 'ewallet');

-- Create tenants table (data penghuni)
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  room_number VARCHAR(50) NOT NULL UNIQUE,
  phone VARCHAR(20),
  email VARCHAR(255),
  checkin_date DATE NOT NULL,
  monthly_rent DECIMAL(12,2) NOT NULL DEFAULT 500000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table (data pembayaran)
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  receipt_number VARCHAR(50) UNIQUE NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  period_month INTEGER NOT NULL,
  period_year INTEGER NOT NULL,
  rent_amount DECIMAL(12,2) NOT NULL,
  previous_balance DECIMAL(12,2) DEFAULT 0,
  payment_amount DECIMAL(12,2) NOT NULL,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  remaining_balance DECIMAL(12,2) NOT NULL,
  payment_status payment_status NOT NULL,
  payment_method payment_method NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tenant_balances table (saldo tunggakan per tenant)
CREATE TABLE public.tenant_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  current_balance DECIMAL(12,2) DEFAULT 0,
  last_payment_date DATE,
  next_due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id)
);

-- Enable RLS on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_balances ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public access (sesuai kebutuhan kos-kosan)
-- Tenants policies
CREATE POLICY "Allow public read access on tenants" ON public.tenants FOR SELECT USING (true);
CREATE POLICY "Allow public insert on tenants" ON public.tenants FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on tenants" ON public.tenants FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on tenants" ON public.tenants FOR DELETE USING (true);

-- Payments policies
CREATE POLICY "Allow public read access on payments" ON public.payments FOR SELECT USING (true);
CREATE POLICY "Allow public insert on payments" ON public.payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on payments" ON public.payments FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on payments" ON public.payments FOR DELETE USING (true);

-- Tenant balances policies
CREATE POLICY "Allow public read access on tenant_balances" ON public.tenant_balances FOR SELECT USING (true);
CREATE POLICY "Allow public insert on tenant_balances" ON public.tenant_balances FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on tenant_balances" ON public.tenant_balances FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on tenant_balances" ON public.tenant_balances FOR DELETE USING (true);

-- Create function to calculate outstanding balance
CREATE OR REPLACE FUNCTION calculate_outstanding_balance(tenant_id UUID, target_date DATE DEFAULT CURRENT_DATE)
RETURNS DECIMAL(12,2) AS $$
DECLARE
  checkin_date DATE;
  monthly_rent DECIMAL(12,2);
  months_passed INTEGER;
  total_should_paid DECIMAL(12,2);
  total_paid DECIMAL(12,2);
  outstanding DECIMAL(12,2);
BEGIN
  -- Get tenant info
  SELECT t.checkin_date, t.monthly_rent 
  INTO checkin_date, monthly_rent
  FROM public.tenants t 
  WHERE t.id = tenant_id;
  
  IF checkin_date IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Calculate months passed since checkin
  months_passed := EXTRACT(YEAR FROM AGE(target_date, checkin_date)) * 12 + 
                   EXTRACT(MONTH FROM AGE(target_date, checkin_date));
  
  -- If less than 1 month, no outstanding
  IF months_passed < 1 THEN
    RETURN 0;
  END IF;
  
  -- Calculate total that should be paid
  total_should_paid := monthly_rent * months_passed;
  
  -- Calculate total actually paid
  SELECT COALESCE(SUM(payment_amount), 0)
  INTO total_paid
  FROM public.payments p
  WHERE p.tenant_id = calculate_outstanding_balance.tenant_id;
  
  -- Calculate outstanding
  outstanding := total_should_paid - total_paid;
  
  RETURN GREATEST(outstanding, 0);
END;
$$ LANGUAGE plpgsql;

-- Create function to update tenant balance
CREATE OR REPLACE FUNCTION update_tenant_balance(tenant_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.tenant_balances (tenant_id, current_balance, last_payment_date, next_due_date)
  VALUES (
    tenant_id,
    calculate_outstanding_balance(tenant_id),
    (SELECT MAX(payment_date) FROM public.payments WHERE payments.tenant_id = update_tenant_balance.tenant_id),
    (SELECT checkin_date + INTERVAL '1 month' * (EXTRACT(YEAR FROM AGE(CURRENT_DATE, checkin_date)) * 12 + EXTRACT(MONTH FROM AGE(CURRENT_DATE, checkin_date)) + 1) 
     FROM public.tenants WHERE id = tenant_id)
  )
  ON CONFLICT (tenant_id) 
  DO UPDATE SET
    current_balance = calculate_outstanding_balance(tenant_id),
    last_payment_date = (SELECT MAX(payment_date) FROM public.payments WHERE payments.tenant_id = update_tenant_balance.tenant_id),
    next_due_date = (SELECT checkin_date + INTERVAL '1 month' * (EXTRACT(YEAR FROM AGE(CURRENT_DATE, checkin_date)) * 12 + EXTRACT(MONTH FROM AGE(CURRENT_DATE, checkin_date)) + 1) 
                     FROM public.tenants WHERE id = tenant_id),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update balance after payment
CREATE OR REPLACE FUNCTION trigger_update_tenant_balance()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_tenant_balance(NEW.tenant_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_payment_insert
  AFTER INSERT ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_tenant_balance();

CREATE TRIGGER after_payment_update
  AFTER UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_tenant_balance();
