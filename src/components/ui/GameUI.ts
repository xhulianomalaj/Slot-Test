import * as PIXI from "pixi.js";
import { Button } from "./Button";
import { TextDisplay } from "./TextDisplay";
import { InputField } from "./InputField";
import { ToggleButton } from "./ToggleButton";
import { GameStateManager, type GameContext } from "../../game/state";
import type { SlotMachine } from "../../game/reels/SlotMachine";
import { SoundManager } from "../../game/audio/SoundManager";

export class GameUI extends PIXI.Container {
  private stateManager: GameStateManager;
  private slotMachine: SlotMachine | null = null;

  // UI Components
  private spinButton!: Button;
  private increaseBetButton!: Button;
  private decreaseBetButton!: Button;
  private instantPlayToggle!: ToggleButton;
  private balanceDisplay!: TextDisplay;
  private betInput!: InputField;
  private winDisplay!: TextDisplay;
  private lastWinDisplay!: TextDisplay;
  private linesWonDisplay!: TextDisplay;
  private multiplierDisplay!: TextDisplay;

  // Store current win information
  private currentWinInfo: { linesWon: number; maxMultiplier: number } = {
    linesWon: 0,
    maxMultiplier: 0,
  };

  // Track initial balance for profit/loss calculation
  private initialBalance: number;

  // Layout constants
  private readonly UI_WIDTH = 1200;
  private readonly UI_HEIGHT = 120;

  constructor(stateManager: GameStateManager) {
    super();

    this.stateManager = stateManager;

    // Store initial balance for profit/loss tracking
    this.initialBalance = stateManager.context.balance;

    this.createUIComponents();
    this.setupLayout();
    this.setupEventHandlers();
    this.subscribeToStateChanges();
  }

