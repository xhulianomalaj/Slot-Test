import * as PIXI from "pixi.js";
import { Symbol } from "../symbols/Symbol";
import { SymbolFactory } from "../symbols/SymbolFactory";
import { generateSymbol } from "../symbols/SymbolConfig";
import { SymbolType } from "../../types";
import { GAME_CONFIG } from "../config/GameConfig";
import { ReelAnimations } from "./ReelAnimations";

export class Reel extends PIXI.Container {
  private _symbols: Symbol[] = [];
  private _reelIndex: number;
  private _symbolFactory: SymbolFactory;
  private _visibleSymbols: number = 3;
  private _symbolHeight: number;
  private _initialSymbolTypes: SymbolType[] = [];
  private _initialSymbolPositions: number[] = [];
  private _animations: ReelAnimations;

  constructor(reelIndex: number, symbolFactory: SymbolFactory) {
    super();

    this._reelIndex = reelIndex;
    this._symbolFactory = symbolFactory;
    this._symbolHeight = GAME_CONFIG.reels.symbolHeight;

    this.initializeReel();

    // Initialize animations with callbacks for adding/removing children
    this._animations = new ReelAnimations(
      this._symbols,
      this._symbolFactory,
      (symbol: Symbol) => this.addChild(symbol),
      (symbol: Symbol) => this.removeChild(symbol)
    );
  }

  get symbols(): Symbol[] {
    return this._symbols;
  }

  get isSpinning(): boolean {
    return this._animations.isSpinning;
  }

  get reelIndex(): number {
    return this._reelIndex;
  }

  /**
   * Initialize the reel with symbols
   */
  private initializeReel(): void {
    // Create extra symbols for smooth spinning animation
    // We need visible symbols + buffer symbols above and below
    const totalSymbols = this._visibleSymbols + 4; // 2 above, 2 below for smooth scrolling

    for (let i = 0; i < totalSymbols; i++) {
      const symbolType = generateSymbol();
      const symbol = this._symbolFactory.createSymbol(symbolType);

      // Calculate and store initial position
      const initialY = (i - 2) * this._symbolHeight;

      // Store initial visible symbol types and positions (positions 2, 3, 4 are the visible ones)
      if (i >= 2 && i < 2 + this._visibleSymbols) {
        this._initialSymbolTypes.push(symbolType);
        this._initialSymbolPositions.push(initialY);
      }

      // Position symbols vertically (x=0 since reel is already positioned and symbol anchor is 0.5)
      symbol.x = 0;
      symbol.y = initialY;

      this._symbols.push(symbol);
      this.addChild(symbol);
    }
  }

  /**
   * Get the currently visible symbols (3 symbols in the middle)
   */
  getVisibleSymbols(): Symbol[] {
    const startIndex = 1; // Skip the 1 buffer symbol at the top (visible symbols are at indices 1, 2, 3)
    return this._symbols
      .slice(startIndex, startIndex + this._visibleSymbols)
      .filter((symbol) => symbol !== null && symbol !== undefined);
  }

  /**
   * Get the symbol types of visible symbols
   */
  getVisibleSymbolTypes(): SymbolType[] {
    const visibleSymbols = this.getVisibleSymbols();
    const symbolTypes = visibleSymbols.map((symbol) => symbol.type);
    // console.log(
    //   `🔍 Reel ${this._reelIndex + 1} getVisibleSymbolTypes returning:`,
    //   symbolTypes
    // );
    return symbolTypes;
  }

  /**
   * Get the initial symbol types that were set when the reel was first created
   */
  getInitialSymbolTypes(): SymbolType[] {
    return [...this._initialSymbolTypes];
  }

  /**
   * Get the initial symbol positions that were set when the reel was first created
   */
  getInitialSymbolPositions(): number[] {
    return [...this._initialSymbolPositions];
  }

  /**
   * Get current visible symbol positions for debugging
   */
  getCurrentVisiblePositions(): number[] {
    return this.getVisibleSymbols().map((symbol) => symbol.y);
  }

