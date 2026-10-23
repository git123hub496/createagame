import React, { useState, useEffect } from 'react';
import { AvatarConfig, GameMap } from '../types';
import { AvatarRenderer } from './AvatarRenderer';
import { AvatarCustomizer } from './AvatarCustomizer';
import { AddonHubModal } from './AddonHubModal';
import { ProfileModal } from './ProfileModal';
import { MapEditorChoiceModal } from './MapEditorChoiceModal';
import { VersionLogModal } from './VersionLogModal';
import { AuthModal } from './AuthModal';
import { TutorialModal } from './TutorialModal';
import { isHalloweenEnabled } from '../services/addonService';
import { sounds } from '../services/sound';
import {
  Play,
  Hammer,
  Compass,
  Palette,
  Volume2,
  VolumeX,
  ArrowRight,
  Package,
  History,
  Users,
  User,
  Plus,
  ExternalLink,
  ChevronDown,
  Lock,
  HelpCircle,
} from 'lucide-react';

interface TitleScreenProps {
  avatar: AvatarConfig;
  onUpdateAvatar: (updated: AvatarConfig) => void;
  onStartEditor: (mapToOpen?: GameMap | null) => void;
  onExplore: () => void;
  onPlayRandom: () => void;
  onOpenAddon?: (studio?: boolean) => void;
  onPlayMap?: (map: GameMap) => void;
}

const HomescreenPumpkin: React.FC<{ size?: number; isJackOLantern?: boolean }> = ({
  size = 44,
  isJackOLantern = false,
}) => (
  <div className="relative inline-block select-none pointer-events-none">
    {isJackOLantern && (
      <div className="absolute inset-0 rounded-full bg-orange-500/40 blur-xl animate-pulse" />
    )}
    <svg width={size} height={size * 0.9} viewBox="0 0 40 36" className="relative z-10 drop-shadow-xl">
      <path d="M 19 8 C 19 3, 23 2, 25 4" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="11" cy="22" rx="9" ry="12" fill="#c2410c" />
      <ellipse cx="29" cy="22" rx="9" ry="12" fill="#c2410c" />
      <ellipse cx="15" cy="22" rx="8" ry="13" fill="#ea580c" />
      <ellipse cx="25" cy="22" rx="8" ry="13" fill="#ea580c" />
      <ellipse cx="20" cy="22" rx="7" ry="13.5" fill="#f97316" />
      {isJackOLantern && (
        <>
          <polygon points="12,19 16,19 14,15" fill="#fef08a" />
          <polygon points="24,19 28,19 26,15" fill="#fef08a" />
          <polygon points="19,21 21,21 20,19" fill="#fef08a" />
          <path d="M 12 25 L 15 28 L 17 26 L 20 28.5 L 23 26 L 25 28 L 28 25 L 26 29 L 14 29 Z" fill="#fef08a" />
        </>
      )}
    </svg>
  </div>
);

