import Phaser from 'phaser';
import { COLORS, WORLD } from '../config/balance';
import type { ObstacleVariant } from '../types';

/**
 * An obstacle pair (top + bottom neon pipes) with a gap the player flies through.
 * Variants:
 *   static   — vertical, still
 *   moving   — oscillates vertically
 *   rotating — rotates slowly around its center (visual; collision stays AABB)
 *   narrow   — thinner gap
 *   double   — two stacked gaps
 */
export class Obstacle extends Phaser.GameObjects.Container {
  variant: ObstacleVariant;
  top: Phaser.GameObjects.Rectangle;
  bot: Phaser.GameObjects.Rectangle;
  extra?: Phaser.GameObjects.Rectangle;
  rotatingBar?: Phaser.GameObjects.Rectangle;
  gapY: number;
  gapHeight: number;
  passed: boolean = false;
  bodyWidth: number;
  private moveRange: number = 0;
  private movePhase: number = 0;
  private baseY: number;
  private elapsed: number = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    variant: ObstacleVariant,
    gapY: number,
    gapHeight: number,
  ) {
    super(scene, x, 0);
    this.variant = variant;
    this.gapY = gapY;
    this.baseY = gapY;
    this.gapHeight = gapHeight;
    this.bodyWidth = variant === 'narrow' ? 44 : 60;

    const color = this.colorForVariant(variant);
    const stroke = 0xffffff;

    const topH = gapY - gapHeight / 2;
    const botY = gapY + gapHeight / 2;
    const botH = WORLD.height - botY;

    this.top = scene.add
      .rectangle(0, topH / 2, this.bodyWidth, topH, color, 1)
      .setStrokeStyle(2, stroke, 0.5)
      .setOrigin(0.5);
    this.bot = scene.add
      .rectangle(0, botY + botH / 2, this.bodyWidth, botH, color, 1)
      .setStrokeStyle(2, stroke, 0.5)
      .setOrigin(0.5);

    this.add([this.top, this.bot]);

    if (variant === 'double') {
      // add a second lower gap with a middle block
      const blockY = gapY + gapHeight + 80;
      this.extra = scene.add
        .rectangle(0, blockY, this.bodyWidth, 50, color, 1)
        .setStrokeStyle(2, stroke, 0.5)
        .setOrigin(0.5);
      this.add(this.extra);
    }

    if (variant === 'rotating') {
      this.rotatingBar = scene.add
        .rectangle(0, gapY, 8, gapHeight * 0.85, COLORS.obstacleRotating, 1)
        .setStrokeStyle(1, 0xffffff, 0.7)
        .setOrigin(0.5);
      this.add(this.rotatingBar);
    }

    if (variant === 'moving') {
      this.moveRange = 45;
      this.movePhase = Math.random() * Math.PI * 2;
    }

    scene.add.existing(this);
    this.setDepth(10);
  }

  private colorForVariant(v: ObstacleVariant): number {
    switch (v) {
      case 'moving': return COLORS.obstacleMoving;
      case 'rotating': return COLORS.obstacleRotating;
      case 'narrow': return COLORS.obstacleNarrow;
      case 'double': return COLORS.obstacleB;
      default: return COLORS.obstacleA;
    }
  }

  update(deltaMs: number): void {
    this.elapsed += deltaMs;
    if (this.variant === 'moving') {
      const off = Math.sin(this.elapsed / 400 + this.movePhase) * this.moveRange;
      this.setGapY(this.baseY + off);
    }
    if (this.rotatingBar) {
      this.rotatingBar.rotation += 0.04 * (deltaMs / 16);
    }
  }

  private setGapY(newGapY: number): void {
    const dy = newGapY - this.gapY;
    this.gapY = newGapY;
    this.top.y += dy;
    this.bot.y += dy;
    if (this.extra) this.extra.y += dy;
    if (this.rotatingBar) this.rotatingBar.y = newGapY;
  }

  /** Rectangle used for AABB hit tests with player. */
  getHitZones(): Array<{ x: number; y: number; w: number; h: number }> {
    const zones: Array<{ x: number; y: number; w: number; h: number }> = [];
    zones.push({
      x: this.x,
      y: this.top.y,
      w: this.bodyWidth,
      h: this.top.height,
    });
    zones.push({
      x: this.x,
      y: this.bot.y,
      w: this.bodyWidth,
      h: this.bot.height,
    });
    if (this.extra) {
      zones.push({
        x: this.x,
        y: this.extra.y,
        w: this.bodyWidth,
        h: this.extra.height,
      });
    }
    return zones;
  }
}
