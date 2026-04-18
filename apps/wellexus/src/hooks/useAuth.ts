import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth.store';
import { useNexiStore } from '../store/nexi.store';

export function useAuthBootstrap() {
  const user = useAuthStore((s) => s.user);
  const setFromServer = useNexiStore((s) => s.setFromServer);

  useEffect(() => {
    if (!user) return;

    supabase
      .from('nexi_stats')
      .select('*')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setFromServer(data.xp, data.level, data.streak, data.last_active);
        }
      });
  }, [user?.id]);
}
