import { createMachine, assign } from "xstate";
import type { SpinResult } from "../../types";

// Game state machine context
export interface GameContext {
  balance: number;
  currentBet: number;
  lastWin: number;
  totalWin: number;
  reelResults: SpinResult | null;
  isSpinning: boolean;
  canSpin: boolean;
}

// Game state machine events
export type GameEvent =
  | { type: "SPIN" }
  | { type: "INCREASE_BET" }
  | { type: "DECREASE_BET" }
  | { type: "SET_BET"; amount: number }
  | { type: "SPIN_COMPLETE"; result: SpinResult }
  | { type: "WIN_CELEBRATION_COMPLETE" }
  | { type: "RESET_GAME" };

// Initial context
const initialContext: GameContext = {
  balance: 1000,
  currentBet: 25,
  lastWin: 0,
  totalWin: 0,
  reelResults: null,
  isSpinning: false,
  canSpin: true,
};

// Create the game state machine
export const gameStateMachine = createMachine(
  {
    id: "slotGame",
    initial: "idle",
    context: initialContext,
    types: {} as {
      context: GameContext;
      events: GameEvent;
    },
    states: {
      idle: {
        entry: "resetSpinFlags",
        on: {
          SPIN: {
            target: "spinning",
            guard: "hasEnoughBalance",
          },
          INCREASE_BET: {
            actions: "increaseBet",
            guard: "canIncreaseBet",
          },
          DECREASE_BET: {
            actions: "decreaseBet",
            guard: "canDecreaseBet",
          },
          SET_BET: {
            actions: "setBet",
          },
          RESET_GAME: {
            actions: "resetGame",
          },
        },
      },
      spinning: {
        entry: "deductBet",
        on: {
          SPIN_COMPLETE: {
            target: "evaluating",
            actions: "updateSpinResult",
          },
        },
      },
      evaluating: {
        always: [
          {
            target: "celebrating",
            guard: "hasWins",
          },
          {
            target: "idle",
            actions: "resetSpinState",
          },
        ],
      },
      celebrating: {
        entry: "addWinnings",
        after: {
          2000: {
            target: "idle",
            actions: "resetSpinState",
          },
        },
        on: {
          WIN_CELEBRATION_COMPLETE: {
            target: "idle",
            actions: "resetSpinState",
          },
        },
      },
    },
  },
  {
    guards: {
      hasEnoughBalance: ({ context }) => context.balance >= context.currentBet,
      hasWins: ({ context }) =>
        context.reelResults !== null && context.reelResults.totalWin > 0,
      canIncreaseBet: ({ context }) =>
        context.balance >= context.currentBet + 5,
      canDecreaseBet: ({ context }) => context.currentBet > 1,
    },
    actions: {
      resetSpinFlags: assign(({ context }) => ({
        ...context,
        canSpin: context.balance >= context.currentBet,
        isSpinning: false,
      })),
      deductBet: assign(({ context }) => ({
        ...context,
        balance: context.balance - context.currentBet,
        canSpin: false,
        isSpinning: true,
      })),
      addWinnings: assign(({ context }) => {
        const winAmount = context.reelResults?.totalWin || 0;
        return {
          ...context,
          balance: context.balance + winAmount,
          lastWin: winAmount,
          totalWin: context.totalWin + winAmount,
        };
      }),
      updateSpinResult: assign(({ context, event }) => {
        if (event.type === "SPIN_COMPLETE") {
          return {
            ...context,
            reelResults: event.result,
          };
        }
        return context;
      }),
      resetSpinState: assign(({ context }) => ({
        ...context,
        isSpinning: false,
        canSpin: context.balance >= context.currentBet,
        reelResults: null,
      })),
      increaseBet: assign(({ context }) => {
        const newBet = context.currentBet + 5;
        return {
          ...context,
          currentBet: newBet,
          canSpin: context.balance >= newBet,
        };
      }),
      decreaseBet: assign(({ context }) => {
        const newBet = Math.max(1, context.currentBet - 5);
        return {
          ...context,
          currentBet: newBet,
          canSpin: context.balance >= newBet,
        };
      }),
      setBet: assign(({ context, event }) => {
        if (event.type === "SET_BET") {
          const newBet = event.amount; // Remove automatic clamping - let UI handle validation
          return {
            ...context,
            currentBet: newBet,
            canSpin: context.balance >= newBet,
          };
        }
        return context;
      }),
      resetGame: assign(() => initialContext),
    },
  }
);

export type GameStateMachine = typeof gameStateMachine;
