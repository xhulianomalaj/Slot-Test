# Slot Game

A TypeScript slot machine game built with PixiJS v8, XState v5, and GSAP.

## Features

- 5-reel, 3-row slot machine with 25 paylines
- Smooth animations using GSAP
- State management with XState v5
- Audio effects with pixi-sound
- Full TypeScript support with strict mode

## Technology Stack

- **PixiJS v8**: Graphics rendering and display object management
- **TypeScript**: Type safety and modern JavaScript features
- **XState v5**: Finite state machine for game state management
- **GSAP**: High-performance animations and tweening
- **pixi-sound**: Audio management and sound effects
- **Vite**: Development server and build tooling

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── assets/          # Game assets (images, sounds)
├── components/      # Reusable game components
├── game/           # Core game logic and state
├── types/          # TypeScript type definitions
└── utils/          # Utility functions
```