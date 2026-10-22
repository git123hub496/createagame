import React, { useState, useEffect } from 'react';
import {
  User,
  X,
  Eye,
  EyeOff,
  Check,
  Trophy,
  Flag,
  Package,
  Layers,
  Edit2,
  Shield,
  Sparkles,
  Download,
  Flame,
  Crown,
  Smile,
  Sliders,
} from 'lucide-react';
import { PlayerProfile, AvatarConfig, GameMap, PublishedAddon } from '../types';
import { getMyProfile, saveMyProfile, fetchPublicProfile } from '../services/profileService';
import { AvatarRenderer } from './AvatarRenderer';
import { sounds } from '../services/sound';
import { fetchAllExploreMaps } from '../services/mapStorage';
import { fetchCommunityAddons, installAddon, isAddonInstalled } from '../services/addonService';

interface ProfileModalProps {
  onClose: () => void;
  targetProfileId?: string;
  currentAvatar: AvatarConfig;
  onUpdateAvatar?: (updated: AvatarConfig) => void;
  onPlayMap?: (map: GameMap) => void;
  onOpenAddonStudio?: () => void;
}

// Visual graphic renderer for equipped items (hats, eye styles, trails, skins)
const RealItemGraphic: React.FC<{
  category: 'hat' | 'eye' | 'trail' | 'color';
  styleName: string;
  customImg?: string;
  colorHex?: string;
}> = ({ category, styleName, customImg, colorHex = '#ffffff' }) => {
  if (category === 'hat') {
    if (customImg) {
      return (
        <div className="w-10 h-10 flex items-center justify-center p-1">
          <img src={customImg} alt={styleName} className="max-w-full max-h-full object-contain drop-shadow" />
        </div>
      );
    }
    if (styleName === 'crown') {
      return (
        <svg viewBox="0 0 40 24" className="w-10 h-10 drop-shadow">
          <polygon points="4,20 36,20 34,8 26,16 20,4 14,16 6,8" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
          <circle cx="20" cy="5" r="2.5" fill="#ef4444" />
          <circle cx="7" cy="9" r="2" fill="#3b82f6" />
          <circle cx="33" cy="9" r="2" fill="#10b981" />
        </svg>
      );
    }
    if (styleName === 'tophat') {
      return (
        <svg viewBox="0 0 40 28" className="w-10 h-10 drop-shadow">
          <rect x="10" y="2" width="20" height="17" rx="1.5" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
          <rect x="10" y="14" width="20" height="4" fill="#ef4444" />
          <rect x="4" y="19" width="32" height="4.5" rx="2" fill="#1e293b" stroke="#0f172a" strokeWidth="1" />
        </svg>
      );
    }
    if (styleName === 'cap') {
      return (
        <svg viewBox="0 0 40 24" className="w-10 h-10 drop-shadow">
          <path d="M 8 18 Q 20 4 32 18 Z" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1.5" />
          <rect x="4" y="16" width="13" height="3.5" rx="1.5" fill="#1d4ed8" />
          <circle cx="20" cy="9" r="2" fill="#ffffff" />
        </svg>
      );
    }
    if (styleName === 'horns') {
      return (
        <svg viewBox="0 0 40 24" className="w-10 h-10 drop-shadow">
          <path d="M 10 20 Q 8 4 4 6 Q 7 14 13 20 Z" fill="#dc2626" />
          <path d="M 30 20 Q 32 4 36 6 Q 33 14 27 20 Z" fill="#dc2626" />
        </svg>
      );
    }
    if (styleName === 'halo') {
      return (
        <svg viewBox="0 0 40 20" className="w-10 h-10">
          <ellipse cx="20" cy="10" rx="15" ry="5" fill="none" stroke="#facc15" strokeWidth="3.5" className="animate-pulse" />
        </svg>
      );
    }
    if (styleName === 'headphones') {
      return (
        <svg viewBox="0 0 40 28" className="w-10 h-10 drop-shadow">
          <path d="M 6 20 A 14 14 0 0 1 34 20" fill="none" stroke="#06b6d4" strokeWidth="3" />
          <rect x="4" y="15" width="5.5" height="11" rx="2" fill="#0891b2" />
          <rect x="30.5" y="15" width="5.5" height="11" rx="2" fill="#0891b2" />
        </svg>
      );
    }
    if (styleName === 'ninja') {
      return (
        <div className="w-10 h-5 flex flex-col justify-center relative">
          <div className="w-full h-3 bg-red-600 rounded-sm shadow-sm border border-red-700" />
          <div className="absolute right-0 -bottom-2 w-2 h-4 bg-red-600 -rotate-12 rounded-sm origin-top" />
          <div className="absolute right-1 -bottom-3 w-1.5 h-4 bg-red-500 rotate-12 rounded-sm origin-top" />
        </div>
      );
    }
    if (styleName === 'pumpkin') {
      return (
        <svg viewBox="0 0 40 32" className="w-10 h-10 drop-shadow">
          <ellipse cx="20" cy="18" rx="14" ry="11" fill="#ea580c" />
          <polygon points="15,15 18,15 16.5,12" fill="#fef08a" />
          <polygon points="22,15 25,15 23.5,12" fill="#fef08a" />
          <path d="M 14 21 L 17 23 L 20 21 L 23 23 L 26 21 Z" fill="#fef08a" />
        </svg>
      );
    }
    if (styleName === 'witch') {
      return (
        <svg viewBox="0 0 40 28" className="w-10 h-10 drop-shadow">
          <polygon points="20,2 11,20 29,20" fill="#7e22ce" stroke="#581c87" strokeWidth="1" />
          <ellipse cx="20" cy="20" rx="16" ry="3.5" fill="#581c87" />
          <rect x="13" y="17" width="14" height="2.5" fill="#facc15" />
        </svg>
      );
    }
    return (
      <div className="w-10 h-10 rounded-xl border border-dashed border-white/20 flex items-center justify-center text-[10px] text-neutral-400 font-bold">
        None
      </div>
    );
  }

  if (category === 'eye') {
    if (styleName === 'shades') {
      return (
        <svg viewBox="0 0 40 18" className="w-10 h-6 drop-shadow">
          <path d="M 4 4 L 18 4 L 16 14 L 6 14 Z" fill="#0f172a" />
          <path d="M 22 4 L 36 4 L 34 14 L 24 14 Z" fill="#0f172a" />
          <rect x="17" y="4" width="6" height="2" fill="#0f172a" />
          <line x1="7" y1="6" x2="14" y2="12" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="25" y1="6" x2="32" y2="12" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    }
    if (styleName === 'gamer') {
      return (
        <svg viewBox="0 0 40 16" className="w-10 h-6 drop-shadow">
          <rect x="4" y="3" width="32" height="10" rx="3" fill="#0f172a" stroke="#06b6d4" strokeWidth="1.5" />
          <rect x="8" y="6" width="24" height="4" rx="1.5" fill="#06b6d4" className="animate-pulse" />
        </svg>
      );
    }
    if (styleName === 'happy') {
      return (
        <svg viewBox="0 0 40 16" className="w-10 h-6">
          <path d="M 8 12 Q 13 4 18 12" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 22 12 Q 27 4 32 12" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    }
    if (styleName === 'cyclops') {
      return (
        <svg viewBox="0 0 40 20" className="w-10 h-6 drop-shadow">
          <ellipse cx="20" cy="10" rx="9" ry="6" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
          <circle cx="20" cy="10" r="3.5" fill="#ef4444" />
          <circle cx="19" cy="9" r="1.5" fill="#ffffff" />
        </svg>
      );
    }
    if (styleName === 'angry') {
      return (
        <svg viewBox="0 0 40 16" className="w-10 h-6">
          <line x1="8" y1="4" x2="18" y2="8" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="32" y1="4" x2="22" y2="8" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="14" cy="11" r="2.5" fill="#0f172a" />
          <circle cx="26" cy="11" r="2.5" fill="#0f172a" />
        </svg>
      );
    }
    if (styleName === 'wink') {
      return (
        <svg viewBox="0 0 40 16" className="w-10 h-6">
          <circle cx="13" cy="8" r="3.5" fill="#0f172a" />
          <circle cx="12" cy="7" r="1" fill="#ffffff" />
          <path d="M 22 9 Q 27 4 32 9" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 40 16" className="w-10 h-6">
        <circle cx="13" cy="8" r="3.5" fill="#0f172a" />
        <circle cx="12" cy="7" r="1" fill="#ffffff" />
        <circle cx="27" cy="8" r="3.5" fill="#0f172a" />
        <circle cx="26" cy="7" r="1" fill="#ffffff" />
      </svg>
    );
  }

  if (category === 'trail') {
    if (styleName === 'rainbow') {
      return (
        <svg viewBox="0 0 40 20" className="w-10 h-6 drop-shadow">
          <path d="M 4 18 Q 20 2 36 18" fill="none" stroke="#ef4444" strokeWidth="2.5" />
          <path d="M 4 19 Q 20 5 36 19" fill="none" stroke="#facc15" strokeWidth="2.5" />
          <path d="M 4 20 Q 20 8 36 20" fill="none" stroke="#3b82f6" strokeWidth="2.5" />
        </svg>
      );
    }
    if (styleName === 'fire') {
      return (
        <svg viewBox="0 0 40 24" className="w-10 h-7 drop-shadow">
          <path d="M 12 22 Q 10 14 16 10 Q 15 16 20 6 Q 25 12 24 16 Q 28 14 28 22 Z" fill="#f97316" />
          <path d="M 15 22 Q 17 16 20 12 Q 22 17 25 22 Z" fill="#facc15" />
        </svg>
      );
    }
    if (styleName === 'sparkle') {
      return (
        <svg viewBox="0 0 40 24" className="w-10 h-7 text-amber-300">
          <path d="M 20 4 L 22 10 L 28 12 L 22 14 L 20 20 L 18 14 L 12 12 L 18 10 Z" fill="currentColor" />
          <circle cx="8" cy="7" r="2" fill="currentColor" />
          <circle cx="32" cy="17" r="1.5" fill="currentColor" />
        </svg>
      );
    }
    if (styleName === 'ghost') {
      return (
        <div className="flex items-center gap-1.5 opacity-80">
          <div className="w-2.5 h-2.5 rounded-sm bg-cyan-400 opacity-30" />
          <div className="w-3 h-3 rounded-sm bg-cyan-400 opacity-60" />
          <div className="w-3.5 h-3.5 rounded-sm bg-cyan-400" />
        </div>
      );
    }
    return (
      <div className="w-10 h-6 rounded-lg border border-dashed border-white/20 flex items-center justify-center text-[10px] text-neutral-400 font-bold">
        None
      </div>
    );
  }

  // Character body color / skin
  return (
    <div
      className="w-8 h-8 rounded-xl shadow-lg border border-white/30 relative overflow-hidden"
      style={{ backgroundColor: colorHex }}
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/30 pointer-events-none" />
    </div>
  );
};

export const ProfileModal: React.FC<ProfileModalProps> = ({
  onClose,
  targetProfileId,
  currentAvatar,
  onUpdateAvatar,
  onPlayMap,
  onOpenAddonStudio,
}) => {
  const [profile, setProfile] = useState<PlayerProfile>(getMyProfile());
  const [isSelf, setIsSelf] = useState(true);
  const [nameInput, setNameInput] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [userMaps, setUserMaps] = useState<GameMap[]>([]);
  const [userAddons, setUserAddons] = useState<PublishedAddon[]>([]);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    const myProfile = getMyProfile();
    const effectiveId = targetProfileId || myProfile.id;

    if (!targetProfileId || targetProfileId === myProfile.id) {
      setIsSelf(true);
      setProfile(myProfile);
      setNameInput(myProfile.name);
    } else {
      setIsSelf(false);
      fetchPublicProfile(targetProfileId).then((res) => {
        if (res) {
          setProfile(res);
          setNameInput(res.name);
        }
      });
    }

    // Load maps authored by this user
    fetchAllExploreMaps().then((maps) => {
      const authored = maps.filter(
        (m) =>
          m.authorId === effectiveId ||
          m.authorName === (targetProfileId ? profile.name : myProfile.name)
      );
      setUserMaps(authored);
    });

    // Load add-ons authored by this user
    fetchCommunityAddons().then((addons) => {
      const authored = addons.filter(
        (a) =>
          a.authorId === effectiveId ||
          a.authorName === (targetProfileId ? profile.name : myProfile.name)
      );
      setUserAddons(authored);
    });
  }, [targetProfileId]);

  // Toggle Public vs Private
  const handleTogglePublic = async () => {
    if (!isSelf) return;
    sounds.playClick();
    const updated = await saveMyProfile({ isPublic: !profile.isPublic });
    setProfile(updated);
    setSaveStatus(updated.isPublic ? 'Profile is now Public' : 'Profile is now Hidden');
    setTimeout(() => setSaveStatus(null), 2000);
  };

  // Save Name Change
  const handleSaveName = async () => {
    if (!isSelf || !nameInput.trim()) return;
    sounds.playClick();
    const newAvatar = { ...currentAvatar, name: nameInput.trim() };
    const updated = await saveMyProfile({ name: nameInput.trim() }, newAvatar);
    setProfile(updated);
    setIsEditingName(false);
    onUpdateAvatar?.(newAvatar);
    setSaveStatus('Name updated');
    setTimeout(() => setSaveStatus(null), 2000);
  };

  const currentAvatarConfig = isSelf ? currentAvatar : profile.avatar;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl backdrop-blur-2xl bg-neutral-900/90 border border-white/20 shadow-2xl overflow-hidden flex flex-col text-white max-h-[92vh]">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between backdrop-blur-xl bg-black/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-wide text-white">
                {isSelf ? 'My Player Profile' : `${profile.name}'s Profile`}
              </h2>
              <div className="text-[10px] text-neutral-400">
                {profile.isPublic ? 'Public Profile (Shown automatically)' : 'Hidden / Private Profile'}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-2 rounded-xl backdrop-blur-xl bg-black/40 hover:bg-black/60 border border-white/10 text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {saveStatus && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 animate-fadeIn">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{saveStatus}</span>
            </div>
          )}

          {/* Privacy Gate: If target user made their profile private */}
          {!profile.isPublic && !isSelf ? (
            <div className="p-8 rounded-2xl backdrop-blur-xl bg-black/40 border border-white/10 text-center space-y-2">
              <EyeOff className="w-8 h-8 text-neutral-400 mx-auto" />
              <div className="text-sm font-bold text-white">This Profile is Private</div>
              <div className="text-xs text-neutral-400">
                The player has chosen to hide their profile details from the community.
              </div>
            </div>
          ) : (
            <>
              {/* Profile Card Header with Avatar Showcase */}
              <div className="p-5 rounded-2xl backdrop-blur-xl bg-black/40 border border-white/10 flex flex-col items-center text-center space-y-3 relative overflow-hidden">
                {/* Ambient Glow */}
                <div
                  className="absolute w-36 h-36 rounded-full blur-2xl opacity-25 -top-6 -z-10"
                  style={{ backgroundColor: currentAvatarConfig?.color || '#38bdf8' }}
                />

                {/* Avatar Display */}
                <div className="p-3 rounded-2xl backdrop-blur-xl bg-black/50 border border-white/15 shadow-xl">
                  <AvatarRenderer avatar={currentAvatarConfig} size={56} />
                </div>

                {/* Name / Edit */}
                {isSelf && isEditingName ? (
                  <div className="flex items-center gap-2 w-full max-w-xs">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      maxLength={24}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-indigo-400 text-center font-bold"
                    />
                    <button
                      onClick={handleSaveName}
                      className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-base font-black text-white">{profile.name}</span>
                    {isSelf && (
                      <button
                        onClick={() => {
                          sounds.playClick();
                          setIsEditingName(true);
                        }}
                        title="Edit Name"
                        className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                <div className="text-[10px] text-neutral-400 font-mono">
                  Player ID: {profile.id.slice(0, 16)}
                </div>

                {/* Visibility Toggle Switch (Self only) */}
                {isSelf && (
                  <div className="w-full pt-3 border-t border-white/10 flex items-center justify-between">
                    <div className="text-left">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        {profile.isPublic ? (
                          <>
                            <Eye className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Public Profile</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-neutral-400" />
                            <span>Hidden Profile</span>
                          </>
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">
                        {profile.isPublic
                          ? 'Shows automatically to community'
                          : 'Hidden from other players'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleTogglePublic}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        profile.isPublic ? 'bg-emerald-600' : 'bg-neutral-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          profile.isPublic ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                )}
              </div>

              {/* REAL ITEMS SHOWCASE: Visual Models of Equipped Items (Not just flat colors) */}
              <div className="p-4 rounded-2xl backdrop-blur-xl bg-black/40 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Equipped Items & Accessories</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">Actual in-game visual model</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* Item 1: Real Hat Graphic */}
                  <div className="p-3 rounded-2xl backdrop-blur-xl bg-black/50 border border-white/10 flex flex-col items-center text-center space-y-1.5">
                    <div className="h-10 flex items-center justify-center">
                      <RealItemGraphic
                        category="hat"
                        styleName={currentAvatarConfig?.hat || 'none'}
                        customImg={currentAvatarConfig?.customHatImg}
                      />
                    </div>
                    <div className="text-[11px] font-bold text-white capitalize truncate max-w-full">
                      {currentAvatarConfig?.customHatImg ? 'Custom Hat' : currentAvatarConfig?.hat || 'None'}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold">
                      Headpiece
                    </div>
                  </div>

                  {/* Item 2: Real Eyes Graphic */}
                  <div className="p-3 rounded-2xl backdrop-blur-xl bg-black/50 border border-white/10 flex flex-col items-center text-center space-y-1.5">
                    <div className="h-10 flex items-center justify-center">
                      <RealItemGraphic
                        category="eye"
                        styleName={currentAvatarConfig?.eyeStyle || 'normal'}
                      />
                    </div>
                    <div className="text-[11px] font-bold text-white capitalize truncate max-w-full">
                      {currentAvatarConfig?.eyeStyle || 'Classic'}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold">
                      Eye Style
                    </div>
                  </div>

                  {/* Item 3: Real Motion Trail Graphic */}
                  <div className="p-3 rounded-2xl backdrop-blur-xl bg-black/50 border border-white/10 flex flex-col items-center text-center space-y-1.5">
                    <div className="h-10 flex items-center justify-center">
                      <RealItemGraphic
                        category="trail"
                        styleName={currentAvatarConfig?.trail || 'none'}
                      />
                    </div>
                    <div className="text-[11px] font-bold text-white capitalize truncate max-w-full">
                      {currentAvatarConfig?.trail || 'None'}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold">
                      Aura Trail
                    </div>
                  </div>

                  {/* Item 4: Real Character Skin / Color */}
                  <div className="p-3 rounded-2xl backdrop-blur-xl bg-black/50 border border-white/10 flex flex-col items-center text-center space-y-1.5">
                    <div className="h-10 flex items-center justify-center">
                      <RealItemGraphic
                        category="color"
                        styleName="custom"
                        colorHex={currentAvatarConfig?.color || '#ffffff'}
                      />
                    </div>
                    <div className="text-[11px] font-bold text-white font-mono uppercase truncate max-w-full">
                      {currentAvatarConfig?.color || '#FFFFFF'}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold">
                      Body Tint
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="p-3 rounded-2xl backdrop-blur-xl bg-black/40 border border-white/10 text-center space-y-1">
                  <Flag className="w-4 h-4 text-emerald-400 mx-auto" />
                  <div className="text-lg font-black font-mono text-white">{profile.mapsCleared}</div>
                  <div className="text-[10px] text-neutral-400 font-bold uppercase">Maps Cleared</div>
                </div>

                <div className="p-3 rounded-2xl backdrop-blur-xl bg-black/40 border border-white/10 text-center space-y-1">
                  <Layers className="w-4 h-4 text-indigo-400 mx-auto" />
                  <div className="text-lg font-black font-mono text-white">{profile.mapsCreated}</div>
                  <div className="text-[10px] text-neutral-400 font-bold uppercase">Maps Created</div>
                </div>

                <div className="p-3 rounded-2xl backdrop-blur-xl bg-black/40 border border-white/10 text-center space-y-1">
                  <Trophy className="w-4 h-4 text-amber-400 mx-auto" />
                  <div className="text-lg font-black font-mono text-white">{profile.partiesWon}</div>
                  <div className="text-[10px] text-neutral-400 font-bold uppercase">Races Won</div>
                </div>

                <div className="p-3 rounded-2xl backdrop-blur-xl bg-black/40 border border-white/10 text-center space-y-1">
                  <Package className="w-4 h-4 text-purple-400 mx-auto" />
                  <div className="text-lg font-black font-mono text-white">{profile.addonsCreated}</div>
                  <div className="text-[10px] text-neutral-400 font-bold uppercase">Add-ons Created</div>
                </div>

                <div className="p-3 rounded-2xl backdrop-blur-xl bg-black/40 border border-white/10 text-center space-y-1 sm:col-span-2">
                  <Shield className="w-4 h-4 text-cyan-400 mx-auto" />
                  <div className="text-lg font-black font-mono text-white">{profile.partiesPlayed}</div>
                  <div className="text-[10px] text-neutral-400 font-bold uppercase">Multiplayer Matches</div>
                </div>
              </div>

              {/* Published Maps Section */}
              {userMaps.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-black text-neutral-300 uppercase tracking-wider">
                    Published Maps ({userMaps.length})
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {userMaps.map((m) => (
                      <div
                        key={m.id}
                        className="p-2.5 rounded-xl backdrop-blur-xl bg-black/40 border border-white/10 flex items-center justify-between hover:bg-black/60 transition"
                      >
                        <div>
                          <div className="text-xs font-bold text-white">{m.title}</div>
                          <div className="text-[10px] text-neutral-400">
                            {m.theme || 'Grassland'} · {m.playCount || 0} plays
                          </div>
                        </div>
                        {onPlayMap && (
                          <button
                            onClick={() => {
                              sounds.playClick();
                              onClose();
                              onPlayMap(m);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-[11px] transition cursor-pointer"
                          >
                            Play
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Published Add-ons Section */}
              {userAddons.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-black text-neutral-300 uppercase tracking-wider">
                    Published Add-ons ({userAddons.length})
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {userAddons.map((ad) => {
                      const installed = isAddonInstalled(ad.id);
                      return (
                        <div
                          key={ad.id}
                          className="p-2.5 rounded-xl backdrop-blur-xl bg-black/40 border border-white/10 flex items-center justify-between hover:bg-black/60 transition"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300">
                              <Package className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white">{ad.title}</div>
                              <div className="text-[10px] text-neutral-400">
                                {ad.elements?.length || 0} blocks · {ad.hats?.length || 0} hats · {ad.installCount || 1} installs
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              sounds.playClick();
                              installAddon(ad);
                              onClose();
                              onOpenAddonStudio?.();
                            }}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                              installed
                                ? 'bg-white/10 text-neutral-300'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                            }`}
                          >
                            {installed ? 'Installed' : 'Get Add-on'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
