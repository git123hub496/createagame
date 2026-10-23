// Deprecated multiplayer service: Multiplayer removed per user request to save storage.
// Only persistent local player ID generator is preserved for profile identification.
import { AvatarConfig, GameMap } from '../types';

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
  id: string;
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

// Stable unique player ID for local profile identification
export function getPartyPlayerId(): string {
  let id = localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = `ply_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
}

export function updatePlayerPosition(..._args: any[]) {}
export function reportPartyPlayerFinish(..._args: any[]) {}
export function returnPartyToLobby(..._args: any[]) {}
export function leaveParty(..._args: any[]) {}
export function startPartyGame(..._args: any[]) {}
export function subscribeToParty(..._args: any[]) {
  return () => {};
}
export function updatePartySettings(..._args: any[]) {}
