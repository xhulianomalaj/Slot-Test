import * as PIXI from "pixi.js";
import { GAME_CONFIG, LAYOUT } from "../config/GameConfig";
import type { WinResult, PaylineConfig, Position } from "../../types";
import gsap from "gsap";

/**
 * Handles the actual drawing and rendering of paylines
 */
export class PaylineDrawing {
  private paylineGraphics: Map<number, PIXI.Graphics[]> = new Map(); // Array to store both glow and main graphics
  private animationTweens: Map<number, gsap.core.Tween> = new Map();
  private container: PIXI.Container;
  private animationSpeed: number = 1.0; // Animation speed multiplier

  constructor(container: PIXI.Container) {
    this.container = container;
  }

  /**
   * Set animation speed multiplier (used for instant play mode)
   */
  public setAnimationSpeed(speed: number): void {
    this.animationSpeed = Math.max(0.1, Math.min(5, speed));
  }

  /**
   * Calculate the total animation duration for a payline in milliseconds
   * This should match the actual timing used in animateLineDrawing
   */
  public calculateAnimationDuration(positions: Position[]): number {
    const totalSegments = positions.length - 1;
    const segmentDuration = 0.15 / this.animationSpeed; // Apply speed multiplier
    const pulsingDuration = 0.4 / this.animationSpeed; // Apply speed multiplier
    const pulsingRepeats = 2; // Number of repeats
    const pulsingRepeatDelay = 0.1 / this.animationSpeed; // Apply speed multiplier

    const drawingTime = totalSegments * segmentDuration;
    const pulsingTime =
      pulsingDuration * (pulsingRepeats + 1) +
      pulsingRepeatDelay * pulsingRepeats;

    // Return in milliseconds
    return (drawingTime + pulsingTime) * 1000;
  }

  /**
   * Draw a winning payline with optional animation
   */
  async drawWinningPayline(
    win: WinResult,
    animate: boolean = false
  ): Promise<void> {
    const lineColor = this.getPaylineColor(win.payline);
    const lineWidth = 4;

    // Calculate symbol positions based on WINNING positions only
    const positions = win.positions.map((pos) =>
      this.getSymbolScreenPosition(pos)
    );

    if (positions.length < 2) {
      return;
    }

    if (animate) {
      // Animated drawing effect
      await this.animateLineDrawing(
        win.payline,
        positions,
        lineColor,
        lineWidth
      );
    } else {
      // Static drawing (for when showing all lines at once)
      this.drawStaticLine(win.payline, positions, lineColor, lineWidth);
    }
  }

  /**
   * Animate the line being drawn from start to finish
   */
  private async animateLineDrawing(
    paylineId: number,
    positions: { x: number; y: number }[],
    lineColor: number,
    lineWidth: number
  ): Promise<void> {
    return new Promise<void>((resolve) => {
      const graphics = new PIXI.Graphics();
      const glowGraphics = new PIXI.Graphics();

      this.container.addChild(glowGraphics);
      this.container.addChild(graphics);

      // Store graphics for cleanup
      this.paylineGraphics.set(paylineId, [glowGraphics, graphics]);

      let currentSegment = 0;
      const totalSegments = positions.length - 1;
      const segmentDuration = 0.15 / this.animationSpeed; // Apply speed multiplier

      const drawNextSegment = () => {
        if (currentSegment >= totalSegments) {
          // Animation complete - add pulsing effect
          const tween = gsap.to([glowGraphics, graphics], {
            alpha: 1.0,
            duration: 0.4 / this.animationSpeed, // Apply speed multiplier
            ease: "power2.out",
            repeat: 2, // Increased from 1 to 2
            yoyo: true,
            repeatDelay: 0.1 / this.animationSpeed, // Apply speed multiplier
            onComplete: () => {
              // Add null checks before setting properties
              if (
                glowGraphics &&
                !glowGraphics.destroyed &&
                graphics &&
                !graphics.destroyed
              ) {
                // Keep visible at reduced opacity
                gsap.set([glowGraphics, graphics], { alpha: 0.8 });
              }
              resolve();
            },
          });
          this.animationTweens.set(paylineId, tween);
          return;
        }

        // Draw the current segment
        const startPos = positions[currentSegment];
        const endPos = positions[currentSegment + 1];

        // Animate drawing this segment
        const progress = { value: 0 };
        gsap.to(progress, {
          value: 1,
          duration: segmentDuration,
          ease: "power2.out",
          onUpdate: () => {
            // Add null checks to prevent errors during skip
            if (
              !graphics ||
              graphics.destroyed ||
              !glowGraphics ||
              glowGraphics.destroyed
            ) {
              return;
            }

            // Clear and redraw up to current progress
            graphics.clear();
            glowGraphics.clear();

            // Draw all completed segments
            if (currentSegment > 0) {
              graphics.moveTo(positions[0].x, positions[0].y);
              glowGraphics.moveTo(positions[0].x, positions[0].y);

              for (let i = 1; i <= currentSegment; i++) {
                graphics.lineTo(positions[i].x, positions[i].y);
                glowGraphics.lineTo(positions[i].x, positions[i].y);
              }
            } else {
              graphics.moveTo(startPos.x, startPos.y);
              glowGraphics.moveTo(startPos.x, startPos.y);
            }

            // Draw current segment with progress
            const currentX =
              startPos.x + (endPos.x - startPos.x) * progress.value;
            const currentY =
              startPos.y + (endPos.y - startPos.y) * progress.value;

            graphics.lineTo(currentX, currentY);
            glowGraphics.lineTo(currentX, currentY);

            // Apply styles
            graphics.stroke({ color: lineColor, width: lineWidth, alpha: 0.9 });
            glowGraphics.stroke({
              color: lineColor,
              width: lineWidth + 4,
              alpha: 0.4,
            });
          },
          onComplete: () => {
            currentSegment++;
            drawNextSegment();
          },
        });
      };

      // Start drawing
      drawNextSegment();
    });
  }

