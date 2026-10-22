import React from 'react';
import {
  Trophy,
  Flag,
  RotateCcw,
  Compass,
  LogOut,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { PartyData, PartyResults, returnPartyToLobby, leaveParty, getPartyPlayerId, DEFAULT_AVATAR } from '../services/partyService';
import { AvatarRenderer } from './AvatarRenderer';
import { sounds } from '../services/sound';

interface MultiplayerVictoryModalProps {
  party: PartyData;
  results: PartyResults;
  isHost: boolean;
  onSelectNextMap: () => void;
  onPlayAgain: () => void;
  onBackToLobby: () => void;
  onLeaveParty: () => void;
}

export const MultiplayerVictoryModal: React.FC<MultiplayerVictoryModalProps> = ({
  party,
  results,
  isHost,
  onSelectNextMap,
  onPlayAgain,
  onBackToLobby,
  onLeaveParty,
}) => {
  const myId = getPartyPlayerId();
  const isCoop = results.mode === 'coop';
  const isRace = results.mode === 'race';

  const hostTimeStr = results.hostTime ? `${(results.hostTime / 1000).toFixed(2)}s` : '--';
  const guestTimeStr = results.guestTime ? `${(results.guestTime / 1000).toFixed(2)}s` : '--';

  const didIWin = results.winnerId === myId;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl backdrop-blur-2xl bg-neutral-900/85 border border-white/20 shadow-2xl overflow-hidden flex flex-col text-white text-center p-6">
        {/* Decorative Top Accent */}
        <div className="mx-auto mb-3 p-3.5 rounded-2xl backdrop-blur-xl border flex items-center justify-center shadow-lg bg-emerald-500/15 border-emerald-400/30 text-emerald-300">
          {isCoop ? <Flag className="w-8 h-8 text-emerald-400" /> : <Trophy className="w-8 h-8 text-amber-400" />}
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-md">
          {isCoop
            ? 'Level Completed Together'
            : didIWin
            ? 'You Won the Race'
            : `${results.winnerName || 'Winner'} Won the Race`}
        </h2>
        <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
          {isCoop
            ? 'Both players successfully reached the checkered flag'
            : 'Race to the finish line concluded'}
        </p>

        {/* Player Times & Placements */}
        <div className="mt-5 space-y-2.5">
          {/* Host Card */}
          <div
            className={`p-3 rounded-2xl backdrop-blur-xl border flex items-center justify-between ${
              isRace && results.winnerId === party.hostId
                ? 'bg-amber-500/15 border-amber-400/40'
                : 'bg-black/40 border-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <AvatarRenderer avatar={party.hostAvatar} size={32} />
              <div className="text-left">
                <div className="text-xs font-black text-white flex items-center gap-1.5">
                  <span>{party.hostName}</span>
                  {isRace && results.winnerId === party.hostId && (
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      1st Place
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-neutral-400">
                  {party.hostId === myId ? '(You)' : 'Host'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-neutral-200">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              <span>{hostTimeStr}</span>
            </div>
          </div>

          {/* Guest Card */}
          {party.guestId && (
            <div
              className={`p-3 rounded-2xl backdrop-blur-xl border flex items-center justify-between ${
                isRace && results.winnerId === party.guestId
                  ? 'bg-amber-500/15 border-amber-400/40'
                  : 'bg-black/40 border-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <AvatarRenderer
                  avatar={party.guestAvatar || DEFAULT_AVATAR}
                  size={32}
                />
                <div className="text-left">
                  <div className="text-xs font-black text-white flex items-center gap-1.5">
                    <span>{party.guestName || 'Player 2'}</span>
                    {isRace && results.winnerId === party.guestId && (
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        1st Place
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-neutral-400">
                    {party.guestId === myId ? '(You)' : 'Guest'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-neutral-200">
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                <span>{guestTimeStr}</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="mt-6 space-y-2">
          {isHost ? (
            <>
              <button
                onClick={() => {
                  sounds.playClick();
                  onPlayAgain();
                }}
                className="w-full py-3 px-4 rounded-2xl backdrop-blur-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isRace ? 'Rematch' : 'Play Again'}</span>
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  onSelectNextMap();
                }}
                className="w-full py-3 px-4 rounded-2xl backdrop-blur-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>Select New Map</span>
              </button>
            </>
          ) : (
            <div className="p-3.5 rounded-2xl backdrop-blur-xl bg-black/40 border border-white/10 text-xs text-neutral-300 animate-pulse">
              Waiting for manager to choose rematch or next map...
            </div>
          )}

          <button
            onClick={() => {
              sounds.playClick();
              onLeaveParty();
            }}
            className="w-full py-2.5 px-4 rounded-2xl backdrop-blur-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Leave Party</span>
          </button>
        </div>
      </div>
    </div>
  );
};
