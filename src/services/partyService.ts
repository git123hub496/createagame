import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  runTransaction,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { AvatarConfig, GameMap } from '../types';
import { DEFAULT_MAPS } from './defaultMaps';

export const DEFAULT_AVATAR: AvatarConfig = {
  name: 'Player',
  color: '#ffffff',
  eyeStyle: 'normal',
  hat: 'none',
  trail: 'none',
};

export type PartyGameMode = 'coop' | 'race';
export type PartyStatus = 'waiting' | 'starting' | 'playing' | 'ended' | 'closed';

export interface PlayerPosition {
  x: number;
  y: number;
  vx: number;
  vy: number;
  faceRight: boolean;
  isDead: boolean;
  finished: boolean;
  finishTime?: number;
  updatedAt: number;
}

export interface PartyResults {
  winnerId?: string | null;
  winnerName?: string | null;
  hostFinished: boolean;
  guestFinished: boolean;
  hostTime?: number;
  guestTime?: number;
  mode: PartyGameMode;
  endedAt: number;
}

export interface PartyData {
  id: string; // 5 uppercase letters, e.g. "KMPXQ"
  hostId: string;
  hostName: string;
  hostAvatar: AvatarConfig;
  guestId?: string | null;
  guestName?: string | null;
  guestAvatar?: AvatarConfig | null;
  gameMode: PartyGameMode;
  status: PartyStatus;
  mapId: string;
  mapData: GameMap;
  hostPos?: PlayerPosition | null;
  guestPos?: PlayerPosition | null;
  results?: PartyResults | null;
  createdAt: string;
  updatedAt: string;
}

const PLAYER_ID_KEY = 'cag_party_player_id';

