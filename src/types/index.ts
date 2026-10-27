export type GearSlot = 'weapon' | 'armor';
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type UpgradeChoiceId = 'damage' | 'attackSpeed' | 'dash' | 'shield';
export type CurrencyPackId = 'small' | 'medium' | 'large';

export interface GearItem {
  id: string;
  name: string;
  slot: GearSlot;
  rarity: Rarity;
  damageBonus: number;
  hpBonus: number;
}

export interface SaveData {
  version: number;
  gold: number;
  premiumCurrency: number;
  matchesPlayed: number;
  wins: number;
  bestMatchTimeMs: number | null;
  freeChestProgress: number;
  freeChestCharges: number;
  weapon: GearItem | null;
  armor: GearItem | null;
  inventory: GearItem[];
  starterPackOffered: boolean;
  starterPackPurchased: boolean;
  battleBuffMatchesRemaining: number;
}

export interface MatchReward {
  winner: 'player' | 'bot';
  durationMs: number;
  goldEarned: number;
  loot: GearItem;
  freeChestReady: boolean;
  starterPackOffer: boolean;
  chestPreview: Rarity[];
}

export interface ShopItem {
  id: string;
  title: string;
  subtitle: string;
  priceLabel: string;
  badge?: string;
}
