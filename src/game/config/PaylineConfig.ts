/**
 * Re-export all payline configurations and utilities
 * Now using the new 20-payline system based on the provided pattern image
 */
export {
  PAYLINE_CONFIGS,
  getPaylineConfig,
  getAllPaylineConfigs,
  validatePaylineConfig,
  getPaylineCount,
} from "./paylines/PaylineRegistry";