  /**
   * Set the slot machine reference for instant play functionality
   */
  public setSlotMachine(slotMachine: SlotMachine): void {
    this.slotMachine = slotMachine;
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

    // Instant Play toggle button
    this.instantPlayToggle = new ToggleButton({
      width: 120,
      height: 35,
      onText: "INSTANT PLAY ON",
      offText: "INSTANT PLAY OFF",
      onColor: 0x28a745,
      offColor: 0x95a5a6,
      onHoverColor: 0x00cc00,
      offHoverColor: 0x7f8c8d,
      fontSize: 12,
      defaultState: false,
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

    this.betInput = new InputField("10", {
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

    this.lastWinDisplay = new TextDisplay("+$0", {
      width: 100,
      height: 25,
      fontSize: 12,
      fontColor: 0xecf0f1,
      backgroundColor: 0x34495e,
    });

    // Lines won display
    this.linesWonDisplay = new TextDisplay("0 LINES", {
      width: 80,
      height: 30,
      fontSize: 11,
      fontColor: 0xf39c12,
      backgroundColor: 0x2c3e50,
      borderColor: 0xf39c12,
    });

    // Multiplier display
    this.multiplierDisplay = new TextDisplay("0X", {
      width: 80,
      height: 25,
      fontSize: 12,
      fontColor: 0xe74c3c,
      backgroundColor: 0x2c3e50,
      borderColor: 0xe74c3c,
    });

    // Add all components to container
    this.addChild(this.spinButton);
    this.addChild(this.increaseBetButton);
    this.addChild(this.decreaseBetButton);
    this.addChild(this.instantPlayToggle);
    this.addChild(this.balanceDisplay);
    this.addChild(this.betInput);
    this.addChild(this.winDisplay);
    this.addChild(this.lastWinDisplay);
    this.addChild(this.linesWonDisplay);
    this.addChild(this.multiplierDisplay);
  }

  private setupLayout(): void {
    // Center everything in the UI area
    const centerX = 0;
    const centerY = 0;

    // Spin button in the center
    this.spinButton.x = centerX;
    this.spinButton.y = centerY;

    // Lines won and multiplier displays to the right of spin button
    this.linesWonDisplay.x = centerX + 150;
    this.linesWonDisplay.y = centerY - 10;

    this.multiplierDisplay.x = centerX + 150;
    this.multiplierDisplay.y = centerY + 25;

    // Bet controls to the left of spin button
    const betControlsX = centerX - 200;
    this.decreaseBetButton.x = betControlsX - 100;
    this.decreaseBetButton.y = centerY;

    this.betInput.x = betControlsX - 77;
    this.betInput.y = centerY - 15;

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

    // Instant Play toggle to the right of win displays
    this.instantPlayToggle.x = centerX + 450;
    this.instantPlayToggle.y = centerY + 10;
  }

  private setupEventHandlers(): void {
    // Spin button
    this.spinButton.onClick(() => {
      if (this.stateManager.canSpin) {
        SoundManager.getInstance().playButtonPressSound();
        // Small delay to let button press sound play before spinning sound
        setTimeout(() => {
          this.stateManager.spin();
        }, 250);
      }
    });

    // Bet control buttons
    this.increaseBetButton.onClick(() => {
      SoundManager.getInstance().playButtonPressSound();
      this.stateManager.increaseBet();
      // Update the input field to reflect the new bet value
      this.betInput.value = this.stateManager.context.currentBet.toString();
    });

    this.decreaseBetButton.onClick(() => {
      SoundManager.getInstance().playButtonPressSound();
      this.stateManager.decreaseBet();
      // Update the input field to reflect the new bet value
      this.betInput.value = this.stateManager.context.currentBet.toString();
    });

    // Bet input field
    this.betInput.onChange((value: string) => {
      if (value === "" || value.trim() === "") {
        // Don't call setBet when field is empty - just force UI update
        this.updateUI(this.stateManager.context);
        return;
      }
      const numValue = parseInt(value) || 0;
      // Remove range constraint - allow any value for proper validation
      this.stateManager.setBet(numValue);
    });

    this.betInput.onEnter((value: string) => {
      if (value === "" || value.trim() === "") {
        // Don't set any value when empty - just let validation handle it
        return;
      }
      const numValue = parseInt(value) || 0;
      // Remove automatic clamping - let the user enter any value
      this.stateManager.setBet(numValue);
      this.betInput.value = numValue.toString();
    });

    // Instant Play toggle
    this.instantPlayToggle.onClick((isToggled: boolean) => {
      SoundManager.getInstance().playButtonPressSound();
      if (this.slotMachine) {
        this.slotMachine.instantPlayMode = isToggled;
      } else {
        console.warn("SlotMachine not available for instant play toggle");
      }
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
    // Don't automatically update betInput.value - let user control it

    // Win display logic: Show current win amount when there's a win, but reset to 0 on new spins
    const currentState = this.stateManager.currentState;
    if (
      context.lastWin > 0 &&
      (currentState === "celebrating" || currentState === "idle")
    ) {
      this.winDisplay.setCurrency(context.lastWin);
    } else {
      this.winDisplay.setCurrency(0);
    }

    // Balance tracking display: Show total profit/loss since page load
    const totalProfitLoss = context.balance - this.initialBalance;
    const profitLossText =
      totalProfitLoss >= 0
        ? `+$${totalProfitLoss}`
        : `-$${Math.abs(totalProfitLoss)}`;
    this.lastWinDisplay.setText(profitLossText);

    // Update lines won and multiplier displays
    this.updateWinInformation(context);

    // Update button states based on game state and context
    // currentState is already declared above

    // Check if bet exceeds balance or is invalid (check input field state first)
    const betExceedsBalance = context.currentBet > context.balance;
    const invalidBet =
      context.currentBet <= 0 ||
      this.betInput.value === "" ||
      this.betInput.value.trim() === "";

    // Spin button state - disable if bet exceeds balance, is invalid, or other conditions
    this.spinButton.enabled =
      context.canSpin &&
      currentState === "idle" &&
      !betExceedsBalance &&
      !invalidBet;

    if (context.isSpinning) {
      this.spinButton.setTextWithFontSize("SPINNING...", 18);
    } else if (invalidBet) {
      this.spinButton.setTextWithFontSize("ENTER BET", 16);
    } else if (betExceedsBalance) {
      this.spinButton.setTextWithFontSize("BET TOO HIGH", 14); // Smaller font size
    } else if (!context.canSpin && context.balance < context.currentBet) {
      this.spinButton.setTextWithFontSize("NO FUNDS", 18);
    } else {
      this.spinButton.setTextWithFontSize("SPIN", 18);
    }

    // Bet control buttons
    this.increaseBetButton.enabled =
      currentState === "idle" && context.balance >= context.currentBet + 5;

    this.decreaseBetButton.enabled =
      currentState === "idle" && context.currentBet > 1;

    // Instant Play toggle - disable during spinning
    this.instantPlayToggle.enabled = currentState === "idle";

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

    // Flash the lines won and multiplier displays
    this.linesWonDisplay.flash(0xf39c12, 0.5);
    this.linesWonDisplay.pulse(1.2, 0.3);
    this.multiplierDisplay.flash(0xe74c3c, 0.5);
    this.multiplierDisplay.pulse(1.2, 0.3);
  }

  private updateWinInformation(context: GameContext): void {
    // Check if we have fresh win data to capture
    if (
      context.reelResults &&
      context.reelResults.wins &&
      context.reelResults.wins.length > 0
    ) {
      const wins = context.reelResults.wins;
      this.currentWinInfo.linesWon = wins.length;
      // Sum all multipliers instead of taking the max
      this.currentWinInfo.maxMultiplier = wins.reduce(
        (sum, win) => sum + win.multiplier,
        0
      );
    }

    // Use stored win information if we have any
    const currentState = this.stateManager.currentState;
    const hasWins = this.currentWinInfo.linesWon > 0;
    const isShowingWins =
      currentState === "celebrating" ||
      (context.lastWin > 0 && currentState === "idle");

    if (hasWins && isShowingWins) {
      // Update lines won display
      const lineText =
        this.currentWinInfo.linesWon === 1
          ? "1 LINE"
          : `${this.currentWinInfo.linesWon} LINES`;
      this.linesWonDisplay.setText(lineText);

      // Update multiplier display
      this.multiplierDisplay.setText(`${this.currentWinInfo.maxMultiplier}X`);

      // Make displays visible when there are wins
      this.linesWonDisplay.alpha = 1.0;
      this.multiplierDisplay.alpha = 1.0;
    } else if (!isShowingWins) {
      // Clear win info when not showing wins (new spin started)
      this.currentWinInfo = { linesWon: 0, maxMultiplier: 0 };
      this.linesWonDisplay.setText("0 LINES");
      this.multiplierDisplay.setText("0X");
      this.linesWonDisplay.alpha = 0.5;
      this.multiplierDisplay.alpha = 0.5;
    }
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

  // Instant Play control methods
  public get isInstantPlayEnabled(): boolean {
    return this.instantPlayToggle.isToggled;
  }

  public setInstantPlay(enabled: boolean): void {
    this.instantPlayToggle.isToggled = enabled;
  }

  // Get UI dimensions for layout purposes
  public getUIDimensions(): { width: number; height: number } {
    return {
      width: this.UI_WIDTH,
      height: this.UI_HEIGHT,
    };
  }

  /**
   * Simulate spin button press effect for keyboard triggers
   */
  public simulateSpinButtonPress(): void {
    this.spinButton.simulatePress();
  }

  // Cleanup
  override destroy(): void {
    this.stateManager.unsubscribe("gameUI");
    super.destroy();
  }
}
