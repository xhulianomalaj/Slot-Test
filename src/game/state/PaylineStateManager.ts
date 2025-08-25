import { createActor } from "xstate";
import { paylineStateMachine } from "./PaylineStateMachine";
import type { WinResult, SymbolType } from "../../types";

export class PaylineStateManager {
  private actor: ReturnType<typeof createActor<typeof paylineStateMachine>>;
  private onWinDisplayCallbacks: Array<
    (wins: WinResult[], currentIndex?: number) => Promise<void> | void
  > = [];
  private onAnimationStartCallbacks: Array<() => void> = [];
  private onAnimationEndCallbacks: Array<() => void> = [];
  private onSkippedCallbacks: Array<() => void> = [];
  private currentAnimationPromise: Promise<void> | null = null;
  private animationPromiseResolve: (() => void) | null = null;
  private currentWins: WinResult[] = [];

  constructor() {
    this.actor = createActor(paylineStateMachine);

    // Subscribe to state changes and handle the animation flow
    this.actor.subscribe((state) => {
      this.handleStateChange(state);
    });

    this.actor.start();
  }

  private async handleStateChange(state: any): Promise<void> {
    const { value, context } = state;

    switch (value) {
      case "singleWinAnimation":
        // Single win - animate directly
        await this.handleSingleWinAnimation(context);
        break;

      case "showingAllWins":
        // Multiple wins - show all statically first
        await this.handleShowAllWins(context);
        break;

      case "animatingIndividualWins":
        // Multiple wins - animate individual wins
        await this.handleIndividualWinAnimation(context);
        break;

      case "complete":
        // Animation sequence complete
        this.handleAnimationComplete();
        break;

      case "idle":
        if (this.currentWins.length > 0) {
          await this.clearAllPaylines();
          this.currentWins = [];
        }
        this.handleAnimationEnd();
        break;
    }
  }

  private async handleSingleWinAnimation(context: any): Promise<void> {
    const { winResults } = context;
    if (winResults.length === 1) {
      // Call the renderer to show this single win with animation
      await this.triggerWinDisplayCallbacks(winResults, 0);
      // Move to completion
      this.actor.send({ type: "ANIMATION_COMPLETE" });
    }
  }

  private async handleShowAllWins(context: any): Promise<void> {
    const { winResults } = context;
    if (winResults.length > 1) {
      // Show all wins without animation (currentIndex = undefined)
      await this.triggerWinDisplayCallbacks(winResults, undefined);
      // The state machine actor will handle the timing and transition automatically
    }
  }

  private async handleIndividualWinAnimation(context: any): Promise<void> {
    const { winResults, currentWinIndex } = context;
    if (currentWinIndex < winResults.length) {
      // Individual win animation logging removed

      if (currentWinIndex === 0) {
        await this.clearAllPaylines();
      }

      // Show the current individual win with animation
      await this.triggerWinDisplayCallbacks(winResults, currentWinIndex);

      if (currentWinIndex >= winResults.length - 1) {
        // Last win completed
        this.actor.send({ type: "ANIMATION_COMPLETE" });
      } else {
        // Move to next win
        this.actor.send({ type: "NEXT_WIN" });
      }
    }
  }

  private handleAnimationComplete(): void {
    this.resolveCurrentAnimation();
  }

  private handleAnimationEnd(): void {
    this.onAnimationEndCallbacks.forEach((callback) => callback());
  }

  private async clearAllPaylines(): Promise<void> {
    await this.triggerWinDisplayCallbacks([], undefined);
  }

  setWinsAndAnimate(wins: WinResult[]): void {
    this.currentWins = wins;

    if (wins.length === 0) {
      // No wins, just clear and end
      this.clearAllPaylines();
      return;
    }

    // Trigger animation start callbacks
    this.onAnimationStartCallbacks.forEach((callback) => callback());

    // Send wins to the state machine
    this.actor.send({
      type: "SET_WINS_AND_ANIMATE",
      wins,
    });
  }

  evaluatePaylines(reelResults: SymbolType[][], currentBet: number): void {
    this.actor.send({
      type: "EVALUATE_PAYLINES",
      reelResults,
      currentBet,
    });
  }

  skipAnimation(): void {
    this.actor.send({ type: "SKIP_ANIMATION" });
    this.onSkippedCallbacks.forEach((callback) => callback());
  }

