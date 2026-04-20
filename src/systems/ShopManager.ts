import { SHOP_ITEMS, ECONOMY } from '../config/balance';
import { progression } from './ProgressionManager';
import type { SkinId } from '../types';

export type PurchaseResult =
  | { ok: true; message: string }
  | { ok: false; reason: string };

/**
 * ShopManager — mock IAP. In production, hook these into StoreKit / Play Billing.
 * Paid items (USD priceLabel) silently succeed in prototype.
 * Virtual items (gem cost) actually spend gems.
 */
class ShopManager {
  buyStarterPack(): PurchaseResult {
    const p = SHOP_ITEMS.starterPack;
    progression.addCoins(p.rewardCoins);
    progression.addGems(p.rewardGems);
    progression.unlockSkin(p.rewardSkin);
    progression.selectSkin(p.rewardSkin);
    progression.markStarterPackPurchased();
    return { ok: true, message: 'Starter Pack unlocked!' };
  }

  buyGemPack(id: 'gemsSmall' | 'gemsMedium' | 'gemsLarge' | 'gemsWhale'): PurchaseResult {
    const p = SHOP_ITEMS[id];
    progression.addGems(p.rewardGems);
    return { ok: true, message: `+${p.rewardGems} gems` };
  }

  buyCoinDoubler(): PurchaseResult {
    const p = SHOP_ITEMS.coinDoubler;
    if (!progression.spendGems(p.cost.gems)) {
      return { ok: false, reason: 'Not enough gems' };
    }
    progression.activateCoinDoubler(ECONOMY.coinDoublerDurationMs);
    return { ok: true, message: 'Coin Doubler: 30 min' };
  }

  buyRevive(): PurchaseResult {
    const p = SHOP_ITEMS.revive;
    if (!progression.spendGems(p.cost.gems)) {
      return { ok: false, reason: 'Not enough gems' };
    }
    progression.addReviveTokens(1);
    return { ok: true, message: '+1 Revive Token' };
  }

  buySkin(id: Exclude<SkinId, 'default' | 'plasma'>): PurchaseResult {
    const key = id === 'solarflare' ? 'skinSolarflare' : 'skinVoidbird';
    const p = SHOP_ITEMS[key];
    if (progression.ownsSkin(id)) {
      return { ok: false, reason: 'Already owned' };
    }
    if (!progression.spendGems(p.cost.gems)) {
      return { ok: false, reason: 'Not enough gems' };
    }
    progression.unlockSkin(id);
    progression.selectSkin(id);
    return { ok: true, message: `${p.title} equipped!` };
  }
}

export const shop = new ShopManager();
