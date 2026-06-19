import { create } from 'zustand';

interface TypingState {
  words: string[];
  currentWordIndex: number;
  currentLetterIndex: number;
  duration: number; // 15, 30, 60, 120
  timeLeft: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'numbers' | 'punctuation';
  isStarted: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  correctChars: number;
  incorrectChars: number;
  totalKeystrokes: number;
  mistakesCount: number;
  wpmHistory: number[];
  secHistory: number[];
  
  setWords: (words: string[]) => void;
  setDuration: (duration: number) => void;
  setDifficulty: (diff: 'easy' | 'medium' | 'hard' | 'numbers' | 'punctuation') => void;
  startTest: () => void;
  tick: () => void;
  pauseTest: () => void;
  resumeTest: () => void;
  completeTest: () => void;
  resetTest: () => void;
  recordKeystroke: (expected: string, typed: string) => void;
  recordBackspace: (letterStatus: 'correct' | 'incorrect' | 'none') => void;
  nextWord: () => void;
}

export const useTypingStore = create<TypingState>((set, get) => ({
  words: [],
  currentWordIndex: 0,
  currentLetterIndex: 0,
  duration: 30,
  timeLeft: 30,
  difficulty: 'easy',
  isStarted: false,
  isPaused: false,
  isCompleted: false,
  correctChars: 0,
  incorrectChars: 0,
  totalKeystrokes: 0,
  mistakesCount: 0,
  wpmHistory: [],
  secHistory: [],

  setWords: (words) => set({ words }),
  setDuration: (duration) => set({ duration, timeLeft: duration }),
  setDifficulty: (difficulty) => set({ difficulty }),
  
  startTest: () => set({ isStarted: true, isPaused: false, isCompleted: false }),
  
  tick: () => {
    const { timeLeft, duration, correctChars } = get();
    if (timeLeft <= 1) {
      get().completeTest();
    } else {
      const newTimeLeft = timeLeft - 1;
      const elapsed = duration - newTimeLeft;
      const wpm = elapsed > 0 ? (correctChars / 5) / (elapsed / 60) : 0;
      set((state) => ({
        timeLeft: newTimeLeft,
        wpmHistory: [...state.wpmHistory, Math.round(wpm)],
        secHistory: [...state.secHistory, elapsed],
      }));
    }
  },

  pauseTest: () => set({ isPaused: true }),
  resumeTest: () => set({ isPaused: false }),
  completeTest: () => set({ isCompleted: true, timeLeft: 0 }),
  
  resetTest: () => set((state) => ({
    currentWordIndex: 0,
    currentLetterIndex: 0,
    timeLeft: state.duration,
    isStarted: false,
    isPaused: false,
    isCompleted: false,
    correctChars: 0,
    incorrectChars: 0,
    totalKeystrokes: 0,
    mistakesCount: 0,
    wpmHistory: [],
    secHistory: [],
  })),

  recordKeystroke: (expected, typed) => {
    set((state) => {
      const isCorrect = expected === typed;
      return {
        totalKeystrokes: state.totalKeystrokes + 1,
        correctChars: state.correctChars + (isCorrect ? 1 : 0),
        incorrectChars: state.incorrectChars + (isCorrect ? 0 : 1),
        mistakesCount: state.mistakesCount + (isCorrect ? 0 : 1),
        currentLetterIndex: state.currentLetterIndex + 1,
      };
    });
  },

  recordBackspace: (letterStatus) => {
    set((state) => {
      if (state.currentLetterIndex === 0) return {};
      return {
        currentLetterIndex: state.currentLetterIndex - 1,
        correctChars: state.correctChars - (letterStatus === 'correct' ? 1 : 0),
        incorrectChars: state.incorrectChars - (letterStatus === 'incorrect' ? 1 : 0),
      };
    });
  },

  nextWord: () => {
    set((state) => ({
      currentWordIndex: state.currentWordIndex + 1,
      currentLetterIndex: 0,
      totalKeystrokes: state.totalKeystrokes + 1, // Count space bar
    }));
  },
}));
