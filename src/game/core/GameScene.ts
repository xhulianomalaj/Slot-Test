import * as PIXI from "pixi.js";
import { SlotMachine } from "../reels/SlotMachine";
import { SymbolFactory } from "../symbols/SymbolFactory";
import { GameStateManager } from "../state/GameStateManager";
import { GameUI } from "../../components/ui/GameUI";
import { WinEvaluator } from "../logic/WinEvaluatorV5";
import { setGenerationMode } from "../symbols/SymbolConfig";
import { AudioControls } from "../ui/AudioControls";
import { SoundManager } from "../audio/SoundManager";
import type { SpinResult } from "../../types";

export class GameScene extends PIXI.Container {
  private background: PIXI.Sprite | null = null;
  private gameArea: PIXI.Container;
  private uiArea: PIXI.Container;
  private symbolFactory: SymbolFactory;
  private slotMachine: SlotMachine | null = null;
  private stateManager: GameStateManager;
  private gameUI: GameUI | null = null;
  private audioControls: AudioControls | null = null;
  private keyboardHandler: ((event: KeyboardEvent) => void) | null = null;

  private readonly GAME_AREA_WIDTH = 1190;
  private readonly GAME_AREA_HEIGHT = 600;
  private readonly UI_HEIGHT = 120;

  constructor() {
    super();

    this.stateManager = new GameStateManager();

    this.gameArea = new PIXI.Container();
    this.uiArea = new PIXI.Container();
    this.symbolFactory = new SymbolFactory();

    this.addChild(this.gameArea);
    this.addChild(this.uiArea);
  }

  public async setup(): Promise<void> {
    await this.createBackground();
    this.setupGameArea();
    this.setupUIArea();

    await this.initializeSlotMachine();

    this.initializeGameUI();

    this.initializeAudioControls();

    this.setupKeyboardControls();
  }

  private async createBackground(): Promise<void> {
    try {
      const backgroundTexture = await PIXI.Assets.load(
        "assets/images/ui/Town2.png"
      );

      this.background = new PIXI.Sprite(backgroundTexture);

      this.background.width = window.innerWidth;
      this.background.height = window.innerHeight;

      this.addChildAt(this.background, 0);
    } catch (error) {
      console.error("Failed to load background image:", error);

      const fallbackBackground = new PIXI.Graphics();
      fallbackBackground.rect(0, 0, window.innerWidth, window.innerHeight);
      fallbackBackground.fill({ color: 0x2d5016, alpha: 1 });
      this.addChildAt(fallbackBackground, 0);
    }
  }

  private setupGameArea(): void {
    this.gameArea.name = "gameArea";

    const border = new PIXI.Graphics();
    border.rect(0, 0, this.GAME_AREA_WIDTH, this.GAME_AREA_HEIGHT);
    border.stroke({
      color: 0x4a5568,
      width: 2,
      alpha: 0.5,
    });

    this.gameArea.addChild(border);
  }

  private setupUIArea(): void {
    this.uiArea.name = "uiArea";

    const uiBackground = new PIXI.Graphics();
    uiBackground.rect(0, 0, this.GAME_AREA_WIDTH, this.UI_HEIGHT);
    uiBackground.fill({
      color: 0x2d3748,
      alpha: 1.0,
    });

    this.uiArea.addChild(uiBackground);
  }

  private async initializeSlotMachine(): Promise<void> {
    try {
      await this.symbolFactory.initialize();

      this.slotMachine = new SlotMachine(this.symbolFactory, this.stateManager);

      this.slotMachine.x = this.GAME_AREA_WIDTH / 2;
      this.slotMachine.y = this.GAME_AREA_HEIGHT / 2;

      this.gameArea.addChild(this.slotMachine);

      this.setupPaylineAnimationCallbacks();
    } catch (error) {
      console.error("Failed to initialize slot machine:", error);
    }
  }

  private setupPaylineAnimationCallbacks(): void {
    if (!this.slotMachine) return;

    this.slotMachine.paylineRenderer.setAnimationCallbacks(
      () => {
        if (this.gameUI) {
          this.gameUI.setSpinButtonState(false, "LINES");
        }
      },
      () => {
        if (this.gameUI) {
          this.gameUI.setSpinButtonState(true, "SPIN");
        }
      },
      () => {
        if (this.gameUI) {
          this.gameUI.setSpinButtonState(true, "SPIN");
        }
      }
    );
  }

  private initializeGameUI(): void {
    try {
      this.gameUI = new GameUI(this.stateManager);

      if (this.slotMachine) {
        this.gameUI.setSlotMachine(this.slotMachine);
      }

      this.gameUI.x = this.GAME_AREA_WIDTH / 2;
      this.gameUI.y = this.UI_HEIGHT / 2;

      this.uiArea.addChild(this.gameUI);

      this.setupStateToSlotMachineConnection();
    } catch (error) {
      console.error("Failed to initialize game UI:", error);
    }
  }

  private initializeAudioControls(): void {
    try {
      this.audioControls = new AudioControls();

      this.addChild(this.audioControls);
    } catch (error) {
      console.error("Failed to initialize audio controls:", error);
    }
  }

