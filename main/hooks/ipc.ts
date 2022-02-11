import axios, { AxiosError } from "axios";
import electron from "electron";
import { mainWindow } from "../background";
import Launch from "../handlers/launchGame";
import {
  getAccountGameProfile,
  signInViaMicrosoft,
  signOut,
} from "../handlers/userAuth";
import * as pkg from "../../package.json";

const ipc = require("electron").ipcMain;

ipc.on("launch-game", function (event, arg) {
  Launch();
});

ipc.on("sign-in-via-microsoft", function (event, arg: boolean) {
  signInViaMicrosoft(arg);
});

ipc.on("sign-out", function (event, arg) {
  signOut();
});

ipc.on("fetch-versions", function (event, arg) {
  mainWindow.webContents.send("fetch-versions-reply", {
    version: pkg.version,
    chromeVersion: electron.app.getVersion(),
    electronVersion: process.versions.electron,
  });
});

ipc.on("fetch-user-info", async function (event, arg) {
  try {
    const profile = await getAccountGameProfile();
    mainWindow.webContents.send("fetch-user-info-reply", {
      id: profile.profile.id,
      name: profile.profile.name,
      valid: true,
    });
  } catch (e) {
    mainWindow.webContents.send("fetch-user-info-reply", {
      id: "",
      name: "",
      valid: false,
    });
  }
});

ipc.on("fetch-news", async function (event, arg) {
  await axios
    .get("https://evie.pw/api/getNews")
    .then((response) => {
      const posts: Post[] = response.data;
      mainWindow.webContents.send("fetch-news-reply", posts);
    })
    .catch((error: AxiosError) => {
      console.log(error);
    });
});

type Post = {
  id: number;
  title: string;
  imageURL: string;
  description: string;
  date: string;
};
export {};
