import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }
  create(): void {
    // no assets yet; all art is procedural
    this.scene.start('TitleScene');
  }
}
