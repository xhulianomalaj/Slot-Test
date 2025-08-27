/**
 * Slot Machine Game
 * 
 * Copyright (c) 2025 xhulianomalaj
 * Licensed under CC BY-NC 4.0 (Creative Commons Attribution-NonCommercial 4.0 International)
 * 
 * This work is licensed under the Creative Commons Attribution-NonCommercial 4.0 International License.
 * You may not use this material for commercial purposes.
 * 
 * For the full license, see LICENSE file or visit:
 * https://creativecommons.org/licenses/by-nc/4.0/
 */

import { GameApplication } from "./game/core/GameApplication";

async function initializeGame() {
  const canvas = document.createElement("canvas");
  canvas.id = "game-canvas";
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  canvas.style.display = "block";

  const appDiv = document.querySelector<HTMLDivElement>("#app")!;
  appDiv.innerHTML = "";
  appDiv.appendChild(canvas);

  const gameApp = new GameApplication(canvas);
  await gameApp.initialize();
}

initializeGame();
