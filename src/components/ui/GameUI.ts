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

  private currentWinInfo: { linesWon: number; maxMultiplier: number } = {
    linesWon: 0,
    maxMultiplier: 0,
  };

  private initialBalance: number;

  private readonly UI_WIDTH = 1200;
  private readonly UI_HEIGHT = 120;

  constructor(stateManager: GameStateManager) {
    super();

    this.stateManager = stateManager;

    this.initialBalance = stateManager.context.balance;

    this.createUIComponents();
    this.setupLayout();
    this.setupEventHandlers();
    this.subscribeToStateChanges();
  }

  public setSlotMachine(slotMachine: SlotMachine): void {
    this.slotMachine = slotMachine;
  }

  private createUIComponents(): void {
    this.spinButton = new Button({
      width: 120,
      height: 50,
      text: "SPIN",
      fontSize: 18,
      backgroundColor: 0x27ae60,
      hoverColor: 0x229954,
      disabledColor: 0x95a5a6,
    });

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

    this.balanceDisplay = new TextDisplay("$1000", {
      width: 150,
      height: 40,
      fontSize: 18,
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

    this.linesWonDisplay = new TextDisplay("0 LINES", {
      width: 80,
      height: 30,
      fontSize: 11,
      fontColor: 0xf39c12,
      backgroundColor: 0x2c3e50,
      borderColor: 0xf39c12,
    });

    this.multiplierDisplay = new TextDisplay("0X", {
      width: 80,
      height: 25,
      fontSize: 12,
      fontColor: 0xe74c3c,
      backgroundColor: 0x2c3e50,
      borderColor: 0xe74c3c,
    });

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
    const centerX = 0;
    const centerY = 0;

    this.spinButton.x = centerX;
    this.spinButton.y = centerY;

    this.linesWonDisplay.x = centerX + 150;
    this.linesWonDisplay.y = centerY - 10;

    this.multiplierDisplay.x = centerX + 150;
    this.multiplierDisplay.y = centerY + 25;

    const betControlsX = centerX - 200;
    this.decreaseBetButton.x = betControlsX - 100;
    this.decreaseBetButton.y = centerY;

    this.betInput.x = betControlsX - 77;
    this.betInput.y = centerY - 15;

    this.increaseBetButton.x = betControlsX + 25;
    this.increaseBetButton.y = centerY;

    this.balanceDisplay.x = centerX - 450;
    this.balanceDisplay.y = centerY;

    this.winDisplay.x = centerX + 300;
    this.winDisplay.y = centerY - 10;

    this.lastWinDisplay.x = centerX + 300;
    this.lastWinDisplay.y = centerY + 30;

    this.instantPlayToggle.x = centerX + 450;
    this.instantPlayToggle.y = centerY + 10;
  }

  private setupEventHandlers(): void {
    this.spinButton.onClick(() => {
      if (this.stateManager.canSpin) {
        SoundManager.getInstance().playButtonPressSound();
        setTimeout(() => {
          this.stateManager.spin();
        }, 250);
      }
    });

    this.increaseBetButton.onClick(() => {
      SoundManager.getInstance().playButtonPressSound();
      this.stateManager.increaseBet();
      this.betInput.value = this.stateManager.context.currentBet.toString();
    });

    this.decreaseBetButton.onClick(() => {
      SoundManager.getInstance().playButtonPressSound();
      this.stateManager.decreaseBet();
      this.betInput.value = this.stateManager.context.currentBet.toString();
    });

    this.betInput.onChange((value: string) => {
      if (value === "" || value.trim() === "") {
        this.updateUI(this.stateManager.context);
        return;
      }
      const numValue = parseInt(value) || 0;
      this.stateManager.setBet(numValue);
    });

    this.betInput.onEnter((value: string) => {
      if (value === "" || value.trim() === "") {
        return;
      }
      const numValue = parseInt(value) || 0;
      this.stateManager.setBet(numValue);
      this.betInput.value = numValue.toString();
    });

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
    this.balanceDisplay.setCurrency(context.balance);

    const currentState = this.stateManager.currentState;
    if (
      context.lastWin > 0 &&
      (currentState === "celebrating" || currentState === "idle")
    ) {
      this.winDisplay.setCurrency(context.lastWin);
    } else {
      this.winDisplay.setCurrency(0);
    }

    const totalProfitLoss = context.balance - this.initialBalance;
    const profitLossText =
      totalProfitLoss >= 0
        ? `+$${totalProfitLoss}`
        : `-$${Math.abs(totalProfitLoss)}`;
    this.lastWinDisplay.setText(profitLossText);

    this.updateWinInformation(context);

    // currentState is already declared above

    const betExceedsBalance = context.currentBet > context.balance;
    const invalidBet =
      context.currentBet <= 0 ||
      this.betInput.value === "" ||
      this.betInput.value.trim() === "";

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
      this.spinButton.setTextWithFontSize("BET TOO HIGH", 14);
    } else if (!context.canSpin && context.balance < context.currentBet) {
      this.spinButton.setTextWithFontSize("NO FUNDS", 18);
    } else {
      this.spinButton.setTextWithFontSize("SPIN", 18);
    }

    this.increaseBetButton.enabled =
      currentState === "idle" && context.balance >= context.currentBet + 5;

    this.decreaseBetButton.enabled =
      currentState === "idle" && context.currentBet > 1;

    this.instantPlayToggle.enabled = currentState === "idle";

    if (context.lastWin > 0 && currentState === "celebrating") {
      this.animateWin(context.lastWin);
    }
  }

  private animateWin(_winAmount: number): void {
    this.winDisplay.flash(0xf1c40f, 0.5);
    this.winDisplay.pulse(1.3, 0.4);

    this.lastWinDisplay.flash(0x2ecc71, 0.5);

    this.linesWonDisplay.flash(0xf39c12, 0.5);
    this.linesWonDisplay.pulse(1.2, 0.3);
    this.multiplierDisplay.flash(0xe74c3c, 0.5);
    this.multiplierDisplay.pulse(1.2, 0.3);
  }

  private updateWinInformation(context: GameContext): void {
    if (
      context.reelResults &&
      context.reelResults.wins &&
      context.reelResults.wins.length > 0
    ) {
      const wins = context.reelResults.wins;
      this.currentWinInfo.linesWon = wins.length;
      this.currentWinInfo.maxMultiplier = wins.reduce(
        (sum, win) => sum + win.multiplier,
        0
      );
    }

    const currentState = this.stateManager.currentState;
    const hasWins = this.currentWinInfo.linesWon > 0;
    const isShowingWins =
      currentState === "celebrating" ||
      (context.lastWin > 0 && currentState === "idle");

    if (hasWins && isShowingWins) {
      const lineText =
        this.currentWinInfo.linesWon === 1
          ? "1 LINE"
          : `${this.currentWinInfo.linesWon} LINES`;
      this.linesWonDisplay.setText(lineText);

      this.multiplierDisplay.setText(`${this.currentWinInfo.maxMultiplier}X`);

      this.linesWonDisplay.alpha = 1.0;
      this.multiplierDisplay.alpha = 1.0;
    } else if (!isShowingWins) {
      this.currentWinInfo = { linesWon: 0, maxMultiplier: 0 };
      this.linesWonDisplay.setText("0 LINES");
      this.multiplierDisplay.setText("0X");
      this.linesWonDisplay.alpha = 0.5;
      this.multiplierDisplay.alpha = 0.5;
    }
  }

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

  public get isInstantPlayEnabled(): boolean {
    return this.instantPlayToggle.isToggled;
  }

  public setInstantPlay(enabled: boolean): void {
    this.instantPlayToggle.isToggled = enabled;
  }

  public getUIDimensions(): { width: number; height: number } {
    return {
      width: this.UI_WIDTH,
      height: this.UI_HEIGHT,
    };
  }

  public simulateSpinButtonPress(): void {
    this.spinButton.simulatePress();
  }

  override destroy(): void {
    this.stateManager.unsubscribe("gameUI");
    super.destroy();
  }
}
