import React, { useState, useEffect } from 'react';
import {
  Users,
  X,
  Play,
  Copy,
  Check,
  LogOut,
  Flag,
  Trophy,
  Compass,
  ArrowRight,
  Shield,
  Loader2,
  Share2,
} from 'lucide-react';
import { AvatarConfig, GameMap } from '../types';
import { AvatarRenderer } from './AvatarRenderer';
import {
  PartyData,
  PartyGameMode,
  createParty,
  joinParty,
  updatePartySettings,
  startPartyGame,
  leaveParty,
  getPartyJoinUrl,
  getPartyPlayerId,
  DEFAULT_AVATAR,
} from '../services/partyService';
import { fetchAllExploreMaps } from '../services/mapStorage';
import { sounds } from '../services/sound';
import { ProfileModal } from './ProfileModal';

interface MultiplayerModalProps {
  avatar: AvatarConfig;
  initialPartyCode?: string | null;
  currentParty: PartyData | null;
  onPartyUpdate: (party: PartyData | null) => void;
  onStartGame: (party: PartyData) => void;
  onClose: () => void;
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  avatar,
  initialPartyCode,
  currentParty,
  onPartyUpdate,
  onStartGame,
  onClose,
}) => {
  const [viewMode, setViewMode] = useState<'menu' | 'join'>('menu');
  const [inputCode, setInputCode] = useState(initialPartyCode || '');
  const [playerName, setPlayerName] = useState(avatar.name || 'Player');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showMapSelector, setShowMapSelector] = useState(false);
  const [availableMaps, setAvailableMaps] = useState<GameMap[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const myId = getPartyPlayerId();
  const isHost = currentParty ? currentParty.hostId === myId : false;

  // Load maps for map picker
  useEffect(() => {
    fetchAllExploreMaps().then((maps) => {
      setAvailableMaps(maps);
    });
  }, []);

  // If initial party code provided via URL, prefill and switch to join
  useEffect(() => {
    if (initialPartyCode && !currentParty) {
      setInputCode(initialPartyCode.toUpperCase());
      setViewMode('join');
    }
  }, [initialPartyCode, currentParty]);

  // Handle Create Party
  const handleCreate = async () => {
    sounds.playClick();
    setLoading(true);
    setErrorMsg(null);
    try {
      const defaultMap = availableMaps[0] || {
        id: 'default-1',
        title: 'Emerald Plains',
        elements: [],
        verified: true,
      };
      const party = await createParty(playerName, avatar, defaultMap, 'coop');
      onPartyUpdate(party);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create party.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Join Party
  const handleJoin = async () => {
    sounds.playClick();
    const cleanCode = inputCode.trim().toUpperCase();
    if (cleanCode.length !== 5) {
      setErrorMsg('Please enter a valid 5-letter party code.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const party = await joinParty(cleanCode, playerName, avatar);
      onPartyUpdate(party);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to join party.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Leave Party
  const handleLeave = async () => {
    sounds.playClick();
    if (!currentParty) return;
    setLoading(true);
    try {
      await leaveParty(currentParty.id, isHost);
      onPartyUpdate(null);
      setViewMode('menu');
    } catch (err) {
      console.error('Leave party error:', err);
      onPartyUpdate(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle Host Start Game
  const handleLaunchMatch = async () => {
    sounds.playClick();
    if (!currentParty) return;
    setLoading(true);
    try {
      await startPartyGame(currentParty.id);
      onStartGame(currentParty);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not launch game.');
      setLoading(false);
    }
  };

  // Handle Mode Change (Host only)
  const handleSelectMode = async (mode: PartyGameMode) => {
    if (!currentParty || !isHost) return;
    sounds.playClick();
    try {
      await updatePartySettings(currentParty.id, { gameMode: mode });
    } catch (err) {
      console.error('Failed to change game mode:', err);
    }
  };

  // Handle Map Select (Host only)
  const handlePickMap = async (map: GameMap) => {
    if (!currentParty || !isHost) return;
    sounds.playClick();
    setShowMapSelector(false);
    try {
      await updatePartySettings(currentParty.id, {
        mapData: map,
        mapId: map.id,
      });
    } catch (err) {
      console.error('Failed to update party map:', err);
    }
  };

  const handleCopyCode = (code: string) => {
    sounds.playClick();
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = (code: string) => {
    sounds.playClick();
    const link = getPartyJoinUrl(code);
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="relative w-full max-w-lg rounded-3xl backdrop-blur-2xl bg-neutral-900/80 border border-white/15 shadow-2xl overflow-hidden flex flex-col text-white">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between backdrop-blur-xl bg-black/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl backdrop-blur-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                Multiplayer Party
                {currentParty && (
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
                    2 Players Max
                  </span>
                )}
              </h2>
              <p className="text-xs text-neutral-400">
                {currentParty ? `Party Room ${currentParty.id}` : 'Create a party or join with code'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentParty && (
              <button
                onClick={handleLeave}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-bold transition cursor-pointer"
                title="Leave Party"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Leave</span>
              </button>
            )}

            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="p-2 rounded-xl backdrop-blur-xl bg-black/30 hover:bg-black/50 border border-white/10 text-neutral-400 hover:text-white transition cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-2xl backdrop-blur-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs flex items-center justify-between">
            <span>{errorMsg}</span>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-red-400 hover:text-red-200 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto max-h-[75vh]">
          {/* STATE 1: NOT IN A PARTY -> OPTIONS (Create vs Join) */}
          {!currentParty && viewMode === 'menu' && (
            <div className="space-y-4">
              {/* Nickname input */}
              <div className="p-4 rounded-2xl backdrop-blur-xl bg-black/30 border border-white/10 flex items-center gap-3">
                <AvatarRenderer avatar={avatar} size={36} />
                <div className="flex-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                    Your Player Name
                  </label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value.slice(0, 24))}
                    placeholder="Enter nickname"
                    className="w-full bg-transparent text-sm font-bold text-white focus:outline-none placeholder-neutral-500"
                  />
                </div>
              </div>

              {/* Option 1: Create a Party */}
              <div
                onClick={handleCreate}
                className="group p-5 rounded-2xl backdrop-blur-xl bg-black/40 hover:bg-black/60 border border-white/15 hover:border-emerald-500/50 shadow-lg cursor-pointer transition transform hover:scale-[1.01]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl backdrop-blur-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <Play className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white group-hover:text-emerald-300 transition">
                        Create a Party
                      </h3>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Generate a 5-letter code as host manager and invite a player
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-neutral-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition" />
                </div>
              </div>

              {/* Option 2: Join a Party */}
              <div
                onClick={() => {
                  sounds.playClick();
                  setViewMode('join');
                }}
                className="group p-5 rounded-2xl backdrop-blur-xl bg-black/40 hover:bg-black/60 border border-white/15 hover:border-indigo-500/50 shadow-lg cursor-pointer transition transform hover:scale-[1.01]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl backdrop-blur-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white group-hover:text-indigo-300 transition">
                        Join with Code
                      </h3>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Enter a 5-letter party code to jump into an active party
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-neutral-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition" />
                </div>
              </div>
            </div>
          )}

          {/* STATE 2: JOIN PARTY CODE INPUT */}
          {!currentParty && viewMode === 'join' && (
            <div className="space-y-4">
              <div className="text-center py-2">
                <h3 className="text-lg font-black text-white">Join Party</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Enter the 5-letter party code provided by your host
                </p>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1.5">
                  5-Letter Party Code
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                  placeholder="e.g. KMPXQ"
                  className="w-full text-center tracking-[0.3em] font-mono text-2xl font-black py-3 rounded-2xl backdrop-blur-xl bg-black/50 border border-white/20 text-white uppercase focus:outline-none focus:border-indigo-400"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    sounds.playClick();
                    setViewMode('menu');
                  }}
                  className="flex-1 py-3 px-4 rounded-2xl backdrop-blur-xl bg-black/40 hover:bg-black/60 border border-white/15 text-neutral-300 hover:text-white font-bold text-xs transition cursor-pointer"
                >
                  Back
                </button>
                <button
                  disabled={inputCode.length !== 5 || loading}
                  onClick={handleJoin}
                  className="flex-1 py-3 px-4 rounded-2xl backdrop-blur-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-xs shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                  <span>Join Party</span>
                </button>
              </div>
            </div>
          )}

          {/* STATE 3: INSIDE PARTY LOBBY */}
          {currentParty && (
            <div className="space-y-5">
              {/* Party Room Code Banner */}
              <div className="p-4 rounded-2xl backdrop-blur-xl bg-black/50 border border-white/15 text-center relative overflow-hidden">
                <div className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 mb-1">
                  Party Code (5 Letters)
                </div>
                <div className="text-3xl sm:text-4xl font-mono font-black tracking-[0.25em] text-emerald-400 drop-shadow-md">
                  {currentParty.id}
                </div>

                <div className="flex items-center justify-center gap-2.5 mt-3">
                  <button
                    onClick={() => handleCopyCode(currentParty.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-neutral-200 hover:text-white transition cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                  </button>

                  <button
                    onClick={() => handleCopyLink(currentParty.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-neutral-200 hover:text-white transition cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-indigo-400" /> : <Share2 className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Link Copied' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

              {/* 2 Player Slots */}
              <div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 mb-2">
                  Connected Players (2 Max)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Slot 1: Host */}
                  <div className="p-3.5 rounded-2xl backdrop-blur-xl bg-black/40 border border-white/15 flex items-center gap-3">
                    <AvatarRenderer avatar={currentParty.hostAvatar} size={36} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-white truncate">
                          {currentParty.hostName}
                        </span>
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Manager
                        </span>
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        {currentParty.hostId === myId ? '(You)' : 'Party Host'}
                      </div>
                    </div>
                  </div>

                  {/* Slot 2: Guest */}
                  <div className="p-3.5 rounded-2xl backdrop-blur-xl bg-black/40 border border-white/15 flex items-center gap-3">
                    {currentParty.guestId ? (
                      <>
                        <AvatarRenderer
                          avatar={currentParty.guestAvatar || DEFAULT_AVATAR}
                          size={36}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-white truncate">
                              {currentParty.guestName || 'Player 2'}
                            </span>
                            <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Ready
                            </span>
                          </div>
                          <div className="text-[10px] text-neutral-400">
                            {currentParty.guestId === myId ? '(You)' : 'Player 2'}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-3 w-full py-1 text-neutral-400">
                        <div className="w-9 h-9 rounded-xl border border-dashed border-white/20 flex items-center justify-center text-xs">
                          2
                        </div>
                        <div className="text-xs text-neutral-400 animate-pulse">
                          Waiting for player 2...
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Game Mode Selection (Two modes as requested) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400">
                    Game Mode
                  </span>
                  {!isHost && (
                    <span className="text-[10px] text-neutral-400">
                      Chosen by Manager
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Mode 1: Coop / Play Together */}
                  <button
                    disabled={!isHost}
                    onClick={() => handleSelectMode('coop')}
                    className={`p-3.5 rounded-2xl backdrop-blur-xl border text-left transition ${
                      currentParty.gameMode === 'coop'
                        ? 'bg-emerald-500/20 border-emerald-400/50 text-white'
                        : 'bg-black/40 border-white/10 text-neutral-300 hover:bg-black/60'
                    } ${isHost ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Flag className="w-4 h-4 text-emerald-400" />
                      <span className="font-extrabold text-xs">Play Together</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-snug">
                      Play the map together. Reach the flag, wait for the other player to arrive, and finish together.
                    </p>
                  </button>

                  {/* Mode 2: Race to the finish line */}
                  <button
                    disabled={!isHost}
                    onClick={() => handleSelectMode('race')}
                    className={`p-3.5 rounded-2xl backdrop-blur-xl border text-left transition ${
                      currentParty.gameMode === 'race'
                        ? 'bg-purple-500/20 border-purple-400/50 text-white'
                        : 'bg-black/40 border-white/10 text-neutral-300 hover:bg-black/60'
                    } ${isHost ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span className="font-extrabold text-xs">Race to Finish</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-snug">
                      Head-to-head sprint! Race across the map to touch the checkered flag first to claim 1st place.
                    </p>
                  </button>
                </div>
              </div>

              {/* Selected Map Card */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400">
                    Selected Map
                  </span>
                  {isHost && (
                    <button
                      onClick={() => setShowMapSelector(true)}
                      className="text-xs font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer"
                    >
                      Change Map
                    </button>
                  )}
                </div>

                <div className="p-3.5 rounded-2xl backdrop-blur-xl bg-black/40 border border-white/15 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl backdrop-blur-md bg-white/5 border border-white/10 text-neutral-300">
                      <Compass className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-white">
                        {currentParty.mapData.title || 'Platformer Map'}
                      </div>
                      <div className="text-[10px] text-neutral-400 flex items-center gap-2 mt-0.5">
                        <span>Theme: {currentParty.mapData.theme || 'Grassland'}</span>
                        <span>·</span>
                        <span>{currentParty.mapData.elements?.length || 0} Elements</span>
                      </div>
                    </div>
                  </div>

                  {isHost && (
                    <button
                      onClick={() => setShowMapSelector(true)}
                      className="px-2.5 py-1 rounded-xl backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-neutral-200 transition cursor-pointer"
                    >
                      Select
                    </button>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                {isHost ? (
                  <button
                    disabled={loading}
                    onClick={handleLaunchMatch}
                    className="w-full py-3.5 px-6 rounded-2xl backdrop-blur-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 transition cursor-pointer transform active:scale-95"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                    <span>Start Game ({currentParty.gameMode === 'race' ? 'Race Mode' : 'Co-op Mode'})</span>
                  </button>
                ) : (
                  <div className="p-3.5 rounded-2xl backdrop-blur-xl bg-black/40 border border-white/15 text-center text-xs text-neutral-300 flex items-center justify-center gap-2 animate-pulse">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <span>Waiting for manager to start the game...</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map Selector Sub-Modal */}
      {showMapSelector && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-md rounded-3xl backdrop-blur-2xl bg-neutral-900/90 border border-white/15 shadow-2xl overflow-hidden flex flex-col text-white max-h-[80vh]">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between backdrop-blur-xl bg-black/40">
              <h3 className="text-sm font-black text-white">Choose Map to Play</h3>
              <button
                onClick={() => setShowMapSelector(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-2 overflow-y-auto">
              {availableMaps.map((map) => (
                <div
                  key={map.id}
                  onClick={() => handlePickMap(map)}
                  className={`p-3 rounded-2xl backdrop-blur-xl border flex items-center justify-between cursor-pointer transition ${
                    currentParty?.mapId === map.id
                      ? 'bg-indigo-500/20 border-indigo-400/50 text-white'
                      : 'bg-black/30 hover:bg-black/50 border-white/10 text-neutral-200'
                  }`}
                >
                  <div>
                    <div className="text-xs font-black">{map.title}</div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">
                      Theme: {map.theme || 'Grassland'} · By {map.authorName || 'Creator'}
                    </div>
                  </div>
                  {currentParty?.mapId === map.id && (
                    <Check className="w-4 h-4 text-indigo-400" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
