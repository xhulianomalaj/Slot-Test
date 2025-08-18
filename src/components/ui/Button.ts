import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';

export interface ButtonOptions {
  width?: number;
  height?: number;
  backgroundColor?: number;
  hoverColor?: number;
  disabledColor?: number;
  textColor?: number;
  fontSize?: number;
  text?: string;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: number;
}

export class Button extends PIXI.Container {
  private background: PIXI.Graphics;
  private textLabel: PIXI.Text;
  private options: Required<ButtonOptions>;
  private _enabled: boolean = true;
  private _isHovered: boolean = false;
  private _isPressed: boolean = false;
  private clickCallback?: () => void;

  constructor(options: ButtonOptions = {}) {
    super();

    // Set default options
    this.options = {
      width: 120,
      height: 40,
      backgroundColor: 0x4a90e2,
      hoverColor: 0x357abd,
      disabledColor: 0x999999,
      textColor: 0xffffff,
      fontSize: 16,
      text: 'Button',
      borderRadius: 8,
      borderWidth: 0,
      borderColor: 0x000000,
      ...options,
    };

    this.background = new PIXI.Graphics();
    this.textLabel = new PIXI.Text({
      text: this.options.text,
      style: {
        fontSize: this.options.fontSize,
        fill: this.options.textColor,
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold',
      },
    });

    this.addChild(this.background);
    this.addChild(this.textLabel);

    this.setupInteractivity();
    this.updateVisuals();
  }

  private setupInteractivity(): void {
    this.eventMode = 'static';
    this.cursor = 'pointer';

    this.on('pointerdown', this.onPointerDown.bind(this));
    this.on('pointerup', this.onPointerUp.bind(this));
    this.on('pointerupoutside', this.onPointerUpOutside.bind(this));
    this.on('pointerover', this.onPointerOver.bind(this));
    this.on('pointerout', this.onPointerOut.bind(this));
  }

  private onPointerDown(): void {
    if (!this._enabled) return;
    
    this._isPressed = true;
    this.updateVisuals();
    
    // Scale down animation
    gsap.to(this.scale, {
      x: 0.95,
      y: 0.95,
      duration: 0.1,
      ease: 'power2.out',
    });
  }

  private onPointerUp(): void {
    if (!this._enabled) return;
    
    if (this._isPressed) {
      this._isPressed = false;
      this.updateVisuals();
      
      // Scale back up animation
      gsap.to(this.scale, {
        x: 1,
        y: 1,
        duration: 0.1,
        ease: 'power2.out',
      });
      
      // Trigger click callback
      if (this.clickCallback) {
        this.clickCallback();
      }
    }
  }

  private onPointerUpOutside(): void {
    if (!this._enabled) return;
    
    this._isPressed = false;
    this.updateVisuals();
    
    // Scale back up animation
    gsap.to(this.scale, {
      x: 1,
      y: 1,
      duration: 0.1,
      ease: 'power2.out',
    });
  }

  private onPointerOver(): void {
    if (!this._enabled) return;
    
    this._isHovered = true;
    this.updateVisuals();
    
    // Hover animation
    gsap.to(this.scale, {
      x: 1.05,
      y: 1.05,
      duration: 0.2,
      ease: 'power2.out',
    });
  }

  private onPointerOut(): void {
    if (!this._enabled) return;
    
    this._isHovered = false;
    this.updateVisuals();
    
    // Return to normal scale
    gsap.to(this.scale, {
      x: 1,
      y: 1,
      duration: 0.2,
      ease: 'power2.out',
    });
  }

  private updateVisuals(): void {
    this.background.clear();

    let backgroundColor = this.options.backgroundColor;
    
    if (!this._enabled) {
      backgroundColor = this.options.disabledColor;
    } else if (this._isPressed) {
      backgroundColor = this.options.hoverColor;
    } else if (this._isHovered) {
      backgroundColor = this.options.hoverColor;
    }

    // Draw background with rounded corners
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

    this.background.fill({ color: backgroundColor });

    // Draw border if specified
    if (this.options.borderWidth > 0) {
      this.background.stroke({
        color: this.options.borderColor,
        width: this.options.borderWidth,
      });
    }

    // Center the label
    this.textLabel.anchor.set(0.5);
    this.textLabel.x = 0;
    this.textLabel.y = 0;

    // Update cursor
    this.cursor = this._enabled ? 'pointer' : 'default';
  }

  // Public methods
  get enabled(): boolean {
    return this._enabled;
  }

  set enabled(value: boolean) {
    this._enabled = value;
    this.updateVisuals();
  }

  get text(): string {
    return this.textLabel.text;
  }

  set text(value: string) {
    this.textLabel.text = value;
    this.options.text = value;
  }

  onClick(callback: () => void): void {
    this.clickCallback = callback;
  }

  override setSize(width: number, height: number): void {
    this.options.width = width;
    this.options.height = height;
    this.updateVisuals();
  }

  setColors(backgroundColor?: number, hoverColor?: number, disabledColor?: number): void {
    if (backgroundColor !== undefined) this.options.backgroundColor = backgroundColor;
    if (hoverColor !== undefined) this.options.hoverColor = hoverColor;
    if (disabledColor !== undefined) this.options.disabledColor = disabledColor;
    this.updateVisuals();
  }

  // Cleanup
  override destroy(): void {
    this.removeAllListeners();
    gsap.killTweensOf(this.scale);
    super.destroy();
  }
}