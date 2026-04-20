import type { UpgradeId, LeagueId, RunModifierId } from '../types';

/**
 * All gameplay, economy, difficulty numbers live here.
 * Do not hardcode tunables in scenes — point them at BALANCE.
 */

export const WORLD = {
  width: 420,
  height: 760,
  groundY: 720,
  ceilingY: 40,
};

export const PHYSICS = {
  gravity: 1300,
  flapVelocity: -420,
  maxFallSpeed: 900,
  coyoteTimeMs: 90,
  flapCooldownMs: 80,
  scrollSpeedStart: 180,
  scrollSpeedMax: 340,
  scrollRampPerTier: 25,
};

export const DIFFICULTY = {
  tierDurationMs: 15000,
  maxTier: 6,
  gapHeightStart: 210,
  gapHeightMin: 130,
  gapShrinkPerTier: 14,
  obstacleSpacingStart: 320,
  obstacleSpacingMin: 230,
  spacingShrinkPerTier: 18,
  mercyDurationMs: 7000, // wide gaps first 7s
  mercyGapBonus: 40,
};

// Which obstacle variants are legal at each difficulty tier (tier index 0..N).
export const OBSTACLE_UNLOCKS: Array<Array<'static' | 'moving' | 'rotating' | 'narrow' | 'double'>> = [
  ['static'],
  ['static', 'moving'],
  ['static', 'moving', 'rotating'],
  ['static', 'moving', 'rotating', 'narrow'],
  ['static', 'moving', 'rotating', 'narrow', 'double'],
  ['moving', 'rotating', 'narrow', 'double'],
  ['moving', 'rotating', 'narrow', 'double'],
];

export const ECONOMY = {
  baseCoinPerGate: 1,
  shardCoinValue: 5,
  comboBonusEveryN: 5,
  comboBonusCoins: 10,
  shardGemChance: 0.05, // shards sometimes grant a gem
  gemPerMilestoneGates: [50, 100, 200, 400],
  powerCoreDropChancePerGate: 0.05, // 1 in 20 (base)
  coinDoublerDurationMs: 30 * 60 * 1000, // 30 min
};

export const UPGRADES: Record<UpgradeId, {
  label: string;
  description: string;
  maxLevel: number;
  baseCost: number;
  costMultiplier: number;
  effectPerLevel: number;
  unit: string;
}> = {
  flapControl: {
    label: 'Flap Control',
    description: 'More lift per tap, softer fall',
    maxLevel: 5,
    baseCost: 50,
    costMultiplier: 2,
    effectPerLevel: 0.04,
    unit: '+4% lift',
  },
  shieldHits: {
    label: 'Shield',
    description: 'Start each run with bubble shields',
    maxLevel: 3,
    baseCost: 120,
    costMultiplier: 2.2,
    effectPerLevel: 1,
    unit: '+1 hit',
  },
  coinMultiplier: {
    label: 'Coin Multiplier',
    description: 'Earn more coins per gate',
    maxLevel: 5,
    baseCost: 75,
    costMultiplier: 2,
    effectPerLevel: 0.2,
    unit: '+20%',
  },
  shardDropRate: {
    label: 'Shard Drops',
    description: 'More shards spawn in the world',
    maxLevel: 5,
    baseCost: 80,
    costMultiplier: 2,
    effectPerLevel: 0.25,
    unit: '+25%',
  },
  reviveCharges: {
    label: 'Revive Tokens',
    description: 'Auto-revive once per run',
    maxLevel: 2,
    baseCost: 300,
    costMultiplier: 3,
    effectPerLevel: 1,
    unit: '+1 token',
  },
};

export const RUN_MODIFIERS: Record<RunModifierId, {
  label: string;
  description: string;
  emoji: string;
  color: number;
}> = {
  extraShield: {
    label: '+1 Shield',
    description: 'Take one extra hit this run',
    emoji: 'SHIELD',
    color: 0x00e5ff,
  },
  coinMagnet: {
    label: 'Coin Magnet',
    description: 'Pull nearby coins in',
    emoji: 'MAGNET',
    color: 0xffd24d,
  },
  smoothFlap: {
    label: 'Smooth Flap',
    description: 'Gentler gravity this run',
    emoji: 'FEATHER',
    color: 0xb388ff,
  },
};

