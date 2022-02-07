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

async function signInViaMicrosoft() {
  const account = new MicrosoftAccount();
  try {
    let _event: IpcMainEvent;
    let appID = "79d63740-a433-4f6d-8c3d-19f997d868b8";
    let appSecret = "ymc7Q~uH~ljrgOarWbn2eUFrlueW1txTE6rTx";
    let redirectURL = "http://localhost/auth";
    MicrosoftAuth.setup(appID, appSecret, redirectURL);
    console.log(MicrosoftAuth.createUrl());
    const code = await new Promise((resolve, reject) => {
      ipc.on("code", (event, code) => {
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
