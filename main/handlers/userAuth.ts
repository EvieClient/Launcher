import electron, { app, Event, IpcMainEvent, webContents } from "electron";
import {
  account,
  Account,
  MicrosoftAccount,
  MicrosoftAuth,
  MojangAccount,
} from "minecraft-auth";
import * as fs from "fs";
import { GameProfile } from "@xmcl/user";
import { mainWindow } from "../background";
import { createWindow } from "../helpers";
import express from "express";
const EvieDir = `${app.getPath("appData")}/.evieclient`;
const ipc = require("electron").ipcMain;

async function signInViaMojang(username: string, password: string) {
  const account = new MojangAccount();
  try {
    await account.Login(username, password);
  } catch (error) {
    console.log(error);
    return null;
  }
  return account;
}

async function getAccountToken(): Promise<string | null> {
  // get the account token from the EvieDir with a file names accountinfo.private
  // this is a json file that contains the account token
  // the account token is used to authenticate with the minecraft server
  let accountToken = "";
  if (fs.existsSync(`${EvieDir}/accountinfo.private`)) {
    accountToken = JSON.parse(
      fs.readFileSync(`${EvieDir}/accountinfo.private`, "utf8")
    ).token;
  } else {
    throw new Error("No account token found! Please sign in, Piracy is Crime");
  }
  return accountToken;
}

async function getAccountGameProfile(): Promise<GameProfile | null> {
  // get the account token from the EvieDir with a file names accountinfo.private
  // this is a json file that contains the account token
  // the account token is used to authenticate with the minecraft server

  if (fs.existsSync(`${EvieDir}/accountinfo.private`)) {
    const json = JSON.parse(
      fs.readFileSync(`${EvieDir}/accountinfo.private`, "utf8")
    );

    const profile: GameProfile = {
      id: json.id,
      name: json.name,
    };
    return profile;
  } else {
    throw new Error("No account token found! Please sign in, Piracy is Crime");
  }
}

async function storeAccountToken(account: Account) {
  // store the account token in the EvieDir with a file names accountinfo.private
  // this is a json file that contains the account token
  // the account token is used to authenticate with the minecraft server

  // create the directory if it doesn't exist
  if (!fs.existsSync(EvieDir)) {
    fs.mkdirSync(EvieDir);
  }

  // create the accountinfo.private file if it doesn't exist
  if (!fs.existsSync(`${EvieDir}/accountinfo.private`)) {
    await account.getProfile();
    fs.writeFileSync(
      `${EvieDir}/accountinfo.private`,
      JSON.stringify({
        token: account.accessToken,
        id: account.uuid,
        name: account.username,
      })
    );
  }
}

async function signInViaMicrosoft(integratedWindow: boolean) {
  const account = new MicrosoftAccount();
  try {
    let _event: IpcMainEvent;
    let appID = "79d63740-a433-4f6d-8c3d-19f997d868b8";
    let appSecret = "ymc7Q~uH~ljrgOarWbn2eUFrlueW1txTE6rTx";
    let redirectURL = "http://localhost:9998/auth/microsoft";

    MicrosoftAuth.setup(appID, appSecret, redirectURL);

    if (integratedWindow) {
      let authwindow = createWindow("main", {
        width: 500,
        height: 500,
        resizable: false,
        autoHideMenuBar: true,
        webPreferences: {
          nodeIntegration: true,
        },
      });
      // init express router
      const app = express();
      // listen on port 9998 with the router
      const server = app.listen(9998, () => {
        console.log("listening on port 9998");
      });
      // setup express to recive requests for /auth/microsoft with a query param of code
      app.get("/auth/microsoft", async (req, res) => {
        // get the code from the query param
        const code = req.query.code;
        console.log("i received a code for a microsoft account over express");
        // verify the code is a string
        if (typeof code !== "string") {
          res
            .status(400)
            .send(
              "code is not a string, maybe don't reverse engineer this ok thx?"
            );
          return;
        }
        // verify the code is not empty
        if (code.length === 0) {
          res
            .status(400)
            .send("code is empty, maybe don't reverse engineer this ok thx?");
          return;
        }
        await account.authFlow(code);
        console.log(`${account.username} signed in`);
        console.log(`Storing account token`);
        await storeAccountToken(account);
        _event.reply("signedIn");

        res.send("all good :) close this tab").on("finish", () => {
          server.close();
        });
      });
      authwindow.loadURL(MicrosoftAuth.createUrl());
    } else {
      // init express router
      const app = express();
      // listen on port 9998 with the router
      const server = app.listen(9998, () => {
        console.log("listening on port 9998");
      });
      // setup express to recive requests for /auth/microsoft with a query param of code
      app.get("/auth/microsoft", async (req, res) => {
        // get the code from the query param
        const code = req.query.code;
        console.log("i received a code for a microsoft account over express");
        // verify the code is a string
        if (typeof code !== "string") {
          res
            .status(400)
            .send(
              "code is not a string, maybe don't reverse engineer this ok thx?"
            );
          return;
        }
        // verify the code is not empty
        if (code.length === 0) {
          res
            .status(400)
            .send("code is empty, maybe don't reverse engineer this ok thx?");
          return;
        }
        await account.authFlow(code);
        console.log(`${account.username} signed in`);
        console.log(`Storing account token`);
        await storeAccountToken(account);
        _event.reply("signedIn");

        res.status(200).send("all good :) close this tab");
        server.close();
      });
      electron.shell.openExternal(MicrosoftAuth.createUrl());
    }

    const code = await new Promise((resolve, reject) => {
      ipc.on("microsoft-code", (event, code) => {
        _event = event;
        resolve(code);
      });
    });
    await account.authFlow(code);
    console.log(`${account.username} signed in`);
    console.log(`Storing account token`);
    await storeAccountToken(account);
    _event.reply("signedIn");
  } catch (e) {
    console.error(e);
  }
}

async function signOut() {}

export {
  signInViaMojang,
  signInViaMicrosoft,
  signOut,
  getAccountToken,
  getAccountGameProfile,
};
