import { create } from 'zustand';

interface UserState {
  personalBestWpm: number;
  personalBestAccuracy: number;
  recentTests: any[];
  setPersonalBest: (wpm: number, accuracy: number) => void;
  setRecentTests: (tests: any[]) => void;
}

export const useUserStore = create<UserState>((set) => ({
  personalBestWpm: 0,
  personalBestAccuracy: 0,
  recentTests: [],
  setPersonalBest: (wpm, accuracy) => set({ personalBestWpm: wpm, personalBestAccuracy: accuracy }),
  setRecentTests: (recentTests) => set({ recentTests }),
}));
