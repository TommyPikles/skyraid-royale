import { RARITY_ODDS } from '../config/balance';
import type { GearItem, GearSlot, Rarity } from '../types';

const SLOT_NAMES: Record<GearSlot, string[]> = {
  weapon: ['Pulse Ring', 'Nova Spinner', 'Rift Disk', 'Volt Halo'],
  armor: ['Core Shell', 'Ward Mesh', 'Titan Wrap', 'Bulwark Skin'],
};

const RARITY_BONUS: Record<Rarity, number> = {
  common: 0,
  rare: 4,
  epic: 9,
  legendary: 16,
};

export function rollRarity(): Rarity {
  const roll = Math.random();
  let cursor = 0;
  for (const entry of RARITY_ODDS) {
    cursor += entry.chance;
    if (roll <= cursor) return entry.rarity;
  }
  return 'common';
}

export function buildNearMissPreview(finalRarity: Rarity): Rarity[] {
  if (finalRarity === 'legendary') {
    return ['rare', 'epic', 'legendary', 'legendary', 'epic'];
  }
  return ['common', 'rare', 'epic', 'legendary', finalRarity];
}

export function generateGear(forcedRarity?: Rarity): GearItem {
  const rarity = forcedRarity ?? rollRarity();
  const slot: GearSlot = Math.random() < 0.5 ? 'weapon' : 'armor';
  const name = `${capitalize(rarity)} ${randomFrom(SLOT_NAMES[slot])}`;
  const bonus = RARITY_BONUS[rarity];
  return {
    id: `${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    name,
    slot,
    rarity,
    damageBonus: slot === 'weapon' ? 4 + bonus : Math.floor(bonus / 3),
    hpBonus: slot === 'armor' ? 10 + bonus * 2 : Math.floor(bonus / 2),
  };
}

function randomFrom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
