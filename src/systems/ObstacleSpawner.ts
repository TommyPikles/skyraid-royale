import Phaser from 'phaser';
import { Obstacle } from '../entities/Obstacle';
import {
  DIFFICULTY,
  OBSTACLE_UNLOCKS,
  WORLD,
  difficultyTier,
  gapHeightAt,
  spacingAt,
} from '../config/balance';
import type { ObstacleVariant } from '../types';

export class ObstacleSpawner {
  private scene: Phaser.Scene;
  obstacles: Obstacle[] = [];
  private distSinceLast: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  reset(): void {
    for (const o of this.obstacles) o.destroy();
    this.obstacles = [];
    this.distSinceLast = 0;
  }

  update(deltaMs: number, scrollPx: number, elapsedMs: number): void {
    // advance all obstacles left
    for (const o of this.obstacles) {
      o.x -= scrollPx;
      o.update(deltaMs);
    }
    // garbage-collect off-screen
    this.obstacles = this.obstacles.filter((o) => {
      if (o.x < -80) {
        o.destroy();
        return false;
      }
      return true;
    });

    // spawn based on spacing vs last obstacle
    this.distSinceLast += scrollPx;
    const tier = difficultyTier(elapsedMs);
    const spacing = spacingAt(tier);
    if (this.distSinceLast >= spacing) {
      this.distSinceLast = 0;
      this.spawnOne(elapsedMs, tier);
    }
  }

  private spawnOne(elapsedMs: number, tier: number): void {
    const allowed = OBSTACLE_UNLOCKS[Math.min(tier, OBSTACLE_UNLOCKS.length - 1)];
    const variant: ObstacleVariant = allowed[Math.floor(Math.random() * allowed.length)];
    let gapH = gapHeightAt(tier, elapsedMs);
    if (variant === 'narrow') gapH = Math.max(DIFFICULTY.gapHeightMin - 10, gapH - 20);
    if (variant === 'double') gapH = Math.max(DIFFICULTY.gapHeightMin, gapH - 10);

    const minY = WORLD.ceilingY + gapH / 2 + 20;
    const maxY = WORLD.groundY - gapH / 2 - 20;
    // For double we need room for the second block below
    const maxYDouble = WORLD.groundY - gapH - 160;
    const gy = variant === 'double'
      ? Phaser.Math.Between(minY, Math.max(minY + 10, maxYDouble))
      : Phaser.Math.Between(minY, maxY);

    const ob = new Obstacle(this.scene, WORLD.width + 60, variant, gy, gapH);
    this.obstacles.push(ob);
  }
}