export const SHOP_ITEMS = {
  starterPack: {
    id: 'starterPack',
    title: 'Starter Pack',
    subtitle: '1000 gems + 5000 coins + Plasma skin',
    priceLabel: '$4.99',
    badge: 'BEST VALUE',
    rewardCoins: 5000,
    rewardGems: 1000,
    rewardSkin: 'plasma' as const,
  },
  gemsSmall: {
    id: 'gemsSmall',
    title: 'Handful of Gems',
    subtitle: '100 gems',
    priceLabel: '$0.99',
    rewardGems: 100,
  },
  gemsMedium: {
    id: 'gemsMedium',
    title: 'Pocket of Gems',
    subtitle: '550 gems + 10% bonus',
    priceLabel: '$4.99',
    rewardGems: 550,
  },
  gemsLarge: {
    id: 'gemsLarge',
    title: 'Vault of Gems',
    subtitle: '1200 gems + 20% bonus',
    priceLabel: '$9.99',
    badge: 'POPULAR',
    rewardGems: 1200,
  },
  gemsWhale: {
    id: 'gemsWhale',
    title: 'Apex Hoard',
    subtitle: '2800 gems + 40% bonus',
    priceLabel: '$19.99',
    rewardGems: 2800,
  },
  coinDoubler: {
    id: 'coinDoubler',
    title: 'Coin Doubler',
    subtitle: '2x coins for 30 minutes',
    priceLabel: '50 gems',
    cost: { gems: 50 },
  },
  revive: {
    id: 'revive',
    title: 'Revive Token',
    subtitle: 'Continue a run after death',
    priceLabel: '20 gems',
    cost: { gems: 20 },
    rewardRevives: 1,
  },
  skinSolarflare: {
    id: 'skinSolarflare',
    title: 'Solarflare Skin',
    subtitle: 'Premium cosmetic',
    priceLabel: '500 gems',
    cost: { gems: 500 },
    rewardSkin: 'solarflare' as const,
  },
  skinVoidbird: {
    id: 'skinVoidbird',
    title: 'Voidbird Skin',
    subtitle: 'Exclusive animated skin',
    priceLabel: '1200 gems',
    cost: { gems: 1200 },
    rewardSkin: 'voidbird' as const,
    badge: 'EXCLUSIVE',
  },
};

export const LEAGUES: Record<LeagueId, {
  label: string;
  threshold: number;
  color: number;
  nextId: LeagueId | null;
}> = {
  bronze:  { label: 'Bronze',  threshold: 0,    color: 0xcd7f32, nextId: 'silver' },
  silver:  { label: 'Silver',  threshold: 300,  color: 0xc0c8d1, nextId: 'gold' },
  gold:    { label: 'Gold',    threshold: 900,  color: 0xffd24d, nextId: 'plasma' },
  plasma:  { label: 'Plasma',  threshold: 2200, color: 0x7fffd4, nextId: 'apex' },
  apex:    { label: 'Apex',    threshold: 5000, color: 0xff4fd8, nextId: null },
};

export const JUICE = {
  shakeDeathMs: 220,
  shakeDeathAmp: 0.008,
  shakeHitMs: 120,
  shakeHitAmp: 0.004,
  flashDeathColor: 0xff4060,
  flashDeathMs: 160,
  comboFlashEveryN: 5,
};

export const COLORS = {
  bgTop: 0x1a0a3e,
  bgBot: 0x0a0420,
  player: 0x7fffd4,
  playerGlow: 0x00e5ff,
  obstacleA: 0xff4fd8,
  obstacleB: 0x7d3cff,
  obstacleMoving: 0xffd24d,
  obstacleRotating: 0xff7a30,
  obstacleNarrow: 0xff4060,
  coin: 0xffd24d,
  shard: 0x7fffd4,
  powerCore: 0xff4fd8,
  shield: 0x00e5ff,
  textLight: 0xffffff,
  textDim: 0xa79bc6,
  neonPink: 0xff4fd8,
  neonCyan: 0x00e5ff,
  neonPurple: 0x7d3cff,
};

export const FIRST_SESSION = {
  offerRunModifierAfterRunN: 1, // offer after run #1
  offerStarterPackAfterRunN: 2, // offer after run #2
  offerReviveOnDeath: true,
  tutorialRequiredGatesToClear: 0, // tutorial is passive; just a hint
};

export const GHOST = {
  sampleIntervalMs: 80,
  opacity: 0.4,
  color: 0xa79bc6,
};

export function upgradeCost(id: UpgradeId, currentLevel: number): number {
  const u = UPGRADES[id];
  return Math.floor(u.baseCost * Math.pow(u.costMultiplier, currentLevel));
}

export function difficultyTier(elapsedMs: number): number {
  return Math.min(DIFFICULTY.maxTier, Math.floor(elapsedMs / DIFFICULTY.tierDurationMs));
}

export function scrollSpeedAt(tier: number): number {
  return Math.min(
    PHYSICS.scrollSpeedMax,
    PHYSICS.scrollSpeedStart + tier * PHYSICS.scrollRampPerTier,
  );
}

export function gapHeightAt(tier: number, elapsedMs: number): number {
  const mercy = elapsedMs < DIFFICULTY.mercyDurationMs ? DIFFICULTY.mercyGapBonus : 0;
  return Math.max(
    DIFFICULTY.gapHeightMin,
    DIFFICULTY.gapHeightStart - tier * DIFFICULTY.gapShrinkPerTier + mercy,
  );
}

export function spacingAt(tier: number): number {
  return Math.max(
    DIFFICULTY.obstacleSpacingMin,
    DIFFICULTY.obstacleSpacingStart - tier * DIFFICULTY.spacingShrinkPerTier,
  );
}
