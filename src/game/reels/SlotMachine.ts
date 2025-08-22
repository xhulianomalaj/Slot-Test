import * as PIXI from "pixi.js";
import { Reel } from "./Reel";
import { SymbolFactory } from "../symbols/SymbolFactory";
import { SymbolType } from "../../types";
import type { SpinResult, WinResult } from "../../types";
import { GAME_CONFIG } from "../config/GameConfig";
import {
  disableSymbolLogging,
  enableSymbolLogging,
} from "../symbols/SymbolConfig";
import { GameStateManager } from "../state/GameStateManager";
import { WinEvaluator } from "../logic/WinEvaluatorV5";
import { PaylineRendererV5 } from "../ui/PaylineRendererV5";
import { SlotMachineRenderer } from "./SlotMachineRenderer";
import { SlotMachineAnimations } from "./SlotMachineAnimations";
import { SoundManager } from "../audio/SoundManager";

export class SlotMachine extends PIXI.Container {
  private _reels: Reel[] = [];
  private _symbolFactory: SymbolFactory;
  private _isSpinning: boolean = false;
  private _reelCount: number;
  private _rowCount: number;
  private _paylineRenderer: PaylineRendererV5;
  private _stateManager: GameStateManager | null = null;
  private _renderer: SlotMachineRenderer;
  private _animations: SlotMachineAnimations;
  private _instantPlayMode: boolean = false;
  private _spinningSound: any = null;

  constructor(symbolFactory: SymbolFactory, stateManager?: GameStateManager) {
    super();

    this._symbolFactory = symbolFactory;
    this._stateManager = stateManager || null;
    this._reelCount = GAME_CONFIG.reels.count;
    this._rowCount = GAME_CONFIG.reels.rows;
    this._paylineRenderer = new PaylineRendererV5(stateManager);
    this._renderer = new SlotMachineRenderer(this._reelCount, this._rowCount);

    this.createSlotMachineFrame();
    this.initializeReels();
    this.setupLayout();

    // Initialize animations handler
    this._animations = new SlotMachineAnimations(
      this._reels,
      this._paylineRenderer
    );

    // Add payline renderer on top of everything else
    this.addChild(this._paylineRenderer);
  }

  get reels(): Reel[] {
    return this._reels;
  }

  get isSpinning(): boolean {
    return this._isSpinning;
  }

  get instantPlayMode(): boolean {
    return this._instantPlayMode;
  }

  set instantPlayMode(enabled: boolean) {
    this._instantPlayMode = enabled;

    // Set payline animation speed based on instant play mode
    if (enabled) {
      this._paylineRenderer.setAnimationSpeed(3.0); // 3x faster for instant play
    } else {
      this._paylineRenderer.setAnimationSpeed(1.0); // Normal speed
    }
  }

  get paylineRenderer(): PaylineRendererV5 {
    return this._paylineRenderer;
  }

  /**
   * Set the state manager for this slot machine
   */
  setStateManager(stateManager: GameStateManager): void {
    this._stateManager = stateManager;
  }

  /**
   * Get the current state manager
   */
  getStateManager(): GameStateManager | null {
    return this._stateManager;
  }

  /**
   * Set animation event callbacks (for UI integration)
   */
  setAnimationCallbacks(callbacks: {
    onStart?: () => void;
    onEnd?: () => void;
    onSkipped?: () => void;
  }): void {
    this._animations.setAnimationCallbacks(callbacks);
  }

  /**
   * Set payline animation speed (useful for instant play mode)
   */
  setPaylineAnimationSpeed(speed: number): void {
    this._paylineRenderer.setAnimationSpeed(speed);
  }

  /**
   * Create the visual frame and walls of the slot machine
   */
  private createSlotMachineFrame(): void {
    const frame = this._renderer.createSlotMachineFrame();
    const separators = this._renderer.createReelSeparators();

    // Add the frame to the container (behind reels)
    this.addChildAt(frame, 0);
    // Add separators to container (above frame, below reels)
    this.addChildAt(separators, 1);
  }

  /**
   * Initialize all reels
   */
  private initializeReels(): void {
    for (let i = 0; i < this._reelCount; i++) {
      const reel = new Reel(i, this._symbolFactory);
      this._reels.push(reel);
      this.addChild(reel);
    }
  }

  /**
   * Setup the layout positioning for all reels
   */
  private setupLayout(): void {
    const positions = this._renderer.calculateReelPositions();

    this._reels.forEach((reel, index) => {
      reel.x = positions[index].x;
      reel.y = positions[index].y;
    });

    // Create mask to clip symbols to the visible area
    this.createReelMask();
  }

  /**
   * Create a mask to clip reel symbols to the visible area
   */
  private createReelMask(): void {
    const mask = this._renderer.createReelMask();

    // Apply mask to all reels
    this._reels.forEach((reel) => {
      reel.mask = mask;
    });

    // Add mask to container (it needs to be in the display tree)
    this.addChild(mask);
  }

