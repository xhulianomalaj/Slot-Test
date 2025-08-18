// Core game types
export enum SymbolType {
  APPLE = "apple",
  BLUEBERRY = "blueberry",
  CHERRY = "cherry",
  COCONUT = "coconut",
  KIWI = "kiwi",
  ORANGE = "orange",
  PEAR = "pear",
  STRAWBERRY = "strawberry",
}

export interface Position {
  reel: number;
  row: number;
}

export interface SymbolConfig {
  type: SymbolType;
  name: string;
  rarity: number; // 0-1, where 1 is most common
  payoutMultipliers: { [key: number]: number }; // key = symbol count, value = multiplier
  imagePath: string; // Path to individual PNG file
}

export interface WinResult {
  payline: number;
  symbols: SymbolType[];
  multiplier: number;
  winAmount: number;
  positions: Position[];
}

export interface SpinResult {
  reelResults: SymbolType[][];
  wins: WinResult[];
  totalWin: number;
}

export interface PaylineConfig {
  id: number;
  positions: Position[];
  name: string;
}

export interface GameConfig {
  reels: {
    count: 5;
    rows: 3;
    symbolHeight: number;
    symbolWidth: number;
  };
  paylines: PaylineConfig[];
  betting: {
    minBet: number;
    maxBet: number;
    defaultBet: number;
    linesPerSpin: number; // All paylines active
  };
  animations: {
    spinDuration: number;
    reelStopDelay: number;
    winCelebrationDuration: number;
  };
  symbols: SymbolConfig[];
}
