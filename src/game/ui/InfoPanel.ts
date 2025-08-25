import { SYMBOL_CONFIGS } from "../symbols/SymbolConfig";
import "./InfoPanel.css";

export class InfoPanel {
  private overlay?: HTMLDivElement;
  private panel?: HTMLDivElement;
  private onCloseCallback?: () => void;

  constructor(onClose?: () => void) {
    if (onClose) {
      this.onCloseCallback = onClose;
    }
  }

  public show(): void {
    this.createInfoPanel();
  }

  private createInfoPanel(): void {
    // Create overlay
    this.overlay = document.createElement("div");
    this.overlay.className = "info-panel-overlay";
    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    // Create main panel
    this.panel = document.createElement("div");
    this.panel.className = "info-panel";

    // Create panel
    this.panel = document.createElement("div");
    this.panel.className = "info-panel";

    // OPERA GX: Force inline styles immediately
    this.panel.style.cssText = `
      background: #ffffff !important;
      background-color: #ffffff !important;
      color: #000000 !important;
      border-radius: 12px !important;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
      width: 90% !important;
      max-width: 800px !important;
      max-height: 90vh !important;
      overflow: hidden !important;
      position: relative !important;
      border: 2px solid #ddd !important;
      color-scheme: light only !important;
      forced-color-adjust: none !important;
    `;

    this.panel.innerHTML = `
      <div class="info-panel-header" style="background: #ffffff !important; color: #000000 !important; padding: 20px !important; border-bottom: 1px solid #ddd !important; position: sticky !important; top: 0 !important; z-index: 1 !important;">
        <h1 style="margin: 0 !important; font-size: 24px !important; font-weight: bold !important; text-align: center !important; color: #000000 !important;">Game Information</h1>
        <button class="close-button" style="background: #dc3545 !important; color: #ffffff !important; border: none !important; border-radius: 50% !important; width: 40px !important; height: 40px !important; font-size: 24px !important; cursor: pointer !important; display: flex !important; align-items: center !important; justify-content: center !important; position: absolute !important; top: 15px !important; right: 15px !important; transition: background-color 0.2s !important;" onclick="this.closest('.info-panel-overlay').style.display='none'">&times;</button>
      </div>
      <div class="info-panel-content" style="padding: 20px !important; max-height: calc(90vh - 120px) !important; overflow-y: auto !important; line-height: 1.6 !important; background: #ffffff !important; color: #000000 !important;">
        <div class="rules-section" style="margin-bottom: 30px !important; color: #000000 !important;">
          <h2 style="color: #2c3e50 !important; margin: 0 0 15px 0 !important; font-size: 20px !important; font-weight: bold !important; border-bottom: 2px solid #3498db !important; padding-bottom: 5px !important;">How to Play</h2>
          <ul style="margin: 15px 0 !important; padding-left: 20px !important; color: #000000 !important;">
            <li style="margin: 8px 0 !important; color: #000000 !important;">Place your bet using the bet controls</li>
            <li style="margin: 8px 0 !important; color: #000000 !important;">Click the spin button to start the reels</li>
            <li style="margin: 8px 0 !important; color: #000000 !important;">Match 3 or more identical symbols, starting always from the leftmost reel on a payline to win</li>
            <li style="margin: 8px 0 !important; color: #000000 !important;">Higher bets mean bigger potential winnings</li>
            <li style="margin: 8px 0 !important; color: #000000 !important;">Check the payout table below for symbol values</li>
          </ul>
        </div>
        
        <div class="paylines-section" style="margin-bottom: 30px !important; color: #000000 !important;">
          <h2 style="color: #2c3e50 !important; margin: 0 0 15px 0 !important; font-size: 20px !important; font-weight: bold !important; border-bottom: 2px solid #3498db !important; padding-bottom: 5px !important;">Paylines</h2>
          <p style="margin-bottom: 15px !important; color: #666 !important;">The game features 20 different paylines. Match symbols along any of these patterns to win:</p>
          <div class="paylines-image-container" style="text-align: center !important; margin: 20px 0 !important; background: #f8f9fa !important; padding: 20px !important; border-radius: 8px !important; border: 1px solid #ddd !important;">
            <img src="/assets/images/paylines.png" alt="Paylines Pattern" class="paylines-image" style="max-width: 100% !important; height: auto !important; border-radius: 4px !important; filter: none !important; background: transparent !important;">
            <p style="margin-top: 10px !important; font-size: 14px !important; color: #666 !important; font-style: italic !important;">Each numbered pattern represents a different payline</p>
          </div>
        </div>
        
        <div class="payouts-section" style="color: #000000 !important;">
          <h2 style="color: #2c3e50 !important; margin: 0 0 15px 0 !important; font-size: 20px !important; font-weight: bold !important; border-bottom: 2px solid #3498db !important; padding-bottom: 5px !important;">Symbol Payouts</h2>
          <p style="margin-bottom: 15px !important; font-style: italic !important; color: #666 !important;">Multipliers are applied to your bet amount</p>
          
          <table class="payout-table" style="width: 100% !important; border-collapse: collapse !important; margin: 20px 0 !important; background: #ffffff !important; border-radius: 8px !important; overflow: hidden !important; box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;">
            <thead style="background: #000000 !important; color: #ffffff !important;">
              <tr>
                <th style="padding: 15px 12px !important; text-align: left !important; font-weight: bold !important; font-size: 16px !important; color: #ffffff !important; width: 25% !important;">Symbol</th>
                <th style="padding: 15px 12px !important; text-align: center !important; font-weight: bold !important; font-size: 14px !important; color: #ffffff !important; width: 15% !important;">3 Match</th>
                <th style="padding: 15px 12px !important; text-align: center !important; font-weight: bold !important; font-size: 14px !important; color: #ffffff !important; width: 15% !important;">4 Match</th>
                <th style="padding: 15px 12px !important; text-align: center !important; font-weight: bold !important; font-size: 14px !important; color: #ffffff !important; width: 15% !important;">5 Match</th>
              </tr>
            </thead>
            <tbody style="color: #000000 !important;">
              ${this.generatePayoutRows()}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Add close button event
    const closeButton = this.panel.querySelector(".close-button");
    closeButton?.addEventListener("click", () => this.close());

    // Add to overlay and then to document
    this.overlay.appendChild(this.panel);
    document.body.appendChild(this.overlay);

    // NUCLEAR OPTION: Force Opera GX to comply with our styling
    this.forceOperaGXStyling();
  }

  private forceOperaGXStyling(): void {
    // Multiple attempts to force styling - Opera GX is stubborn
    const attempts = [0, 10, 50, 100, 200, 500];

    attempts.forEach((delay) => {
      setTimeout(() => {
        if (!this.panel) return;

        // Method 1: Direct style manipulation
        this.panel.style.cssText = `
          background: #ffffff !important;
          background-color: #ffffff !important;
          color: #000000 !important;
          border-radius: 12px !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
          width: 90% !important;
          max-width: 800px !important;
          max-height: 90vh !important;
          overflow: hidden !important;
          position: relative !important;
          border: 2px solid #ddd !important;
          transform: translateZ(0) !important;
        `;

        // Method 2: Force all children elements
        const allElements = this.panel.querySelectorAll("*");
        allElements.forEach((element: Element) => {
          const htmlElement = element as HTMLElement;

          // Skip elements that should keep their styling
          const isCloseButton = htmlElement.classList.contains("close-button");
          const isTableHeader = htmlElement.closest("thead") !== null;
          const isMultiplier = htmlElement.classList.contains("multiplier");

          if (!isCloseButton && !isTableHeader && !isMultiplier) {
            htmlElement.style.cssText += `
              color: #000000 !important;
              background-color: transparent !important;
              -webkit-text-fill-color: #000000 !important;
              -moz-text-fill-color: #000000 !important;
              fill: #000000 !important;
            `;

            // Remove any conflicting attributes
            htmlElement.removeAttribute("data-theme");
            htmlElement.removeAttribute("data-color-scheme");
          }
        });

        // Method 3: Force specific sections
        const content = this.panel.querySelector(
          ".info-panel-content"
        ) as HTMLElement;
        if (content) {
          content.style.cssText += `
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #000000 !important;
          `;
        }

        const header = this.panel.querySelector(
          ".info-panel-header"
        ) as HTMLElement;
        if (header) {
          header.style.cssText += `
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #000000 !important;
          `;
        }

        // Method 4: Force overlay styling
        if (this.overlay) {
          this.overlay.style.cssText += `
            background-color: rgba(0, 0, 0, 0.5) !important;
          `;
        }

        // Method 5: Create an invisible white div behind the panel
        const forceBackground = document.createElement("div");
        forceBackground.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #ffffff !important;
          z-index: -1;
          width: 100%;
          height: 100%;
        `;
        this.panel.insertBefore(forceBackground, this.panel.firstChild);
      }, delay);
    });
  }

  private generatePayoutRows(): string {
    // Sort symbols by highest 5-match payout
    const sortedSymbols = [...SYMBOL_CONFIGS].sort(
      (a, b) => (b.payoutMultipliers[5] || 0) - (a.payoutMultipliers[5] || 0)
    );

    return sortedSymbols
      .map((symbol) => {
        const payout3 = symbol.payoutMultipliers[3]
          ? `${symbol.payoutMultipliers[3]}x`
          : "-";
        const payout4 = symbol.payoutMultipliers[4]
          ? `${symbol.payoutMultipliers[4]}x`
          : "-";
        const payout5 = symbol.payoutMultipliers[5]
          ? `${symbol.payoutMultipliers[5]}x`
          : "-";

        return `
        <tr style="background-color: #ffffff !important;">
          <td class="symbol-cell" style="padding: 15px 12px !important; border-bottom: 1px solid #eee !important; vertical-align: middle !important; background: #ffffff !important; color: #000000 !important;">
            <img src="${symbol.imagePath}" alt="${
          symbol.name
        }" class="symbol-image" style="width: 32px !important; height: 32px !important; object-fit: contain !important; margin-right: 12px !important; vertical-align: middle !important; filter: none !important;">
            <span class="symbol-name" style="font-weight: 500 !important; color: #000000 !important; font-size: 16px !important;">${
              symbol.name
            }</span>
          </td>
          <td class="payout-value" style="padding: 15px 12px !important; text-align: center !important; border-bottom: 1px solid #eee !important; font-weight: 500 !important; color: #000000 !important; background: #ffffff !important;">${payout3}</td>
          <td class="payout-value" style="padding: 15px 12px !important; text-align: center !important; border-bottom: 1px solid #eee !important; font-weight: 500 !important; color: #000000 !important; background: #ffffff !important;">${payout4}</td>
          <td class="payout-value payout-highest" style="padding: 15px 12px !important; text-align: center !important; border-bottom: 1px solid #eee !important; font-weight: 500 !important; color: #000000 !important; background: #ffffff !important;${
            payout5 !== "-" ? " color: #28a745 !important;" : ""
          }">${payout5}</td>
        </tr>
      `;
      })
      .join("");
  }

  private close(): void {
    if (this.overlay) {
      document.body.removeChild(this.overlay);
      delete this.overlay;
      delete this.panel;
    }

    if (this.onCloseCallback) {
      this.onCloseCallback();
    }
  }

  public destroy(): void {
    this.close();
  }
}