  /**
   * Generate new random symbols for the reel
   */
  generateNewSymbols(): void {
    this._symbols.forEach((symbol) => {
      // Generate new random symbol type
      const newType = generateSymbol();

      // Remove old symbol and create new one
      this.removeChild(symbol);
      symbol.destroy();

      // Create new symbol with same position
      const newSymbol = this._symbolFactory.createSymbol(newType);
      newSymbol.x = symbol.x;
      newSymbol.y = symbol.y;

      this.addChild(newSymbol);

      // Replace in array
      const index = this._symbols.indexOf(symbol);
      this._symbols[index] = newSymbol;
    });

    // Update animations with new symbols reference
    this._animations.updateSymbolsReference(this._symbols);
  }

  /**
   * Set specific symbol types for the visible positions (used when stopping)
   */
  setVisibleSymbolTypes(symbolTypes: SymbolType[]): void {
    if (symbolTypes.length !== this._visibleSymbols) {
      throw new Error(
        `Expected ${this._visibleSymbols} symbol types, got ${symbolTypes.length}`
      );
    }

    const visibleSymbols = this.getVisibleSymbols();

    symbolTypes.forEach((symbolType, index) => {
      const currentSymbol = visibleSymbols[index];

      if (currentSymbol && currentSymbol.type !== symbolType) {
        // Store position before destroying
        const symbolX = currentSymbol.x;
        const symbolY = currentSymbol.y;
        const symbolIndex = this._symbols.indexOf(currentSymbol);

        // Remove current symbol
        this.removeChild(currentSymbol);
        currentSymbol.destroy();

        // Create new symbol with correct type
        const newSymbol = this._symbolFactory.createSymbol(symbolType);
        newSymbol.x = symbolX;
        newSymbol.y = symbolY;

        this.addChild(newSymbol);
        this._symbols[symbolIndex] = newSymbol;
      }
    });

    // Update animations with modified symbols
    this._animations.updateSymbolsReference(this._symbols);
  }



  /**
   * Reset reel to initial position after spinning
   */
  resetPosition(): void {
    this._symbols.forEach((symbol, index) => {
      if (symbol && symbol.y !== undefined) {
        symbol.y = (index - 2) * this._symbolHeight;
      }
    });
  }

  /**
   * Set spinning state (deprecated - handled by animations)
   */
  setSpinning(_spinning: boolean): void {
    // This method is kept for backward compatibility but is no longer used
    // Spinning state is now managed by the ReelAnimations class
  }

  /**
   * Get symbol at specific visible row (0-2)
   */
  getSymbolAtRow(row: number): Symbol | null {
    if (row < 0 || row >= this._visibleSymbols) {
      return null;
    }

    const visibleSymbols = this.getVisibleSymbols();
    return visibleSymbols[row];
  }

  /**
   * Start spinning animation
   */
  async spin(): Promise<void> {
    return this._animations.spin();
  }

  /**
   * Stop spinning naturally
   */
  async stop(): Promise<void> {
    return this._animations.stop();
  }

  /**
   * Stop spinning and return to initial symbol configuration
   */
  async stopWithInitialSymbols(): Promise<void> {
    await this.stop();
  }

  /**
   * Force stop spinning immediately (emergency stop)
   */
  forceStop(): void {
    this._animations.forceStop();
  }

  /**
   * Get spin duration based on reel index (for staggered stopping)
   */
  getSpinDuration(): number {
    const baseDuration = GAME_CONFIG.animations.spinDuration;
    const staggerDelay = GAME_CONFIG.animations.reelStopDelay * this._reelIndex;
    return baseDuration + staggerDelay;
  }

  /**
   * Highlight symbol at specific row
   */
  highlightSymbolAt(row: number): void {
    const symbol = this.getSymbolAtRow(row);
    if (symbol) {
      symbol.highlight();
    }
  }

  /**
   * Clear all highlights on this reel
   */
  clearHighlights(): void {
    this._symbols.forEach((symbol) => {
      if (symbol) {
        symbol.removeHighlight();
      }
    });
  }

  /**
   * Cleanup resources
   */
  override destroy(): void {
    this.forceStop();
    this._symbols.forEach((symbol) => {
      symbol.destroy();
    });
    this._symbols = [];
    super.destroy();
  }
}
