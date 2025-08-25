import * as PIXI from "pixi.js";
import type { WinResult } from "../../types";
import { PaylineStateManager } from "../state/PaylineStateManager";
import { PaylineDrawing } from "./PaylineDrawing";
import type { GameStateManager } from "../state/GameStateManager";

export class PaylineRendererV5 extends PIXI.Container {
  private stateManager: PaylineStateManager;
  private gameStateManager: GameStateManager | undefined;
  private drawing: PaylineDrawing;
  private currentWins: WinResult[] = [];
  private isShowingAll: boolean = false;

  // Animation callbacks
  private onAnimationStart?: (() => void) | undefined;
  private onAnimationEnd?: (() => void) | undefined;
  private onAnimationSkipped?: (() => void) | undefined;

  // Global click handler for skip functionality
  private globalClickHandler?: () => void;

  constructor(gameStateManager?: GameStateManager) {
    super();
    this.name = "PaylineRendererV5";

    this.gameStateManager = gameStateManager;

    this.stateManager = new PaylineStateManager();
    this.drawing = new PaylineDrawing(this);

    // Setup state machine callbacks
    this.setupStateCallbacks();

    // Setup container and global event handling for skip functionality
    this.setupContainerSkipHandler();
  }

  private setupStateCallbacks(): void {
    this.stateManager.onWinDisplay(
      async (wins: WinResult[], currentIndex?: number) => {
        this.currentWins = wins;
        this.isShowingAll = currentIndex === undefined;

        // Actually draw the paylines based on the state machine's instructions
        if (wins.length === 0) {
          this.drawing.clearAllPaylines();
        } else if (currentIndex === undefined) {
          // Show all wins statically (for multiple wins preview)
          this.drawing.clearAllPaylines();
          for (const win of wins) {
            await this.drawing.drawWinningPayline(win, false);
          }
        } else {
          // Show individual win with animation
          this.drawing.clearAllPaylines();
          const win = wins[currentIndex];
          if (win) {
            await this.drawing.drawWinningPayline(win, true);
          }
        }
      }
    );

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

  setAnimationCallbacks(
    onStart?: () => void,
    onEnd?: () => void,
    onSkipped?: () => void
  ): void {
    this.onAnimationStart = onStart;
    this.onAnimationEnd = onEnd;
    this.onAnimationSkipped = onSkipped;

    this.stateManager.setAnimationCallbacks({
      onStart: () => this.onAnimationStart?.(),
      onEnd: () => this.onAnimationEnd?.(),
      onSkipped: () => this.onAnimationSkipped?.(),
    });
  }

  async showWinningPaylines(wins: WinResult[]): Promise<void> {
    if (wins.length === 0) {
      this.clearAll();
      return;
    }

    return new Promise<void>((resolve) => {
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

  private triggerWinAnimation(wins: WinResult[]): void {
    this.stateManager.setWinsAndAnimate(wins);
  }

  evaluateAndShowPaylines(reelResults: any[][]): void {
    const currentBet = this.gameStateManager?.currentBet ?? 20;
    this.stateManager.evaluatePaylines(reelResults, currentBet);
  }

  skipAnimation(): void {
    // Force cleanup of any running animations to prevent errors
    this.drawing.forceCleanup();
    // Tell the state machine to skip
    this.stateManager.skipAnimation();
  }

  clearAll(): void {
    this.drawing.clearAllPaylines();
    this.currentWins = [];
    this.isShowingAll = false;
  }

  hideAllPaylines(): void {
    this.clearAll();
  }

  setAnimationSpeed(speed: number): void {
    this.stateManager.setAnimationSpeed(speed);
    this.drawing.setAnimationSpeed(speed);
  }

  toggleShowAllMode(): void {
    this.stateManager.toggleShowAll();
  }

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

  isAnimating(): boolean {
    return this.stateManager.isAnimating();
  }

  getCurrentWins(): WinResult[] {
    return this.currentWins;
  }

  isShowingAllWins(): boolean {
    return this.isShowingAll;
  }

  getDebugInfo(): any {
    return this.stateManager.getDebugInfo();
  }

  reset(): void {
    this.clearAll();
    this.stateManager.reset();
  }

  dispose(): void {
    this.clearAll();
    this.stateManager.dispose();
    this.removeAllListeners();

    if (this.parent) {
      this.parent.removeChild(this);
    }
  }

  showSpecificWin(winIndex: number): void {
    if (winIndex >= 0 && winIndex < this.currentWins.length) {
      const win = this.currentWins[winIndex];
      this.drawing.clearAllPaylines();
      this.drawing.drawWinningPayline(win, true);
    }
  }

  showAllCurrentWins(): void {
    this.drawing.clearAllPaylines();
    this.currentWins.forEach((win) => {
      this.drawing.drawWinningPayline(win, false);
    });
  }

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
