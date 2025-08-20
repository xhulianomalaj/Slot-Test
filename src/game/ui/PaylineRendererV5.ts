import * as PIXI from "pixi.js";
import type { WinResult } from "../../types";
import { PaylineStateManager } from "../state/PaylineStateManager";
import { PaylineDrawing } from "./PaylineDrawing";

/**
 * PaylineRenderer using XState v5 for state management
 * Handles rendering and animation of paylines based on state machine events
 */
export class PaylineRendererV5 extends PIXI.Container {
  private stateManager: PaylineStateManager;
  private drawing: PaylineDrawing;
  private currentWins: WinResult[] = [];
  private isShowingAll: boolean = false;

  // Animation callbacks
  private onAnimationStart?: (() => void) | undefined;
  private onAnimationEnd?: (() => void) | undefined;
  private onAnimationSkipped?: (() => void) | undefined;

  // Global click handler for skip functionality
  private globalClickHandler?: () => void;

  constructor() {
    super();
    this.name = "PaylineRendererV5";

    // Initialize state manager and drawing
    this.stateManager = new PaylineStateManager();
    this.drawing = new PaylineDrawing(this);

    // Setup state machine callbacks
    this.setupStateCallbacks();

    // Setup container and global event handling for skip functionality
    this.setupContainerSkipHandler();
  }

  /**
   * Setup callbacks for state machine events
   */
  private setupStateCallbacks(): void {
    // Handle win display updates - THIS IS NOW PROMISE-BASED
    this.stateManager.onWinDisplay(
      async (wins: WinResult[], currentIndex?: number) => {
        this.currentWins = wins;
        this.isShowingAll = currentIndex === undefined;

        // Actually draw the paylines based on the state machine's instructions
        if (wins.length === 0) {
          // Clear all paylines when no wins
          this.drawing.clearAllPaylines();
        } else if (currentIndex === undefined) {
          // Show all wins statically (for multiple wins preview)
          this.drawing.clearAllPaylines();
          for (const win of wins) {
            await this.drawing.drawWinningPayline(win, false); // No animation for "show all"
          }
        } else {
          // Show individual win with animation
          this.drawing.clearAllPaylines();
          const win = wins[currentIndex];
          if (win) {
            await this.drawing.drawWinningPayline(win, true); // With animation for individual wins
          }
        }
      }
    );

    // Handle animation lifecycle
    this.stateManager.setAnimationCallbacks({
      onStart: () => {
        this.onAnimationStart?.();
      },
      onEnd: () => {
        this.clearAll();
        this.onAnimationEnd?.();
      },
      onSkipped: () => {
        this.clearAll();
        this.onAnimationSkipped?.();
      },
    });
  }

  /**
   * Setup container-level and global click handlers for skipping animations
   */
  private setupContainerSkipHandler(): void {
    // Container-level click handler
    this.eventMode = "static";
    this.on("pointerdown", () => {
      if (this.stateManager.isAnimating()) {
      }
    });

    // Global click handler for any click on the screen
    if (globalThis.document) {
      this.globalClickHandler = () => {
        if (this.stateManager.isAnimating()) {
          this.stateManager.skipAnimation();
        }
      };
      globalThis.document.addEventListener("click", this.globalClickHandler);
      globalThis.document.addEventListener(
        "pointerdown",
        this.globalClickHandler
      );
    }
  }

  /**
   * Set callbacks for animation start/end events
   */
  setAnimationCallbacks(
    onStart?: () => void,
    onEnd?: () => void,
    onSkipped?: () => void
  ): void {
    this.onAnimationStart = onStart;
    this.onAnimationEnd = onEnd;
    this.onAnimationSkipped = onSkipped;

    // Update the state manager callbacks as well
    this.stateManager.setAnimationCallbacks({
      onStart: () => this.onAnimationStart?.(),
      onEnd: () => this.onAnimationEnd?.(),
      onSkipped: () => this.onAnimationSkipped?.(),
    });
  }

