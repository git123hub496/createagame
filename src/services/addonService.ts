import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  query,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  PublishedAddon,
  CustomAddonElement,
  CustomAddonHat,
  CustomAddonColor,
} from '../types';

const ADDON_STORAGE_KEY = 'cag_addons_config';
const INSTALLED_ADDONS_DATA_KEY = 'cag_installed_addons_data';

export interface StoredAddonState {
  added: boolean;
  enabled: boolean;
}

interface StoredAddonMap {
  [addonId: string]: StoredAddonState;
}

function getStoredAddons(): StoredAddonMap {
  try {
    const raw = localStorage.getItem(ADDON_STORAGE_KEY);
    return raw ? JSON.parse(raw) : { halloween: { added: true, enabled: true } };
  } catch {
    return { halloween: { added: true, enabled: true } };
  }
}

function saveStoredAddons(data: StoredAddonMap) {
  try {
    localStorage.setItem(ADDON_STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('cag_addon_update'));
  } catch {}
}

export function isHalloweenAdded(): boolean {
  const data = getStoredAddons();
  return Boolean(data['halloween']?.added);
}

export function isHalloweenEnabled(): boolean {
  const data = getStoredAddons();
  return Boolean(data['halloween']?.added && data['halloween']?.enabled);
}

export function addHalloweenAddon() {
  const data = getStoredAddons();
  data['halloween'] = {
    added: true,
    enabled: true,
  };
  saveStoredAddons(data);
}

export function enableHalloweenAddon() {
  const data = getStoredAddons();
  data['halloween'] = {
    added: true,
    enabled: true,
  };
  saveStoredAddons(data);
}

export function disableHalloweenAddon() {
  const data = getStoredAddons();
  if (data['halloween']) {
    data['halloween'].enabled = false;
  }
  saveStoredAddons(data);
}

// Built-in starter add-ons (including Halloween Pack)
export const BUILTIN_HALLOWEEN_ADDON: PublishedAddon = {
  id: 'builtin_halloween',
  title: 'Halloween Spook Pack',
  description: 'Pumpkins, glowing jack-o-lanterns, eerie spooky colors, and seasonal witch & bat hats.',
  authorName: 'Platformer Studio',
  authorId: 'builtin',
  elements: [
    {
      id: 'pumpkin',
      name: 'Pumpkin',
      desc: 'Carved decorative pass-through pumpkin',
      imageDataUrl: '',
      behavior: 'decor',
      defaultW: 24,
      defaultH: 24,
    },
    {
      id: 'jackolantern',
      name: 'Jack-o-lantern',
      desc: 'Glowing candle-lit jack-o-lantern emitting warm light',
      imageDataUrl: '',
      behavior: 'decor',
      defaultW: 26,
      defaultH: 26,
    },
  ],
  hats: [
    { id: 'witch', name: 'Witch Hat', imageDataUrl: '' },
    { id: 'bat', name: 'Bat Wings', imageDataUrl: '' },
    { id: 'ghost', name: 'Ghost Hood', imageDataUrl: '' },
    { id: 'skull', name: 'Skull Mask', imageDataUrl: '' },
  ],
  colors: [
    { id: 'col_pumpkin', name: 'Pumpkin Orange', hex: '#ff7518' },
    { id: 'col_witch', name: 'Witch Purple', hex: '#9333ea' },
    { id: 'col_slime', name: 'Slime Green', hex: '#84cc16' },
    { id: 'col_crimson', name: 'Blood Crimson', hex: '#dc2626' },
  ],
  installCount: 999,
  likesCount: 142,
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
};

// Local storage for full installed add-on bodies
function getInstalledAddonData(): PublishedAddon[] {
  try {
    const raw = localStorage.getItem(INSTALLED_ADDONS_DATA_KEY);
    if (!raw) {
      return [BUILTIN_HALLOWEEN_ADDON];
    }
    const list = JSON.parse(raw);
    if (!list.some((a: PublishedAddon) => a.id === BUILTIN_HALLOWEEN_ADDON.id)) {
      list.unshift(BUILTIN_HALLOWEEN_ADDON);
    }
    return list;
  } catch {
    return [BUILTIN_HALLOWEEN_ADDON];
  }
}

function saveInstalledAddonData(list: PublishedAddon[]) {
  try {
    localStorage.setItem(INSTALLED_ADDONS_DATA_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('cag_addon_update'));
  } catch {}
}

export function getInstalledAddons(): PublishedAddon[] {
  return getInstalledAddonData();
}

export function isAddonInstalled(addonId: string): boolean {
  if (addonId === 'halloween' || addonId === 'builtin_halloween') {
    return isHalloweenAdded();
  }
  const installed = getInstalledAddonData();
  return installed.some((a) => a.id === addonId);
}

export function isAddonEnabled(addonId: string): boolean {
  if (addonId === 'halloween' || addonId === 'builtin_halloween') {
    return isHalloweenEnabled();
  }
  const state = getStoredAddons();
  return Boolean(state[addonId]?.enabled);
}