  /**
   * Start spinning all reels
   */
  async spin(): Promise<SpinResult> {
    if (this._isSpinning) {
      throw new Error("Reels are already spinning");
    }

    // Use instant play logic if enabled
    if (this._instantPlayMode) {
      return this.instantSpin();
    }

    this._isSpinning = true;

    // Disable symbol logging during spin
    disableSymbolLogging();

    // Start single spinning sound for normal play
    const soundManager = SoundManager.getInstance();
    if (soundManager.isReady()) {
      this._spinningSound = soundManager.startSpinningSound();
    }

    try {
      // Start all reels spinning simultaneously
      const spinPromises = this._reels.map((reel) => reel.spin());
      await Promise.all(spinPromises);

      // Stop reels with staggered timing (they will stop naturally)
      await this.stopReelsNaturally();

      // Get the actual visible symbols from the reels after stopping
      const actualVisibleSymbols = this.getCurrentSymbolGrid();

      // Get current bet from state manager, fall back to default if not available
      const currentBet =
        this._stateManager?.currentBet ?? GAME_CONFIG.betting.defaultBet;

      // Create spin result with win evaluation using actual visible symbols and current bet
      const spinResult = WinEvaluator.createSpinResult(
        actualVisibleSymbols,
        currentBet
      );

      // Re-enable symbol logging after animations complete
      enableSymbolLogging();

      // Log the final visible symbols after animation completes
      // this.logCurrentVisibleSymbols();

      return spinResult;
    } finally {
      this._isSpinning = false;

      // Ensure spinning sound is stopped even if there was an error
      const soundManager = SoundManager.getInstance();
      if (this._spinningSound && soundManager.isReady()) {
        soundManager.stopSpinningSound();
        this._spinningSound = null;
      }
    }
  }

  /**
   * Instant play spin - quick animation with simultaneous stop
   */
  private async instantSpin(): Promise<SpinResult> {
    this._isSpinning = true;

    // Disable symbol logging during spin
    disableSymbolLogging();

    // Start single spinning sound for instant play
    const soundManager = SoundManager.getInstance();
    if (soundManager.isReady()) {
      this._spinningSound = soundManager.startSpinningSound();
    }

    try {
      // Start all reels spinning simultaneously with instant animation
      const spinPromises = this._reels.map((reel) => reel.instantSpin());
      await Promise.all(spinPromises);

      // Wait for a short duration
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Stop all reels simultaneously (no staggered timing)
      const stopPromises = this._reels.map((reel) => reel.stop());
      await Promise.all(stopPromises);

      // Get the actual visible symbols from the reels after stopping
      const actualVisibleSymbols = this.getCurrentSymbolGrid();

      // Get current bet from state manager, fall back to default if not available
      const currentBet =
        this._stateManager?.currentBet ?? GAME_CONFIG.betting.defaultBet;

      // Create spin result with win evaluation using actual visible symbols and current bet
      const spinResult = WinEvaluator.createSpinResult(
        actualVisibleSymbols,
        currentBet
      );

      // Re-enable symbol logging after animations complete
      enableSymbolLogging();

      return spinResult;
    } finally {
      this._isSpinning = false;

      // Ensure spinning sound is stopped even if there was an error
      const soundManager = SoundManager.getInstance();
      if (this._spinningSound && soundManager.isReady()) {
        soundManager.stopSpinningSound();
        this._spinningSound = null;
      }
    }
  }

  /**
   * Stop all reels naturally with staggered timing
   */
  private async stopReelsNaturally(): Promise<void> {
    const stopPromises = this._reels.map((reel, index) => {
      return new Promise<void>((resolve) => {
        // Calculate staggered delay for this reel, with a base delay so first reel also spins
        const baseDelay = GAME_CONFIG.animations.reelStopDelay; // Minimum spin time for first reel
        const delay = baseDelay + GAME_CONFIG.animations.reelStopDelay * index;

        setTimeout(async () => {
          await reel.stop();
          resolve();
        }, delay);
      });
    });

    await Promise.all(stopPromises);
  }

  /**
   * Get current symbol grid (all visible symbols)
   */
  getCurrentSymbolGrid(): SymbolType[][] {
    const result = this._reels.map((reel) => reel.getVisibleSymbolTypes());

    return result;
  }

  /**
   * Get symbol at specific position
   */
  getSymbolAt(reel: number, row: number): SymbolType | null {
    if (
      reel < 0 ||
      reel >= this._reelCount ||
      row < 0 ||
      row >= this._rowCount
    ) {
      return null;
    }

    const reelComponent = this._reels[reel];
    const symbol = reelComponent.getSymbolAtRow(row);
    return symbol ? symbol.type : null;
  }

  /**
   * Force stop all reels immediately
   */
  forceStop(): void {
    this._animations.forceStopAllReels();
    this._isSpinning = false;

    // Stop spinning sound immediately
    const soundManager = SoundManager.getInstance();
    if (soundManager.isReady() && this._spinningSound) {
      soundManager.stopSpinningSound();
      this._spinningSound = null;
    }
  }

  /**
   * Highlight winning symbols
   */
  highlightWinningSymbols(winResults: WinResult[]): void {
    this._animations.highlightWinningSymbols(winResults);
  }

  /**
   * Clear all symbol highlights
   */
  clearHighlights(): void {
    this._animations.clearHighlights();
  }

  /**
   * Get reel at specific index
   */
  getReelAt(index: number): Reel | null {
    if (index < 0 || index >= this._reelCount) {
      return null;
    }
    return this._reels[index];
  }

  /**
   * Check if any reel is still spinning
   */
  hasSpinningReels(): boolean {
    return this._animations.hasSpinningReels();
  }

  /**
   * Get the total width of the slot machine
   */
  getTotalWidth(): number {
    return this._renderer.getTotalWidth();
  }

  /**
   * Get the total height of the slot machine
   */
  getTotalHeight(): number {
    return this._renderer.getTotalHeight();
  }

  /**
   * Start win celebration animation
   */
  async celebrateWin(spinResult: SpinResult): Promise<void> {
    await this._animations.celebrateWin(spinResult);
  }

  /**
   * End win celebration and clear highlights
   */
  endWinCelebration(): void {
    this._animations.endWinCelebration();
  }

  /**
   * Cleanup resources
   */
  override destroy(): void {
    this.forceStop();
    this._reels.forEach((reel) => {
      reel.destroy();
    });
    this._reels = [];

    // Clean up renderer and payline renderer
    this._renderer.destroy();
    this._paylineRenderer.destroy();

    super.destroy();
  }
}
