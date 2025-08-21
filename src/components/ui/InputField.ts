import * as PIXI from "pixi.js";

interface InputFieldOptions {
  width?: number;
  height?: number;
  fontSize?: number;
  fontColor?: number;
  backgroundColor?: number;
  borderColor?: number;
  borderWidth?: number;
}

export class InputField extends PIXI.Container {
  private background: PIXI.Graphics;
  private textField: PIXI.Text;
  private _value: string = "";
  private _isActive: boolean = false;
  private onChangeCallback?: (value: string) => void;
  private onEnterCallback?: (value: string) => void;
  private _width: number;
  private _height: number;
  private _backgroundColor: number;
  private _borderColor: number;

  constructor(initialValue: string = "", options: InputFieldOptions = {}) {
    super();

    const {
      width = 80,
      height = 30,
      fontSize = 14,
      fontColor = 0xffffff,
      backgroundColor = 0x34495e,
      borderColor = 0x7f8c8d,
      borderWidth = 1,
    } = options;

    // Store dimensions and colors for later use
    this._width = width;
    this._height = height;
    this._backgroundColor = backgroundColor;
    this._borderColor = borderColor;

    // Create background
    this.background = new PIXI.Graphics();
    this.background.rect(0, 0, width, height);
    this.background.fill(backgroundColor);
    this.background.stroke({ color: borderColor, width: borderWidth });
    this.addChild(this.background);

    // Create text field
    this.textField = new PIXI.Text({
      text: initialValue,
      style: {
        fontSize,
        fill: fontColor,
        fontFamily: "Arial",
      },
    });

    this.textField.anchor.set(0.5, 0.5);
    this.textField.x = width / 2;
    this.textField.y = height / 2;
    this.addChild(this.textField);

    this._value = initialValue;

    // Make interactive
    this.eventMode = "static";
    this.cursor = "pointer";

    // Setup event handlers
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Click to focus
    this.on("pointerdown", () => {
      this.focus();
    });

    // Handle keyboard input when focused
    if (globalThis.document) {
      globalThis.document.addEventListener("keydown", (event) => {
        if (!this._isActive) return;

        if (event.key === "Enter") {
          this.blur();
          this.onEnterCallback?.(this._value);
        } else if (event.key === "Escape") {
          this.blur();
        } else if (event.key === "Backspace") {
          this._value = this._value.slice(0, -1);
          this.updateDisplay();
          this.onChangeCallback?.(this._value);
        } else if (event.key.match(/[0-9]/)) {
          // Only allow numbers and limit to 11 characters
          if (this._value.length < 10) {
            this._value += event.key;
            this.updateDisplay();
            this.onChangeCallback?.(this._value);
          }
        }
      });

      // Blur when clicking outside
      globalThis.document.addEventListener("click", (event) => {
        if (this._isActive) {
          const bounds = this.getBounds();
          if (
            event.clientX < bounds.x ||
            event.clientX > bounds.x + bounds.width ||
            event.clientY < bounds.y ||
            event.clientY > bounds.y + bounds.height
          ) {
            this.blur();
          }
        }
      });
    }
  }

  private focus(): void {
    this._isActive = true;
    this.background.clear();
    this.background.rect(0, 0, this._width, this._height);
    this.background.fill(0x2c3e50); // Darker when active
    this.background.stroke({ color: 0x3498db, width: 2 }); // Blue border when active
  }

  private blur(): void {
    this._isActive = false;
    this.background.clear();
    this.background.rect(0, 0, this._width, this._height);
    this.background.fill(this._backgroundColor); // Original color
    this.background.stroke({ color: this._borderColor, width: 1 }); // Original border
  }

  private updateDisplay(): void {
    this.textField.text = this._value;
  }

  // Public methods
  get value(): string {
    return this._value;
  }

  set value(newValue: string) {
    this._value = newValue;
    this.updateDisplay();
  }

  onChange(callback: (value: string) => void): void {
    this.onChangeCallback = callback;
  }

  onEnter(callback: (value: string) => void): void {
    this.onEnterCallback = callback;
  }

  get isActive(): boolean {
    return this._isActive;
  }
}
