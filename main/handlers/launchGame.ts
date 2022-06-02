import sevenBin from "7zip-bin";
import { launch, LaunchOption } from "@xmcl/core";
import { getVersionList, install, MinecraftVersion } from "@xmcl/installer";
import axios, { AxiosError } from "axios";
import { app } from "electron";
import { getDownloadURL, getStorage, ref } from "firebase/storage";
import fs from "fs";
import { ChildProcess } from "node:child_process";
import { EOL } from "os";
import * as yauzl from "yauzl";
import InstallJava from "../utils/installJava";
import { Logger } from "../utils/log/info";
import { getAccountGameProfile } from "./userAuth";
const fsPromises = fs.promises;

/*
 * Global Variables
 */
const pathTo7zip = sevenBin.path7za;
const logger = new Logger("launchGame");
export const EvieClient = `${app.getPath("appData")}/.evieclient`;
const _Minecraft = `${app.getPath("appData")}/.minecraft`;
export const javaLocation = `${app.getPath("appData")}/.evieclient/java/`;

async function Launch(server?: string) {
  /*
   * Make sure vital folders exist
   */
  logger.launchStatus("Making sure vital folders exist...");
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
      logger.launchStatus("Deleting existing temp folder...");
      await fsPromises.rm(`${EvieClient}/temp`, { recursive: true });
      logger.launchStatus("Creating new temp folder...");
      await fsPromises.mkdir(`${EvieClient}/temp`, { recursive: true });
    } else {
      logger.launchStatus("Creating temp folder...");
      await fsPromises.mkdir(`${EvieClient}/temp`, { recursive: true });
    }
  } catch (error) {
    logger.launchStatus(error);
    return;
  }
  /*
   * Check if Java is Installed
   */
  if (!fs.existsSync(`${javaLocation}/jre`)) {
    logger.launchStatus("Java is not installed, installing...");
    try {
      await InstallJava();
    } catch (error) {
      logger.launchStatus(error);
      return;
    }
  }
  /*
   * Check if .minecraft folder exists
   */
  if (!fs.existsSync(_Minecraft)) {
    logger.launchStatus("Minecraft folder does not exist, creating...");
    try {
      await fsPromises.mkdir(_Minecraft, { recursive: true });
    } catch (error) {
      logger.launchStatus(error);
      return;
    }
  }

  /*
   * Update/Verify EvieClient
   */
  logger.launchStatus("Updating EvieClient");
  await UpdateEvieClient();

  logger.launchStatus("Game is installed, launching...");
  PlayGame(server);
}

