import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { GameScene } from './scenes/GameScene';
import { ResultsScene } from './scenes/ResultsScene';
import { UpgradeScene } from './scenes/UpgradeScene';
import { ShopScene } from './scenes/ShopScene';
import { LeaderboardScene } from './scenes/LeaderboardScene';
import { WORLD } from './config/balance';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: WORLD.width,
  height: WORLD.height,
  backgroundColor: '#0a0420',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: WORLD.width,
    height: WORLD.height,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  input: {
    activePointers: 2,
  },
  render: {
    pixelArt: false,
    antialias: true,
  },
  fps: {
    target: 60,
  },
  scene: [BootScene, TitleScene, GameScene, ResultsScene, UpgradeScene, ShopScene, LeaderboardScene],
};

const game = new Phaser.Game(config);

// Guarantee iOS Safari won't intercept single-taps, double-tap-to-zoom, or
// long-press context menus on the game canvas.
game.events.once('ready', () => {
  const canvas = game.canvas;
  if (!canvas) return;
  const s = canvas.style as CSSStyleDeclaration & {
    webkitUserSelect?: string;
    webkitTapHighlightColor?: string;
  };
  s.touchAction = 'none';
  s.userSelect = 'none';
  s.webkitUserSelect = 'none';
  s.webkitTapHighlightColor = 'transparent';
  canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
});
