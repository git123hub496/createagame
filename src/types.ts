export type ElementType =
  | 'ground'
  | 'grass'
  | 'platform'
  | 'spike'
  | 'lava'
  | 'spring'
  | 'coin'
  | 'checkpoint'
  | 'flag'
  | 'spawn'
  | 'pumpkin'
  | 'jackolantern'
  | 'text'
  | 'arrow'
  | string;

export type SpikeDirection = 'up' | 'down' | 'left' | 'right';

export interface LevelElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  spikeDir?: SpikeDirection;
  moving?: boolean;
  moveRange?: number;
  moveSpeed?: number;
  moveAxis?: 'horizontal' | 'vertical';
  customImg?: string;
  customName?: string;
  behavior?: 'solid' | 'hazard' | 'spring' | 'decor' | 'coin';
  text?: string;
  color?: string;
  rotation?: number;
  fontSize?: number;
}

export type ThemeType = 'Grassland' | 'Volcano' | 'Cyber' | 'Underground' | 'Halloween';
export type DifficultyType = 'Easy' | 'Normal' | 'Hard' | 'Insane';

export interface GameMap {
  id: string;
  title: string;
  description: string;
  authorName: string;
  authorId: string;
  elements: LevelElement[];
  verified: boolean;
  verifiedTimeMs?: number;
  playCount: number;
  clearCount: number;
  likesCount: number;
  difficulty: DifficultyType;
  theme: ThemeType;
  createdAt: string;
}

export type EyeStyle = 'normal' | 'happy' | 'shades' | 'gamer' | 'cyclops' | 'angry' | 'wink';
export type HatStyle =
  | 'none'
  | 'crown'
  | 'cap'
  | 'tophat'
  | 'horns'
  | 'halo'
  | 'headphones'
  | 'ninja'
  | 'pumpkin'
  | 'bat'
  | 'ghost'
  | 'witch'
  | 'skull'
  | 'spider'
  | string;

export type TrailStyle = 'none' | 'ghost' | 'sparkle' | 'rainbow' | 'fire';

export interface AvatarConfig {
  name: string;
  color: string;
  eyeStyle: EyeStyle;
  hat: HatStyle;
  trail: TrailStyle;
  customHatImg?: string;
}

export type AppView = 'title' | 'editor' | 'play' | 'explore' | 'addon' | 'addon-studio';

export interface CustomAddonElement {
  id: string;
  name: string;
  desc?: string;
  imageDataUrl: string;
  behavior: 'solid' | 'hazard' | 'spring' | 'decor' | 'coin';
  defaultW: number;
  defaultH: number;
}

export interface CustomAddonHat {
  id: string;
  name: string;
  imageDataUrl: string;
}

export interface CustomAddonColor {
  id: string;
  name: string;
  hex: string;
}

export interface PublishedAddon {
  id: string;
  title: string;
  description: string;
  authorName: string;
  authorId: string;
  elements: CustomAddonElement[];
  hats: CustomAddonHat[];
  colors: CustomAddonColor[];
  installCount: number;
  likesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerProfile {
  id: string;
  name: string;
  avatar: AvatarConfig;
  isPublic: boolean;
  mapsCleared: number;
  mapsCreated: number;
  partiesPlayed: number;
  partiesWon: number;
  addonsCreated: number;
  updatedAt: string;
}
