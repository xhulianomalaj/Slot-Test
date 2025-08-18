import * as PIXI from "pixi.js";
import { GAME_CONFIG, LAYOUT } from "../config/GameConfig";

/**
 * Handles all visual rendering aspects of the slot machine
 * Including frame, separators, layout, and masking
 */
export class SlotMachineRenderer {
  private _reelCount: number;
  private _rowCount: number;
  private _frame: PIXI.Graphics;
  private _reelSeparators: PIXI.Graphics;

  constructor(reelCount: number, rowCount: number) {
    this._reelCount = reelCount;
    this._rowCount = rowCount;
    this._frame = new PIXI.Graphics();
    this._reelSeparators = new PIXI.Graphics();
  }

  /**
   * Create the visual frame and walls of the slot machine
   */
  createSlotMachineFrame(): PIXI.Graphics {
    const symbolWidth = GAME_CONFIG.reels.symbolWidth;
    const symbolHeight = GAME_CONFIG.reels.symbolHeight;
    const reelSpacing = LAYOUT.REEL_SPACING;
    const totalWidth =
      symbolWidth * this._reelCount + reelSpacing * (this._reelCount - 1);
    const totalHeight = symbolHeight * this._rowCount;

    // Frame thickness and colors
    const frameThickness = 8;
    const frameColor = 0x2c3e50; // Dark blue-gray
    const innerFrameColor = 0x34495e; // Slightly lighter

    // Create outer frame
    this._frame.clear();

    // Outer frame background (darker)
    this._frame.rect(
      -totalWidth / 2 - frameThickness,
      -totalHeight / 2 - frameThickness,
      totalWidth + frameThickness * 2,
      totalHeight + frameThickness * 2
    );
    this._frame.fill({ color: frameColor });

    // Inner frame (slightly lighter)
    this._frame.rect(
      -totalWidth / 2 - frameThickness / 2,
      -totalHeight / 2 - frameThickness / 2,
      totalWidth + frameThickness,
      totalHeight + frameThickness
    );
    this._frame.fill({ color: innerFrameColor });

    // Create the window (semi-transparent grey background where symbols show)
    this._frame.rect(
      -totalWidth / 2,
      -totalHeight / 2,
      totalWidth,
      totalHeight
    );
    this._frame.fill({ color: 0x808080, alpha: 0.5 }); // Solid grey background (transparency handled by frame alpha)

    // Set alpha on the entire frame for transparency
    this._frame.alpha = 0.5;

    return this._frame;
  }

  /**
   * Create vertical separators between reels
   */
  createReelSeparators(): PIXI.Graphics {
    const symbolWidth = GAME_CONFIG.reels.symbolWidth;
    const symbolHeight = GAME_CONFIG.reels.symbolHeight;
    const reelSpacing = LAYOUT.REEL_SPACING;
    const totalHeight = symbolHeight * this._rowCount;
    const separatorWidth = 2;
    const separatorColor = 0x7f8c8d;

    this._reelSeparators.clear();

    // Create separators between reels (not before first or after last)
    for (let i = 1; i < this._reelCount; i++) {
      const separatorX =
        -(
          (symbolWidth * this._reelCount +
            reelSpacing * (this._reelCount - 1)) /
          2
        ) +
        i * (symbolWidth + reelSpacing) -
        reelSpacing / 2;

      this._reelSeparators.rect(
        separatorX - separatorWidth / 2,
        -totalHeight / 2,
        separatorWidth,
        totalHeight
      );
      this._reelSeparators.fill({ color: separatorColor, alpha: 0.6 });
    }

    return this._reelSeparators;
  }

  /**
   * Calculate layout positions for reels
   */
  calculateReelPositions(): { x: number; y: number }[] {
    const symbolWidth = GAME_CONFIG.reels.symbolWidth;
    const reelSpacing = LAYOUT.REEL_SPACING;
    const totalWidth =
      symbolWidth * this._reelCount + reelSpacing * (this._reelCount - 1);
    const startX = -totalWidth / 2 + symbolWidth / 2;

    const positions: { x: number; y: number }[] = [];
    for (let i = 0; i < this._reelCount; i++) {
      positions.push({
        x: startX + i * (symbolWidth + reelSpacing),
        y: 0, // Center vertically
      });
    }

    return positions;
  }

  /**
   * Create a mask to clip reel symbols to the visible area
   */
  createReelMask(): PIXI.Graphics {
    const symbolWidth = GAME_CONFIG.reels.symbolWidth;
    const symbolHeight = GAME_CONFIG.reels.symbolHeight;
    const reelSpacing = LAYOUT.REEL_SPACING;
    const totalWidth =
      symbolWidth * this._reelCount + reelSpacing * (this._reelCount - 1);
    const totalHeight = symbolHeight * this._rowCount;

    const mask = new PIXI.Graphics();
    mask.rect(-totalWidth / 2, -totalHeight / 2, totalWidth, totalHeight);
    mask.fill({ color: 0xffffff });

    return mask;
  }

  /**
   * Get the total width of the slot machine
   */
  getTotalWidth(): number {
    const symbolWidth = GAME_CONFIG.reels.symbolWidth;
    const reelSpacing = LAYOUT.REEL_SPACING;
    return symbolWidth * this._reelCount + reelSpacing * (this._reelCount - 1);
  }

  /**
   * Get the total height of the slot machine
   */
  getTotalHeight(): number {
    return GAME_CONFIG.reels.symbolHeight * this._rowCount;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this._frame.destroy();
    this._reelSeparators.destroy();
  }
}