import { COMBAT, LEVELING } from '../config/balance';
import type { UpgradeChoiceId } from '../types';

export interface FighterStats {
  maxHp: number;
  hp: number;
  damage: number;
  attackCooldownMs: number;
  moveSpeed: number;
  attackRange: number;
  special: 'dash' | 'shield' | null;
  shieldCharges: number;
  dashCooldownLeftMs: number;
  shieldRefreshLeftMs: number;
}

export function createFighterStats(bonusDamage: number, bonusHp: number, damageMultiplier: number): FighterStats {
  const maxHp = COMBAT.baseHp + bonusHp;
  return {
    maxHp,
    hp: maxHp,
    damage: Math.round((COMBAT.baseDamage + bonusDamage) * damageMultiplier),
    attackCooldownMs: COMBAT.attackCooldownMs,
    moveSpeed: COMBAT.moveSpeed,
    attackRange: COMBAT.attackRange,
    special: null,
    shieldCharges: 0,
    dashCooldownLeftMs: 0,
    shieldRefreshLeftMs: COMBAT.shieldRefreshMs,
  };
}

export function applyUpgrade(stats: FighterStats, choice: UpgradeChoiceId): void {
  if (choice === 'damage') {
    stats.damage += LEVELING.damagePerUpgrade;
    return;
  }
  if (choice === 'attackSpeed') {
    stats.attackCooldownMs = Math.max(LEVELING.attackSpeedMinMs, stats.attackCooldownMs - LEVELING.attackSpeedStepMs);
    return;
  }
  if (choice === 'dash') {
    stats.special = 'dash';
    return;
  }
  stats.special = 'shield';
  stats.shieldCharges += 1;
}

export function distance(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

export function normalize(dx: number, dy: number): { x: number; y: number } {
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}
