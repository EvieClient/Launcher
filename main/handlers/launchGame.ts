import {
  getVersionList,
  install,
  MinecraftVersion,
  installDependencies,
  installForge,
} from "@xmcl/installer";
import { launch } from "../utils/launch/core/dist/index.esm";
import { LaunchOption, Version, ResolvedVersion } from "@xmcl/core";
import unzip from "unzip";
import sevenBin from "7zip-bin";
import { extract } from "node-7z";
import { app } from "electron";
import { getDownloadURL, getStorage, ref } from "firebase/storage";
import { ChildProcess } from "node:child_process";
import fs from "fs";
const fsPromises = fs.promises;
import axios, { AxiosError } from "axios";
import { getAccountGameProfile, getAccountToken } from "./userAuth";
import * as LaunchStatus from "../utils/LaunchStatus";

/*
 * Global Variables
 */
const pathTo7zip = sevenBin.path7za;
export const EvieClient = `${app.getPath("appData")}/.evieclient`;
const _Minecraft = `${app.getPath("appData")}/.minecraft`;
const javaLocation = `${app.getPath("appData")}/.evieclient/java/`;
const jreLegacy = `${app.getPath(
  "appData"
)}/.evieclient/java/jre-legacy/bin/java.exe`;

async function Launch() {
  /*
   * Check if Java is Installed
   */
  if (!fs.existsSync(jreLegacy)) {
    LaunchStatus.log("Java is not installed, installing...");
    try {
      await InstallJava();
    } catch (error) {
      LaunchStatus.log(error);
      return;
    }
  }
  /*
   * Check if .minecraft folder exists
   */
  if (!fs.existsSync(_Minecraft)) {
    LaunchStatus.log("Minecraft folder does not exist, creating...");
    try {
      await fsPromises.mkdir(_Minecraft, { recursive: true });
    } catch (error) {
      LaunchStatus.log(error);
      return;
    }
  }
  /*
   * Make sure vital folders exist
   */
  LaunchStatus.log("Making sure vital folders exist...");
  try {
    await fsPromises.mkdir(
      `${EvieClient}/build/libraries/com/evieclient/EvieClient/1.0.0`,
      { recursive: true }
    );
    await fsPromises.mkdir(
      `${EvieClient}/build/libraries/optifine/launchwrapper-of/2.2`,
      { recursive: true }
    );
    await fsPromises.mkdir(
      `${EvieClient}/build/libraries/optifine/OptiFine/1.8.9_HD_U_M5`,
      { recursive: true }
    );
    // if temp folder exists delete it and recreate it otherwise create it
    if (fs.existsSync(`${EvieClient}/temp`)) {
      LaunchStatus.log("Deleting existing temp folder...");
      await fsPromises.rm(`${EvieClient}/temp`, { recursive: true });
      LaunchStatus.log("Creating new temp folder...");
      await fsPromises.mkdir(`${EvieClient}/temp`, { recursive: true });
    } else {
      LaunchStatus.log("Creating temp folder...");
      await fsPromises.mkdir(`${EvieClient}/temp`, { recursive: true });
    }
  } catch (error) {
    LaunchStatus.log(error);
    return;
  }

  /*
   * Update/Verify EvieClient
   */
  LaunchStatus.log("Updating EvieClient");
  await UpdateEvieClient();

  LaunchStatus.log("Game is installed, launching...");
  PlayGame();
}

