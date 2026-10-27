import Phaser from 'phaser';
import { UIManager } from '../systems/UIManager';
import { progression } from '../systems/ProgressionManager';
import { shop, type PurchaseResult } from '../systems/ShopManager';
import { COLORS, ECONOMY, SHOP_ITEMS, WORLD } from '../config/balance';

interface ItemSpec {
  id: string;
  title: string;
  subtitle: string;
  priceLabel: string;
  color: number;
  badge?: string;
  onBuy: () => PurchaseResult;
}

export class ShopScene extends Phaser.Scene {
  private ui!: UIManager;
  private gemText!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;

  constructor() {
    super('ShopScene');
  }

  create(): void {
    this.ui = new UIManager(this);
    this.ui.drawBackground();
    this.ui.drawStars(40);

    const w = WORLD.width;
    this.ui.title(w / 2, 44, 'SHOP', 30, '#ff7c91');

    this.gemText = this.add.text(w / 2 + 70, 78, `${progression.state.premiumCurrency} GEMS`, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      fontStyle: '900',
      color: '#6ce5ff',
    }).setOrigin(0.5);
    this.goldText = this.add.text(w / 2 - 70, 78, `${progression.state.gold} GOLD`, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      fontStyle: '900',
      color: '#ffd166',
    }).setOrigin(0.5);

    const items: ItemSpec[] = [];
    if (!progression.state.starterPackPurchased) {
      items.push({
        id: 'starterPack',
        title: SHOP_ITEMS.starterPack.title,
        subtitle: SHOP_ITEMS.starterPack.subtitle,
        priceLabel: SHOP_ITEMS.starterPack.priceLabel,
        badge: SHOP_ITEMS.starterPack.badge,
        color: COLORS.neonPink,
        onBuy: () => shop.buyStarterPack(),
      });
    }
    items.push({
      id: 'freeChest',
      title: 'Free Chest',
      subtitle: progression.state.freeChestCharges > 0
        ? 'Ready to open now'
        : `${progression.state.freeChestProgress}/${ECONOMY.freeChestEveryMatches} matches complete`,
      priceLabel: progression.state.freeChestCharges > 0 ? 'FREE' : 'LOCKED',
      color: COLORS.neonCyan,
      badge: progression.state.freeChestCharges > 0 ? 'READY' : undefined,
      onBuy: () => shop.openFreeChest(),
    });
    items.push({
      id: 'small',
      title: 'Gem Pack S',
      subtitle: `+${ECONOMY.premiumPacks.small.premium} gems`,
      priceLabel: ECONOMY.premiumPacks.small.priceLabel,
      color: COLORS.neonPurple,
      onBuy: () => shop.buyCurrencyPack('small'),
    });
    items.push({
      id: 'medium',
      title: 'Gem Pack M',
      subtitle: `+${ECONOMY.premiumPacks.medium.premium} gems`,
      priceLabel: ECONOMY.premiumPacks.medium.priceLabel,
      color: COLORS.neonCyan,
      onBuy: () => shop.buyCurrencyPack('medium'),
    });
    items.push({
      id: 'large',
      title: 'Gem Pack L',
      subtitle: `+${ECONOMY.premiumPacks.large.premium} gems`,
      priceLabel: ECONOMY.premiumPacks.large.priceLabel,
      color: COLORS.neonPink,
      badge: 'BEST VALUE',
      onBuy: () => shop.buyCurrencyPack('large'),
    });
    items.push({
      id: 'paidChest',
      title: SHOP_ITEMS.paidChest.title,
      subtitle: SHOP_ITEMS.paidChest.subtitle,
      priceLabel: SHOP_ITEMS.paidChest.priceLabel,
      color: COLORS.coin,
      badge: SHOP_ITEMS.paidChest.badge,
      onBuy: () => shop.openPaidChest(),
    });

    this.drawItems(items);

    this.ui.ghostButton(w / 2 - 80, WORLD.height - 40, 120, 42, 'MENU', () => {
      this.scene.start('TitleScene');
    });
    this.ui.button(w / 2 + 80, WORLD.height - 40, 150, 46, 'INVENTORY', () => {
      this.scene.start('InventoryScene');
    });
  }

  private drawItems(items: ItemSpec[]): void {
    const w = WORLD.width;
    let y = 132;
    for (const item of items) {
      this.drawItemRow(w / 2, y, item);
      y += 82;
    }
  }

  private drawItemRow(x: number, y: number, item: ItemSpec): void {
    this.ui.panel(x, y, 380, 70, COLORS.panel, item.color);

    if (item.badge) {
      this.add.text(x + 145, y - 28, item.badge, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '9px',
        fontStyle: '900',
        color: '#0a0f19',
        backgroundColor: '#ffd166',
        padding: { x: 4, y: 1 },
      }).setOrigin(0.5);
    }

    this.add.rectangle(x - 160, y, 40, 40, item.color, 0.25).setStrokeStyle(2, item.color, 0.9);
    this.add.text(x - 132, y - 14, item.title, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      fontStyle: '900',
      color: '#ffffff',
    });
    this.add.text(x - 132, y + 4, item.subtitle, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '10px',
      color: '#9fb5c8',
    });

    this.ui.button(x + 130, y, 94, 38, item.priceLabel, () => {
      const res = item.onBuy();
      if (res.ok) {
        this.flash(res.rewardItemName ? `${res.message} • ${res.rewardItemName}` : res.message, COLORS.neonCyan);
        if (res.preview) {
          this.drawPreviewStrip(x, y + 56, res.preview);
        }
      } else {
        this.flash(res.reason, 0xff4060);
      }
      this.refreshWallets();
    }, { color: item.color, fontSize: 12 });
  }

  private refreshWallets(): void {
    this.gemText.setText(`${progression.state.premiumCurrency} GEMS`);
    this.goldText.setText(`${progression.state.gold} GOLD`);
    this.time.delayedCall(250, () => this.scene.restart());
  }

  private drawPreviewStrip(x: number, y: number, preview: Array<'common' | 'rare' | 'epic' | 'legendary'>): void {
    preview.forEach((rarity, index) => {
      const px = x - 104 + index * 52;
      const color = rarity === 'legendary' ? 0xffd166 : rarity === 'epic' ? 0xb07cff : rarity === 'rare' ? 0x6ce5ff : 0x9fb5c8;
      const block = this.add.rectangle(px, y, 42, 22, color, 0.28).setStrokeStyle(index === preview.length - 1 ? 2 : 1, color, 1);
      this.tweens.add({ targets: block, alpha: 0, duration: 1400, onComplete: () => block.destroy() });
    });
  }

  private flash(text: string, color: number): void {
    const m = this.add.text(WORLD.width / 2, 110, text, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      fontStyle: '900',
      color: '#' + color.toString(16).padStart(6, '0'),
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(1500);
    this.tweens.add({ targets: m, y: 80, alpha: 0, duration: 1100, onComplete: () => m.destroy() });
  }
}
