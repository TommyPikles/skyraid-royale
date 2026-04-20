import Phaser from 'phaser';
import { COLORS } from '../config/balance';

export class Coin extends Phaser.GameObjects.Container {
  orb: Phaser.GameObjects.Arc;
  radius = 10;
  collected = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    const glow = scene.add.circle(0, 0, 16, COLORS.coin, 0.3);
    this.orb = scene.add.circle(0, 0, 10, COLORS.coin, 1).setStrokeStyle(2, 0xffffff, 0.9);
    const inner = scene.add.circle(0, 0, 4, 0xffffff, 0.8);
    this.add([glow, this.orb, inner]);
    scene.add.existing(this);
    this.setDepth(12);
    scene.tweens.add({
      targets: this,
      scaleX: 0.6,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });
    scene.tweens.add({
      targets: glow,
      alpha: 0.55,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });
  }
}
