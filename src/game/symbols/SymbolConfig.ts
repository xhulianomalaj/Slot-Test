import { SymbolType } from "../../types";
import type { SymbolConfig } from "../../types";

/**
 * Symbol configuration data using individual PNG files
 * Each symbol now uses its own PNG file instead of sprite sheet coordinates
 */
export const SYMBOL_CONFIGS: SymbolConfig[] = [
  {
    type: SymbolType.APPLE,
    name: "Apple",
    rarity: 0.8,
    payoutMultipliers: {
      3: 0.5,
      4: 1.0,
      5: 2.5,
    },
    imagePath: "/assets/images/symbols/Fruit Assets/Apple.png",
  },
  {
    type: SymbolType.BLUEBERRY,
    name: "Blueberry",
    rarity: 0.7,
    payoutMultipliers: {
      3: 0.75,
      4: 1.5,
      5: 3.0,
    },
    imagePath: "/assets/images/symbols/Fruit Assets/BlueBerry.png",
  },
  {
    type: SymbolType.CHERRY,
    name: "Cherry",
    rarity: 0.6,
    payoutMultipliers: {
      3: 1.0,
      4: 2.0,
      5: 4.0,
    },
    imagePath: "/assets/images/symbols/Fruit Assets/Cherry.png",
  },
  {
    type: SymbolType.COCONUT,
    name: "Coconut",
    rarity: 0.5,
    payoutMultipliers: {
      3: 1.25,
      4: 2.5,
      5: 5.0,
    },
    imagePath: "/assets/images/symbols/Fruit Assets/Coconut.png",
  },
  {
    type: SymbolType.KIWI,
    name: "Kiwi",
    rarity: 0.45,
    payoutMultipliers: {
      3: 1.5,
      4: 3.0,
      5: 6.0,
    },
    imagePath: "/assets/images/symbols/Fruit Assets/Kiwi.png",
  },
  {
    type: SymbolType.ORANGE,
    name: "Orange",
    rarity: 0.4,
    payoutMultipliers: {
      3: 2.0,
      4: 4.0,
      5: 8.0,
    },
    imagePath: "/assets/images/symbols/Fruit Assets/Orange.png",
  },
  {
    type: SymbolType.PEAR,
    name: "Pear",
    rarity: 0.3,
    payoutMultipliers: {
      3: 2.5,
      4: 5.0,
      5: 10.0,
    },
    imagePath: "/assets/images/symbols/Fruit Assets/Pear.png",
  },
  {
    type: SymbolType.STRAWBERRY,
    name: "Strawberry",
    rarity: 0.2,
    payoutMultipliers: {
      3: 3.0,
      4: 6.0,
      5: 12.0,
    },
    imagePath: "/assets/images/symbols/Fruit Assets/Strawberry.png",
  },
];

/**
 * Get symbol configuration by type
 */
export function getSymbolConfig(type: SymbolType): SymbolConfig {
  const config = SYMBOL_CONFIGS.find((config) => config.type === type);
  if (!config) {
    throw new Error(`Symbol configuration not found for type: ${type}`);
  }
  return config;
}

/**
 * Get all symbol types ordered by rarity (most common first)
 */
export function getSymbolsByRarity(): SymbolType[] {
  return SYMBOL_CONFIGS.sort((a, b) => b.rarity - a.rarity).map(
    (config) => config.type
  );
}

/**
 * Generate a random symbol based on rarity weights
 */
let randomOrderIndex = 0;
let randomCurrentReelSymbols: string[] = [];
let shouldLogSymbols = true; // Flag to control when to log symbols

