import type { PaylineConfig } from "../../../types";
import { ALL_PAYLINES } from "./Paylines";

export const PAYLINE_CONFIGS: PaylineConfig[] = ALL_PAYLINES;

export function getPaylineConfig(id: number): PaylineConfig | undefined {
  return PAYLINE_CONFIGS.find((payline) => payline.id === id);
}

export function getAllPaylineConfigs(): PaylineConfig[] {
  return [...PAYLINE_CONFIGS];
}

export function validatePaylineConfig(payline: PaylineConfig): boolean {
  if (payline.positions.length !== 5) {
    return false;
  }

  for (const position of payline.positions) {
    if (
      position.reel < 0 ||
      position.reel > 4 ||
      position.row < 0 ||
      position.row > 2
    ) {
      return false;
    }
  }

  return true;
}

export function getPaylineCount(): number {
  return PAYLINE_CONFIGS.length;
}
