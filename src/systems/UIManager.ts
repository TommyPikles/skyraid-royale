import Phaser from 'phaser';
import { COLORS } from '../config/balance';

interface ButtonHandle {
  container: Phaser.GameObjects.Container;
  hitX: number;
  hitY: number;
  hitW: number;
  hitH: number;
  onPress: () => void;
  firing: boolean;
}

/**
 * UIManager — neon-styled HUD and button helpers used across scenes.
 * Pure presentation; no save logic.
 *
 * Buttons are registered in a per-scene list and hit-tested against a single
 * scene-level `pointerdown` handler. This is more reliable on iOS Safari than
 * container.setInteractive() which can drift under Phaser.Scale.FIT.
 */
export class UIManager {
  private scene: Phaser.Scene;
  private buttons: ButtonHandle[] = [];
  private inputWired: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.wireInput();
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.buttons = [];
    });
  }

  /**
   * Register any existing container as a tappable button with a custom hit rect.
   * Use when you've built a complex layout and want the reliable scene-level
   * hit-test without re-building with UIManager.button().
   */
  registerButton(
    container: Phaser.GameObjects.Container,
    x: number,
    y: number,
    w: number,
    h: number,
    onPress: () => void,
  ): void {
    this.buttons.push({ container, hitX: x, hitY: y, hitW: w, hitH: h, onPress, firing: false });
  }

  private wireInput(): void {
    if (this.inputWired) return;
    this.inputWired = true;
    this.scene.input.addPointer(2);
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // pointer.x / pointer.y are already in scene/world coords under Phaser.Scale
      const x = pointer.worldX || pointer.x;
      const y = pointer.worldY || pointer.y;
      for (let i = this.buttons.length - 1; i >= 0; i--) {
        const b = this.buttons[i];
        if (!b.container.scene || !b.container.visible) continue;
        const left = b.hitX - b.hitW / 2;
        const right = b.hitX + b.hitW / 2;
        const top = b.hitY - b.hitH / 2;
        const bot = b.hitY + b.hitH / 2;
        if (x >= left && x <= right && y >= top && y <= bot) {
          if (b.firing) return;
          b.firing = true;
          this.scene.tweens.add({ targets: b.container, scale: 0.94, duration: 70, yoyo: true });
          this.scene.time.delayedCall(40, () => {
            b.onPress();
            this.scene.time.delayedCall(300, () => (b.firing = false));
          });
          return;
        }
      }
    });
  }

  /** Paints a vertical neon gradient background into the scene. */
  drawBackground(topColor: number = COLORS.bgTop, bottomColor: number = COLORS.bgBot): Phaser.GameObjects.Graphics {
    const g = this.scene.add.graphics();
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    // Approximate vertical gradient with stacked rects — good enough for neon feel.
    const steps = 32;
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(topColor),
        Phaser.Display.Color.ValueToColor(bottomColor),
        steps,
        i,
      );
      g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1);
      g.fillRect(0, (h / steps) * i, w, h / steps + 1);
    }
    g.setDepth(-100);
    return g;
  }

  /** Scattered neon specks twinkling in the background. */
  drawStars(count: number = 50): void {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    for (let i = 0; i < count; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const s = 0.7 + Math.random() * 1.6;
      const color = Math.random() < 0.5 ? COLORS.neonCyan : COLORS.neonPink;
      const dot = this.scene.add.circle(x, y, s, color, 0.7).setDepth(-50);
      this.scene.tweens.add({
        targets: dot,
        alpha: 0.15,
        duration: 800 + Math.random() * 1600,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  /** A large rounded neon button. Returns the container for chaining. */
  button(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    onPress: () => void,
    options: { color?: number; textColor?: number; fontSize?: number } = {},
  ): Phaser.GameObjects.Container {
    const color = options.color ?? COLORS.neonPink;
    const textColor = options.textColor ?? 0xffffff;
    const fontSize = options.fontSize ?? 24;

    const container = this.scene.add.container(x, y);
    const glow = this.scene.add.rectangle(0, 0, w + 12, h + 12, color, 0.25).setOrigin(0.5);
    const bg = this.scene.add.rectangle(0, 0, w, h, color, 1).setOrigin(0.5).setStrokeStyle(3, 0xffffff, 0.9);
    const txt = this.scene.add
      .text(0, 0, label, {
        fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
        fontSize: fontSize + 'px',
        fontStyle: '900',
        color: '#' + textColor.toString(16).padStart(6, '0'),
      })
      .setOrigin(0.5);

    container.add([glow, bg, txt]);
    container.setSize(w, h);
    this.buttons.push({ container, hitX: x, hitY: y, hitW: w, hitH: h, onPress, firing: false });

    // Subtle pulsing glow
    this.scene.tweens.add({
      targets: glow,
      alpha: 0.45,
      duration: 900,
      yoyo: true,
      repeat: -1,
    });

    return container;
  }

  /** Secondary outline-only button. */
  ghostButton(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    onPress: () => void,
    options: { color?: number } = {},
  ): Phaser.GameObjects.Container {
    const color = options.color ?? COLORS.neonCyan;
    const container = this.scene.add.container(x, y);
    const bg = this.scene.add.rectangle(0, 0, w, h, color, 0.12).setOrigin(0.5).setStrokeStyle(2, color, 0.9);
    const txt = this.scene.add
      .text(0, 0, label, {
        fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
        fontSize: '18px',
        fontStyle: '700',
        color: '#' + color.toString(16).padStart(6, '0'),
      })
      .setOrigin(0.5);
    container.add([bg, txt]);
    container.setSize(w, h);
    this.buttons.push({ container, hitX: x, hitY: y, hitW: w, hitH: h, onPress, firing: false });
    return container;
  }

  /** Drop-in HUD label with outlined text. */
  hudText(x: number, y: number, text: string, size: number = 22, color: string = '#ffffff'): Phaser.GameObjects.Text {
    return this.scene.add
      .text(x, y, text, {
        fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
        fontSize: size + 'px',
        fontStyle: '900',
        color,
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setScrollFactor(0);
  }

  /** Rounded panel helper for popups. */
  panel(
    x: number,
    y: number,
    w: number,
    h: number,
    fillColor: number = 0x14083a,
    strokeColor: number = COLORS.neonPink,
  ): Phaser.GameObjects.Rectangle {
    const r = this.scene.add.rectangle(x, y, w, h, fillColor, 0.96).setOrigin(0.5);
    r.setStrokeStyle(3, strokeColor, 1);
    return r;
  }

  /** Label text with dim neutral style used in panels. */
  label(x: number, y: number, text: string, size: number = 16): Phaser.GameObjects.Text {
    return this.scene.add
      .text(x, y, text, {
        fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
        fontSize: size + 'px',
        fontStyle: '600',
        color: '#a79bc6',
      })
      .setOrigin(0.5);
  }

  /** Title text with neon glow feel. */
  title(x: number, y: number, text: string, size: number = 42, color: string = '#ff4fd8'): Phaser.GameObjects.Text {
    return this.scene.add
      .text(x, y, text, {
        fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
        fontSize: size + 'px',
        fontStyle: '900',
        color,
        stroke: '#000000',
        strokeThickness: 5,
      })
      .setOrigin(0.5);
  }
}
