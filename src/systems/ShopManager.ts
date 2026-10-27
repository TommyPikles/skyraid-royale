import { ECONOMY } from '../config/balance';
import { buildNearMissPreview, generateGear } from './LootSystem';
import { progression } from './ProgressionManager';
import type { CurrencyPackId } from '../types';

export type PurchaseResult =
  | { ok: true; message: string; rewardItemName?: string; preview?: ReturnType<typeof buildNearMissPreview> }
  | { ok: false; reason: string };

class ShopManager {
  buyStarterPack(): PurchaseResult {
    const item = generateGear('legendary');
    progression.applyStarterPack(item);
    return {
      ok: true,
      message: 'Starter Pack activated',
      rewardItemName: item.name,
      preview: buildNearMissPreview(item.rarity),
    };
  }

  buyCurrencyPack(id: CurrencyPackId): PurchaseResult {
    const pack = ECONOMY.premiumPacks[id];
    progression.addPremiumCurrency(pack.premium);
    return { ok: true, message: `+${pack.premium} gems` };
  }

  openPaidChest(): PurchaseResult {
    if (!progression.spendPremiumCurrency(ECONOMY.paidChestCost)) {
      return { ok: false, reason: 'Not enough gems' };
    }
    const item = generateGear();
    progression.addInventoryItem(item);
    return {
      ok: true,
      message: 'Premium chest opened',
      rewardItemName: item.name,
      preview: buildNearMissPreview(item.rarity),
    };
  }

  openFreeChest(): PurchaseResult {
    if (!progression.consumeFreeChest()) {
      return { ok: false, reason: 'Free chest not ready' };
    }
    const item = generateGear();
    progression.addInventoryItem(item);
    return {
      ok: true,
      message: 'Free chest opened',
      rewardItemName: item.name,
      preview: buildNearMissPreview(item.rarity),
    };
  }
}

export const shop = new ShopManager();