  /**
   * Draw a static line (for showing all lines at once)
   */
  private drawStaticLine(
    paylineId: number,
    positions: { x: number; y: number }[],
    lineColor: number,
    lineWidth: number
  ): void {
    const graphics = new PIXI.Graphics();
    const glowGraphics = new PIXI.Graphics();

    // Draw the complete path
    graphics.moveTo(positions[0].x, positions[0].y);
    glowGraphics.moveTo(positions[0].x, positions[0].y);

    for (let i = 1; i < positions.length; i++) {
      graphics.lineTo(positions[i].x, positions[i].y);
      glowGraphics.lineTo(positions[i].x, positions[i].y);
    }

    graphics.stroke({ color: lineColor, width: lineWidth, alpha: 0.8 });
    glowGraphics.stroke({ color: lineColor, width: lineWidth + 4, alpha: 0.3 });

    this.container.addChild(glowGraphics);
    this.container.addChild(graphics);

    // Store both graphics for cleanup
    this.paylineGraphics.set(paylineId, [glowGraphics, graphics]);

    // Set initial visibility
    glowGraphics.alpha = 0.3;
    graphics.alpha = 0.6;
  }

  /**
   * Draw a payline configuration (for showing all paylines)
   */
  drawPayline(paylineConfig: PaylineConfig, animate: boolean = false): void {
    const lineColor = this.getPaylineColor(paylineConfig.id);
    const lineWidth = 3;

    // Calculate positions from payline configuration
    const positions = paylineConfig.positions.map((position) => {
      return this.getSymbolScreenPosition(position);
    });

    if (animate) {
      // Start with invisible and animate in
      const graphics = new PIXI.Graphics();
      const glowGraphics = new PIXI.Graphics();

      // Draw the complete path
      graphics.moveTo(positions[0].x, positions[0].y);
      glowGraphics.moveTo(positions[0].x, positions[0].y);

      for (let i = 1; i < positions.length; i++) {
        graphics.lineTo(positions[i].x, positions[i].y);
        glowGraphics.lineTo(positions[i].x, positions[i].y);
      }

      graphics.stroke({ color: lineColor, width: lineWidth, alpha: 0.9 });
      glowGraphics.stroke({
        color: lineColor,
        width: lineWidth + 4,
        alpha: 0.4,
      });

      this.container.addChild(glowGraphics);
      this.container.addChild(graphics);

      // Store both graphics for cleanup
      this.paylineGraphics.set(paylineConfig.id, [glowGraphics, graphics]);

      // Start with invisible and animate in
      glowGraphics.alpha = 0;
      graphics.alpha = 0;
      const tween = gsap.to([glowGraphics, graphics], {
        alpha: 0.8,
        duration: 0.25 / this.animationSpeed, // Apply speed multiplier
        ease: "power2.out",
        repeat: -1,
        yoyo: true,
        repeatDelay: 0.1 / this.animationSpeed, // Apply speed multiplier
      });
      this.animationTweens.set(paylineConfig.id, tween);
    }
  }

