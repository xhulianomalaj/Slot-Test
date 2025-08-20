import { SymbolType } from "../../types";
import type {
  WinResult,
  PaylineConfig,
  Position,
  SpinResult,
} from "../../types";
import { getSymbolConfig } from "../symbols/SymbolConfig";
import { GAME_CONFIG } from "../config/GameConfig";

/**
 * Enhanced WinEvaluator with state machine integration
 * Supports progressive evaluation and progress reporting
 */
export class WinEvaluatorV5 {
  /**
   * Evaluate all paylines for wins based on the current reel symbols
   */
  public static evaluateWins(reelResults: SymbolType[][]): WinResult[] {
    const paylines = GAME_CONFIG.paylines;
    const allWins: WinResult[] = [];

    // Evaluate each payline for wins
    paylines.forEach((payline) => {
      const win = this.evaluatePayline(payline, reelResults);
      if (win) {
        allWins.push(win);
      }
    });

    // Remove overlapping wins
    const deduplicatedWins = this.deduplicateOverlappingWins(allWins);

    return deduplicatedWins;
  }

  /**
   * Remove overlapping wins where one win's positions are completely contained within another
   * Keeps wins that extend to different areas even if they share some positions
   */
  private static deduplicateOverlappingWins(wins: WinResult[]): WinResult[] {
    if (wins.length <= 1) {
      return wins;
    }

    // Sort wins by amount (highest first) to prioritize better wins
    const sortedWins = [...wins].sort((a, b) => b.winAmount - a.winAmount);
    const keptWins: WinResult[] = [];

    for (const currentWin of sortedWins) {
      // Check if this win is completely contained within any already kept win
      const isContainedByKeptWin = keptWins.some((keptWin) =>
        this.isWinCompletelyContainedBy(currentWin, keptWin)
      );

      // Check if any kept win is completely contained by this win
      const containsKeptWin = keptWins.findIndex((keptWin) =>
        this.isWinCompletelyContainedBy(keptWin, currentWin)
      );

      if (isContainedByKeptWin) {
        // Skip this win - it's completely contained in a better win
      } else if (containsKeptWin !== -1) {
        // Remove the contained win and add this better one
        keptWins.splice(containsKeptWin, 1);
        keptWins.push(currentWin);
      } else {
        keptWins.push(currentWin);
      }
    }

    return keptWins;
  }

  /**
   * Check if win1's positions are completely contained within win2's positions
   */
  private static isWinCompletelyContainedBy(
    win1: WinResult,
    win2: WinResult
  ): boolean {
    // Every position in win1 must exist in win2
    return win1.positions.every((pos1) =>
      win2.positions.some(
        (pos2) => pos1.reel === pos2.reel && pos1.row === pos2.row
      )
    );
  }

