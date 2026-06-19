'use client';

import React from 'react';
import { useSettingsStore, ThemeType } from '@/stores/settingsStore';

export function ThemeSelectorDot({ name, color }: { name: string; color: string }) {
  const currentTheme = useSettingsStore((state) => state.theme);
  const setTheme = useSettingsStore((state) => state.setTheme);

  return (
    <button
      onClick={() => setTheme(name as ThemeType)}
      className={`w-4 h-4 rounded-full border-2 cursor-pointer transition-all duration-200 ${
        currentTheme === name ? 'border-[var(--text-color)] scale-125' : 'border-transparent hover:scale-110'
      }`}
      style={{ backgroundColor: color }}
      title={name}
    />
  );
}
