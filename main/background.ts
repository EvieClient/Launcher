import { app, webFrame, ipcRenderer } from "electron";
import serve from "electron-serve";
import { fetchFirebase } from "./firebase";
import Launch from "./handlers/launchGame";
import { signInViaMicrosoft, signInViaMojang } from "./handlers/userAuth";
import { createWindow } from "./helpers";

fetchFirebase();

const ipc = require("electron").ipcMain;
const isProd: boolean = process.env.NODE_ENV === "production";

if (isProd) {
  serve({ directory: "app" });
} else {
  app.setPath("userData", `${app.getPath("userData")} (development)`);
}

(async () => {
  await app.whenReady();
  const mainWindow = createWindow("main", {
    width: 1312,
    height: 806,
    resizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  if (isProd) {
    await mainWindow.loadURL("app://./home.html");
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/home`);
    // mainWindow.webContents.openDevTools();
  }
})();

ipc.on("launch-game", function (event, arg) {
  Launch();
});

ipc.on("sign-in-via-microsoft", function (event, arg) {
  signInViaMicrosoft();
});

ipc.on("sign-in-via-mojang", function (event, arg) {
  signInViaMojang(arg.username, arg.password);
});

ipc.on("sign-out", function (event, arg) {
  signInViaMojang(arg.username, arg.password);
});

app.on("window-all-closed", () => {
  app.quit();
});
