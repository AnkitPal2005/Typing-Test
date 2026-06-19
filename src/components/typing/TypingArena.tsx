'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTypingStore } from '@/stores/typingStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAudio } from '@/hooks/useAudio';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function TypingArena() {
  const {
    words,
    currentWordIndex,
    currentLetterIndex,
    duration,
    timeLeft,
    difficulty,
    isStarted,
    isPaused,
    isCompleted,
    correctChars,
    totalKeystrokes,
    mistakesCount,
    wpmHistory,
    secHistory,
    setWords,
    setDuration,
    setDifficulty,
    startTest,
    tick,
    pauseTest,
    resumeTest,
    resetTest,
    recordKeystroke,
    recordBackspace,
    nextWord,
    completeTest,
  } = useTypingStore();

  const { theme, cursorBlink, liveWpm, fontSize } = useSettingsStore();
  const { playClick, playComplete } = useAudio();

  const [inputVal, setInputVal] = useState('');
  const [testId, setTestId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const caretRef = useRef<HTMLDivElement>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch words based on difficulty
  const fetchWords = async () => {
    try {
      const res = await fetch(`/api/words?difficulty=${difficulty}&count=150`);
      const data = await res.json();
      setWords(data);
      resetTest();
      setInputVal('');
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchWords();
  }, [difficulty]);

  // Focus input automatically on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Time counting effect
  useEffect(() => {
    if (isStarted && !isPaused && !isCompleted) {
      timerIntervalRef.current = setInterval(() => {
        tick();
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isStarted, isPaused, isCompleted]);

  // Caret placing logic
  useEffect(() => {
    if (isCompleted) return;
    const currentWordEl = containerRef.current?.querySelector('.word-active');
    if (!currentWordEl) return;

    const letters = currentWordEl.querySelectorAll('.letter-item');
    if (currentLetterIndex < letters.length) {
      const letter = letters[currentLetterIndex] as HTMLElement;
      if (caretRef.current) {
        caretRef.current.style.left = `${letter.offsetLeft}px`;
        caretRef.current.style.top = `${letter.offsetTop + 4}px`;
        caretRef.current.style.width = `2px`;
      }
    } else {
      const lastLetter = letters[letters.length - 1] as HTMLElement;
      if (lastLetter && caretRef.current) {
        caretRef.current.style.left = `${lastLetter.offsetLeft + lastLetter.offsetWidth}px`;
        caretRef.current.style.top = `${lastLetter.offsetTop + 4}px`;
      }
    }
  }, [currentWordIndex, currentLetterIndex, inputVal, isCompleted]);

  // Handle completion database save
  useEffect(() => {
    if (isCompleted) {
      playComplete();
      const elapsed = duration - timeLeft;
      const finalWpm = elapsed > 0 ? (correctChars / 5) / (elapsed / 60) : 0;
      const accuracy = totalKeystrokes > 0 ? (correctChars / totalKeystrokes) * 100 : 100;

      fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wpm: finalWpm,
          accuracy,
          duration,
          mistakes: mistakesCount,
          difficulty,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.testId) {
            setTestId(data.testId);
          }
        })
        .catch(console.error);
    }
  }, [isCompleted]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isCompleted || isPaused) return;

    if (!isStarted) {
      startTest();
    }

    const val = e.target.value;
    setInputVal(val);

    // If space pressed, jump to next word
    if (val.endsWith(' ')) {
      nextWord();
      setInputVal('');
      playClick();
      return;
    }

    const expectedWord = words[currentWordIndex];
    if (!expectedWord) return;

    const charIndex = val.length - 1;
    const typed = val[charIndex];
    const expected = expectedWord[charIndex];

    if (typed) {
      recordKeystroke(expected, typed);
      playClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const currentWordEl = containerRef.current?.querySelector('.word-active');
      const letters = currentWordEl?.querySelectorAll('.letter-item');
      if (!letters || currentLetterIndex === 0) return;

      const prevLetter = letters[currentLetterIndex - 1];
      let status: 'correct' | 'incorrect' | 'none' = 'none';
      if (prevLetter?.classList.contains('text-correct')) status = 'correct';
      if (prevLetter?.classList.contains('text-error')) status = 'incorrect';

      recordBackspace(status);
      playClick();
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      if (isPaused) resumeTest();
      else pauseTest();
    }
  };

  // Keyboard shortcut listener for Tab
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        fetchWords();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [difficulty]);

  const handleRestart = () => {
    fetchWords();
  };

  const elapsed = duration - timeLeft;
  const liveWpmVal = elapsed > 0 ? (correctChars / 5) / (elapsed / 60) : 0;
  const liveAccVal = totalKeystrokes > 0 ? (correctChars / totalKeystrokes) * 100 : 100;

  // Chart config
  const chartData = {
    labels: secHistory,
    datasets: [
      {
        label: 'WPM',
        data: wpmHistory,
        borderColor: 'var(--main-color)',
        backgroundColor: 'rgba(226, 183, 20, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const fontSizeClass =
    fontSize === 'small' ? 'text-lg' : fontSize === 'large' ? 'text-3xl' : 'text-2xl';

  return (
    <div className="w-full">
      {!isCompleted ? (
        <div className="max-w-4xl mx-auto">
          {/* Settings / Config selectors */}
          {!isStarted && (
            <div className="flex justify-center gap-6 bg-[var(--sub-alt-color)] px-6 py-3 rounded-lg text-sm mb-6 transition-all duration-300">
              <div className="flex items-center gap-3">
                <span className="text-[var(--sub-color)] font-medium">mode:</span>
                {(['easy', 'medium', 'hard', 'numbers', 'punctuation'] as const).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className={`cursor-pointer px-2 py-1 rounded transition-colors ${
                      difficulty === diff ? 'text-[var(--main-color)] font-bold' : 'text-[var(--sub-color)] hover:text-[var(--text-color)]'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
              <div className="w-[1px] bg-[var(--sub-color)] opacity-20"></div>
              <div className="flex items-center gap-3">
                <span className="text-[var(--sub-color)] font-medium">time:</span>
                {[15, 30, 60, 120].map((t) => (
                  <button
                    key={t}
                    onClick={() => setDuration(t)}
                    className={`cursor-pointer px-2 py-1 rounded transition-colors ${
                      duration === t ? 'text-[var(--main-color)] font-bold' : 'text-[var(--sub-color)] hover:text-[var(--text-color)]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Live Stats */}
          <div className="flex justify-between items-center mb-6 font-sans text-xl font-semibold text-[var(--main-color)]">
            <div className="text-3xl font-bold">{timeLeft}</div>
            {liveWpm && (
              <div className="flex gap-6 text-sm md:text-lg">
                <div>wpm: <span className="font-bold">{Math.round(liveWpmVal)}</span></div>
                <div>acc: <span className="font-bold">{Math.round(liveAccVal)}%</span></div>
                <div>mistakes: <span className="text-[var(--error-color)] font-bold">{mistakesCount}</span></div>
              </div>
            )}
          </div>

          {/* Typing Area */}
          <div
            onClick={() => inputRef.current?.focus()}
            className="relative border border-[var(--sub-alt-color)] rounded-xl p-6 bg-[var(--bg-color)] bg-opacity-20 cursor-text min-h-[140px] overflow-hidden"
          >
            {/* Blinking/Static Caret */}
            <div
              ref={caretRef}
              className={`absolute h-7 bg-[var(--caret-color)] transition-all duration-100 ${
                cursorBlink && !isPaused ? 'caret-blink' : ''
              }`}
              style={{ left: 0, top: 0, width: '2px' }}
            ></div>

            <div
              ref={containerRef}
              className={`flex flex-wrap mono-font ${fontSizeClass} leading-relaxed select-none`}
            >
              {words.map((word, wIdx) => {
                const isActive = wIdx === currentWordIndex;
                return (
                  <div
                    key={wIdx}
                    className={`mr-3 mb-2 flex transition-all ${
                      isActive ? 'word-active text-[var(--text-color)]' : 'text-[var(--sub-color)]'
                    }`}
                  >
                    {word.split('').map((char, cIdx) => {
                      let colorClass = '';
                      if (wIdx < currentWordIndex) {
                        colorClass = 'text-[var(--correct-color)]';
                      } else if (isActive) {
                        if (cIdx < currentLetterIndex) {
                          const typedChar = inputVal[cIdx];
                          colorClass =
                            typedChar === char
                              ? 'text-[var(--correct-color)]'
                              : 'text-[var(--error-color)] border-b border-[var(--error-color)]';
                        }
                      }

                      return (
                        <span
                          key={cIdx}
                          className={`letter-item ${colorClass}`}
                        >
                          {char}
                        </span>
                      );
                    })}

                    {/* Show extra typed letters */}
                    {isActive && inputVal.length > word.length && (
                      <>
                        {inputVal.slice(word.length).split('').map((char, index) => (
                          <span
                            key={index}
                            className="letter-item text-[var(--error-extra-color)] border-b border-[var(--error-color)]"
                          >
                            {char}
                          </span>
                        ))}
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Hidden inputs to capture key logs */}
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              className="absolute opacity-0 pointer-events-none"
              autoComplete="off"
            />
          </div>

          <div className="flex justify-center gap-4 mt-6">
            {isStarted && (
              <button
                onClick={() => (isPaused ? resumeTest() : pauseTest())}
                className="cursor-pointer px-6 py-2 rounded-lg bg-[var(--sub-alt-color)] text-[var(--text-color)] border border-[var(--sub-color)] border-opacity-20 hover:bg-[var(--main-color)] hover:text-[var(--bg-color)] hover:border-[var(--main-color)] transition-all"
              >
                {isPaused ? 'Resume (Esc)' : 'Pause (Esc)'}
              </button>
            )}
            <button
              onClick={handleRestart}
              className="cursor-pointer px-6 py-2 rounded-lg bg-[var(--sub-alt-color)] text-[var(--text-color)] border border-[var(--sub-color)] border-opacity-20 hover:bg-[var(--main-color)] hover:text-[var(--bg-color)] hover:border-[var(--main-color)] transition-all"
            >
              Restart (Tab)
            </button>
          </div>
        </div>
      ) : (
        /* Results screen */
        <div className="max-w-3xl mx-auto bg-[var(--sub-alt-color)] border border-[var(--sub-color)] border-opacity-10 rounded-xl p-8 text-center shadow-xl">
          <h2 className="text-[var(--main-color)] text-3xl font-sans font-bold mb-6">Test Results</h2>
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-[var(--bg-color)] bg-opacity-40 p-6 rounded-xl">
              <div className="text-4xl md:text-5xl font-sans font-extrabold text-[var(--main-color)]">
                {Math.round(liveWpmVal)}
              </div>
              <div className="text-[var(--sub-color)] text-xs uppercase tracking-wider mt-2 font-medium">WPM</div>
            </div>
            <div className="bg-[var(--bg-color)] bg-opacity-40 p-6 rounded-xl">
              <div className="text-4xl md:text-5xl font-sans font-extrabold text-[var(--main-color)]">
                {Math.round(liveAccVal)}%
              </div>
              <div className="text-[var(--sub-color)] text-xs uppercase tracking-wider mt-2 font-medium">Accuracy</div>
            </div>
            <div className="bg-[var(--bg-color)] bg-opacity-40 p-6 rounded-xl">
              <div className="text-4xl md:text-5xl font-sans font-extrabold text-[var(--main-color)]">
                {mistakesCount}
              </div>
              <div className="text-[var(--sub-color)] text-xs uppercase tracking-wider mt-2 font-medium">Mistakes</div>
            </div>
          </div>

          {/* Export buttons */}
          {testId && (
            <div className="flex justify-center gap-4 mb-8">
              <a
                href={`/api/tests/export?id=${testId}&format=pdf`}
                className="cursor-pointer px-5 py-2 rounded-lg bg-[var(--main-color)] text-[var(--bg-color)] font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                Download PDF Certificate
              </a>
              <a
                href={`/api/tests/export?id=${testId}&format=csv`}
                className="cursor-pointer px-5 py-2 rounded-lg border border-[var(--main-color)] text-[var(--main-color)] font-semibold text-sm hover:bg-[var(--main-color)] hover:text-[var(--bg-color)] transition-all"
              >
                Export CSV
              </a>
            </div>
          )}

          {/* Chart display */}
          <div className="mb-6 bg-[var(--bg-color)] bg-opacity-40 p-4 rounded-xl">
            <Line
              data={chartData}
              options={{
                responsive: true,
                scales: {
                  x: { grid: { display: false } },
                  y: { grid: { color: 'rgba(255,255,255,0.05)' } },
                },
              }}
            />
          </div>

          <button
            onClick={handleRestart}
            className="cursor-pointer px-8 py-3 rounded-xl bg-[var(--main-color)] text-[var(--bg-color)] text-lg font-bold hover:opacity-95 transition-opacity"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