  /**
   * Show winning paylines using the state machine
   * Returns a promise that resolves when the animation sequence is complete
   */
  async showWinningPaylines(wins: WinResult[]): Promise<void> {
    if (wins.length === 0) {
      this.clearAll();
      return;
    }

    return new Promise<void>((resolve) => {
      // Set up one-time completion callback
      const originalOnEnd = this.onAnimationEnd;
      const originalOnSkipped = this.onAnimationSkipped;

      const cleanup = () => {
        this.onAnimationEnd = originalOnEnd;
        this.onAnimationSkipped = originalOnSkipped;
        resolve();
      };

      this.onAnimationEnd = () => {
        originalOnEnd?.();
        cleanup();
      };

      this.onAnimationSkipped = () => {
        originalOnSkipped?.();
        cleanup();
      };

      // Start the state machine evaluation
      // Note: We bypass evaluation since wins are already calculated
      // Instead, we manually set the wins and start animation
      this.stateManager.reset();

      // Simulate evaluation by directly providing wins
      // In a real scenario, you'd call: this.stateManager.evaluatePaylines(reelResults);
      // For now, we'll trigger the wins display directly
      setTimeout(() => {
        this.triggerWinAnimation(wins);
      }, 50);
    });
  }

  /**
   * Trigger win animation directly (bypassing evaluation)
   * This is a helper for when wins are already calculated
   */
  private triggerWinAnimation(wins: WinResult[]): void {
    // Use the state manager method to set wins and start animation
    this.stateManager.setWinsAndAnimate(wins);
  }

  /**
   * Start payline evaluation for given reel results
   */
  evaluateAndShowPaylines(reelResults: any[][]): void {
    this.stateManager.evaluatePaylines(reelResults);
  }

  /**
   * Skip current animation
   */
  skipAnimation(): void {
    // Force cleanup of any running animations to prevent errors
    this.drawing.forceCleanup();
    // Tell the state machine to skip
    this.stateManager.skipAnimation();
  }

  /**
   * Clear all payline drawings
   */
  clearAll(): void {
    this.drawing.clearAllPaylines();
    this.currentWins = [];
    this.isShowingAll = false;
  }

  /**
   * Hide all paylines
   */
  hideAllPaylines(): void {
    this.clearAll();
  }

  /**
   * Set animation speed (0.1 to 5.0)
   */
  setAnimationSpeed(speed: number): void {
    this.stateManager.setAnimationSpeed(speed);
  }

  /**
   * Toggle showing all paylines at once vs cycling
   */
  toggleShowAllMode(): void {
    this.stateManager.toggleShowAll();
  }

  /**
   * Get current animation state information
   */
  getAnimationState(): {
    isAnimating: boolean;
    currentState: string;
    hasWins: boolean;
    winCount: number;
    currentWinIndex: number;
  } {
    const state = this.stateManager.getCurrentState();
    return {
      isAnimating: state.isAnimating,
      currentState: state.state,
      hasWins: state.hasWins,
      winCount: state.winCount,
      currentWinIndex: state.currentWinIndex,
    };
  }

  /**
   * Get current wins being displayed
   */
  getCurrentWins(): WinResult[] {
    return this.currentWins;
  }

  /**
   * Check if currently showing all wins or cycling through individual wins
   */
  isShowingAllWins(): boolean {
    return this.isShowingAll;
  }

  /**
   * Get debug information about the current state
   */
  getDebugInfo(): any {
    return this.stateManager.getDebugInfo();
  }

  /**
   * Reset the payline renderer to initial state
   */
  reset(): void {
    this.clearAll();
    this.stateManager.reset();
  }

  /**
   * Cleanup resources when the renderer is no longer needed
   */
  dispose(): void {
    this.clearAll();
    this.stateManager.dispose();
    this.removeAllListeners();

    // Remove from parent if it has one
    if (this.parent) {
      this.parent.removeChild(this);
    }
  }

  /**
   * Manual control: show specific payline by index
   * This bypasses the state machine for direct control
   */
  showSpecificWin(winIndex: number): void {
    if (winIndex >= 0 && winIndex < this.currentWins.length) {
      const win = this.currentWins[winIndex];
      this.drawing.clearAllPaylines();
      this.drawing.drawWinningPayline(win, true);
    }
  }

  /**
   * Manual control: show all current wins
   * This bypasses the state machine for direct control
   */
  showAllCurrentWins(): void {
    this.drawing.clearAllPaylines();
    this.currentWins.forEach((win) => {
      this.drawing.drawWinningPayline(win, false);
    });
  }

  /**
   * Cleanup resources
   */
  override destroy(): void {
    // Clean up global click handler
    if (this.globalClickHandler && globalThis.document) {
      globalThis.document.removeEventListener("click", this.globalClickHandler);
      globalThis.document.removeEventListener(
        "pointerdown",
        this.globalClickHandler
      );
    }

    this.drawing.clearAllPaylines();
    this.stateManager.dispose();
    super.destroy();
  }
}
