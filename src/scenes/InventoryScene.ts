import Phaser from 'phaser';
import { UIManager } from '../systems/UIManager';
import { progression } from '../systems/ProgressionManager';
import { COLORS, WORLD } from '../config/balance';
import type { GearItem, Rarity } from '../types';

export class InventoryScene extends Phaser.Scene {
  private ui!: UIManager;

  constructor() {
    super('InventoryScene');
  }

  create(): void {
    this.ui = new UIManager(this);
    this.ui.drawBackground();
    this.ui.drawStars(36);

    this.ui.title(WORLD.width / 2, 46, 'INVENTORY', 30, '#ffffff');
    this.drawSlotCard(104, 126, 'WEAPON', progression.state.weapon);
    this.drawSlotCard(316, 126, 'ARMOR', progression.state.armor);

    let y = 248;
    const items = progression.state.inventory.slice(0, 6);
    items.forEach((item) => {
      this.drawItemRow(WORLD.width / 2, y, item);
      y += 76;
    });

    if (items.length === 0) {
      this.ui.label(WORLD.width / 2, 340, 'Play matches to collect gear', 14);
    }

    this.ui.ghostButton(WORLD.width / 2 - 80, WORLD.height - 40, 120, 42, 'MENU', () => {
      this.scene.start('TitleScene');
    });
    this.ui.button(WORLD.width / 2 + 80, WORLD.height - 40, 150, 46, 'PLAY', () => {
      this.scene.start('GameScene');
    });
  }

  private drawSlotCard(x: number, y: number, label: string, item: GearItem | null): void {
    this.ui.panel(x, y, 180, 108, COLORS.panel, item ? this.rarityColorValue(item.rarity) : COLORS.neonPurple);
    this.ui.label(x, y - 28, label, 12);
    this.add.text(x, y - 2, item?.name ?? 'Empty', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '16px',
      fontStyle: '900',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 144 },
    }).setOrigin(0.5);
    this.ui.label(x, y + 28, item ? `+${item.damageBonus} DMG • +${item.hpBonus} HP` : 'No bonus', 11);
  }

  private drawItemRow(x: number, y: number, item: GearItem): void {
    const color = this.rarityColorValue(item.rarity);
    this.ui.panel(x, y, 370, 62, COLORS.panel, color);
    this.add.text(x - 150, y - 14, item.name, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      fontStyle: '900',
      color: '#ffffff',
    });
    this.add.text(x - 150, y + 6, `${item.slot.toUpperCase()} • ${item.rarity.toUpperCase()} • +${item.damageBonus} DMG • +${item.hpBonus} HP`, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '10px',
      color: '#9fb5c8',
    });
    this.ui.button(x + 125, y, 86, 34, 'EQUIP', () => {
      progression.equipItem(item.id);
      this.scene.restart();
    }, { color, fontSize: 12 });
  }

  private rarityColorValue(rarity: Rarity): number {
    if (rarity === 'legendary') return 0xffd166;
    if (rarity === 'epic') return 0xb07cff;
    if (rarity === 'rare') return 0x6ce5ff;
    return 0x9fb5c8;
  }
}
