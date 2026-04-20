import Phaser from 'phaser';
import { UIManager } from '../systems/UIManager';
import { progression } from '../systems/ProgressionManager';
import { COLORS, FIRST_SESSION, RUN_MODIFIERS, SHOP_ITEMS, WORLD } from '../config/balance';
import type { RunModifierId, RunResult } from '../types';
import { shop } from '../systems/ShopManager';

type Init = { result: RunResult };

export class ResultsScene extends Phaser.Scene {
  private ui!: UIManager;
  private result!: RunResult;

  constructor() {
    super('ResultsScene');
  }

  init(data: Init): void {
    this.result = data.result;
  }

  create(): void {
    this.ui = new UIManager(this);
    this.ui.drawBackground();
    this.ui.drawStars(40);

    const w = WORLD.width;
    const h = WORLD.height;

    this.ui.title(w / 2, 70, this.result.newBest ? 'NEW BEST!' : 'RUN COMPLETE', 32, this.result.newBest ? '#7fffd4' : '#ffffff');
    if (this.result.newBest) {
      this.ui.label(w / 2, 98, 'Ghost path updated', 12);
    }

    // Score panel
    const panelY = 170;
    this.ui.panel(w / 2, panelY, 340, 200, 0x14083a, COLORS.neonPurple);
    this.row(w / 2 - 130, panelY - 70, 'GATES', String(this.result.gates), '#ffffff');
    this.row(w / 2 + 30, panelY - 70, 'SCORE', String(this.result.score), '#ffffff');
    this.row(w / 2 - 130, panelY - 20, 'COINS', `+${this.result.coinsEarned}`, '#ffd24d');
    this.row(w / 2 + 30, panelY - 20, 'GEMS', `+${this.result.gemsEarned}`, '#ff4fd8');
    this.row(w / 2 - 130, panelY + 30, 'CORES', `+${this.result.powerCoresEarned}`, '#00e5ff');
    this.row(w / 2 + 30, panelY + 30, 'DIST', `${this.result.distance}`, '#a79bc6');

    // Ghost comparison
    if (this.result.ghostComparisonGates !== null) {
      const diff = this.result.ghostComparisonGates;
      let msg = 'Tied with your ghost';
      let color = '#a79bc6';
      if (diff > 0) {
        msg = `You lost by ${diff} gates`;
        color = '#ff4060';
      } else if (diff < 0) {
        msg = `You beat your ghost by ${-diff} gates!`;
        color = '#7fffd4';
      }
      this.add.text(w / 2, panelY + 72, msg, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        fontStyle: '700',
        color,
      }).setOrigin(0.5);
    }

    // Post-run flow logic:
    //  - after run #1: offer a free run modifier (if not already offered)
    //  - after run #2: pitch starter pack (if not yet offered)
    //  - otherwise: standard Play Again + menu
    const runNumber = progression.state.runs;
    let popupPlaced = false;
    if (runNumber === FIRST_SESSION.offerRunModifierAfterRunN && !progression.state.nextRunModifierOffered) {
      this.showRunModifierChoice();
      popupPlaced = true;
    } else if (
      runNumber === FIRST_SESSION.offerStarterPackAfterRunN &&
      !progression.state.starterPackOffered &&
      !progression.state.starterPackPurchased
    ) {
      this.showStarterPackOffer();
      popupPlaced = true;
    }

