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
import { extractFull, add } from "node-7z";
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
   * Check if Evie temp folder exists
   */
  if (!fs.existsSync(`${EvieClient}/temp`)) {
    console.log("Evie temp folder does not exist, creating...");
    try {
      await fsPromises.mkdir(`${EvieClient}/temp`, { recursive: true });
    } catch (error) {
      console.log(error);
      return;
    }
  }
  /*
   * Check if Evie build folder exists
   */
  if (!fs.existsSync(`${EvieClient}/build`)) {
    console.log("Evie build folder does not exist, creating...");
    try {
      await fsPromises.mkdir(`${EvieClient}/build`, { recursive: true });
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
  //await UpdateEvieClient();

  console.log("Game is installed, launching...");

  PlayGame();
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
    // wrap everything in a promise
    const update = new Promise<void>(async (resolve, reject) => {
      console.log("Downloading Evie Patch...");
      const storage = getStorage();
      await getDownloadURL(ref(storage, "1.8/EvieClient.jar")).then(
        async (url) => {
          await axios
            .get(url, { responseType: "stream" })
            .then(async (response) => {
              await response.data.pipe(
                fs.createWriteStream(`${EvieClient}/temp/patch.jar`)
              );
            })
            .catch((error: AxiosError) => {
              console.log(error);
            });
        }
      );

      /*
       * To compile the EvieClient jar, we need to merge the patch.jar with the 1.8.9 jar,
       * Start by unzipping the 1.8.9 jar to a temp folder and then unzipping the patch.jar to a temp folder as well
       * Then we need to merge the two jars together
       */
      console.log("Unzipping 1.8.9 jar...");
      const patch = `${EvieClient}/temp/patch.jar`;
      const minecraft = `${_Minecraft}/versions/1.8.9/1.8.9.jar`;
      console.log("Unzipping patch.jar...");
      extractFull(minecraft, `${EvieClient}/temp`, {
        $bin: pathTo7zip,
      })
        .on("progress", (progress) => {
          console.log(
            `1.8.9 Class Files Extracted ${Math.round(
              (progress.percent / 100) * 100
            )}%`
          );
        })
        .on("end", async () => {
          console.log("Merging patch.jar with 1.8.9 jar...");
          extractFull(patch, `${EvieClient}/temp`, {
            $bin: pathTo7zip,
          })
            .on("progress", (progress) => {
              console.log(
                `EvieClient Patch Class Files Extracted ${Math.round(
                  (progress.percent / 100) * 100
                )}%`
              );
            })
            .on("end", async () => {
              console.log("Compiling EvieClient...");
              console.log("Deleteing patch.jar...");
              await fsPromises.unlink(`${EvieClient}/temp/patch.jar`);
              console.log("Copying class files...");
              add(`${EvieClient}/build/EvieClient.jar`, `${EvieClient}/temp/`, {
                $bin: pathTo7zip,
              }).on("end", async () => {
                /*
                 * After the patch.jar is merged with the 1.8.9 jar, setup the EvieClient folder
                 */
                console.log("Setting up EvieClient folder...");
                await fsPromises.mkdir(`${EvieClient}/build/versions/1.8.9`, {
                  recursive: true,
                });
                /*
                 * Grab the 1.8.9.json file and copy it to the build folder
                 */
                console.log("Copying 1.8.9.json to build folder...");
                await fsPromises.copyFile(
                  `${_Minecraft}/versions/1.8.9/1.8.9.json`,
                  `${EvieClient}/build/versions/1.8.9/1.8.9.json`
                );
                console.log("Copying EvieClient.jar to build folder...");
                /*
                 * Move EvieClient.jar to 1.8.9.jar
                 */
                console.log("Moving EvieClient.jar to 1.8.9.jar...");
                await fsPromises.rename(
                  `${EvieClient}/build/EvieClient.jar`,
                  `${EvieClient}/build/versions/1.8.9/1.8.9.jar`
                );
                /*
                 * Remove sha1 key from 1.8.9.json as we just mixed the two jars together
                 */
                console.log("Fixing 1.8.9.json...");
                const json = JSON.parse(
                  await fsPromises.readFile(
                    `${EvieClient}/build/versions/1.8.9/1.8.9.json`,
                    "utf8"
                  )
                );
                const fileBuffer = fs.readFileSync(
                  `${EvieClient}/build/versions/1.8.9/1.8.9.jar`
                );
                const sha1 = crypto
                  .createHash("sha1")
                  .update(fileBuffer)
                  .digest("hex");
                delete json.assetIndex.sha1;
                delete json.assetIndex.url;
                json.downloads.client.sha1 = sha1;
                await fsPromises.writeFile(
                  `${EvieClient}/build/versions/1.8.9/1.8.9.json`,
                  JSON.stringify(json, null, 2)
                );
                /*
                 * Clean up temp folder
                 */
                console.log("Cleaning Up...");
                await fsPromises.rm(`${EvieClient}/temp`, {
                  recursive: true,
                });
                console.log("EvieClient Updated!");
                resolve();
              });
            });
        });
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
