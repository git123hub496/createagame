import React, { useState, useEffect } from 'react';
import { AvatarConfig, EyeStyle, HatStyle, TrailStyle } from '../types';
import { AvatarRenderer } from './AvatarRenderer';
import { sounds } from '../services/sound';
import { isHalloweenEnabled, getAllActiveAddonHats, getAllActiveAddonColors } from '../services/addonService';
import { Check, Sparkles, User, Palette, Smile, Crown, Sliders, ChevronDown } from 'lucide-react';

interface AvatarCustomizerProps {
  avatar: AvatarConfig;
  onChange: (updated: AvatarConfig) => void;
  onClose?: () => void;
}

const STANDARD_COLORS = [
  { name: 'Classic White', hex: '#ffffff' },
  { name: 'Sky Cyan', hex: '#38bdf8' },
  { name: 'Neon Lime', hex: '#4ade80' },
  { name: 'Electric Gold', hex: '#facc15' },
  { name: 'Sunset Orange', hex: '#fb923c' },
  { name: 'Coral Pink', hex: '#f43f5e' },
  { name: 'Cyber Purple', hex: '#a855f7' },
  { name: 'Shadow Charcoal', hex: '#374151' },
];

const HALLOWEEN_COLORS = [
  { name: 'Pumpkin Orange', hex: '#ff7518' },
  { name: 'Neon Pink', hex: '#ff2a8d' },
  { name: 'Witch Purple', hex: '#9333ea' },
  { name: 'Slime Green', hex: '#84cc16' },
  { name: 'Blood Crimson', hex: '#dc2626' },
  { name: 'Eerie Violet', hex: '#6b21a8' },
];

const EYE_OPTIONS: { id: EyeStyle; label: string; preview: string }[] = [
  { id: 'normal', label: 'Classic', preview: 'oo' },
  { id: 'happy', label: 'Cheerful', preview: '^^' },
  { id: 'shades', label: 'Cool Shades', preview: '[]' },
  { id: 'gamer', label: 'VR Visor', preview: '===' },
  { id: 'cyclops', label: 'Cyclops', preview: '(o)' },
  { id: 'angry', label: 'Fierce', preview: '><' },
  { id: 'wink', label: 'Wink', preview: 'o~' },
];

const STANDARD_HATS: { id: HatStyle; label: string; customHatImg?: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'crown', label: 'Crown' },
  { id: 'cap', label: 'Cap' },
  { id: 'tophat', label: 'Top Hat' },
  { id: 'horns', label: 'Horns' },
  { id: 'halo', label: 'Halo' },
  { id: 'headphones', label: 'Beats' },
  { id: 'ninja', label: 'Ninja' },
];

const HALLOWEEN_HATS: { id: HatStyle; label: string; customHatImg?: string }[] = [
  { id: 'pumpkin', label: 'Pumpkin' },
  { id: 'bat', label: 'Bat' },
  { id: 'ghost', label: 'Ghost' },
  { id: 'witch', label: 'Witch Hat' },
  { id: 'skull', label: 'Skull' },
  { id: 'spider', label: 'Spider' },
];

const TRAIL_OPTIONS: { id: TrailStyle; label: string; desc: string }[] = [
  { id: 'none', label: 'None', desc: 'Clean square' },
  { id: 'ghost', label: 'Ghost Echo', desc: 'Translucent motion blur' },
  { id: 'sparkle', label: 'Star Dust', desc: 'Glittering sparks' },
  { id: 'rainbow', label: 'Rainbow Arc', desc: 'Prismatic color wave' },
  { id: 'fire', label: 'Blaze Flame', desc: 'Hot embers trailing' },
];

