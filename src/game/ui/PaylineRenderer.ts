import * as PIXI from "pixi.js";
import { GAME_CONFIG, LAYOUT } from "../config/GameConfig";
import type { WinResult, PaylineConfig, Position } from "../../types";
import gsap from "gsap";

export class PaylineRenderer extends PIXI.Container {
  private paylineGraphics: Map<number, PIXI.Graphics[]> = new Map(); // Array to store both glow and main graphics
  private animationTweens: Map<number, gsap.core.Tween> = new Map();
  private cyclingTimeout: NodeJS.Timeout | null = null;
  private resolveCycling: (() => void) | null = null;
  private isAnimating: boolean = false;

  constructor() {
    super();
    this.name = "PaylineRenderer";
  }

  /**
   * Show winning paylines with animation - first all together, then cycle through each one
   * Returns a promise that resolves when the animation sequence is complete
   */
  async showWinningPaylines(wins: WinResult[]): Promise<void> {
    // console.log(
    //   `🎨 showWinningPaylines called with ${wins.length} wins:`,
    //   wins
    // );

    // Set animation flag to protect the entire sequence
    this.isAnimating = true;

    // Clear existing paylines first (force cleanup without protection)
    this.forceCleanup();

    // Phase 1: Show all winning paylines at once (static)
    for (const win of wins) {
      await this.drawWinningPayline(win, false); // No animation initially
    }

    // console.log(`🎨 All paylines drawn, starting phase 2 in 1000ms`);

    // Phase 2: After showing all, cycle through each one individually
    if (wins.length > 1) {
      // console.log(
      //   `🎨 Multiple paylines detected (${wins.length}) - starting cycling`
      // );
      // Wait for initial display period
      await new Promise((resolve) => setTimeout(resolve, 500));

      // console.log(`🎨 Starting payline cycling for ${wins.length} wins`);

      // Start cycling and wait for it to complete
      await this.startPaylineCycling(wins);
    } else {
      // console.log(`🎨 Single payline detected - using animated drawing`);
      // Single payline - clear static version and draw with animation
      this.forceCleanup();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Draw with animation
      await this.drawWinningPayline(wins[0], true);
      await new Promise((resolve) => setTimeout(resolve, 400)); // Show completed line
      // console.log(`🎨 Single payline animation complete`);
    }

    // Clear animation flag when complete
    this.isAnimating = false;
    // console.log(`🎨 Payline animation sequence complete`);
  }

  /**
   * Cycle through paylines one by one with animated drawing
   * Returns a promise that resolves after showing each payline a specified number of times
   */
  private async startPaylineCycling(wins: WinResult[]): Promise<void> {
    // Clear all static lines first
    this.forceCleanup();

    // Draw each payline individually with animation
    for (let i = 0; i < wins.length; i++) {
      const win = wins[i];

      // Draw this payline with animation
      await this.drawWinningPayline(win, true);

      // Wait a bit to show the completed line
      await new Promise((resolve) => setTimeout(resolve, 400));

      // If not the last payline, clear it before drawing the next
      if (i < wins.length - 1) {
        this.clearPayline(win.payline);
        await new Promise((resolve) => setTimeout(resolve, 50)); // Brief pause between lines
      }
    }

    // After showing all individually, show all together briefly
    await new Promise((resolve) => setTimeout(resolve, 150));
    this.forceCleanup();

    // Show all paylines together at the end
    for (const win of wins) {
      await this.drawWinningPayline(win, false);
    }
  }

