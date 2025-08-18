import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';

export interface TextDisplayOptions {
  fontSize?: number;
  fontColor?: number;
  fontFamily?: string;
  fontWeight?: string;
  backgroundColor?: number;
  backgroundAlpha?: number;
  padding?: number;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: number;
  width?: number;
  height?: number;
  align?: 'left' | 'center' | 'right';
}

export class TextDisplay extends PIXI.Container {
  private background: PIXI.Graphics;
  private textField: PIXI.Text;
  private options: Required<TextDisplayOptions>;
  private _value: string | number = '';

  constructor(initialValue: string | number = '', options: TextDisplayOptions = {}) {
    super();

    // Set default options
    this.options = {
      fontSize: 16,
      fontColor: 0xffffff,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'normal',
      backgroundColor: 0x2c3e50,
      backgroundAlpha: 0.8,
      padding: 8,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: 0x34495e,
      width: 120,
      height: 32,
      align: 'center',
      ...options,
    };

    this.background = new PIXI.Graphics();
    this.textField = new PIXI.Text({
      text: String(initialValue),
      style: {
        fontSize: this.options.fontSize,
        fill: this.options.fontColor,
        fontFamily: this.options.fontFamily,
        fontWeight: this.options.fontWeight as any,
        align: this.options.align,
      },
    });

    this.addChild(this.background);
    this.addChild(this.textField);

    this._value = initialValue;
    this.updateVisuals();
  }

  private updateVisuals(): void {
    this.background.clear();

    // Draw background
    if (this.options.borderRadius > 0) {
      this.background.roundRect(
        -this.options.width / 2,
        -this.options.height / 2,
        this.options.width,
        this.options.height,
        this.options.borderRadius
      );
    } else {
      this.background.rect(
        -this.options.width / 2,
        -this.options.height / 2,
        this.options.width,
        this.options.height
      );
    }

    this.background.fill({
      color: this.options.backgroundColor,
      alpha: this.options.backgroundAlpha,
    });

    // Draw border if specified
    if (this.options.borderWidth > 0) {
      this.background.stroke({
        color: this.options.borderColor,
        width: this.options.borderWidth,
      });
    }

    // Position text based on alignment
    this.textField.anchor.set(0.5);
    this.textField.x = 0;
    this.textField.y = 0;
  }

  // Public methods
  get value(): string | number {
    return this._value;
  }

  set value(newValue: string | number) {
    this._value = newValue;
    this.textField.text = String(newValue);
  }

  setText(text: string | number): void {
    this.value = text;
  }

  // Animated value update (useful for counters)
  animateToValue(targetValue: number, duration: number = 1): Promise<void> {
    return new Promise((resolve) => {
      const startValue = typeof this._value === 'number' ? this._value : 0;
      
      gsap.to({ value: startValue }, {
        value: targetValue,
        duration,
        ease: 'power2.out',
        onUpdate: (tween) => {
          const currentValue = Math.round(tween.targets()[0].value);
          this.value = currentValue;
        },
        onComplete: () => {
          this.value = targetValue;
          resolve();
        },
      });
    });
  }

  // Format number with commas (for currency/scores)
  setFormattedNumber(value: number, prefix: string = '', suffix: string = ''): void {
    const formatted = value.toLocaleString();
    this.value = `${prefix}${formatted}${suffix}`;
  }

  // Set currency format
  setCurrency(value: number, symbol: string = '$'): void {
    this.setFormattedNumber(value, symbol);
  }

  // Animate currency change
  animateCurrency(targetValue: number, symbol: string = '$', duration: number = 1): Promise<void> {
    return new Promise((resolve) => {
      const startValue = typeof this._value === 'string' 
        ? parseFloat(this._value.replace(/[^0-9.-]+/g, '')) || 0
        : (typeof this._value === 'number' ? this._value : 0);
      
      gsap.to({ value: startValue }, {
        value: targetValue,
        duration,
        ease: 'power2.out',
        onUpdate: (tween) => {
          const currentValue = Math.round(tween.targets()[0].value);
          this.setCurrency(currentValue, symbol);
        },
        onComplete: () => {
          this.setCurrency(targetValue, symbol);
          resolve();
        },
      });
    });
  }

  // Flash effect for highlighting changes
  flash(color: number = 0xffff00, duration: number = 0.5): void {
    const originalColor = this.options.fontColor;
    
    // Change to flash color
    this.textField.style.fill = color;
    
    // Animate back to original color
    gsap.to(this.textField.style, {
      fill: originalColor,
      duration,
      ease: 'power2.out',
    });
  }

  // Pulse effect for attention
  pulse(scale: number = 1.2, duration: number = 0.3): void {
    gsap.to(this.scale, {
      x: scale,
      y: scale,
      duration: duration / 2,
      ease: 'power2.out',
      yoyo: true,
      repeat: 1,
    });
  }

  override setSize(width: number, height: number): void {
    this.options.width = width;
    this.options.height = height;
    this.updateVisuals();
  }

  setColors(fontColor?: number, backgroundColor?: number, borderColor?: number): void {
    if (fontColor !== undefined) {
      this.options.fontColor = fontColor;
      this.textField.style.fill = fontColor;
    }
    if (backgroundColor !== undefined) {
      this.options.backgroundColor = backgroundColor;
    }
    if (borderColor !== undefined) {
      this.options.borderColor = borderColor;
    }
    this.updateVisuals();
  }

  // Cleanup
  override destroy(): void {
    gsap.killTweensOf(this.scale);
    gsap.killTweensOf(this.textField.style);
    super.destroy();
  }
}