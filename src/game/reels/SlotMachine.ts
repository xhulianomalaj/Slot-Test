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

    this._animations = new SlotMachineAnimations(
      this._reels,
      this._paylineRenderer
    );

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

    if (enabled) {
      this._paylineRenderer.setAnimationSpeed(3.0);
    } else {
      this._paylineRenderer.setAnimationSpeed(1.0);
    }
  }

  get paylineRenderer(): PaylineRendererV5 {
    return this._paylineRenderer;
  }

  setStateManager(stateManager: GameStateManager): void {
    this._stateManager = stateManager;
  }

  getStateManager(): GameStateManager | null {
    return this._stateManager;
  }

  setAnimationCallbacks(callbacks: {
    onStart?: () => void;
    onEnd?: () => void;
    onSkipped?: () => void;
  }): void {
    this._animations.setAnimationCallbacks(callbacks);
  }

  setPaylineAnimationSpeed(speed: number): void {
    this._paylineRenderer.setAnimationSpeed(speed);
  }

  private createSlotMachineFrame(): void {
    const frame = this._renderer.createSlotMachineFrame();
    const separators = this._renderer.createReelSeparators();

    this.addChildAt(frame, 0);
    this.addChildAt(separators, 1);
  }

  private initializeReels(): void {
    for (let i = 0; i < this._reelCount; i++) {
      const reel = new Reel(i, this._symbolFactory);
      this._reels.push(reel);
      this.addChild(reel);
    }
  }

  private setupLayout(): void {
    const positions = this._renderer.calculateReelPositions();

    this._reels.forEach((reel, index) => {
      reel.x = positions[index].x;
      reel.y = positions[index].y;
    });

    this.createReelMask();
  }

  private createReelMask(): void {
    const mask = this._renderer.createReelMask();

    this._reels.forEach((reel) => {
      reel.mask = mask;
    });

    this.addChild(mask);
  }

  async spin(): Promise<SpinResult> {
    if (this._isSpinning) {
      throw new Error("Reels are already spinning");
    }

    if (this._instantPlayMode) {
      return this.instantSpin();
    }

    this._isSpinning = true;

    // Disable symbol logging during spin
    disableSymbolLogging();

    const soundManager = SoundManager.getInstance();
    if (soundManager.isReady()) {
      this._spinningSound = soundManager.startSpinningSound();
    }

    try {
      const spinPromises = this._reels.map((reel) => reel.spin());
      await Promise.all(spinPromises);

      await this.stopReelsNaturally();

      const actualVisibleSymbols = this.getCurrentSymbolGrid();

      const currentBet =
        this._stateManager?.currentBet ?? GAME_CONFIG.betting.defaultBet;

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

      const soundManager = SoundManager.getInstance();
      if (this._spinningSound && soundManager.isReady()) {
        soundManager.stopSpinningSound();
        this._spinningSound = null;
      }
    }
  }

  private async instantSpin(): Promise<SpinResult> {
    this._isSpinning = true;

    // Disable symbol logging during spin
    disableSymbolLogging();

    const soundManager = SoundManager.getInstance();
    if (soundManager.isReady()) {
      this._spinningSound = soundManager.startSpinningSound();
    }

    try {
      const spinPromises = this._reels.map((reel) => reel.instantSpin());
      await Promise.all(spinPromises);

      // Wait for a short duration
      await new Promise((resolve) => setTimeout(resolve, 400));

      const stopPromises = this._reels.map((reel) => reel.stop());
      await Promise.all(stopPromises);

      const actualVisibleSymbols = this.getCurrentSymbolGrid();

      const currentBet =
        this._stateManager?.currentBet ?? GAME_CONFIG.betting.defaultBet;

      const spinResult = WinEvaluator.createSpinResult(
        actualVisibleSymbols,
        currentBet
      );

      // Re-enable symbol logging after animations complete
      enableSymbolLogging();

      return spinResult;
    } finally {
      this._isSpinning = false;

      const soundManager = SoundManager.getInstance();
      if (this._spinningSound && soundManager.isReady()) {
        soundManager.stopSpinningSound();
        this._spinningSound = null;
      }
    }
  }

  private async stopReelsNaturally(): Promise<void> {
    const stopPromises = this._reels.map((reel, index) => {
      return new Promise<void>((resolve) => {
        const baseDelay = GAME_CONFIG.animations.reelStopDelay;
        const delay = baseDelay + GAME_CONFIG.animations.reelStopDelay * index;

        setTimeout(async () => {
          await reel.stop();
          resolve();
        }, delay);
      });
    });

    await Promise.all(stopPromises);
  }

  getCurrentSymbolGrid(): SymbolType[][] {
    const result = this._reels.map((reel) => reel.getVisibleSymbolTypes());

    return result;
  }

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

  forceStop(): void {
    this._animations.forceStopAllReels();
    this._isSpinning = false;

    const soundManager = SoundManager.getInstance();
    if (soundManager.isReady() && this._spinningSound) {
      soundManager.stopSpinningSound();
      this._spinningSound = null;
    }
  }

  highlightWinningSymbols(winResults: WinResult[]): void {
    this._animations.highlightWinningSymbols(winResults);
  }

  clearHighlights(): void {
    this._animations.clearHighlights();
  }

  getReelAt(index: number): Reel | null {
    if (index < 0 || index >= this._reelCount) {
      return null;
    }
    return this._reels[index];
  }

  hasSpinningReels(): boolean {
    return this._animations.hasSpinningReels();
  }

  getTotalWidth(): number {
    return this._renderer.getTotalWidth();
  }

  getTotalHeight(): number {
    return this._renderer.getTotalHeight();
  }

  async celebrateWin(spinResult: SpinResult): Promise<void> {
    await this._animations.celebrateWin(spinResult);
  }

  endWinCelebration(): void {
    this._animations.endWinCelebration();
  }

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
