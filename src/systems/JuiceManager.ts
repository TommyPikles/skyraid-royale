import Phaser from 'phaser';
import { JUICE, COLORS } from '../config/balance';

/**
 * JuiceManager — screen shake, hit flash, pops, particle bursts. Scene-scoped.
 */
export class JuiceManager {
  private scene: Phaser.Scene;
  private flashRect: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const w = scene.scale.width;
    const h = scene.scale.height;
    this.flashRect = scene.add
      .rectangle(w / 2, h / 2, w, h, 0xffffff, 0)
      .setScrollFactor(0)
      .setDepth(1000);
    // Make sure this overlay never captures taps.
    this.flashRect.removeInteractive();
  }

  shakeHit(): void {
    this.scene.cameras.main.shake(JUICE.shakeHitMs, JUICE.shakeHitAmp);
  }

  shakeDeath(): void {
    this.scene.cameras.main.shake(JUICE.shakeDeathMs, JUICE.shakeDeathAmp);
  }

  flash(color: number = 0xffffff, alpha: number = 0.45, durationMs: number = 140): void {
    this.flashRect.setFillStyle(color, alpha);
    this.scene.tweens.add({
      targets: this.flashRect,
      fillAlpha: 0,
      duration: durationMs,
      ease: 'Quad.easeOut',
    });
  }

  flashDeath(): void {
    this.flash(JUICE.flashDeathColor, 0.55, JUICE.flashDeathMs);
  }

  popText(x: number, y: number, text: string, color: number = COLORS.textLight, scaleFrom: number = 1.2): void {
    const t = this.scene.add
      .text(x, y, text, {
        fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
        fontSize: '26px',
        fontStyle: '900',
        color: '#' + color.toString(16).padStart(6, '0'),
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(900)
      .setScale(scaleFrom);

    this.scene.tweens.add({
      targets: t,
      y: y - 55,
      alpha: 0,
      scale: scaleFrom * 1.25,
      duration: 720,
      ease: 'Cubic.easeOut',
      onComplete: () => t.destroy(),
    });
  }

  burst(x: number, y: number, color: number, count: number = 10, spread: number = 50): void {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const speed = 80 + Math.random() * 120;
      const dot = this.scene.add
        .circle(x, y, 3 + Math.random() * 3, color, 1)
        .setDepth(800);
      this.scene.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * spread,
        y: y + Math.sin(angle) * spread,
        alpha: 0,
        scale: 0.2,
        duration: 420 + Math.random() * 180,
        ease: 'Cubic.easeOut',
        onUpdate: (_tween: Phaser.Tweens.Tween, target: Phaser.GameObjects.Arc) => {
          target.x += 0; // no extra physics, purely decorative
        },
        onComplete: () => dot.destroy(),
      });
      // small velocity override so they fly out
      this.scene.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * speed * 0.6,
        y: y + Math.sin(angle) * speed * 0.6,
        duration: 500,
        ease: 'Cubic.easeOut',
      });
    }
  }

  trailEmitter(follow: Phaser.GameObjects.GameObject, color: number): Phaser.GameObjects.Particles.ParticleEmitter {
    const key = this.ensureDotTexture(color);
    const emitter = this.scene.add.particles(0, 0, key, {
      follow: follow as Phaser.GameObjects.Components.Transform & Phaser.GameObjects.GameObject,
      lifespan: 420,
      quantity: 1,
      frequency: 25,
      scale: { start: 0.9, end: 0.1 },
      alpha: { start: 0.85, end: 0 },
      speed: { min: 10, max: 40 },
      angle: { min: 150, max: 210 },
      blendMode: Phaser.BlendModes.ADD,
    });
    emitter.setDepth(5);
    return emitter;
  }

  private ensureDotTexture(color: number): string {
    const key = `dot-${color.toString(16)}`;
    if (this.scene.textures.exists(key)) return key;
    const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(color, 1);
    g.fillCircle(6, 6, 6);
    g.generateTexture(key, 12, 12);
    g.destroy();
    return key;
  }
}
