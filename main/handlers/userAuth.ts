import electron, { app } from "electron";
import {
  account,
  Account,
  MicrosoftAccount,
  MicrosoftAuth,
  MojangAccount,
} from "minecraft-auth";
import * as fs from "fs";
import { GameProfile } from "@xmcl/user";
import { createWindow } from "../helpers";
import { bgExpressServer } from "../utils/bgExpressServer";
import { Logger } from "../utils/log/info";
import axios from "axios";
import { mainWindow } from "../background";
const EvieDir = `${app.getPath("appData")}/.evieclient`;

const logger = new Logger("userAuth");
let currentSession: MicrosoftAccount | null = null;

async function getAccountGameProfile(): Promise<{
  profile: GameProfile;
  accessToken: string;
} | null> {
  // get the account token from the EvieDir with a file names accountinfo.private
  // this is a json file that contains the account token
  // the account token is used to authenticate with the minecraft server

  if (fs.existsSync(`${EvieDir}/accountinfo.private`)) {
    const json = JSON.parse(
      fs.readFileSync(`${EvieDir}/accountinfo.private`, "utf8")
    );

    if (currentSession) {
      logger.info(`Using cached session: ${currentSession.username}`);

      await currentSession.getProfile();
      return {
        profile: currentSession.profile,
        accessToken: currentSession.accessToken,
      };
    }
    logger.info(`Refreshing access token...`);

    const res = await axios.get(
      `https://evie.pw/api/auth/refreshToken?refresh=${json.refreshToken}&access=${json.accessToken}`
    );

    logger.info(`Refreshed access token!`);
    const data = res.data;
    fs.writeFileSync(`${EvieDir}/accountinfo.private`, JSON.stringify(data));

    let appID = "79d63740-a433-4f6d-8c3d-19f997d868b8";
    let redirectURL = "http://localhost:9998/auth/microsoft";

    MicrosoftAuth.setup(appID, null, redirectURL);

    const account = new MicrosoftAccount();

    account.accessToken = data.accessToken;
    account.refreshToken = data.refreshToken;
    account.username = data.username;
    account.uuid = data.uuid;
    logger.info(`Got profile for ${account.username}(${account.uuid})!`);

    if (await account.checkValidToken()) {
      logger.info("Valid token");
    } else {
      logger.info("Invalid token");
      throw new Error("Account Token Invalid!");
    }

    const profile: GameProfile = {
      id: account.uuid,
      name: account.username,
    };
    currentSession = account;
    return {
      profile: profile,
      accessToken: account.accessToken,
    };
  } else {
    throw new Error("No account token found!");
  }
}

async function storeAccountToken(account: MicrosoftAccount) {
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
        accessToken: account.accessToken,
        refreshToken: account.refreshToken,
      })
    );
  } else {
    // replace the accountinfo.private file with the new account token
    fs.writeFileSync(
      `${EvieDir}/accountinfo.private`,
      JSON.stringify({
        accessToken: account.accessToken,
        refreshToken: account.refreshToken,
      })
    );
  }
}

async function signInViaMicrosoft(integratedWindow: boolean) {
  const account = new MicrosoftAccount();
  try {
    let appID = "79d63740-a433-4f6d-8c3d-19f997d868b8";
    let redirectURL = "http://localhost:9998/auth/microsoft";

    MicrosoftAuth.setup(appID, null, redirectURL);

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

    await axios
      .get(`https://evie.pw/api/auth/processCode?code=${code}`)
      .then((response) => {
        if (response.status === 200) {
          account.accessToken = response.data.access_token;
          account.refreshToken = response.data.refresh_token;
          account.username = response.data.username;
          account.uuid = response.data.user_id;
          storeAccountToken(account);
        } else {
          throw new Error("Failed to process code!");
        }
      });

    logger.info(`${account.username} signed in!`);
    mainWindow.webContents.send("go-home");
  } catch (e) {
    console.error(e);
  }
}

async function signOut() {
  if (fs.existsSync(`${EvieDir}/accountinfo.private`)) {
    await fs.promises.unlink(`${EvieDir}/accountinfo.private`);
  }
}

export { signInViaMicrosoft, signOut, getAccountGameProfile };