// Stable unique player ID for multiplayer sessions
export function getPartyPlayerId(): string {
  let id = localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = `ply_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
}

// Generate a 5-letter party room code (no CAG prefix)
export function generatePartyCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create a new 2-player party room (Host is Manager)
export async function createParty(
  hostName: string,
  hostAvatar: AvatarConfig,
  initialMap: GameMap,
  gameMode: PartyGameMode = 'coop'
): Promise<PartyData> {
  const hostId = getPartyPlayerId();
  const partyCode = generatePartyCode();
  const now = new Date().toISOString();

  const docPayload = {
    id: partyCode,
    hostId,
    hostName: hostName.trim() || 'Player 1',
    hostAvatarJson: JSON.stringify(hostAvatar),
    guestId: null,
    guestName: null,
    guestAvatarJson: null,
    gameMode,
    status: 'waiting' as PartyStatus,
    mapId: initialMap.id,
    mapDataJson: JSON.stringify(initialMap),
    hostPosJson: null,
    guestPosJson: null,
    resultsJson: null,
    createdAt: now,
    updatedAt: now,
  };

  const path = `parties/${partyCode}`;
  try {
    await setDoc(doc(db, 'parties', partyCode), docPayload);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    throw err;
  }

  return {
    id: partyCode,
    hostId,
    hostName: hostName.trim() || 'Player 1',
    hostAvatar,
    guestId: null,
    guestName: null,
    guestAvatar: null,
    gameMode,
    status: 'waiting',
    mapId: initialMap.id,
    mapData: initialMap,
    hostPos: null,
    guestPos: null,
    results: null,
    createdAt: now,
    updatedAt: now,
  };
}

// Join an existing 2-player party using 5-letter code
export async function joinParty(
  rawCode: string,
  guestName: string,
  guestAvatar: AvatarConfig
): Promise<PartyData> {
  const code = rawCode.trim().toUpperCase().replace(/[^A-Z]/g, '');
  if (code.length !== 5) {
    throw new Error('Party code must be 5 letters (e.g. KMPXQ).');
  }

  const path = `parties/${code}`;
  const myId = getPartyPlayerId();

  let snap;
  try {
    snap = await getDoc(doc(db, 'parties', code));
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    throw err;
  }

  if (!snap.exists()) {
    throw new Error('Party not found. Please double-check the 5-letter code.');
  }

  const raw = snap.data();
  if (raw.status === 'closed') {
    throw new Error('This party has ended and cannot be rehosted.');
  }

  // Prevent 3rd player from joining (Strict 2-player max)
  if (raw.guestId && raw.guestId !== myId && raw.hostId !== myId) {
    throw new Error('Party is full. Parties are limited to 2 players.');
  }

  const now = new Date().toISOString();

  // If joining as guest (not host already)
  if (raw.hostId !== myId) {
    try {
      await updateDoc(doc(db, 'parties', code), {
        guestId: myId,
        guestName: guestName.trim() || 'Player 2',
        guestAvatarJson: JSON.stringify(guestAvatar),
        updatedAt: now,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
      throw err;
    }
  }

  return parsePartyDocument({
    ...raw,
    guestId: raw.hostId === myId ? raw.guestId : myId,
    guestName: raw.hostId === myId ? raw.guestName : guestName.trim() || 'Player 2',
    guestAvatarJson: raw.hostId === myId ? raw.guestAvatarJson : JSON.stringify(guestAvatar),
    updatedAt: now,
  });
}

// Subscribe to real-time party changes via onSnapshot
export function subscribeToParty(
  partyId: string,
  onUpdate: (party: PartyData) => void,
  onError: (err: Error) => void
): () => void {
  const path = `parties/${partyId}`;
  return onSnapshot(
    doc(db, 'parties', partyId),
    (snap) => {
      if (!snap.exists()) {
        onError(new Error('Party no longer exists.'));
        return;
      }
      try {
        const parsed = parsePartyDocument(snap.data());
        onUpdate(parsed);
      } catch (err) {
        console.error('Error parsing party sync:', err);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, path);
      onError(err);
    }
  );
}

// Host (Manager) updates game mode or chosen map
export async function updatePartySettings(
  partyId: string,
  updates: {
    gameMode?: PartyGameMode;
    mapData?: GameMap;
    mapId?: string;
  }
) {
  const path = `parties/${partyId}`;
  const payload: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  if (updates.gameMode) {
    payload.gameMode = updates.gameMode;
  }
  if (updates.mapData) {
    payload.mapDataJson = JSON.stringify(updates.mapData);
    payload.mapId = updates.mapId || updates.mapData.id;
  }

  try {
    await updateDoc(doc(db, 'parties', partyId), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    throw err;
  }
}

// Start match (Host sets status to playing and clears previous positions/results)
export async function startPartyGame(partyId: string) {
  const path = `parties/${partyId}`;
  try {
    await updateDoc(doc(db, 'parties', partyId), {
      status: 'playing',
      hostPosJson: null,
      guestPosJson: null,
      resultsJson: null,
      hostFinished: false,
      guestFinished: false,
      hostFinishTime: null,
      guestFinishTime: null,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    throw err;
  }
}

// Reset party back to lobby for next round or map selection
export async function returnPartyToLobby(partyId: string) {
  const path = `parties/${partyId}`;
  try {
    await updateDoc(doc(db, 'parties', partyId), {
      status: 'waiting',
      hostPosJson: null,
      guestPosJson: null,
      resultsJson: null,
      hostFinished: false,
      guestFinished: false,
      hostFinishTime: null,
      guestFinishTime: null,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    throw err;
  }
}

// Send live player location (strictly overwrites only the current location; never stores history)
export async function updatePlayerPosition(
  partyId: string,
  isHost: boolean,
  pos: PlayerPosition
) {
  const path = `parties/${partyId}`;
  const payload: Record<string, unknown> = {
    [isHost ? 'hostPosJson' : 'guestPosJson']: JSON.stringify(pos),
    updatedAt: new Date().toISOString(),
  };

  if (pos.finished) {
    payload[isHost ? 'hostFinished' : 'guestFinished'] = true;
    if (typeof pos.finishTime === 'number') {
      payload[isHost ? 'hostFinishTime' : 'guestFinishTime'] = pos.finishTime;
    }
  }

  try {
    await updateDoc(doc(db, 'parties', partyId), payload);
  } catch {
    // Non-fatal position sync drops can happen during transient network hiccups
  }
}

// Report when a player hits the finish flag (uses atomic transaction so second player arrival is 100% reliable)
export async function reportPartyPlayerFinish(
  partyId: string,
  isHost: boolean,
  finishTimeMs: number,
  playerName: string
) {
  const path = `parties/${partyId}`;
  const partyRef = doc(db, 'parties', partyId);

  try {
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(partyRef);
      if (!snap.exists()) return;
      const raw = snap.data();
      const current = parsePartyDocument(raw);

      const existingResults: PartyResults = current.results || {
        hostFinished: Boolean(raw.hostFinished),
        guestFinished: Boolean(raw.guestFinished),
        hostTime: typeof raw.hostFinishTime === 'number' ? raw.hostFinishTime : undefined,
        guestTime: typeof raw.guestFinishTime === 'number' ? raw.guestFinishTime : undefined,
        mode: current.gameMode,
        endedAt: Date.now(),
      };

      const updatedResults: PartyResults = {
        ...existingResults,
        mode: current.gameMode,
        endedAt: Date.now(),
      };

      if (isHost) {
        updatedResults.hostFinished = true;
        updatedResults.hostTime = finishTimeMs;
      } else {
        updatedResults.guestFinished = true;
        updatedResults.guestTime = finishTimeMs;
      }

      // Check also top-level fields in case peer wrote them
      if (raw.hostFinished) updatedResults.hostFinished = true;
      if (raw.guestFinished) updatedResults.guestFinished = true;

      const updates: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
      };

      if (isHost) {
        updates.hostFinished = true;
        updates.hostFinishTime = finishTimeMs;
      } else {
        updates.guestFinished = true;
        updates.guestFinishTime = finishTimeMs;
      }

      // Handle Game Modes:
      if (current.gameMode === 'coop') {
        const bothFinished = updatedResults.hostFinished && updatedResults.guestFinished;
        updates.resultsJson = JSON.stringify(updatedResults);
        updates.status = bothFinished ? 'ended' : 'playing';
      } else if (current.gameMode === 'race') {
        if (!updatedResults.winnerId) {
          updatedResults.winnerId = isHost ? current.hostId : current.guestId;
          updatedResults.winnerName = playerName;
        }
        updates.resultsJson = JSON.stringify(updatedResults);
        updates.status = 'ended';
      }

      transaction.update(partyRef, updates);
    });
  } catch (err) {
    // Resilient fallback update to ensure finish flag and status are never dropped
    try {
      const snap = await getDoc(partyRef);
      if (snap.exists()) {
        const raw = snap.data();
        const otherFinished = isHost ? Boolean(raw.guestFinished || raw.guestPosJson?.includes('"finished":true')) : Boolean(raw.hostFinished || raw.hostPosJson?.includes('"finished":true'));
        const mode = (raw.gameMode as PartyGameMode) || 'coop';
        const isEnded = mode === 'race' ? true : otherFinished;

        const res: PartyResults = {
          hostFinished: isHost ? true : Boolean(raw.hostFinished),
          guestFinished: !isHost ? true : Boolean(raw.guestFinished),
          hostTime: isHost ? finishTimeMs : (typeof raw.hostFinishTime === 'number' ? raw.hostFinishTime : undefined),
          guestTime: !isHost ? finishTimeMs : (typeof raw.guestFinishTime === 'number' ? raw.guestFinishTime : undefined),
          mode,
          endedAt: Date.now(),
          winnerId: mode === 'race' ? (isHost ? String(raw.hostId) : String(raw.guestId)) : undefined,
          winnerName: mode === 'race' ? playerName : undefined,
        };

        const field = isHost ? 'hostFinished' : 'guestFinished';
        const timeField = isHost ? 'hostFinishTime' : 'guestFinishTime';

        await updateDoc(partyRef, {
          [field]: true,
          [timeField]: finishTimeMs,
          resultsJson: JSON.stringify(res),
          status: isEnded ? 'ended' : 'playing',
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  }
}

// Leave party
export async function leaveParty(partyId: string, isHost: boolean) {
  const path = `parties/${partyId}`;
  try {
    if (isHost) {
      // Host left: close the party so it cannot be rehosted
      await updateDoc(doc(db, 'parties', partyId), {
        status: 'closed',
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Guest left: clear guest info and return lobby to waiting
      await updateDoc(doc(db, 'parties', partyId), {
        guestId: null,
        guestName: null,
        guestAvatarJson: null,
        guestPosJson: null,
        status: 'waiting',
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// Generate join link
export function getPartyJoinUrl(partyCode: string): string {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}#/party/join/${partyCode}`;
}

