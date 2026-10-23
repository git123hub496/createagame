import React, { useState, useEffect, useCallback } from 'react';
import { GameMap, AvatarConfig, AppView } from './types';
import { TitleScreen } from './components/TitleScreen';
import { LevelEditor } from './components/LevelEditor';
import { GameCanvas } from './components/GameCanvas';
import { ExploreView } from './components/ExploreView';
import { AddonView } from './components/AddonView';
import { VictoryModal } from './components/VictoryModal';
import { AddonRequirementModal } from './components/AddonRequirementModal';
import { AuthModal } from './components/AuthModal';
import { TutorialModal } from './components/TutorialModal';
import { isHalloweenEnabled } from './services/addonService';
import { DEFAULT_MAPS } from './services/defaultMaps';
import {
  fetchMapById,
  incrementMapPlays,
  incrementMapClears,
  saveLocalMap,
  getRandomMap,
} from './services/mapStorage';
import { checkCurrentAccountHasPassword } from './services/authService';
import { testConnection } from './firebase';

const AVATAR_STORAGE_KEY = 'cag_player_avatar';

export default function App() {
  // Player avatar state (White square by default)
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

  // Replay key: increments to cleanly re-instantiate GameCanvas with zero lag, fresh timers, and reset to start
  const [gameRunId, setGameRunId] = useState(0);

  // Victory modal state
  const [victoryData, setVictoryData] = useState<{
    show: boolean;
    clearTimeMs: number;
    deaths: number;
  } | null>(null);

  // Authentication & Password Enforcement State
  const [showForcedPasswordModal, setShowForcedPasswordModal] = useState(false);

  // Skippable Tutorial that plays right away
  const [showInitialTutorial, setShowInitialTutorial] = useState(() => {
    try {
      return !localStorage.getItem('cag_tutorial_seen');
    } catch {
      return false;
    }
  });

  // Save avatar changes to localStorage
  const handleUpdateAvatar = (updated: AvatarConfig) => {
    setAvatar(updated);
    try {
      localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  // Navigate helper that updates view and browser URL history
  const navigateTo = useCallback((view: AppView, path?: string) => {
    setCurrentView(view);
    if (path) {
      try {
        window.history.pushState(null, '', path);
      } catch {
        window.location.hash = path;
      }
    }
  }, []);

  // Start playing a map cleanly
  const startPlaying = useCallback((map: GameMap) => {
    setActiveMap(map);
    setIsVerificationMode(false);
    setVictoryData(null);
    setGameRunId((prev) => prev + 1);
    setCurrentView('play');
    try {
      window.history.pushState(null, '', `#/play/${map.id}`);
    } catch {
      window.location.hash = `/play/${map.id}`;
    }
    incrementMapPlays(map.id);
  }, []);

  // Launch Map in Play mode with Addon requirement verification
  const handlePlayMap = useCallback(
    (map: GameMap) => {
      const requiresHalloween =
        map.theme === 'Halloween' ||
        (map.elements &&
          map.elements.some((e) => e.type === 'pumpkin' || e.type === 'jackolantern'));

      if (requiresHalloween && !isHalloweenEnabled()) {
        setRequiredAddonMap(map);
        return;
      }

      startPlaying(map);
    },
    [startPlaying]
  );

  // Handle URL navigation: /explore, /Addon, /Addon/studio, /play/:id
  const syncRouteFromLocation = useCallback(async () => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    const urlParams = new URLSearchParams(window.location.search);

    // 1. Explore route: /explore or #explore or #/explore
    if (path === '/explore' || hash === '#explore' || hash === '#/explore') {
      setCurrentView('explore');
      return;
    }

    // 2. Addon studio route: /Addon/studio or #Addon/studio or #/Addon/studio
    if (
      path === '/Addon/studio' ||
      hash === '#Addon/studio' ||
      hash === '#/Addon/studio' ||
      hash === '#/addon/studio' ||
      path.toLowerCase() === '/addon/studio'
    ) {
      setCurrentView('addon-studio');
      return;
    }

    // 3. Addon catalog route: /Addon or #Addon or #/Addon
    if (
      path === '/Addon' ||
      hash === '#Addon' ||
      hash === '#/Addon' ||
      hash === '#/addon' ||
      path.toLowerCase() === '/addon'
    ) {
      setCurrentView('addon');
      return;
    }

    // 4. Play Map route: /play/:id or #/play/:id or ?play=:id
    let targetId: string | null = null;
    if (path.startsWith('/play/')) {
      targetId = path.replace('/play/', '').trim();
    } else if (hash.startsWith('#/play/')) {
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
  }, [handlePlayMap]);

  useEffect(() => {
    syncRouteFromLocation();
    window.addEventListener('popstate', syncRouteFromLocation);
    window.addEventListener('hashchange', syncRouteFromLocation);
    return () => {
      window.removeEventListener('popstate', syncRouteFromLocation);
      window.removeEventListener('hashchange', syncRouteFromLocation);
    };
  }, [syncRouteFromLocation]);

  // Test Firebase connection & check if password is required on initial mount
  useEffect(() => {
    testConnection().then((connected) => {
      if (connected) {
        console.log('Connected to Firebase Firestore successfully.');
      }
    });

    // Check if account has a password saved to Firebase
    if (sessionStorage.getItem('cag_skip_secure_account') !== 'true') {
      checkCurrentAccountHasPassword().then((res) => {
        if (!res.hasPassword) {
          setShowForcedPasswordModal(true);
        }
      });
    }

    const handleAuthChange = () => {
      if (sessionStorage.getItem('cag_skip_secure_account') !== 'true') {
        checkCurrentAccountHasPassword().then((res) => {
          setShowForcedPasswordModal(!res.hasPassword);
        });
      }
    };

    window.addEventListener('cag_auth_changed', handleAuthChange);
    return () => window.removeEventListener('cag_auth_changed', handleAuthChange);
  }, []);

  // Play a random existing map
  const handlePlayRandomMap = useCallback(
    async (excludeId?: string) => {
      const randomMap = await getRandomMap(excludeId);
      handlePlayMap(randomMap);
    },
    [handlePlayMap]
  );

  const handlePlayAnotherInGame = useCallback(() => {
    handlePlayRandomMap(activeMap.id);
  }, [handlePlayRandomMap, activeMap.id]);

  // Clean Replay current map: resets player to start point and restarts game loop fresh
  const handleReplayCurrentMap = useCallback(() => {
    setVictoryData(null);
    setGameRunId((prev) => prev + 1);
  }, []);

  const handleExitGame = useCallback(() => {
    if (isVerificationMode) {
      setCurrentView('editor');
    } else {
      navigateTo('title', '/');
    }
  }, [isVerificationMode, navigateTo]);

  // Keyboard shortcut: when user presses 'k' or 'K' on title or play screen
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
    setGameRunId((prev) => prev + 1);
    setCurrentView('play');
  };

  // Level Cleared Handler
  const handleVictory = useCallback(
    (clearTimeMs: number, deaths: number) => {
      if (isVerificationMode && editorMap) {
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
    },
    [isVerificationMode, editorMap, activeMap.id]
  );

  return (
    <div
      className={`w-screen h-screen ${
        currentView === 'explore' || currentView === 'addon' || currentView === 'addon-studio'
          ? 'overflow-y-auto'
          : 'overflow-hidden'
      } bg-black font-sans`}
    >
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
            navigateTo('explore', '/explore');
          }}
          onOpenAddon={(studio) => {
            navigateTo(studio ? 'addon-studio' : 'addon', studio ? '/Addon/studio' : '/Addon');
          }}
          onPlayRandom={() => {
            handlePlayRandomMap();
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
            navigateTo('title', '/');
          }}
          onTestPlay={(mapToTest, verification) => {
            handleTestPlayFromEditor(mapToTest, verification);
          }}
        />
      )}

      {/* 3. Game Play Screen (keyed on activeMap.id and gameRunId for guaranteed clean reset to start) */}
      {currentView === 'play' && (
        <GameCanvas
          key={`${activeMap.id}-${gameRunId}`}
          map={activeMap}
          avatar={avatar}
          isVerificationMode={isVerificationMode}
          onVictory={handleVictory}
          onPlayAnother={handlePlayAnotherInGame}
          onExit={handleExitGame}
        />
      )}

      {/* 4. Explore Community Maps (/explore full-screen) */}
      {currentView === 'explore' && (
        <ExploreView
          avatar={avatar}
          onPlayMap={handlePlayMap}
          onBack={() => {
            navigateTo('title', '/');
          }}
          onEditMap={(mapToEdit) => {
            setEditorMap(mapToEdit);
            setCurrentView('editor');
          }}
        />
      )}

      {/* 5. Add-on Studio & Catalog (/Addon and /Addon/studio full-screen) */}
      {(currentView === 'addon' || currentView === 'addon-studio') && (
        <AddonView
          avatar={avatar}
          initialStudioMode={currentView === 'addon-studio'}
          onBack={() => {
            navigateTo('title', '/');
          }}
          onNavigateToStudio={() => {
            navigateTo('addon-studio', '/Addon/studio');
          }}
          onNavigateToBrowse={() => {
            navigateTo('addon', '/Addon');
          }}
        />
      )}

      {/* Victory Modal Overlay with Replay */}
      {victoryData?.show && (
        <VictoryModal
          map={activeMap}
          clearTimeMs={victoryData.clearTimeMs}
          deaths={victoryData.deaths}
          isVerificationMode={isVerificationMode}
          onReplay={handleReplayCurrentMap}
          onPlayAnother={() => {
            setVictoryData(null);
            handlePlayRandomMap(activeMap.id);
          }}
          onBackToMenu={() => {
            setVictoryData(null);
            navigateTo('explore', '/explore');
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

      {/* Immediate Skippable Tutorial on First Boot */}
      {showInitialTutorial && (
        <TutorialModal onClose={() => setShowInitialTutorial(false)} />
      )}

      {/* Password Requirement (Secure your account! Add a password now.) with Skippable X */}
      {showForcedPasswordModal && (
        <AuthModal
          initialMode="secure"
          forcedSecure={false}
          onClose={() => {
            setShowForcedPasswordModal(false);
            sessionStorage.setItem('cag_skip_secure_account', 'true');
          }}
          onAuthenticated={() => {
            setShowForcedPasswordModal(false);
          }}
        />
      )}
    </div>
  );
}