export const TitleScreen: React.FC<TitleScreenProps> = ({
  avatar,
  onUpdateAvatar,
  onStartEditor,
  onExplore,
  onPlayRandom,
  onOpenAddon,
  onPlayMap,
}) => {
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [showAddons, setShowAddons] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAddonHub, setShowAddonHub] = useState(false);
  const [showEditorChoice, setShowEditorChoice] = useState(false);
  const [showVersionLog, setShowVersionLog] = useState(false);
  const [showAlternateLinks, setShowAlternateLinks] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const [halloweenActive, setHalloweenActive] = useState(isHalloweenEnabled());

  useEffect(() => {
    const handleAddonUpdate = () => {
      setHalloweenActive(isHalloweenEnabled());
    };
    window.addEventListener('cag_addon_update', handleAddonUpdate);
    return () => window.removeEventListener('cag_addon_update', handleAddonUpdate);
  }, []);

  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className={`relative w-screen h-screen overflow-hidden flex flex-col items-center justify-between p-6 select-none ${
      halloweenActive
        ? 'bg-gradient-to-b from-[#2e1065] via-[#160628] to-[#7c2d12]'
        : 'bg-neutral-950'
    }`}>
      {/* Background Live Scene */}
      {!halloweenActive && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1d] via-[#151033] to-[#0a0f1d] pointer-events-none" />
      )}

      {/* Halloween Ambient Glow Orbs */}
      {halloweenActive && (
        <>
          <div className="absolute top-1/6 left-1/5 w-96 h-96 rounded-full bg-purple-600/25 blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/6 right-1/5 w-96 h-96 rounded-full bg-orange-600/30 blur-3xl pointer-events-none" />
        </>
      )}

      {/* Decorative stars and geometric grid */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: halloweenActive
            ? 'radial-gradient(#fb923c 1px, transparent 1px), radial-gradient(#c084fc 1px, transparent 1px)'
            : 'radial-gradient(#38bdf8 1px, transparent 1px), radial-gradient(#818cf8 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          backgroundPosition: '0 0, 16px 16px',
        }}
      />

      {/* Top Header Row (Blurred Transparent Glass) */}
      <header className="relative z-20 w-full max-w-6xl flex items-center justify-between">
        {/* Top Left: Alternate Links */}
        <div className="relative">
          <button
            onClick={() => {
              sounds.playClick();
              setShowAlternateLinks(!showAlternateLinks);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl backdrop-blur-xl bg-black/40 hover:bg-black/60 border border-white/15 text-xs font-bold text-neutral-200 hover:text-white shadow-lg transition cursor-pointer"
            title="Alternate Links"
          >
            <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
            <span>Alternate Links</span>
            <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${showAlternateLinks ? 'rotate-180' : ''}`} />
          </button>

          {showAlternateLinks && (
            <div className="absolute left-0 top-full mt-2 w-72 rounded-2xl backdrop-blur-2xl bg-neutral-900/90 border border-white/20 shadow-2xl p-2.5 z-50 flex flex-col gap-1.5 text-white animate-fadeIn">
              <div className="px-2 py-1 text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                Alternate Links
              </div>
              <a
                href="https://createagame.netlify.app/#"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowAlternateLinks(false)}
                className="flex items-center justify-between p-2.5 rounded-xl backdrop-blur-xl bg-black/40 hover:bg-black/60 border border-white/10 text-xs font-bold text-neutral-200 hover:text-white transition group"
              >
                <div>
                  <div className="text-white text-xs">Netlify Version</div>
                  <div className="text-[10px] text-neutral-400 font-mono">https://createagame.netlify.app/#</div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-300 shrink-0 ml-2" />
              </a>
              <a
                href="https://createagame-alternate.vercel.app/#"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowAlternateLinks(false)}
                className="flex items-center justify-between p-2.5 rounded-xl backdrop-blur-xl bg-black/40 hover:bg-black/60 border border-white/10 text-xs font-bold text-neutral-200 hover:text-white transition group"
              >
                <div>
                  <div className="text-white text-xs">Vercel Version</div>
                  <div className="text-[10px] text-neutral-400 font-mono">https://createagame-alternate.vercel.app/#</div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-300 shrink-0 ml-2" />
              </a>
            </div>
          )}
        </div>

        {/* Audio Mute, Avatar, Profile, Addons, Account & Tutorial Quick Buttons */}
        <div className="flex items-center gap-2">
          {/* Tutorial Button */}
          <button
            onClick={() => {
              sounds.playClick();
              setShowTutorialModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl backdrop-blur-xl bg-black/40 hover:bg-black/60 border border-white/15 text-xs font-bold text-neutral-200 hover:text-white shadow-lg transition cursor-pointer"
            title="How to Play Tutorial"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Tutorial</span>
          </button>

          {/* Account & Password Security Button */}
          <button
            onClick={() => {
              sounds.playClick();
              setShowAuthModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl backdrop-blur-xl bg-black/40 hover:bg-black/60 border border-white/15 text-xs font-bold text-neutral-200 hover:text-white shadow-lg transition cursor-pointer"
            title="Account & Password"
          >
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Account</span>
          </button>

          {/* Version Log Button */}
          <button
            onClick={() => {
              sounds.playClick();
              setShowVersionLog(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl backdrop-blur-xl bg-black/40 hover:bg-black/60 border border-white/15 text-xs font-bold text-neutral-200 hover:text-white shadow-lg transition cursor-pointer"
            title="Version Log (Release Updates)"
          >
            <History className="w-3.5 h-3.5 text-indigo-400" />
            <span>V3.0</span>
          </button>

          {/* Add-on Studio Button */}
          <button
            onClick={() => {
              sounds.playClick();
              if (onOpenAddon) onOpenAddon(false);
              else setShowAddonHub(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl backdrop-blur-xl bg-black/40 hover:bg-black/60 border border-white/15 text-xs font-bold text-neutral-200 hover:text-white shadow-lg transition cursor-pointer"
            title="Add-ons (Create & Get Community Addons)"
          >
            <Package className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Add-ons</span>
          </button>

          {/* Player Profile Button */}
          <button
            onClick={() => {
              sounds.playClick();
              setShowProfile(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl backdrop-blur-xl bg-black/40 hover:bg-black/60 border border-white/15 text-xs font-bold text-neutral-200 hover:text-white shadow-lg transition cursor-pointer"
            title="My Public Player Profile"
          >
            <User className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Profile</span>
          </button>

          {/* Avatar Customizer */}
          <button
            onClick={() => {
              sounds.playClick();
              setShowCustomizer(true);
            }}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl backdrop-blur-xl bg-black/40 hover:bg-black/60 border border-white/15 text-xs font-bold text-white shadow-lg transition cursor-pointer"
            title="Customize Avatar"
          >
            <AvatarRenderer avatar={avatar} size={22} />
            <span className="hidden sm:inline max-w-[90px] truncate">{avatar.name || 'White Square'}</span>
          </button>

          <button
            onClick={handleToggleMute}
            className="p-2 rounded-2xl backdrop-blur-xl bg-black/40 hover:bg-black/60 text-white/90 hover:text-white border border-white/15 shadow-lg transition cursor-pointer"
            title="Toggle Sound"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* Center Hero */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl px-4 my-auto">

        {/* App Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-2xl">
          Get started with{' '}
          <span className={`bg-clip-text text-transparent ${
            halloweenActive
              ? 'bg-gradient-to-r from-orange-400 via-amber-300 to-purple-400'
              : 'bg-gradient-to-r from-cyan-400 via-indigo-300 to-pink-400'
          }`}>
            Createagame
          </span>
        </h1>

        <p className="mt-3 text-sm sm:text-base text-neutral-300 max-w-lg leading-relaxed">
          The creative platformer sandbox. Build treacherous maps with spikes, lava, springs, and checkered flags, beat your courses to verify them, and publish worldwide.
        </p>

        {/* Avatar Showcase Card (Blurred Transparent Glass) */}
        <div
          onClick={() => {
            sounds.playClick();
            setShowCustomizer(true);
          }}
          className={`mt-6 p-4 rounded-3xl backdrop-blur-2xl border shadow-2xl flex items-center gap-4 cursor-pointer group transition transform hover:scale-105 relative ${
            halloweenActive
              ? 'bg-black/60 hover:bg-black/75 border-orange-500/30 hover:border-orange-400/60'
              : 'bg-black/50 hover:bg-black/65 border-white/15 hover:border-indigo-400/50'
          }`}
        >
          {/* Decorative Homescreen Pumpkin on avatar showcase card */}
          {halloweenActive && (
            <div className="absolute -top-4 -right-3 pointer-events-none">
              <HomescreenPumpkin size={38} isJackOLantern={true} />
            </div>
          )}

          <div className="relative flex items-center justify-center p-2 rounded-2xl backdrop-blur-md bg-white/5 border border-white/10">
            <AvatarRenderer avatar={avatar} size={52} />
          </div>
          <div className="text-left pr-2">
            <div className="text-[10px] uppercase font-extrabold text-indigo-300 tracking-wider flex items-center gap-1">
              <Palette className="w-3 h-3" />
              <span>Customize Avatar</span>
            </div>
            <div className="text-sm font-black text-white group-hover:text-indigo-200 transition">
              {avatar.name || 'White Square'}
            </div>
            <div className="text-xs text-neutral-400">
              Change colors, hats, eyes, and trails
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
          {/* Play Random Level */}
          <button
            onClick={() => {
              sounds.playClick();
              onPlayRandom();
            }}
            className={`w-full sm:flex-1 py-3.5 px-6 rounded-2xl backdrop-blur-xl font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl transition transform active:scale-95 cursor-pointer ${
              halloweenActive
                ? 'bg-orange-500 hover:bg-orange-400 text-black shadow-orange-500/25'
                : 'bg-emerald-500/90 hover:bg-emerald-400 text-black shadow-emerald-500/20'
            }`}
            title="Press K or click to play a random map"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Play (Random Map)</span>
          </button>

          {/* Map Editor with 2 options (Open and New) */}
          <button
            onClick={() => {
              sounds.playClick();
              setShowEditorChoice(true);
            }}
            className={`w-full sm:flex-1 py-3.5 px-6 rounded-2xl backdrop-blur-xl font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl transition transform active:scale-95 cursor-pointer ${
              halloweenActive
                ? 'bg-purple-700 hover:bg-purple-600 text-white shadow-purple-900/30'
                : 'bg-indigo-600/90 hover:bg-indigo-500 text-white shadow-indigo-600/25'
            }`}
          >
            <Hammer className="w-4 h-4" />
            <span>Map Editor</span>
          </button>
        </div>

        {/* Explore Button */}
        <button
          onClick={() => {
            sounds.playClick();
            onExplore();
          }}
          className="mt-3 w-full max-w-md py-2.5 px-6 rounded-2xl backdrop-blur-xl bg-black/40 hover:bg-black/60 text-neutral-200 hover:text-white border border-white/15 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-lg"
        >
          <Compass className="w-4 h-4 text-indigo-400" />
          <span>Explore Community Maps</span>
          <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
        </button>

        {/* Add-on Studio Button (Create Add-on & Explore Add-ons) */}
        <button
          onClick={() => {
            sounds.playClick();
            if (onOpenAddon) onOpenAddon(true);
            else setShowAddonHub(true);
          }}
          className="mt-2.5 w-full max-w-md py-2.5 px-6 rounded-2xl backdrop-blur-xl bg-black/40 hover:bg-black/60 text-neutral-200 hover:text-white border border-white/15 font-bold text-xs sm:text-sm flex items-center justify-between transition cursor-pointer shadow-lg group"
        >
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-purple-400" />
            <span className="text-white font-extrabold">Add-on Studio</span>
            <span className="text-neutral-400 text-xs font-normal">· Create & publish add-ons</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:translate-x-0.5 transition" />
        </button>
      </div>

      {/* Halloween Bottom Left Pumpkins Cluster */}
      {halloweenActive && (
        <div className="fixed bottom-5 left-6 z-20 hidden sm:flex items-end gap-2 pointer-events-none">
          <HomescreenPumpkin size={48} />
          <HomescreenPumpkin size={62} isJackOLantern={true} />
        </div>
      )}

      {/* Control Hints Footer (Blurred Transparent Glass) */}
      <footer className="relative z-10 w-full max-w-3xl text-center py-2.5 px-4 rounded-2xl backdrop-blur-xl bg-black/30 border border-white/10 text-neutral-400 font-medium text-xs">
        WASD or Arrow Keys to Move · Space or Up to Jump · On-Screen Touch Controls on Mobile
      </footer>

      {/* Version Log Modal */}
      {showVersionLog && (
        <VersionLogModal onClose={() => setShowVersionLog(false)} />
      )}

      {/* Map Editor 2 Options Modal (New Map / Open Map) */}
      {showEditorChoice && (
        <MapEditorChoiceModal
          onNewMap={() => {
            setShowEditorChoice(false);
            onStartEditor(null);
          }}
          onOpenMap={(savedMap) => {
            setShowEditorChoice(false);
            onStartEditor(savedMap);
          }}
          onClose={() => setShowEditorChoice(false)}
        />
      )}

      {/* Add-on Studio Modal (Create Addon, Community Addons, Installed) */}
      {showAddonHub && (
        <AddonHubModal
          onClose={() => setShowAddonHub(false)}
          creatorName={avatar.name}
          creatorId="player"
        />
      )}

      {/* Player Profile Modal (Public / Private toggle, Real visual models of items) */}
      {showProfile && (
        <ProfileModal
          onClose={() => setShowProfile(false)}
          currentAvatar={avatar}
          onUpdateAvatar={onUpdateAvatar}
          onPlayMap={onPlayMap}
          onOpenAddonStudio={() => {
            setShowProfile(false);
            if (onOpenAddon) onOpenAddon(true);
            else setShowAddonHub(true);
          }}
        />
      )}

      {/* Avatar Customizer Modal */}
      {showCustomizer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <AvatarCustomizer
            avatar={avatar}
            onChange={onUpdateAvatar}
            onClose={() => setShowCustomizer(false)}
          />
        </div>
      )}

      {/* Account Login / Password Modal */}
      {showAuthModal && (
        <AuthModal
          initialMode="login"
          forcedSecure={false}
          onClose={() => setShowAuthModal(false)}
          onAuthenticated={(newAvatar) => {
            if (newAvatar) {
              onUpdateAvatar(newAvatar);
            }
          }}
        />
      )}

      {/* Tutorial Modal */}
      {showTutorialModal && (
        <TutorialModal onClose={() => setShowTutorialModal(false)} />
      )}
    </div>
  );
};
