'use client';

import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { useAudio } from '@/hooks/useAudio';

interface Player {
  id: string;
  username: string;
  typedCount: number;
  wpm: number;
  accuracy: number;
  isFinished: boolean;
}

export default function RacePage() {
  const { data: session } = useSession();
  const { playClick, playComplete } = useAudio();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [joinRoomCode, setJoinRoomCode] = useState('');
  
  const [inLobby, setInLobby] = useState(false);
  const [isRaceActive, setIsRaceActive] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [winner, setWinner] = useState<string | null>(null);

  // Lobbies & Words states
  const [players, setPlayers] = useState<Player[]>([]);
  const [words, setWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [inputVal, setInputVal] = useState('');

  // Local progress tracking
  const [correctChars, setCorrectChars] = useState(0);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const startTimeRef = useRef<Date | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const caretRef = useRef<HTMLDivElement>(null);

  // Sync username from session
  useEffect(() => {
    if (session?.user?.name) {
      setUsername(session.user.name);
    }
  }, [session]);

  // Socket init
  useEffect(() => {
    const socketInstance = io({
      autoConnect: false,
    });

    socketInstance.connect();

    socketInstance.on('room-created', ({ roomId, words }) => {
      setRoomId(roomId);
      setWords(words);
      setInLobby(true);
    });

    socketInstance.on('room-joined', ({ roomId, words }) => {
      setRoomId(roomId);
      setWords(words);
      setInLobby(true);
    });

    socketInstance.on('update-players', (updatedPlayers: Player[]) => {
      setPlayers(updatedPlayers);
    });

    socketInstance.on('race-starting', () => {
      setIsRaceActive(true);
      setWinner(null);
      setCurrentWordIndex(0);
      setCurrentLetterIndex(0);
      setInputVal('');
      setCorrectChars(0);
      setTotalKeystrokes(0);
    });

    socketInstance.on('countdown', (seconds: number) => {
      setCountdown(seconds);
    });

    socketInstance.on('race-started', () => {
      setCountdown(null);
      startTimeRef.current = new Date();
      if (inputRef.current) {
        inputRef.current.disabled = false;
        inputRef.current.focus();
      }
    });

    socketInstance.on('race-finished', (winnerName: string) => {
      setWinner(winnerName);
      playComplete();
      if (inputRef.current) inputRef.current.disabled = true;
    });

    socketInstance.on('error-msg', (msg: string) => {
      alert(msg);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Update caretaker position
  useEffect(() => {
    if (!isRaceActive || winner) return;
    const currentWordEl = containerRef.current?.querySelector('.word-active');
    if (!currentWordEl) return;

    const letters = currentWordEl.querySelectorAll('.letter-item');
    if (currentLetterIndex < letters.length) {
      const letter = letters[currentLetterIndex] as HTMLElement;
      if (caretRef.current) {
        caretRef.current.style.left = `${letter.offsetLeft}px`;
        caretRef.current.style.top = `${letter.offsetTop + 4}px`;
      }
    } else {
      const lastLetter = letters[letters.length - 1] as HTMLElement;
      if (lastLetter && caretRef.current) {
        caretRef.current.style.left = `${lastLetter.offsetLeft + lastLetter.offsetWidth}px`;
        caretRef.current.style.top = `${lastLetter.offsetTop + 4}px`;
      }
    }
  }, [currentWordIndex, currentLetterIndex, inputVal, isRaceActive, winner]);

  const handleCreateRoom = () => {
    if (!username) return alert('Please enter a username.');
    // Generate initial word list
    fetch('/api/words?difficulty=easy&count=40')
      .then((res) => res.json())
      .then((wordsList) => {
        socket?.emit('create-room', { username, words: wordsList });
      });
  };

  const handleJoinRoom = () => {
    if (!username || !joinRoomCode) return alert('Enter name and room code.');
    socket?.emit('join-room', { roomId: joinRoomCode.toUpperCase(), username });
  };

  const handleStartRace = () => {
    socket?.emit('start-race', { roomId });
  };

  const sendProgressUpdate = (typedCharCount: number, correctCount: number, strokes: number) => {
    if (!startTimeRef.current) return;
    const elapsed = (new Date().getTime() - startTimeRef.current.getTime()) / 1000;
    const wpm = elapsed > 0 ? (correctCount / 5) / (elapsed / 60) : 0;
    const accuracy = strokes > 0 ? (correctCount / strokes) * 100 : 100;

    socket?.emit('update-progress', {
      roomId,
      typedCount: typedCharCount,
      wpm,
      accuracy,
    });
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isRaceActive || winner) return;

    const val = e.target.value;
    setInputVal(val);

    if (val.endsWith(' ')) {
      // Space typed: complete current word
      const completedWordCharCount = words.slice(0, currentWordIndex + 1).join(' ').length + 1;
      
      setCurrentWordIndex((prev) => prev + 1);
      setCurrentLetterIndex(0);
      setInputVal('');
      
      setTotalKeystrokes((prev) => prev + 1); // Count space bar
      sendProgressUpdate(completedWordCharCount, correctChars, totalKeystrokes + 1);
      playClick();
      return;
    }

    const expectedWord = words[currentWordIndex];
    if (!expectedWord) return;

    const charIndex = val.length - 1;
    const typed = val[charIndex];
    const expected = expectedWord[charIndex];

    if (typed) {
      const isCorrect = expected === typed;
      const newCorrect = correctChars + (isCorrect ? 1 : 0);
      const newStrokes = totalKeystrokes + 1;

      setCorrectChars(newCorrect);
      setTotalKeystrokes(newStrokes);
      setCurrentLetterIndex((prev) => prev + 1);

      const currentTypedIndex = words.slice(0, currentWordIndex).join(' ').length + (currentWordIndex > 0 ? 1 : 0) + val.length;
      sendProgressUpdate(currentTypedIndex, newCorrect, newStrokes);
      playClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const currentWordEl = containerRef.current?.querySelector('.word-active');
      const letters = currentWordEl?.querySelectorAll('.letter-item');
      if (!letters || currentLetterIndex === 0) return;

      const prevLetter = letters[currentLetterIndex - 1];
      const isCorrect = prevLetter?.classList.contains('text-[var(--correct-color)]');

      setCorrectChars((prev) => Math.max(0, prev - (isCorrect ? 1 : 0)));
      setCurrentLetterIndex((prev) => prev - 1);
      playClick();
    }
  };

  const totalWordsChars = words.join(' ').length || 100;

  return (
    <div className="max-w-3xl mx-auto">
      {!inLobby ? (
        // Setup Room Screen
        <div className="bg-[var(--sub-alt-color)] border border-[var(--sub-color)] border-opacity-10 rounded-xl p-8 text-white shadow-lg">
          <h2 className="text-[var(--main-color)] text-2xl font-bold mb-6">
            <i className="fa-solid fa-bolt"></i> Multiplayer Race Track
          </h2>
          <p className="text-[var(--sub-color)] text-sm mb-6">Create a room to invite friends, or join an active room code.</p>

          <div className="mb-6">
            <label className="block text-xs uppercase tracking-wider text-[var(--sub-color)] font-semibold mb-2">Your Display Name</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[var(--bg-color)] border border-[var(--sub-color)] border-opacity-25 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[var(--main-color)]"
              placeholder="e.g. TyperPro"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleCreateRoom}
              className="cursor-pointer bg-[var(--main-color)] text-[var(--bg-color)] font-bold py-3 rounded-lg hover:opacity-90 transition-opacity"
            >
              Create New Room
            </button>
            <div className="flex gap-2">
              <input
                type="text"
                value={joinRoomCode}
                onChange={(e) => setJoinRoomCode(e.target.value)}
                className="flex-grow bg-[var(--bg-color)] border border-[var(--sub-color)] border-opacity-25 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[var(--main-color)] uppercase"
                placeholder="Room Code"
              />
              <button
                onClick={handleJoinRoom}
                className="cursor-pointer border border-[var(--main-color)] text-[var(--main-color)] font-bold px-6 py-2 rounded-lg hover:bg-[var(--main-color)] hover:text-[var(--bg-color)] transition-all"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Active Lobby / Race
        <div className="flex flex-col gap-6">
          {/* Lobbies Info */}
          {!isRaceActive && (
            <div className="bg-[var(--sub-alt-color)] border border-[var(--sub-color)] border-opacity-10 p-6 rounded-xl text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-[var(--main-color)] mb-1">Waiting Lobby</h3>
                <p className="text-xs text-[var(--sub-color)]">Waiting for players to join before starting...</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-[var(--sub-color)] uppercase tracking-wider font-semibold">Room Code</div>
                <div className="text-2xl font-black text-[var(--main-color)]">{roomId}</div>
              </div>
            </div>
          )}

          {/* Player Progress Bars */}
          <div className="bg-[var(--sub-alt-color)] border border-[var(--sub-color)] border-opacity-10 p-6 rounded-xl text-white">
            <h3 className="text-[var(--main-color)] font-bold mb-4 flex items-center gap-2">
              <i className="fa-solid fa-road"></i> Live Race Tracks
            </h3>
            <div className="flex flex-col gap-4">
              {players.map((player) => {
                const percent = Math.min((player.typedCount / totalWordsChars) * 100, 100);
                return (
                  <div key={player.id} className="relative">
                    <div className="flex justify-between text-xs text-[var(--sub-color)] mb-1">
                      <span>{player.username} {player.isFinished ? '🏁' : ''}</span>
                      <span>WPM: {Math.round(player.wpm)} | ACC: {Math.round(player.accuracy)}%</span>
                    </div>
                    <div className="h-6 bg-[var(--bg-color)] rounded-lg overflow-hidden relative">
                      <div
                        className="h-full bg-[var(--main-color)] transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      ></div>
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold mix-blend-difference text-white">
                        {player.username}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {!isRaceActive && players.length > 0 && (
              <div className="text-center mt-6">
                <button
                  onClick={handleStartRace}
                  className="cursor-pointer bg-[var(--main-color)] text-[var(--bg-color)] font-bold px-10 py-3 rounded-lg hover:opacity-90 transition-opacity"
                >
                  Start Race!
                </button>
              </div>
            )}
          </div>

          {/* Typing box */}
          {isRaceActive && (
            <div className="flex flex-col gap-4">
              {countdown !== null && (
                <div className="text-center text-6xl font-bold text-[var(--main-color)] py-6">
                  {countdown === 0 ? 'GO!' : countdown}
                </div>
              )}

              {winner && (
                <div className="bg-[var(--main-color)] text-[var(--bg-color)] p-4 rounded-xl text-center text-xl font-bold">
                  🎉 Winner: {winner}!
                </div>
              )}

              <div
                onClick={() => {
                  if (!winner && countdown === null) inputRef.current?.focus();
                }}
                className="relative border border-[var(--sub-alt-color)] rounded-xl p-6 bg-[var(--bg-color)] bg-opacity-20 cursor-text min-h-[140px] overflow-hidden"
              >
                {/* Caret */}
                {!winner && countdown === null && (
                  <div
                    ref={caretRef}
                    className="absolute h-7 bg-[var(--caret-color)] transition-all duration-100 caret-blink"
                    style={{ left: 16, top: 28, width: '2px' }}
                  ></div>
                )}

                <div
                  ref={containerRef}
                  className="flex flex-wrap mono-font text-2xl leading-relaxed select-none text-white"
                >
                  {words.map((word, wIdx) => {
                    const isActive = wIdx === currentWordIndex;
                    return (
                      <div
                        key={wIdx}
                        className={`mr-3 mb-2 flex ${
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
                            <span key={cIdx} className="letter-item">
                              {char}
                            </span>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>

                <input
                  ref={inputRef}
                  type="text"
                  value={inputVal}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  className="absolute opacity-0 pointer-events-none"
                  autoComplete="off"
                  disabled
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
