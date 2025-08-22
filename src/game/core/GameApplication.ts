import * as PIXI from "pixi.js";
import { GameScene } from "./GameScene.js";
import { SoundManager } from "../audio/SoundManager";

export class GameApplication {
  public app: PIXI.Application;
  public gameScene: GameScene;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.app = new PIXI.Application();
    this.gameScene = new GameScene();
  }

  public async initialize(): Promise<void> {
    try {
      // Initialize PixiJS Application with configuration
      await this.app.init({
        canvas: this.canvas,
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0xffffff,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        antialias: true,
        powerPreference: "high-performance",
      });

      // Set up resize handling
      this.setupResizeHandler();

      // Initialize asset loading pipeline
      await this.loadAssets();

      // Initialize sound manager
      await this.initializeSoundManager();

      // Add game scene to stage
      this.app.stage.addChild(this.gameScene);

      // Initialize game scene
      await this.gameScene.setup();

      // Ensure proper sizing after setup
      this.gameScene.resize(window.innerWidth, window.innerHeight);
    } catch (error) {
      throw error;
    }
  }

  private setupResizeHandler(): void {
    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Resize the application
      this.app.renderer.resize(width, height);

      // Update game scene layout
      this.gameScene.resize(width, height);
    };

    // Initial resize
    resize();

    // Listen for window resize events
    window.addEventListener("resize", resize);
  }

  private async loadAssets(): Promise<void> {
    try {
      // Asset loading pipeline ready for future implementation
    } catch (error) {
      throw error;
    }
  }

  private async initializeSoundManager(): Promise<void> {
    try {
      const soundManager = SoundManager.getInstance();
      await soundManager.initialize();
    } catch (error) {
      console.warn(
        "Failed to initialize SoundManager, continuing without sound:",
        error
      );
      // Don't throw the error - the game should continue without sound if needed
    }
  }

  public resize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.app.renderer.resize(width, height);
    this.gameScene.resize(width, height);
  }

  public destroy(): void {
    window.removeEventListener("resize", this.resize);

    // Cleanup sound manager
    const soundManager = SoundManager.getInstance();
    soundManager.destroy();

    this.app.destroy(true, { children: true, texture: true });
  }
}