export function generateRandomSymbol(): SymbolType {
  const totalWeight = SYMBOL_CONFIGS.reduce(
    (sum, config) => sum + config.rarity,
    0
  );
  let random = Math.random() * totalWeight;

  for (const config of SYMBOL_CONFIGS) {
    random -= config.rarity;
    if (random <= 0) {
      const symbolName = config.name;

      // Add console logging for random generation too
      const symbolsPerReel = 7;
      // const reelNumber = Math.floor(randomOrderIndex / symbolsPerReel) + 1;
      const positionInReel = randomOrderIndex % symbolsPerReel;

      // Only collect visible symbols (positions 1, 2, 3 are actually visible)
      if (positionInReel >= 1 && positionInReel <= 3) {
        randomCurrentReelSymbols.push(symbolName);
      }

      // When we have 3 visible symbols (complete reel), display them if logging is enabled
      if (randomCurrentReelSymbols.length === 3) {
        if (shouldLogSymbols) {
          //   `Reel ${reelNumber}: [${randomCurrentReelSymbols.join(", ")}]`
          // );
        }
        randomCurrentReelSymbols = []; // Reset for next reel
      }

      randomOrderIndex++;
      return config.type;
    }
  }

  // Fallback to first symbol if something goes wrong
  randomOrderIndex++;
  return SYMBOL_CONFIGS[0].type;
}

/**
 * Generate symbols in order for coordinate mapping
 * Cycles through all symbol types in the enum order
 */
let orderIndex = 0;
let currentReelSymbols: string[] = [];
let allGeneratedSymbols: string[] = [];
export function generateOrderedSymbol(): SymbolType {
  const symbols = Object.values(SymbolType);
  const symbol = symbols[orderIndex % symbols.length];
  const symbolName = getSymbolConfig(symbol).name;

  // Store all generated symbols
  allGeneratedSymbols.push(symbolName);

  // Each reel has 7 symbols total
  const symbolsPerReel = 7;
  // const reelNumber = Math.floor(orderIndex / symbolsPerReel) + 1;
  const positionInReel = orderIndex % symbolsPerReel;

  // Only collect visible symbols (positions 1, 2, 3 are actually visible)
  if (positionInReel >= 1 && positionInReel <= 3) {
    currentReelSymbols.push(symbolName);
  }

  // When we have 3 visible symbols (complete reel), display them if logging is enabled
  if (currentReelSymbols.length === 3) {
    if (shouldLogSymbols) {
    }
    currentReelSymbols = []; // Reset for next reel
  }

  orderIndex++;
  return symbol;
}

/**
 * Reset the order index for ordered generation
 */
export function resetOrderIndex(): void {
  orderIndex = 0;
  randomOrderIndex = 0;
  currentReelSymbols = [];
  randomCurrentReelSymbols = [];
  allGeneratedSymbols = [];
  if (shouldLogSymbols) {
  }
}

/**
 * Enable symbol logging (for initial load and after animations end)
 */
export function enableSymbolLogging(): void {
  shouldLogSymbols = true;
}

/**
 * Disable symbol logging (during spins)
 */
export function disableSymbolLogging(): void {
  shouldLogSymbols = false;
}

/**
 * Toggle for using ordered vs random symbol generation
 * Set to true temporarily for coordinate mapping
 */
export let useOrderedGeneration = false;

/**
 * Generate a symbol based on current mode (ordered or random)
 */
export function generateSymbol(): SymbolType {
  return useOrderedGeneration
    ? generateOrderedSymbol()
    : generateRandomSymbol();
}

/**
 * Toggle generation mode
 */
export function setGenerationMode(ordered: boolean): void {
  useOrderedGeneration = ordered;
  if (ordered) {
    resetOrderIndex();
  }
}

/**
 * Helper function to get symbol by name
 */
export const getSymbolByName = (name: string): SymbolConfig | undefined => {
  return SYMBOL_CONFIGS.find((config) => config.name === name);
};

/**
 * Helper to get all unique symbol names
 */
export const getAllSymbolNames = (): string[] => {
  return [...new Set(SYMBOL_CONFIGS.map((config) => config.name))];
};

/**
 * Legacy exports for backward compatibility
 */
export const SPRITE_SHEET_PATH = ""; // No longer used with individual PNGs
export const getRandomSymbol = generateRandomSymbol;
