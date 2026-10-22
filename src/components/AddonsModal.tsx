import React, { useState, useEffect } from 'react';
import {
  isHalloweenAdded,
  isHalloweenEnabled,
  addHalloweenAddon,
  enableHalloweenAddon,
  disableHalloweenAddon,
} from '../services/addonService';
import { sounds } from '../services/sound';
import { Package, Check, Sparkles, X, Power, Plus } from 'lucide-react';

interface AddonsModalProps {
  onClose: () => void;
}

export const AddonsModal: React.FC<AddonsModalProps> = ({ onClose }) => {
  const [added, setAdded] = useState(isHalloweenAdded());
  const [enabled, setEnabled] = useState(isHalloweenEnabled());
  const [selectedAddon, setSelectedAddon] = useState<'halloween'>('halloween');

  useEffect(() => {
    const handleUpdate = () => {
      setAdded(isHalloweenAdded());
      setEnabled(isHalloweenEnabled());
    };
    window.addEventListener('cag_addon_update', handleUpdate);
    return () => window.removeEventListener('cag_addon_update', handleUpdate);
  }, []);

  const handleAdd = () => {
    sounds.playClick();
    addHalloweenAddon();
    setAdded(true);
    setEnabled(false);
  };

  const handleEnable = () => {
    sounds.playVictory();
    enableHalloweenAddon();
    setEnabled(true);
  };

  const handleDisable = () => {
    sounds.playClick();
    disableHalloweenAddon();
    setEnabled(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl backdrop-blur-2xl bg-black/60 border border-white/20 shadow-2xl p-6 text-white overflow-hidden">
        {/* Top ambient highlight */}
        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-orange-500/15 via-pink-500/10 to-transparent pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl backdrop-blur-md bg-white/10 border border-white/15 text-orange-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Addons</h2>
              <p className="text-xs text-neutral-400">Expand your sandbox with thematic content</p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-2 rounded-xl backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/15 text-neutral-300 hover:text-white transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="mt-5 space-y-4 relative z-10">
          {/* Halloween Addon Card */}
          <div
            onClick={() => setSelectedAddon('halloween')}
            className={`p-5 rounded-2xl backdrop-blur-xl border transition cursor-pointer ${
              selectedAddon === 'halloween'
                ? 'bg-white/10 border-orange-500/60 shadow-lg shadow-orange-500/10'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl backdrop-blur-md bg-gradient-to-br from-orange-500/25 to-pink-500/25 border border-orange-400/30 flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-white">Halloween</h3>
                    {enabled ? (
                      <span className="px-2 py-0.5 rounded-full backdrop-blur-md bg-emerald-500/20 border border-emerald-400/40 text-[10px] font-extrabold text-emerald-300 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Enabled
                      </span>
                    ) : added ? (
                      <span className="px-2 py-0.5 rounded-full backdrop-blur-md bg-amber-500/20 border border-amber-400/40 text-[10px] font-extrabold text-amber-300">
                        Added
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                    Unlocks Halloween head accessories (Pumpkin, Bat, Ghost, Witch Hat, Skull, Spider), vibrant Halloween colors (Pumpkin Orange, Neon Pink, and custom picker for any color), plus Halloween map themes.
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
              <div className="text-[11px] text-neutral-400">
                {!added ? 'Press Add, then press Enable' : !enabled ? 'Press Enable to activate' : 'Active across all menus'}
              </div>

              <div className="flex items-center gap-2">
                {!added ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAdd();
                    }}
                    className="px-4 py-2 rounded-xl backdrop-blur-md bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-400 hover:to-pink-400 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-orange-500/20 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                ) : !enabled ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEnable();
                    }}
                    className="px-4 py-2 rounded-xl backdrop-blur-md bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>Enable</span>
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDisable();
                    }}
                    className="px-3 py-1.5 rounded-xl backdrop-blur-md bg-white/10 hover:bg-white/15 border border-white/15 text-neutral-300 hover:text-white font-bold text-xs transition cursor-pointer"
                  >
                    Disable
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-[11px] text-neutral-400 relative z-10">
          Addons save to your storage and automatically apply to your avatar and maps.
        </div>
      </div>
    </div>
  );
};