export function toggleAddonEnabled(addonId: string) {
  if (addonId === 'halloween' || addonId === 'builtin_halloween') {
    if (isHalloweenEnabled()) {
      disableHalloweenAddon();
    } else {
      enableHalloweenAddon();
    }
    return;
  }
  const state = getStoredAddons();
  const current = Boolean(state[addonId]?.enabled);
  state[addonId] = {
    added: true,
    enabled: !current,
  };
  saveStoredAddons(state);
}

export function installAddon(addon: PublishedAddon) {
  const current = getInstalledAddonData();
  if (!current.some((a) => a.id === addon.id)) {
    current.push(addon);
    saveInstalledAddonData(current);
  }
  const state = getStoredAddons();
  state[addon.id] = {
    added: true,
    enabled: true,
  };
  saveStoredAddons(state);

  // Increment install count in Firestore
  if (addon.id && !addon.id.startsWith('builtin')) {
    updateDoc(doc(db, 'addons', addon.id), {
      installCount: increment(1),
    }).catch(() => {});
  }
}

export function uninstallAddon(addonId: string) {
  if (addonId === 'halloween' || addonId === 'builtin_halloween') {
    disableHalloweenAddon();
    return;
  }
  const current = getInstalledAddonData().filter((a) => a.id !== addonId);
  saveInstalledAddonData(current);
  const state = getStoredAddons();
  delete state[addonId];
  saveStoredAddons(state);
}

// Aggregated active elements from all enabled add-ons
export function getAllActiveAddonElements(): CustomAddonElement[] {
  const installed = getInstalledAddonData();
  const active: CustomAddonElement[] = [];

  for (const addon of installed) {
    if (isAddonEnabled(addon.id)) {
      if (Array.isArray(addon.elements)) {
        for (const elem of addon.elements) {
          active.push(elem);
        }
      }
    }
  }
  return active;
}

// Aggregated active hats from all enabled add-ons
export function getAllActiveAddonHats(): CustomAddonHat[] {
  const installed = getInstalledAddonData();
  const active: CustomAddonHat[] = [];

  for (const addon of installed) {
    if (isAddonEnabled(addon.id)) {
      if (Array.isArray(addon.hats)) {
        for (const hat of addon.hats) {
          active.push(hat);
        }
      }
    }
  }
  return active;
}

// Aggregated active colors from all enabled add-ons
export function getAllActiveAddonColors(): CustomAddonColor[] {
  const installed = getInstalledAddonData();
  const active: CustomAddonColor[] = [];

  for (const addon of installed) {
    if (isAddonEnabled(addon.id)) {
      if (Array.isArray(addon.colors)) {
        for (const col of addon.colors) {
          active.push(col);
        }
      }
    }
  }
  return active;
}

// Firestore: Publish a new Addon to the community
export async function publishCommunityAddon(addonInput: {
  title: string;
  description: string;
  authorName: string;
  authorId: string;
  elements: CustomAddonElement[];
  hats: CustomAddonHat[];
  colors: CustomAddonColor[];
}): Promise<PublishedAddon> {
  const addonId = `adn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const fullAddon: PublishedAddon = {
    id: addonId,
    title: addonInput.title.trim(),
    description: addonInput.description.trim(),
    authorName: addonInput.authorName.trim() || 'Creator',
    authorId: addonInput.authorId,
    elements: addonInput.elements,
    hats: addonInput.hats,
    colors: addonInput.colors,
    installCount: 1,
    likesCount: 1,
    createdAt: now,
    updatedAt: now,
  };

  const docPayload = {
    id: addonId,
    title: fullAddon.title,
    description: fullAddon.description,
    authorName: fullAddon.authorName,
    authorId: fullAddon.authorId,
    addonDataJson: JSON.stringify({
      elements: fullAddon.elements,
      hats: fullAddon.hats,
      colors: fullAddon.colors,
    }),
    installCount: 1,
    likesCount: 1,
    createdAt: now,
    updatedAt: now,
  };

  const path = `addons/${addonId}`;
  try {
    await setDoc(doc(db, 'addons', addonId), docPayload);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    throw err;
  }

  // Automatically install for creator
  installAddon(fullAddon);
  return fullAddon;
}

// Firestore: Fetch community published add-ons
export async function fetchCommunityAddons(): Promise<PublishedAddon[]> {
  const path = 'addons';
  const results: PublishedAddon[] = [BUILTIN_HALLOWEEN_ADDON];

  try {
    const q = query(collection(db, 'addons'));
    const snap = await getDocs(q);
    snap.forEach((d) => {
      const data = d.data();
      let parsedData: { elements?: CustomAddonElement[]; hats?: CustomAddonHat[]; colors?: CustomAddonColor[] } = {};
      try {
        if (typeof data.addonDataJson === 'string') {
          parsedData = JSON.parse(data.addonDataJson);
        }
      } catch {}

      results.push({
        id: String(data.id || d.id),
        title: String(data.title || 'Untitled Addon'),
        description: String(data.description || ''),
        authorName: String(data.authorName || 'Creator'),
        authorId: String(data.authorId || ''),
        elements: parsedData.elements || [],
        hats: parsedData.hats || [],
        colors: parsedData.colors || [],
        installCount: Number(data.installCount || 0),
        likesCount: Number(data.likesCount || 0),
        createdAt: String(data.createdAt || ''),
        updatedAt: String(data.updatedAt || ''),
      });
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }

  return results;
}
