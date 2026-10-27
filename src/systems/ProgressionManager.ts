import { ECONOMY } from '../config/balance';
import type { GearItem, MatchReward, SaveData } from '../types';

const SAVE_KEY = 'skyraid.arena.save.v1';
const SAVE_VERSION = 1;

function defaultSave(): SaveData {
  return {
    version: SAVE_VERSION,
    gold: 0,
    premiumCurrency: 0,
    matchesPlayed: 0,
    wins: 0,
    bestMatchTimeMs: null,
    freeChestProgress: 0,
    freeChestCharges: 0,
    weapon: null,
    armor: null,
    inventory: [],
    starterPackOffered: false,
    starterPackPurchased: false,
    battleBuffMatchesRemaining: 0,
  };
}

class ProgressionManager {
  private data: SaveData = defaultSave();

  constructor() {
    this.load();
  }

  load(): void {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) {
        this.data = defaultSave();
        return;
      }
      const parsed = JSON.parse(raw) as SaveData;
      if (parsed.version !== SAVE_VERSION) {
        this.data = defaultSave();
        return;
      }
      this.data = { ...defaultSave(), ...parsed };
    } catch {
      this.data = defaultSave();
    }
  }

  private save(): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch {
      // keep in memory
    }
  }

  reset(): void {
    this.data = defaultSave();
    this.save();
  }

  get state(): SaveData {
    return this.data;
  }

  addPremiumCurrency(amount: number): void {
    this.data.premiumCurrency += amount;
    this.save();
  }

  spendPremiumCurrency(amount: number): boolean {
    if (this.data.premiumCurrency < amount) return false;
    this.data.premiumCurrency -= amount;
    this.save();
    return true;
  }

  addInventoryItem(item: GearItem): void {
    this.data.inventory = [item, ...this.data.inventory];
    this.save();
  }

  equipItem(itemId: string): GearItem | null {
    const item = this.data.inventory.find((entry) => entry.id === itemId);
    if (!item) return null;
    if (item.slot === 'weapon') {
      this.data.weapon = item;
    } else {
      this.data.armor = item;
    }
    this.save();
    return item;
  }

  getEquippedBonuses(): { damage: number; hp: number } {
    return {
      damage: (this.data.weapon?.damageBonus ?? 0) + (this.data.armor?.damageBonus ?? 0),
      hp: (this.data.weapon?.hpBonus ?? 0) + (this.data.armor?.hpBonus ?? 0),
    };
  }

  hasBattleBuff(): boolean {
    return this.data.battleBuffMatchesRemaining > 0;
  }

  getBattleDamageMultiplier(): number {
    return this.hasBattleBuff() ? ECONOMY.starterPackDamageMultiplier : 1;
  }

  recordMatch(reward: MatchReward): void {
    this.data.matchesPlayed += 1;
    if (reward.winner === 'player') {
      this.data.wins += 1;
      if (this.data.bestMatchTimeMs === null || reward.durationMs < this.data.bestMatchTimeMs) {
        this.data.bestMatchTimeMs = reward.durationMs;
      }
    }
    this.data.gold += reward.goldEarned;
    this.data.inventory = [reward.loot, ...this.data.inventory];
    this.data.freeChestProgress += 1;
    if (this.data.freeChestProgress >= ECONOMY.freeChestEveryMatches) {
      this.data.freeChestProgress = 0;
      this.data.freeChestCharges += 1;
    }
    if (this.data.battleBuffMatchesRemaining > 0) {
      this.data.battleBuffMatchesRemaining -= 1;
    }
    this.save();
  }

  consumeFreeChest(): boolean {
    if (this.data.freeChestCharges <= 0) return false;
    this.data.freeChestCharges -= 1;
    this.save();
    return true;
  }

  shouldOfferStarterPack(): boolean {
    return this.data.matchesPlayed >= 2 && !this.data.starterPackOffered && !this.data.starterPackPurchased;
  }

  markStarterPackOffered(): void {
    this.data.starterPackOffered = true;
    this.save();
  }

  applyStarterPack(item: GearItem): void {
    this.data.starterPackPurchased = true;
    this.data.battleBuffMatchesRemaining += ECONOMY.starterPackBuffMatches;
    this.data.inventory = [item, ...this.data.inventory];
    if (item.slot === 'weapon') {
      this.data.weapon = item;
    } else {
      this.data.armor = item;
    }
    this.save();
  }
}

export const progression = new ProgressionManager();