  /**
   * Evaluate paylines progressively with callback support
   * Useful for showing evaluation progress in the UI
   */
  static async evaluateWinsProgressive(
    reelResults: SymbolType[][],
    onProgress?: (
      progress: number,
      totalPaylines: number,
      payline: PaylineConfig,
      hasWin: boolean
    ) => void,
    delayMs: number = 50
  ): Promise<WinResult[]> {
    const wins: WinResult[] = [];
    const paylines = GAME_CONFIG.paylines;
    const totalPaylines = paylines.length;

    for (let i = 0; i < paylines.length; i++) {
      const payline = paylines[i];
      const win = this.evaluatePayline(payline, reelResults);

      if (win) {
        wins.push(win);
      }

      // Report progress
      onProgress?.(i + 1, totalPaylines, payline, !!win);

      // Add delay for visual effect
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    // Apply the same deduplication logic to progressive evaluation
    return this.deduplicateOverlappingWins(wins);
  }

  /**
   * Evaluate a single payline for wins
   */
  private static evaluatePayline(
    payline: PaylineConfig,
    reelResults: SymbolType[][]
  ): WinResult | null {
    const symbols: SymbolType[] = [];
    const positions: Position[] = [];

    // Extract symbols from the payline positions
    for (const position of payline.positions) {
      const symbol = reelResults[position.reel][position.row];
      symbols.push(symbol);
      positions.push(position);
    }

    // Check for winning combinations (minimum 3 matching symbols from left)
    const winInfo = this.checkWinningCombination(symbols);
    if (!winInfo) {
      return null;
    }

    const { symbolType, count } = winInfo;
    const symbolConfig = getSymbolConfig(symbolType);
    const multiplier = symbolConfig.payoutMultipliers[count] || 0;

    if (multiplier === 0) {
      return null;
    }

    // Calculate win amount (multiplier * bet per line)
    const betPerLine =
      GAME_CONFIG.betting.defaultBet / GAME_CONFIG.betting.linesPerSpin;
    const winAmount = multiplier * betPerLine;

    const result = {
      payline: payline.id,
      symbols: symbols.slice(0, count), // Only include the winning symbols
      multiplier,
      winAmount,
      positions: positions.slice(0, count), // Only include winning positions
    };

    return result;
  }

  /**
   * Evaluate a specific payline by ID
   */
  static evaluateSpecificPayline(
    paylineId: number,
    reelResults: SymbolType[][]
  ): WinResult | null {
    const payline = GAME_CONFIG.paylines.find((p) => p.id === paylineId);
    if (!payline) {
      return null;
    }

    return this.evaluatePayline(payline, reelResults);
  }

  /**
   * Get all paylines that would win for given reel results
   * Returns both winning and non-winning paylines with metadata
   */
  static analyzeAllPaylines(reelResults: SymbolType[][]): {
    wins: WinResult[];
    allResults: Array<{
      payline: PaylineConfig;
      result: WinResult | null;
      hasWin: boolean;
    }>;
    totalWinAmount: number;
    winningPaylineCount: number;
  } {
    const wins: WinResult[] = [];
    const allResults: Array<{
      payline: PaylineConfig;
      result: WinResult | null;
      hasWin: boolean;
    }> = [];

    let totalWinAmount = 0;

    for (const payline of GAME_CONFIG.paylines) {
      const result = this.evaluatePayline(payline, reelResults);
      const hasWin = !!result;

      allResults.push({
        payline,
        result,
        hasWin,
      });

      if (result) {
        wins.push(result);
        totalWinAmount += result.winAmount;
      }
    }

    return {
      wins,
      allResults,
      totalWinAmount,
      winningPaylineCount: wins.length,
    };
  }

  /**
   * Check if symbols form a winning combination
   * Returns the symbol type and count if there's a win, null otherwise
   */
  private static checkWinningCombination(
    symbols: SymbolType[]
  ): { symbolType: SymbolType; count: number } | null {
    if (symbols.length < 3) {
      return null;
    }

    const firstSymbol = symbols[0];
    let matchCount = 1;

    // Count consecutive matching symbols from left to right
    for (let i = 1; i < symbols.length; i++) {
      if (symbols[i] === firstSymbol) {
        matchCount++;
      } else {
        break;
      }
    }

    // Need at least 3 matching symbols for a win
    if (matchCount >= 3) {
      return {
        symbolType: firstSymbol,
        count: matchCount,
      };
    }

    return null;
  }

  /**
   * Calculate the total win amount for all wins
   */
  static calculateTotalWin(wins: WinResult[]): number {
    return wins.reduce((total, win) => total + win.winAmount, 0);
  }

  /**
   * Create a complete spin result with win evaluation
   */
  static createSpinResult(reelResults: SymbolType[][]): SpinResult {
    const wins = this.evaluateWins(reelResults);
    const totalWin = this.calculateTotalWin(wins);

    return {
      reelResults,
      wins,
      totalWin,
    };
  }

  /**
   * Check if a spin result has any wins
   */
  static hasWins(spinResult: SpinResult): boolean {
    return spinResult.wins.length > 0 && spinResult.totalWin > 0;
  }

  /**
   * Get the highest winning result
   */
  static getHighestWin(spinResult: SpinResult): WinResult | null {
    if (!spinResult.wins.length) return null;
    return spinResult.wins.reduce((highest, current) =>
      current.winAmount > highest.winAmount ? current : highest
    );
  }

  /**
   * Get winning statistics
   */
  static getWinStatistics(wins: WinResult[]): {
    totalWin: number;
    winCount: number;
    bestWin: WinResult | null;
    averageWin: number;
    paylineDistribution: Map<number, number>;
  } {
    const totalWin = this.calculateTotalWin(wins);
    const winCount = wins.length;
    const bestWin = wins.reduce(
      (best, current) =>
        !best || current.winAmount > best.winAmount ? current : best,
      null as WinResult | null
    );
    const averageWin = winCount > 0 ? totalWin / winCount : 0;

    // Track which paylines are winning
    const paylineDistribution = new Map<number, number>();
    wins.forEach((win) => {
      paylineDistribution.set(win.payline, win.winAmount);
    });

    return {
      totalWin,
      winCount,
      bestWin,
      averageWin,
      paylineDistribution,
    };
  }

  /**
   * Validate a win result
   */
  static validateWinResult(
    win: WinResult,
    reelResults: SymbolType[][]
  ): boolean {
    try {
      // Check if positions are valid
      for (const position of win.positions) {
        if (
          position.reel < 0 ||
          position.reel >= reelResults.length ||
          position.row < 0 ||
          position.row >= reelResults[position.reel].length
        ) {
          return false;
        }
      }

      // Verify the symbols match
      const actualSymbols = win.positions.map(
        (pos) => reelResults[pos.reel][pos.row]
      );

      // Check if the symbols in the win result match actual reel results
      for (let i = 0; i < win.symbols.length; i++) {
        if (win.symbols[i] !== actualSymbols[i]) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error("Error validating win result:", error);
      return false;
    }
  }
}

// Keep the original WinEvaluator for backward compatibility
export { WinEvaluatorV5 as WinEvaluator };
