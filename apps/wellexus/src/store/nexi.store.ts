import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { xpThreshold } from '../types';

interface NexiStore {
  xp: number;
  level: number;
  streak: number;
  lastActive: string | null;
  leveledUpJustNow: boolean;
  addXP: (amount: number) => void;
  setFromServer: (xp: number, level: number, streak: number, lastActive: string | null) => void;
  clearLevelUp: () => void;
}

export const useNexiStore = create<NexiStore>()(
  persist(
    (set, get) => ({
      xp: 0,
      level: 1,
      streak: 0,
      lastActive: null,
      leveledUpJustNow: false,

      addXP: (amount) => {
        const { xp, level } = get();
        const newXP = xp + amount;
        const threshold = xpThreshold(level);
        const didLevelUp = newXP >= threshold;
        set({
          xp: didLevelUp ? newXP - threshold : newXP,
          level: didLevelUp ? level + 1 : level,
          leveledUpJustNow: didLevelUp,
        });
      },

      setFromServer: (xp, level, streak, lastActive) =>
        set({ xp, level, streak, lastActive }),

      clearLevelUp: () => set({ leveledUpJustNow: false }),
    }),
    {
      name: 'wellexus-nexi',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
