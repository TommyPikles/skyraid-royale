export type UpgradeId =
  | 'flapControl'
  | 'shieldHits'
  | 'coinMultiplier'
  | 'shardDropRate'
  | 'reviveCharges';

export type SkinId = 'default' | 'plasma' | 'solarflare' | 'voidbird';

export type LeagueId = 'bronze' | 'silver' | 'gold' | 'plasma' | 'apex';

export type ObstacleVariant = 'static' | 'moving' | 'rotating' | 'narrow' | 'double';

export type RunModifierId = 'extraShield' | 'coinMagnet' | 'smoothFlap';

export interface UpgradeState {
  level: number;
}

export interface SaveData {
  version: number;
  runs: number;
  bestScore: number;
  bestGates: number;
  lifetimeCoins: number;
  coins: number;
  gems: number;
  powerCores: number;
  upgrades: Record<UpgradeId, UpgradeState>;
  ownedSkins: SkinId[];
  selectedSkin: SkinId;
  starterPackOffered: boolean;
  starterPackPurchased: boolean;
  coinDoublerUntil: number; // epoch ms; 0 = none
  reviveTokens: number;
  lastPlayed: number;
  leagueId: LeagueId;
  leaguePoints: number;
  ghostBestPath: GhostFrame[] | null;
  ghostBestGates: number;
  nextRunModifierOffered: boolean;
  tutorialCompleted: boolean;
}

export interface GhostFrame {
  t: number; // time since run start (ms)
  y: number; // player y position
  v: number; // velocity
}

export interface RunResult {
  score: number;
  gates: number;
  coinsEarned: number;
  gemsEarned: number;
  powerCoresEarned: number;
  distance: number;
  ghostComparisonGates: number | null;
  newBest: boolean;
}

export interface ShopItem {
  id: string;
  title: string;
  subtitle: string;
  priceLabel: string;
  highlight?: boolean;
  badge?: string;
}
