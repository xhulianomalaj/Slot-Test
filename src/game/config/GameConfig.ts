import type { GameConfig } from "../../types";
import { PAYLINE_CONFIGS } from "./PaylineConfig";
import { SYMBOL_CONFIGS } from "../symbols/SymbolConfig";

export const GAME_CONFIG: GameConfig = {
  reels: {
    count: 5,
    rows: 3,
    symbolHeight: 194,
    symbolWidth: 225,
  },
  paylines: PAYLINE_CONFIGS,
  betting: {
    minBet: 1,
    maxBet: 100,
    defaultBet: 20,
    linesPerSpin: 20, // All paylines active
  },
  animations: {
    spinDuration: 2000,
    reelStopDelay: 500,
    winCelebrationDuration: 2000,
  },
  symbols: SYMBOL_CONFIGS,
};

// Layout constants
export const LAYOUT = {
  GAME_AREA_WIDTH: 800,
  GAME_AREA_HEIGHT: 600,
  UI_HEIGHT: 120,
  SYMBOL_WIDTH: 180,
  SYMBOL_HEIGHT: 180,
  REEL_SPACING: 15,
} as const;
