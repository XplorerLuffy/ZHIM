import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, User } from '@supabase/supabase-js';

interface AuthStore {
  session: Session | null;
  user: User | null;
  hasOnboarded: boolean;
  setSession: (session: Session | null) => void;
  setHasOnboarded: (v: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      session: null,
      user: null,
      hasOnboarded: false,
      setSession: (session) => set({ session, user: session?.user ?? null }),
      setHasOnboarded: (v) => set({ hasOnboarded: v }),
      clear: () => set({ session: null, user: null }),
    }),
    {
      name: 'wellexus-auth',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist hasOnboarded — Supabase manages its own session storage
      partialize: (state) => ({ hasOnboarded: state.hasOnboarded }),
    }
  )
);
