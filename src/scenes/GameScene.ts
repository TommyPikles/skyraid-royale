import Phaser from 'phaser';
import { ARENA, COLORS, COMBAT, ECONOMY, LEVELING, WORLD } from '../config/balance';
import { UIManager } from '../systems/UIManager';
import { progression } from '../systems/ProgressionManager';
import { buildNearMissPreview, generateGear } from '../systems/LootSystem';
import { applyUpgrade, createFighterStats, distance, normalize, type FighterStats } from '../systems/CombatSystem';
import type { MatchReward, UpgradeChoiceId } from '../types';

interface Actor {
  kind: 'player' | 'bot';
  body: Phaser.GameObjects.Arc;
  hpBar: Phaser.GameObjects.Rectangle;
  hpBarBg: Phaser.GameObjects.Rectangle;
  stats: FighterStats;
  x: number;
  y: number;
  vx: number;
  vy: number;
  alive: boolean;
  attackCooldownLeftMs: number;
  respawnLeftMs: number;
  reactionLeftMs: number;
}

interface CoreState {
  kind: 'player' | 'bot';
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  body: Phaser.GameObjects.Arc;
  hpBar: Phaser.GameObjects.Rectangle;
}

interface Orb {
  sprite: Phaser.GameObjects.Arc;
  x: number;
  y: number;
}

export class GameScene extends Phaser.Scene {
  private ui!: UIManager;
  private player!: Actor;
  private bot!: Actor;
  private playerCore!: CoreState;
  private botCore!: CoreState;
  private orbs: Orb[] = [];
  private playerXp = 0;
  private playerLevel = 1;
  private matchTimeMs = 0;
  private orbSpawnLeftMs = ARENA.orbSpawnEveryMs;
  private pausedForUpgrade = false;
  private ended = false;
  private joystickPointerId: number | null = null;
  private joystickVector = new Phaser.Math.Vector2(0, 0);
  private joystickBase!: Phaser.GameObjects.Arc;
  private joystickKnob!: Phaser.GameObjects.Arc;
  private xpFill!: Phaser.GameObjects.Rectangle;
  private hudText!: Phaser.GameObjects.Text;
  private coreText!: Phaser.GameObjects.Text;

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.ui = new UIManager(this);
    this.ui.drawBackground();
    this.drawArena();
    this.createJoystick();

    const bonuses = progression.getEquippedBonuses();
    const damageMultiplier = progression.getBattleDamageMultiplier();
    this.player = this.createActor('player', ARENA.playerSpawn.x, ARENA.playerSpawn.y, bonuses.damage, bonuses.hp, damageMultiplier);
    this.bot = this.createActor('bot', ARENA.botSpawn.x, ARENA.botSpawn.y, 0, 8, 1);
    this.playerCore = this.createCore('player', ARENA.playerCore.x, ARENA.playerCore.y, COLORS.corePlayer);
    this.botCore = this.createCore('bot', ARENA.botCore.x, ARENA.botCore.y, COLORS.coreBot);