  /**
   * Draw a winning payline with animated line drawing effect
   */
  private async drawWinningPayline(
    win: WinResult,
    animate: boolean = false
  ): Promise<void> {
    // Debug: Log what we're drawing
    // console.log(`🎨 drawWinningPayline called for payline ${win.payline}`);
    // console.log(`🎨 Win positions (${win.positions.length}):`, win.positions);
    // console.log(`🎨 Win symbols (${win.symbols.length}):`, win.symbols);

    const lineColor = this.getPaylineColor(win.payline);
    const lineWidth = 4;

    // Calculate symbol positions based on WINNING positions only
    const positions = win.positions.map((pos) =>
      this.getSymbolScreenPosition(pos)
    );

    if (positions.length < 2) return;

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

      this.addChild(glowGraphics);
      this.addChild(graphics);

      // Store graphics for cleanup
      this.paylineGraphics.set(paylineId, [glowGraphics, graphics]);

      let currentSegment = 0;
      const totalSegments = positions.length - 1;
      const segmentDuration = 0.1; // Time to draw each segment

      const drawNextSegment = () => {
        if (currentSegment >= totalSegments) {
          // Animation complete - add pulsing effect
          const tween = gsap.to([glowGraphics, graphics], {
            alpha: 1.0,
            duration: 0.2,
            ease: "power2.out",
            repeat: 1,
            yoyo: true,
            repeatDelay: 0.05,
            onComplete: () => {
              // Keep visible at reduced opacity
              gsap.set([glowGraphics, graphics], { alpha: 0.8 });
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

    this.addChild(glowGraphics);
    this.addChild(graphics);

    // Store both graphics for cleanup
    this.paylineGraphics.set(paylineId, [glowGraphics, graphics]);

    // Set initial visibility
    glowGraphics.alpha = 0.3;
    graphics.alpha = 0.6;
  }

  /**
   * Draw a specific payline (full pattern - used for showing all paylines)
   */
  private drawPayline(
    paylineConfig: PaylineConfig,
    animate: boolean = false
  ): void {
    const graphics = new PIXI.Graphics();
    const lineColor = this.getPaylineColor(paylineConfig.id);
    const lineWidth = 4;

    // Calculate symbol positions based on reel layout
    const positions = paylineConfig.positions.map((pos) =>
      this.getSymbolScreenPosition(pos)
    );

    if (positions.length < 2) return;

    // Draw the payline path
    graphics.moveTo(positions[0].x, positions[0].y);

    for (let i = 1; i < positions.length; i++) {
      graphics.lineTo(positions[i].x, positions[i].y);
    }

    graphics.stroke({ color: lineColor, width: lineWidth, alpha: 0.8 });

    // Add glow effect (simplified - we'll use basic alpha glow instead of filters for now)
    const glowGraphics = new PIXI.Graphics();
    glowGraphics.moveTo(positions[0].x, positions[0].y);

    for (let i = 1; i < positions.length; i++) {
      glowGraphics.lineTo(positions[i].x, positions[i].y);
    }

    glowGraphics.stroke({ color: lineColor, width: lineWidth + 4, alpha: 0.3 });

    this.addChild(glowGraphics);
    this.addChild(graphics);

    // Store both graphics for cleanup
    this.paylineGraphics.set(paylineConfig.id, [glowGraphics, graphics]);

    if (animate) {
      // Start with invisible and animate in
      glowGraphics.alpha = 0;
      graphics.alpha = 0;
      const tween = gsap.to([glowGraphics, graphics], {
        alpha: 0.8,
        duration: 0.25,
        ease: "power2.out",
        repeat: -1,
        yoyo: true,
        repeatDelay: 0.1,
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
   * Get color for a specific payline (cycling through colors)
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
    ];

    return colors[(paylineId - 1) % colors.length];
  }

  /**
   * Clear a specific payline
   */
  clearPayline(paylineId: number): void {
    const graphicsArray = this.paylineGraphics.get(paylineId);
    if (graphicsArray) {
      // Stop animation
      const tween = this.animationTweens.get(paylineId);
      if (tween) {
        tween.kill();
        this.animationTweens.delete(paylineId);
      }

      // Remove and destroy all graphics
      graphicsArray.forEach((graphics) => {
        this.removeChild(graphics);
        graphics.destroy();
      });
      this.paylineGraphics.delete(paylineId);
    }
  }

  /**
   * Clear all paylines
   */
  clearAllPaylines(): void {
    // console.log(
    //   `🎨 clearAllPaylines called - isAnimating: ${this.isAnimating}`
    // );

    // If we're currently animating, don't clear - let the animation complete naturally
    if (this.isAnimating) {
      // console.log(`🎨 Ignoring clearAllPaylines - animation in progress`);
      return;
    }

    // console.log(`🎨 Proceeding with clearing paylines`);
    this.forceCleanup();
  }

  /**
   * Force cleanup without protection (used internally)
   */
  private forceCleanup(): void {
    // Stop cycling animation
    if (this.cyclingTimeout) {
      // console.log(`🎨 Clearing cycling timeout`);
      clearTimeout(this.cyclingTimeout);
      this.cyclingTimeout = null;
    }

    // Resolve any pending cycling promise
    if (this.resolveCycling) {
      // console.log(`🎨 Resolving pending cycling promise`);
      this.resolveCycling();
      this.resolveCycling = null;
    }

    // Stop all animations
    this.animationTweens.forEach((tween) => tween.kill());
    this.animationTweens.clear();

    // Destroy all graphics
    this.paylineGraphics.forEach((graphicsArray) => {
      graphicsArray.forEach((graphics) => {
        this.removeChild(graphics);
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
      const graphicsArray = this.paylineGraphics.get(paylineConfig.id);
      if (graphicsArray) {
        graphicsArray.forEach((graphics) => {
          graphics.alpha = alpha;
        });
      }
    });
  }

  /**
   * Cleanup resources
   */
  override destroy(): void {
    this.clearAllPaylines();
    super.destroy();
  }
}
