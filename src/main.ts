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
