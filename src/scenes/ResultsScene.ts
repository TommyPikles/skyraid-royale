import Phaser from 'phaser';
import { UIManager } from '../systems/UIManager';
import { progression } from '../systems/ProgressionManager';
import { COLORS, WORLD } from '../config/balance';
import type { MatchReward, Rarity } from '../types';

type Init = { reward: MatchReward };

export class ResultsScene extends Phaser.Scene {
  private ui!: UIManager;
  private reward!: MatchReward;

  constructor() {
    super('ResultsScene');
  }

  init(data: Init): void {
    this.reward = data.reward;
  }

  create(): void {
    this.ui = new UIManager(this);
    this.ui.drawBackground();
    this.ui.drawStars(40);

    const w = WORLD.width;
    const h = WORLD.height;

    this.ui.title(w / 2, 70, this.reward.winner === 'player' ? 'VICTORY' : 'DEFEAT', 34, '#ffffff');
    this.ui.label(w / 2, 100, `${Math.round(this.reward.durationMs / 100) / 10}s match`, 13);

    this.ui.panel(w / 2, 200, 340, 120, COLORS.panel, COLORS.neonPurple);
    this.metric(w / 2 - 105, 170, 'GOLD', `+${this.reward.goldEarned}`, '#ffd166');
    this.metric(w / 2, 170, 'DROP', this.reward.loot.rarity.toUpperCase(), this.rarityColor(this.reward.loot.rarity));
    this.metric(
      w / 2 + 105,
      170,
      'CHEST',
      this.reward.freeChestReady ? 'READY' : `${3 - progression.state.freeChestProgress}/3`,
      this.reward.freeChestReady ? '#6ce5ff' : '#ffffff',
    );

    this.ui.panel(w / 2, 360, 360, 180, COLORS.panel, this.rarityColorValue(this.reward.loot.rarity));
    this.ui.title(w / 2, 300, this.reward.loot.name, 24, '#ffffff');
    this.ui.label(
      w / 2,
      328,
      `${this.reward.loot.slot.toUpperCase()}  •  +${this.reward.loot.damageBonus} DMG  •  +${this.reward.loot.hpBonus} HP`,
      12,
    );
    this.drawNearMissStrip(w / 2, 382, this.reward.chestPreview);

    this.ui.button(w / 2, 468, 180, 44, 'EQUIP', () => {
      progression.equipItem(this.reward.loot.id);
      this.flashMessage('Equipped');
    }, { color: this.rarityColorValue(this.reward.loot.rarity), fontSize: 16 });

    if (this.reward.starterPackOffer) {
      progression.markStarterPackOffered();
      this.ui.panel(w / 2, 592, 360, 120, COLORS.panel, COLORS.neonPink);
      this.ui.title(w / 2, 558, 'STARTER PACK', 22, '#ffd166');
      this.ui.label(w / 2, 584, 'Guaranteed Legendary + 20% damage for 10 matches', 11);
      this.ui.label(w / 2, 604, '$4.99 mock offer for the prototype', 12);
      this.ui.ghostButton(w / 2, 636, 190, 34, 'OPEN SHOP OFFER', () => this.scene.start('ShopScene'), { color: COLORS.neonPink });
    }

    this.ui.button(w / 2, h - 86, 220, 56, 'PLAY AGAIN', () => {
      this.scene.start('GameScene');
    });
    this.ui.ghostButton(w / 2 - 92, h - 34, 110, 36, 'INVENTORY', () => {
      this.scene.start('InventoryScene');
    });
    this.ui.ghostButton(w / 2 + 92, h - 34, 110, 36, 'MENU', () => {
      this.scene.start('TitleScene');
    }, { color: COLORS.coin });
  }

  private metric(x: number, y: number, label: string, value: string, color: string): void {
    this.add.text(x, y, label, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '11px',
      fontStyle: '700',
      color: '#9fb5c8',
    }).setOrigin(0.5);
    this.add.text(x, y + 22, value, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '22px',
      fontStyle: '900',
      color,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
  }

  private drawNearMissStrip(x: number, y: number, preview: Rarity[]): void {
    preview.forEach((rarity, index) => {
      const px = x - 120 + index * 60;
      this.add.rectangle(px, y, 52, 68, this.rarityColorValue(rarity), index === preview.length - 1 ? 0.5 : 0.22)
        .setStrokeStyle(index === preview.length - 1 ? 3 : 1, this.rarityColorValue(rarity), 1);
      this.add.text(px, y - 6, rarity.slice(0, 4).toUpperCase(), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        fontStyle: '900',
        color: '#ffffff',
      }).setOrigin(0.5);
      if (index === preview.length - 2) {
        this.add.text(px, y + 18, 'SO CLOSE', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '8px',
          fontStyle: '900',
          color: '#ffffff',
        }).setOrigin(0.5);
      }
    });
  }

  private flashMessage(text: string): void {
    const label = this.add.text(WORLD.width / 2, 520, text, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      fontStyle: '900',
      color: '#6ce5ff',
    }).setOrigin(0.5);
    this.tweens.add({ targets: label, alpha: 0, y: 490, duration: 800, onComplete: () => label.destroy() });
  }

  private rarityColor(rarity: Rarity): string {
    return '#' + this.rarityColorValue(rarity).toString(16).padStart(6, '0');
  }

  private rarityColorValue(rarity: Rarity): number {
    if (rarity === 'legendary') return 0xffd166;
    if (rarity === 'epic') return 0xb07cff;
    if (rarity === 'rare') return 0x6ce5ff;
    return 0x9fb5c8;
  }
}
