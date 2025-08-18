import type { SpinResult, WinResult } from "../../types";
import { WinEvaluator } from "../logic/WinEvaluator";
import { PaylineRenderer } from "../ui/PaylineRenderer";
import { Reel } from "./Reel";

/**
 * Handles all animation and celebration aspects of the slot machine
 * Including win celebrations, highlighting, and payline animations
 */
export class SlotMachineAnimations {
  private _reels: Reel[];
  private _paylineRenderer: PaylineRenderer;

  constructor(reels: Reel[], paylineRenderer: PaylineRenderer) {
    this._reels = reels;
    this._paylineRenderer = paylineRenderer;
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

    // Highlight winning symbols
    this.highlightWinningSymbols(spinResult.wins);

    // Show winning paylines with animation and wait for completion
    await this._paylineRenderer.showWinningPaylines(spinResult.wins);

    // Add celebration effects (we'll enhance this later with particles/glow)
    const highestWin = WinEvaluator.getHighestWin(spinResult);
    if (highestWin && highestWin.winAmount > 0) {
      // console.log(
      //   `🎉 WIN! ${highestWin.winAmount} coins on payline ${highestWin.payline}!`
      // );
      // console.log(`🎉 Payline animation sequence completed, celebration finished`);
    }
  }

  /**
   * End win celebration and clear highlights
   */
  endWinCelebration(): void {
    this.clearHighlights();
    this._paylineRenderer.clearAllPaylines();
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