    this.hudText = this.ui.hudText(20, 24, 'LV 1', 22);
    this.coreText = this.ui.hudText(WORLD.width - 18, 24, 'ENEMY CORE 155', 15).setOrigin(1, 0);
    this.drawTopBars();
    this.spawnOrb();
    this.spawnOrb();

    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.on('pointermove', this.handlePointerMove, this);
    this.input.on('pointerup', this.handlePointerUp, this);
    this.input.on('pointerupoutside', this.handlePointerUp, this);
  }

  update(_time: number, deltaMs: number): void {
    if (this.ended || this.pausedForUpgrade) return;

    this.matchTimeMs += deltaMs;
    this.orbSpawnLeftMs -= deltaMs;
    if (this.orbSpawnLeftMs <= 0) {
      this.orbSpawnLeftMs += ARENA.orbSpawnEveryMs;
      this.spawnOrb();
    }

    this.updateActor(this.player, deltaMs, this.bot, this.botCore, true);
    this.updateActor(this.bot, deltaMs, this.player, this.playerCore, false);
    this.collectNearbyOrbs();
    this.refreshHud();
  }

  private drawArena(): void {
    const bg = this.add.rectangle(ARENA.x + ARENA.width / 2, ARENA.y + ARENA.height / 2, ARENA.width, ARENA.height, 0x0e2133, 1);
    bg.setStrokeStyle(2, 0x214962, 1);
    for (let x = ARENA.x + 20; x < ARENA.x + ARENA.width; x += 40) {
      this.add.rectangle(x, ARENA.y + ARENA.height / 2, 1, ARENA.height, COLORS.arenaGrid, 0.18);
    }
    for (let y = ARENA.y + 20; y < ARENA.y + ARENA.height; y += 40) {
      this.add.rectangle(ARENA.x + ARENA.width / 2, y, ARENA.width, 1, COLORS.arenaGrid, 0.18);
    }
    this.add.rectangle(WORLD.width / 2, ARENA.y + ARENA.height / 2, 2, ARENA.height, 0xffffff, 0.18);
  }

  private drawTopBars(): void {
    this.add.rectangle(WORLD.width / 2, 24, 160, 12, 0x203447, 1).setOrigin(0.5, 0);
    this.xpFill = this.add.rectangle(WORLD.width / 2 - 78, 26, 6, 8, COLORS.orb, 1).setOrigin(0, 0);
  }

  private createActor(kind: 'player' | 'bot', x: number, y: number, bonusDamage: number, bonusHp: number, damageMultiplier: number): Actor {
    const color = kind === 'player' ? COLORS.player : COLORS.bot;
    const body = this.add.circle(x, y, kind === 'player' ? COMBAT.playerRadius : COMBAT.botRadius, color, 1);
    body.setStrokeStyle(3, 0xffffff, 0.55);
    const hpBarBg = this.add.rectangle(x, y - 28, 44, 6, 0x000000, 0.45);
    const hpBar = this.add.rectangle(x - 22, y - 28, 44, 6, color, 1).setOrigin(0, 0.5);
    return {
      kind,
      body,
      hpBar,
      hpBarBg,
      stats: createFighterStats(bonusDamage, bonusHp, damageMultiplier),
      x,
      y,
      vx: 0,
      vy: 0,
      alive: true,
      attackCooldownLeftMs: 0,
      respawnLeftMs: 0,
      reactionLeftMs: kind === 'bot' ? 220 : 0,
    };
  }

  private createCore(kind: 'player' | 'bot', x: number, y: number, color: number): CoreState {
    const body = this.add.circle(x, y, COMBAT.coreRadius, color, 1).setStrokeStyle(4, 0xffffff, 0.35);
    this.add.rectangle(x, y - 40, 56, 8, 0x000000, 0.45);
    const hpBar = this.add.rectangle(x - 28, y - 40, 56, 8, color, 1).setOrigin(0, 0.5);
    return { kind, x, y, hp: COMBAT.coreHp, maxHp: COMBAT.coreHp, body, hpBar };
  }

  private createJoystick(): void {
    const baseX = 84;
    const baseY = WORLD.height - 110;
    this.joystickBase = this.add.circle(baseX, baseY, 44, 0xffffff, 0.08).setStrokeStyle(2, 0xffffff, 0.3);
    this.joystickKnob = this.add.circle(baseX, baseY, 20, 0xffffff, 0.22).setStrokeStyle(2, 0xffffff, 0.5);
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.ended || this.pausedForUpgrade) return;
    if (pointer.x > WORLD.width * 0.58) return;
    this.joystickPointerId = pointer.id;
    this.updateJoystick(pointer);
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.joystickPointerId) return;
    this.updateJoystick(pointer);
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.joystickPointerId) return;
    this.joystickPointerId = null;
    this.joystickVector.set(0, 0);
    this.joystickKnob.setPosition(this.joystickBase.x, this.joystickBase.y);
  }

  private updateJoystick(pointer: Phaser.Input.Pointer): void {
    const dx = pointer.x - this.joystickBase.x;
    const dy = pointer.y - this.joystickBase.y;
    const dir = normalize(dx, dy);
    const len = Math.min(32, Math.hypot(dx, dy));
    this.joystickVector.set(dir.x * (len / 32), dir.y * (len / 32));
    this.joystickKnob.setPosition(this.joystickBase.x + dir.x * len, this.joystickBase.y + dir.y * len);
  }

  private updateActor(actor: Actor, deltaMs: number, enemy: Actor, enemyCore: CoreState, isPlayer: boolean): void {
    if (!actor.alive) {
      actor.respawnLeftMs -= deltaMs;
      if (actor.respawnLeftMs <= 0) this.respawnActor(actor);
      return;
    }

    actor.attackCooldownLeftMs = Math.max(0, actor.attackCooldownLeftMs - deltaMs);
    actor.stats.dashCooldownLeftMs = Math.max(0, actor.stats.dashCooldownLeftMs - deltaMs);
    actor.stats.shieldRefreshLeftMs = Math.max(0, actor.stats.shieldRefreshLeftMs - deltaMs);
    if (actor.stats.special === 'shield' && actor.stats.shieldRefreshLeftMs <= 0) {
      actor.stats.shieldCharges = Math.min(1, actor.stats.shieldCharges + 1);
      actor.stats.shieldRefreshLeftMs = COMBAT.shieldRefreshMs;
      this.popText(actor.x, actor.y - 42, 'SHIELD');
    }

    if (isPlayer) {
      actor.vx = this.joystickVector.x * actor.stats.moveSpeed;
      actor.vy = this.joystickVector.y * actor.stats.moveSpeed;
    } else {
      actor.reactionLeftMs -= deltaMs;
      if (actor.reactionLeftMs <= 0) {
        const targetPoint = enemy.alive && distance(actor.x, actor.y, enemy.x, enemy.y) < 145
          ? { x: enemy.x, y: enemy.y }
          : { x: enemyCore.x, y: enemyCore.y };
        const dir = normalize(targetPoint.x - actor.x, targetPoint.y - actor.y);
        actor.vx = dir.x * actor.stats.moveSpeed * 0.94;
        actor.vy = dir.y * actor.stats.moveSpeed * 0.94;
        actor.reactionLeftMs = 180;
      }
    }

    actor.x = Phaser.Math.Clamp(actor.x + actor.vx * (deltaMs / 1000), ARENA.x + 18, ARENA.x + ARENA.width - 18);
    actor.y = Phaser.Math.Clamp(actor.y + actor.vy * (deltaMs / 1000), ARENA.y + 18, ARENA.y + ARENA.height - 18);
    actor.body.setPosition(actor.x, actor.y);
    actor.hpBarBg.setPosition(actor.x, actor.y - 28);
    actor.hpBar.setPosition(actor.x - 22, actor.y - 28);

    const target = enemy.alive && distance(actor.x, actor.y, enemy.x, enemy.y) <= actor.stats.attackRange
      ? { type: 'actor' as const, actor: enemy }
      : distance(actor.x, actor.y, enemyCore.x, enemyCore.y) <= actor.stats.attackRange + 8
        ? { type: 'core' as const, core: enemyCore }
        : null;

    if (target && actor.attackCooldownLeftMs <= 0) {
      this.performAttack(actor, target);
    }
  }

  private performAttack(actor: Actor, target: { type: 'actor'; actor: Actor } | { type: 'core'; core: CoreState }): void {
    actor.attackCooldownLeftMs = actor.stats.attackCooldownMs;
    let damage = actor.stats.damage;

    if (actor.stats.special === 'dash' && actor.stats.dashCooldownLeftMs <= 0) {
      const dx = (target.type === 'actor' ? target.actor.x : target.core.x) - actor.x;
      const dy = (target.type === 'actor' ? target.actor.y : target.core.y) - actor.y;
      const dir = normalize(dx, dy);
      actor.x = Phaser.Math.Clamp(actor.x + dir.x * 34, ARENA.x + 18, ARENA.x + ARENA.width - 18);
      actor.y = Phaser.Math.Clamp(actor.y + dir.y * 34, ARENA.y + 18, ARENA.y + ARENA.height - 18);
      actor.body.setPosition(actor.x, actor.y);
      actor.stats.dashCooldownLeftMs = COMBAT.dashCooldownMs;
      damage += COMBAT.dashBonusDamage;
      this.popText(actor.x, actor.y - 38, 'DASH');
    }

    const targetX = target.type === 'actor' ? target.actor.x : target.core.x;
    const targetY = target.type === 'actor' ? target.actor.y : target.core.y;
    const beam = this.add.line(0, 0, actor.x, actor.y, targetX, targetY, COLORS.hit, 1).setLineWidth(3, 3);
    this.tweens.add({ targets: beam, alpha: 0, duration: 100, onComplete: () => beam.destroy() });

    if (target.type === 'actor') {
      this.damageActor(target.actor, damage);
    } else {
      this.damageCore(target.core, damage);
    }
  }

  private damageActor(target: Actor, damage: number): void {
    if (!target.alive) return;
    if (target.stats.shieldCharges > 0) {
      target.stats.shieldCharges -= 1;
      target.stats.shieldRefreshLeftMs = COMBAT.shieldRefreshMs;
      this.popText(target.x, target.y - 38, 'BLOCK');
    } else {
      target.stats.hp -= damage;
      this.cameras.main.shake(60, 0.003);
      if (target.stats.hp <= 0) {
        this.killActor(target);
      }
    }
    this.refreshHpBar(target.hpBar, target.stats.hp, target.stats.maxHp, 44);
  }

  private damageCore(core: CoreState, damage: number): void {
    core.hp = Math.max(0, core.hp - damage);
    this.refreshHpBar(core.hpBar, core.hp, core.maxHp, 56);
    this.cameras.main.shake(90, 0.004);
    if (core.hp <= 0) {
      this.finishMatch(core.kind === 'bot' ? 'player' : 'bot');
    }
  }

  private killActor(actor: Actor): void {
    actor.alive = false;
    actor.respawnLeftMs = COMBAT.respawnMs;
    actor.body.setAlpha(0.2);
    actor.hpBar.setVisible(false);
    actor.hpBarBg.setVisible(false);
    this.popText(actor.x, actor.y - 28, 'DOWN');
  }

  private respawnActor(actor: Actor): void {
    actor.alive = true;
    actor.x = actor.kind === 'player' ? ARENA.playerSpawn.x : ARENA.botSpawn.x;
    actor.y = actor.kind === 'player' ? ARENA.playerSpawn.y : ARENA.botSpawn.y;
    actor.stats.hp = actor.stats.maxHp;
    actor.body.setPosition(actor.x, actor.y).setAlpha(1);
    actor.hpBar.setVisible(true).setPosition(actor.x - 22, actor.y - 28);
    actor.hpBarBg.setVisible(true).setPosition(actor.x, actor.y - 28);
    this.refreshHpBar(actor.hpBar, actor.stats.hp, actor.stats.maxHp, 44);
  }

  private spawnOrb(): void {
    if (this.orbs.length >= 6) return;
    const x = Phaser.Math.Between(ARENA.x + 36, ARENA.x + ARENA.width - 36);
    const y = Phaser.Math.Between(ARENA.y + 36, ARENA.y + ARENA.height - 36);
    const sprite = this.add.circle(x, y, 8, COLORS.orb, 1);
    this.tweens.add({ targets: sprite, scale: 1.3, alpha: 0.7, duration: 500, yoyo: true, repeat: -1 });
    this.orbs.push({ sprite, x, y });
  }

  private collectNearbyOrbs(): void {
    this.orbs = this.orbs.filter((orb) => {
      if (distance(this.player.x, this.player.y, orb.x, orb.y) <= COMBAT.playerRadius + 10) {
        this.playerXp += 1;
        this.popText(orb.x, orb.y - 18, '+XP');
        this.tweens.killTweensOf(orb.sprite);
        this.tweens.add({ targets: orb.sprite, scale: 2, alpha: 0, duration: 140, onComplete: () => orb.sprite.destroy() });
        this.checkLevelUp();
        return false;
      }
      return true;
    });
  }

  private checkLevelUp(): void {
    const needed = LEVELING.xpThresholds[this.playerLevel - 1];
    if (!needed || this.playerXp < needed) return;
    this.playerLevel += 1;
    this.pausedForUpgrade = true;
    this.showUpgradeChoices();
  }

  private showUpgradeChoices(): void {
    const specialChoice: UpgradeChoiceId = this.player.stats.special === 'dash' ? 'shield' : 'dash';
    const choices: Array<{ id: UpgradeChoiceId; title: string; sub: string; color: number }> = [
      { id: 'damage', title: '+Damage', sub: `+${LEVELING.damagePerUpgrade} hit power`, color: COLORS.bot },
      { id: 'attackSpeed', title: '+Attack Speed', sub: 'Shoot faster immediately', color: COLORS.neonCyan },
      {
        id: specialChoice,
        title: specialChoice === 'dash' ? 'Dash' : 'Shield',
        sub: specialChoice === 'dash' ? 'Burst into target every few seconds' : 'Auto-block one hit',
        color: COLORS.coin,
      },
    ];

    const overlay = this.add.container(0, 0).setDepth(1500);
    overlay.add(this.add.rectangle(WORLD.width / 2, WORLD.height / 2, WORLD.width, WORLD.height, 0x000000, 0.55));
    overlay.add(this.ui.panel(WORLD.width / 2, WORLD.height / 2, 360, 280, COLORS.panel, COLORS.neonPink));
    overlay.add(this.ui.title(WORLD.width / 2, WORLD.height / 2 - 96, 'LEVEL UP', 28, '#ffffff'));
    overlay.add(this.ui.label(WORLD.width / 2, WORLD.height / 2 - 68, 'Pick one power spike', 12));

    choices.forEach((choice, index) => {
      const y = WORLD.height / 2 - 12 + index * 66;
      const button = this.add.container(WORLD.width / 2, y);
      const bg = this.add.rectangle(0, 0, 300, 50, choice.color, 0.22).setStrokeStyle(2, choice.color, 1);
      const title = this.add.text(-118, -9, choice.title, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        fontStyle: '900',
        color: '#ffffff',
      }).setOrigin(0, 0.5);
      const sub = this.add.text(-118, 11, choice.sub, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '10px',
        color: '#9fb5c8',
      }).setOrigin(0, 0.5);
      button.add([bg, title, sub]);
      overlay.add(button);
      this.ui.registerButton(button, WORLD.width / 2, y, 300, 50, () => {
        applyUpgrade(this.player.stats, choice.id);
        this.player.stats.hp = Math.min(this.player.stats.maxHp, this.player.stats.hp + 12);
        this.emitUpgradeBurst();
        overlay.destroy();
        this.pausedForUpgrade = false;
      });
    });
  }

  private emitUpgradeBurst(): void {
    for (let i = 0; i < 8; i++) {
      const particle = this.add.circle(this.player.x, this.player.y, 4, COLORS.neonCyan, 1);
      const angle = (Math.PI * 2 * i) / 8;
      this.tweens.add({
        targets: particle,
        x: this.player.x + Math.cos(angle) * 36,
        y: this.player.y + Math.sin(angle) * 36,
        alpha: 0,
        duration: 220,
        onComplete: () => particle.destroy(),
      });
    }
  }

  private finishMatch(winner: 'player' | 'bot'): void {
    if (this.ended) return;
    this.ended = true;
    const loot = generateGear();
    const reward: MatchReward = {
      winner,
      durationMs: this.matchTimeMs,
      goldEarned: winner === 'player' ? ECONOMY.winGold : ECONOMY.lossGold,
      loot,
      freeChestReady: progression.state.freeChestProgress === ECONOMY.freeChestEveryMatches - 1,
      starterPackOffer:
        progression.state.matchesPlayed + 1 >= 2 &&
        !progression.state.starterPackOffered &&
        !progression.state.starterPackPurchased,
      chestPreview: buildNearMissPreview(loot.rarity),
    };
    progression.recordMatch(reward);
    this.time.delayedCall(450, () => {
      this.scene.start('ResultsScene', { reward });
    });
  }

  private refreshHud(): void {
    const nextXp = LEVELING.xpThresholds[this.playerLevel - 1] ?? LEVELING.xpThresholds[LEVELING.xpThresholds.length - 1];
    const progress = Math.min(1, this.playerXp / nextXp);
    this.xpFill.width = Math.max(6, 156 * progress);
    this.hudText.setText(`LV ${this.playerLevel}  HP ${Math.max(0, Math.ceil(this.player.stats.hp))}`);
    this.coreText.setText(`ENEMY CORE ${Math.max(0, Math.ceil(this.botCore.hp))}`);
  }

  private refreshHpBar(bar: Phaser.GameObjects.Rectangle, hp: number, maxHp: number, width: number): void {
    bar.width = Math.max(0, (hp / maxHp) * width);
  }

  private popText(x: number, y: number, value: string): void {
    const label = this.add.text(x, y, value, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '11px',
      fontStyle: '900',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    this.tweens.add({ targets: label, y: y - 18, alpha: 0, duration: 500, onComplete: () => label.destroy() });
  }
}
