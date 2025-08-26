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

    this._animations = new ReelAnimations(
      this,
      this._symbols,
      this._symbolFactory,
      this._symbolHeight,
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

  private initializeReel(): void {
    const totalSymbols = this._visibleSymbols + 5;

    for (let i = 0; i < totalSymbols; i++) {
      const symbolType = generateSymbol();
      const symbol = this._symbolFactory.createSymbol(symbolType);

      const initialY = (i - 2) * this._symbolHeight;

      if (i >= 1 && i < 1 + this._visibleSymbols) {
        this._initialSymbolTypes.push(symbolType);
        this._initialSymbolPositions.push(initialY);
      }

      symbol.x = 0;
      symbol.y = initialY;

      this._symbols.push(symbol);
      this.addChild(symbol);
    }
  }

  getVisibleSymbols(): Symbol[] {
    const startIndex = 1;
    return this._symbols
      .slice(startIndex, startIndex + this._visibleSymbols)
      .filter((symbol) => symbol !== null && symbol !== undefined);
  }

  getVisibleSymbolTypes(): SymbolType[] {
    const visibleSymbols = this.getVisibleSymbols();
    const symbolTypes = visibleSymbols.map((symbol) => symbol.type);
    return symbolTypes;
  }

  getInitialSymbolTypes(): SymbolType[] {
    return [...this._initialSymbolTypes];
  }

  getInitialSymbolPositions(): number[] {
    return [...this._initialSymbolPositions];
  }

  getCurrentVisiblePositions(): number[] {
    return this.getVisibleSymbols().map((symbol) => symbol.y);
  }

  generateNewSymbols(): void {
    this._symbols.forEach((symbol) => {
      const newType = generateSymbol();

      this.removeChild(symbol);
      this._symbolFactory.returnSymbol(symbol); // Return to pool instead of destroy

      const newSymbol = this._symbolFactory.createSymbol(newType);
      newSymbol.x = symbol.x;
      newSymbol.y = symbol.y;

      this.addChild(newSymbol);

      const index = this._symbols.indexOf(symbol);
      this._symbols[index] = newSymbol;
    });

    this._animations.updateSymbolsReference(this._symbols);
  }

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
        const symbolX = currentSymbol.x;
        const symbolY = currentSymbol.y;
        const symbolIndex = this._symbols.indexOf(currentSymbol);

        this.removeChild(currentSymbol);
        this._symbolFactory.returnSymbol(currentSymbol); // Return to pool instead of destroy

        const newSymbol = this._symbolFactory.createSymbol(symbolType);
        newSymbol.x = symbolX;
        newSymbol.y = symbolY;

        this.addChild(newSymbol);
        this._symbols[symbolIndex] = newSymbol;
      }
    });

    this._animations.updateSymbolsReference(this._symbols);
  }

  resetPosition(): void {
    this._symbols.forEach((symbol, index) => {
      if (symbol && symbol.y !== undefined) {
        symbol.y = (index - 2) * this._symbolHeight;
      }
    });
  }

  setSpinning(_spinning: boolean): void {}

  getSymbolAtRow(row: number): Symbol | null {
    if (row < 0 || row >= this._visibleSymbols) {
      return null;
    }

    const visibleSymbols = this.getVisibleSymbols();
    return visibleSymbols[row];
  }

  async spin(): Promise<void> {
    return this._animations.spin();
  }

  async instantSpin(): Promise<void> {
    return this._animations.instantSpin();
  }

  async stop(): Promise<void> {
    const result = await this._animations.stop();

    this.resetToCleanState();

    return result;
  }

  private resetToCleanState(): void {
    this.y = 0;

    this._symbols.forEach((symbol, index) => {
      if (symbol && symbol.y !== undefined) {
        symbol.y = (index - 2) * this._symbolHeight;
      }
    });
  }

  async stopWithInitialSymbols(): Promise<void> {
    await this.stop();
  }

  forceStop(): void {
    this._animations.forceStop();
  }

  getSpinDuration(): number {
    const baseDuration = GAME_CONFIG.animations.spinDuration;
    const staggerDelay = GAME_CONFIG.animations.reelStopDelay * this._reelIndex;
    return baseDuration + staggerDelay;
  }

  highlightSymbolAt(row: number): void {
    const symbol = this.getSymbolAtRow(row);
    if (symbol) {
      symbol.highlight();
    }
  }

  clearHighlights(): void {
    this._symbols.forEach((symbol) => {
      if (symbol) {
        symbol.removeHighlight();
      }
    });
  }

  override destroy(): void {
    this.forceStop();
    this._symbols.forEach((symbol) => {
      this._symbolFactory.returnSymbol(symbol); // Return to pool instead of destroy
    });
    this._symbols = [];
    super.destroy();
  }
}
