import { app } from "electron";
import { mainWindow } from "../background";
import { autoUpdater } from "../handlers/updater";

app.on("window-all-closed", () => {
  app.quit();
});

app.on("ready", () => {
  autoUpdater.checkForUpdatesAndNotify();
});

export {};
