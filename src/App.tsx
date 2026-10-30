/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus,
  Minus,
  RotateCcw,
  Trash2,
  Settings,
  PlusCircle,
  BarChart3,
  History,
  Sparkles,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Maximize2,
  Grid,
  Copy,
  Download,
  Edit3,
  Check,
  X,
  ChevronRight,
  Layers,
  Award,
  TrendingUp,
  Hash,
  Clock,
  Zap,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CounterItem {
  id: string;
  name: string;
  value: number;
  step: number;
  min: number | null;
  max: number | null;
  target: number | null;
  color: string;
  icon: string;
  createdAt: number;
}

interface HistoryLog {
  id: string;
  counterId: string;
  counterName: string;
  action: 'increment' | 'decrement' | 'set' | 'reset';
  delta: number;
  newValue: number;
  timestamp: number;
}

const DEFAULT_COUNTERS: CounterItem[] = [
  {
    id: 'c1',
    name: 'Daily Water Intake',
    value: 5,
    step: 1,
    min: 0,
    max: 12,
    target: 8,
    color: 'sky',
    icon: '💧',
    createdAt: Date.now() - 3600000 * 24
  },
  {
    id: 'c2',
    name: 'Push-ups Challenge',
    value: 45,
    step: 5,
    min: 0,
    max: null,
    target: 100,
    color: 'emerald',
    icon: '🔥',
    createdAt: Date.now() - 3600000 * 12
  },
  {
    id: 'c3',
    name: 'Coffee Cups',
    value: 2,
    step: 1,
    min: 0,
    max: 10,
    target: 4,
    color: 'amber',
    icon: '☕',
    createdAt: Date.now() - 3600000 * 4
  }
];

