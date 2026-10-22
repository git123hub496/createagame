import React, { useState } from 'react';
import { GameMap } from '../types';
import { likeMap, hasLikedMap } from '../services/mapStorage';
import { sounds } from '../services/sound';
import { Trophy, RotateCcw, ArrowRight, Heart, Share2, Check, Cloud, CheckCircle2 } from 'lucide-react';

interface VictoryModalProps {
  map: GameMap;
  clearTimeMs: number;
  deaths: number;
  isVerificationMode?: boolean;
  onReplay: () => void;
  onPlayAnother?: () => void;
  onBackToMenu: () => void;
  onContinueToPublish?: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  map,
  clearTimeMs,
  deaths,
  isVerificationMode = false,
  onReplay,
  onPlayAnother,
  onBackToMenu,
  onContinueToPublish,
}) => {
  const [liked, setLiked] = useState(() => hasLikedMap(map.id));
  const [copied, setCopied] = useState(false);

  const formattedTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const cs = Math.floor((ms % 1000) / 10);
    return `${m > 0 ? `${m}:` : ''}${s < 10 && m > 0 ? '0' : ''}${s}.${cs < 10 ? '0' : ''}${cs}s`;
  };

  const handleLike = async () => {
    sounds.playCoin();
    const success = await likeMap(map.id);
    if (success) setLiked(true);
  };

  const handleShare = () => {
    sounds.playClick();
    const url = `${window.location.origin}${window.location.pathname}#/play/${map.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="backdrop-blur-2xl bg-black/75 border border-white/20 rounded-3xl max-w-md w-full p-6 shadow-2xl text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Decorative ambient glow */}
        <div className="absolute top-0 inset-x-0 h-32 bg-radial from-amber-500/20 via-transparent to-transparent pointer-events-none"></div>

        {/* Victory Icon */}
        <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-xl shadow-amber-500/10">
          <Trophy className="w-10 h-10" />
        </div>

        <h2 className="text-2xl font-black tracking-tight text-white mb-1">
          {isVerificationMode ? 'Map Verified!' : 'Course Clear!'}
        </h2>

        <p className="text-xs text-neutral-400 mb-6 font-medium">
          {isVerificationMode
            ? 'You cleared your own course from start to finish. It is now officially beatable and ready for publishing!'
            : `You conquered "${map.title}" by ${map.authorName}`}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-3 flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
              Completion Time
            </span>
            <span className="text-xl font-mono font-black text-emerald-400">
              {formattedTime(clearTimeMs)}
            </span>
          </div>

          <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-3 flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
              Deaths
            </span>
            <span className="text-xl font-mono font-black text-rose-400">{deaths}</span>
          </div>
        </div>

        {/* If verification mode: Direct button to publish */}
        {isVerificationMode ? (
          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => {
                sounds.playVictory();
                onContinueToPublish?.();
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
            >
              <Cloud className="w-4 h-4 fill-current" />
              <span>Back to Editor to Publish to Cloud</span>
            </button>

            <button
              onClick={onReplay}
              className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Practice Again</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Social Actions (Like & Share) */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleLike}
                disabled={liked}
                className={`flex-1 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  liked
                    ? 'bg-rose-950/60 text-rose-400 border-rose-800/80'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border-neutral-700'
                }`}
              >
                <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                <span>{liked ? 'Starred!' : 'Star This Map'}</span>
              </button>

              <button
                onClick={handleShare}
                className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 text-xs font-bold flex items-center gap-1.5 transition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Share'}</span>
              </button>
            </div>

            {/* Play Another, Play Again & Menu buttons */}
            {onPlayAnother && (
              <button
                onClick={() => {
                  sounds.playClick();
                  onPlayAnother();
                }}
                className="w-full py-3 rounded-2xl backdrop-blur-xl bg-emerald-500/90 hover:bg-emerald-400 text-black font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 transition transform active:scale-95 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Play Another Random Map</span>
              </button>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={onReplay}
                className="flex-1 py-2.5 rounded-xl backdrop-blur-xl bg-black/40 hover:bg-black/60 border border-white/15 text-neutral-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Play Again</span>
              </button>

              <button
                onClick={onBackToMenu}
                className="flex-1 py-2.5 rounded-xl backdrop-blur-xl bg-indigo-600/80 hover:bg-indigo-600 border border-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow"
              >
                <span>Explore Maps</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
