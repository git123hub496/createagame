import React from 'react';
import { X, Sparkles, History, Check } from 'lucide-react';
import { sounds } from '../services/sound';

interface VersionLogModalProps {
  onClose: () => void;
}

export const VersionLogModal: React.FC<VersionLogModalProps> = ({ onClose }) => {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl backdrop-blur-2xl bg-neutral-900/90 border border-white/20 p-6 shadow-2xl relative overflow-hidden flex flex-col gap-5 text-white"
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 inset-x-0 h-28 bg-radial from-indigo-500/20 via-transparent to-transparent pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl backdrop-blur-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white">Version Log</h2>
              <p className="text-xs text-neutral-400">Release history and updates</p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-2 rounded-xl backdrop-blur-md bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white border border-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Versions Timeline */}
        <div className="flex flex-col gap-3.5 max-h-[60vh] overflow-y-auto pr-1">
          {/* Version 3.0 (Current) */}
          <div className="p-4 rounded-2xl backdrop-blur-xl bg-white/5 border border-indigo-500/30 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-indigo-300">Version 3.0</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                  Current
                </span>
              </div>
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <ul className="text-xs text-neutral-300 space-y-1.5 font-medium pl-1">
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Added Addon Studio</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Added Password Security</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Public Profiles</span>
              </li>
            </ul>
          </div>

          {/* Version 2.0 */}
          <div className="p-4 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-black text-neutral-300">Version 2.0</span>
              <span className="text-[10px] font-bold text-neutral-500">October Update</span>
            </div>
            <ul className="text-xs text-neutral-400 space-y-1.5 font-medium pl-1">
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5" />
                <span>Added Addons and Halloween Addon</span>
              </li>
            </ul>
          </div>

          {/* Version 1.0 */}
          <div className="p-4 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-black text-neutral-300">Version 1.0</span>
              <span className="text-[10px] font-bold text-neutral-500">Initial Release</span>
            </div>
            <ul className="text-xs text-neutral-400 space-y-1.5 font-medium pl-1">
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5" />
                <span>Base game and Map Editor</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Close Button */}
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="w-full py-2.5 rounded-2xl backdrop-blur-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-white transition cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};
