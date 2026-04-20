import Phaser from 'phaser';
import { UIManager } from '../systems/UIManager';
import { progression } from '../systems/ProgressionManager';
import { COLORS, LEAGUES, WORLD } from '../config/balance';
import type { LeagueId } from '../types';

const FAKE_RIVALS: Array<{ name: string; pts: number }> = [
  { name: 'NightjarX', pts: 5820 },
  { name: 'VoidPilot', pts: 4910 },
  { name: 'Ryo', pts: 3840 },
  { name: 'PLAZMO', pts: 3120 },
  { name: 'nebula.99', pts: 2640 },
  { name: 'WingEater', pts: 2210 },
  { name: 'AeroPhoenix', pts: 1800 },
  { name: 'Glitchfalcon', pts: 1420 },
  { name: 'sprintr', pts: 1080 },
  { name: 'Cobalt', pts: 760 },
  { name: 'mini_chirp', pts: 410 },
  { name: 'feather', pts: 180 },
  { name: 'beginnerBird', pts: 60 },
];

export class LeaderboardScene extends Phaser.Scene {
  private ui!: UIManager;

  constructor() {
    super('LeaderboardScene');
  }

  create(): void {
    this.ui = new UIManager(this);
    this.ui.drawBackground();
    this.ui.drawStars(40);

    const w = WORLD.width;

    this.ui.title(w / 2, 46, 'LEAGUES', 30, '#ffd24d');
    this.ui.label(w / 2, 74, 'Climb the ranks. Stay on top.', 12);

    // League pills
    this.drawLeaguePills(w / 2, 110);

    // Current-league leaderboard
    this.drawLeaderboard(w / 2, 160);

    // Footer
    this.ui.ghostButton(w / 2 - 80, WORLD.height - 40, 120, 42, 'MENU', () => {
      this.scene.start('TitleScene');
    });
    this.ui.button(w / 2 + 80, WORLD.height - 40, 150, 46, 'PLAY', () => {
      this.scene.start('GameScene', {});
    });
  }

  private drawLeaguePills(cx: number, y: number): void {
    const ids: LeagueId[] = ['bronze', 'silver', 'gold', 'plasma', 'apex'];
    const currentId = progression.state.leagueId;
    const pillW = 60;
    const gap = 6;
    const totalW = pillW * ids.length + gap * (ids.length - 1);
    const startX = cx - totalW / 2 + pillW / 2;
    ids.forEach((id, i) => {
      const info = LEAGUES[id];
      const x = startX + i * (pillW + gap);
      const active = id === currentId;
      const bg = this.add.rectangle(x, y, pillW, 30, info.color, active ? 0.8 : 0.2)
        .setStrokeStyle(2, info.color, active ? 1 : 0.5);
      void bg;
      this.add.text(x, y, info.label, {
        fontFamily: 'system-ui, sans-serif', fontSize: '11px', fontStyle: '900',
        color: active ? '#0a0420' : '#' + info.color.toString(16).padStart(6, '0'),
      }).setOrigin(0.5);
    });
  }

  private drawLeaderboard(cx: number, topY: number): void {
    const currentId = progression.state.leagueId;
    const league = LEAGUES[currentId];
    const next = league.nextId ? LEAGUES[league.nextId] : null;
    const nextThreshold = next?.threshold ?? league.threshold + 2000;

    // Filter rivals within the current league bracket
    const bucketMin = league.threshold;
    const bucketMax = nextThreshold;
    const rivals = FAKE_RIVALS.filter(r => r.pts >= bucketMin && r.pts < bucketMax);
    const me = { name: 'YOU', pts: progression.state.leaguePoints };
    const combined = [...rivals, me].sort((a, b) => b.pts - a.pts);

    let y = topY + 20;
    // Header
    this.add.text(cx, y, `${league.label.toUpperCase()} LEAGUE`, {
      fontFamily: 'system-ui, sans-serif', fontSize: '16px', fontStyle: '900',
      color: '#' + league.color.toString(16).padStart(6, '0'),
    }).setOrigin(0.5);
    y += 26;

    // Rows
    combined.slice(0, 10).forEach((r, idx) => {
      const rank = idx + 1;
      const isMe = r === me;
      const bg = this.add.rectangle(cx, y, 360, 30,
        isMe ? COLORS.neonCyan : 0x14083a,
        isMe ? 0.3 : 0.8).setStrokeStyle(2, isMe ? COLORS.neonCyan : 0x29174d, 1);
      void bg;
      this.add.text(cx - 165, y, '#' + rank, {
        fontFamily: 'system-ui, sans-serif', fontSize: '14px', fontStyle: '900',
        color: rank === 1 ? '#ffd24d' : '#a79bc6',
      }).setOrigin(0, 0.5);
      this.add.text(cx - 125, y, r.name, {
        fontFamily: 'system-ui, sans-serif', fontSize: '14px', fontStyle: isMe ? '900' : '600',
        color: isMe ? '#7fffd4' : '#ffffff',
      }).setOrigin(0, 0.5);
      this.add.text(cx + 160, y, String(r.pts), {
        fontFamily: 'system-ui, sans-serif', fontSize: '14px', fontStyle: '900',
        color: '#ffd24d',
      }).setOrigin(1, 0.5);
      y += 34;
    });

    // Promotion line
    if (next) {
      this.ui.label(cx, y + 10, `Next: ${next.label} at ${next.threshold} pts`, 11);
    } else {
      this.ui.label(cx, y + 10, 'You are at the APEX.', 11);
    }
  }
}
