import { mainWindow } from "../background";

function log(message: any) {
  this.prefix = `LaunchStatus:`;
  console.log(this.prefix, message);
  mainWindow.webContents.send("launch-status", message);
}

function err(message: any) {
  this.prefix = `LaunchStatus:`;
  console.log(this.prefix, message);
  mainWindow.webContents.send("launch-err", message);
}

export { log, err };
