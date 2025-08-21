import { gsap } from "gsap";
import * as PIXI from "pixi.js";
import { Symbol } from "../symbols/Symbol";
import { SymbolFactory } from "../symbols/SymbolFactory";
import { generateSymbol } from "../symbols/SymbolConfig";

/**
 * Handles reel animation with fast spinning and controlled symbol changes
 */
export class ReelAnimations {
  private _reelContainer: PIXI.Container;
  private _symbols: Symbol[];
  private _symbolFactory: SymbolFactory;
  private _symbolHeight: number;
  private _isSpinning: boolean = false;
  private _spinSpeed: number = 0;
  private _addChildCallback: (symbol: Symbol) => void;
  private _removeChildCallback: (symbol: Symbol) => void;
  private _symbolChangeActive: boolean = false;

  constructor(
    reelContainer: PIXI.Container,
    symbols: Symbol[],
    symbolFactory: SymbolFactory,
    symbolHeight: number,
    addChildCallback: (symbol: Symbol) => void,
    removeChildCallback: (symbol: Symbol) => void
  ) {
    this._reelContainer = reelContainer;
    this._symbols = symbols;
    this._symbolFactory = symbolFactory;
    this._symbolHeight = symbolHeight;
    this._addChildCallback = addChildCallback;
    this._removeChildCallback = removeChildCallback;
  }

  get isSpinning(): boolean {
    return this._isSpinning;
  }

  /**
   * Start spinning animation with fast speed
   */
  async spin(): Promise<void> {
    if (this._isSpinning) {
      return;
    }

    this._isSpinning = true;

    return new Promise<void>((resolve) => {
      // Accelerate to fast spinning speed
      gsap.to(this, {
        _spinSpeed: 30, // Very fast for realistic slot machine effect
        duration: 0.2,
        ease: "power2.out",
        onComplete: () => {
          // Start symbol changing after acceleration
          this._symbolChangeActive = true;
          this.startFastSpinLoop();

          // Stop symbol changing before animation ends (after 1 second)
          setTimeout(() => {
            this._symbolChangeActive = false;
          }, 1000);

          resolve();
        },
      });
    });
  }

  /**
   * Instant spin animation - very short duration for instant play mode
   */
  async instantSpin(): Promise<void> {
    if (this._isSpinning) {
      return;
    }

    this._isSpinning = true;

    return new Promise<void>((resolve) => {
      // Accelerate to fast spinning speed much quicker
      gsap.to(this, {
        _spinSpeed: 45, // Even faster for instant effect
        duration: 0.1,
        ease: "power2.out",
        onComplete: () => {
          // Start symbol changing after acceleration
          this._symbolChangeActive = true;
          this.startFastSpinLoop();

          // Stop symbol changing very quickly (after 150ms)
          setTimeout(() => {
            this._symbolChangeActive = false;
          }, 150);

          resolve();
        },
      });
    });
  }

  /**
   * Fast spinning loop with controlled symbol changes
   */
  private startFastSpinLoop(): void {
    let frameCounter = 0;

    const spinLoop = () => {
      if (!this._isSpinning) {
        return;
      }

      // Move reel down smoothly
      this._reelContainer.y += this._spinSpeed;

      // Change symbols only during the active period and at intervals
      if (this._symbolChangeActive) {
        frameCounter++;
        if (frameCounter >= 4) {
          // Change symbols every 4 frames
          this.shuffleRandomSymbols();
          frameCounter = 0;
        }
      }

      // Reset position for continuous movement
      if (this._reelContainer.y >= this._symbolHeight) {
        this._reelContainer.y = 0;
      }

      requestAnimationFrame(spinLoop);
    };

    spinLoop();
  }

  /**
   * Shuffle a few random symbols to create variety
   */
  private shuffleRandomSymbols(): void {
    // Only change 2-3 symbols at a time for subtle effect
    const symbolsToChange = Math.floor(Math.random() * 3) + 2; // 2-4 symbols

    for (let i = 0; i < symbolsToChange; i++) {
      const randomIndex = Math.floor(Math.random() * this._symbols.length);
      const currentSymbol = this._symbols[randomIndex];

      if (currentSymbol && !currentSymbol.destroyed) {
        const newSymbolType = generateSymbol();
        const newSymbol = this._symbolFactory.createSymbol(newSymbolType);

        // Copy position exactly
        newSymbol.x = currentSymbol.x;
        newSymbol.y = currentSymbol.y;

        // Replace the symbol
        this._removeChildCallback(currentSymbol);
        currentSymbol.destroy();
        this._addChildCallback(newSymbol);

        // Update array
        this._symbols[randomIndex] = newSymbol;
      }
    }
  }

  /**
   * Stop spinning and snap to proper symbol alignment
   */
  async stop(): Promise<void> {
    if (!this._isSpinning) {
      return;
    }

    // Stop symbol changing immediately when stopping
    this._symbolChangeActive = false;

    // Stop immediately
    this._isSpinning = false;
    this._spinSpeed = 0;

    // Snap to nearest symbol boundary for proper alignment
    this.snapToSymbolPosition();

    return Promise.resolve();
  }

  /**
   * Snap reel to proper symbol alignment
   */
  private snapToSymbolPosition(): void {
    // Calculate the remainder when dividing current position by symbol height
    const remainder = this._reelContainer.y % this._symbolHeight;

    // Snap to the nearest symbol boundary
    let targetY;
    if (remainder < this._symbolHeight / 2) {
      // Snap to the previous symbol boundary
      targetY = this._reelContainer.y - remainder;
    } else {
      // Snap to the next symbol boundary
      targetY = this._reelContainer.y + (this._symbolHeight - remainder);
    }

    // Apply the snap immediately (no animation)
    this._reelContainer.y = targetY;
  }

  /**
   * Force stop immediately
   */
  forceStop(): void {
    this._isSpinning = false;
    this._symbolChangeActive = false;
    this._spinSpeed = 0;
    gsap.killTweensOf(this);
    gsap.killTweensOf(this._reelContainer);
  }

  /**
   * Update symbols reference
   */
  updateSymbolsReference(symbols: Symbol[]): void {
    this._symbols = symbols;
  }
}
