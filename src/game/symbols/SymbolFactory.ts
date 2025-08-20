import * as PIXI from 'pixi.js';
import { Symbol } from './Symbol';
import { SYMBOL_CONFIGS, getSymbolConfig } from './SymbolConfig';
import { SymbolType } from '../../types';

export class SymbolFactory {
  private textures: Map<SymbolType, PIXI.Texture> = new Map();
  private isInitialized: boolean = false;

  constructor() {}

  /**
   * Initialize the symbol factory by loading individual PNG files
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Load all individual PNG textures
      const loadPromises = SYMBOL_CONFIGS.map(async (config) => {
        const texture = await PIXI.Assets.load(config.imagePath);
        this.textures.set(config.type, texture);
      });

      await Promise.all(loadPromises);
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize SymbolFactory:', error);
      throw error;
    }
  }

  /**
   * Create a new symbol instance
   */
  createSymbol(type: SymbolType): Symbol {
    if (!this.isInitialized) {
      throw new Error('SymbolFactory must be initialized before creating symbols');
    }

    const config = getSymbolConfig(type);
    const texture = this.textures.get(type);
    
    if (!texture) {
      throw new Error(`Texture not found for symbol type: ${type}`);
    }
    
    return new Symbol(type, config, texture);
  }

  /**
   * Create multiple symbols of the same type
   */
  createSymbols(type: SymbolType, count: number): Symbol[] {
    const symbols: Symbol[] = [];
    for (let i = 0; i < count; i++) {
      symbols.push(this.createSymbol(type));
    }
    return symbols;
  }

  /**
   * Get texture for a specific symbol type
   */
  getTexture(type: SymbolType): PIXI.Texture {
    const texture = this.textures.get(type);
    if (!texture) {
      throw new Error(`Texture not found for symbol type: ${type}`);
    }
    return texture;
  }

  /**
   * Check if the factory is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get all available symbol types
   */
  getAvailableTypes(): SymbolType[] {
    return Array.from(this.textures.keys());
  }
}