async function UpdateEvieClient() {
  try {
    /*
     * Evie Mixins
     */
    const update = new Promise<void>(async (resolve, reject) => {
      LaunchStatus.log("Getting Evie Mixins...");
      const storage = getStorage();
      await getDownloadURL(ref(storage, "1.8/EvieClient-1.0.0.jar")).then(
        async (url) => {
          LaunchStatus.log("Downloading Evie mixins...");
          await axios
            .get(url, {
              responseType: "stream",
              onDownloadProgress: (e: ProgressEvent) => {
                LaunchStatus.log(
                  `Downloading Mixins: ${Math.round(
                    (e.loaded / e.total) * 100
                  )}%`
                );
              },
            })
            .then(async (response) => {
              LaunchStatus.log("Making sure the folder exists...");
              await fsPromises.mkdir(
                `${EvieClient}/build/libraries/com/evieclient/EvieClient/1.0.0/`,
                {
                  recursive: true,
                }
              );
              LaunchStatus.log("Saving Mixins...");
              await response.data.pipe(
                fs.createWriteStream(
                  `${EvieClient}/build/libraries/com/evieclient/EvieClient/1.0.0/EvieClient-1.0.0.jar`
                )
              );
            })
            .catch((error: AxiosError) => {
              LaunchStatus.err(error);
            });
        }
      );

      LaunchStatus.log("Checking if OptiFine is installed...");
      if (
        !fs.existsSync(
          `${EvieClient}/build/libraries/optifine/launchwrapper-of/2.2/launchwrapper-of-2.2.jar`
        )
      ) {
        LaunchStatus.log("OptiFine is not installed, installing...");
      } else if (
        !fs.existsSync(
          `${EvieClient}/build/libraries/optifine/OptiFine/1.8.9_HD_U_M5/OptiFine-1.8.9_HD_U_M5.jar`
        )
      ) {
        LaunchStatus.log("OptiFine is not installed, installing...");
      } else {
        LaunchStatus.log("OptiFine is installed, not skipping...");
        // return resolve(); TODO: Fix the bug where the game doesn't launch if I don't update OptiFine every launch...
      }

      /*
       * Download OptiFine
       */
      LaunchStatus.log("Fetching OptiFine Download URL...");

      // To download OptiFine, we need to get the download URL from the optifine.net website as the url is not static and changes every time
      // Firstly request http://optifine.net/adloadx?f=OptiFine_1.8.9_HD_U_M5.jar then parse the html to get the download link for the OptiFine jar
      await axios
        .get("http://optifine.net/adloadx?f=OptiFine_1.8.9_HD_U_M5.jar", {
          onDownloadProgress: (e: ProgressEvent) => {
            LaunchStatus.log(
              `Getting OptiFine Download URL: ${Math.round(
                (e.loaded / e.total) * 100
              )}%`
            );
          },
        })
        .then(async (response) => {
          const html = response.data;
          // the download link is in the html as a a href link it looks like this <a href='downloadx?f=OptiFine_1.8.9_HD_U_M5.jar&x=key' onclick='onDownload()'>OptiFine 1.8.9 HD U M5</a>
          LaunchStatus.log("Looking for download link...");
          const downloadLink = html.match(
            /<a href='downloadx\?f=OptiFine_1.8.9_HD_U_M5.jar&x=(.*?)'/
          )[1];
          // now we can request the download link and pipe it to the file
          LaunchStatus.log(
            `Downloading OptiFine from https://optifine.net/downloadx?f=OptiFine_1.8.9_HD_U_M5.jar&x=${downloadLink}...`
          );
          await axios
            .get(
              //https://optifine.net/downloadx?f=OptiFine_1.9.0_HD_U_I5.jar&x=example
              `https://optifine.net/downloadx?f=OptiFine_1.8.9_HD_U_M5.jar&x=${downloadLink}`,
              {
                responseType: "stream",
                onDownloadProgress: (e: ProgressEvent) => {
                  LaunchStatus.log(
                    `Downloading OptiFine: ${Math.round(
                      (e.loaded / e.total) * 100
                    )}%`
                  );
                },
              }
            )
            .then(async (response) => {
              LaunchStatus.log("Saving OptiFine...");
              await response.data.pipe(
                fs
                  .createWriteStream(
                    `${EvieClient}/temp/OptiFine_1.8.9_HD_U_M5.jar`
                  )
                  .on("finish", async () => {
                    LaunchStatus.log("OptiFine Saved");
                    // now that we have the jar, we have to move it to EvieClient/build/libraries/optifine/OptiFine/1.8.9_HD_U_M5/OptiFine_1.8.9_HD_U_M5.jar
                    // and inside the jar we need to get launchwrapper-of-2.2.jar and move it to EvieClient/build/libraries/optifine/launcherwrapper-of/2.2/launchwrapper-of-2.2.jar
                    // we can do this by using node-7z to extract the jar in the temp folder and then move the files to the correct folders
                    LaunchStatus.log("Extracting OptiFine...");
                    await fsPromises.mkdir(
                      `${EvieClient}/temp/OptiFine_1.8.9_HD_U_M5`,
                      {
                        recursive: true,
                      }
                    );
                    extract(
                      `${EvieClient}/temp/OptiFine_1.8.9_HD_U_M5.jar`,
                      `${EvieClient}/temp/OptiFine_1.8.9_HD_U_M5`,
                      {
                        $bin: pathTo7zip,
                      }
                    ).on("end", async () => {
                      LaunchStatus.log("Moving OptiFine...");
                      await fsPromises.rename(
                        `${EvieClient}/temp/OptiFine_1.8.9_HD_U_M5/launchwrapper-of-2.2.jar`,
                        `${EvieClient}/build/libraries/optifine/launchwrapper-of/2.2/launchwrapper-of-2.2.jar`
                      );
                      await fsPromises.rename(
                        `${EvieClient}/temp/OptiFine_1.8.9_HD_U_M5.jar`,
                        `${EvieClient}/build/libraries/optifine/OptiFine/1.8.9_HD_U_M5/OptiFine-1.8.9_HD_U_M5.jar`
                      );
                      resolve();
                    });
                  })
              );
            })
            .catch((error: AxiosError) => {
              LaunchStatus.err(error);
            });
        })
        .catch((error: AxiosError) => {
          LaunchStatus.err(error);
        });
    });
    await update;
    return true;
  } catch (error) {
    LaunchStatus.err(error);
    return false;
  }
}

