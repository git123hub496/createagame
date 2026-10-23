import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { getMyProfile, saveMyProfile } from './profileService';
import { getPartyPlayerId } from './partyService';
import { PlayerProfile, AvatarConfig } from '../types';

export interface AccountRecord {
  username: string;
  passwordHash: string;
  profileId: string;
  createdAt: string;
  updatedAt: string;
}

const AUTH_STORAGE_KEY = 'cag_account_auth';

// Helper to hash password using SHA-256 with Web Crypto
export async function hashPassword(password: string): Promise<string> {
  const salt = 'cag_secure_salt_';
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Sanitize username to safe alphanumeric document ID
export function normalizeAccountId(name: string): string {
  const cleaned = name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  return cleaned || 'player';
}

export interface StoredAuthSession {
  username: string;
  profileId: string;
  hasPassword: boolean;
  authenticated: boolean;
}

export function getStoredAuthSession(): StoredAuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return null;
}

export function saveStoredAuthSession(session: StoredAuthSession) {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    window.dispatchEvent(new CustomEvent('cag_auth_changed'));
  } catch {}
}

export function clearStoredAuthSession() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('cag_auth_changed'));
  } catch {}
}

// Check if current account has a password saved in Firebase
export async function checkCurrentAccountHasPassword(): Promise<{
  hasPassword: boolean;
  username: string;
  profileId: string;
}> {
  const profile = getMyProfile();
  const profileId = profile.id;
  const username = profile.name || 'Player';

  const session = getStoredAuthSession();
  if (session && session.profileId === profileId && session.hasPassword) {
    return { hasPassword: true, username: session.username, profileId };
  }

  // Check local storage password record
  const localSavedHash = localStorage.getItem('cag_local_password_hash');
  if (localSavedHash) {
    saveStoredAuthSession({
      username,
      profileId,
      hasPassword: true,
      authenticated: true,
    });
    return { hasPassword: true, username, profileId };
  }

  // Check Firestore account document by profileId
  try {
    const snap = await getDoc(doc(db, 'accounts', profileId));
    if (snap.exists() && snap.data().passwordHash) {
      saveStoredAuthSession({
        username: snap.data().username || username,
        profileId,
        hasPassword: true,
        authenticated: true,
      });
      return { hasPassword: true, username: snap.data().username || username, profileId };
    }
  } catch {
    // Graceful check fallback without error toast
  }

  // Also check by normalized username
  try {
    const userDocId = normalizeAccountId(username);
    const snapUser = await getDoc(doc(db, 'accounts', userDocId));
    if (snapUser.exists() && snapUser.data().passwordHash && snapUser.data().profileId === profileId) {
      saveStoredAuthSession({
        username,
        profileId,
        hasPassword: true,
        authenticated: true,
      });
      return { hasPassword: true, username, profileId };
    }
  } catch {
    // Graceful check fallback without error toast
  }

  return { hasPassword: false, username, profileId };
}

// Save or set a password for the current account to Firebase
export async function setAccountPassword(password: string): Promise<{ success: boolean; error?: string }> {
  if (!password || password.trim().length < 4) {
    return { success: false, error: 'Password must be at least 4 characters long.' };
  }

  const profile = getMyProfile();
  const profileId = profile.id;
  const username = profile.name || 'Player';
  const userDocId = normalizeAccountId(username);
  const now = new Date().toISOString();

  try {
    const passwordHash = await hashPassword(password);

    const accountData: AccountRecord = {
      username,
      passwordHash,
      profileId,
      createdAt: now,
      updatedAt: now,
    };

    // Store locally so account is instantly secured
    localStorage.setItem('cag_local_password_hash', passwordHash);
    saveStoredAuthSession({
      username,
      profileId,
      hasPassword: true,
      authenticated: true,
    });

    // Save to Firestore under profileId and userDocId
    try {
      await setDoc(doc(db, 'accounts', profileId), accountData);
      if (userDocId !== profileId) {
        await setDoc(doc(db, 'accounts', userDocId), accountData);
      }
    } catch (firestoreErr) {
      console.warn('Firestore password sync notice:', firestoreErr);
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to save password.',
    };
  }
}

