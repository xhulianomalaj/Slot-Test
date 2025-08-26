import { gsap } from "gsap";
import * as PIXI from "pixi.js";
import { Symbol } from "../symbols/Symbol";
import { SymbolFactory } from "../symbols/SymbolFactory";
import { generateSymbol } from "../symbols/SymbolConfig";

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

  async spin(): Promise<void> {
    if (this._isSpinning) {
      return;
    }

    this._isSpinning = true;

    return new Promise<void>((resolve) => {
      // Accelerate to fast spinning speed
      gsap.to(this, {
        _spinSpeed: 30,
        duration: 0.2,
        ease: "power2.out",
        onComplete: () => {
          this._symbolChangeActive = true;
          this.startFastSpinLoop();

          setTimeout(() => {
            this._symbolChangeActive = false;
          }, 1000);

          resolve();
        },
      });
    });
  }

  async instantSpin(): Promise<void> {
    if (this._isSpinning) {
      return;
    }

    this._isSpinning = true;

    return new Promise<void>((resolve) => {
      // Accelerate to fast spinning speed much quicker
      gsap.to(this, {
        _spinSpeed: 45,
        duration: 0.1,
        ease: "power2.out",
        onComplete: () => {
          this._symbolChangeActive = true;
          this.startFastSpinLoop();

          setTimeout(() => {
            this._symbolChangeActive = false;
          }, 150);

          resolve();
        },
      });
    });
  }

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

      if (this._reelContainer.y >= this._symbolHeight) {
        this._reelContainer.y = 0;
      }

      requestAnimationFrame(spinLoop);
    };

    spinLoop();
  }

  private shuffleRandomSymbols(): void {
    const symbolsToChange = Math.floor(Math.random() * 3) + 2;

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
        this._symbolFactory.returnSymbol(currentSymbol); // Return to pool instead of destroy
        this._addChildCallback(newSymbol);

        this._symbols[randomIndex] = newSymbol;
      }
    }
  }

  async stop(): Promise<void> {
    if (!this._isSpinning) {
      return;
    }

    this._symbolChangeActive = false;

    this._isSpinning = false;
    this._spinSpeed = 0;

    // Snap to nearest symbol boundary for proper alignment
    this.snapToSymbolPosition();

    return Promise.resolve();
  }

  private snapToSymbolPosition(): void {
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

    this._reelContainer.y = targetY;
  }

  forceStop(): void {
    this._isSpinning = false;
    this._symbolChangeActive = false;
    this._spinSpeed = 0;
    gsap.killTweensOf(this);
    gsap.killTweensOf(this._reelContainer);
  }

  updateSymbolsReference(symbols: Symbol[]): void {
    this._symbols = symbols;
  }
}