  reset(): void {
    this.currentWins = [];
    this.actor.send({ type: "RESET" });
  }

  setAnimationSpeed(speed: number): void {
    this.actor.send({ type: "SET_ANIMATION_SPEED", speed });
  }

  toggleShowAll(): void {
    this.actor.send({ type: "TOGGLE_SHOW_ALL" });
  }

  getCurrentState(): any {
    const snapshot = this.actor.getSnapshot();
    return {
      value: snapshot.value,
      context: snapshot.context,
    };
  }

  private async triggerWinDisplayCallbacks(
    wins: WinResult[],
    currentIndex?: number
  ): Promise<void> {
    const promises = this.onWinDisplayCallbacks.map(async (callback) => {
      try {
        await callback(wins, currentIndex);
      } catch (error) {
        console.error("Error in win display callback:", error);
      }
    });
    await Promise.all(promises);
  }

  getWins(): WinResult[] {
    return this.currentWins;
  }

  getIsAnimating(): boolean {
    return this.actor.getSnapshot().context.isAnimating;
  }

  // Public method to match PaylineRendererV5 expectations
  isAnimating(): boolean {
    return this.getIsAnimating();
  }

  // Method for PaylineRendererV5 compatibility
  onWinDisplay(
    callback: (wins: WinResult[], currentIndex?: number) => Promise<void> | void
  ): void {
    this.addWinDisplayCallback(callback);
  }

  // Method for PaylineRendererV5 compatibility
  onStateChange(callback: (state: any) => void): void {
    this.actor.subscribe((state) => {
      callback({
        value: state.value,
        context: state.context,
      });
    });
  }

  // Method for PaylineRendererV5 compatibility
  getDebugInfo(): any {
    const snapshot = this.actor.getSnapshot();
    return {
      state: snapshot.value,
      winCount: this.currentWins.length,
      isAnimating: snapshot.context.isAnimating,
    };
  }

  // Method for PaylineRendererV5 compatibility
  dispose(): void {
    this.destroy();
  }

  // Promise-based animation coordination methods
  createAnimationPromise(): Promise<void> {
    if (this.currentAnimationPromise) {
      return this.currentAnimationPromise;
    }

    this.currentAnimationPromise = new Promise<void>((resolve) => {
      this.animationPromiseResolve = resolve;
    });

    return this.currentAnimationPromise;
  }

  resolveCurrentAnimation(): void {
    if (this.animationPromiseResolve) {
      this.animationPromiseResolve();
      this.animationPromiseResolve = null;
      this.currentAnimationPromise = null;
    } else {
    }
  }

  setAnimationCallbacks(callbacks: {
    onStart?: () => void;
    onEnd?: () => void;
    onSkipped?: () => void;
  }): void {
    if (callbacks.onStart) {
      this.onAnimationStartCallbacks = [callbacks.onStart];
    }
    if (callbacks.onEnd) {
      this.onAnimationEndCallbacks = [callbacks.onEnd];
    }
    if (callbacks.onSkipped) {
      this.onSkippedCallbacks = [callbacks.onSkipped];
    }
  }

  addWinDisplayCallback(
    callback: (wins: WinResult[], currentIndex?: number) => Promise<void> | void
  ): void {
    this.onWinDisplayCallbacks.push(callback);
  }

  removeWinDisplayCallback(
    callback: (wins: WinResult[], currentIndex?: number) => Promise<void> | void
  ): void {
    const index = this.onWinDisplayCallbacks.indexOf(callback);
    if (index > -1) {
      this.onWinDisplayCallbacks.splice(index, 1);
    }
  }

  injectAnimationPromise(promise: Promise<void>): void {
    promise
      .then(() => {})
      .catch((error) => {
        console.error("🎰 Injected animation promise error:", error);
      });
  }

  getCurrentContext(): any {
    return this.actor.getSnapshot().context;
  }

  destroy(): void {
    this.actor.stop();
    this.resolveCurrentAnimation();
    this.onWinDisplayCallbacks = [];
    this.onAnimationStartCallbacks = [];
    this.onAnimationEndCallbacks = [];
    this.onSkippedCallbacks = [];
    this.currentWins = [];
  }
}
