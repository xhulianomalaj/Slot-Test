import * as PIXI from "pixi.js";
import { GameScene } from "./GameScene.js";

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

  public resize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.app.renderer.resize(width, height);
    this.gameScene.resize(width, height);
  }

  public destroy(): void {
    window.removeEventListener("resize", this.resize);
    this.app.destroy(true, { children: true, texture: true });
  }
}
