import { createMachine, assign, fromPromise } from "xstate";
import type { WinResult, PaylineConfig, SymbolType } from "../../types";

// Animation timing configurations
export const ANIMATION_TIMINGS = {
  SHOW_ALL_DURATION: 1000, // Time to show all wins together
  INDIVIDUAL_WIN_DURATION: 3000, // 3 seconds per individual win (will be overridden by promises)
  CYCLE_DELAY: 500, // Delay between win cycles
};

// Payline state machine context
export interface PaylineContext {
  winResults: WinResult[];
  currentWinIndex: number;
  isAnimating: boolean;
  skipRequested: boolean;
  animationSpeed: number;
  showAllPaylines: boolean;
  evaluationProgress: number;
  totalPaylines: number;
  evaluatedPaylines: PaylineConfig[];
  reelResults: SymbolType[][] | null;
}

// Payline state machine events
export type PaylineEvent =
  | { type: "EVALUATE_PAYLINES"; reelResults: SymbolType[][] }
  | { type: "SET_WINS_AND_ANIMATE"; wins: WinResult[] }
  | { type: "SKIP_ANIMATION" }
  | { type: "RESET" }
  | { type: "SET_ANIMATION_SPEED"; speed: number }
  | { type: "TOGGLE_SHOW_ALL" }
  | { type: "ANIMATION_COMPLETE" }
  | { type: "NEXT_WIN" };

// Animation actors
const showAllWinsActor = fromPromise(
  async ({
    input,
  }: {
    input: {
      wins: WinResult[];
      animationSpeed: number;
      onSkip?: () => boolean;
    };
  }) => {
    // Wait for the specified duration to show all wins
    const duration = ANIMATION_TIMINGS.SHOW_ALL_DURATION / input.animationSpeed;

    return new Promise<void>((resolve) => {
      const checkSkip = () => {
        if (input.onSkip?.()) {
          resolve();
          return true;
        }
        return false;
      };

      const skipInterval = setInterval(checkSkip, 100);

      setTimeout(() => {
        clearInterval(skipInterval);
        // Transition logging removed
        resolve();
      }, duration);
    });
  }
);

// Evaluation actor (dynamic import for better performance)
const evaluatePaylineActor = fromPromise(
  async ({
    input,
  }: {
    input: {
      reelResults: SymbolType[][];
      onProgress?: (
        progress: number,
        total: number,
        evaluatedPaylines: PaylineConfig[]
      ) => void;
    };
  }) => {
    try {
      // Dynamic import to avoid loading the evaluator until needed
      const { WinEvaluatorV5 } = await import("../logic/WinEvaluatorV5");

      // Evaluate paylines and get wins
      const result = await WinEvaluatorV5.evaluateWinsProgressive(
        input.reelResults
      );

      return { wins: result, evaluatedPaylines: [] };
    } catch (error) {
      console.error("Failed to evaluate paylines:", error);
      return { wins: [], evaluatedPaylines: [] };
    }
  }
);

