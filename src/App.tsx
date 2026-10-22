import React, { useState, useEffect, useCallback } from 'react';
import { GameMap, AvatarConfig, AppView } from './types';
import { TitleScreen } from './components/TitleScreen';
import { LevelEditor } from './components/LevelEditor';
import { GameCanvas } from './components/GameCanvas';
import { ExploreView } from './components/ExploreView';
import { VictoryModal } from './components/VictoryModal';
import { AddonRequirementModal } from './components/AddonRequirementModal';
import { MultiplayerModal } from './components/MultiplayerModal';
import { MultiplayerVictoryModal } from './components/MultiplayerVictoryModal';
import { isHalloweenEnabled } from './services/addonService';
import { DEFAULT_MAPS } from './services/defaultMaps';
import { fetchMapById, incrementMapPlays, incrementMapClears, saveLocalMap, getRandomMap, fetchAllExploreMaps } from './services/mapStorage';
import {
  PartyData,
  subscribeToParty,
  startPartyGame,
  returnPartyToLobby,
  leaveParty,
  getPartyPlayerId,
  updatePartySettings,
} from './services/partyService';
import { testConnection } from './firebase';

const AVATAR_STORAGE_KEY = 'cag_player_avatar';

export default function App() {
  // Player avatar state (White square by default per prompt)
  const [avatar, setAvatar] = useState<AvatarConfig>(() => {
    try {
      const saved = localStorage.getItem(AVATAR_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      name: 'White Square',
      color: '#ffffff',
      eyeStyle: 'normal',
      hat: 'none',
      trail: 'none',
    };
  });

  // App navigation state
  const [currentView, setCurrentView] = useState<AppView>('title');
  const [activeMap, setActiveMap] = useState<GameMap>(DEFAULT_MAPS[0]);
  const [editorMap, setEditorMap] = useState<GameMap | null>(null);
  const [isVerificationMode, setIsVerificationMode] = useState(false);
  const [requiredAddonMap, setRequiredAddonMap] = useState<GameMap | null>(null);

  // Multiplayer party state
  const [activeParty, setActiveParty] = useState<PartyData | null>(null);
  const [showMultiplayerModal, setShowMultiplayerModal] = useState(false);
  const [initialPartyCode, setInitialPartyCode] = useState<string | null>(null);
  const [showNextMapPicker, setShowNextMapPicker] = useState(false);
  const [allMapsList, setAllMapsList] = useState<GameMap[]>([]);

  // Victory modal state
  const [victoryData, setVictoryData] = useState<{
    show: boolean;
    clearTimeMs: number;
    deaths: number;
  } | null>(null);

  // Save avatar changes to localStorage
  const handleUpdateAvatar = (updated: AvatarConfig) => {
    setAvatar(updated);
    try {
      localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  // Test Firebase connection on initial mount
  useEffect(() => {
    testConnection().then((connected) => {
      if (connected) {
        console.log('Connected to Firebase Firestore successfully.');
      }
    });
  }, []);

  const startPlaying = (map: GameMap) => {
    setActiveMap(map);
    setIsVerificationMode(false);
    setVictoryData(null);
    setCurrentView('play');
    window.location.hash = `/play/${map.id}`;
    incrementMapPlays(map.id);
  };

  // Launch Map in Play mode with Addon requirement verification
  const handlePlayMap = (map: GameMap) => {
    const requiresHalloween =
      map.theme === 'Halloween' ||
      (map.elements && map.elements.some((e) => e.type === 'pumpkin' || e.type === 'jackolantern'));

    if (requiresHalloween && !isHalloweenEnabled()) {
      setRequiredAddonMap(map);
      return;
    }

    startPlaying(map);
  };

  // Handle URL Hash navigation: #/play/[id], #/party/join/[code], or ?party=[code]
  const handleHashChange = useCallback(async () => {
    const hash = window.location.hash;
    const urlParams = new URLSearchParams(window.location.search);
    let targetId: string | null = null;

    // Detect party join URL: #/party/join/ABCDE or /party/join/ABCDE or ?party=ABCDE
    const partyMatch =
      hash.match(/party\/join\/([A-Za-z0-9]{5})/i) ||
      window.location.pathname.match(/party\/join\/([A-Za-z0-9]{5})/i) ||
      (urlParams.get('party') ? [null, urlParams.get('party')] : null);

    if (partyMatch && partyMatch[1]) {
      const code = partyMatch[1].toUpperCase();
      setInitialPartyCode(code);
      setShowMultiplayerModal(true);
      return;
    }

    if (hash.startsWith('#/play/')) {
      targetId = hash.replace('#/play/', '').trim();
    } else if (hash.startsWith('#play/')) {
      targetId = hash.replace('#play/', '').trim();
    } else if (urlParams.get('play')) {
      targetId = urlParams.get('play')!.trim();
    }

    if (targetId) {
      const map = await fetchMapById(targetId);
      if (map) {
        handlePlayMap(map);
      }
    }
  }, []);

  useEffect(() => {
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [handleHashChange]);

  // Subscribe to real-time party changes
  useEffect(() => {
    if (!activeParty?.id) return;
    const unsub = subscribeToParty(
      activeParty.id,
      (updatedParty) => {
        setActiveParty(updatedParty);

        // When host starts match, transition to game view automatically
        if (updatedParty.status === 'playing') {
          if (currentView !== 'play') {
            setActiveMap(updatedParty.mapData);
            setCurrentView('play');
            setShowMultiplayerModal(false);
          } else if (activeMap.id !== updatedParty.mapData.id) {
            setActiveMap(updatedParty.mapData);
          }
        }
        // When host returns to lobby/homescreen, transition both players back to party homescreen
        else if (updatedParty.status === 'waiting') {
          setCurrentView((prev) => (prev === 'play' ? 'title' : prev));
          setShowMultiplayerModal(true);
        }
        // When host leaves and closes the party
        else if (updatedParty.status === 'closed') {
          setActiveParty(null);
          setShowMultiplayerModal(false);
          if (currentView === 'play') {
            setCurrentView('title');
          }
        }
      },
      (err) => {
        console.warn('Party sync update notice:', err);
      }
    );
    return () => unsub();
  }, [activeParty?.id, currentView]);

  // Leave active party cleanly
  const handleLeaveParty = useCallback(async () => {
    if (!activeParty) return;
    const myId = getPartyPlayerId();
    const isHost = activeParty.hostId === myId;
    await leaveParty(activeParty.id, isHost);
    setActiveParty(null);
    setShowMultiplayerModal(false);
    if (currentView === 'play') {
      window.location.hash = '';
      setCurrentView('title');
    }
  }, [activeParty, currentView]);

  // Play a random existing map and continue playing another
  const handlePlayRandomMap = useCallback(async (excludeId?: string) => {
    const randomMap = await getRandomMap(excludeId);
    handlePlayMap(randomMap);
  }, []);

  const handlePlayAnotherInGame = useCallback(() => {
    handlePlayRandomMap(activeMap.id);
  }, [handlePlayRandomMap, activeMap.id]);

  const handleExitGame = useCallback(() => {
    if (activeParty) {
      handleLeaveParty();
    } else if (isVerificationMode) {
      setCurrentView('editor');
    } else {
      window.location.hash = '';
      setCurrentView('title');
    }
  }, [activeParty, handleLeaveParty, isVerificationMode]);

  // Keyboard shortcut: when user presses 'k' or 'K' on title screen, pick random map and play
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.key === 'k' || e.key === 'K') {
        if (currentView === 'title') {
          e.preventDefault();
          handlePlayRandomMap();
        } else if (currentView === 'play' && !isVerificationMode) {
          e.preventDefault();
          handlePlayRandomMap(activeMap.id);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentView, isVerificationMode, activeMap.id, handlePlayRandomMap]);

  // Launch Map in Verification mode from Editor
  const handleTestPlayFromEditor = (map: GameMap, verification: boolean) => {
    setEditorMap(map);
    setActiveMap(map);
    setIsVerificationMode(verification);
    setVictoryData(null);
    setCurrentView('play');
  };

  // Level Cleared Handler
  const handleVictory = useCallback((clearTimeMs: number, deaths: number) => {
    if (isVerificationMode && editorMap) {
      // Mark level as verified!
      const verifiedMap: GameMap = {
        ...editorMap,
        verified: true,
        verifiedTimeMs: clearTimeMs,
      };
      setEditorMap(verifiedMap);
      saveLocalMap(verifiedMap);
    } else if (!isVerificationMode) {
      incrementMapClears(activeMap.id);
    }

    setVictoryData({
      show: true,
      clearTimeMs,
      deaths,
    });
  }, [isVerificationMode, editorMap, activeMap.id]);

  return (
    <div className={`w-screen h-screen ${currentView === 'explore' ? 'overflow-y-auto' : 'overflow-hidden'} bg-black font-sans`}>
      {/* 1. Title / Home Screen */}
      {currentView === 'title' && (
        <TitleScreen
          avatar={avatar}
          onUpdateAvatar={handleUpdateAvatar}
          onStartEditor={(mapToOpen?: GameMap | null) => {
            setEditorMap(mapToOpen || null);
            setCurrentView('editor');
          }}
          onExplore={() => {
            setCurrentView('explore');
          }}
          onPlayRandom={() => {
            handlePlayRandomMap();
          }}
          onOpenMultiplayer={() => {
            setShowMultiplayerModal(true);
          }}
          onPlayMap={handlePlayMap}
        />
      )}

      {/* 2. Map Editor */}
      {currentView === 'editor' && (
        <LevelEditor
          initialMap={editorMap}
          avatar={avatar}
          onExit={() => {
            window.location.hash = '';
            setCurrentView('title');
          }}
          onTestPlay={(mapToTest, verification) => {
            handleTestPlayFromEditor(mapToTest, verification);
          }}
        />
      )}

      {/* 3. Game Play Screen */}
      {currentView === 'play' && (
        <GameCanvas
          map={activeMap}
          avatar={avatar}
          isVerificationMode={isVerificationMode}
          party={activeParty}
          onLeaveParty={handleLeaveParty}
          onSelectPartyMap={() => {
            setCurrentView('title');
            setShowMultiplayerModal(true);
          }}
          onVictory={handleVictory}
          onPlayAnother={handlePlayAnotherInGame}
          onExit={handleExitGame}
        />
      )}

      {/* 4. Explore Community Maps */}
      {currentView === 'explore' && (
        <ExploreView
          avatar={avatar}
          onPlayMap={handlePlayMap}
          onBack={() => {
            window.location.hash = '';
            setCurrentView('title');
          }}
          onEditMap={(mapToEdit) => {
            setEditorMap(mapToEdit);
            setCurrentView('editor');
          }}
        />
      )}

      {/* Multiplayer Party Lobby Modal */}
      {showMultiplayerModal && (
        <MultiplayerModal
          avatar={avatar}
          initialPartyCode={initialPartyCode}
          currentParty={activeParty}
          onPartyUpdate={(party) => {
            setActiveParty(party);
            if (!party) {
              setInitialPartyCode(null);
            }
          }}
          onStartGame={(party) => {
            setActiveMap(party.mapData);
            setCurrentView('play');
            setShowMultiplayerModal(false);
          }}
          onClose={() => {
            setShowMultiplayerModal(false);
          }}
        />
      )}

      {/* Multiplayer Round Victory / Results Modal */}
      {activeParty && activeParty.status === 'ended' && (
        <MultiplayerVictoryModal
          party={activeParty}
          results={
            activeParty.results || {
              hostFinished: true,
              guestFinished: true,
              mode: activeParty.gameMode,
              endedAt: Date.now(),
            }
          }
          isHost={activeParty.hostId === getPartyPlayerId()}
          onPlayAgain={async () => {
            await startPartyGame(activeParty.id);
          }}
          onSelectNextMap={async () => {
            await returnPartyToLobby(activeParty.id);
            setCurrentView('title');
            setShowMultiplayerModal(true);
          }}
          onBackToLobby={async () => {
            await returnPartyToLobby(activeParty.id);
            setCurrentView('title');
            setShowMultiplayerModal(true);
          }}
          onLeaveParty={handleLeaveParty}
        />
      )}

      {/* Host Next Map Picker Modal */}
      {showNextMapPicker && activeParty && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-md rounded-3xl backdrop-blur-2xl bg-neutral-900/90 border border-white/20 shadow-2xl overflow-hidden flex flex-col text-white max-h-[80vh]">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between backdrop-blur-xl bg-black/40">
              <h3 className="text-sm font-black text-white">Select Next Map</h3>
              <button
                onClick={() => setShowNextMapPicker(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-2 overflow-y-auto">
              {allMapsList.map((map) => (
                <div
                  key={map.id}
                  onClick={async () => {
                    setShowNextMapPicker(false);
                    await updatePartySettings(activeParty.id, {
                      mapData: map,
                      mapId: map.id,
                    });
                    await startPartyGame(activeParty.id);
                  }}
                  className="p-3 rounded-2xl backdrop-blur-xl border border-white/10 bg-black/40 hover:bg-black/60 cursor-pointer flex items-center justify-between transition"
                >
                  <div>
                    <div className="text-xs font-black text-white">{map.title}</div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">
                      Theme: {map.theme || 'Grassland'} · By {map.authorName || 'Creator'}
                    </div>
                  </div>
                  <span className="text-xs text-emerald-400 font-bold">Play</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Solo Victory Modal Overlay */}
      {!activeParty && victoryData?.show && (
        <VictoryModal
          map={activeMap}
          clearTimeMs={victoryData.clearTimeMs}
          deaths={victoryData.deaths}
          isVerificationMode={isVerificationMode}
          onReplay={() => {
            setVictoryData(null);
          }}
          onPlayAnother={() => {
            setVictoryData(null);
            handlePlayRandomMap(activeMap.id);
          }}
          onBackToMenu={() => {
            setVictoryData(null);
            window.location.hash = '';
            setCurrentView('explore');
          }}
          onContinueToPublish={() => {
            setVictoryData(null);
            setCurrentView('editor');
          }}
        />
      )}

      {/* Required Addon Intercept Modal */}
      {requiredAddonMap && (
        <AddonRequirementModal
          map={requiredAddonMap}
          onProceed={() => {
            const target = requiredAddonMap;
            setRequiredAddonMap(null);
            startPlaying(target);
          }}
          onClose={() => setRequiredAddonMap(null)}
        />
      )}
    </div>
  );
}
