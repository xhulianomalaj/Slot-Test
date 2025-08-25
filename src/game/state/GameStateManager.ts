import { createActor, type Actor } from "xstate";
import {
  gameStateMachine,
  type GameContext,
  type GameEvent,
} from "./GameStateMachine";
import type { SpinResult } from "../../types";

export class GameStateManager {
  private actor: Actor<typeof gameStateMachine>;
  private listeners: Map<string, (context: GameContext) => void> = new Map();

  constructor() {
    this.actor = createActor(gameStateMachine);

    // Subscribe to state changes
    this.actor.subscribe((state) => {
      this.notifyListeners(state.context);
    });

    this.actor.start();
  }

  get currentState() {
    return this.actor.getSnapshot().value;
  }

  get context(): GameContext {
    return this.actor.getSnapshot().context;
  }

  get canSpin(): boolean {
    return this.context.canSpin && this.currentState === "idle";
  }

  get isSpinning(): boolean {
    return this.context.isSpinning || this.currentState === "spinning";
  }

  // Send events to the state machine
  send(event: GameEvent): void {
    this.actor.send(event);
  }

  // Convenience methods for common actions
  spin(): void {
    if (this.canSpin) {
      this.send({ type: "SPIN" });
    }
  }

  completeSpin(result: SpinResult): void {
    this.send({ type: "SPIN_COMPLETE", result });
  }

  increaseBet(): void {
    this.send({ type: "INCREASE_BET" });
  }

  decreaseBet(): void {
    this.send({ type: "DECREASE_BET" });
  }

  setBet(amount: number): void {
    this.send({ type: "SET_BET", amount });
  }

  completeWinCelebration(): void {
    this.send({ type: "WIN_CELEBRATION_COMPLETE" });
  }

  resetGame(): void {
    this.send({ type: "RESET_GAME" });
  }

  // Subscribe to state changes
  subscribe(id: string, callback: (context: GameContext) => void): void {
    this.listeners.set(id, callback);
    // Immediately call with current context
    callback(this.context);
  }

  // Unsubscribe from state changes
  unsubscribe(id: string): void {
    this.listeners.delete(id);
  }

  // Notify all listeners of state changes
  private notifyListeners(context: GameContext): void {
    this.listeners.forEach((callback) => {
      callback(context);
    });
  }

  get balance(): number {
    return this.context.balance;
  }

  get currentBet(): number {
    return this.context.currentBet;
  }

  get lastWin(): number {
    return this.context.lastWin;
  }

  get totalWin(): number {
    return this.context.totalWin;
  }

  get spinResults(): SpinResult | null {
    return this.context.reelResults;
  }

  destroy(): void {
    this.actor.stop();
    this.listeners.clear();
  }
}
