export const COLORS = {
  bgTop: 0x101928,
  bgBot: 0x040a11,
  arenaGrid: 0x183248,
  player: 0x5fe3a1,
  bot: 0xff6a8b,
  orb: 0xffd166,
  corePlayer: 0x3fbf7f,
  coreBot: 0xff5470,
  hit: 0xfff4a8,
  shield: 0x75d7ff,
  textDim: 0x9fb5c8,
  neonPink: 0xff7c91,
  neonCyan: 0x6ce5ff,
  neonPurple: 0x7f8dff,
  coin: 0xffd166,
  panel: 0x112033,
};

export const WORLD = {
  width: 420,
  height: 760,
};

export const ARENA = {
  x: 28,
  y: 118,
  width: 364,
  height: 540,
  orbSpawnEveryMs: 2000,
  playerSpawn: { x: 100, y: 390 },
  botSpawn: { x: 320, y: 390 },
  playerCore: { x: 62, y: 390 },
  botCore: { x: 358, y: 390 },
};

export const COMBAT = {
  playerRadius: 18,
  botRadius: 18,
  coreRadius: 24,
  moveSpeed: 136,
  attackRange: 92,
  attackCooldownMs: 500,
  baseDamage: 12,
  baseHp: 84,
  coreHp: 155,
  respawnMs: 1500,
  dashCooldownMs: 4200,
  dashBonusDamage: 18,
  shieldRefreshMs: 9000,
};

export const LEVELING = {
  xpThresholds: [3, 7, 12, 18, 25, 33],
  damagePerUpgrade: 4,
  attackSpeedStepMs: 70,
  attackSpeedMinMs: 220,
};

export const ECONOMY = {
  winGold: 90,
  lossGold: 45,
  freeChestEveryMatches: 3,
  paidChestCost: 120,
  starterPackPrice: '$4.99',
  starterPackBuffMatches: 10,
  starterPackDamageMultiplier: 1.2,
  premiumPacks: {
    small: { priceLabel: '$1.99', premium: 120 },
    medium: { priceLabel: '$4.99', premium: 350 },
    large: { priceLabel: '$9.99', premium: 800 },
  },
};

export const SHOP_ITEMS = {
  starterPack: {
    id: 'starterPack',
    title: 'Starter Pack',
    subtitle: 'Legendary gear + 20% damage for 10 matches',
    priceLabel: ECONOMY.starterPackPrice,
    badge: 'AFTER MATCH 2',
  },
  paidChest: {
    id: 'paidChest',
    title: 'Premium Chest',
    subtitle: 'Open now for a stronger roll',
    priceLabel: `${ECONOMY.paidChestCost} gems`,
    badge: 'NEAR MISS',
  },
};

export const RARITY_ODDS = [
  { rarity: 'common', chance: 0.7 },
  { rarity: 'rare', chance: 0.2 },
  { rarity: 'epic', chance: 0.09 },
  { rarity: 'legendary', chance: 0.01 },
] as const;