export const AvatarCustomizer: React.FC<AvatarCustomizerProps> = ({ avatar, onChange, onClose }) => {
  const [halloweenActive, setHalloweenActive] = useState(isHalloweenEnabled());
  const [addonHats, setAddonHats] = useState(() => getAllActiveAddonHats());
  const [addonColors, setAddonColors] = useState(() => getAllActiveAddonColors());
  const [customColor, setCustomColor] = useState(avatar.color || '#ffffff');

  useEffect(() => {
    const handleAddonUpdate = () => {
      setHalloweenActive(isHalloweenEnabled());
      setAddonHats(getAllActiveAddonHats());
      setAddonColors(getAllActiveAddonColors());
    };
    window.addEventListener('cag_addon_update', handleAddonUpdate);
    return () => window.removeEventListener('cag_addon_update', handleAddonUpdate);
  }, []);

  const update = (partial: Partial<AvatarConfig>) => {
    sounds.playClick();
    onChange({ ...avatar, ...partial });
  };

  const handleCustomColorChange = (hex: string) => {
    setCustomColor(hex);
    onChange({ ...avatar, color: hex });
  };

  const handleDone = () => {
    sounds.playClick();
    onClose?.();
  };

  const allHats = [
    ...(halloweenActive ? [...STANDARD_HATS, ...HALLOWEEN_HATS] : STANDARD_HATS),
    ...addonHats.map((ah) => ({ id: ah.id, label: ah.name, customHatImg: ah.imageDataUrl })),
  ];

  const allColorPresets = [
    ...(halloweenActive ? [...STANDARD_COLORS, ...HALLOWEEN_COLORS] : STANDARD_COLORS),
    ...addonColors.map((ac) => ({ name: ac.name, hex: ac.hex })),
  ];

  return (
    <div className="backdrop-blur-2xl bg-black/75 border border-white/20 text-white rounded-3xl p-6 shadow-2xl max-w-3xl w-full animate-in fade-in zoom-in-95 duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl backdrop-blur-md bg-white/10 border border-white/15 text-indigo-400">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">Customize Your Avatar</h2>
            <p className="text-xs text-neutral-400">Pick any color, head accessories, and facial style</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={handleDone}
            className="px-5 py-2 rounded-xl backdrop-blur-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-lg shadow-indigo-600/25 transition cursor-pointer"
          >
            Done
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
        {/* Left Side: Avatar Live Stage */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-6 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-radial from-indigo-500/10 via-transparent to-transparent pointer-events-none"></div>

          <div className="text-[11px] uppercase tracking-widest text-neutral-400 mb-5 font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            Live Preview
          </div>

          {/* Interactive Bouncing Square Container */}
          <div className="h-32 flex items-center justify-center relative">
            <div className="animate-bounce">
              <AvatarRenderer avatar={avatar} size={64} />
            </div>
            {/* Shadow beneath */}
            <div className="w-16 h-3 bg-black/60 rounded-full blur-[2px] absolute bottom-4 animate-pulse"></div>
          </div>

          <div className="mt-3 text-center">
            <span className="font-extrabold text-base text-white block">
              {avatar.name || 'White Square'}
            </span>
            <span className="text-[11px] text-neutral-400">Ready for adventures</span>
          </div>

          {/* Name Input (White square and any name is allowed) */}
          <div className="mt-5 w-full">
            <label className="text-xs font-bold text-neutral-300 block mb-1.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span>Player Name</span>
            </label>
            <input
              type="text"
              maxLength={24}
              value={avatar.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="White Square"
              className="w-full backdrop-blur-md bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-400 transition"
            />
          </div>
        </div>

        {/* Right Side: Customization Controls */}
        <div className="md:col-span-7 flex flex-col gap-5 max-h-[480px] overflow-y-auto pr-1">
          {/* 1. Square Color & Any Color Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-indigo-400" />
                <span>Square Color</span>
              </label>
              {halloweenActive && (
                <span className="text-[10px] font-bold text-orange-400 backdrop-blur-md bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                  Halloween Colors Unlocked
                </span>
              )}
            </div>

            {/* Choose ANY Color Section */}
            <div className="p-3 mb-3 rounded-xl backdrop-blur-md bg-white/5 border border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg border-2 border-white/40 shadow shrink-0 relative overflow-hidden"
                  style={{ backgroundColor: avatar.color }}
                >
                  <input
                    type="color"
                    value={avatar.color}
                    onChange={(e) => handleCustomColorChange(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    title="Click to choose any color"
                  />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Choose Any Color</div>
                  <div className="text-[10px] text-neutral-400">Click color square for custom palette</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-neutral-400 font-mono">Hex:</span>
                <input
                  type="text"
                  maxLength={7}
                  value={avatar.color}
                  onChange={(e) => handleCustomColorChange(e.target.value)}
                  className="w-20 backdrop-blur-md bg-black/40 border border-white/20 rounded-lg px-2 py-1 text-xs text-white font-mono uppercase focus:outline-none focus:border-indigo-400"
                />
              </div>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {allColorPresets.map((c) => {
                const isSelected = avatar.color.toLowerCase() === c.hex.toLowerCase();
                return (
                  <button
                    key={c.hex}
                    onClick={() => update({ color: c.hex })}
                    className={`flex items-center gap-2 p-2 rounded-xl backdrop-blur-md border text-left transition cursor-pointer ${
                      isSelected
                        ? 'border-indigo-400 bg-indigo-500/20 text-white font-bold'
                        : 'border-white/10 bg-white/5 hover:bg-white/10 text-neutral-300'
                    }`}
                  >
                    <div
                      className="w-5 h-5 rounded-md border border-black/40 shadow-sm flex items-center justify-center shrink-0"
                      style={{ backgroundColor: c.hex }}
                    >
                      {isSelected && <Check className="w-3 h-3 text-neutral-900 stroke-[3]" />}
                    </div>
                    <span className="text-[11px] truncate">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Head Accessories & Halloween Head Things */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-indigo-400" />
                <span>Head Accessories</span>
              </label>
              {halloweenActive ? (
                <span className="text-[10px] font-bold text-orange-400 backdrop-blur-md bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                  Bat, Pumpkin, Ghost, Witch, Skull, Spider Active
                </span>
              ) : (
                <span className="text-[10px] text-neutral-400">
                  Enable Addons for Halloween Heads
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {allHats.map((h) => {
                const isSelected = avatar.hat === h.id;
                const isHallowItem = [
                  'pumpkin',
                  'bat',
                  'ghost',
                  'witch',
                  'skull',
                  'spider',
                ].includes(h.id);
                return (
                  <button
                    key={h.id}
                    onClick={() => {
                      if (h.customHatImg) {
                        update({ hat: h.id, customHatImg: h.customHatImg });
                      } else {
                        update({ hat: h.id, customHatImg: undefined });
                      }
                    }}
                    className={`p-2.5 rounded-xl backdrop-blur-md border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      isSelected
                        ? isHallowItem
                          ? 'border-orange-400 bg-orange-500/25 text-white font-bold shadow-md shadow-orange-500/10'
                          : 'border-indigo-400 bg-indigo-500/25 text-white font-bold'
                        : 'border-white/10 bg-white/5 hover:bg-white/10 text-neutral-300'
                    }`}
                  >
                    <span className="text-xs font-bold truncate w-full">{h.label}</span>
                    {isHallowItem && (
                      <span className="text-[9px] uppercase tracking-wider text-orange-300 font-extrabold">
                        Halloween
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Facial Expression & Eyes */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5 mb-2">
              <Smile className="w-3.5 h-3.5 text-indigo-400" />
              <span>Eyes & Expressions</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {EYE_OPTIONS.map((e) => {
                const isSelected = avatar.eyeStyle === e.id;
                return (
                  <button
                    key={e.id}
                    onClick={() => update({ eyeStyle: e.id })}
                    className={`p-2 rounded-xl backdrop-blur-md border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      isSelected
                        ? 'border-indigo-400 bg-indigo-500/25 text-white font-bold'
                        : 'border-white/10 bg-white/5 hover:bg-white/10 text-neutral-300'
                    }`}
                  >
                    <span className="text-xs font-mono font-bold text-neutral-200">{e.preview}</span>
                    <span className="text-[11px] truncate w-full">{e.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Motion Trail */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Motion Trail</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TRAIL_OPTIONS.map((t) => {
                const isSelected = avatar.trail === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => update({ trail: t.id })}
                    className={`p-2.5 rounded-xl backdrop-blur-md border text-left transition cursor-pointer ${
                      isSelected
                        ? 'border-indigo-400 bg-indigo-500/25 text-white font-bold'
                        : 'border-white/10 bg-white/5 hover:bg-white/10 text-neutral-300'
                    }`}
                  >
                    <div className="text-xs font-bold">{t.label}</div>
                    <div className="text-[10px] text-neutral-400">{t.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
