import type { SpinResult, WinResult } from "../../types";
import { WinEvaluator } from "../logic/WinEvaluatorV5";
import { PaylineRendererV5 } from "../ui/PaylineRendererV5";
import { Reel } from "./Reel";
import { SoundManager } from "../audio/SoundManager";

/**
 * Handles all animation and celebration aspects of the slot machine
 * Including win celebrations, highlighting, and payline animations
 */
export class SlotMachineAnimations {
  private _reels: Reel[];
  private _paylineRenderer: PaylineRendererV5;
  private _animationCallbacks: {
    onStart?: () => void;
    onEnd?: () => void;
    onSkipped?: () => void;
  } = {};

  constructor(reels: Reel[], paylineRenderer: PaylineRendererV5) {
    this._reels = reels;
    this._paylineRenderer = paylineRenderer;
    this.setupPaylineCallbacks();
  }

  /**
   * Setup animation callbacks to integrate with game state
   */
  private setupPaylineCallbacks(): void {
    this._paylineRenderer.setAnimationCallbacks(
      () => this._animationCallbacks.onStart?.(),
      () => this._animationCallbacks.onEnd?.(),
      () => this._animationCallbacks.onSkipped?.()
    );
  }

  /**
   * Set animation event callbacks
   */
  setAnimationCallbacks(callbacks: {
    onStart?: () => void;
    onEnd?: () => void;
    onSkipped?: () => void;
  }): void {
    this._animationCallbacks = { ...callbacks };
  }

  /**
   * Highlight winning symbols
   */
  highlightWinningSymbols(winResults: WinResult[]): void {
    // First, remove all existing highlights
    this.clearHighlights();

    // Highlight symbols for each win
    winResults.forEach((winResult) => {
      winResult.positions.forEach((position) => {
        const reel = this._reels[position.reel];
        const symbol = reel.getSymbolAtRow(position.row);
        if (symbol) {
          symbol.highlight();
        }
      });
    });
  }

  /**
   * Clear all symbol highlights
   */
  clearHighlights(): void {
    this._reels.forEach((reel) => {
      reel.getVisibleSymbols().forEach((symbol) => {
        symbol.removeHighlight();
      });
    });
  }

  /**
   * Start win celebration animation
   */
  async celebrateWin(spinResult: SpinResult): Promise<void> {
    if (!WinEvaluator.hasWins(spinResult)) {
      return;
    }

    // Play win sound effect
    const soundManager = SoundManager.getInstance();
    if (soundManager.isReady()) {
      soundManager.playWinSound();
    }

    // Highlight winning symbols
    this.highlightWinningSymbols(spinResult.wins);

    // Show winning paylines with animation and wait for completion
    await this._paylineRenderer.showWinningPaylines(spinResult.wins);
  }

  /**
   * End win celebration and clear highlights
   */
  endWinCelebration(): void {
    this.clearHighlights();
    this._paylineRenderer.clearAll();
  }

  /**
   * Check if any reel is still spinning
   */
  hasSpinningReels(): boolean {
    return this._reels.some((reel) => reel.isSpinning);
  }

  /**
   * Force stop all reels immediately
   */
  forceStopAllReels(): void {
    this._reels.forEach((reel) => {
      reel.forceStop();
    });
  }
}
