import * as PIXI from "pixi.js";
import { SoundManager } from "../audio/SoundManager";
import { InfoPanel } from "./InfoPanel";

export class AudioControls extends PIXI.Container {
  private musicButton!: PIXI.Sprite;
  private soundButton!: PIXI.Sprite;
  private infoButton!: PIXI.Sprite;
  private musicBackground!: PIXI.Graphics;
  private soundBackground!: PIXI.Graphics;
  private infoBackground!: PIXI.Graphics;
  private musicMuteLine!: PIXI.Graphics;
  private soundMuteLine!: PIXI.Graphics;
  private isMusicMuted: boolean = false;
  private isSoundMuted: boolean = false;
  private currentInfoPanel?: InfoPanel;

  constructor() {
    super();
    this.createAudioControls();
  }

  private async createAudioControls(): Promise<void> {
    try {
      // Load the music, sound, and info PNG icons
      const musicTexture = await PIXI.Assets.load(
        "assets/images/symbols/music.png"
      );
      const soundTexture = await PIXI.Assets.load(
        "assets/images/symbols/sound.png"
      );
      const infoTexture = await PIXI.Assets.load(
        "assets/images/symbols/info.png"
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

      this.infoBackground = new PIXI.Graphics();
      this.infoBackground.rect(0, 0, 44, 44);
      this.infoBackground.fill(0xffffff);
      this.infoBackground.alpha = 1;

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

      // Create info button
      this.infoButton = new PIXI.Sprite(infoTexture);
      this.infoButton.width = 40;
      this.infoButton.height = 40;
      this.infoButton.x = 2;
      this.infoButton.y = 2;
      this.infoButton.interactive = true;
      this.infoButton.cursor = "pointer";
      this.infoButton.on("pointerdown", () => this.showInfo());

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

      // Position info button background further to the right
      this.infoBackground.x =
        this.soundBackground.x + this.soundBackground.width + 20;

      // Add backgrounds first, then buttons, then mute lines
      this.addChild(this.musicBackground);
      this.addChild(this.musicButton);
      this.addChild(this.musicMuteLine);
      this.addChild(this.soundBackground);
      this.addChild(this.soundButton);
      this.addChild(this.soundMuteLine);
      this.addChild(this.infoBackground);
      this.addChild(this.infoButton);

      // Position sound button relative to its background
      this.soundButton.x = this.soundBackground.x + 2;

      // Position info button relative to its background
      this.infoButton.x = this.infoBackground.x + 2;

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

  private showInfo(): void {
    // Prevent multiple info panels from opening
    if (this.currentInfoPanel) {
      return;
    }

    // Create the HTML-based info panel
    this.currentInfoPanel = new InfoPanel(() => {
      delete this.currentInfoPanel;
    });

    // Show the panel (it will handle adding itself to the DOM)
    this.currentInfoPanel.show();
  }

  public override destroy(): void {
    // Clean up info panel if it exists
    if (this.currentInfoPanel) {
      this.currentInfoPanel.destroy();
      delete this.currentInfoPanel;
    }

    this.musicButton?.destroy();
    this.soundButton?.destroy();
    this.infoButton?.destroy();
    this.musicBackground?.destroy();
    this.soundBackground?.destroy();
    this.infoBackground?.destroy();
    this.musicMuteLine?.destroy();
    this.soundMuteLine?.destroy();
    super.destroy();
  }
}
