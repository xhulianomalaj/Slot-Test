import type { PaylineConfig } from "../../../types";

/**
 * Zigzag payline configurations (Lines 10-25)
 * These include complex patterns like W-shapes, M-shapes, arrows, and other zigzag patterns
 */
export const ZIGZAG_PAYLINES: PaylineConfig[] = [
  {
    id: 10,
    name: "Zigzag 1",
    positions: [
      { reel: 0, row: 1 },
      { reel: 1, row: 0 },
      { reel: 2, row: 1 },
      { reel: 3, row: 0 },
      { reel: 4, row: 1 },
    ],
  },
  {
    id: 11,
    name: "Zigzag 2",
    positions: [
      { reel: 0, row: 1 },
      { reel: 1, row: 2 },
      { reel: 2, row: 1 },
      { reel: 3, row: 2 },
      { reel: 4, row: 1 },
    ],
  },
  {
    id: 12,
    name: "W-Shape 1",
    positions: [
      { reel: 0, row: 0 },
      { reel: 1, row: 2 },
      { reel: 2, row: 0 },
      { reel: 3, row: 2 },
      { reel: 4, row: 0 },
    ],
  },
  {
    id: 13,
    name: "W-Shape 2",
    positions: [
      { reel: 0, row: 2 },
      { reel: 1, row: 0 },
      { reel: 2, row: 2 },
      { reel: 3, row: 0 },
      { reel: 4, row: 2 },
    ],
  },
  {
    id: 14,
    name: "M-Shape 1",
    positions: [
      { reel: 0, row: 2 },
      { reel: 1, row: 0 },
      { reel: 2, row: 1 },
      { reel: 3, row: 0 },
      { reel: 4, row: 2 },
    ],
  },
  {
    id: 15,
    name: "M-Shape 2",
    positions: [
      { reel: 0, row: 0 },
      { reel: 1, row: 2 },
      { reel: 2, row: 1 },
      { reel: 3, row: 2 },
      { reel: 4, row: 0 },
    ],
  },
  {
    id: 16,
    name: "Step Up",
    positions: [
      { reel: 0, row: 2 },
      { reel: 1, row: 2 },
      { reel: 2, row: 1 },
      { reel: 3, row: 0 },
      { reel: 4, row: 0 },
    ],
  },
  {
    id: 17,
    name: "Step Down",
    positions: [
      { reel: 0, row: 0 },
      { reel: 1, row: 0 },
      { reel: 2, row: 1 },
      { reel: 3, row: 2 },
      { reel: 4, row: 2 },
    ],
  },
  {
    id: 18,
    name: "Crown 1",
    positions: [
      { reel: 0, row: 1 },
      { reel: 1, row: 0 },
      { reel: 2, row: 0 },
      { reel: 3, row: 0 },
      { reel: 4, row: 1 },
    ],
  },
  {
    id: 19,
    name: "Crown 2",
    positions: [
      { reel: 0, row: 1 },
      { reel: 1, row: 2 },
      { reel: 2, row: 2 },
      { reel: 3, row: 2 },
      { reel: 4, row: 1 },
    ],
  },
  {
    id: 20,
    name: "Arrow Up",
    positions: [
      { reel: 0, row: 2 },
      { reel: 1, row: 1 },
      { reel: 2, row: 0 },
      { reel: 3, row: 0 },
      { reel: 4, row: 0 },
    ],
  },
  {
    id: 21,
    name: "Arrow Down",
    positions: [
      { reel: 0, row: 0 },
      { reel: 1, row: 1 },
      { reel: 2, row: 2 },
      { reel: 3, row: 2 },
      { reel: 4, row: 2 },
    ],
  },
  {
    id: 22,
    name: "Bowtie 1",
    positions: [
      { reel: 0, row: 0 },
      { reel: 1, row: 1 },
      { reel: 2, row: 1 },
      { reel: 3, row: 1 },
      { reel: 4, row: 2 },
    ],
  },
  {
    id: 23,
    name: "Bowtie 2",
    positions: [
      { reel: 0, row: 2 },
      { reel: 1, row: 1 },
      { reel: 2, row: 1 },
      { reel: 3, row: 1 },
      { reel: 4, row: 0 },
    ],
  },
  {
    id: 24,
    name: "Lightning 1",
    positions: [
      { reel: 0, row: 0 },
      { reel: 1, row: 0 },
      { reel: 2, row: 1 },
      { reel: 3, row: 2 },
      { reel: 4, row: 1 },
    ],
  },
  {
    id: 25,
    name: "Lightning 2",
    positions: [
      { reel: 0, row: 2 },
      { reel: 1, row: 2 },
      { reel: 2, row: 1 },
      { reel: 3, row: 0 },
      { reel: 4, row: 1 },
    ],
  },
];