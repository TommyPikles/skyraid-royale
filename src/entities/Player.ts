import Phaser from 'phaser';
import { COLORS, PHYSICS } from '../config/balance';
import type { SkinId } from '../types';

const SKIN_COLORS: Record<SkinId, { body: number; glow: number; wing: number }> = {
  default:     { body: COLORS.player,     glow: COLORS.playerGlow, wing: 0xffffff },
  plasma:      { body: 0xff4fd8,          glow: 0xffffff,          wing: 0x7fffd4 },
  solarflare:  { body: 0xff9d00,          glow: 0xffd24d,          wing: 0xff4060 },
  voidbird:    { body: 0x7d3cff,          glow: 0x00e5ff,          wing: 0xffffff },
};

export class Player extends Phaser.GameObjects.Container {
  bodyOrb: Phaser.GameObjects.Arc;
  wingL: Phaser.GameObjects.Triangle;
  wingR: Phaser.GameObjects.Triangle;
  eye: Phaser.GameObjects.Arc;
  shieldRing?: Phaser.GameObjects.Arc;

  velocity: number = 0;
  dead: boolean = false;
  shields: number = 0;
  private lastFlapMs: number = -9999;
  private lastGroundedMs: number = 0;
  private skin: SkinId;

  constructor(scene: Phaser.Scene, x: number, y: number, skin: SkinId) {
    super(scene, x, y);
    this.skin = skin;
    const palette = SKIN_COLORS[skin] ?? SKIN_COLORS.default;

    this.bodyOrb = scene.add.circle(0, 0, 16, palette.body, 1).setStrokeStyle(2, 0xffffff, 0.9);
    const glow = scene.add.circle(0, 0, 22, palette.glow, 0.25);
    this.wingL = scene.add.triangle(-12, 2, 0, 0, 14, -8, 14, 8, palette.wing, 0.95);
    this.wingR = scene.add.triangle(12, 2, 0, 0, -14, -8, -14, 8, palette.wing, 0.95);
    this.eye = scene.add.circle(5, -3, 3, 0x000000, 1);

    this.add([glow, this.wingL, this.wingR, this.bodyOrb, this.eye]);
    scene.add.existing(this);
    this.setDepth(20);

    // Flap pulse on wings
    scene.tweens.add({
      targets: [this.wingL, this.wingR],
      scaleY: 0.6,
      duration: 160,
      yoyo: true,
      repeat: -1,
    });

    // Subtle floating glow
    scene.tweens.add({
      targets: glow,
      alpha: 0.45,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });
  }

  setShields(n: number): void {
    this.shields = n;
    this.refreshShieldRing();
  }

  consumeShield(): boolean {
    if (this.shields > 0) {
      this.shields -= 1;
      this.refreshShieldRing();
      return true;
    }
    return false;
  }

  private refreshShieldRing(): void {
    if (this.shieldRing) {
      this.shieldRing.destroy();
      this.shieldRing = undefined;
    }
    if (this.shields > 0) {
      const ring = this.scene.add.circle(0, 0, 24 + this.shields * 2, COLORS.shield, 0.18);
      ring.setStrokeStyle(2, COLORS.shield, 0.9);
      this.add(ring);
      this.shieldRing = ring;
      this.scene.tweens.add({
        targets: ring,
        alpha: 0.4,
        duration: 600,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  flap(
    nowMs: number,
    options: { lifeBonus?: number; smoothMode?: boolean } = {},
  ): boolean {
    if (this.dead) return false;
    if (nowMs - this.lastFlapMs < PHYSICS.flapCooldownMs) return false;
    this.lastFlapMs = nowMs;
    const bonus = 1 + (options.lifeBonus ?? 0);
    const multiplier = options.smoothMode ? 0.92 : 1;
    this.velocity = PHYSICS.flapVelocity * bonus * multiplier;
    this.lastGroundedMs = nowMs; // count a flap as a refresh of coyote window
    // little squash-n-stretch
    this.scene.tweens.add({
      targets: this,
      scaleY: 0.85,
      scaleX: 1.12,
      duration: 90,
      yoyo: true,
    });
    return true;
  }

  update(
    deltaMs: number,
    nowMs: number,
    options: { smoothMode?: boolean } = {},
  ): void {
    if (this.dead) return;
    const gMult = options.smoothMode ? 0.82 : 1;
    this.velocity = Math.min(PHYSICS.maxFallSpeed, this.velocity + PHYSICS.gravity * gMult * (deltaMs / 1000));
    this.y += this.velocity * (deltaMs / 1000);

    // Rotation gives readability
    const targetRot = Phaser.Math.Clamp(this.velocity / 600, -0.5, 1.2);
    this.rotation += (targetRot - this.rotation) * 0.15;

    // Track grounded-ish window for coyote timing (if player is rising slowly)
    if (this.velocity < 50) this.lastGroundedMs = nowMs;
  }

  isWithinCoyoteWindow(nowMs: number): boolean {
    return nowMs - this.lastGroundedMs < PHYSICS.coyoteTimeMs;
  }

  kill(): void {
    this.dead = true;
    this.scene.tweens.add({
      targets: this,
      alpha: 0.4,
      duration: 140,
    });
  }

  revive(atY: number): void {
    this.dead = false;
    this.alpha = 1;
    this.velocity = PHYSICS.flapVelocity * 0.7;
    this.y = atY;
  }

  getSkin(): SkinId {
    return this.skin;
  }
}
