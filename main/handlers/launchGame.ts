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
import fs from "fs";
const fsPromises = fs.promises;
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
  await VerifyVersionExists("1.8.9");
  await UpdateEvieClient();

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

async function UpdateEvieClient() {
  try {
    // if the folder EvieClient/versions/EvieClient does not exist, download the version
    if (!fs.existsSync(`${EvieClient}/versions/EvieClient`)) {
      console.log("EvieClient is not installed, downloading...");
      fs.mkdirSync(`${EvieClient}/versions/EvieClient`);
    }
    console.log("EvieClient is installed, updating...");
    const storage = getStorage();
    getDownloadURL(ref(storage, "1.8/EvieClient.jar")).then(async (url) => {
      await axios
        .get(url, { responseType: "stream" })
        .then(async (response) => {
          // save file in EvieClient/versions/EvieClient
          await response.data.pipe(
            fs.createWriteStream(
              `${EvieClient}/versions/EvieClient/EvieClient.jar`
            )
          );
        })
        .catch((error: AxiosError) => {
          console.log(error);
        });
    });

    // unzip EvieClient/versions/1.8.9/1.8.9.jar and EvieClient/versions/EvieClient/EvieClient.jar
    // then move the unzipped files to EvieClient/temp/BuildData/
    // then zip the files in EvieClient/temp/BuildData/ and move them to EvieClient/versions/1.8.9/EvieClient.jar
    // then delete EvieClient/temp/BuildData/

    // if the folder EvieClient/versions/EvieClient/temp does not exist, create it
    if (!fs.existsSync(`${EvieClient}/versions/EvieClient/temp`)) {
      fs.mkdirSync(`${EvieClient}/versions/EvieClient/temp`);
    }

    // if the folder EvieClient/versions/EvieClient/temp/BuildData does not exist, create it
    if (!fs.existsSync(`${EvieClient}/versions/EvieClient/temp/BuildData`)) {
      fs.mkdirSync(`${EvieClient}/versions/EvieClient/temp/BuildData`);
    }

    // unzip EvieClient/versions/EvieClient/EvieClient.jar to EvieClient/versions/EvieClient/temp/
    fs.createReadStream(`${EvieClient}/versions/EvieClient/EvieClient.jar`)
      .pipe(
        unzipper.Extract({
          path: `${EvieClient}/versions/EvieClient/temp/BuildData`,
        })
      )
      .promise()
      .then(async () => {
        // move the unzipped files to EvieClient/versions/EvieClient/temp/BuildData/
        // every file in EvieClient/versions/EvieClient/temp/BuildData/
        for (let file of fs.readdirSync(
          `${EvieClient}/versions/EvieClient/temp/BuildData`
        )) {
          // move the file to EvieClient/versions/EvieClient/temp/BuildData/
          fs.renameSync(
            `${EvieClient}/versions/EvieClient/temp/BuildData/${file}`,
            `${EvieClient}/versions/EvieClient/temp/BuildData/${file.replace(
              "EvieClient",
              "EvieClient-1.8.9"
            )}`
          );
        }
      });
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