// Helper to parse Firestore payload to typed PartyData
function parsePartyDocument(raw: Record<string, unknown>): PartyData {
  let hostAvatar: AvatarConfig = { ...DEFAULT_AVATAR };
  let guestAvatar: AvatarConfig | null = null;
  let mapData: GameMap = DEFAULT_MAPS[0];
  let hostPos: PlayerPosition | null = null;
  let guestPos: PlayerPosition | null = null;
  let results: PartyResults | null = null;

  try {
    if (typeof raw.hostAvatarJson === 'string') {
      hostAvatar = JSON.parse(raw.hostAvatarJson);
    }
  } catch {}

  try {
    if (typeof raw.guestAvatarJson === 'string') {
      guestAvatar = JSON.parse(raw.guestAvatarJson);
    }
  } catch {}

  try {
    if (typeof raw.mapDataJson === 'string') {
      mapData = JSON.parse(raw.mapDataJson);
    } else if (raw.mapData) {
      mapData = raw.mapData as GameMap;
    }
  } catch {
    mapData = DEFAULT_MAPS[0];
  }

  try {
    if (typeof raw.hostPosJson === 'string') {
      hostPos = JSON.parse(raw.hostPosJson);
    }
  } catch {}

  try {
    if (typeof raw.guestPosJson === 'string') {
      guestPos = JSON.parse(raw.guestPosJson);
    }
  } catch {}

  try {
    if (typeof raw.resultsJson === 'string') {
      results = JSON.parse(raw.resultsJson);
    }
  } catch {}

  const hostFinishedFlag = Boolean(raw.hostFinished || hostPos?.finished);
  const guestFinishedFlag = Boolean(raw.guestFinished || guestPos?.finished);

  if (!results && (hostFinishedFlag || guestFinishedFlag)) {
    results = {
      hostFinished: hostFinishedFlag,
      guestFinished: guestFinishedFlag,
      hostTime: typeof raw.hostFinishTime === 'number' ? raw.hostFinishTime : hostPos?.finishTime,
      guestTime: typeof raw.guestFinishTime === 'number' ? raw.guestFinishTime : guestPos?.finishTime,
      mode: (raw.gameMode as PartyGameMode) || 'coop',
      endedAt: Date.now(),
    };
  } else if (results) {
    if (hostFinishedFlag) results.hostFinished = true;
    if (guestFinishedFlag) results.guestFinished = true;
    if (typeof raw.hostFinishTime === 'number' && !results.hostTime) results.hostTime = raw.hostFinishTime;
    if (typeof raw.guestFinishTime === 'number' && !results.guestTime) results.guestTime = raw.guestFinishTime;
  }

  let status = (raw.status as PartyStatus) || 'waiting';
  // If match was in progress and victory conditions are reached, ensure status reflects ended
  if (status === 'playing') {
    if (raw.gameMode === 'race' && (hostFinishedFlag || guestFinishedFlag)) {
      status = 'ended';
    } else if ((raw.gameMode === 'coop' || !raw.gameMode) && (hostFinishedFlag && guestFinishedFlag)) {
      status = 'ended';
    }
  }

  return {
    id: String(raw.id || ''),
    hostId: String(raw.hostId || ''),
    hostName: String(raw.hostName || 'Player 1'),
    hostAvatar,
    guestId: raw.guestId ? String(raw.guestId) : null,
    guestName: raw.guestName ? String(raw.guestName) : null,
    guestAvatar,
    gameMode: (raw.gameMode as PartyGameMode) || 'coop',
    status,
    mapId: String(raw.mapId || mapData.id),
    mapData,
    hostPos,
    guestPos,
    results,
    createdAt: String(raw.createdAt || ''),
    updatedAt: String(raw.updatedAt || ''),
  };
}
