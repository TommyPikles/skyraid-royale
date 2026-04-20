import Phaser from 'phaser';
import { UIManager } from '../systems/UIManager';
import { progression } from '../systems/ProgressionManager';
import { UPGRADES, COLORS, WORLD } from '../config/balance';
import type { UpgradeId } from '../types';

const UPGRADE_ORDER: UpgradeId[] = [
  'flapControl',
  'shieldHits',
  'coinMultiplier',
  'shardDropRate',
  'reviveCharges',
];

export class UpgradeScene extends Phaser.Scene {
  private ui!: UIManager;
  private rows: Map<UpgradeId, { costText: Phaser.GameObjects.Text; levelText: Phaser.GameObjects.Text; bar: Phaser.GameObjects.Rectangle[]; btn: Phaser.GameObjects.Container }> = new Map();
  private coinText!: Phaser.GameObjects.Text;

  constructor() {
    super('UpgradeScene');
  }

  create(): void {
    this.ui = new UIManager(this);
    this.ui.drawBackground();
    this.ui.drawStars(40);

    const w = WORLD.width;

    this.ui.title(w / 2, 50, 'UPGRADES', 30, '#7fffd4');

    // Coin wallet chip
    const walletX = w / 2;
    const walletY = 90;
    this.add.rectangle(walletX, walletY, 160, 30, 0x14083a, 0.9).setStrokeStyle(2, COLORS.coin, 0.9);
    this.coinText = this.add.text(walletX, walletY, `${progression.state.coins} COINS`, {
      fontFamily: 'system-ui, sans-serif', fontSize: '16px', fontStyle: '900', color: '#ffd24d',
    }).setOrigin(0.5);

    // Rows
    let y = 140;
    for (const id of UPGRADE_ORDER) {
      this.drawRow(id, y);
      y += 92;
    }

    // Footer nav
    this.ui.ghostButton(w / 2 - 80, WORLD.height - 40, 120, 42, 'MENU', () => {
      this.scene.start('TitleScene');
    });
    this.ui.button(w / 2 + 80, WORLD.height - 40, 150, 46, 'PLAY', () => {
      this.scene.start('GameScene', {});
    });
  }

  private drawRow(id: UpgradeId, y: number): void {
    const def = UPGRADES[id];
    const w = WORLD.width;
    const lvl = progression.getUpgradeLevel(id);
    const maxed = progression.isUpgradeMaxed(id);

    this.ui.panel(w / 2, y, 380, 80, 0x14083a, COLORS.neonPurple);

    // Icon chip
    this.add.rectangle(w / 2 - 160, y, 40, 40, COLORS.neonPurple, 0.3).setStrokeStyle(2, COLORS.neonPurple, 0.9);

    this.add.text(w / 2 - 132, y - 22, def.label, {
      fontFamily: 'system-ui, sans-serif', fontSize: '15px', fontStyle: '900', color: '#ffffff',
    }).setOrigin(0, 0);
    this.add.text(w / 2 - 132, y - 4, def.description, {
      fontFamily: 'system-ui, sans-serif', fontSize: '10px', color: '#a79bc6',
    }).setOrigin(0, 0);
    this.add.text(w / 2 - 132, y + 12, def.unit, {
      fontFamily: 'system-ui, sans-serif', fontSize: '10px', fontStyle: '700',
      color: '#' + COLORS.neonCyan.toString(16).padStart(6, '0'),
    }).setOrigin(0, 0);

    // level pips
    const bars: Phaser.GameObjects.Rectangle[] = [];
    for (let i = 0; i < def.maxLevel; i++) {
      const pipX = w / 2 - 132 + i * 14;
      const filled = i < lvl;
      const pip = this.add.rectangle(pipX, y + 30, 10, 5, filled ? COLORS.neonCyan : 0x333355, 1);
      bars.push(pip);
    }

    // Cost + button
    const levelText = this.add.text(w / 2 + 110, y - 24, `LV ${lvl}/${def.maxLevel}`, {
      fontFamily: 'system-ui, sans-serif', fontSize: '10px', fontStyle: '700', color: '#a79bc6',
    }).setOrigin(0.5);

    const costNum = maxed ? '—' : String(progression.getUpgradeCost(id));
    const costText = this.add.text(w / 2 + 110, y - 4, costNum, {
      fontFamily: 'system-ui, sans-serif', fontSize: '16px', fontStyle: '900', color: '#ffd24d',
    }).setOrigin(0.5);

    const btn = this.ui.button(w / 2 + 110, y + 22, 100, 30, maxed ? 'MAX' : 'UPGRADE', () => {
      if (maxed) return;
      if (progression.purchaseUpgrade(id)) {
        this.refresh();
        this.flashRow(w / 2, y);
      } else {
        this.flashError(w / 2, y);
      }
    }, { color: maxed ? 0x444466 : COLORS.neonPink, fontSize: 12 });

    this.rows.set(id, { costText, levelText, bar: bars, btn });
  }

  private refresh(): void {
    this.coinText.setText(`${progression.state.coins} COINS`);
    for (const id of UPGRADE_ORDER) {
      const def = UPGRADES[id];
      const lvl = progression.getUpgradeLevel(id);
      const maxed = progression.isUpgradeMaxed(id);
      const r = this.rows.get(id)!;
      r.levelText.setText(`LV ${lvl}/${def.maxLevel}`);
      r.costText.setText(maxed ? '—' : String(progression.getUpgradeCost(id)));
      r.bar.forEach((pip, i) => {
        pip.setFillStyle(i < lvl ? COLORS.neonCyan : 0x333355);
      });
      // Rebuild the button label/color by tweening the text in place
      const label = r.btn.getAt(2) as Phaser.GameObjects.Text;
      const bg = r.btn.getAt(1) as Phaser.GameObjects.Rectangle;
      label.setText(maxed ? 'MAX' : 'UPGRADE');
      bg.setFillStyle(maxed ? 0x444466 : COLORS.neonPink, 1);
    }
  }

  private flashRow(x: number, y: number): void {
    const ring = this.add.rectangle(x, y, 380, 80, COLORS.neonCyan, 0.2).setStrokeStyle(3, COLORS.neonCyan, 0.9);
    this.tweens.add({ targets: ring, alpha: 0, duration: 500, onComplete: () => ring.destroy() });
  }

  private flashError(x: number, y: number): void {
    const t = this.add.text(x, y + 48, 'NOT ENOUGH COINS', {
      fontFamily: 'system-ui, sans-serif', fontSize: '11px', fontStyle: '900', color: '#ff4060',
    }).setOrigin(0.5);
    this.tweens.add({ targets: t, alpha: 0, duration: 900, onComplete: () => t.destroy() });
  }
}
