import type { PaylineConfig } from "../../../types";

/**
 * All 20 payline configurations based on the provided pattern image
 * Each payline represents a specific path through the 5x3 reel grid
 */
export const ALL_PAYLINES: PaylineConfig[] = [
  // Payline 1: Middle row straight
  {
    id: 1,
    name: "Middle Line",
    positions: [
      { reel: 0, row: 1 },
      { reel: 1, row: 1 },
      { reel: 2, row: 1 },
      { reel: 3, row: 1 },
      { reel: 4, row: 1 },
    ],
  },
  // Payline 2: Top row straight
  {
    id: 2,
    name: "Top Line",
    positions: [
      { reel: 0, row: 0 },
      { reel: 1, row: 0 },
      { reel: 2, row: 0 },
      { reel: 3, row: 0 },
      { reel: 4, row: 0 },
    ],
  },
  // Payline 3: Bottom row straight
  {
    id: 3,
    name: "Bottom Line",
    positions: [
      { reel: 0, row: 2 },
      { reel: 1, row: 2 },
      { reel: 2, row: 2 },
      { reel: 3, row: 2 },
      { reel: 4, row: 2 },
    ],
  },
  // Payline 4: V-shape (top-middle-bottom-middle-top)
  {
    id: 4,
    name: "V-Shape",
    positions: [
      { reel: 0, row: 0 },
      { reel: 1, row: 1 },
      { reel: 2, row: 2 },
      { reel: 3, row: 1 },
      { reel: 4, row: 0 },
    ],
  },
  // Payline 5: Inverted V-shape (bottom-middle-top-middle-bottom)
  {
    id: 5,
    name: "Inverted V-Shape",
    positions: [
      { reel: 0, row: 2 },
      { reel: 1, row: 1 },
      { reel: 2, row: 0 },
      { reel: 3, row: 1 },
      { reel: 4, row: 2 },
    ],
  },
  // Payline 6: Top-bottom zigzag
  {
    id: 6,
    name: "Top-Bottom Zigzag",
    positions: [
      { reel: 0, row: 0 },
      { reel: 1, row: 0 },
      { reel: 2, row: 1 },
      { reel: 3, row: 2 },
      { reel: 4, row: 2 },
    ],
  },
  // Payline 7: Bottom-top zigzag
  {
    id: 7,
    name: "Bottom-Top Zigzag",
    positions: [
      { reel: 0, row: 2 },
      { reel: 1, row: 2 },
      { reel: 2, row: 1 },
      { reel: 3, row: 0 },
      { reel: 4, row: 0 },
    ],
  },
  // Payline 8: W-shape (middle-top-middle-top-middle)
  {
    id: 8,
    name: "W-Shape",
    positions: [
      { reel: 0, row: 1 },
      { reel: 1, row: 0 },
      { reel: 2, row: 1 },
      { reel: 3, row: 0 },
      { reel: 4, row: 1 },
    ],
  },
  // Payline 9: M-shape (middle-bottom-middle-bottom-middle)
  {
    id: 9,
    name: "M-Shape",
    positions: [
      { reel: 0, row: 1 },
      { reel: 1, row: 2 },
      { reel: 2, row: 1 },
      { reel: 3, row: 0 },
      { reel: 4, row: 1 },
    ],
  },
  // Payline 10: Top-middle-bottom-bottom-bottom
  {
    id: 10,
    name: "Top Down Slope",
    positions: [
      { reel: 0, row: 0 },
      { reel: 1, row: 1 },
      { reel: 2, row: 1 },
      { reel: 3, row: 1 },
      { reel: 4, row: 2 },
    ],
  },
  // Payline 11: Bottom-middle-top-top-top
  {
    id: 11,
    name: "Bottom Up Slope",
    positions: [
      { reel: 0, row: 2 },
      { reel: 1, row: 1 },
      { reel: 2, row: 1 },
      { reel: 3, row: 1 },
      { reel: 4, row: 0 },
    ],
  },
  // Payline 12: Middle-Top-Top-Bottom-Bottom pattern
  {
    id: 12,
    name: "Complex Zigzag",
    positions: [
      { reel: 0, row: 1 },
      { reel: 1, row: 0 },
      { reel: 2, row: 0 },
      { reel: 3, row: 1 },
      { reel: 4, row: 2 },
    ],
  },
  // Payline 13: Bottom-bottom-middle-top-top
  {
    id: 13,
    name: "Early Rise",
    positions: [
      { reel: 0, row: 1 },
      { reel: 1, row: 2 },
      { reel: 2, row: 2 },
      { reel: 3, row: 1 },
      { reel: 4, row: 0 },
    ],
  },
  // Payline 14: Top-middle-middle-middle-bottom
  {
    id: 14,
    name: "Late Drop",
    positions: [
      { reel: 0, row: 1 },
      { reel: 1, row: 1 },
      { reel: 2, row: 0 },
      { reel: 3, row: 1 },
      { reel: 4, row: 2 },
    ],
  },
  // Payline 15: Bottom-middle-middle-middle-top
  {
    id: 15,
    name: "Late Rise",
    positions: [
      { reel: 0, row: 1 },
      { reel: 1, row: 1 },
      { reel: 2, row: 2 },
      { reel: 3, row: 1 },
      { reel: 4, row: 0 },
    ],
  },
  // Payline 16: Top-top-middle-bottom-middle
  {
    id: 16,
    name: "Dip Pattern",
    positions: [
      { reel: 0, row: 0 },
      { reel: 1, row: 0 },
      { reel: 2, row: 1 },
      { reel: 3, row: 2 },
      { reel: 4, row: 1 },
    ],
  },
  // Payline 17: Bottom-bottom-middle-top-middle
  {
    id: 17,
    name: "Peak Pattern",
    positions: [
      { reel: 0, row: 2 },
      { reel: 1, row: 2 },
      { reel: 2, row: 1 },
      { reel: 3, row: 0 },
      { reel: 4, row: 1 },
    ],
  },
  // Payline 18: Middle-top-middle-bottom-bottom
  {
    id: 18,
    name: "Early Peak Drop",
    positions: [
      { reel: 0, row: 1 },
      { reel: 1, row: 0 },
      { reel: 2, row: 1 },
      { reel: 3, row: 2 },
      { reel: 4, row: 2 },
    ],
  },
  // Payline 19: Middle-bottom-middle-top-top
  {
    id: 19,
    name: "Early Dip Rise",
    positions: [
      { reel: 0, row: 1 },
      { reel: 1, row: 2 },
      { reel: 2, row: 1 },
      { reel: 3, row: 0 },
      { reel: 4, row: 0 },
    ],
  },
  // Payline 20: Top-top-top-middle-bottom
  {
    id: 20,
    name: "Late Slope Down",
    positions: [
      { reel: 0, row: 0 },
      { reel: 1, row: 0 },
      { reel: 2, row: 0 },
      { reel: 3, row: 1 },
      { reel: 4, row: 2 },
    ],
  },
];