    if (!popupPlaced) {
      this.showActionRow();
    }
  }

  private row(x: number, y: number, label: string, value: string, color: string): void {
    this.add.text(x, y, label, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '11px',
      fontStyle: '700',
      color: '#a79bc6',
    });
    this.add.text(x, y + 14, value, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '22px',
      fontStyle: '900',
      color,
      stroke: '#000000',
      strokeThickness: 3,
    });
  }

  private showActionRow(): void {
    const w = WORLD.width;
    const h = WORLD.height;
    this.ui.button(w / 2, h - 150, 260, 60, 'PLAY AGAIN', () => {
      this.scene.start('GameScene', {});
    });
    this.ui.ghostButton(w / 2 - 90, h - 80, 80, 40, 'UPGRADE', () => {
      this.scene.start('UpgradeScene');
    });
    this.ui.ghostButton(w / 2, h - 80, 80, 40, 'SHOP', () => {
      this.scene.start('ShopScene');
    }, { color: COLORS.neonPink });
    this.ui.ghostButton(w / 2 + 90, h - 80, 80, 40, 'MENU', () => {
      this.scene.start('TitleScene');
    }, { color: COLORS.coin });
  }

  private showRunModifierChoice(): void {
    const w = WORLD.width;
    const h = WORLD.height;
    const cx = w / 2;
    const cy = h - 220;

    this.ui.panel(cx, cy, 360, 260, 0x14083a, COLORS.neonCyan);
    this.ui.title(cx, cy - 100, 'PICK A POWER', 24, '#ffffff');
    this.ui.label(cx, cy - 75, 'Free gift for next run', 12);

    const mods: RunModifierId[] = ['extraShield', 'coinMagnet', 'smoothFlap'];
    mods.forEach((id, i) => {
      const m = RUN_MODIFIERS[id];
      const y = cy - 30 + i * 40;
      const btn = this.add.container(cx, y);
      const bg = this.add.rectangle(0, 0, 300, 34, m.color, 0.22).setStrokeStyle(2, m.color, 0.9).setOrigin(0.5);
      const emoji = this.add.text(-130, 0, m.emoji, {
        fontFamily: 'system-ui, sans-serif', fontSize: '11px', fontStyle: '900',
        color: '#' + m.color.toString(16).padStart(6, '0'),
      }).setOrigin(0, 0.5);
      const title = this.add.text(-80, -7, m.label, {
        fontFamily: 'system-ui, sans-serif', fontSize: '14px', fontStyle: '900', color: '#ffffff',
      }).setOrigin(0, 0.5);
      const sub = this.add.text(-80, 8, m.description, {
        fontFamily: 'system-ui, sans-serif', fontSize: '10px', color: '#a79bc6',
      }).setOrigin(0, 0.5);
      btn.add([bg, emoji, title, sub]);
      btn.setSize(300, 34);
      this.ui.registerButton(btn, cx, y, 300, 34, () => {
        progression.markRunModifierOffered();
        this.scene.start('GameScene', { runModifier: id });
      });
    });
  }

  private showStarterPackOffer(): void {
    progression.markStarterPackOffered();
    const w = WORLD.width;
    const h = WORLD.height;
    const cx = w / 2;
    const cy = h - 200;
    const p = SHOP_ITEMS.starterPack;

    this.ui.panel(cx, cy, 360, 280, 0x14083a, COLORS.neonPink);

    // badge
    const badge = this.add.text(cx + 100, cy - 105, '95% OFF', {
      fontFamily: 'system-ui, sans-serif', fontSize: '12px', fontStyle: '900', color: '#0a0420',
      backgroundColor: '#ffd24d', padding: { x: 6, y: 2 },
    }).setOrigin(0.5).setAngle(10);
    void badge;

    this.ui.title(cx, cy - 95, 'STARTER PACK', 24, '#ffd24d');
    this.ui.label(cx, cy - 68, p.subtitle, 12);

    // loot row
    this.lootCell(cx - 100, cy - 30, COLORS.coin, `+${p.rewardCoins}`, 'COINS');
    this.lootCell(cx, cy - 30, COLORS.neonPink, `+${p.rewardGems}`, 'GEMS');
    this.lootCell(cx + 100, cy - 30, COLORS.neonCyan, 'PLASMA', 'SKIN');

    this.add.text(cx - 60, cy + 40, '$19.99', {
      fontFamily: 'system-ui, sans-serif', fontSize: '14px', fontStyle: '700',
      color: '#a79bc6',
    }).setOrigin(0.5).setStyle({ textDecoration: 'line-through' });

    this.add.text(cx + 10, cy + 40, p.priceLabel, {
      fontFamily: 'system-ui, sans-serif', fontSize: '28px', fontStyle: '900',
      color: '#7fffd4',
    }).setOrigin(0.5);

    this.ui.button(cx, cy + 85, 240, 50, 'CLAIM NOW', () => {
      const res = shop.buyStarterPack();
      if (res.ok) {
        this.flashMessage(res.message, COLORS.neonCyan);
      }
      this.time.delayedCall(700, () => this.showActionRow());
    }, { color: COLORS.neonPink });

    this.ui.ghostButton(cx, cy + 130, 140, 32, 'Skip for now', () => {
      this.showActionRow();
    });
  }

  private lootCell(x: number, y: number, color: number, value: string, label: string): void {
    const bg = this.add.rectangle(x, y, 80, 60, color, 0.18).setStrokeStyle(1, color, 0.8);
    this.add.text(x, y - 8, value, {
      fontFamily: 'system-ui, sans-serif', fontSize: '16px', fontStyle: '900',
      color: '#' + color.toString(16).padStart(6, '0'),
    }).setOrigin(0.5);
    this.add.text(x, y + 14, label, {
      fontFamily: 'system-ui, sans-serif', fontSize: '10px', fontStyle: '700',
      color: '#a79bc6',
    }).setOrigin(0.5);
    void bg;
  }

  private flashMessage(text: string, color: number): void {
    const m = this.add.text(WORLD.width / 2, 120, text, {
      fontFamily: 'system-ui, sans-serif', fontSize: '18px', fontStyle: '900',
      color: '#' + color.toString(16).padStart(6, '0'),
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(1500);
    this.tweens.add({
      targets: m, y: 80, alpha: 0, duration: 1400, onComplete: () => m.destroy(),
    });
  }
}