async function UpdateEvieClient() {
  try {
    /*
     * Evie Mixins
     */
    const update = new Promise<void>(async (resolve, reject) => {
      logger.launchStatus("Getting Evie Mixins...");
      const storage = getStorage();
      await getDownloadURL(ref(storage, "1.8/EvieClient-1.0.0_obf.jar"))
        .then(async (url) => {
          logger.launchStatus("Downloading Evie mixins...");
          await axios
            .get(url, {
              responseType: "stream",
              onDownloadProgress: (e: ProgressEvent) => {
                logger.launchStatus(
                  `Downloading Mixins: ${Math.round(
                    (e.loaded / e.total) * 100
                  )}%`
                );
              },
            })
            .then(async (response) => {
              logger.launchStatus("Making sure the folder exists...");
              await fsPromises.mkdir(
                `${EvieClient}/build/libraries/com/evieclient/EvieClient/1.0.0/`,
                {
                  recursive: true,
                }
              );
              logger.launchStatus("Saving Mixins...");
              await response.data.pipe(
                fs.createWriteStream(
                  `${EvieClient}/build/libraries/com/evieclient/EvieClient/1.0.0/EvieClient-1.0.0.jar`
                )
              );
            })
            .catch((error: AxiosError) => {
              logger.err(error);
            });
        })
        .then(async () => {
          logger.launchStatus("Checking if OptiFine is installed...");
          if (
            !fs.existsSync(
              `${EvieClient}/build/libraries/optifine/launchwrapper-of/2.2/launchwrapper-of-2.2.jar`
            )
          ) {
            logger.launchStatus("OptiFine is not installed, installing...");
          } else if (
            !fs.existsSync(
              `${EvieClient}/build/libraries/optifine/OptiFine/1.8.9_HD_U_M5/OptiFine-1.8.9_HD_U_M5.jar`
            )
          ) {
            logger.launchStatus("OptiFine is not installed, installing...");
          } else {
            logger.launchStatus("OptiFine is installed, skipping...");
            // return resolve(); //TODO: Fix the bug where the game doesn't launch if I don't update OptiFine every launch...
          }

          /*
           * Download OptiFine
           */
          logger.launchStatus("Fetching OptiFine Download URL...");

          // To download OptiFine, we need to get the download URL from the optifine.net website as the url is not static and changes every time
          // Firstly request http://optifine.net/adloadx?f=OptiFine_1.8.9_HD_U_M5.jar then parse the html to get the download link for the OptiFine jar
          await axios
            .get("http://optifine.net/adloadx?f=OptiFine_1.8.9_HD_U_M5.jar", {
              onDownloadProgress: (e: ProgressEvent) => {
                logger.launchStatus(
                  `Getting OptiFine Download URL: ${Math.round(
                    (e.loaded / e.total) * 100
                  )}%`
                );
              },
            })
            .then(async (response) => {
              const html = response.data;
              // the download link is in the html as a a href link it looks like this <a href='downloadx?f=OptiFine_1.8.9_HD_U_M5.jar&x=key' onclick='onDownload()'>OptiFine 1.8.9 HD U M5</a>
              logger.launchStatus("Looking for download link...");
              const downloadLink = html.match(
                /<a href='downloadx\?f=OptiFine_1.8.9_HD_U_M5.jar&x=(.*?)'/
              )[1];
              // now we can request the download link and pipe it to the file
              logger.launchStatus(
                `Downloading OptiFine from https://optifine.net/downloadx?f=OptiFine_1.8.9_HD_U_M5.jar&x=${downloadLink}...`
              );
              await axios
                .get(
                  //https://optifine.net/downloadx?f=OptiFine_1.9.0_HD_U_I5.jar&x=example
                  `https://optifine.net/downloadx?f=OptiFine_1.8.9_HD_U_M5.jar&x=${downloadLink}`,
                  {
                    responseType: "stream",
                    onDownloadProgress: (e: ProgressEvent) => {
                      logger.launchStatus(
                        `Downloading OptiFine: ${Math.round(
                          (e.loaded / e.total) * 100
                        )}%`
                      );
                    },
                  }
                )
                .then(async (response) => {
                  logger.launchStatus("Saving OptiFine...");
                  await response.data.pipe(
                    fs
                      .createWriteStream(
                        `${EvieClient}/temp/OptiFine_1.8.9_HD_U_M5.jar`
                      )
                      .on("finish", async () => {
                        logger.launchStatus("OptiFine Saved");
                        // now that we have the jar, we have to move it to EvieClient/build/libraries/optifine/OptiFine/1.8.9_HD_U_M5/OptiFine_1.8.9_HD_U_M5.jar
                        // and inside the jar we need to get launchwrapper-of-2.2.jar and move it to EvieClient/build/libraries/optifine/launcherwrapper-of/2.2/launchwrapper-of-2.2.jar
                        // we can do this by using node-7z to extract the jar in the temp folder and then move the files to the correct folders
                        logger.launchStatus("Extracting OptiFine...");
                        await fsPromises.mkdir(
                          `${EvieClient}/temp/OptiFine_1.8.9_HD_U_M5`,
                          {
                            recursive: true,
                          }
                        );

                        yauzl.open(
                          `${EvieClient}/temp/OptiFine_1.8.9_HD_U_M5.jar`,
                          { lazyEntries: true },
                          function (err, zipfile) {
                            if (err) throw err;
                            zipfile.readEntry();
                            zipfile.on("entry", function (entry) {
                              if (/\/$/.test(entry.fileName)) {
                                // Directory file names end with '/'.
                                // Note that entries for directories themselves are optional.
                                // An entry's fileName implicitly requires its parent directories to exist.
                                zipfile.readEntry();
                              } else {
                                // file entry
                                zipfile.openReadStream(
                                  entry,
                                  function (err, readStream) {
                                    if (err) throw err;
                                    readStream.on("end", function () {
                                      zipfile.readEntry();
                                    });
                                    logger.info(`${entry.fileName}`);
                                    if (
                                      entry.fileName ===
                                      "launchwrapper-of-2.2.jar"
                                    ) {
                                      readStream
                                        .pipe(
                                          fs.createWriteStream(
                                            `${EvieClient}/build/libraries/optifine/launchwrapper-of/2.2/launchwrapper-of-2.2.jar`
                                          )
                                        )
                                        .on("finish", async () => {
                                          await fsPromises.rename(
                                            `${EvieClient}/temp/OptiFine_1.8.9_HD_U_M5.jar`,
                                            `${EvieClient}/build/libraries/optifine/OptiFine/1.8.9_HD_U_M5/OptiFine-1.8.9_HD_U_M5.jar`
                                          );
                                          return resolve();
                                        });
                                    } else {
                                      zipfile.readEntry();
                                    }
                                  }
                                );
                              }
                            });
                          }
                        );
                      })
                  );
                });
            })
            .catch((error: AxiosError) => {
              logger.err(error);
            });
        })
        .catch((error: AxiosError) => {
          logger.err(error);
        });
    });
    await update;
    return true;
  } catch (error) {
    logger.err(error);
    return false;
  }
}

