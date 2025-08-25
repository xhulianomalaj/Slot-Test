import * as PIXI from "pixi.js";
import { GAME_CONFIG, LAYOUT } from "../config/GameConfig";
import type { WinResult, PaylineConfig, Position } from "../../types";
import gsap from "gsap";

export class PaylineDrawing {
  private paylineGraphics: Map<number, PIXI.Graphics[]> = new Map();
  private animationTweens: Map<number, gsap.core.Tween> = new Map();
  private container: PIXI.Container;
  private animationSpeed: number = 1.0;

  constructor(container: PIXI.Container) {
    this.container = container;
  }

  public setAnimationSpeed(speed: number): void {
    this.animationSpeed = Math.max(0.1, Math.min(5, speed));
  }

  public calculateAnimationDuration(positions: Position[]): number {
    const totalSegments = positions.length - 1;
    const segmentDuration = 0.15 / this.animationSpeed;
    const pulsingDuration = 0.4 / this.animationSpeed;
    const pulsingRepeats = 2;
    const pulsingRepeatDelay = 0.1 / this.animationSpeed;

    const drawingTime = totalSegments * segmentDuration;
    const pulsingTime =
      pulsingDuration * (pulsingRepeats + 1) +
      pulsingRepeatDelay * pulsingRepeats;

    // Return in milliseconds
    return (drawingTime + pulsingTime) * 1000;
  }

  async drawWinningPayline(
    win: WinResult,
    animate: boolean = false
  ): Promise<void> {
    const lineColor = this.getPaylineColor(win.payline);
    const lineWidth = 4;

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

      this.paylineGraphics.set(paylineId, [glowGraphics, graphics]);

      let currentSegment = 0;
      const totalSegments = positions.length - 1;
      const segmentDuration = 0.15 / this.animationSpeed;

      const drawNextSegment = () => {
        if (currentSegment >= totalSegments) {
          // Animation complete - add pulsing effect
          const tween = gsap.to([glowGraphics, graphics], {
            alpha: 1.0,
            duration: 0.4 / this.animationSpeed,
            ease: "power2.out",
            repeat: 2,
            yoyo: true,
            repeatDelay: 0.1 / this.animationSpeed,
            onComplete: () => {
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
            if (
              !graphics ||
              graphics.destroyed ||
              !glowGraphics ||
              glowGraphics.destroyed
            ) {
              return;
            }

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

      drawNextSegment();
    });
  }

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

    this.paylineGraphics.set(paylineId, [glowGraphics, graphics]);

    glowGraphics.alpha = 0.3;
    graphics.alpha = 0.6;
  }

  drawPayline(paylineConfig: PaylineConfig, animate: boolean = false): void {
    const lineColor = this.getPaylineColor(paylineConfig.id);
    const lineWidth = 3;

    const positions = paylineConfig.positions.map((position) => {
      return this.getSymbolScreenPosition(position);
    });

    if (animate) {
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

      this.paylineGraphics.set(paylineConfig.id, [glowGraphics, graphics]);

      glowGraphics.alpha = 0;
      graphics.alpha = 0;
      const tween = gsap.to([glowGraphics, graphics], {
        alpha: 0.8,
        duration: 0.25 / this.animationSpeed,
        ease: "power2.out",
        repeat: -1,
        yoyo: true,
        repeatDelay: 0.1 / this.animationSpeed,
      });
      this.animationTweens.set(paylineConfig.id, tween);
    }
  }

  private getSymbolScreenPosition(position: Position): {
    x: number;
    y: number;
  } {
    const symbolWidth = GAME_CONFIG.reels.symbolWidth;
    const symbolHeight = GAME_CONFIG.reels.symbolHeight;
    const reelSpacing = LAYOUT.REEL_SPACING;
    const reelCount = GAME_CONFIG.reels.count;
    const rowCount = GAME_CONFIG.reels.rows;

    const totalWidth = symbolWidth * reelCount + reelSpacing * (reelCount - 1);
    const startX = -totalWidth / 2 + symbolWidth / 2;
    const startY = -((rowCount - 1) * symbolHeight) / 2;

    const x = startX + position.reel * (symbolWidth + reelSpacing);
    const y = startY + position.row * symbolHeight;

    return { x, y };
  }

  private getPaylineColor(paylineId: number): number {
    const colors = [
      0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xfeca57, 0xff9ff3, 0x54a0ff,
      0x5f27cd, 0x00d2d3, 0xff9f43, 0x10ac84, 0xee5a24, 0x0984e3, 0x6c5ce7,
      0xfb8500, 0x007f5f, 0x2a9d8f, 0xe76f51, 0x264653, 0xf4a261, 0xe9c46a,
      0x2a9134, 0x8338ec, 0x3a86ff, 0xff006e,
    ];

    return colors[paylineId % colors.length];
  }

  clearPayline(paylineId: number): void {
    const graphicsArray = this.paylineGraphics.get(paylineId);
    if (graphicsArray) {
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

  forceCleanup(): void {
    // Kill all tweens
    this.animationTweens.forEach((tween) => tween.kill());
    this.animationTweens.clear();

    this.paylineGraphics.forEach((graphicsArray) => {
      graphicsArray.forEach((graphics) => {
        this.container.removeChild(graphics);
        graphics.destroy();
      });
    });
    this.paylineGraphics.clear();
  }

  showAllPaylines(alpha: number = 0.3): void {
    this.clearAllPaylines();

    GAME_CONFIG.paylines.forEach((paylineConfig) => {
      this.drawPayline(paylineConfig, false);
    });

    this.paylineGraphics.forEach((graphicsArray) => {
      graphicsArray.forEach((graphics) => {
        graphics.alpha = alpha;
      });
    });
  }
}
