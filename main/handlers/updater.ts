import { autoUpdater } from "electron-updater";
import { Logger } from "../utils/log/info";

const logger = new Logger("updater");

autoUpdater.on("checking-for-update", () => {
  logger.info("Checking for an update...");
});
autoUpdater.on("update-available", (info) => {
  logger.info("Update available.");
});
autoUpdater.on("update-not-available", (info) => {
  logger.info("Update not available.");
});
autoUpdater.on("error", (err) => {
  logger.info("Error in auto-updater.");
  logger.err(err);
});
autoUpdater.on("download-progress", (progressObj) => {
  logger.info(
    `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred} + '/' + ${progressObj.total})`
  );
});
autoUpdater.on("update-downloaded", (info) => {
  logger.info("Update downloaded");
  autoUpdater.quitAndInstall();
});

export { autoUpdater };
