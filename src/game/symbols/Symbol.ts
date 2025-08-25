import * as PIXI from "pixi.js";
import { SymbolType } from "../../types";
import type { SymbolConfig } from "../../types";

export class Symbol extends PIXI.Container {
  private _type: SymbolType;
  private _config: SymbolConfig;
  private _sprite: PIXI.Sprite;

  constructor(type: SymbolType, config: SymbolConfig, texture: PIXI.Texture) {
    super();

    this._type = type;
    this._config = config;

    this._sprite = new PIXI.Sprite(texture);
    this._sprite.anchor.set(0.5);

    // Scale 16x16 sprites to a smaller, more appropriate size
    const targetSize = 60;
    const sourceSize = 16;
    const scale = targetSize / sourceSize;
    this._sprite.scale.set(scale);

    this.addChild(this._sprite);
  }

  get type(): SymbolType {
    return this._type;
  }

  get config(): SymbolConfig {
    return this._config;
  }

  get sprite(): PIXI.Sprite {
    return this._sprite;
  }

  getPayoutMultiplier(symbolCount: number): number {
    return this._config.payoutMultipliers[symbolCount] || 0;
  }

  override setSize(width: number, height: number): void {
    this._sprite.width = width;
    this._sprite.height = height;
  }

  playLandingAnimation(): Promise<void> {
    return new Promise((resolve) => {
      // Simple bounce animation - will be enhanced with GSAP later
      const originalScale = this._sprite.scale.x;
      this._sprite.scale.set(originalScale * 1.2);

      // Simple lerp function since PIXI.utils.lerp doesn't exist in v8
      const lerp = (start: number, end: number, factor: number) => {
        return start + (end - start) * factor;
      };

      // Simple tween back to original scale
      const animate = () => {
        this._sprite.scale.x = lerp(this._sprite.scale.x, originalScale, 0.2);
        this._sprite.scale.y = lerp(this._sprite.scale.y, originalScale, 0.2);

        if (Math.abs(this._sprite.scale.x - originalScale) < 0.01) {
          this._sprite.scale.set(originalScale);
          resolve();
        } else {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    });
  }

  highlight(): void {
    this._sprite.tint = 0xffff00;
  }

  removeHighlight(): void {
    this._sprite.tint = 0xffffff;
  }

  override destroy(): void {
    this._sprite.destroy();
    super.destroy();
  }
}
