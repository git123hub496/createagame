import React, { useState } from 'react';
import { GameMap } from '../types';
import { getLocalMaps, deleteMapFromEverywhere } from '../services/mapStorage';
import { sounds } from '../services/sound';
import { FilePlus, FolderOpen, X, Trash2, ChevronRight, Clock, Layers } from 'lucide-react';

interface MapEditorChoiceModalProps {
  onNewMap: () => void;
  onOpenMap: (map: GameMap) => void;
  onClose: () => void;
}

export const MapEditorChoiceModal: React.FC<MapEditorChoiceModalProps> = ({
  onNewMap,
  onOpenMap,
  onClose,
}) => {
  const [localMaps, setLocalMaps] = useState<GameMap[]>(() => getLocalMaps());
  const [showOpenList, setShowOpenList] = useState(false);

  const handleDeleteSavedMap = async (e: React.MouseEvent, mapId: string) => {
    e.stopPropagation();
    sounds.playErase();
    await deleteMapFromEverywhere(mapId);
    setLocalMaps((prev) => prev.filter((m) => m.id !== mapId));
  };

  const handleSelectMap = (map: GameMap) => {
    sounds.playClick();
    onOpenMap(map);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl backdrop-blur-2xl bg-black/65 border border-white/20 shadow-2xl p-6 text-white overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-indigo-500/15 via-cyan-500/10 to-transparent pointer-events-none"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 relative z-10">
          <div>
            <h2 className="text-xl font-black tracking-tight">Map Editor</h2>
            <p className="text-xs text-neutral-400">Choose how you want to build</p>
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

        {/* 2 Primary Options: New Map vs Open Map */}
        {!showOpenList ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 relative z-10">
            {/* Option 1: New Map */}
            <button
              onClick={() => {
                sounds.playClick();
                onNewMap();
              }}
              className="p-6 rounded-2xl backdrop-blur-xl bg-white/5 hover:bg-white/10 border border-white/15 hover:border-indigo-400/50 flex flex-col items-center text-center transition group shadow-lg cursor-pointer"
            >
              <div className="w-14 h-14 rounded-2xl backdrop-blur-md bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-105 transition">
                <FilePlus className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-white group-hover:text-indigo-200 transition">
                New Map
              </h3>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                Start from scratch with a fresh canvas, place platforms, hazards, and goal flag.
              </p>
              <div className="mt-5 px-4 py-2 rounded-xl backdrop-blur-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold w-full transition">
                Create New
              </div>
            </button>

            {/* Option 2: Open Map */}
            <button
              onClick={() => {
                sounds.playClick();
                setShowOpenList(true);
              }}
              className="p-6 rounded-2xl backdrop-blur-xl bg-white/5 hover:bg-white/10 border border-white/15 hover:border-cyan-400/50 flex flex-col items-center text-center transition group shadow-lg cursor-pointer"
            >
              <div className="w-14 h-14 rounded-2xl backdrop-blur-md bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-105 transition">
                <FolderOpen className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-white group-hover:text-cyan-200 transition">
                Open Map
              </h3>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                Open and continue editing an old map you have already made in your storage.
              </p>
              <div className="mt-5 px-4 py-2 rounded-xl backdrop-blur-md bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold w-full flex items-center justify-center gap-1.5 transition">
                <span>Browse Saved ({localMaps.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </button>
          </div>
        ) : (
          /* Open Saved Map List View */
          <div className="mt-5 relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Your Saved Maps ({localMaps.length})
              </span>
              <button
                onClick={() => {
                  sounds.playClick();
                  setShowOpenList(false);
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-bold transition cursor-pointer"
              >
                Back to Options
              </button>
            </div>

            {localMaps.length === 0 ? (
              <div className="p-8 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 text-center flex flex-col items-center">
                <div className="p-3 rounded-xl bg-white/10 text-neutral-400 mb-3">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-neutral-200">No saved maps found in storage</p>
                <p className="text-xs text-neutral-400 mt-1 mb-4">
                  You have not created any maps yet. Start a new one!
                </p>
                <button
                  onClick={() => {
                    sounds.playClick();
                    onNewMap();
                  }}
                  className="px-4 py-2 rounded-xl backdrop-blur-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
                >
                  Create New Map
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                {localMaps.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => handleSelectMap(m)}
                    className="p-3.5 rounded-2xl backdrop-blur-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-400/50 flex items-center justify-between gap-3 transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 rounded-xl backdrop-blur-md bg-white/10 border border-white/15 text-indigo-300 shrink-0">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white group-hover:text-indigo-200 truncate">
                          {m.title || 'Untitled Map'}
                        </h4>
                        <div className="flex items-center gap-2.5 text-[11px] text-neutral-400 mt-0.5">
                          <span>{m.elements.length} elements</span>
                          <span>·</span>
                          <span>{m.theme || 'Grassland'}</span>
                          <span>·</span>
                          <span className="font-mono text-neutral-500">{m.id}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => handleDeleteSavedMap(e, m.id)}
                        className="p-2 rounded-xl backdrop-blur-md bg-white/5 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 border border-transparent hover:border-rose-500/30 transition cursor-pointer"
                        title="Delete from storage"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="px-3 py-1.5 rounded-xl backdrop-blur-md bg-indigo-600 group-hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 transition">
                        <span>Open</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
