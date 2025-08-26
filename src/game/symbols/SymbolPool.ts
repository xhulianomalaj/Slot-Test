import { SymbolType } from "../../types";
import { Symbol } from "./Symbol";
import { SymbolFactory } from "./SymbolFactory";

export class SymbolPool {
  private pools: Map<SymbolType, Symbol[]> = new Map();
  private symbolFactory: SymbolFactory;
  private maxPoolSize: number = 15; // Maximum symbols per type in pool
  private initialPoolSize: number = 8; // Initial symbols to pre-create

  constructor(symbolFactory: SymbolFactory) {
    this.symbolFactory = symbolFactory;
    this.initializePools();
  }

  private initializePools(): void {
    // Initialize pools for each symbol type
    Object.values(SymbolType).forEach((type) => {
      this.pools.set(type, []);

      // Pre-populate with initial symbols
      for (let i = 0; i < this.initialPoolSize; i++) {
        try {
          const symbol = this.symbolFactory.createSymbolDirect(type);
          symbol.visible = false; // Hidden until needed
          this.pools.get(type)!.push(symbol);
        } catch (error) {
          break; // Stop pre-creating if factory isn't ready
        }
      }
    });
  }

  /**
   * Get a symbol from the pool or create a new one if pool is empty
   */
  getSymbol(type: SymbolType): Symbol {
    const pool = this.pools.get(type);
    if (!pool) {
      // Fallback: create new symbol if pool doesn't exist
      return this.symbolFactory.createSymbolDirect(type);
    }

    if (pool.length > 0) {
      const symbol = pool.pop()!;
      symbol.visible = true;
      symbol.reset(); // Reset to clean state
      return symbol;
    }

    // Create new symbol if pool is empty
    return this.symbolFactory.createSymbolDirect(type);
  }

  /**
   * Return a symbol to the pool for reuse
   */
  returnSymbol(symbol: Symbol): void {
    if (!symbol || symbol.destroyed) {
      return;
    }

    const pool = this.pools.get(symbol.type);
    if (!pool) {
      // No pool exists, just destroy the symbol
      symbol.destroy();
      return;
    }

    // Reset symbol state before returning to pool
    symbol.visible = false;
    symbol.reset();

    // Only return to pool if we haven't reached max capacity
    if (pool.length < this.maxPoolSize) {
      pool.push(symbol);
    } else {
      // Pool is full, destroy the symbol
      symbol.destroy();
    }
  }

  /**
   * Clean up all pools and destroy remaining symbols
   */
  destroy(): void {
    this.pools.forEach((pool) => {
      pool.forEach((symbol) => {
        if (!symbol.destroyed) {
          symbol.destroy();
        }
      });
      pool.length = 0;
    });
    this.pools.clear();
  }

  /**
   * Check if pools are ready to be used
   */
  isReady(): boolean {
    return this.symbolFactory.isReady() && this.pools.size > 0;
  }
}
