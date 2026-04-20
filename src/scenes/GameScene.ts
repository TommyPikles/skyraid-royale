import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Coin } from '../entities/Coin';
import { Shard } from '../entities/Shard';
import { ObstacleSpawner } from '../systems/ObstacleSpawner';
import { JuiceManager } from '../systems/JuiceManager';
import { UIManager } from '../systems/UIManager';
import { ghosts } from '../systems/GhostManager';
import { progression } from '../systems/ProgressionManager';
import {
  COLORS,
  ECONOMY,
  GHOST,
  WORLD,
  difficultyTier,
  scrollSpeedAt,
} from '../config/balance';
import type { RunModifierId, RunResult } from '../types';

type SceneInit = { runModifier?: RunModifierId };

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private spawner!: ObstacleSpawner;
  private juice!: JuiceManager;
  private ui!: UIManager;

  private coins: Coin[] = [];
  private shards: Shard[] = [];

  private runStartMs: number = 0;
  private elapsedMs: number = 0;
  private gatesCleared: number = 0;
  private coinsEarned: number = 0;
  private gemsEarned: number = 0;
  private powerCoresEarned: number = 0;
  private distance: number = 0;
  private combo: number = 0;
  private started: boolean = false;
  private ended: boolean = false;
  private runModifier?: RunModifierId;

  private ghostSprite?: Phaser.GameObjects.Container;
  private ghostTrailEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;

  private hudScore!: Phaser.GameObjects.Text;
  private hudGates!: Phaser.GameObjects.Text;
  private hudCoins!: Phaser.GameObjects.Text;
  private hudCombo!: Phaser.GameObjects.Text;
  private hudShields!: Phaser.GameObjects.Text;

  private tutorialOverlay?: Phaser.GameObjects.Container;

  private reviveOffered: boolean = false;

  constructor() {
    super('GameScene');
  }

  init(data: SceneInit): void {
    this.runModifier = data.runModifier;
    this.gatesCleared = 0;
    this.coinsEarned = 0;
    this.gemsEarned = 0;
    this.powerCoresEarned = 0;
    this.distance = 0;
    this.combo = 0;
    this.started = false;
    this.ended = false;
    this.elapsedMs = 0;
    this.reviveOffered = false;
    this.coins = [];
    this.shards = [];
  }

  create(): void {
    this.ui = new UIManager(this);
    this.juice = new JuiceManager(this);
    this.spawner = new ObstacleSpawner(this);

    this.ui.drawBackground();
    this.ui.drawStars(60);

    // Ground + ceiling visual strips
    this.add.rectangle(WORLD.width / 2, WORLD.height - 20, WORLD.width, 40, COLORS.neonPurple, 0.35);
    this.add.rectangle(WORLD.width / 2, 20, WORLD.width, 40, COLORS.neonPurple, 0.35);

    // Player
    this.player = new Player(this, WORLD.width * 0.3, WORLD.height * 0.45, progression.state.selectedSkin);
    this.player.setShields(this.computeStartingShields());
    this.juice.trailEmitter(this.player, COLORS.playerGlow);

    // Ghost setup
    if (ghosts.hasPlayback()) {
      this.ghostSprite = this.createGhostSprite();
    }

    // HUD
    this.hudScore = this.ui.hudText(WORLD.width / 2, 24, '0', 36, '#ffffff').setOrigin(0.5, 0);
    this.hudGates = this.ui.hudText(18, 22, 'GATES 0', 14, '#a79bc6');
    this.hudCoins = this.ui.hudText(18, 44, 'COINS 0', 14, '#ffd24d');
    this.hudCombo = this.ui.hudText(WORLD.width - 18, 22, '', 16, '#ff4fd8').setOrigin(1, 0);
    this.hudShields = this.ui.hudText(WORLD.width - 18, 44, '', 14, '#00e5ff').setOrigin(1, 0);
    this.updateShieldHud();

    // Input
    this.input.on('pointerdown', this.onTap, this);
    this.input.keyboard?.on('keydown-SPACE', this.onTap, this);
    this.input.keyboard?.on('keydown-UP', this.onTap, this);

    // Tutorial overlay on very first run
    if (!progression.state.tutorialCompleted) {
      this.showTutorial();
    } else {
      this.showTapHint();
    }

    // Input blocker until first tap starts the run
    this.runStartMs = this.time.now;
  }

  private computeStartingShields(): number {
    let s = progression.getStartingShields();
    if (this.runModifier === 'extraShield') s += 1;
    return s;
  }

  private onTap = (): void => {
    if (this.ended) return;
    if (!this.started) {
      this.started = true;
      this.runStartMs = this.time.now;
      this.hideTutorial();
      ghosts.startRecording(this.time.now);
    }
    const smooth = this.runModifier === 'smoothFlap';
    this.player.flap(this.time.now, { lifeBonus: progression.getFlapControlBonus(), smoothMode: smooth });
  };

  update(_time: number, deltaMs: number): void {
    if (this.ended) return;

    if (!this.started) {
      // idle hover animation
      this.player.y = WORLD.height * 0.45 + Math.sin(this.time.now / 400) * 6;
      return;
    }

    this.elapsedMs = this.time.now - this.runStartMs;
    const tier = difficultyTier(this.elapsedMs);
    const scrollSpeed = scrollSpeedAt(tier);
    const scrollPx = scrollSpeed * (deltaMs / 1000);
    this.distance += scrollPx;

    const smooth = this.runModifier === 'smoothFlap';
    this.player.update(deltaMs, this.time.now, { smoothMode: smooth });
    ghosts.sample(this.time.now, this.player.y, this.player.velocity);

    // Boundary: hitting floor or ceiling = death
    if (this.player.y >= WORLD.groundY - 10) {
      this.player.y = WORLD.groundY - 10;
      this.handleCrash();
      return;
    }
    if (this.player.y <= WORLD.ceilingY + 10) {
      this.player.y = WORLD.ceilingY + 10;
      this.player.velocity = Math.max(this.player.velocity, 80);
    }

    this.spawner.update(deltaMs, scrollPx, this.elapsedMs);
    this.checkGatesAndCollisions();
    this.maybeSpawnPickup(scrollPx);
    this.updatePickups(scrollPx);
    this.updateGhost();
  }

  private checkGatesAndCollisions(): void {
    const px = this.player.x;
    const py = this.player.y;
    const pr = 14; // effective collision radius

    for (const o of this.spawner.obstacles) {
      // Score as player passes the right edge
      if (!o.passed && o.x + o.bodyWidth / 2 < px) {
        o.passed = true;
        this.onGateCleared(o.x, o.gapY);
      }
      if (Math.abs(o.x - px) > (o.bodyWidth / 2 + pr + 10)) continue;
      for (const z of o.getHitZones()) {
        if (rectCircleCollide(z.x, z.y, z.w, z.h, px, py, pr)) {
          this.handleHit();
          return;
        }
      }
    }
  }

  private onGateCleared(ox: number, gy: number): void {
    this.gatesCleared += 1;
    this.combo += 1;

    // Base coin
    const baseGain = ECONOMY.baseCoinPerGate;
    const gained = progression.addCoins(baseGain);
    this.coinsEarned += gained;

    // Combo bonus
    if (this.combo % ECONOMY.comboBonusEveryN === 0) {
      const bonus = progression.addCoins(ECONOMY.comboBonusCoins);
      this.coinsEarned += bonus;
      this.juice.flash(COLORS.neonCyan, 0.25, 140);
      this.juice.popText(WORLD.width / 2, WORLD.height / 2 - 40, `COMBO x${this.combo}!`, COLORS.neonCyan);
    }

    // Gem milestone
    const milestones = ECONOMY.gemPerMilestoneGates;
    if (milestones.includes(this.gatesCleared)) {
      progression.addGems(1);
      this.gemsEarned += 1;
      this.juice.popText(WORLD.width / 2, 120, `+1 GEM`, COLORS.neonPink);
    }

    // Power Core drop
    if (Math.random() < progression.getPowerCoreDropChance()) {
      progression.addPowerCores(1);
      this.powerCoresEarned += 1;
      this.juice.popText(ox, gy - 40, `+1 CORE`, COLORS.neonPink, 1.0);
    }

    this.refreshHud();
  }

  private handleHit(): void {
    if (this.player.consumeShield()) {
      this.juice.shakeHit();
      this.juice.flash(COLORS.shield, 0.45, 180);
      this.juice.popText(this.player.x, this.player.y - 30, 'BLOCKED!', COLORS.shield);
      this.updateShieldHud();
      return;
    }
    this.handleCrash();
  }

  private handleCrash(): void {
    if (this.ended) return;
    this.combo = 0;
    this.juice.shakeDeath();
    this.juice.flashDeath();
    this.juice.burst(this.player.x, this.player.y, COLORS.neonPink, 18, 60);
    this.player.kill();

    // Revive offer path (free once per session if no token, using gems)
    if (!this.reviveOffered && this.canOfferRevive()) {
      this.reviveOffered = true;
      this.showReviveOffer();
      return;
    }
    this.endRun();
  }

  private canOfferRevive(): boolean {
    // Token counts as free; also allow paying 20 gems.
    return progression.getReviveCharges() > 0 || progression.state.gems >= 20;
  }

  private showReviveOffer(): void {
    this.ended = false; // not yet — waiting on offer
    const w = 320;
    const h = 240;
    const cx = WORLD.width / 2;
    const cy = WORLD.height / 2;

    const overlay = this.add.container(0, 0).setDepth(1100);
    const dim = this.add.rectangle(cx, cy, WORLD.width, WORLD.height, 0x000000, 0.55);
    const panel = this.ui.panel(cx, cy, w, h, 0x14083a, COLORS.neonPink);
    const title = this.ui.title(cx, cy - 80, 'ONE MORE TRY?', 26, '#ffffff');
    const sub = this.ui.label(cx, cy - 42, 'Revive and keep your combo', 14);

    const hasToken = progression.getReviveCharges() > 0;
    const btnLabel = hasToken ? 'USE REVIVE TOKEN' : 'REVIVE  20 GEMS';
    const reviveBtn = this.ui.button(cx, cy + 10, 240, 54, btnLabel, () => {
      if (hasToken) {
        progression.consumeReviveToken();
      } else {
        if (!progression.spendGems(20)) {
          this.endRun();
          overlay.destroy();
          return;
        }
      }
      overlay.destroy();
      this.doRevive();
    }, { color: COLORS.neonPink });
    const skip = this.ui.ghostButton(cx, cy + 78, 160, 38, 'No thanks', () => {
      overlay.destroy();
      this.endRun();
    });

    overlay.add([dim, panel, title, sub, reviveBtn, skip]);

    // 10s auto-decline (loss-aversion countdown)
    const countdown = this.ui.label(cx, cy + 110, '10s', 12);
    overlay.add(countdown);
    let remaining = 10;
    const timer = this.time.addEvent({
      delay: 1000,
      repeat: 9,
      callback: () => {
        remaining -= 1;
        countdown.setText(`${remaining}s`);
        if (remaining <= 0) {
          overlay.destroy();
          timer.remove();
          this.endRun();
        }
      },
    });
  }

  private doRevive(): void {
    this.player.revive(WORLD.height * 0.35);
    this.player.setShields(1);
    this.updateShieldHud();
    this.juice.flash(COLORS.neonCyan, 0.5, 260);
    // clear nearby obstacles so player has breathing room
    for (const o of this.spawner.obstacles) {
      if (o.x < this.player.x + 200) o.x += 200;
    }
  }

  private endRun(): void {
    this.ended = true;
    const result: RunResult = {
      score: this.gatesCleared * 10 + Math.floor(this.distance / 10),
      gates: this.gatesCleared,
      coinsEarned: this.coinsEarned,
      gemsEarned: this.gemsEarned,
      powerCoresEarned: this.powerCoresEarned,
      distance: Math.floor(this.distance),
      ghostComparisonGates:
        ghosts.hasPlayback() ? progression.state.ghostBestGates - this.gatesCleared : null,
      newBest: false,
    };
    const rec = progression.recordRun({
      score: result.score,
      gates: result.gates,
      coinsEarned: result.coinsEarned,
      gemsEarned: result.gemsEarned,
      powerCoresEarned: result.powerCoresEarned,
      ghostPath: ghosts.getRecording(),
    });
    result.newBest = rec.newBest;

    this.time.delayedCall(500, () => {
      this.scene.start('ResultsScene', { result });
    });
  }

  // ---- Pickups -------------------------------------------------------------

  private pickupSpawnCooldownPx: number = 0;

  private maybeSpawnPickup(scrollPx: number): void {
    this.pickupSpawnCooldownPx -= scrollPx;
    if (this.pickupSpawnCooldownPx > 0) return;
    this.pickupSpawnCooldownPx = 90 + Math.random() * 110;

    const rand = Math.random();
    const shardBase = 0.18 * progression.getShardDropRateMultiplier();
    if (rand < shardBase) {
      // shard
      const isGem = Math.random() < ECONOMY.shardGemChance;
      const y = Phaser.Math.Between(WORLD.ceilingY + 30, WORLD.groundY - 30);
      this.shards.push(new Shard(this, WORLD.width + 40, y, isGem));
    } else if (rand < shardBase + 0.55) {
      // coin cluster (3 coins)
      const baseY = Phaser.Math.Between(WORLD.ceilingY + 30, WORLD.groundY - 30);
      for (let i = 0; i < 3; i++) {
        this.coins.push(new Coin(this, WORLD.width + 40 + i * 22, baseY + Math.sin(i) * 6));
      }
    }
  }

  private updatePickups(scrollPx: number): void {
    const px = this.player.x;
    const py = this.player.y;
    const magnet = this.runModifier === 'coinMagnet';
    const magnetRadius = 120;

    for (const c of this.coins) {
      c.x -= scrollPx;
      if (magnet) {
        const dx = px - c.x;
        const dy = py - c.y;
        const d = Math.hypot(dx, dy);
        if (d < magnetRadius && d > 0.01) {
          c.x += (dx / d) * 220 * (1 / 60);
          c.y += (dy / d) * 220 * (1 / 60);
        }
      }
      if (!c.collected && circleCircleHit(c.x, c.y, c.radius, px, py, 14)) {
        c.collected = true;
        const gained = progression.addCoins(ECONOMY.baseCoinPerGate + 1);
        this.coinsEarned += gained;
        this.juice.burst(c.x, c.y, COLORS.coin, 8, 30);
        this.juice.popText(c.x, c.y - 10, `+${gained}`, COLORS.coin, 1.0);
        c.destroy();
      }
    }
    this.coins = this.coins.filter((c) => !c.collected && c.x > -30);

    for (const s of this.shards) {
      s.x -= scrollPx;
      if (!s.collected && circleCircleHit(s.x, s.y, s.radius, px, py, 14)) {
        s.collected = true;
        if (s.isGem) {
          progression.addGems(1);
          this.gemsEarned += 1;
          this.juice.burst(s.x, s.y, COLORS.neonPink, 14, 50);
          this.juice.popText(s.x, s.y - 14, '+1 GEM', COLORS.neonPink, 1.1);
        } else {
          const gained = progression.addCoins(ECONOMY.shardCoinValue);
          this.coinsEarned += gained;
          this.juice.burst(s.x, s.y, COLORS.shard, 12, 45);
          this.juice.popText(s.x, s.y - 14, `+${gained}`, COLORS.shard, 1.0);
        }
        s.destroy();
      }
    }
    this.shards = this.shards.filter((s) => !s.collected && s.x > -30);

    this.refreshHud();
  }

  // ---- Ghost ---------------------------------------------------------------

  private createGhostSprite(): Phaser.GameObjects.Container {
    const c = this.add.container(this.player.x, WORLD.height / 2).setDepth(8).setAlpha(GHOST.opacity);
    const glow = this.add.circle(0, 0, 20, GHOST.color, 0.25);
    const body = this.add.circle(0, 0, 13, GHOST.color, 0.9).setStrokeStyle(2, 0xffffff, 0.7);
    c.add([glow, body]);
    this.ghostTrailEmitter = this.juice.trailEmitter(c, GHOST.color);
    return c;
  }

  private updateGhost(): void {
    if (!this.ghostSprite) return;
    const gy = ghosts.ghostYAt(this.elapsedMs);
    if (gy == null) {
      this.ghostSprite.setVisible(false);
      this.ghostTrailEmitter?.stop();
      return;
    }
    this.ghostSprite.y = gy;
  }

  // ---- HUD -----------------------------------------------------------------

  private refreshHud(): void {
    this.hudScore.setText(String(this.gatesCleared));
    this.hudGates.setText(`GATES ${this.gatesCleared}`);
    this.hudCoins.setText(`COINS ${progression.state.coins}`);
    if (this.combo >= 2) {
      this.hudCombo.setText(`COMBO x${this.combo}`);
    } else {
      this.hudCombo.setText('');
    }
  }

  private updateShieldHud(): void {
    this.hudShields.setText(this.player.shields > 0 ? `SHIELDS ${this.player.shields}` : '');
  }

  // ---- Tutorial ------------------------------------------------------------

  private showTutorial(): void {
    const cx = WORLD.width / 2;
    const cy = WORLD.height / 2;
    const overlay = this.add.container(0, 0).setDepth(800);
    const dim = this.add.rectangle(cx, cy, WORLD.width, WORLD.height, 0x000000, 0.45);
    const title = this.ui.title(cx, cy - 30, 'TAP TO FLAP', 42, '#ffffff');
    const sub = this.ui.label(cx, cy + 20, 'Avoid neon gates. Collect shards.', 16);
    const hint = this.ui.label(cx, cy + 50, 'Tap anywhere to begin', 14);
    this.tweens.add({ targets: hint, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });
    overlay.add([dim, title, sub, hint]);
    this.tutorialOverlay = overlay;
    progression.markTutorialCompleted();
  }

  private showTapHint(): void {
    const hint = this.ui.label(WORLD.width / 2, WORLD.height / 2 + 50, 'Tap to start', 16);
    this.tweens.add({ targets: hint, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });
    this.tutorialOverlay = this.add.container(0, 0, [hint]).setDepth(800);
  }

  private hideTutorial(): void {
    if (this.tutorialOverlay) {
      this.tutorialOverlay.destroy();
      this.tutorialOverlay = undefined;
    }
  }
}

// ---- collision helpers -----------------------------------------------------

function rectCircleCollide(
  rx: number,
  ry: number,
  rw: number,
  rh: number,
  cx: number,
  cy: number,
  cr: number,
): boolean {
  const left = rx - rw / 2;
  const right = rx + rw / 2;
  const top = ry - rh / 2;
  const bot = ry + rh / 2;
  const nx = Math.max(left, Math.min(cx, right));
  const ny = Math.max(top, Math.min(cy, bot));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < cr * cr;
}

function circleCircleHit(
  ax: number,
  ay: number,
  ar: number,
  bx: number,
  by: number,
  br: number,
): boolean {
  const dx = ax - bx;
  const dy = ay - by;
  const r = ar + br;
  return dx * dx + dy * dy < r * r;
}