  /**
   * Get screen position for a symbol at given reel/row position
   */
  private getSymbolScreenPosition(position: Position): {
    x: number;
    y: number;
  } {
    const symbolWidth = GAME_CONFIG.reels.symbolWidth;
    const symbolHeight = GAME_CONFIG.reels.symbolHeight;
    const reelSpacing = LAYOUT.REEL_SPACING;
    const reelCount = GAME_CONFIG.reels.count;
    const rowCount = GAME_CONFIG.reels.rows;

    // Calculate reel starting position (same as SlotMachine layout)
    const totalWidth = symbolWidth * reelCount + reelSpacing * (reelCount - 1);
    const startX = -totalWidth / 2 + symbolWidth / 2;
    const startY = -((rowCount - 1) * symbolHeight) / 2;

    const x = startX + position.reel * (symbolWidth + reelSpacing);
    const y = startY + position.row * symbolHeight;

    return { x, y };
  }

  /**
   * Get color for a specific payline
   */
  private getPaylineColor(paylineId: number): number {
    const colors = [
      0xff6b6b, // Red
      0x4ecdc4, // Teal
      0x45b7d1, // Blue
      0x96ceb4, // Green
      0xfeca57, // Yellow
      0xff9ff3, // Pink
      0x54a0ff, // Light Blue
      0x5f27cd, // Purple
      0x00d2d3, // Cyan
      0xff9f43, // Orange
      0x10ac84, // Dark Green
      0xee5a24, // Dark Orange
      0x0984e3, // Royal Blue
      0x6c5ce7, // Light Purple
      0xfb8500, // Amber
      0x007f5f, // Forest Green
      0x2a9d8f, // Teal Green
      0xe76f51, // Terracotta
      0x264653, // Dark Teal
      0xf4a261, // Sandy Brown
      0xe9c46a, // Golden Yellow
      0x2a9134, // Grass Green
      0x8338ec, // Violet
      0x3a86ff, // Dodger Blue
      0xff006e, // Hot Pink
    ];

    return colors[paylineId % colors.length];
  }

  /**
   * Clear a specific payline
   */
  clearPayline(paylineId: number): void {
    const graphicsArray = this.paylineGraphics.get(paylineId);
    if (graphicsArray) {
      // Remove and destroy all graphics
      graphicsArray.forEach((graphics) => {
        this.container.removeChild(graphics);
        graphics.destroy();
      });
      this.paylineGraphics.delete(paylineId);
    }

    // Clean up any associated tweens
    const tween = this.animationTweens.get(paylineId);
    if (tween) {
      tween.kill();
      this.animationTweens.delete(paylineId);
    }
  }

  /**
   * Clear all paylines
   */
  clearAllPaylines(): void {
    // Kill all animation tweens first
    this.animationTweens.forEach((tween) => tween.kill());
    this.animationTweens.clear();

    // Destroy all graphics
    this.paylineGraphics.forEach((graphicsArray) => {
      graphicsArray.forEach((graphics) => {
        this.container.removeChild(graphics);
        graphics.destroy();
      });
    });
    this.paylineGraphics.clear();
  }

  /**
   * Force cleanup without animation protection
   */
  forceCleanup(): void {
    // Kill all tweens
    this.animationTweens.forEach((tween) => tween.kill());
    this.animationTweens.clear();

    // Remove and destroy all graphics immediately
    this.paylineGraphics.forEach((graphicsArray) => {
      graphicsArray.forEach((graphics) => {
        this.container.removeChild(graphics);
        graphics.destroy();
      });
    });
    this.paylineGraphics.clear();
  }

  /**
   * Show all available paylines (for UI/tutorial purposes)
   */
  showAllPaylines(alpha: number = 0.3): void {
    this.clearAllPaylines();

    GAME_CONFIG.paylines.forEach((paylineConfig) => {
      this.drawPayline(paylineConfig, false);
    });

    // Set uniform alpha for all paylines
    this.paylineGraphics.forEach((graphicsArray) => {
      graphicsArray.forEach((graphics) => {
        graphics.alpha = alpha;
      });
    });
  }
}
