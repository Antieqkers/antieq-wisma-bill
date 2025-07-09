
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
