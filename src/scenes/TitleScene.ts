import Phaser from 'phaser';
import { UIManager } from '../systems/UIManager';
import { progression } from '../systems/ProgressionManager';
import { COLORS, LEAGUES, WORLD } from '../config/balance';

export class TitleScene extends Phaser.Scene {
  private ui!: UIManager;

  constructor() {
    super('TitleScene');
  }

  create(): void {
    this.ui = new UIManager(this);
    this.ui.drawBackground();
    this.ui.drawStars(80);

    const w = WORLD.width;
    const h = WORLD.height;

    // Title wordmark
    this.ui.title(w / 2, h * 0.22, 'SKYRAID', 58, '#ff4fd8');
    this.ui.title(w / 2, h * 0.22 + 48, 'ROYALE', 36, '#7fffd4');

    // Subtitle
    this.add
      .text(w / 2, h * 0.22 + 88, 'Flap. Dominate. Ascend.', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        fontStyle: '600',
        color: '#a79bc6',
      })
      .setOrigin(0.5);

    // Bird preview
    this.drawHeroBird(w / 2, h * 0.42);

    // Currency strip
    this.drawCurrencyStrip(w / 2, h * 0.55);

    // League badge
    this.drawLeagueBadge(w / 2, h * 0.62);

    // Daily reward teaser (placeholder)
    this.drawDailyTeaser(w / 2, h * 0.68);

    // Primary CTA
    this.ui.button(w / 2, h * 0.80, 260, 62, 'TAP TO PLAY', () => {
      this.scene.start('GameScene', {});
    });

    // Secondary buttons row
    this.ui.ghostButton(w / 2 - 90, h * 0.88, 80, 42, 'UPGRADE', () => {
      this.scene.start('UpgradeScene');
    });
    this.ui.ghostButton(w / 2, h * 0.88, 80, 42, 'SHOP', () => {
      this.scene.start('ShopScene');
    }, { color: COLORS.neonPink });
    this.ui.ghostButton(w / 2 + 90, h * 0.88, 80, 42, 'LEAGUE', () => {
      this.scene.start('LeaderboardScene');
    }, { color: COLORS.coin });

    // Best score bottom line
    const best = progression.state.bestGates;
    this.ui.label(w / 2, h * 0.95, best > 0 ? `BEST ${best} GATES` : 'FIRST RUN AWAITS', 12);
  }

  private drawHeroBird(x: number, y: number): void {
    const container = this.add.container(x, y);
    const glow = this.add.circle(0, 0, 46, COLORS.playerGlow, 0.3);
    const body = this.add.circle(0, 0, 28, COLORS.player, 1).setStrokeStyle(3, 0xffffff, 0.9);
    const wingL = this.add.triangle(-18, 2, 0, 0, 22, -14, 22, 14, 0xffffff, 0.95);
    const wingR = this.add.triangle(18, 2, 0, 0, -22, -14, -22, 14, 0xffffff, 0.95);
    const eye = this.add.circle(7, -5, 5, 0x000000, 1);
    container.add([glow, wingL, wingR, body, eye]);

    this.tweens.add({ targets: container, y: y - 8, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: [wingL, wingR], scaleY: 0.6, duration: 280, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: glow, scale: 1.15, alpha: 0.5, duration: 900, yoyo: true, repeat: -1 });
  }

  private drawCurrencyStrip(x: number, y: number): void {
    const g = this.add.container(x, y);
    const panel = this.add.rectangle(0, 0, 300, 38, 0x14083a, 0.7).setStrokeStyle(2, COLORS.neonPurple, 0.7);
    g.add(panel);
    this.addCurrencyCell(g, -100, 'COIN', progression.state.coins, '#ffd24d');
    this.addCurrencyCell(g, 0, 'GEM', progression.state.gems, '#ff4fd8');
    this.addCurrencyCell(g, 100, 'CORE', progression.state.powerCores, '#00e5ff');
  }

  private addCurrencyCell(parent: Phaser.GameObjects.Container, x: number, label: string, value: number, color: string): void {
    const v = this.add.text(x, -4, String(value), {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '16px',
      fontStyle: '900',
      color,
    }).setOrigin(0.5);
    const l = this.add.text(x, 11, label, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '9px',
      fontStyle: '700',
      color: '#a79bc6',
    }).setOrigin(0.5);
    parent.add([v, l]);
  }

  private drawLeagueBadge(x: number, y: number): void {
    const lid = progression.state.leagueId;
    const league = LEAGUES[lid];
    const next = league.nextId ? LEAGUES[league.nextId] : null;
    const label = this.add.text(x, y, league.label.toUpperCase() + ' LEAGUE', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '18px',
      fontStyle: '900',
      color: '#' + league.color.toString(16).padStart(6, '0'),
    }).setOrigin(0.5);
    label.setStroke('#000000', 4);

    if (next) {
      const pts = progression.state.leaguePoints;
      const progress = Math.min(1, (pts - league.threshold) / Math.max(1, next.threshold - league.threshold));
      const bar = this.add.rectangle(x, y + 22, 180, 8, 0x251463, 1).setStrokeStyle(1, 0xffffff, 0.3);
      this.add.rectangle(x - 90 + (180 * progress) / 2, y + 22, 180 * progress, 6, league.color, 1).setOrigin(0.5);
      void bar;
      this.ui.label(x, y + 36, `${pts}/${next.threshold} to ${next.label}`, 10);
    }
  }

  private drawDailyTeaser(x: number, y: number): void {
    this.ui.label(x, y, 'Come back tomorrow for +100 coins', 11);
  }
}
