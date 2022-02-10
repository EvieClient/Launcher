import { app, BrowserWindow } from "electron";
import serve from "electron-serve";
import { fetchFirebase } from "./firebase";
import { createWindow } from "./helpers";
import { onStart } from "./hooks/lifecycle";

fetchFirebase();
export let mainWindow: BrowserWindow;
const isProd: boolean = process.env.NODE_ENV === "production";

if (isProd) {
  serve({ directory: "app" });
} else {
  app.setPath("userData", `${app.getPath("userData")} (development)`);
}

(async () => {
  await app.whenReady();

  mainWindow = createWindow("main", {
    width: 1312,
    height: 806,
    resizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  if (isProd) {
    await mainWindow.loadURL("app://./index.html");
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/`);
    // mainWindow.webContents.openDevTools();
  }
  onStart();
})();
