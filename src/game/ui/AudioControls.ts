import * as PIXI from "pixi.js";
import { SoundManager } from "../audio/SoundManager";

export class AudioControls extends PIXI.Container {
  private musicButton!: PIXI.Sprite;
  private soundButton!: PIXI.Sprite;
  private musicBackground!: PIXI.Graphics;
  private soundBackground!: PIXI.Graphics;
  private musicMuteLine!: PIXI.Graphics;
  private soundMuteLine!: PIXI.Graphics;
  private isMusicMuted: boolean = false;
  private isSoundMuted: boolean = false;

  constructor() {
    super();
    this.createAudioControls();
  }

  private async createAudioControls(): Promise<void> {
    try {
      // Load the music and sound PNG icons
      const musicTexture = await PIXI.Assets.load(
        "assets/images/symbols/music.png"
      );
      const soundTexture = await PIXI.Assets.load(
        "assets/images/symbols/sound.png"
      );

      // Create white background squares
      this.musicBackground = new PIXI.Graphics();
      this.musicBackground.rect(0, 0, 44, 44);
      this.musicBackground.fill(0xffffff);
      this.musicBackground.alpha = 1;

      this.soundBackground = new PIXI.Graphics();
      this.soundBackground.rect(0, 0, 44, 44);
      this.soundBackground.fill(0xffffff);
      this.soundBackground.alpha = 1;

      // Create music button
      this.musicButton = new PIXI.Sprite(musicTexture);
      this.musicButton.width = 40;
      this.musicButton.height = 40;
      this.musicButton.x = 2;
      this.musicButton.y = 2;
      this.musicButton.interactive = true;
      this.musicButton.cursor = "pointer";
      this.musicButton.on("pointerdown", () => this.toggleMusic());

      // Create sound button
      this.soundButton = new PIXI.Sprite(soundTexture);
      this.soundButton.width = 40;
      this.soundButton.height = 40;
      this.soundButton.x = 2;
      this.soundButton.y = 2;
      this.soundButton.interactive = true;
      this.soundButton.cursor = "pointer";
      this.soundButton.on("pointerdown", () => this.toggleSound());

      // Create red diagonal lines for mute indicators
      this.musicMuteLine = new PIXI.Graphics();
      this.musicMuteLine.moveTo(4, 4);
      this.musicMuteLine.lineTo(42, 42);
      this.musicMuteLine.stroke({ color: 0xff0000, width: 3 });
      this.musicMuteLine.visible = false;

      this.soundMuteLine = new PIXI.Graphics();
      this.soundMuteLine.moveTo(4, 4);
      this.soundMuteLine.lineTo(42, 42);
      this.soundMuteLine.stroke({ color: 0xff0000, width: 3 });
      this.soundMuteLine.visible = false;

      // Position in top left corner
      this.x = 20;
      this.y = 20;

      // Position sound button background and button further to the right
      this.soundBackground.x = this.musicBackground.width + 20;

      // Add backgrounds first, then buttons, then mute lines
      this.addChild(this.musicBackground);
      this.addChild(this.musicButton);
      this.addChild(this.musicMuteLine);
      this.addChild(this.soundBackground);
      this.addChild(this.soundButton);
      this.addChild(this.soundMuteLine);

      // Position sound button relative to its background
      this.soundButton.x = this.soundBackground.x + 2;

      // Position sound mute line relative to sound background
      this.soundMuteLine.x = this.soundBackground.x;
    } catch (error) {
      console.error(
        "AudioControls: Failed to load audio control icons:",
        error
      );
    }
  }

  private toggleMusic(): void {
    const soundManager = SoundManager.getInstance();
    this.isMusicMuted = !this.isMusicMuted;

    if (this.isMusicMuted) {
      soundManager.stopBackgroundMusic();
      this.musicMuteLine.visible = true;
    } else {
      soundManager.startBackgroundMusic();
      this.musicMuteLine.visible = false;
    }
  }

  private toggleSound(): void {
    const soundManager = SoundManager.getInstance();
    this.isSoundMuted = !this.isSoundMuted;

    soundManager.setSoundEffectsMuted(this.isSoundMuted);
    this.soundMuteLine.visible = this.isSoundMuted;
  }

  public override destroy(): void {
    this.musicButton?.destroy();
    this.soundButton?.destroy();
    this.musicBackground?.destroy();
    this.soundBackground?.destroy();
    this.musicMuteLine?.destroy();
    this.soundMuteLine?.destroy();
    super.destroy();
  }
}
