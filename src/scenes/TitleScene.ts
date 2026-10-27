import Phaser from 'phaser';
import { UIManager } from '../systems/UIManager';
import { progression } from '../systems/ProgressionManager';
import { COLORS, ECONOMY, WORLD } from '../config/balance';

export class TitleScene extends Phaser.Scene {
  private ui!: UIManager;

  constructor() {
    super('TitleScene');
  }

  create(): void {
    this.ui = new UIManager(this);
    this.ui.drawBackground();
    this.ui.drawStars(70);

    const w = WORLD.width;

    this.ui.title(w / 2, 106, 'CORE RUSH', 54, '#ffffff');
    this.ui.label(w / 2, 145, '30-second arena duels with instant upgrades', 13);

    this.drawPreview(w / 2, 335);
    this.drawWalletStrip(w / 2, 540);

    const buffLabel = progression.hasBattleBuff()
      ? `Starter buff active: ${progression.state.battleBuffMatchesRemaining} matches left`
      : progression.shouldOfferStarterPack()
        ? 'Starter Pack unlocked in the shop'
        : `Free chest in ${Math.max(1, ECONOMY.freeChestEveryMatches - progression.state.freeChestProgress)} matches`;
    this.ui.label(w / 2, 586, buffLabel, 12);

    this.ui.button(w / 2, 646, 260, 62, 'PLAY', () => {
      this.scene.start('GameScene');
    });
    this.ui.ghostButton(w / 2 - 100, 710, 90, 42, 'SHOP', () => {
      this.scene.start('ShopScene');
    });
    this.ui.ghostButton(w / 2 + 10, 710, 110, 42, 'INVENTORY', () => {
      this.scene.start('InventoryScene');
    }, { color: COLORS.neonCyan });
    this.ui.ghostButton(w / 2 + 130, 710, 70, 42, 'RESET', () => {
      progression.reset();
      this.scene.restart();
    }, { color: COLORS.coin });
  }

  private drawPreview(x: number, y: number): void {
    const frame = this.add.container(x, y);
    const panel = this.add.rectangle(0, 0, 340, 300, 0x0a1625, 0.9).setStrokeStyle(2, COLORS.arenaGrid, 1);
    const arena = this.add.rectangle(0, 0, 300, 230, 0x0e2133, 1).setStrokeStyle(2, 0x214962, 1);
    const coreLeft = this.add.circle(-120, 0, 20, COLORS.corePlayer, 1);
    const coreRight = this.add.circle(120, 0, 20, COLORS.coreBot, 1);
    const player = this.add.circle(-78, 0, 16, COLORS.player, 1);
    const bot = this.add.circle(78, 0, 16, COLORS.bot, 1);
    const orbA = this.add.circle(-10, -38, 8, COLORS.orb, 1);
    const orbB = this.add.circle(26, 34, 8, COLORS.orb, 1);
    frame.add([panel, arena, coreLeft, coreRight, player, bot, orbA, orbB]);
    this.tweens.add({ targets: player, x: -30, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: bot, x: 30, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: [orbA, orbB], scale: 1.35, alpha: 0.6, duration: 700, yoyo: true, repeat: -1 });
  }

  private drawWalletStrip(x: number, y: number): void {
    const g = this.add.container(x, y);
    const panel = this.add.rectangle(0, 0, 320, 52, COLORS.panel, 0.92).setStrokeStyle(2, COLORS.neonPurple, 0.8);
    g.add(panel);
    this.addCurrencyCell(g, -104, 'GOLD', progression.state.gold, '#ffd166');
    this.addCurrencyCell(g, 0, 'GEMS', progression.state.premiumCurrency, '#6ce5ff');
    this.addCurrencyCell(g, 104, 'WINS', progression.state.wins, '#ffffff');
  }

  private addCurrencyCell(parent: Phaser.GameObjects.Container, x: number, label: string, value: number, color: string): void {
    const v = this.add.text(x, -4, String(value), {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '16px',
      fontStyle: '900',
      color,
    }).setOrigin(0.5);
    const l = this.add.text(x, 11, label, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '9px',
      fontStyle: '700',
      color: '#9fb5c8',
    }).setOrigin(0.5);
    parent.add([v, l]);
  }
}
