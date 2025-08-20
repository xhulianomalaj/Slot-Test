import type { PaylineConfig } from "../../../types";
import { ALL_PAYLINES } from "./Paylines";

/**
 * Complete registry of all 20 payline configurations for a 5x3 slot machine
 * Based on the provided payline pattern image
 */
export const PAYLINE_CONFIGS: PaylineConfig[] = ALL_PAYLINES;

/**
 * Get payline configuration by ID
 */
export function getPaylineConfig(id: number): PaylineConfig | undefined {
  return PAYLINE_CONFIGS.find((payline) => payline.id === id);
}

/**
 * Get all payline configurations
 */
export function getAllPaylineConfigs(): PaylineConfig[] {
  return [...PAYLINE_CONFIGS];
}

/**
 * Validate that a payline configuration is valid for a 5x3 grid
 */
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

/**
 * Get the total number of paylines
 */
export function getPaylineCount(): number {
  return PAYLINE_CONFIGS.length;
}