// Log in with username and password
export async function loginWithAccount(
  usernameInput: string,
  passwordInput: string
): Promise<{
  success: boolean;
  requiresPasswordSetup?: boolean;
  profile?: PlayerProfile;
  error?: string;
}> {
  const trimmedUser = usernameInput.trim();
  if (!trimmedUser) {
    return { success: false, error: 'Please enter your username.' };
  }

  const userDocId = normalizeAccountId(trimmedUser);

  try {
    let accountSnap = await getDoc(doc(db, 'accounts', userDocId));

    if (!accountSnap.exists()) {
      // Try looking up directly if ID was passed
      accountSnap = await getDoc(doc(db, 'accounts', trimmedUser));
    }

    if (!accountSnap.exists()) {
      return {
        success: false,
        error: 'Account not found. Please check spelling or create a new account.',
      };
    }

    const data = accountSnap.data() as AccountRecord;

    if (!data.passwordHash) {
      return {
        success: false,
        requiresPasswordSetup: true,
        error: 'Secure your account! Add a password now.',
      };
    }

    const computedHash = await hashPassword(passwordInput);
    if (computedHash !== data.passwordHash) {
      return { success: false, error: 'Incorrect password. Please try again.' };
    }

    // Password matches! Fetch and load linked profile
    const profileId = data.profileId;
    const profileSnap = await getDoc(doc(db, 'profiles', profileId));

    let loadedProfile: PlayerProfile;
    if (profileSnap.exists()) {
      const pData = profileSnap.data();
      let avatar: AvatarConfig = {
        name: data.username,
        color: '#ffffff',
        eyeStyle: 'normal',
        hat: 'none',
        trail: 'none',
      };
      try {
        if (pData.avatarJson) avatar = JSON.parse(pData.avatarJson);
      } catch {}

      loadedProfile = {
        id: profileId,
        name: data.username,
        avatar,
        isPublic: Boolean(pData.isPublic),
        mapsCleared: Number(pData.mapsCleared || 0),
        mapsCreated: Number(pData.mapsCreated || 0),
        partiesPlayed: Number(pData.partiesPlayed || 0),
        partiesWon: Number(pData.partiesWon || 0),
        addonsCreated: Number(pData.addonsCreated || 0),
        updatedAt: String(pData.updatedAt || new Date().toISOString()),
      };
    } else {
      const defaultAvatar: AvatarConfig = {
        name: data.username,
        color: '#ffffff',
        eyeStyle: 'normal',
        hat: 'none',
        trail: 'none',
      };
      loadedProfile = {
        id: profileId,
        name: data.username,
        avatar: defaultAvatar,
        isPublic: true,
        mapsCleared: 0,
        mapsCreated: 0,
        partiesPlayed: 0,
        partiesWon: 0,
        addonsCreated: 0,
        updatedAt: new Date().toISOString(),
      };
    }

    // Persist login to local session
    localStorage.setItem('cag_party_player_id', profileId);
    localStorage.setItem('cag_player_profile', JSON.stringify(loadedProfile));
    localStorage.setItem('cag_player_avatar', JSON.stringify(loadedProfile.avatar));

    saveStoredAuthSession({
      username: data.username,
      profileId,
      hasPassword: true,
      authenticated: true,
    });

    window.dispatchEvent(new CustomEvent('cag_profile_update'));
    window.dispatchEvent(new CustomEvent('cag_auth_changed'));

    return { success: true, profile: loadedProfile };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `accounts/${userDocId}`);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Login failed. Please try again.',
    };
  }
}

// Create brand new account with username and password
export async function createAccountWithPassword(
  usernameInput: string,
  passwordInput: string
): Promise<{ success: boolean; error?: string }> {
  const trimmedUser = usernameInput.trim();
  if (trimmedUser.length < 2 || trimmedUser.length > 32) {
    return { success: false, error: 'Username must be between 2 and 32 characters.' };
  }
  if (!passwordInput || passwordInput.trim().length < 4) {
    return { success: false, error: 'Password must be at least 4 characters long.' };
  }

  const userDocId = normalizeAccountId(trimmedUser);

  try {
    // Check if username taken
    const existingSnap = await getDoc(doc(db, 'accounts', userDocId));
    if (existingSnap.exists()) {
      return { success: false, error: 'Username is already taken. Please choose another or log in.' };
    }

    const newProfileId = `ply_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const passwordHash = await hashPassword(passwordInput);
    const now = new Date().toISOString();

    const accountData: AccountRecord = {
      username: trimmedUser,
      passwordHash,
      profileId: newProfileId,
      createdAt: now,
      updatedAt: now,
    };

    // Save account
    await setDoc(doc(db, 'accounts', userDocId), accountData);
    await setDoc(doc(db, 'accounts', newProfileId), accountData);

    // Save initial profile
    const newProfile: PlayerProfile = {
      id: newProfileId,
      name: trimmedUser,
      avatar: {
        name: trimmedUser,
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
      updatedAt: now,
    };

    await setDoc(doc(db, 'profiles', newProfileId), {
      id: newProfileId,
      name: trimmedUser,
      avatarJson: JSON.stringify(newProfile.avatar),
      isPublic: true,
      mapsCleared: 0,
      mapsCreated: 0,
      partiesPlayed: 0,
      partiesWon: 0,
      addonsCreated: 0,
      updatedAt: now,
    });

    localStorage.setItem('cag_party_player_id', newProfileId);
    localStorage.setItem('cag_player_profile', JSON.stringify(newProfile));
    localStorage.setItem('cag_player_avatar', JSON.stringify(newProfile.avatar));

    saveStoredAuthSession({
      username: trimmedUser,
      profileId: newProfileId,
      hasPassword: true,
      authenticated: true,
    });

    window.dispatchEvent(new CustomEvent('cag_profile_update'));
    window.dispatchEvent(new CustomEvent('cag_auth_changed'));

    return { success: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `accounts/${userDocId}`);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create account.',
    };
  }
}
