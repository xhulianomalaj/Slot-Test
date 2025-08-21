import * as PIXI from "pixi.js";
import { gsap } from "gsap";

export interface ToggleButtonOptions {
  width?: number;
  height?: number;
  onColor?: number;
  offColor?: number;
  onHoverColor?: number;
  offHoverColor?: number;
  disabledColor?: number;
  textColor?: number;
  fontSize?: number;
  onText?: string;
  offText?: string;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: number;
  defaultState?: boolean;
}

export class ToggleButton extends PIXI.Container {
  private background: PIXI.Graphics;
  private textLabel: PIXI.Text;
  private options: Required<ToggleButtonOptions>;
  private _enabled: boolean = true;
  private _isHovered: boolean = false;
  private _isPressed: boolean = false;
  private _isToggled: boolean = false;
  private clickCallback?: (isToggled: boolean) => void;

  constructor(options: ToggleButtonOptions = {}) {
    super();

    // Set default options
    this.options = {
      width: 100,
      height: 35,
      onColor: 0x27ae60,
      offColor: 0x7f8c8d,
      onHoverColor: 0x229954,
      offHoverColor: 0x95a5a6,
      disabledColor: 0x999999,
      textColor: 0xffffff,
      fontSize: 14,
      onText: "ON",
      offText: "OFF",
      borderRadius: 8,
      borderWidth: 0,
      borderColor: 0x000000,
      defaultState: false,
      ...options,
    };

    this._isToggled = this.options.defaultState;

    this.background = new PIXI.Graphics();
    this.textLabel = new PIXI.Text({
      text: this._isToggled ? this.options.onText : this.options.offText,
      style: {
        fontSize: this.options.fontSize,
        fill: this.options.textColor,
        fontFamily: "Arial, sans-serif",
        fontWeight: "bold",
      },
    });

    this.addChild(this.background);
    this.addChild(this.textLabel);

    this.setupInteractivity();
    this.updateVisuals();
  }

  private setupInteractivity(): void {
    this.eventMode = "static";
    this.cursor = "pointer";

    this.on("pointerdown", this.onPointerDown.bind(this));
    this.on("pointerup", this.onPointerUp.bind(this));
    this.on("pointerupoutside", this.onPointerUpOutside.bind(this));
    this.on("pointerover", this.onPointerOver.bind(this));
    this.on("pointerout", this.onPointerOut.bind(this));
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
      ease: "power2.out",
    });
  }

  private onPointerUp(): void {
    if (!this._enabled) return;

    if (this._isPressed) {
      this._isPressed = false;

      // Toggle the state
      this._isToggled = !this._isToggled;
      this.updateVisuals();

      // Scale back up animation
      gsap.to(this.scale, {
        x: 1,
        y: 1,
        duration: 0.1,
        ease: "power2.out",
      });

      // Trigger click callback with new state
      if (this.clickCallback) {
        this.clickCallback(this._isToggled);
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
      ease: "power2.out",
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
      ease: "power2.out",
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
      ease: "power2.out",
    });
  }

  private updateVisuals(): void {
    this.background.clear();

    let backgroundColor: number;

    if (!this._enabled) {
      backgroundColor = this.options.disabledColor;
    } else if (this._isPressed) {
      backgroundColor = this._isToggled
        ? this.options.onHoverColor
        : this.options.offHoverColor;
    } else if (this._isHovered) {
      backgroundColor = this._isToggled
        ? this.options.onHoverColor
        : this.options.offHoverColor;
    } else {
      backgroundColor = this._isToggled
        ? this.options.onColor
        : this.options.offColor;
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

    // Update text based on toggle state
    this.textLabel.text = this._isToggled
      ? this.options.onText
      : this.options.offText;

    // Center the label
    this.textLabel.anchor.set(0.5);
    this.textLabel.x = 0;
    this.textLabel.y = 0;

    // Update cursor
    this.cursor = this._enabled ? "pointer" : "default";
  }

  // Public methods
  get enabled(): boolean {
    return this._enabled;
  }

  set enabled(value: boolean) {
    this._enabled = value;
    this.updateVisuals();
  }

  get isToggled(): boolean {
    return this._isToggled;
  }

  set isToggled(value: boolean) {
    if (this._isToggled !== value) {
      this._isToggled = value;
      this.updateVisuals();

      // Trigger callback if someone programmatically changes the state
      if (this.clickCallback) {
        this.clickCallback(this._isToggled);
      }
    }
  }

  get text(): string {
    return this.textLabel.text;
  }

  onClick(callback: (isToggled: boolean) => void): void {
    this.clickCallback = callback;
  }

  override setSize(width: number, height: number): void {
    this.options.width = width;
    this.options.height = height;
    this.updateVisuals();
  }

  setColors(
    onColor?: number,
    offColor?: number,
    onHoverColor?: number,
    offHoverColor?: number,
    disabledColor?: number
  ): void {
    if (onColor !== undefined) this.options.onColor = onColor;
    if (offColor !== undefined) this.options.offColor = offColor;
    if (onHoverColor !== undefined) this.options.onHoverColor = onHoverColor;
    if (offHoverColor !== undefined) this.options.offHoverColor = offHoverColor;
    if (disabledColor !== undefined) this.options.disabledColor = disabledColor;
    this.updateVisuals();
  }

  setTexts(onText: string, offText: string): void {
    this.options.onText = onText;
    this.options.offText = offText;
    this.updateVisuals();
  }

  // Method to toggle programmatically
  toggle(): void {
    this.isToggled = !this._isToggled;
  }

  // Cleanup
  override destroy(): void {
    this.removeAllListeners();
    gsap.killTweensOf(this.scale);
    super.destroy();
  }
}
