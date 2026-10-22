import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { PlayerProfile, AvatarConfig } from '../types';
import { getPartyPlayerId } from './partyService';

const PROFILE_STORAGE_KEY = 'cag_player_profile';

export function getMyProfile(): PlayerProfile {
  const myId = getPartyPlayerId();
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        id: myId,
      };
    }
  } catch {}

  // Default initial profile (Public Profiles show automatically per user request)
  return {
    id: myId,
    name: 'Player',
    avatar: {
      name: 'Player',
      color: '#ffffff',
      eyeStyle: 'normal',
      hat: 'none',
      trail: 'none',
    },
    isPublic: true,
    mapsCleared: 0,
    mapsCreated: 0,
    partiesPlayed: 0,
    partiesWon: 0,
    addonsCreated: 0,
    updatedAt: new Date().toISOString(),
  };
}

export async function saveMyProfile(
  updates: Partial<PlayerProfile>,
  avatarOverride?: AvatarConfig
): Promise<PlayerProfile> {
  const current = getMyProfile();
  const updated: PlayerProfile = {
    ...current,
    ...updates,
    avatar: avatarOverride || updates.avatar || current.avatar,
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('cag_profile_update'));
  } catch {}

  // Sync to Firestore
  const path = `profiles/${updated.id}`;
  try {
    await setDoc(doc(db, 'profiles', updated.id), {
      id: updated.id,
      name: updated.name.trim() || 'Player',
      avatarJson: JSON.stringify(updated.avatar),
      isPublic: Boolean(updated.isPublic),
      mapsCleared: Number(updated.mapsCleared || 0),
      mapsCreated: Number(updated.mapsCreated || 0),
      partiesPlayed: Number(updated.partiesPlayed || 0),
      partiesWon: Number(updated.partiesWon || 0),
      addonsCreated: Number(updated.addonsCreated || 0),
      updatedAt: updated.updatedAt,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }

  return updated;
}

export async function fetchPublicProfile(profileId: string): Promise<PlayerProfile | null> {
  const path = `profiles/${profileId}`;
  try {
    const snap = await getDoc(doc(db, 'profiles', profileId));
    if (!snap.exists()) return null;
    const data = snap.data();
    if (!data.isPublic) {
      // Hidden / Private profile
      return {
        id: profileId,
        name: String(data.name || 'Anonymous'),
        avatar: {
          name: 'Player',
          color: '#ffffff',
          eyeStyle: 'normal',
          hat: 'none',
          trail: 'none',
        },
        isPublic: false,
        mapsCleared: 0,
        mapsCreated: 0,
        partiesPlayed: 0,
        partiesWon: 0,
        addonsCreated: 0,
        updatedAt: String(data.updatedAt || ''),
      };
    }

    let parsedAvatar: AvatarConfig = {
      name: 'Player',
      color: '#ffffff',
      eyeStyle: 'normal',
      hat: 'none',
      trail: 'none',
    };
    try {
      if (typeof data.avatarJson === 'string') {
        parsedAvatar = JSON.parse(data.avatarJson);
      }
    } catch {}

    return {
      id: String(data.id || profileId),
      name: String(data.name || 'Player'),
      avatar: parsedAvatar,
      isPublic: true,
      mapsCleared: Number(data.mapsCleared || 0),
      mapsCreated: Number(data.mapsCreated || 0),
      partiesPlayed: Number(data.partiesPlayed || 0),
      partiesWon: Number(data.partiesWon || 0),
      addonsCreated: Number(data.addonsCreated || 0),
      updatedAt: String(data.updatedAt || ''),
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
}

export function incrementProfileStat(
  stat: 'mapsCleared' | 'mapsCreated' | 'partiesPlayed' | 'partiesWon' | 'addonsCreated'
) {
  const current = getMyProfile();
  current[stat] = (current[stat] || 0) + 1;
  saveMyProfile(current).catch(() => {});
}