export const paylineStateMachine = createMachine(
  {
    id: "paylineAnimation",
    types: {} as {
      context: PaylineContext;
      events: PaylineEvent;
    },

    context: {
      winResults: [],
      currentWinIndex: 0,
      isAnimating: false,
      skipRequested: false,
      animationSpeed: 1,
      showAllPaylines: false,
      evaluationProgress: 0,
      totalPaylines: 0,
      evaluatedPaylines: [],
      reelResults: null,
    },

    initial: "idle",

    states: {
      idle: {
        entry: "resetContext",
        on: {
          EVALUATE_PAYLINES: {
            target: "evaluating",
            actions: "startEvaluation",
          },
          SET_WINS_AND_ANIMATE: {
            target: "evaluationComplete",
            actions: "setWins",
          },
          SET_ANIMATION_SPEED: {
            actions: "setAnimationSpeed",
          },
          TOGGLE_SHOW_ALL: {
            actions: "toggleShowAll",
          },
        },
      },

      evaluating: {
        entry: "startAnimation",
        invoke: {
          id: "evaluatePaylines",
          src: evaluatePaylineActor,
          input: ({ context }) => ({
            reelResults: context.reelResults!,
            onProgress: (
              _progress: number,
              _total: number,
              _evaluatedPaylines: PaylineConfig[]
            ) => {
              // This would trigger a progress event in a real implementation
            },
          }),
          onDone: {
            target: "evaluationComplete",
            actions: "setEvaluationResults",
          },
          onError: {
            target: "idle",
            actions: "resetContext",
          },
        },
        on: {
          SKIP_ANIMATION: {
            target: "idle",
            actions: ["requestSkip", "resetContext"],
          },
        },
      },

      evaluationComplete: {
        always: [
          {
            target: "singleWinAnimation",
            guard: "hasSingleWin",
          },
          {
            target: "showingAllWins",
            guard: "hasMultipleWins",
          },
          {
            target: "idle",
            actions: "resetContext",
          },
        ],
      },

      singleWinAnimation: {
        entry: "startSingleWinAnimation",
        on: {
          ANIMATION_COMPLETE: {
            target: "complete",
          },
          SKIP_ANIMATION: {
            target: "complete",
            actions: "requestSkip",
          },
        },
      },

      showingAllWins: {
        entry: "startShowAllAnimation",
        invoke: {
          src: showAllWinsActor,
          input: ({ context }) => ({
            wins: context.winResults,
            animationSpeed: context.animationSpeed,
            onSkip: () => context.skipRequested,
          }),
          onDone: {
            target: "animatingIndividualWins",
            actions: "prepareWinCycling",
          },
        },
        on: {
          SKIP_ANIMATION: {
            target: "complete",
            actions: "requestSkip",
          },
        },
      },

      animatingIndividualWins: {
        entry: "resetCurrentWinIndex",
        on: {
          ANIMATION_COMPLETE: {
            target: "complete",
          },
          NEXT_WIN: {
            target: "animatingIndividualWins",
            actions: "moveToNextWin",
          },
          SKIP_ANIMATION: {
            target: "complete",
            actions: "requestSkip",
          },
        },
      },

      complete: {
        entry: "completeAnimation",
        always: {
          target: "idle",
          actions: "resetContext",
        },
      },
    },
  },
  {
    actions: {
      resetContext: assign({
        winResults: [],
        currentWinIndex: 0,
        isAnimating: false,
        skipRequested: false,
        evaluationProgress: 0,
        totalPaylines: 0,
        evaluatedPaylines: [],
        reelResults: null,
      }),

      startEvaluation: assign({
        reelResults: ({ event }) => {
          if (event.type === "EVALUATE_PAYLINES") {
            return event.reelResults;
          }
          return null;
        },
        isAnimating: true,
        skipRequested: false,
      }),

      setWins: assign({
        winResults: ({ event }) => {
          if (event.type === "SET_WINS_AND_ANIMATE") {
            return event.wins;
          }
          return [];
        },
        isAnimating: true,
        skipRequested: false,
      }),

      setEvaluationResults: assign({
        winResults: ({ event }) => (event as any).output.wins,
        evaluatedPaylines: ({ event }) =>
          (event as any).output.evaluatedPaylines,
      }),

      startAnimation: assign({
        isAnimating: true,
        skipRequested: false,
      }),

      startSingleWinAnimation: assign({
        isAnimating: true,
      }),

      startShowAllAnimation: assign({
        isAnimating: true,
      }),

      prepareWinCycling: assign({
        currentWinIndex: 0,
      }),

      resetCurrentWinIndex: assign({
        currentWinIndex: 0,
      }),

      startIndividualWinAnimation: assign({
        isAnimating: true,
      }),

      moveToNextWin: assign({
        currentWinIndex: ({ context }) => context.currentWinIndex + 1,
      }),

      completeAnimation: assign({
        isAnimating: false,
      }),

      requestSkip: assign({
        skipRequested: true,
      }),

      setAnimationSpeed: assign({
        animationSpeed: ({ event }) => {
          if (event.type === "SET_ANIMATION_SPEED") {
            return Math.max(0.1, Math.min(5, event.speed));
          }
          return 1;
        },
      }),

      toggleShowAll: assign({
        showAllPaylines: ({ context }) => !context.showAllPaylines,
      }),
    },

    guards: {
      hasWins: ({ context }) => context.winResults.length > 0,
      hasSingleWin: ({ context }) => context.winResults.length === 1,
      hasMultipleWins: ({ context }) => context.winResults.length > 1,
      isLastWin: ({ context }) =>
        context.currentWinIndex >= context.winResults.length - 1,
    },
  }
);

export type PaylineStateMachine = typeof paylineStateMachine;
