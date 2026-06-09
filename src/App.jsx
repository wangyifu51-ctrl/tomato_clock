import React, { useState, useEffect, useRef } from 'react';

// ─── Constants ──────────────────────────────────────────────
const TIMES = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};
const POMODOROS_BEFORE_LONG_BREAK = 4;

const MODE_CONFIG = {
  focus: { label: '专注', color: '#FF3B30' },
  shortBreak: { label: '短休息', color: '#34C759' },
  longBreak: { label: '长休息', color: '#007AFF' },
};

const NOTIFICATION_MESSAGES = {
  focus: '专注时间到！休息一下吧 🌿',
  shortBreak: '休息结束，继续专注 🍅',
  longBreak: '长休息结束，开始新的循环 💪',
};

// ─── Audio (Web Audio chime) ─────────────────────────────────
function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;

    [880, 1318.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.25 - i * 0.08, now + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6 + i * 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.15);
      osc.stop(now + 0.8 + i * 0.2);
    });
  } catch { /* silently fail */ }
}

// ─── Circular Progress Component ────────────────────────────
const CircularProgress = React.memo(function CircularProgress({ remaining, total, color, isRunning, darkMode }) {
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? remaining / total : 1;
  const offset = circumference * (1 - progress);

  return (
    <div className="relative w-72 h-72 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 256 256">
        <circle
          cx="128" cy="128" r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className={`${darkMode ? 'text-white/10' : 'text-gray-200'}`}
        />
        <circle
          cx="128" cy="128" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-linear"
          style={{ filter: `drop-shadow(0 0 8px ${color}4D)` }}
        />
      </svg>
      <div className="flex flex-col items-center z-10">
        <div className={`text-6xl font-extralight tracking-[4px] tabular-nums ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {formatTime(remaining)}
        </div>
        <div className={`text-xs font-medium tracking-[2px] uppercase mt-1 ${darkMode ? 'text-white/50' : 'text-gray-400'}`}>
          {isRunning ? '剩余' : remaining === total ? '' : '暂停'}
        </div>
      </div>
    </div>
  );
});

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// ─── Main App ──────────────────────────────────────────────────
export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [mode, setMode] = useState('focus');
  const [status, setStatus] = useState('idle'); // idle | running | paused
  const [remaining, setRemaining] = useState(TIMES.focus);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);

  const intervalRef = useRef(null);

  // Ref-stable callbacks — refs bypass React.memo, so useCallback is unnecessary here.
  // tickRef calls onCompleteRef at runtime, always reading the latest values.
  const onCompleteRef = useRef(() => {});
  onCompleteRef.current = () => {
    playChime();
    if (window.electronAPI) {
      window.electronAPI.showNotification('🍅 番茄钟', NOTIFICATION_MESSAGES[mode]);
    }

    if (mode === 'focus') {
      setCompletedPomodoros((p) => p + 1);
      setCycleCount((c) => c + 1);
    }

    let nextMode = 'focus';
    if (mode === 'focus') {
      const nextCycle = cycleCount + 1;
      nextMode = nextCycle >= POMODOROS_BEFORE_LONG_BREAK ? 'longBreak' : 'shortBreak';
      if (nextMode === 'longBreak') setCycleCount(0);
    }

    setMode(nextMode);
    setRemaining(TIMES[nextMode]);
    setStatus('idle');

    // Auto-start next session after brief pause
    setTimeout(() => {
      setStatus('running');
      intervalRef.current = setInterval(() => tickRef.current(), 1000);
    }, 500);
  };

  const tickRef = useRef(() => {});
  tickRef.current = () => {
    setRemaining((prev) => {
      if (prev <= 1) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setTimeout(() => onCompleteRef.current(), 0);
        return 0;
      }
      return prev - 1;
    });
  };

  // ─── Timer controls ────────────────────────────────────
  const startTimer = () => {
    if (status === 'idle' || status === 'paused') {
      setStatus('running');
      intervalRef.current = setInterval(() => tickRef.current(), 1000);
    }
  };

  const pauseTimer = () => {
    if (status === 'running') {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setStatus('paused');
    }
  };

  const resetTimer = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setStatus('idle');
    setRemaining(TIMES[mode]);
  };

  // ─── Mode switch ───────────────────────────────────────
  const switchMode = (newMode) => {
    if (status === 'running') return;
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setMode(newMode);
    setStatus('idle');
    setRemaining(TIMES[newMode]);
  };

  // ─── Button handlers ───────────────────────────────────
  const handleMainButton = () => {
    if (status === 'running') pauseTimer();
    else startTimer();
  };

  const config = MODE_CONFIG[mode];
  const mainBtnLabel = status === 'running' ? '暂停' : status === 'paused' ? '继续' : '开始';

  // ─── Cleanup on unmount ─────────────────────────────────
  useEffect(() => {
    return () => { clearInterval(intervalRef.current); };
  }, []);

  // ─── Render ────────────────────────────────────────────
  return (
    <div className={`relative h-full w-full overflow-hidden transition-colors duration-700 ${darkMode ? 'bg-[#1a1a2e]' : 'bg-[#f5f5f7]'}`}>
      {/* Background gradient orbs */}
      <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-soft"
        style={{ background: config.color, animationDelay: '0s' }} />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-soft"
        style={{ background: config.color, animationDelay: '1s' }} />

      {/* Glass panel */}
      <div className={`absolute inset-[12px] rounded-apple overflow-hidden transition-all duration-700
        ${darkMode ? 'glass-dark' : 'glass-light'}`}
      >
        {/* Drag region - Title bar */}
        <div className="drag-region h-12 flex items-center justify-between px-5 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🍅</span>
            <span className={`text-sm font-semibold tracking-wider transition-colors duration-300 ${darkMode ? 'text-white/60' : 'text-black/40'}`}>
              POMODORO
            </span>
          </div>
          <div className="flex items-center gap-3 no-drag">
            {/* Dark/Light toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95
                ${darkMode ? 'bg-white/10 text-yellow-300' : 'bg-black/5 text-gray-600'}`}
            >
              <span className="text-base leading-none">{darkMode ? '☀️' : '🌙'}</span>
            </button>
            {/* Quit button */}
            <button
              onClick={() => window.electronAPI?.quitApp()}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95
                ${darkMode ? 'bg-white/5 text-white/30 hover:bg-red-500/30 hover:text-red-400' : 'bg-black/5 text-black/30 hover:bg-red-500/20 hover:text-red-500'}`}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mode tabs */}
        <div className="flex justify-center mt-2 animate-slide-up">
          <div className={`flex gap-1 p-1 rounded-apple-sm transition-colors duration-300
            ${darkMode ? 'bg-white/5' : 'bg-black/5'}`}>
            {Object.entries(MODE_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => switchMode(key)}
                disabled={status === 'running'}
                className={`px-5 py-2 rounded-xl text-sm font-medium transition-all duration-300
                  ${status === 'running' ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
                  ${mode === key
                    ? (darkMode ? 'bg-white/20 text-white shadow-lg' : 'bg-white/70 text-gray-900 shadow-md')
                    : (darkMode ? 'text-white/40 hover:text-white/70' : 'text-black/40 hover:text-black/70')}`}
              >
                {cfg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Timer */}
        <div className="flex-1 flex items-center justify-center mt-4 animate-scale-in">
          <CircularProgress
            remaining={remaining}
            total={TIMES[mode]}
            color={config.color}
            isRunning={status === 'running'}
            darkMode={darkMode}
          />
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 mt-6 animate-slide-up">
          <button
            onClick={handleMainButton}
            className={`no-drag px-10 py-3 rounded-apple-sm text-base font-semibold tracking-wide
              transition-all duration-300 hover:scale-105 active:scale-95
              ${status === 'running'
                ? (darkMode ? 'bg-white/15 text-white' : 'bg-black/10 text-gray-800')
                : 'bg-white/90 text-gray-900 shadow-lg shadow-black/10 hover:shadow-xl hover:bg-white'}`}
          >
            <span className="flex items-center gap-2">
              {status === 'running' ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <rect x="3" y="2" width="4" height="12" rx="1" />
                  <rect x="9" y="2" width="4" height="12" rx="1" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M4 2L14 8L4 14V2Z" />
                </svg>
              )}
              {mainBtnLabel}
            </span>
          </button>
          <button
            onClick={resetTimer}
            className={`no-drag px-8 py-3 rounded-apple-sm text-base font-medium
              transition-all duration-300 hover:scale-105 active:scale-95
              ${darkMode ? 'text-white/50 hover:text-white/80 bg-white/5 hover:bg-white/10' : 'text-black/40 hover:text-black/70 bg-black/5 hover:bg-black/10'}`}
          >
            重置
          </button>
        </div>

        {/* Stats */}
        <div className="text-center mt-6 mb-4 animate-fade-in">
          <span className={`text-xs font-medium tracking-wider transition-colors duration-300 ${darkMode ? 'text-white/30' : 'text-black/30'}`}>
            已完成 <span className="text-base font-bold" style={{ color: config.color }}>{completedPomodoros}</span> 个番茄
          </span>
        </div>
      </div>
    </div>
  );
}
