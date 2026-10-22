import { doc, getDoc, setDoc, updateDoc, increment, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { GameMap, LevelElement } from '../types';
import { DEFAULT_MAPS } from './defaultMaps';

const LOCAL_MAPS_KEY = 'cag_local_saved_maps';
const LIKED_MAPS_KEY = 'cag_liked_maps';
const CREATOR_ID_KEY = 'cag_my_creator_id';

// White Square is available, any name is permitted
export function isForbiddenPlayerName(_name: string | undefined): boolean {
  return false;
}

// Stable anonymous ID representing this browser / storage device (no account required)
export function getMyCreatorId(): string {
  let id = localStorage.getItem(CREATOR_ID_KEY);
  if (!id) {
    id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    localStorage.setItem(CREATOR_ID_KEY, id);
  }
  return id;
}

// Generate a clean 6-character CAG ID e.g. CAG-4K9TZ
export function generateMapId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CAG-${code}`;
}

export function getLocalMaps(): GameMap[] {
  try {
    const raw = localStorage.getItem(LOCAL_MAPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalMap(map: GameMap) {
  try {
    const maps = getLocalMaps();
    const idx = maps.findIndex((m) => m.id === map.id);
    if (idx >= 0) {
      maps[idx] = map;
    } else {
      maps.unshift(map);
    }
    localStorage.setItem(LOCAL_MAPS_KEY, JSON.stringify(maps));
    // Trigger background sync to cloud without requiring an account
    syncMapToCloud(map).catch(() => {});
  } catch (err) {
    console.error('Failed to save to local cache', err);
  }
}

// Sync single map to cloud without requiring an account
export async function syncMapToCloud(map: GameMap): Promise<string> {
  const mapId = map.id && map.id.startsWith('CAG-') ? map.id : generateMapId();
  const myCreatorId = getMyCreatorId();

  try {
    const ref = doc(db, 'maps', mapId);
    await setDoc(
      ref,
      {
        title: (map.title || 'Untitled Map').slice(0, 60),
        description: (map.description || '').slice(0, 240),
        authorName: (map.authorName || 'White Square').slice(0, 32),
        authorId: myCreatorId,
        elementsJson: JSON.stringify(map.elements),
        verified: Boolean(map.verified),
        verifiedTimeMs: map.verifiedTimeMs || 0,
        playCount: map.playCount || 0,
        clearCount: map.clearCount || 0,
        likesCount: map.likesCount || 0,
        difficulty: map.difficulty || 'Normal',
        theme: map.theme || 'Grassland',
        createdAt: map.createdAt || new Date().toISOString(),
      },
      { merge: true }
    );
    return mapId;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `maps/${mapId}`);
    return mapId;
  }
}

// Sync all maps from storage to cloud
export async function syncLocalMapsToCloud(): Promise<number> {
  const maps = getLocalMaps();
  let synced = 0;
  for (const m of maps) {
    try {
      await syncMapToCloud(m);
      synced++;
    } catch {}
  }
  return synced;
}

export async function publishMapToCloud(map: GameMap): Promise<string> {
  const mapId = map.id && map.id.startsWith('CAG-') ? map.id : generateMapId();
  const myCreatorId = getMyCreatorId();

  const mapData: GameMap = {
    ...map,
    id: mapId,
    authorId: myCreatorId,
    verified: true,
    createdAt: map.createdAt || new Date().toISOString(),
    playCount: map.playCount || 0,
    clearCount: map.clearCount || 0,
    likesCount: map.likesCount || 0,
  };

  // Always save locally first so user immediately sees it in their explore list
  saveLocalMap(mapData);

  try {
    const ref = doc(db, 'maps', mapId);
    await setDoc(ref, {
      title: (mapData.title || 'Untitled Map').slice(0, 60),
      description: (mapData.description || '').slice(0, 240),
      authorName: (mapData.authorName || 'Creator').slice(0, 32),
      authorId: myCreatorId,
      elementsJson: JSON.stringify(mapData.elements),
      verified: true,
      verifiedTimeMs: mapData.verifiedTimeMs || 0,
      playCount: mapData.playCount,
      clearCount: mapData.clearCount,
      likesCount: mapData.likesCount,
      difficulty: mapData.difficulty || 'Normal',
      theme: mapData.theme || 'Grassland',
      createdAt: mapData.createdAt,
    });
    return mapId;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `maps/${mapId}`);
    return mapId;
  }
}

export async function fetchMapById(id: string): Promise<GameMap | null> {
  // 1. Check local maps (fastest & includes offline creations)
  const localMaps = getLocalMaps();
  const localMatch = localMaps.find((m) => m.id.toLowerCase() === id.toLowerCase());

  // 2. Query Firestore
  try {
    const ref = doc(db, 'maps', id);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      const myCreatorId = getMyCreatorId();
      const isVerified = data.verified === true;
      const isMine = data.authorId === myCreatorId;

      // Do not allow other players to view or play someone else's unverified draft
      if (!isVerified && !isMine) {
        return null;
      }

      const elements: LevelElement[] = data.elementsJson ? JSON.parse(data.elementsJson) : [];
      return {
        id: snap.id,
        title: data.title || 'Untitled Map',
        description: data.description || '',
        authorName: data.authorName || 'Creator',
        authorId: data.authorId || 'unknown',
        elements,
        verified: isVerified,
        verifiedTimeMs: data.verifiedTimeMs,
        playCount: data.playCount || 0,
        clearCount: data.clearCount || 0,
        likesCount: data.likesCount || 0,
        difficulty: data.difficulty || 'Normal',
        theme: data.theme || 'Grassland',
        createdAt: data.createdAt || new Date().toISOString(),
      };
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `maps/${id}`);
  }

  // 3. Fallback to local match or built-in
  if (localMatch) return localMatch;
  const builtIn = DEFAULT_MAPS.find((m) => m.id.toLowerCase() === id.toLowerCase());
  return builtIn || null;
}

export async function fetchAllExploreMaps(): Promise<GameMap[]> {
  const mapMap = new Map<string, GameMap>();
  const myCreatorId = getMyCreatorId();

  // 1. Add default built-in maps
  DEFAULT_MAPS.forEach((m) => mapMap.set(m.id, m));

  // 2. Add local created maps
  getLocalMaps().forEach((m) => mapMap.set(m.id, m));

  // 3. Query Firestore cloud maps
  try {
    const colRef = collection(db, 'maps');
    const snap = await getDocs(colRef);
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const isVerified = data.verified === true;
      const isMine = data.authorId === myCreatorId;

      // Do not show other people's unverified drafts
      if (!isVerified && !isMine) {
        return;
      }

      let elements: LevelElement[] = [];
      try {
        elements = data.elementsJson ? JSON.parse(data.elementsJson) : [];
      } catch {
        elements = [];
      }
      mapMap.set(docSnap.id, {
        id: docSnap.id,
        title: data.title || 'Untitled Map',
        description: data.description || '',
        authorName: data.authorName || 'Creator',
        authorId: data.authorId || 'unknown',
        elements,
        verified: isVerified,
        verifiedTimeMs: data.verifiedTimeMs,
        playCount: data.playCount || 0,
        clearCount: data.clearCount || 0,
        likesCount: data.likesCount || 0,
        difficulty: data.difficulty || 'Normal',
        theme: data.theme || 'Grassland',
        createdAt: data.createdAt || new Date().toISOString(),
      });
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'maps');
  }

  return Array.from(mapMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// Select a random map from all existing maps (built-in, local storage, cloud)
export async function getRandomMap(excludeId?: string): Promise<GameMap> {
  let allMaps: GameMap[] = [];
  try {
    allMaps = await fetchAllExploreMaps();
  } catch {
    allMaps = [...DEFAULT_MAPS, ...getLocalMaps()];
  }

  if (!allMaps || allMaps.length === 0) {
    allMaps = [...DEFAULT_MAPS];
  }

  // If there are multiple maps, avoid picking the exact same one if possible
  const pool =
    allMaps.length > 1 && excludeId
      ? allMaps.filter((m) => m.id !== excludeId)
      : allMaps;

  const chosenPool = pool.length > 0 ? pool : allMaps;
  const randomIndex = Math.floor(Math.random() * chosenPool.length);
  return chosenPool[randomIndex];
}

// Track accurate real plays
export async function incrementMapPlays(mapId: string) {
  // Update local storage copy
  try {
    const maps = getLocalMaps();
    const m = maps.find((x) => x.id === mapId);
    if (m) {
      m.playCount = (m.playCount || 0) + 1;
      localStorage.setItem(LOCAL_MAPS_KEY, JSON.stringify(maps));
    }
  } catch {}

  // Update Firestore
  try {
    const ref = doc(db, 'maps', mapId);
    await updateDoc(ref, {
      playCount: increment(1),
    });
  } catch {}
}

// Track accurate real clears
export async function incrementMapClears(mapId: string) {
  // Update local storage copy
  try {
    const maps = getLocalMaps();
    const m = maps.find((x) => x.id === mapId);
    if (m) {
      m.clearCount = (m.clearCount || 0) + 1;
      localStorage.setItem(LOCAL_MAPS_KEY, JSON.stringify(maps));
    }
  } catch {}

  // Update Firestore
  try {
    const ref = doc(db, 'maps', mapId);
    await updateDoc(ref, {
      clearCount: increment(1),
    });
  } catch {}
}

export function hasLikedMap(mapId: string): boolean {
  try {
    const liked = JSON.parse(localStorage.getItem(LIKED_MAPS_KEY) || '[]');
    return liked.includes(mapId);
  } catch {
    return false;
  }
}

export async function likeMap(mapId: string): Promise<boolean> {
  if (hasLikedMap(mapId)) return false;
  try {
    const liked = JSON.parse(localStorage.getItem(LIKED_MAPS_KEY) || '[]');
    liked.push(mapId);
    localStorage.setItem(LIKED_MAPS_KEY, JSON.stringify(liked));

    // Update local cache
    const maps = getLocalMaps();
    const m = maps.find((x) => x.id === mapId);
    if (m) {
      m.likesCount = (m.likesCount || 0) + 1;
      localStorage.setItem(LOCAL_MAPS_KEY, JSON.stringify(maps));
    }

    // Update Firestore
    const ref = doc(db, 'maps', mapId);
    await updateDoc(ref, {
      likesCount: increment(1),
    });
    return true;
  } catch {
    return true;
  }
}

// Permanently delete a map from Firestore and local cache
export async function deleteMapFromEverywhere(mapId: string): Promise<boolean> {
  // 1. Remove from local cache
  try {
    const maps = getLocalMaps();
    const updated = maps.filter((m) => m.id !== mapId);
    localStorage.setItem(LOCAL_MAPS_KEY, JSON.stringify(updated));
  } catch {}

  // 2. Remove from Firestore cloud
  try {
    const ref = doc(db, 'maps', mapId);
    await deleteDoc(ref);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `maps/${mapId}`);
  }

  return true;
}

// Export Map as .cag file
export function exportMapToCagFile(map: GameMap) {
  const exportData = {
    cagFormatVersion: '1.0',
    app: 'Createagame',
    timestamp: new Date().toISOString(),
    map: {
      id: map.id,
      title: map.title,
      description: map.description,
      authorName: map.authorName,
      difficulty: map.difficulty,
      theme: map.theme,
      verified: map.verified,
      verifiedTimeMs: map.verifiedTimeMs,
      elements: map.elements,
    },
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const sanitizedTitle = map.title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase() || 'level';
  a.href = url;
  a.download = `${sanitizedTitle}.cag`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Import Map from .cag file
export async function importMapFromCagFile(file: File): Promise<GameMap> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        const mapData = parsed.map || parsed;

        if (!mapData.title || !Array.isArray(mapData.elements)) {
          throw new Error('Invalid .cag file format: missing title or elements array.');
        }

        const map: GameMap = {
          id: mapData.id || generateMapId(),
          title: mapData.title,
          description: mapData.description || '',
          authorName: mapData.authorName || 'Imported Author',
          authorId: mapData.authorId || 'imported',
          elements: mapData.elements,
          verified: Boolean(mapData.verified),
          verifiedTimeMs: mapData.verifiedTimeMs,
          playCount: 0,
          clearCount: 0,
          likesCount: 0,
          difficulty: mapData.difficulty || 'Normal',
          theme: mapData.theme || 'Grassland',
          createdAt: new Date().toISOString(),
        };

        resolve(map);
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Failed to parse .cag file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
