import * as PIXI from "pixi.js";
import { SlotMachine } from "../reels/SlotMachine";
import { SymbolFactory } from "../symbols/SymbolFactory";
import { GameStateManager } from "../state/GameStateManager";
import { GameUI } from "../../components/ui/GameUI";
import { WinEvaluator } from "../logic/WinEvaluator";
import { setGenerationMode } from "../symbols/SymbolConfig";
import type { SpinResult } from "../../types";

export class GameScene extends PIXI.Container {
  private background: PIXI.Sprite | null = null;
  private gameArea: PIXI.Container;
  private uiArea: PIXI.Container;
  private symbolFactory: SymbolFactory;
  private slotMachine: SlotMachine | null = null;
  private stateManager: GameStateManager;
  private gameUI: GameUI | null = null;
  private keyboardHandler: ((event: KeyboardEvent) => void) | null = null;

  // Layout constants
  private readonly GAME_AREA_WIDTH = 1190;
  private readonly GAME_AREA_HEIGHT = 600;
  private readonly UI_HEIGHT = 120;

  constructor() {
    super();

    // Initialize state manager
    this.stateManager = new GameStateManager();

    // Initialize containers
    this.gameArea = new PIXI.Container();
    this.uiArea = new PIXI.Container();
    this.symbolFactory = new SymbolFactory();

    // Set up container hierarchy (background will be added after loading)
    this.addChild(this.gameArea);
    this.addChild(this.uiArea);
  }

  public async setup(): Promise<void> {
    await this.createBackground();
    this.setupGameArea();
    this.setupUIArea();

    // Initialize symbol factory and create slot machine
    await this.initializeSlotMachine();

    // Initialize game UI
    this.initializeGameUI();

    // Setup keyboard controls
    this.setupKeyboardControls();
  }

  private async createBackground(): Promise<void> {
    try {
      // Load the castle background image
      const backgroundTexture = await PIXI.Assets.load(
        "assets/images/ui/Town2.png"
      );

      // Create background sprite
      this.background = new PIXI.Sprite(backgroundTexture);

      // Set initial size to current window dimensions
      this.background.width = window.innerWidth;
      this.background.height = window.innerHeight;

      // Add background as the first child (behind everything else)
      this.addChildAt(this.background, 0);
    } catch (error) {
      console.error("Failed to load background image:", error);

      // Fallback to solid color background
      const fallbackBackground = new PIXI.Graphics();
      fallbackBackground.rect(0, 0, window.innerWidth, window.innerHeight);
      fallbackBackground.fill({ color: 0x2d5016, alpha: 1 }); // Dark forest green
      this.addChildAt(fallbackBackground, 0);
    }
  }