async function PlayGame(server?: string) {
  logger.launchStatus("Fetching Account...");
  const account = await getAccountGameProfile();
  // install 1.8.9
  logger.launchStatus("Finding 1.8.9...");
  const list: MinecraftVersion[] = (await getVersionList()).versions;

  const aVersion: MinecraftVersion = list.find(
    (version) => version.id === "1.8.9"
  );
  logger.launchStatus("Installing 1.8.9...");
  await install(aVersion, `${EvieClient}/build/`);
  logger.launchStatus("Installed 1.8.9");

  // Make sure the EvieClient version directory exists
  logger.launchStatus("Making EvieClient version directory...");
  await fsPromises.mkdir(`${EvieClient}/build/versions/Evie`, {
    recursive: true,
  });
  logger.launchStatus("It exists now, I think");
  logger.launchStatus("Updating EvieClient launch script...");
  const launcherJson = await axios
    .get("https://huntrissus.evie.pw/api/getLauncherJson")
    .then((response) => response.data);
  await fsPromises.writeFile(
    `${EvieClient}/build/versions/Evie/Evie.json`,
    JSON.stringify(launcherJson, null, 2)
  );

  try {
    const opts: LaunchOption = {
      version: "Evie",
      javaPath: `${EvieClient}/java/jre/jdk8u322-b06-jre/bin/java.exe`,
      gamePath: `${EvieClient}/build`,
      gameProfile: account.profile,
      accessToken: account.accessToken,
      // minMemory: (os.freemem() / 1024 / 1024 / 2.5) | 0,
      // maxMemory: (os.freemem() / 1024 / 1024 / 2.5) | 0,

      extraExecOption: {
        detached: true,
      },
      extraJVMArgs:
        `-XX:+UseG1GC -Dsun.rmi.dgc.server.gcInterval=2147483646 -XX:+UnlockExperimentalVMOptions -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 -XX:MaxGCPauseMillis=25 -XX:G1HeapRegionSize=32M`.split(
          " "
        ),
    };

    if (server != null) {
      opts.server = { ip: server };
    }

    const proc: Promise<ChildProcess> = launch(opts);
    proc.then((child) => {
      logger.launchStatus("Game Launched");
      app.quit();
    });
    // console log the crash message

    (await proc).stderr?.on("data", (buf: any) => {
      // console.log(...buf.toString().split(EOL)); if the log contains account.accessToken then replace it with [REDACTED]
      console.log(
        ...buf
          .toString()
          .replaceAll(account.accessToken, "[REDACTED]")
          .split(EOL)
      );
    });
    (await proc).stdout?.on("data", (buf: any) => {
      console.log(
        ...buf
          .toString()
          .replaceAll(account.accessToken, "[REDACTED]")
          .split(EOL)
      );
    });
    (await proc).stdin?.on("data", (buf: any) => {
      console.log(
        ...buf
          .toString()
          .replaceAll(account.accessToken, "[REDACTED]")
          .split(EOL)
      );
    });

    (await proc).on("exit", (err) => {
      logger.launchStatus("Closed Game");
      logger.err(`Close Code: ${err}`);
    });
  } catch (error) {
    logger.err("*** uh oh ***");
    logger.launchStatus("Game Launch Failed!");
    logger.err("*** uh oh ***");

    logger.err(error);
    return false;
  }
  return true;
}

export default Launch;
