import React, { useState } from 'react';
import { Timer, X } from 'lucide-react';

export default function SleepTimerModal({
  isOpen,
  onClose,
  onSetTimer,
  onCancelTimer,
  remainingSeconds
}) {
  const [selectedMinutes, setSelectedMinutes] = useState(30);

  if (!isOpen) return null;

  const presets = [15, 30, 45, 60, 90];

  const handleStart = () => {
    onSetTimer(selectedMinutes);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white border border-slate-200 rounded-xl p-6 w-full max-w-sm shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="font-heading-2 text-[16px] text-slate-900 flex items-center gap-2">
            <Timer className="w-4 h-4 text-blue-600" />
            <span>Sleep Timer</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        {remainingSeconds ? (
          <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-center space-y-2">
            <div className="font-caption text-xs text-blue-700">Active Sleep Timer</div>
            <div className="font-display text-2xl text-slate-900 font-tabular">
              {Math.floor(remainingSeconds / 60)}m {remainingSeconds % 60}s
            </div>
            <button
              onClick={() => { onCancelTimer(); onClose(); }}
              className="px-3 py-1.5 rounded bg-white hover:bg-slate-100 text-slate-700 text-xs font-heading-3 transition-colors border border-slate-200 shadow-xs"
            >
              Cancel Timer
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="font-caption text-slate-500 text-xs">
              Music will automatically pause when the timer ends.
            </p>

            <div className="grid grid-cols-3 gap-2">
              {presets.map((mins) => (
                <button
                  key={mins}
                  onClick={() => setSelectedMinutes(mins)}
                  className={`py-2 rounded-lg text-xs font-heading-3 transition-colors ${
                    selectedMinutes === mins
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-[12px] font-heading-3"
              >
                Close
              </button>
              <button
                onClick={handleStart}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-heading-3 shadow-xs"
              >
                Set Timer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
