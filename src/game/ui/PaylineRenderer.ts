import * as PIXI from "pixi.js";
import type { WinResult } from "../../types";
import { PaylineAnimationController } from "./PaylineAnimationController";
import { PaylineDrawing } from "./PaylineDrawing";

export class PaylineRenderer extends PIXI.Container {
  private animationController: PaylineAnimationController;
  private drawing: PaylineDrawing;
  private cyclingTimeout: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.name = "PaylineRenderer";

    // Initialize components
    this.animationController = new PaylineAnimationController();
    this.drawing = new PaylineDrawing(this);

    // Set up container event handling for skip functionality
    this.setupContainerSkipHandler();
  }

  /**
   * Setup container-level click handler for skipping animations
   */
  private setupContainerSkipHandler(): void {
    this.eventMode = 'static';
    this.on('pointerdown', () => {
      if (this.animationController.isCurrentlyAnimating) {
        this.animationController.requestSkip();
      }
    });
  }

  /**
   * Set callbacks for animation start/end events
   */
  setAnimationCallbacks(onStart?: () => void, onEnd?: () => void, onSkipped?: () => void): void {
    this.animationController.setAnimationCallbacks(onStart, onEnd, onSkipped);
  }

  /**
   * Show winning paylines with animation - first all together, then cycle through each one
   * Returns a promise that resolves when the animation sequence is complete
   */
  async showWinningPaylines(wins: WinResult[]): Promise<void> {
    if (this.animationController.isCurrentlyAnimating || wins.length === 0) return;

    // Start animation sequence
    this.animationController.startAnimation();

    let completedNormally = false;

    try {
      // Clear existing paylines first (force cleanup without protection)
      this.drawing.forceCleanup();

      // Phase 1: Show all winning paylines at once (static)
      for (const win of wins) {
        if (this.animationController.isSkipRequested) break;
        await this.drawing.drawWinningPayline(win, false); // No animation initially
      }

      if (!this.animationController.isSkipRequested) {
        // Phase 2: After showing all, cycle through each one individually
        if (wins.length > 1) {
          // Wait for initial display period
          await this.animationController.skipableDelay(500);

          if (!this.animationController.isSkipRequested) {
            // Start cycling and wait for it to complete
            await this.startPaylineCycling(wins);
          }
        } else {
          // Single payline - clear static version and draw with animation
          this.drawing.forceCleanup();
          await this.animationController.skipableDelay(100);

          if (!this.animationController.isSkipRequested) {
            // Draw with animation
            await this.drawing.drawWinningPayline(wins[0], true);
            await this.animationController.skipableDelay(400);
          }
        }
      }

      // If we reach here without being skipped, we completed normally
      completedNormally = true;

    } finally {
      // End animation sequence with completion status
      this.animationController.endAnimation(completedNormally);
    }
  }

  /**
   * Cycle through paylines one by one with animated drawing
   * Returns a promise that resolves after showing each payline a specified number of times
   */
  private async startPaylineCycling(wins: WinResult[]): Promise<void> {
    if (this.animationController.isSkipRequested) return;

    // Clear all static lines first
    this.drawing.forceCleanup();

    // Draw each payline individually with animation
    for (let i = 0; i < wins.length; i++) {
      if (this.animationController.isSkipRequested) break;

      const win = wins[i];

      // Draw this payline with animation
      await this.drawing.drawWinningPayline(win, true);

      if (this.animationController.isSkipRequested) break;

      // Wait a bit to show the completed line
      await this.animationController.skipableDelay(400);

      if (this.animationController.isSkipRequested) break;

      // If not the last payline, clear it before drawing the next
      if (i < wins.length - 1) {
        this.drawing.clearPayline(win.payline);
        await this.animationController.skipableDelay(50);
      }
    }

  }

  /**
   * Clear a specific payline
   */
  clearPayline(paylineId: number): void {
    this.drawing.clearPayline(paylineId);
  }

  /**
   * Clear all paylines
   */
  clearAllPaylines(): void {
    if (this.animationController.isCurrentlyAnimating) {
      // If animating, ignore the call to prevent mid-animation clearing
      return;
    }
    this.drawing.clearAllPaylines();
  }

  /**
   * Force cleanup without animation protection
   */
  forceCleanup(): void {
    this.drawing.forceCleanup();

    // Clear any pending timeouts
    if (this.cyclingTimeout) {
      clearTimeout(this.cyclingTimeout);
      this.cyclingTimeout = null;
    }
  }

  /**
   * Show all available paylines (for UI/tutorial purposes)
   */
  showAllPaylines(alpha: number = 0.3): void {
    this.drawing.showAllPaylines(alpha);
  }

  /**
   * Cleanup resources
   */
  override destroy(): void {
    this.drawing.clearAllPaylines();
    this.animationController.destroy();
    super.destroy();
  }
}
