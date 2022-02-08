import electron, { app } from "electron";
import * as bgStatus from "../utils/log/bgStatus";
import {
  Account,
  MicrosoftAccount,
  MicrosoftAuth,
  MojangAccount,
} from "minecraft-auth";
import * as fs from "fs";
import { GameProfile } from "@xmcl/user";
import { createWindow } from "../helpers";
import { bgExpressServer } from "../utils/bgExpressServer";
const EvieDir = `${app.getPath("appData")}/.evieclient`;

async function signInViaMojang(username: string, password: string) {
  const account = new MojangAccount();
  try {
    await account.Login(username, password);
    await account.getProfile();
    bgStatus.auth(`Storing new account token for ${account.username}`);
    await storeAccountToken(account);
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
    throw new Error("No account token found!");
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
      authwindow.loadURL(MicrosoftAuth.createUrl());
    } else {
      electron.shell.openExternal(MicrosoftAuth.createUrl());
    }
    const code = await new Promise((resolve, reject) => {
      bgExpressServer.events.on("microsoft-code", (code) => {
        resolve(code);
      });
    });
    await account.authFlow(code);
    await account.getProfile();
    bgStatus.auth(`Storing new account token for ${account.username}`);
    await storeAccountToken(account);
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
