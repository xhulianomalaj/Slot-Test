import * as PIXI from "pixi.js";
import { Button } from "./Button";
import { TextDisplay } from "./TextDisplay";
import { GameStateManager, type GameContext } from "../../game/state";

export class GameUI extends PIXI.Container {
  private stateManager: GameStateManager;

  // UI Components
  private spinButton!: Button;
  private increaseBetButton!: Button;
  private decreaseBetButton!: Button;
  private balanceDisplay!: TextDisplay;
  private betDisplay!: TextDisplay;
  private winDisplay!: TextDisplay;
  private lastWinDisplay!: TextDisplay;

  // Layout constants
  private readonly UI_WIDTH = 1200;
  private readonly UI_HEIGHT = 120;

  constructor(stateManager: GameStateManager) {
    super();

    this.stateManager = stateManager;

    this.createUIComponents();
    this.setupLayout();
    this.setupEventHandlers();
    this.subscribeToStateChanges();
  }

  private createUIComponents(): void {
    // Spin button (main action button)
    this.spinButton = new Button({
      width: 120,
      height: 50,
      text: "SPIN",
      fontSize: 18,
      backgroundColor: 0x27ae60,
      hoverColor: 0x229954,
      disabledColor: 0x95a5a6,
    });

    // Bet control buttons
    this.increaseBetButton = new Button({
      width: 40,
      height: 30,
      text: "+",
      fontSize: 16,
      backgroundColor: 0x3498db,
      hoverColor: 0x2980b9,
    });

    this.decreaseBetButton = new Button({
      width: 40,
      height: 32,
      text: "-",
      fontSize: 16,
      backgroundColor: 0x3498db,
      hoverColor: 0x2980b9,
    });

    // Display components
    this.balanceDisplay = new TextDisplay("$1000", {
      width: 150, // Wider balance display
      height: 40, // Taller balance display
      fontSize: 18, // Larger text
      fontColor: 0xf1c40f,
      backgroundColor: 0x2c3e50,
      borderColor: 0xf39c12,
    });

    this.betDisplay = new TextDisplay("$25", {
      width: 80,
      height: 30,
      fontSize: 14,
      fontColor: 0xffffff,
      backgroundColor: 0x34495e,
    });

    this.winDisplay = new TextDisplay("$0", {
      width: 100,
      height: 35,
      fontSize: 16,
      fontColor: 0x2ecc71,
      backgroundColor: 0x2c3e50,
      borderColor: 0x27ae60,
    });

    this.lastWinDisplay = new TextDisplay("Last: $0", {
      width: 100,
      height: 25,
      fontSize: 12,
      fontColor: 0xecf0f1,
      backgroundColor: 0x34495e,
    });

    // Add all components to container
    this.addChild(this.spinButton);
    this.addChild(this.increaseBetButton);
    this.addChild(this.decreaseBetButton);
    this.addChild(this.balanceDisplay);
    this.addChild(this.betDisplay);
    this.addChild(this.winDisplay);
    this.addChild(this.lastWinDisplay);
  }

  private setupLayout(): void {
    // Center everything in the UI area
    const centerX = 0;
    const centerY = 0;

    // Spin button in the center
    this.spinButton.x = centerX;
    this.spinButton.y = centerY;

    // Bet controls to the left of spin button
    const betControlsX = centerX - 200;
    this.decreaseBetButton.x = betControlsX - 100;
    this.decreaseBetButton.y = centerY;

    this.betDisplay.x = betControlsX - 37;
    this.betDisplay.y = centerY;

    this.increaseBetButton.x = betControlsX + 25;
    this.increaseBetButton.y = centerY;

    // Balance display to the left of bet controls (moved closer to center)
    this.balanceDisplay.x = centerX - 450;
    this.balanceDisplay.y = centerY;

    // Win displays to the right of spin button
    this.winDisplay.x = centerX + 300;
    this.winDisplay.y = centerY - 10;

    this.lastWinDisplay.x = centerX + 300;
    this.lastWinDisplay.y = centerY + 30;
  }

  private setupEventHandlers(): void {
    // Spin button
    this.spinButton.onClick(() => {
      if (this.stateManager.canSpin) {
        this.stateManager.spin();
      }
    });

    // Bet control buttons
    this.increaseBetButton.onClick(() => {
      this.stateManager.increaseBet();
    });

    this.decreaseBetButton.onClick(() => {
      this.stateManager.decreaseBet();
    });
  }

  private subscribeToStateChanges(): void {
    this.stateManager.subscribe("gameUI", (context: GameContext) => {
      this.updateUI(context);
    });
  }

  private updateUI(context: GameContext): void {
    // Update displays
    this.balanceDisplay.setCurrency(context.balance);
    this.betDisplay.setCurrency(context.currentBet);
    this.winDisplay.setCurrency(context.totalWin);
    this.lastWinDisplay.setText(`Last: $${context.lastWin}`);

    // Update button states based on game state and context
    const currentState = this.stateManager.currentState;

    // Spin button state
    this.spinButton.enabled = context.canSpin && currentState === "idle";

    if (context.isSpinning) {
      this.spinButton.text = "SPINNING...";
    } else if (!context.canSpin && context.balance < context.currentBet) {
      this.spinButton.text = "NO FUNDS";
    } else {
      this.spinButton.text = "SPIN";
    }

    // Bet control buttons
    this.increaseBetButton.enabled =
      currentState === "idle" &&
      context.currentBet < 100 &&
      context.balance >= context.currentBet + 1;

    this.decreaseBetButton.enabled =
      currentState === "idle" && context.currentBet > 1;

    // Animate win display when there's a new win
    if (context.lastWin > 0 && currentState === "celebrating") {
      this.animateWin(context.lastWin);
    }
  }

  private animateWin(_winAmount: number): void {
    // Flash the win display
    this.winDisplay.flash(0xf1c40f, 0.5);
    this.winDisplay.pulse(1.3, 0.4);

    // Flash the last win display
    this.lastWinDisplay.flash(0x2ecc71, 0.5);
  }

  // Public methods for external control
  public updateBalance(newBalance: number): void {
    this.balanceDisplay.animateCurrency(newBalance);
  }

  public updateTotalWin(newTotal: number): void {
    this.winDisplay.animateCurrency(newTotal);
  }

  public showWin(amount: number): void {
    this.lastWinDisplay.setText(`Last: $${amount}`);
    this.animateWin(amount);
  }

  public setSpinButtonState(enabled: boolean, text?: string): void {
    this.spinButton.enabled = enabled;
    if (text) {
      this.spinButton.text = text;
    }
  }

  // Get UI dimensions for layout purposes
  public getUIDimensions(): { width: number; height: number } {
    return {
      width: this.UI_WIDTH,
      height: this.UI_HEIGHT,
    };
  }

  // Cleanup
  override destroy(): void {
    this.stateManager.unsubscribe("gameUI");
    super.destroy();
  }
}