  private setupGameArea(): void {
    // Game area will contain the slot machine reels
    this.gameArea.name = "gameArea";

    // Create a border for the game area (visual debugging)
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
    // UI area will contain buttons, balance display, etc.
    this.uiArea.name = "uiArea";

    // Create a background for the UI area
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
      // Initialize the symbol factory
      await this.symbolFactory.initialize();

      // Create the slot machine with state manager
      this.slotMachine = new SlotMachine(this.symbolFactory, this.stateManager);

      // Position the slot machine in the center of the game area
      this.slotMachine.x = this.GAME_AREA_WIDTH / 2;
      this.slotMachine.y = this.GAME_AREA_HEIGHT / 2;

      // Add slot machine to the game area
      this.gameArea.addChild(this.slotMachine);
    } catch (error) {
      console.error("Failed to initialize slot machine:", error);
    }
  }

  private initializeGameUI(): void {
    try {
      this.gameUI = new GameUI(this.stateManager);

      // Position the UI in the center of the UI area
      this.gameUI.x = this.GAME_AREA_WIDTH / 2;
      this.gameUI.y = this.UI_HEIGHT / 2;

      // Add UI to the UI area
      this.uiArea.addChild(this.gameUI);

      // Set up state machine to slot machine connection
      this.setupStateToSlotMachineConnection();
    } catch (error) {
      console.error("Failed to initialize game UI:", error);
    }
  }

  private setupStateToSlotMachineConnection(): void {
    // Listen for state changes and trigger slot machine actions
    this.stateManager.subscribe("gameScene", (context) => {
      const currentState = this.stateManager.currentState;

      // When state changes to spinning, trigger the actual slot machine spin
      // Only if we're not already spinning to prevent duplicate calls
      if (
        currentState === "spinning" &&
        context.isSpinning &&
        this.slotMachine &&
        !this.slotMachine.isSpinning
      ) {
        this.performSlotMachineSpin();
      }

      // When state changes to celebrating, start win celebration
      if (
        currentState === "celebrating" &&
        this.slotMachine &&
        context.reelResults
      ) {
        this.performWinCelebration(context.reelResults);
      }

      // When state returns to idle, end celebrations
      if (currentState === "idle" && this.slotMachine) {
        this.slotMachine.endWinCelebration();
      }
    });
  }

  private async performSlotMachineSpin(): Promise<void> {
    if (!this.slotMachine) return;

    try {
      const spinResult = await this.slotMachine.spin();

      // console.log("🎮 Spin completed with result:", spinResult);

      // Notify state machine that spin is complete
      this.stateManager.completeSpin(spinResult);
    } catch (error) {
      console.error("Error during slot machine spin:", error);
      // Create a dummy result to complete the spin and return to idle
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
      // Start the celebration animation
      await this.slotMachine.celebrateWin(spinResult);

      // Celebration is complete, notify state machine to return to idle
      this.stateManager.completeWinCelebration();
    } catch (error) {
      console.error("Error during win celebration:", error);
      // Force end celebration and return to idle
      this.stateManager.completeWinCelebration();
    }
  }

  public resize(screenWidth: number, screenHeight: number): void {
    // Update background to cover full screen
    if (this.background) {
      this.background.width = screenWidth;
      this.background.height = screenHeight;
    } else if (
      this.children.length > 0 &&
      this.children[0] instanceof PIXI.Graphics
    ) {
      // Handle fallback background (Graphics object)
      const fallbackBg = this.children[0] as PIXI.Graphics;
      fallbackBg.clear();
      fallbackBg.rect(0, 0, screenWidth, screenHeight);
      fallbackBg.fill({ color: 0x2d5016, alpha: 1 });
    }

    // Center the game area on screen
    const gameAreaX = (screenWidth - this.GAME_AREA_WIDTH) / 2;
    const gameAreaY =
      (screenHeight - this.GAME_AREA_HEIGHT - this.UI_HEIGHT) / 2;

    this.gameArea.x = gameAreaX;
    this.gameArea.y = gameAreaY;

    // Position UI area below game area (moved up by 20 pixels)
    this.uiArea.x = gameAreaX;
    this.uiArea.y = gameAreaY + this.GAME_AREA_HEIGHT - 7;

    // Scale for smaller screens if needed
    const minScreenDimension = Math.min(screenWidth, screenHeight);
    const scaleFactor = Math.min(1, minScreenDimension / 900); // 900 is our target minimum

    if (scaleFactor < 1) {
      this.gameArea.scale.set(scaleFactor);
      this.uiArea.scale.set(scaleFactor);

      // Recenter after scaling
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

  // Getter methods for other components to access areas
  public getGameArea(): PIXI.Container {
    return this.gameArea;
  }

  public getUIArea(): PIXI.Container {
    return this.uiArea;
  }

  // Layout constants getters
  public getGameAreaDimensions(): { width: number; height: number } {
    return {
      width: this.GAME_AREA_WIDTH,
      height: this.GAME_AREA_HEIGHT,
    };
  }

  // Get the slot machine instance
  public getSlotMachine(): SlotMachine | null {
    return this.slotMachine;
  }

  // Get the state manager instance
  public getStateManager(): GameStateManager {
    return this.stateManager;
  }

  // Get the game UI instance
  public getGameUI(): GameUI | null {
    return this.gameUI;
  }

  /**
   * Setup keyboard controls for the game
   */
  private setupKeyboardControls(): void {
    this.keyboardHandler = (event: KeyboardEvent) => {
      // Only handle spacebar
      if (event.code === 'Space') {
        event.preventDefault(); // Prevent page scrolling
        
        // Check if the spin button is enabled and can be clicked
        if (this.gameUI && this.stateManager.canSpin && this.stateManager.currentState === 'idle') {
          // console.log('🎮 Spacebar pressed - triggering spin');
          this.stateManager.spin();
        } else {
          // console.log('🎮 Spacebar pressed but spin not available');
        }
      }
    };

    // Add the event listener to the window
    window.addEventListener('keydown', this.keyboardHandler);
    // console.log('🎮 Keyboard controls initialized - Spacebar to spin');
  }

  // Cleanup method
  override destroy(): void {
    // Clean up keyboard event listener
    if (this.keyboardHandler) {
      window.removeEventListener('keydown', this.keyboardHandler);
      this.keyboardHandler = null;
      // console.log('🎮 Keyboard controls cleaned up');
    }

    // Unsubscribe from state manager
    this.stateManager.unsubscribe("gameScene");

    // Clean up state manager
    this.stateManager.destroy();

    // Clean up slot machine
    if (this.slotMachine) {
      this.slotMachine.destroy();
    }

    // Clean up UI
    if (this.gameUI) {
      this.gameUI.destroy();
    }

    super.destroy();
  }

  /**
   * Toggle between ordered and random symbol generation for debugging
   * Call in browser console: game.scene.toggleGenerationMode(true) for ordered
   */
  public toggleGenerationMode(ordered: boolean = false): void {
    setGenerationMode(ordered);
    // console.log(`🎲 Symbol generation mode: ${ordered ? "ORDERED" : "RANDOM"}`);
  }
}
