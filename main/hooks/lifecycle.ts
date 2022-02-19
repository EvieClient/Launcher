import "./ipc";
import "./app";
import { mainWindow } from "../background";

async function onStart() {
  mainWindow.setSize(1312, 806);
}

export { onStart };