const COLOR_OPTIONS = [
  { name: 'Indigo', value: 'indigo', bg: 'bg-indigo-600', text: 'text-indigo-600', lightBg: 'bg-indigo-50 dark:bg-indigo-950/40', border: 'border-indigo-200 dark:border-indigo-800' },
  { name: 'Emerald', value: 'emerald', bg: 'bg-emerald-600', text: 'text-emerald-600', lightBg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800' },
  { name: 'Sky', value: 'sky', bg: 'bg-sky-600', text: 'text-sky-600', lightBg: 'bg-sky-50 dark:bg-sky-950/40', border: 'border-sky-200 dark:border-sky-800' },
  { name: 'Amber', value: 'amber', bg: 'bg-amber-600', text: 'text-amber-600', lightBg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-800' },
  { name: 'Rose', value: 'rose', bg: 'bg-rose-600', text: 'text-rose-600', lightBg: 'bg-rose-50 dark:bg-rose-950/40', border: 'border-rose-200 dark:border-rose-800' },
  { name: 'Violet', value: 'violet', bg: 'bg-violet-600', text: 'text-violet-600', lightBg: 'bg-violet-50 dark:bg-violet-950/40', border: 'border-violet-200 dark:border-violet-800' },
  { name: 'Cyan', value: 'cyan', bg: 'bg-cyan-600', text: 'text-cyan-600', lightBg: 'bg-cyan-50 dark:bg-cyan-950/40', border: 'border-cyan-200 dark:border-cyan-800' }
];

const EMOJI_OPTIONS = ['💧', '🔥', '☕', '⚡', '🎯', '📚', '⭐', '🏃', '💡', '🍎', '💰', '🧘', '💻', '🚀', '🧠', '🛠️'];

export default function App() {
  // State initialization from localStorage
  const [counters, setCounters] = useState<CounterItem[]>(() => {
    const saved = localStorage.getItem('omnicount_counters');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return DEFAULT_COUNTERS;
  });

  const [history, setHistory] = useState<HistoryLog[]>(() => {
    const saved = localStorage.getItem('omnicount_history');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  const [activeCounterId, setActiveCounterId] = useState<string>(() => counters[0]?.id || '');
  const [viewMode, setViewMode] = useState<'grid' | 'focus' | 'stats' | 'history'>('grid');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('omnicount_sound');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('omnicount_dark');
    if (saved !== null) return JSON.parse(saved);
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCounter, setEditingCounter] = useState<CounterItem | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Form state for create/edit counter
  const [formName, setFormName] = useState('');
  const [formValue, setFormValue] = useState('0');
  const [formStep, setFormStep] = useState('1');
  const [formMin, setFormMin] = useState<string>('');
  const [formMax, setFormMax] = useState<string>('');
  const [formTarget, setFormTarget] = useState<string>('');
  const [formColor, setFormColor] = useState('indigo');
  const [formIcon, setFormIcon] = useState('⚡');

  // Animation pop state for active count display
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('omnicount_counters', JSON.stringify(counters));
  }, [counters]);

  useEffect(() => {
    localStorage.setItem('omnicount_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('omnicount_sound', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('omnicount_dark', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Web Audio API Sound Synthesizer
  const playSound = useCallback((type: 'increment' | 'decrement' | 'reset' | 'goal') => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'increment') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'decrement') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'reset') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'goal') {
        // Joyful chord arpeggio
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.frequency.setValueAtTime(freq, now + idx * 0.08);
          g.gain.setValueAtTime(0.15, now + idx * 0.08);
          g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);
          o.start(now + idx * 0.08);
          o.stop(now + idx * 0.08 + 0.3);
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, [soundEnabled]);

  // Trigger confetti
  const triggerCelebration = useCallback(() => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Update counter value
  const updateCounterValue = useCallback((id: string, delta: number, actionType?: 'increment' | 'decrement' | 'set' | 'reset', specificValue?: number) => {
    setCounters(prev => prev.map(c => {
      if (c.id !== id) return c;

      let newValue: number;
      if (actionType === 'set' && specificValue !== undefined) {
        newValue = specificValue;
      } else if (actionType === 'reset') {
        newValue = 0;
      } else {
        newValue = c.value + delta;
      }

      // Apply Min / Max bounds
      if (c.min !== null && newValue < c.min) newValue = c.min;
      if (c.max !== null && newValue > c.max) newValue = c.max;

      const actualDelta = newValue - c.value;
      if (actualDelta !== 0 || actionType === 'reset' || actionType === 'set') {
        // Log history
        const act = actionType || (delta >= 0 ? 'increment' : 'decrement');
        const newLog: HistoryLog = {
          id: Math.random().toString(36).substring(2, 9),
          counterId: c.id,
          counterName: c.name,
          action: act,
          delta: actualDelta,
          newValue,
          timestamp: Date.now()
        };
        setHistory(h => [newLog, ...h.slice(0, 199)]); // Keep last 200 logs

        // Check if goal reached for the first time or crossed
        if (c.target !== null && c.value < c.target && newValue >= c.target) {
          playSound('goal');
          triggerCelebration();
        } else if (act === 'reset') {
          playSound('reset');
        } else if (actualDelta > 0) {
          playSound('increment');
        } else {
          playSound('decrement');
        }
      }

      setAnimatingId(id);
      setTimeout(() => setAnimatingId(null), 300);

      return { ...c, value: newValue };
    }));
  }, [playSound, triggerCelebration]);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (!activeCounterId) return;

      const activeC = counters.find(c => c.id === activeCounterId);
      if (!activeC) return;

      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        updateCounterValue(activeC.id, activeC.step, 'increment');
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        updateCounterValue(activeC.id, -activeC.step, 'decrement');
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        updateCounterValue(activeC.id, 0, 'reset');
      } else if (e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1;
        if (counters[index]) {
          setActiveCounterId(counters[index].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCounterId, counters, updateCounterValue]);

  // Open Create Modal
  const openCreateModal = () => {
    setEditingCounter(null);
    setFormName('');
    setFormValue('0');
    setFormStep('1');
    setFormMin('');
    setFormMax('');
    setFormTarget('');
    setFormColor('indigo');
    setFormIcon('⚡');
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (counter: CounterItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCounter(counter);
    setFormName(counter.name);
    setFormValue(counter.value.toString());
    setFormStep(counter.step.toString());
    setFormMin(counter.min !== null ? counter.min.toString() : '');
    setFormMax(counter.max !== null ? counter.max.toString() : '');
    setFormTarget(counter.target !== null ? counter.target.toString() : '');
    setFormColor(counter.color);
    setFormIcon(counter.icon);
    setIsCreateModalOpen(true);
  };

  // Save Counter (Create or Edit)
  const handleSaveCounter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const val = parseFloat(formValue) || 0;
    const stp = parseFloat(formStep) || 1;
    const mn = formMin !== '' ? parseFloat(formMin) : null;
    const mx = formMax !== '' ? parseFloat(formMax) : null;
    const tgt = formTarget !== '' ? parseFloat(formTarget) : null;

    if (editingCounter) {
      setCounters(prev => prev.map(c => c.id === editingCounter.id ? {
        ...c,
        name: formName.trim(),
        value: val,
        step: stp,
        min: mn,
        max: mx,
        target: tgt,
        color: formColor,
        icon: formIcon
      } : c));
    } else {
      const newCounter: CounterItem = {
        id: 'c_' + Math.random().toString(36).substring(2, 9),
        name: formName.trim(),
        value: val,
        step: stp,
        min: mn,
        max: mx,
        target: tgt,
        color: formColor,
        icon: formIcon,
        createdAt: Date.now()
      };
      setCounters(prev => [...prev, newCounter]);
      setActiveCounterId(newCounter.id);
    }

    setIsCreateModalOpen(false);
  };

  // Delete counter
  const handleDeleteCounter = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (counters.length <= 1) {
      alert("You must keep at least one counter.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this counter?")) {
      setCounters(prev => prev.filter(c => c.id !== id));
      if (activeCounterId === id) {
        const remaining = counters.filter(c => c.id !== id);
        if (remaining.length > 0) setActiveCounterId(remaining[0].id);
      }
    }
  };

  // Duplicate counter
  const handleDuplicateCounter = (counter: CounterItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const duplicated: CounterItem = {
      ...counter,
      id: 'c_' + Math.random().toString(36).substring(2, 9),
      name: `${counter.name} (Copy)`,
      createdAt: Date.now()
    };
    setCounters(prev => [...prev, duplicated]);
    setActiveCounterId(duplicated.id);
  };

  // Export history to CSV
  const exportHistoryCSV = () => {
    if (history.length === 0) {
      alert("No history records to export.");
      return;
    }
    const headers = ['Timestamp', 'Counter ID', 'Counter Name', 'Action', 'Delta', 'New Value'];
    const rows = history.map(h => [
      new Date(h.timestamp).toISOString(),
      h.counterId,
      `"${h.counterName.replace(/"/g, '""')}"`,
      h.action,
      h.delta,
      h.newValue
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `omnicount_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Statistics calculation
  const totalCountsSum = counters.reduce((acc, c) => acc + c.value, 0);
  const activeCounter = counters.find(c => c.id === activeCounterId) || counters[0];
  const totalActionsToday = history.filter(h => h.timestamp > Date.now() - 86400000).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navigation Bar adhering to Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        {/* Zone 1: Brand wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 font-bold text-lg">
            ⚡
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0">
            OmniCount Pro
          </span>
        </div>

        {/* Zone 2: Navigation links / View Switcher */}
        <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            Grid View
          </button>
          <button
            onClick={() => {
              if (counters.length > 0 && !activeCounterId) setActiveCounterId(counters[0].id);
              setViewMode('focus');
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              viewMode === 'focus'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Focus Mode
          </button>
          <button
            onClick={() => setViewMode('stats')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              viewMode === 'stats'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Analytics
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              viewMode === 'history'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            History Log
          </button>
        </nav>

        {/* Zone 3: Primary Actions (Sound, Theme, New Counter) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Mute Sound" : "Enable Sound"}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={openCreateModal}
            className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Counter
          </button>
        </div>
      </header>

      {/* Mobile Nav Switcher Bar */}
      <div className="md:hidden flex items-center justify-around p-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setViewMode('grid')}
          className={`flex-1 py-2 text-xs font-medium text-center rounded-lg ${viewMode === 'grid' ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-600 dark:text-slate-400'}`}
        >
          Grid
        </button>
        <button
          onClick={() => {
            if (counters.length > 0 && !activeCounterId) setActiveCounterId(counters[0].id);
            setViewMode('focus');
          }}
          className={`flex-1 py-2 text-xs font-medium text-center rounded-lg ${viewMode === 'focus' ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-600 dark:text-slate-400'}`}
        >
          Focus
        </button>
        <button
          onClick={() => setViewMode('stats')}
          className={`flex-1 py-2 text-xs font-medium text-center rounded-lg ${viewMode === 'stats' ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-600 dark:text-slate-400'}`}
        >
          Stats
        </button>
        <button
          onClick={() => setViewMode('history')}
          className={`flex-1 py-2 text-xs font-medium text-center rounded-lg ${viewMode === 'history' ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-600 dark:text-slate-400'}`}
        >
          History
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Quick Stats Summary Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Counters</p>
              <h3 className="text-2xl font-bold font-mono tabular-nums mt-1 text-slate-900 dark:text-white">{counters.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-semibold">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Cumulative Value</p>
              <h3 className="text-2xl font-bold font-mono tabular-nums mt-1 text-slate-900 dark:text-white">{totalCountsSum.toLocaleString()}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-semibold">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions (24h)</p>
              <h3 className="text-2xl font-bold font-mono tabular-nums mt-1 text-slate-900 dark:text-white">{totalActionsToday}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-semibold">
              <Zap className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* VIEW 1: GRID VIEW */}
        {viewMode === 'grid' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Your Counters</h2>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Tip: Click any counter card to enter Focus Mode
              </div>
            </div>

            {counters.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8">
                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-2xl mb-4">
                  ⚡
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No counters created yet</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Create your first counter to start tracking habits, scores, or tasks.</p>
                <button
                  onClick={openCreateModal}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-md transition-all inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Create First Counter
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {counters.map(counter => {
                  const colorObj = COLOR_OPTIONS.find(c => c.value === counter.color) || COLOR_OPTIONS[0];
                  const percentage = counter.target ? Math.min(Math.round((counter.value / counter.target) * 100), 100) : null;
                  const isAnimating = animatingId === counter.id;

                  return (
                    <div
                      key={counter.id}
                      onClick={() => {
                        setActiveCounterId(counter.id);
                        setViewMode('focus');
                      }}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                    >
                      {/* Top Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-2xl ${colorObj.lightBg} ${colorObj.text} flex items-center justify-center text-2xl shadow-inner`}>
                            {counter.icon}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {counter.name}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              Step: ±{counter.step} {counter.target ? `· Goal: ${counter.target}` : ''}
                            </p>
                          </div>
                        </div>

                        {/* Actions menu */}
                        <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => openEditModal(counter, e)}
                            title="Edit Counter"
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDuplicateCounter(counter, e)}
                            title="Duplicate"
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteCounter(counter.id, e)}
                            title="Delete"
                            className="p-1.5 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Value Display */}
                      <div className="py-4 text-center my-2">
                        <div className={`text-5xl font-extrabold font-mono tabular-nums tracking-tight text-slate-900 dark:text-white transition-transform duration-200 ${isAnimating ? 'scale-110 text-indigo-600 dark:text-indigo-400' : ''}`}>
                          {counter.value.toLocaleString()}
                        </div>
                        {percentage !== null && (
                          <div className="mt-3 flex items-center justify-center gap-2">
                            <div className="w-36 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${colorObj.bg} transition-all duration-300`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 font-mono">
                              {percentage}%
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Interactive Buttons */}
                      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => updateCounterValue(counter.id, -counter.step * 5)}
                          title="Subtract 5x Step"
                          className="py-2 px-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                        >
                          -{counter.step * 5}
                        </button>
                        <button
                          onClick={() => updateCounterValue(counter.id, -counter.step, 'decrement')}
                          title="Decrement"
                          className="py-2 px-1 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl transition-colors flex items-center justify-center"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateCounterValue(counter.id, counter.step, 'increment')}
                          title="Increment"
                          className={`py-2 px-1 ${colorObj.bg} hover:opacity-90 text-white text-sm font-bold rounded-xl shadow-sm transition-all flex items-center justify-center`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateCounterValue(counter.id, counter.step * 5)}
                          title="Add 5x Step"
                          className="py-2 px-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                        >
                          +{counter.step * 5}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: FOCUS MODE */}
        {viewMode === 'focus' && activeCounter && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Counter Selector Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {counters.map(c => {
                const isActive = c.id === activeCounter.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveCounterId(c.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{c.icon}</span>
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Main Focus Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-sm text-center relative overflow-hidden">
              <div className="absolute top-6 right-6 flex items-center gap-2">
                <button
                  onClick={(e) => openEditModal(activeCounter, e)}
                  className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Edit Counter"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => updateCounterValue(activeCounter.id, 0, 'reset')}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                  title="Reset to 0"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-semibold mb-6">
                <span>{activeCounter.icon}</span>
                <span>Focus Mode</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {activeCounter.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-8">
                Step size: ±{activeCounter.step} {activeCounter.min !== null ? `· Min: ${activeCounter.min}` : ''} {activeCounter.max !== null ? `· Max: ${activeCounter.max}` : ''}
              </p>

              {/* Giant Count Display */}
              <div className={`text-7xl sm:text-9xl font-black font-mono tabular-nums tracking-tighter text-slate-900 dark:text-white my-8 transition-transform duration-200 ${animatingId === activeCounter.id ? 'scale-110 text-indigo-600 dark:text-indigo-400' : ''}`}>
                {activeCounter.value.toLocaleString()}
              </div>

              {/* Goal Progress bar if target is set */}
              {activeCounter.target !== null && (
                <div className="max-w-md mx-auto mb-10">
                  <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                    <span>Progress to Goal</span>
                    <span>{activeCounter.value} / {activeCounter.target} ({Math.min(Math.round((activeCounter.value / activeCounter.target) * 100), 100)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                      style={{ width: `${Math.min(Math.round((activeCounter.value / activeCounter.target) * 100), 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Massive Increment / Decrement Controls */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-lg mx-auto mb-8">
                <button
                  onClick={() => updateCounterValue(activeCounter.id, -activeCounter.step * 10)}
                  className="py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl transition-colors text-base"
                >
                  -{activeCounter.step * 10}
                </button>
                <button
                  onClick={() => updateCounterValue(activeCounter.id, -activeCounter.step, 'decrement')}
                  className="py-4 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 font-bold rounded-2xl transition-colors text-xl flex items-center justify-center gap-2 shadow-sm"
                >
                  <Minus className="w-6 h-6" />
                  <span>-{activeCounter.step}</span>
                </button>
                <button
                  onClick={() => updateCounterValue(activeCounter.id, activeCounter.step, 'increment')}
                  className="py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all text-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
                >
                  <Plus className="w-6 h-6" />
                  <span>+{activeCounter.step}</span>
                </button>
                <button
                  onClick={() => updateCounterValue(activeCounter.id, activeCounter.step * 10)}
                  className="py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl transition-colors text-base"
                >
                  +{activeCounter.step * 10}
                </button>
              </div>

              <div className="text-xs text-slate-400 dark:text-slate-500">
                Keyboard shortcuts: Space / Up Arrow (+1), Down Arrow (-1), R (Reset)
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: ANALYTICS / STATS */}
        {viewMode === 'stats' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Analytics & Overview</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Counters Comparison */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  Counter Distribution
                </h3>
                <div className="space-y-4">
                  {counters.map(c => {
                    const maxVal = Math.max(...counters.map(x => x.value), 1);
                    const widthPct = Math.round((c.value / maxVal) * 100);
                    return (
                      <div key={c.id}>
                        <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          <span className="flex items-center gap-1.5">
                            <span>{c.icon}</span>
                            <span>{c.name}</span>
                          </span>
                          <span className="font-mono">{c.value.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(widthPct, 3)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Summary Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    Achievements & Highlights
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Total Counters</span>
                      <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">{counters.length}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Total Recorded History Events</span>
                      <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">{history.length}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Highest Single Counter Value</span>
                      <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                        {Math.max(...counters.map(c => c.value), 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                  <button
                    onClick={() => {
                      if (window.confirm("Reset all counters to 0?")) {
                        setCounters(prev => prev.map(c => ({ ...c, value: 0 })));
                      }
                    }}
                    className="w-full py-2.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl transition-colors"
                  >
                    Reset All Counter Values to 0
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: HISTORY LOG */}
        {viewMode === 'history' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Activity History Log</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Chronological record of all counter adjustments</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={exportHistoryCSV}
                  className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
                <button
                  onClick={() => {
                    if (window.confirm("Clear all history logs?")) setHistory([]);
                  }}
                  className="px-3 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-medium rounded-xl transition-all"
                >
                  Clear History
                </button>
              </div>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8">
                <History className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">No activity logged yet</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Interact with your counters to see history events appear here.</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <th className="py-3 px-6">Timestamp</th>
                        <th className="py-3 px-6">Counter</th>
                        <th className="py-3 px-6">Action</th>
                        <th className="py-3 px-6">Delta</th>
                        <th className="py-3 px-6">New Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {history.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-6 font-mono text-slate-500 dark:text-slate-400">
                            {new Date(item.timestamp).toLocaleTimeString()} · {new Date(item.timestamp).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-6 font-medium text-slate-900 dark:text-white">
                            {item.counterName}
                          </td>
                          <td className="py-3 px-6">
                            <span className={`inline-flex px-2 py-0.5 rounded-md font-medium text-[11px] ${
                              item.action === 'increment' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' :
                              item.action === 'decrement' ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400' :
                              'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                            }`}>
                              {item.action}
                            </span>
                          </td>
                          <td className="py-3 px-6 font-mono font-semibold tabular-nums">
                            {item.delta > 0 ? `+${item.delta}` : item.delta}
                          </td>
                          <td className="py-3 px-6 font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                            {item.newValue.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* CREATE / EDIT COUNTER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingCounter ? 'Edit Counter' : 'Create New Counter'}
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCounter} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Counter Name
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Daily Water Intake, Pushups"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Initial Value
                  </label>
                  <input
                    type="number"
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Step Size (±)
                  </label>
                  <input
                    type="number"
                    required
                    min="0.001"
                    step="any"
                    value={formStep}
                    onChange={(e) => setFormStep(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Min (opt)
                  </label>
                  <input
                    type="number"
                    value={formMin}
                    onChange={(e) => setFormMin(e.target.value)}
                    placeholder="No min"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Max (opt)
                  </label>
                  <input
                    type="number"
                    value={formMax}
                    onChange={(e) => setFormMax(e.target.value)}
                    placeholder="No max"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Goal (opt)
                  </label>
                  <input
                    type="number"
                    value={formTarget}
                    onChange={(e) => setFormTarget(e.target.value)}
                    placeholder="No goal"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Icon Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Choose Icon / Emoji
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {EMOJI_OPTIONS.map(em => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setFormIcon(em)}
                      className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                        formIcon === em
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Theme Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Color Theme
                </label>
                <div className="flex items-center gap-2">
                  {COLOR_OPTIONS.map(col => (
                    <button
                      key={col.value}
                      type="button"
                      onClick={() => setFormColor(col.value)}
                      className={`w-8 h-8 rounded-full ${col.bg} transition-transform ${
                        formColor === col.value ? 'ring-2 ring-offset-2 ring-indigo-600 scale-110' : 'opacity-80 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all"
                >
                  {editingCounter ? 'Save Changes' : 'Create Counter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-400 dark:text-slate-600 border-t border-slate-200 dark:border-slate-800 mt-auto">
        OmniCount Pro · Built with React & Tailwind CSS
      </footer>
    </div>
  );
}
