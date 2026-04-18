import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { usePlanStore } from '../store/plan.store';
import { useAuthStore } from '../store/auth.store';

export function useTodayPlan() {
  const user = useAuthStore((s) => s.user);
  const setActivePlan = usePlanStore((s) => s.setActivePlan);
  const today = new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: ['plan', user?.id, today],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;

      const plan = {
        ...data,
        completedMeal: false,
        completedWorkout: false,
        completedMindfulness: false,
      };
      setActivePlan(plan);
      return plan;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}
