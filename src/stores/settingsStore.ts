import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeType = 'dark' | 'light' | 'matrix' | 'dracula' | 'hacker';

interface SettingsState {
  theme: ThemeType;
  soundEnabled: boolean;
  cursorBlink: boolean;
  liveWpm: boolean;
  fontSize: 'small' | 'medium' | 'large';
  setTheme: (theme: ThemeType) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setCursorBlink: (enabled: boolean) => void;
  setLiveWpm: (enabled: boolean) => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      soundEnabled: true,
      cursorBlink: true,
      liveWpm: true,
      fontSize: 'medium',
      setTheme: (theme) => {
        set({ theme });
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', theme);
        }
      },
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setCursorBlink: (cursorBlink) => set({ cursorBlink }),
      setLiveWpm: (liveWpm) => set({ liveWpm }),
      setFontSize: (fontSize) => set({ fontSize }),
    }),
    {
      name: 'wottacore-settings',
    }
  )
);
