import {
  getVersionList,
  install,
  installForge,
  MinecraftVersion,
  installDependencies,
} from "@xmcl/installer";
import {
  MinecraftLocation,
  LaunchOption,
  Version,
  launch,
  ResolvedVersion,
} from "@xmcl/core";
import crypto from "crypto";
import unzip from "unzip";
import sevenBin from "7zip-bin";
import { extractFull, add, extract } from "node-7z";
import { app } from "electron";
import { getDownloadURL, getStorage, ref } from "firebase/storage";
import { ChildProcess } from "node:child_process";
import fs from "fs";
const fsPromises = fs.promises;
import axios, { AxiosError } from "axios";
import { getAccountGameProfile, getAccountToken } from "./userAuth";

/*
 * Global Variables
 */
const pathTo7zip = sevenBin.path7za;
const EvieClient = `${app.getPath("appData")}/.evieclient`;
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
    console.log("Java is not installed, installing...");
    try {
      await InstallJava();
    } catch (error) {
      console.log(error);
      return;
    }
  }
  /*
   * Check if .minecraft folder exists
   */
  if (!fs.existsSync(_Minecraft)) {
    console.log("Minecraft folder does not exist, creating...");
    try {
      await fsPromises.mkdir(_Minecraft, { recursive: true });
    } catch (error) {
      console.log(error);
      return;
    }
  }
  /*
   * Make sure vital folders exist
   */
  if (!fs.existsSync(`${EvieClient}/build`)) {
    console.log("Evie build folder does not exist, creating...");
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
    } catch (error) {
      console.log(error);
      return;
    }
  }
  /*
   * Verify Versions Needed
   */
  console.log("Updating EvieClient");
  //await VerifyVersionExists("1.8.9");
  await UpdateEvieClient();

  console.log("Game is installed, launching...");

  // PlayGame();
}

async function VerifyVersionExists(version: string) {
  try {
    // first check to see if the folder and json file exists
    if (!fs.existsSync(`${EvieClient}/build/versions/${version}`)) {
      // if it doesn't, download the version
      console.log(`${version} is not installed, downloading...`);
      await DownloadVersion(version);
    } else {
      // if it does, check to see if the json file is up to date
      console.log(`${version} is installed, checking for updates...`);
      const resolvedVersion: ResolvedVersion = await Version.parse(
        `${EvieClient}/build`,
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
    await install(aVersion, `${EvieClient}/build`);
  } catch (error) {
    console.log(error);
    return false;
  }
  return true;
}

async function UpdateEvieClient() {
  try {
    /*
     * Evie Mixins
     */
    const update = new Promise<void>(async (resolve, reject) => {
      console.log("Downloading Evie Mixins...");
      const storage = getStorage();
      await getDownloadURL(ref(storage, "1.8/EvieClient-1.0.0.jar")).then(
        async (url) => {
          await axios
            .get(url, { responseType: "stream" })
            .then(async (response) => {
              await response.data.pipe(
                fs.createWriteStream(
                  `${EvieClient}/build/libraries/com/evieclient/EvieClient/1.0.0/EvieClient-1.0.0.jar`
                )
              );
            })
            .catch((error: AxiosError) => {
              console.log(error);
            });
        }
      );

      /*
       * Download OptiFine
       */
      console.log("Downloading OptiFine...");

      // To download OptiFine, we need to get the download URL from the optifine.net website as the url is not static and changes every time
      // Firstly request http://optifine.net/adloadx?f=OptiFine_1.8.9_HD_U_M5.jar then parse the html to get the download link for the OptiFine jar
      await axios
        .get("http://optifine.net/adloadx?f=OptiFine_1.8.9_HD_U_M5.jar")
        .then(async (response) => {
          const html = response.data;
          // the download link is in the html as a a href link it looks like this <a href='downloadx?f=OptiFine_1.8.9_HD_U_M5.jar&x=key' onclick='onDownload()'>OptiFine 1.8.9 HD U M5</a>
          const downloadLink = html.match(
            /<a href='downloadx\?f=OptiFine_1.8.9_HD_U_M5.jar&x=(.*?)'/
          )[1];
          // now we can request the download link and pipe it to the file
          await axios
            .get(
              `http://optifine.net/downloadx?f=OptiFine_1.8.9_HD_U_M5.jar&x=${downloadLink}`,
              { responseType: "stream" }
            )
            .then(async (response) => {
              await response.data.pipe(
                fs.createWriteStream(
                  `${EvieClient}/temp/OptiFine_1.8.9_HD_U_M5.jar`
                )
              );
              // now that we have the jar, we have to move it to EvieClient/build/libraries/optifine/OptiFine/1.8.9_HD_U_M5/OptiFine_1.8.9_HD_U_M5.jar
              // and inside the jar we need to get launchwrapper-of-2.2.jar and move it to EvieClient/build/libraries/optifine/launcherwrapper-of/2.2/launchwrapper-of-2.2.jar
              // we can do this by using node-7z to extract the jar in the temp folder and then move the files to the correct folders
              await extractFull(
                `${EvieClient}/temp/OptiFine_1.8.9_HD_U_M5.jar`,
                `${EvieClient}/temp/OptiFine_1.8.9_HD_U_M5`,
                {
                  $bin: pathTo7zip,
                }
              ).on("end", async () => {
                await fsPromises.rename(
                  `${EvieClient}/temp/OptiFine_1.8.9_HD_U_M5/OptiFine_1.8.9_HD_U_M5.jar`,
                  `${EvieClient}/build/libraries/optifine/OptiFine/1.8.9_HD_U_M5/OptiFine_1.8.9_HD_U_M5.jar`
                );
                await fsPromises.rename(
                  `${EvieClient}/temp/OptiFine_1.8.9_HD_U_M5/launchwrapper-of-2.2.jar`,
                  `${EvieClient}/build/libraries/optifine/launchwrapper-of/2.2/launchwrapper-of-2.2.jar`
                );
                await fsPromises.rmdir(
                  `${EvieClient}/temp/OptiFine_1.8.9_HD_U_M5`,
                  { recursive: true }
                );
              });
            })
            .catch((error: AxiosError) => {
              console.log(error);
            });
        })
        .catch((error: AxiosError) => {
          console.log(error);
        });

      resolve();
    });
    await update;
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

async function PlayGame() {
  try {
    const opts: LaunchOption = {
      version: await Version.parse(`${EvieClient}/build`, "EvieClient"),
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
      console.log("Game Launched");
    });
    // console log the crash message
    (await proc).on("exit", (err) => {
      console.log(err);
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
          response.data.pipe(unzip.Extract({ path: javaLocation }));
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