async function PlayGame() {
  // install 1.8.9
  LaunchStatus.log("Finding 1.8.9...");
  const list: MinecraftVersion[] = (await getVersionList()).versions;

  const aVersion: MinecraftVersion = list.find(
    (version) => version.id === "1.8.9"
  );
  LaunchStatus.log("Installing 1.8.9...");
  await install(aVersion, `${EvieClient}/build/`);
  LaunchStatus.log("Installed 1.8.9");

  // Make sure the EvieClient version directory exists
  LaunchStatus.log("Making EvieClient version directory...");
  await fsPromises.mkdir(`${EvieClient}/build/versions/EvieClient`, {
    recursive: true,
  });
  LaunchStatus.log("It exists now, I think");
  LaunchStatus.log("Updating EvieClient launch script...");
  const launcherJson = await axios
    .get("https://evie.pw/api/getLauncherJson")
    .then((response) => response.data);
  await fsPromises.writeFile(
    `${EvieClient}/build/versions/EvieClient/EvieClient.json`,
    JSON.stringify(launcherJson, null, 2)
  );

  try {
    const opts: LaunchOption = {
      version: "EvieClient",
      javaPath: jreLegacy,
      gamePath: `${EvieClient}/build`,
      gameProfile: await getAccountGameProfile(),
      accessToken: await getAccountToken(),
      extraExecOption: {
        detached: true,
      },
    };
    const proc: Promise<ChildProcess> = launch(opts);
    proc.then((child) => {
      LaunchStatus.log("Game Launched");
    });
    // console log the crash message
    (await proc).on("exit", (err) => {
      LaunchStatus.log(err);
    });
  } catch (error) {
    LaunchStatus.err("*** uh oh ***");
    LaunchStatus.log("Game Launch Failed!");
    LaunchStatus.err("*** uh oh ***");

    LaunchStatus.err(error);
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
          response.data.pipe(unzip.Extract({ path: javaLocation }));
          response.data.on("finish", () => {
            LaunchStatus.log("Java installed");
          });
        })
        .catch((error: AxiosError) => {
          LaunchStatus.err(error);
        });
    });
  } catch (error) {
    LaunchStatus.err(error);
    return false;
  }
  return true;
}

export default Launch;
