
-- Fix the ambiguous tenant_id reference in database functions
DROP FUNCTION IF EXISTS calculate_outstanding_balance(UUID, DATE);
DROP FUNCTION IF EXISTS update_tenant_balance(UUID);

-- Recreate calculate_outstanding_balance function with proper parameter naming
CREATE OR REPLACE FUNCTION calculate_outstanding_balance(p_tenant_id UUID, target_date DATE DEFAULT CURRENT_DATE)
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
  WHERE t.id = p_tenant_id;
  
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
  SELECT COALESCE(SUM(p.payment_amount), 0)
  INTO total_paid
  FROM public.payments p
  WHERE p.tenant_id = p_tenant_id;
  
  -- Calculate outstanding
  outstanding := total_should_paid - total_paid;
  
  RETURN GREATEST(outstanding, 0);
END;
$$ LANGUAGE plpgsql;

-- Recreate update_tenant_balance function with proper parameter naming
CREATE OR REPLACE FUNCTION update_tenant_balance(p_tenant_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.tenant_balances (tenant_id, current_balance, last_payment_date, next_due_date)
  VALUES (
    p_tenant_id,
    calculate_outstanding_balance(p_tenant_id),
    (SELECT MAX(p.payment_date) FROM public.payments p WHERE p.tenant_id = p_tenant_id),
    (SELECT t.checkin_date + INTERVAL '1 month' * (EXTRACT(YEAR FROM AGE(CURRENT_DATE, t.checkin_date)) * 12 + EXTRACT(MONTH FROM AGE(CURRENT_DATE, t.checkin_date)) + 1) 
     FROM public.tenants t WHERE t.id = p_tenant_id)
  )
  ON CONFLICT (tenant_id) 
  DO UPDATE SET
    current_balance = calculate_outstanding_balance(p_tenant_id),
    last_payment_date = (SELECT MAX(p.payment_date) FROM public.payments p WHERE p.tenant_id = p_tenant_id),
    next_due_date = (SELECT t.checkin_date + INTERVAL '1 month' * (EXTRACT(YEAR FROM AGE(CURRENT_DATE, t.checkin_date)) * 12 + EXTRACT(MONTH FROM AGE(CURRENT_DATE, t.checkin_date)) + 1) 
                     FROM public.tenants t WHERE t.id = p_tenant_id),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
