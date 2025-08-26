import * as PIXI from "pixi.js";
import { Symbol } from "./Symbol";
import { SYMBOL_CONFIGS, getSymbolConfig } from "./SymbolConfig";
import { SymbolType } from "../../types";
import { SymbolPool } from "./SymbolPool";

export class SymbolFactory {
  private textures: Map<SymbolType, PIXI.Texture> = new Map();
  private isInitialized: boolean = false;
  private symbolPool: SymbolPool | null = null;
  private usePooling: boolean = true;

  constructor() {}

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      const loadPromises = SYMBOL_CONFIGS.map(async (config) => {
        const texture = await PIXI.Assets.load(config.imagePath);
        this.textures.set(config.type, texture);
      });

      await Promise.all(loadPromises);
      this.isInitialized = true;

      // Initialize symbol pool after textures are loaded
      if (this.usePooling) {
        this.symbolPool = new SymbolPool(this);
      }
    } catch (error) {
      console.error("Failed to initialize SymbolFactory:", error);
      throw error;
    }
  }

  createSymbol(type: SymbolType): Symbol {
    if (!this.isInitialized) {
      throw new Error(
        "SymbolFactory must be initialized before creating symbols"
      );
    }

    // Use pooling if available and enabled
    if (this.usePooling && this.symbolPool && this.symbolPool.isReady()) {
      return this.symbolPool.getSymbol(type);
    }

    // Fallback to direct creation
    return this.createSymbolDirect(type);
  }

  /**
   * Create symbol directly without using pool (for internal pool population)
   */
  createSymbolDirect(type: SymbolType): Symbol {
    if (!this.isInitialized) {
      throw new Error(
        "SymbolFactory must be initialized before creating symbols"
      );
    }

    const config = getSymbolConfig(type);
    const texture = this.textures.get(type);

    if (!texture) {
      throw new Error(`Texture not found for symbol type: ${type}`);
    }

    return new Symbol(type, config, texture);
  }

  /**
   * Return symbol to pool (if pooling is enabled)
   */
  returnSymbol(symbol: Symbol): void {
    if (this.usePooling && this.symbolPool) {
      this.symbolPool.returnSymbol(symbol);
    } else {
      // No pooling, just destroy
      symbol.destroy();
    }
  }

  createSymbols(type: SymbolType, count: number): Symbol[] {
    const symbols: Symbol[] = [];
    for (let i = 0; i < count; i++) {
      symbols.push(this.createSymbol(type));
    }
    return symbols;
  }

  getTexture(type: SymbolType): PIXI.Texture {
    const texture = this.textures.get(type);
    if (!texture) {
      throw new Error(`Texture not found for symbol type: ${type}`);
    }
    return texture;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  getAvailableTypes(): SymbolType[] {
    return Array.from(this.textures.keys());
  }

  /**
   * Enable or disable object pooling
   */
  setPoolingEnabled(enabled: boolean): void {
    this.usePooling = enabled;

    if (!enabled && this.symbolPool) {
      // Destroy pool if disabling
      this.symbolPool.destroy();
      this.symbolPool = null;
    } else if (enabled && !this.symbolPool && this.isInitialized) {
      // Create pool if enabling and factory is ready
      this.symbolPool = new SymbolPool(this);
    }
  }

  /**
   * Destroy factory and clean up resources
   */
  destroy(): void {
    if (this.symbolPool) {
      this.symbolPool.destroy();
      this.symbolPool = null;
    }

    this.textures.clear();
    this.isInitialized = false;
  }
}
