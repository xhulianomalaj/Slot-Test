import { SymbolType } from "../../types";
import type {
  WinResult,
  SpinResult,
  PaylineConfig,
  Position,
} from "../../types";
import { getSymbolConfig } from "../symbols/SymbolConfig";
import { GAME_CONFIG } from "../config/GameConfig";

export class WinEvaluator {
  /**
   * Evaluate all paylines for wins based on the spin result
   */
  static evaluateWins(reelResults: SymbolType[][]): WinResult[] {
    const wins: WinResult[] = [];

    for (const payline of GAME_CONFIG.paylines) {
      const win = this.evaluatePayline(payline, reelResults);
      if (win) {
        wins.push(win);
      }
    }

    return wins;
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

    // Debug: Log payline evaluation for all paylines that might win
    if (payline.id <= 5 || payline.id === 12) {
      // console.log(
      //   `🔍 Payline ${payline.id} (${payline.name}) symbols:`,
      //   symbols
      // );
      // console.log(`🔍 Payline ${payline.id} positions:`, positions);
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

    // Debug: Log the win result for all winning paylines
    // console.log(`🏆 Payline ${payline.id} WIN:`, result);

    return result;
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
   * Create a complete spin result with win evaluation
   */
  static createSpinResult(reelResults: SymbolType[][]): SpinResult {
    const wins = this.evaluateWins(reelResults);
    const totalWin = wins.reduce((sum, win) => sum + win.winAmount, 0);

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
   * Get the highest paying win from a spin result
   */
  static getHighestWin(spinResult: SpinResult): WinResult | null {
    if (spinResult.wins.length === 0) {
      return null;
    }

    return spinResult.wins.reduce((highest, current) =>
      current.winAmount > highest.winAmount ? current : highest
    );
  }

  /**
   * Get all winning positions from a spin result (for highlighting)
   */
  static getAllWinningPositions(spinResult: SpinResult): Position[] {
    const allPositions: Position[] = [];

    for (const win of spinResult.wins) {
      allPositions.push(...win.positions);
    }

    // Remove duplicates
    return allPositions.filter(
      (position, index, array) =>
        array.findIndex(
          (p) => p.reel === position.reel && p.row === position.row
        ) === index
    );
  }
}
