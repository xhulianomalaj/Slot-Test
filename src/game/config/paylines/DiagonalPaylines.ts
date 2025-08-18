import type { PaylineConfig } from "../../../types";

/**
 * Diagonal payline configurations (Lines 6-9)
 * These include diagonal lines and V-shaped patterns
 */
export const DIAGONAL_PAYLINES: PaylineConfig[] = [
  {
    id: 6,
    name: "Diagonal Down",
    positions: [
      { reel: 0, row: 0 },
      { reel: 1, row: 1 },
      { reel: 2, row: 2 },
      { reel: 3, row: 1 },
      { reel: 4, row: 0 },
    ],
  },
  {
    id: 7,
    name: "Diagonal Up",
    positions: [
      { reel: 0, row: 2 },
      { reel: 1, row: 1 },
      { reel: 2, row: 0 },
      { reel: 3, row: 1 },
      { reel: 4, row: 2 },
    ],
  },
  {
    id: 8,
    name: "V-Shape",
    positions: [
      { reel: 0, row: 0 },
      { reel: 1, row: 1 },
      { reel: 2, row: 2 },
      { reel: 3, row: 1 },
      { reel: 4, row: 0 },
    ],
  },
  {
    id: 9,
    name: "Inverted V-Shape",
    positions: [
      { reel: 0, row: 2 },
      { reel: 1, row: 1 },
      { reel: 2, row: 0 },
      { reel: 3, row: 1 },
      { reel: 4, row: 2 },
    ],
  },
];