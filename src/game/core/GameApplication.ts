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

      this.setupResizeHandler();

      await this.loadAssets();

      await this.initializeSoundManager();

      this.app.stage.addChild(this.gameScene);

      await this.gameScene.setup();

      this.gameScene.resize(window.innerWidth, window.innerHeight);
    } catch (error) {
      throw error;
    }
  }

  private setupResizeHandler(): void {
    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      this.app.renderer.resize(width, height);

      this.gameScene.resize(width, height);
    };

    resize();

    window.addEventListener("resize", resize);
  }

  private async loadAssets(): Promise<void> {
    try {
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

    const soundManager = SoundManager.getInstance();
    soundManager.destroy();

    this.app.destroy(true, { children: true, texture: true });
  }
}
