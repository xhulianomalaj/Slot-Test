import { gsap } from "gsap";
import { Symbol } from "../symbols/Symbol";
import { SymbolFactory } from "../symbols/SymbolFactory";
import { generateSymbol } from "../symbols/SymbolConfig";
import { GAME_CONFIG } from "../config/GameConfig";

/**
 * Handles all animation aspects of a single reel
 * Including spinning, stopping, and landing animations
 */
export class ReelAnimations {
  private _symbols: Symbol[];
  private _symbolFactory: SymbolFactory;
  private _symbolHeight: number;
  private _visibleSymbols: number = 3;
  private _isSpinning: boolean = false;
  private _spinSpeed: number = 0;
  private _spinTween: gsap.core.Tween | null = null;
  private _addChildCallback: (symbol: Symbol) => void;
  private _removeChildCallback: (symbol: Symbol) => void;

  constructor(
    symbols: Symbol[],
    symbolFactory: SymbolFactory,
    addChildCallback: (symbol: Symbol) => void,
    removeChildCallback: (symbol: Symbol) => void
  ) {
    this._symbols = symbols;
    this._symbolFactory = symbolFactory;
    this._symbolHeight = GAME_CONFIG.reels.symbolHeight;
    this._addChildCallback = addChildCallback;
    this._removeChildCallback = removeChildCallback;
  }

  get isSpinning(): boolean {
    return this._isSpinning;
  }

  /**
   * Start spinning animation
   */
  async spin(): Promise<void> {
    if (this._isSpinning) {
      return;
    }

    this._isSpinning = true;
    this._spinSpeed = 0;

    // Create spinning animation using GSAP
    return new Promise<void>((resolve) => {
      // Accelerate to full speed
      gsap.to(this, {
        _spinSpeed: 25, // pixels per frame
        duration: 0.5,
        ease: "power2.out",
        onComplete: () => {
          // Continue spinning at constant speed
          this.startConstantSpin();
          resolve();
        },
      });
    });
  }

  /**
   * Start constant spinning motion
   */
  private startConstantSpin(): void {
    const spinLoop = () => {
      if (!this._isSpinning) {
        return;
      }

      // Move all symbols down (with null check)
      this._symbols.forEach((symbol) => {
        if (symbol && symbol.y !== undefined && !symbol.destroyed) {
          symbol.y += this._spinSpeed;
        }
      });

      // Check if we need to cycle symbols
      const bottomSymbol = this._symbols[this._symbols.length - 1];
      if (
        bottomSymbol &&
        !bottomSymbol.destroyed &&
        bottomSymbol.y > (this._visibleSymbols + 2) * this._symbolHeight
      ) {
        this.cycleSymbols();
      }

      // Continue the loop
      requestAnimationFrame(spinLoop);
    };

    spinLoop();
  }

  /**
   * Move all symbols down by one position and add new symbol at top
   */
  private cycleSymbols(): void {
    // Move all symbols down (with null check)
    this._symbols.forEach((symbol) => {
      if (symbol && symbol.y !== undefined) {
        symbol.y += this._symbolHeight;
      }
    });

    // Remove the bottom symbol that's now out of view
    const bottomSymbol = this._symbols.pop();
    if (bottomSymbol) {
      this._removeChildCallback(bottomSymbol);
      bottomSymbol.destroy();
    }

    // Add new symbol at the top
    const newSymbolType = generateSymbol();
    const newSymbol = this._symbolFactory.createSymbol(newSymbolType);
    newSymbol.x = 0;
    newSymbol.y = -2 * this._symbolHeight; // Position above visible area

    this._symbols.unshift(newSymbol);
    this._addChildCallback(newSymbol);
  }

  /**
   * Stop spinning naturally
   */
  async stop(): Promise<void> {
    if (!this._isSpinning) {
      return;
    }

    return new Promise<void>((resolve) => {
      // Immediately stop the spinning motion and reset to correct positions
      this._spinSpeed = 0;
      this.resetPosition();

      // Play landing animations for visible symbols
      this.playLandingAnimations().then(() => {
        this._isSpinning = false;
        resolve();
      });
    });
  }

  /**
   * Reset reel to initial position after spinning
   */
  private resetPosition(): void {
    this._symbols.forEach((symbol, index) => {
      if (symbol && symbol.y !== undefined) {
        symbol.y = (index - 2) * this._symbolHeight;
      }
    });
  }

  /**
   * Play landing animations for all visible symbols
   */
  private async playLandingAnimations(): Promise<void> {
    const visibleSymbols = this.getVisibleSymbols();
    const animationPromises = visibleSymbols.map((symbol, index) => {
      // Stagger the landing animations slightly
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          symbol.playLandingAnimation().then(resolve);
        }, index * 100); 
      });
    });

    await Promise.all(animationPromises);
  }

  /**
   * Get the currently visible symbols (3 symbols in the middle)
   */
  private getVisibleSymbols(): Symbol[] {
    const startIndex = 1; // Skip the 1 buffer symbol at the top (visible symbols are at indices 1, 2, 3)
    return this._symbols
      .slice(startIndex, startIndex + this._visibleSymbols)
      .filter((symbol) => symbol !== null && symbol !== undefined);
  }

  /**
   * Force stop spinning immediately (emergency stop)
   */
  forceStop(): void {
    if (this._spinTween) {
      this._spinTween.kill();
      this._spinTween = null;
    }

    this._isSpinning = false;
    this._spinSpeed = 0;
    this.resetPosition();
  }

  /**
   * Update the symbols array reference (called when symbols are modified externally)
   */
  updateSymbolsReference(symbols: Symbol[]): void {
    this._symbols = symbols;
  }
}