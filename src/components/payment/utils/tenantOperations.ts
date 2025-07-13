
import { supabase } from "@/integrations/supabase/client";
import { Tenant } from "@/lib/supabaseTypes";

export const fetchTenants = async (): Promise<Tenant[]> => {
  try {
    console.log('Fetching tenants...');
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .order('room_number');

    if (error) {
      console.error('Error fetching tenants:', error);
      throw error;
    }
    
    console.log('Fetched tenants:', data);
    return data || [];
  } catch (error) {
    console.error('Error fetching tenants:', error);
    throw error;
  }
};

export const fetchTenantById = async (id: string): Promise<Tenant | null> => {
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching tenant:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching tenant:', error);
    throw error;
  }
};
