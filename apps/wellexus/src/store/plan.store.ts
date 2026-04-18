import { create } from 'zustand';
import type { WellnessPlan } from '../types';

interface PlanStore {
  activePlan: WellnessPlan | null;
  isGenerating: boolean;
  setActivePlan: (plan: WellnessPlan) => void;
  setGenerating: (v: boolean) => void;
  markComplete: (activity: 'meal' | 'workout' | 'mindfulness') => void;
  clear: () => void;
}

export const usePlanStore = create<PlanStore>()((set, get) => ({
  activePlan: null,
  isGenerating: false,

  setActivePlan: (plan) => set({ activePlan: plan }),
  setGenerating: (v) => set({ isGenerating: v }),

  markComplete: (activity) => {
    const plan = get().activePlan;
    if (!plan) return;
    set({
      activePlan: {
        ...plan,
        completedMeal:        activity === 'meal'        ? true : plan.completedMeal,
        completedWorkout:     activity === 'workout'     ? true : plan.completedWorkout,
        completedMindfulness: activity === 'mindfulness' ? true : plan.completedMindfulness,
      },
    });
  },

  clear: () => set({ activePlan: null }),
}));
