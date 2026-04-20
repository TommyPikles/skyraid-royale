import type { SaveData, UpgradeId, SkinId, GhostFrame, LeagueId } from '../types';
import { UPGRADES, ECONOMY, LEAGUES, upgradeCost } from '../config/balance';

const SAVE_KEY = 'skyraid.save.v1';
const SAVE_VERSION = 1;

function defaultSave(): SaveData {
  const upgrades: SaveData['upgrades'] = {
    flapControl: { level: 0 },
    shieldHits: { level: 0 },
    coinMultiplier: { level: 0 },
    shardDropRate: { level: 0 },
    reviveCharges: { level: 0 },
  };
  return {
    version: SAVE_VERSION,
    runs: 0,
    bestScore: 0,
    bestGates: 0,
    lifetimeCoins: 0,
    coins: 0,
    gems: 0,
    powerCores: 0,
    upgrades,
    ownedSkins: ['default'],
    selectedSkin: 'default',
    starterPackOffered: false,
    starterPackPurchased: false,
    coinDoublerUntil: 0,
    reviveTokens: 0,
    lastPlayed: Date.now(),
    leagueId: 'bronze',
    leaguePoints: 0,
    ghostBestPath: null,
    ghostBestGates: 0,
    nextRunModifierOffered: false,
    tutorialCompleted: false,
  };
}

/**
 * ProgressionManager — localStorage-backed save, currencies, upgrades.
 * Singleton (exported instance). Import `progression` anywhere.
 */
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

  save(): void {
    try {
      this.data.lastPlayed = Date.now();
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch {
      // localStorage unavailable (private mode, etc.) — run in-memory
    }
  }

  reset(): void {
    this.data = defaultSave();
    this.save();
  }

  get state(): SaveData {
    return this.data;
  }

  // ---- Currencies ----------------------------------------------------------

  addCoins(amount: number): number {
    const mult = this.getCoinMultiplier();
    const final = Math.floor(amount * mult);
    this.data.coins += final;
    this.data.lifetimeCoins += final;
    return final;
  }

  spendCoins(amount: number): boolean {
    if (this.data.coins < amount) return false;
    this.data.coins -= amount;
    this.save();
    return true;
  }

  addGems(amount: number): void {
    this.data.gems += amount;
    this.save();
  }

  spendGems(amount: number): boolean {
    if (this.data.gems < amount) return false;
    this.data.gems -= amount;
    this.save();
    return true;
  }

  addPowerCores(amount: number): void {
    this.data.powerCores += amount;
  }

  // ---- Run tracking --------------------------------------------------------

  recordRun(result: {
    score: number;
    gates: number;
    coinsEarned: number;
    gemsEarned: number;
    powerCoresEarned: number;
    ghostPath: GhostFrame[];
  }): { newBest: boolean; leagueChanged: boolean } {
    this.data.runs += 1;
    let newBest = false;
    if (result.gates > this.data.bestGates) {
      this.data.bestGates = result.gates;
      this.data.bestScore = result.score;
      this.data.ghostBestPath = result.ghostPath;
      this.data.ghostBestGates = result.gates;
      newBest = true;
    }
    // League points = gates cleared
    this.data.leaguePoints += result.gates;
    const leagueChanged = this.recomputeLeague();
    this.save();
    return { newBest, leagueChanged };
  }

  private recomputeLeague(): boolean {
    const current = this.data.leagueId;
    const order: LeagueId[] = ['bronze', 'silver', 'gold', 'plasma', 'apex'];
    let pick: LeagueId = 'bronze';
    for (const id of order) {
      if (this.data.leaguePoints >= LEAGUES[id].threshold) pick = id;
    }
    if (pick !== current) {
      this.data.leagueId = pick;
      return true;
    }
    return false;
  }

  // ---- Upgrades ------------------------------------------------------------

  getUpgradeLevel(id: UpgradeId): number {
    return this.data.upgrades[id].level;
  }

  getUpgradeCost(id: UpgradeId): number {
    return upgradeCost(id, this.data.upgrades[id].level);
  }

  canUpgrade(id: UpgradeId): boolean {
    const lvl = this.data.upgrades[id].level;
    if (lvl >= UPGRADES[id].maxLevel) return false;
    return this.data.coins >= this.getUpgradeCost(id);
  }

  isUpgradeMaxed(id: UpgradeId): boolean {
    return this.data.upgrades[id].level >= UPGRADES[id].maxLevel;
  }

  purchaseUpgrade(id: UpgradeId): boolean {
    if (!this.canUpgrade(id)) return false;
    const cost = this.getUpgradeCost(id);
    this.data.coins -= cost;
    this.data.upgrades[id].level += 1;
    this.save();
    return true;
  }

  // ---- Derived stats used by GameScene ------------------------------------

  getCoinMultiplier(): number {
    const base = 1 + this.data.upgrades.coinMultiplier.level * UPGRADES.coinMultiplier.effectPerLevel;
    const doubler = this.data.coinDoublerUntil > Date.now() ? 2 : 1;
    return base * doubler;
  }

  getFlapControlBonus(): number {
    return this.data.upgrades.flapControl.level * UPGRADES.flapControl.effectPerLevel;
  }

  getStartingShields(): number {
    return this.data.upgrades.shieldHits.level * UPGRADES.shieldHits.effectPerLevel;
  }

  getShardDropRateMultiplier(): number {
    return 1 + this.data.upgrades.shardDropRate.level * UPGRADES.shardDropRate.effectPerLevel;
  }

  getReviveCharges(): number {
    return this.data.upgrades.reviveCharges.level * UPGRADES.reviveCharges.effectPerLevel
      + this.data.reviveTokens;
  }

  getPowerCoreDropChance(): number {
    return ECONOMY.powerCoreDropChancePerGate * (1 + 0.25 * this.data.upgrades.shardDropRate.level);
  }

  // ---- Shop helpers --------------------------------------------------------

  ownsSkin(id: SkinId): boolean {
    return this.data.ownedSkins.includes(id);
  }

  unlockSkin(id: SkinId): void {
    if (!this.data.ownedSkins.includes(id)) {
      this.data.ownedSkins.push(id);
    }
    this.save();
  }

  selectSkin(id: SkinId): boolean {
    if (!this.ownsSkin(id)) return false;
    this.data.selectedSkin = id;
    this.save();
    return true;
  }

  activateCoinDoubler(durationMs: number): void {
    const base = Math.max(Date.now(), this.data.coinDoublerUntil);
    this.data.coinDoublerUntil = base + durationMs;
    this.save();
  }

  isCoinDoublerActive(): boolean {
    return this.data.coinDoublerUntil > Date.now();
  }

  coinDoublerRemainingMs(): number {
    return Math.max(0, this.data.coinDoublerUntil - Date.now());
  }

  consumeReviveToken(): boolean {
    if (this.data.reviveTokens > 0) {
      this.data.reviveTokens -= 1;
      this.save();
      return true;
    }
    return false;
  }

  addReviveTokens(n: number): void {
    this.data.reviveTokens += n;
    this.save();
  }

  markStarterPackOffered(): void {
    this.data.starterPackOffered = true;
    this.save();
  }

  markStarterPackPurchased(): void {
    this.data.starterPackPurchased = true;
    this.save();
  }

  markTutorialCompleted(): void {
    this.data.tutorialCompleted = true;
    this.save();
  }

  markRunModifierOffered(): void {
    this.data.nextRunModifierOffered = true;
    this.save();
  }

  clearRunModifierFlag(): void {
    this.data.nextRunModifierOffered = false;
    this.save();
  }
}

export const progression = new ProgressionManager();
