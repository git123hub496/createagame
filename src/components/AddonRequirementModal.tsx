import React, { useState, useEffect } from 'react';
import { GameMap } from '../types';
import {
  isHalloweenAdded,
  isHalloweenEnabled,
  addHalloweenAddon,
  enableHalloweenAddon,
} from '../services/addonService';
import { sounds } from '../services/sound';
import { AlertCircle, Download, Check, Sparkles, X, Play } from 'lucide-react';

interface AddonRequirementModalProps {
  map: GameMap;
  onProceed: () => void;
  onClose: () => void;
}

export const AddonRequirementModal: React.FC<AddonRequirementModalProps> = ({
  map,
  onProceed,
  onClose,
}) => {
  const [added, setAdded] = useState(isHalloweenAdded());
  const [enabled, setEnabled] = useState(isHalloweenEnabled());

  useEffect(() => {
    const handleUpdate = () => {
      setAdded(isHalloweenAdded());
      setEnabled(isHalloweenEnabled());
    };
    window.addEventListener('cag_addon_update', handleUpdate);
    return () => window.removeEventListener('cag_addon_update', handleUpdate);
  }, []);

  const handleDownload = () => {
    sounds.playClick();
    addHalloweenAddon();
    setAdded(true);
  };

  const handleEnable = () => {
    sounds.playVictory();
    enableHalloweenAddon();
    setEnabled(true);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl backdrop-blur-2xl bg-black/80 border border-white/20 p-6 shadow-2xl relative overflow-hidden flex flex-col gap-5 text-white"
      >
        {/* Ambient Warm Orange/Purple Glow */}
        <div className="absolute top-0 inset-x-0 h-32 bg-radial from-orange-500/25 via-purple-600/15 to-transparent pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl backdrop-blur-md bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-white leading-tight">
                These Addons are required to play this map
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Target course: <span className="text-indigo-300 font-bold">{map.title}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-1.5 rounded-xl backdrop-blur-md bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white border border-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Required Addon Card */}
        <div className="p-4 rounded-2xl backdrop-blur-xl bg-orange-950/20 border border-orange-500/30 relative overflow-hidden">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="text-sm font-black text-orange-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-orange-400" />
                <span>Halloween Addon</span>
              </div>
              <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                Required for Halloween midnight sky, pumpkins, glowing jack-o'-lanterns, and festive costumes.
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between pt-3 border-t border-orange-500/20 text-xs">
            <span className="text-neutral-400 font-medium">Addon Status:</span>
            {enabled ? (
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Enabled
              </span>
            ) : added ? (
              <span className="font-bold text-amber-300">Downloaded (Needs Activation)</span>
            ) : (
              <span className="font-bold text-neutral-400">Not Downloaded</span>
            )}
          </div>
        </div>

        {/* Actions Flow: Download -> Enable -> Play */}
        <div className="flex flex-col gap-2.5 relative z-10">
          {!added ? (
            <button
              onClick={handleDownload}
              className="w-full py-3.5 rounded-2xl backdrop-blur-xl bg-orange-500/90 hover:bg-orange-400 text-black font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-orange-500/20 transition transform active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          ) : !enabled ? (
            <button
              onClick={handleEnable}
              className="w-full py-3.5 rounded-2xl backdrop-blur-xl bg-emerald-500/90 hover:bg-emerald-400 text-black font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 transition transform active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Enable</span>
            </button>
          ) : (
            <button
              onClick={() => {
                sounds.playClick();
                onProceed();
              }}
              className="w-full py-3.5 rounded-2xl backdrop-blur-xl bg-emerald-500/90 hover:bg-emerald-400 text-black font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 transition transform active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Play Map Now</span>
            </button>
          )}

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="w-full py-2.5 rounded-2xl backdrop-blur-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-neutral-300 hover:text-white transition cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
