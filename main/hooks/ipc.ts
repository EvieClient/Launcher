import axios, { AxiosError } from "axios";
import { mainWindow } from "../background";
import Launch from "../handlers/launchGame";
import {
  signInViaMicrosoft,
  signInViaMojang,
  signOut,
} from "../handlers/userAuth";

const ipc = require("electron").ipcMain;

ipc.on("launch-game", function (event, arg) {
  Launch();
});

ipc.on("sign-in-via-microsoft", function (event, arg: boolean) {
  signInViaMicrosoft(arg);
});

ipc.on("sign-in-via-mojang", function (event, arg) {
  signInViaMojang(arg.username, arg.password);
});

ipc.on("sign-out", function (event, arg) {
  signOut();
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
