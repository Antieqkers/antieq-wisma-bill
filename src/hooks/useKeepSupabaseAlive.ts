import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useKeepSupabaseAlive = () => {
  useEffect(() => {
    const keepAlive = async () => {
      try {
        // Simple query to keep the database connection alive
        await supabase.from('tenants').select('id').limit(1);
        console.log('Supabase keep-alive ping successful');
      } catch (error) {
        console.error('Supabase keep-alive ping failed:', error);
      }
    };

    // Initial ping
    keepAlive();

    // Set interval for every 30 minutes (30 * 60 * 1000 milliseconds)
    const interval = setInterval(keepAlive, 30 * 60 * 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);
};
