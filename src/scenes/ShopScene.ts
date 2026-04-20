import Phaser from 'phaser';
import { UIManager } from '../systems/UIManager';
import { progression } from '../systems/ProgressionManager';
import { shop, PurchaseResult } from '../systems/ShopManager';
import { COLORS, SHOP_ITEMS, WORLD } from '../config/balance';

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
  private coinText!: Phaser.GameObjects.Text;

  constructor() {
    super('ShopScene');
  }

  create(): void {
    this.ui = new UIManager(this);
    this.ui.drawBackground();
    this.ui.drawStars(40);

    const w = WORLD.width;
    this.ui.title(w / 2, 44, 'SHOP', 30, '#ff4fd8');

    // Wallets
    this.gemText = this.add.text(w / 2 + 60, 78, `${progression.state.gems} GEMS`, {
      fontFamily: 'system-ui, sans-serif', fontSize: '14px', fontStyle: '900', color: '#ff4fd8',
    }).setOrigin(0.5);
    this.coinText = this.add.text(w / 2 - 60, 78, `${progression.state.coins} COINS`, {
      fontFamily: 'system-ui, sans-serif', fontSize: '14px', fontStyle: '900', color: '#ffd24d',
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
      id: 'gemsSmall', title: SHOP_ITEMS.gemsSmall.title, subtitle: SHOP_ITEMS.gemsSmall.subtitle,
      priceLabel: SHOP_ITEMS.gemsSmall.priceLabel, color: COLORS.neonPurple,
      onBuy: () => shop.buyGemPack('gemsSmall'),
    });
    items.push({
      id: 'gemsMedium', title: SHOP_ITEMS.gemsMedium.title, subtitle: SHOP_ITEMS.gemsMedium.subtitle,
      priceLabel: SHOP_ITEMS.gemsMedium.priceLabel, color: COLORS.neonPurple,
      onBuy: () => shop.buyGemPack('gemsMedium'),
    });
    items.push({
      id: 'gemsLarge', title: SHOP_ITEMS.gemsLarge.title, subtitle: SHOP_ITEMS.gemsLarge.subtitle,
      priceLabel: SHOP_ITEMS.gemsLarge.priceLabel, color: COLORS.neonPink, badge: SHOP_ITEMS.gemsLarge.badge,
      onBuy: () => shop.buyGemPack('gemsLarge'),
    });
    items.push({
      id: 'gemsWhale', title: SHOP_ITEMS.gemsWhale.title, subtitle: SHOP_ITEMS.gemsWhale.subtitle,
      priceLabel: SHOP_ITEMS.gemsWhale.priceLabel, color: COLORS.neonCyan,
      onBuy: () => shop.buyGemPack('gemsWhale'),
    });
    items.push({
      id: 'coinDoubler', title: SHOP_ITEMS.coinDoubler.title,
      subtitle: progression.isCoinDoublerActive()
        ? `Active! ${Math.ceil(progression.coinDoublerRemainingMs() / 60000)} min left`
        : SHOP_ITEMS.coinDoubler.subtitle,
      priceLabel: SHOP_ITEMS.coinDoubler.priceLabel,
      color: COLORS.coin,
      onBuy: () => shop.buyCoinDoubler(),
    });
    items.push({
      id: 'revive', title: SHOP_ITEMS.revive.title,
      subtitle: `${SHOP_ITEMS.revive.subtitle} (owned: ${progression.state.reviveTokens})`,
      priceLabel: SHOP_ITEMS.revive.priceLabel, color: COLORS.neonCyan,
      onBuy: () => shop.buyRevive(),
    });
    if (!progression.ownsSkin('solarflare')) {
      items.push({
        id: 'skinSolarflare', title: SHOP_ITEMS.skinSolarflare.title,
        subtitle: SHOP_ITEMS.skinSolarflare.subtitle,
        priceLabel: SHOP_ITEMS.skinSolarflare.priceLabel, color: 0xff9d00,
        onBuy: () => shop.buySkin('solarflare'),
      });
    }
    if (!progression.ownsSkin('voidbird')) {
      items.push({
        id: 'skinVoidbird', title: SHOP_ITEMS.skinVoidbird.title,
        subtitle: SHOP_ITEMS.skinVoidbird.subtitle,
        priceLabel: SHOP_ITEMS.skinVoidbird.priceLabel, color: 0x7d3cff,
        badge: SHOP_ITEMS.skinVoidbird.badge,
        onBuy: () => shop.buySkin('voidbird'),
      });
    }

    this.drawItems(items);

    // Footer
    this.ui.ghostButton(w / 2 - 80, WORLD.height - 40, 120, 42, 'MENU', () => {
      this.scene.start('TitleScene');
    });
    this.ui.button(w / 2 + 80, WORLD.height - 40, 150, 46, 'PLAY', () => {
      this.scene.start('GameScene', {});
    });
  }

  private drawItems(items: ItemSpec[]): void {
    const w = WORLD.width;
    let y = 120;
    for (const item of items) {
      this.drawItemRow(w / 2, y, item);
      y += 74;
    }
  }

  private drawItemRow(x: number, y: number, item: ItemSpec): void {
    this.ui.panel(x, y, 380, 64, 0x14083a, item.color);

    // Badge
    if (item.badge) {
      const badge = this.add.text(x + 150, y - 26, item.badge, {
        fontFamily: 'system-ui, sans-serif', fontSize: '9px', fontStyle: '900', color: '#0a0420',
        backgroundColor: '#ffd24d', padding: { x: 4, y: 1 },
      }).setOrigin(0.5);
      void badge;
    }

    // Icon chip
    this.add.rectangle(x - 160, y, 40, 40, item.color, 0.25).setStrokeStyle(2, item.color, 0.9);

    this.add.text(x - 132, y - 14, item.title, {
      fontFamily: 'system-ui, sans-serif', fontSize: '14px', fontStyle: '900', color: '#ffffff',
    });
    this.add.text(x - 132, y + 4, item.subtitle, {
      fontFamily: 'system-ui, sans-serif', fontSize: '10px', color: '#a79bc6',
    });

    this.ui.button(x + 130, y, 90, 36, item.priceLabel, () => {
      const res = item.onBuy();
      if (res.ok) {
        this.flash(res.message, COLORS.neonCyan);
      } else {
        this.flash(res.reason, 0xff4060);
      }
      this.refreshWallets();
    }, { color: item.color, fontSize: 12 });
  }

  private refreshWallets(): void {
    this.gemText.setText(`${progression.state.gems} GEMS`);
    this.coinText.setText(`${progression.state.coins} COINS`);
  }

  private flash(text: string, color: number): void {
    const m = this.add.text(WORLD.width / 2, 110, text, {
      fontFamily: 'system-ui, sans-serif', fontSize: '16px', fontStyle: '900',
      color: '#' + color.toString(16).padStart(6, '0'),
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(1500);
    this.tweens.add({
      targets: m, y: 80, alpha: 0, duration: 1100, onComplete: () => m.destroy(),
    });
  }
}
