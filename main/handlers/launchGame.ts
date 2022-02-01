import {
  getVersionList,
  install,
  installDependencies,
  installForge,
  MinecraftVersion,
} from "@xmcl/installer";
import {
  MinecraftLocation,
  launch,
  LaunchOption,
  Version,
  ResolvedVersion,
} from "@xmcl/core";
import { app } from "electron";
import { getDownloadURL, getStorage, ref } from "firebase/storage";
import { ChildProcess } from "node:child_process";
import * as fs from "fs";
import * as unzipper from "unzipper";
import axios, { AxiosError } from "axios";
import { getAccountGameProfile, getAccountToken } from "./userAuth";
/*
 * Global Variables
 */
const EvieClient = `${app.getPath("appData")}/.evieclient/game`;
const javaLocation = `${app.getPath("appData")}/.evieclient/java/`;
const jreLegacy = `${app.getPath(
  "appData"
)}/.evieclient/java/jre-legacy/bin/java.exe`;
const forgeVersion = `1.8.9-forge1.8.9-11.15.1.2318-1.8.9`;

async function Launch() {
  /*
   * Check if Java is Installed
   */
  if (!fs.existsSync(jreLegacy)) {
    console.log("Java is not installed, installing...");
    try {
      await InstallJava();
    } catch (error) {
      console.log(error);
      return;
    }
  }
  /*
   * Verify Versions Needed
   */
  console.log("Updating EvieClient");
  await DownloadForgeLoader();
  await VerifyVersionExists("1.8.9");

  console.log("Game is installed, launching...");
  // launch game
  PlayGame();
}

async function VerifyVersionExists(version: string) {
  try {
    // first check to see if the folder and json file exists
    if (!fs.existsSync(`${EvieClient}/versions/${version}`)) {
      // if it doesn't, download the version
      console.log(`${version} is not installed, downloading...`);
      await DownloadVersion(version);
    } else {
      // if it does, check to see if the json file is up to date
      console.log(`${version} is installed, checking for updates...`);
      const resolvedVersion: ResolvedVersion = await Version.parse(
        EvieClient,
        version
      );
      await installDependencies(resolvedVersion);
    }
  } catch (error) {
    console.log(error);
    return false;
  }

  return true;
}

async function DownloadVersion(versionId: string) {
  try {
    const list: MinecraftVersion[] = (await getVersionList()).versions;
    const aVersion: MinecraftVersion = list.find(
      (version: MinecraftVersion) => version.id === versionId
    );
    await install(aVersion, EvieClient);
  } catch (error) {
    console.log(error);
    return false;
  }
  return true;
}

async function DownloadForgeLoader() {
  try {
    await installForge(
      { version: "11.15.1.2318", mcversion: "1.8.9" },
      EvieClient
    );
  } catch (error) {
    console.log(error);
    return false;
  }
  return true;
}

async function PlayGame() {
  try {
    const opts: LaunchOption = {
      version: "1.8.9",
      javaPath: jreLegacy,
      gamePath: EvieClient,
      gameProfile: await getAccountGameProfile(),
      accessToken: await getAccountToken(),
      extraExecOption: {
        detached: true,
      },
    };
    const proc: Promise<ChildProcess> = launch(opts);
    proc.then((child) => {
      console.log("Game Launched");
    });
  } catch (error) {
    console.log(error);
    return false;
  }
  return true;
}

async function InstallJava() {
  try {
    const storage = getStorage();
    getDownloadURL(ref(storage, "java/jre-legacy.zip")).then(async (url) => {
      //download the url using axios then extract it
      await axios
        .get(url, { responseType: "stream" })
        .then(async (response) => {
          response.data.pipe(unzipper.Extract({ path: javaLocation }));
          response.data.on("finish", () => {
            console.log("Java installed");
          });
        })
        .catch((error: AxiosError) => {
          console.log(error);
        });
    });
  } catch (error) {
    console.log(error);
    return false;
  }
  return true;
}

export default Launch;