  private setupStateToSlotMachineConnection(): void {
    this.stateManager.subscribe("gameScene", (context) => {
      const currentState = this.stateManager.currentState;

      if (
        currentState === "spinning" &&
        context.isSpinning &&
        this.slotMachine &&
        !this.slotMachine.isSpinning
      ) {
        this.performSlotMachineSpin();
      }

      if (
        currentState === "celebrating" &&
        this.slotMachine &&
        context.reelResults
      ) {
        this.performWinCelebration(context.reelResults);
      }

      if (currentState === "idle" && this.slotMachine) {
        this.slotMachine.endWinCelebration();
      }
    });
  }

  private async performSlotMachineSpin(): Promise<void> {
    if (!this.slotMachine) return;

    try {
      const spinResult = await this.slotMachine.spin();

      this.stateManager.completeSpin(spinResult);
    } catch (error) {
      console.error("Error during slot machine spin:", error);
      const errorResult: SpinResult = {
        reelResults: [],
        wins: [],
        totalWin: 0,
      };
      this.stateManager.completeSpin(errorResult);
    }
  }

  private async performWinCelebration(spinResult: SpinResult): Promise<void> {
    if (!this.slotMachine || !WinEvaluator.hasWins(spinResult)) return;

    try {
      await this.slotMachine.celebrateWin(spinResult);

      this.stateManager.completeWinCelebration();
    } catch (error) {
      console.error("Error during win celebration:", error);
      this.stateManager.completeWinCelebration();
    }
  }

  public resize(screenWidth: number, screenHeight: number): void {
    if (this.background) {
      this.background.width = screenWidth;
      this.background.height = screenHeight;
    } else if (
      this.children.length > 0 &&
      this.children[0] instanceof PIXI.Graphics
    ) {
      const fallbackBg = this.children[0] as PIXI.Graphics;
      fallbackBg.clear();
      fallbackBg.rect(0, 0, screenWidth, screenHeight);
      fallbackBg.fill({ color: 0x2d5016, alpha: 1 });
    }

    const gameAreaX = (screenWidth - this.GAME_AREA_WIDTH) / 2;
    const gameAreaY =
      (screenHeight - this.GAME_AREA_HEIGHT - this.UI_HEIGHT) / 2;

    this.gameArea.x = gameAreaX;
    this.gameArea.y = gameAreaY;

    this.uiArea.x = gameAreaX;
    this.uiArea.y = gameAreaY + this.GAME_AREA_HEIGHT - 7;

    const minScreenDimension = Math.min(screenWidth, screenHeight);
    const scaleFactor = Math.min(1, minScreenDimension / 900);

    if (scaleFactor < 1) {
      this.gameArea.scale.set(scaleFactor);
      this.uiArea.scale.set(scaleFactor);

      const scaledWidth = this.GAME_AREA_WIDTH * scaleFactor;
      const scaledHeight =
        (this.GAME_AREA_HEIGHT + this.UI_HEIGHT) * scaleFactor;

      this.gameArea.x = (screenWidth - scaledWidth) / 2;
      this.gameArea.y = (screenHeight - scaledHeight) / 2;
      this.uiArea.x = (screenWidth - scaledWidth) / 2;
      this.uiArea.y =
        (screenHeight - scaledHeight) / 2 +
        this.GAME_AREA_HEIGHT * scaleFactor * scaleFactor;
    }
  }

  public getGameArea(): PIXI.Container {
    return this.gameArea;
  }

  public getUIArea(): PIXI.Container {
    return this.uiArea;
  }

  public getGameAreaDimensions(): { width: number; height: number } {
    return {
      width: this.GAME_AREA_WIDTH,
      height: this.GAME_AREA_HEIGHT,
    };
  }

  public getSlotMachine(): SlotMachine | null {
    return this.slotMachine;
  }

  public getStateManager(): GameStateManager {
    return this.stateManager;
  }

  public getGameUI(): GameUI | null {
    return this.gameUI;
  }

  private setupKeyboardControls(): void {
    this.keyboardHandler = (event: KeyboardEvent) => {
      switch (event.code) {
        case "Space":
          event.preventDefault();

          if (
            this.slotMachine &&
            this.slotMachine.paylineRenderer.isAnimating()
          ) {
            this.slotMachine.paylineRenderer.skipAnimation();
            return;
          }

          if (
            this.gameUI &&
            this.stateManager.canSpin &&
            this.stateManager.currentState === "idle"
          ) {
            this.gameUI.simulateSpinButtonPress();
            SoundManager.getInstance().playButtonPressSound();
            setTimeout(() => {
              this.stateManager.spin();
            }, 250);
          }
          break;
      }
    };

    window.addEventListener("keydown", this.keyboardHandler);
  }

  override destroy(): void {
    if (this.keyboardHandler) {
      window.removeEventListener("keydown", this.keyboardHandler);
      this.keyboardHandler = null;
    }

    this.stateManager.unsubscribe("gameScene");

    this.stateManager.destroy();

    if (this.slotMachine) {
      this.slotMachine.destroy();
    }

    if (this.gameUI) {
      this.gameUI.destroy();
    }

    if (this.audioControls) {
      this.audioControls.destroy();
    }

    super.destroy();
  }

  public toggleGenerationMode(ordered: boolean = false): void {
    setGenerationMode(ordered);
  }
}
