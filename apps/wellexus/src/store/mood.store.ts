import { create } from 'zustand';
import type { Mood } from '../types';

interface MoodStore {
  currentMood: Mood | null;
  currentIntensity: number;
  isLogging: boolean;
  lastLogDate: string | null;
  setMood: (mood: Mood) => void;
  setIntensity: (n: number) => void;
  setLogging: (v: boolean) => void;
  setLastLogDate: (d: string) => void;
}

export const useMoodStore = create<MoodStore>()((set) => ({
  currentMood: null,
  currentIntensity: 3,
  isLogging: false,
  lastLogDate: null,
  setMood: (mood) => set({ currentMood: mood }),
  setIntensity: (n) => set({ currentIntensity: n }),
  setLogging: (v) => set({ isLogging: v }),
  setLastLogDate: (d) => set({ lastLogDate: d }),
}));
