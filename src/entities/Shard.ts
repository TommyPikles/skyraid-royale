import Phaser from 'phaser';
import { COLORS } from '../config/balance';

export class Shard extends Phaser.GameObjects.Container {
  radius = 12;
  collected = false;
  /** true = gem shard (rare), false = ordinary power shard (coins). */
  isGem: boolean;

  constructor(scene: Phaser.Scene, x: number, y: number, isGem: boolean = false) {
    super(scene, x, y);
    this.isGem = isGem;
    const base = isGem ? COLORS.neonPink : COLORS.shard;
    const glow = scene.add.circle(0, 0, 20, base, 0.35);
    const diamond = scene.add.polygon(
      0,
      0,
      [0, -12, 10, 0, 0, 12, -10, 0],
      base,
      1,
    );
    diamond.setStrokeStyle(2, 0xffffff, 0.9);
    const highlight = scene.add.polygon(0, 0, [0, -6, 4, 0, 0, 6, -4, 0], 0xffffff, 0.35);
    this.add([glow, diamond, highlight]);
    scene.add.existing(this);
    this.setDepth(12);
    scene.tweens.add({
      targets: this,
      angle: 360,
      duration: 1800,
      repeat: -1,
    });
    scene.tweens.add({
      targets: glow,
      alpha: 0.6,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });
  }
}
