import React, { useState, useEffect } from 'react';
import { GameMap, AvatarConfig } from '../types';
import {
  fetchAllExploreMaps,
  likeMap,
  hasLikedMap,
  exportMapToCagFile,
  getMyCreatorId,
  getLocalMaps,
  deleteMapFromEverywhere,
} from '../services/mapStorage';
import { sounds } from '../services/sound';
import {
  Compass,
  Search,
  Play,
  Heart,
  Share2,
  Download,
  RotateCw,
  ArrowLeft,
  Sparkles,
  Check,
  CheckCircle2,
  User,
  Layers,
  Trash2,
} from 'lucide-react';
import { ProfileModal } from './ProfileModal';

interface ExploreViewProps {
  avatar: AvatarConfig;
  onPlayMap: (map: GameMap) => void;
  onBack: () => void;
  onEditMap?: (map: GameMap) => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  avatar,
  onPlayMap,
  onBack,
  onEditMap,
}) => {
  const [maps, setMaps] = useState<GameMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [directId, setDirectId] = useState('');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'mine'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All');
  const [themeFilter, setThemeFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'plays' | 'likes'>('newest');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mapToDelete, setMapToDelete] = useState<GameMap | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const myCreatorId = getMyCreatorId();

  const handleDeleteMap = (e: React.MouseEvent, mapItem: GameMap) => {
    e.stopPropagation();
    sounds.playClick();
    setMapToDelete(mapItem);
  };

  const confirmDelete = async () => {
    if (!mapToDelete) return;
    setIsDeleting(true);
    sounds.playErase();
    await deleteMapFromEverywhere(mapToDelete.id);
    setMaps((prev) => prev.filter((m) => m.id !== mapToDelete.id));
    setIsDeleting(false);
    setMapToDelete(null);
  };

  const loadMaps = async () => {
    setLoading(true);
    try {
      const results = await fetchAllExploreMaps();
      setMaps(results);
    } catch {
      // Fallback handled in mapStorage
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaps();
  }, []);

  const handleLike = async (e: React.MouseEvent, mapId: string) => {
    e.stopPropagation();
    sounds.playCoin();
    const success = await likeMap(mapId);
    if (success) {
      setMaps((prev) =>
        prev.map((m) => (m.id === mapId ? { ...m, likesCount: (m.likesCount || 0) + 1 } : m))
      );
    }
  };

  const handleCopyLink = (e: React.MouseEvent, mapId: string) => {
    e.stopPropagation();
    sounds.playClick();
    const url = `${window.location.origin}${window.location.pathname}#/play/${mapId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(mapId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDirectJump = () => {
    if (!directId.trim()) return;
    sounds.playClick();
    const cleanId = directId.trim();
    const matched = maps.find((m) => m.id.toLowerCase() === cleanId.toLowerCase());
    if (matched) {
      onPlayMap(matched);
    } else {
      window.location.hash = `/play/${cleanId}`;
    }
  };

  const localMapIds = new Set(getLocalMaps().map((m) => m.id));

  const isUserMap = (mapItem: GameMap) => {
    return (
      mapItem.authorId === myCreatorId ||
      localMapIds.has(mapItem.id) ||
      (mapItem.authorName && avatar.name && mapItem.authorName.toLowerCase() === avatar.name.toLowerCase())
    );
  };

  // Filter & Sort
  const filteredMaps = maps
    .filter((m) => {
      // Never show other people's unverified drafts
      if (!m.verified && !isUserMap(m)) {
        return false;
      }

      // Scope Filter (All vs My Maps)
      if (scopeFilter === 'mine' && !isUserMap(m)) {
        return false;
      }

      const q = searchQuery.toLowerCase();
      const matchesSearch =
        m.title.toLowerCase().includes(q) ||
        (m.authorName && m.authorName.toLowerCase().includes(q)) ||
        m.id.toLowerCase().includes(q);
      const matchesDiff = difficultyFilter === 'All' || m.difficulty === difficultyFilter;
      const matchesTheme = themeFilter === 'All' || m.theme === themeFilter;
      return matchesSearch && matchesDiff && matchesTheme;
    })
    .sort((a, b) => {
      if (sortBy === 'plays') return (b.playCount || 0) - (a.playCount || 0);
      if (sortBy === 'likes') return (b.likesCount || 0) - (a.likesCount || 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const myMapsCount = maps.filter(isUserMap).length;

  return (
    <div className="w-full h-full min-h-screen overflow-y-auto bg-neutral-950 text-white flex flex-col pb-24">
      {/* Top Bar */}
      <header className="border-b border-white/10 bg-black/60 backdrop-blur-2xl px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sounds.playClick();
              onBack();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-400" />
            <h1 className="text-lg font-bold tracking-tight">Explore Community Maps</h1>
          </div>
        </div>

        {/* Jump Straight In Input */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              value={directId}
              onChange={(e) => setDirectId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleDirectJump()}
              placeholder="Enter Map ID (e.g. CAG-XXXXX)..."
              className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 w-52 sm:w-60 font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            onClick={handleDirectJump}
            disabled={!directId.trim()}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Jump In</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              loadMaps();
            }}
            title="Refresh map list"
            className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto w-full px-6 py-6 flex flex-col gap-4">
        {/* Scope Tabs: All Maps vs My Maps */}
        <div className="flex items-center gap-2 pb-2 border-b border-neutral-800">
          <button
            onClick={() => {
              sounds.playClick();
              setScopeFilter('all');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              scopeFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Published Maps ({maps.length})</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setScopeFilter('mine');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              scopeFilter === 'mine'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            <User className="w-3.5 h-3.5 text-amber-400" />
            <span>My Created Maps ({myMapsCount})</span>
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by map name, creator, or ID..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Difficulty Filter */}
          <div className="md:col-span-2">
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-neutral-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Normal">Normal</option>
              <option value="Hard">Hard</option>
              <option value="Insane">Insane</option>
            </select>
          </div>

          {/* Theme Filter */}
          <div className="md:col-span-2">
            <select
              value={themeFilter}
              onChange={(e) => setThemeFilter(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-neutral-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Themes</option>
              <option value="Grassland">Grassland</option>
              <option value="Volcano">Volcano</option>
              <option value="Cyber">Cyber</option>
              <option value="Underground">Underground</option>
              <option value="Halloween">Halloween</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="md:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'plays' | 'likes')}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-neutral-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="plays">Sort: Most Played</option>
              <option value="likes">Sort: Most Liked</option>
            </select>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-neutral-400 pt-2 border-t border-neutral-900">
          <span>
            Showing <strong className="text-white">{filteredMaps.length}</strong> maps
            {scopeFilter === 'mine' ? ' created by you' : ''}
          </span>
          <span className="text-neutral-500">Accurate live plays and clears</span>
        </div>

        {/* Maps Grid */}
        {loading ? (
          <div className="py-24 text-center text-neutral-500 text-sm">
            <RotateCw className="w-8 h-8 mx-auto animate-spin mb-3 text-indigo-400" />
            Loading community maps from cloud...
          </div>
        ) : filteredMaps.length === 0 ? (
          <div className="py-20 text-center text-neutral-400 text-sm bg-neutral-900/40 rounded-2xl border border-neutral-800 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500 text-xl font-bold">
              ?
            </div>
            <div>
              {scopeFilter === 'mine'
                ? "You haven't created or published any maps yet. Open the Map Editor to build and beat your first course!"
                : 'No maps found matching your filters.'}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMaps.map((mapItem) => {
              const liked = hasLikedMap(mapItem.id);
              const isMine = isUserMap(mapItem);
              const clearPercent =
                mapItem.playCount && mapItem.playCount > 0
                  ? Math.round(((mapItem.clearCount || 0) / mapItem.playCount) * 100)
                  : 0;

              return (
                <div
                  key={mapItem.id}
                  onClick={() => {
                    sounds.playClick();
                    onPlayMap(mapItem);
                  }}
                  className={`backdrop-blur-xl border rounded-3xl p-5 flex flex-col justify-between transition group hover:shadow-2xl cursor-pointer relative overflow-hidden ${
                    isMine
                      ? 'border-indigo-400/70 bg-indigo-950/25 shadow-lg shadow-indigo-500/10'
                      : 'border-white/10 bg-black/45 hover:border-indigo-400/40 hover:bg-black/60'
                  }`}
                >
                  {/* Theme Accent Border Top */}
                  <div
                    className="absolute top-0 inset-x-0 h-1.5"
                    style={{
                      backgroundColor:
                        mapItem.theme === 'Volcano'
                          ? '#ef4444'
                          : mapItem.theme === 'Cyber'
                          ? '#06b6d4'
                          : mapItem.theme === 'Underground'
                          ? '#64748b'
                          : mapItem.theme === 'Halloween'
                          ? '#f97316'
                          : '#22c55e',
                    }}
                  ></div>

                  <div>
                    {/* Header: Title, My Map Badge & CAG ID */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-base text-white group-hover:text-indigo-300 transition line-clamp-1">
                            {mapItem.title}
                          </h3>
                        </div>
                      </div>
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-neutral-800 text-indigo-300 border border-neutral-700 shrink-0">
                        {mapItem.id}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-400 line-clamp-2 mb-4">
                      {mapItem.description || 'A platformer challenge crafted in Createagame.'}
                    </p>

                    {/* Metadata tags */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-4">
                      {isMine && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-extrabold flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          YOUR MAP
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-[11px] font-medium text-neutral-300">
                        {mapItem.difficulty}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-[11px] font-medium text-neutral-300">
                        {mapItem.theme}
                      </span>
                      {mapItem.verified ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[11px] font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[11px] font-medium">
                          Draft / Unverified
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    {/* Accurate Real Stats Row */}
                    <div className="flex items-center justify-between text-xs text-neutral-400 pt-3 border-t border-neutral-800/80 mb-3">
                      <div>
                        {isMine ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProfileId(myCreatorId);
                            }}
                            className="text-indigo-300 hover:text-indigo-200 font-semibold flex items-center gap-1 cursor-pointer transition"
                            title="View your profile"
                          >
                            <User className="w-3 h-3" />
                            <span>Created by You ({avatar.name})</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (mapItem.authorId) {
                                setSelectedProfileId(mapItem.authorId);
                              }
                            }}
                            className="text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer transition"
                            title={`View ${mapItem.authorName || 'creator'}'s public profile`}
                          >
                            <User className="w-3 h-3 text-neutral-500" />
                            <span>By {mapItem.authorName || 'Community Creator'}</span>
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-3 tabular-nums">
                        <span title="Actual plays">Plays: {mapItem.playCount || 0}</span>
                        <span title="Actual clears">
                          Clears: {mapItem.clearCount || 0}
                          {mapItem.playCount && mapItem.playCount > 0 ? ` (${clearPercent}%)` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="flex items-center gap-2">
                      {/* Play Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sounds.playClick();
                          onPlayMap(mapItem);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 group-hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Play Challenge</span>
                      </button>

                      {/* Edit Button if your own map */}
                      {isMine && onEditMap && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            sounds.playClick();
                            onEditMap(mapItem);
                          }}
                          title="Open in Map Editor"
                          className="px-2.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-neutral-700 text-xs font-bold transition cursor-pointer"
                        >
                          Edit
                        </button>
                      )}

                      {/* Delete Button if your own map */}
                      {isMine && (
                        <button
                          onClick={(e) => handleDeleteMap(e, mapItem)}
                          title="Delete your map permanently"
                          className="p-2 rounded-xl bg-neutral-800 hover:bg-rose-950/70 text-neutral-400 hover:text-rose-400 border border-neutral-700 hover:border-rose-800 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Like Button */}
                      <button
                        onClick={(e) => handleLike(e, mapItem.id)}
                        title="Star / Like this level"
                        className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                          liked
                            ? 'bg-rose-950/60 text-rose-400 border-rose-800'
                            : 'bg-neutral-800 text-neutral-300 hover:text-white border-neutral-700'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
                        <span>{mapItem.likesCount || 0}</span>
                      </button>

                      {/* Copy Share Link */}
                      <button
                        onClick={(e) => handleCopyLink(e, mapItem.id)}
                        title="Copy direct share link"
                        className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 transition cursor-pointer"
                      >
                        {copiedId === mapItem.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Share2 className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Download .cag */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sounds.playCoin();
                          exportMapToCagFile(mapItem);
                        }}
                        title="Download .cag file"
                        className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 transition cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-neutral-300" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {mapToDelete && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="backdrop-blur-2xl bg-black/75 border border-white/20 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3 border border-rose-500/30">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Delete This Map?</h3>
            <p className="text-xs text-neutral-400 mb-5">
              Are you sure you want to permanently delete <strong className="text-white">"{mapToDelete.title}"</strong>? This will remove it from Explore and delete it from the cloud.
            </p>
            <div className="flex gap-2 w-full">
              <button
                onClick={() => setMapToDelete(null)}
                className="flex-1 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Delete Map'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Player Profile Modal */}
      {selectedProfileId && (
        <ProfileModal
          targetProfileId={selectedProfileId}
          currentAvatar={avatar}
          onClose={() => setSelectedProfileId(null)}
          onPlayMap={(m) => {
            setSelectedProfileId(null);
            onPlayMap(m);
          }}
        />
      )}
    </div>
  );
};
