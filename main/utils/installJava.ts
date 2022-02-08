import axios, { AxiosError } from "axios";
import { javaLocation } from "../handlers/launchGame";
import * as LaunchStatus from "../utils/LaunchStatus";
import os from "os";
import fs from "fs";
import crypto from "crypto";
import sevenBin from "7zip-bin";
import { extract } from "node-7z";
const fsPromises = fs.promises;

async function InstallJava() {
  try {
    // MacOS JRE https://github.com/adoptium/temurin8-binaries/releases/download/jdk8u322-b06/OpenJDK8U-jre_x64_mac_hotspot_8u322b06.tar.gz  | SHA256 42d4ada88e39b0f222ffdcf3c833f442af22852687992997eca82c573e65b86f
    // Win   JRE https://github.com/adoptium/temurin8-binaries/releases/download/jdk8u322-b06/OpenJDK8U-jre_x64_windows_hotspot_8u322b06.zip | SHA256 d270fc127296784307d76052d7acbd65c7e5dbf48c1cbdddabe3923c56ec60a0
    if (os.platform() === "win32") {
      const url =
        "https://github.com/adoptium/temurin8-binaries/releases/download/jdk8u322-b06/OpenJDK8U-jre_x64_windows_hotspot_8u322b06.zip";
      const sha256 =
        "d270fc127296784307d76052d7acbd65c7e5dbf48c1cbdddabe3923c56ec60a0";
      const path = `${javaLocation}/jre.zip`;
      LaunchStatus.log("Downloading Windows JRE...");
      await axios
        .get(url, { responseType: "arraybuffer" })
        .then(async (response) => {
          const data = response.data;
          const hash = crypto.createHash("sha256");
          hash.update(data);
          const digest = hash.digest("hex");

          if (sha256 !== digest) {
            LaunchStatus.log("Invalid checksum");
            LaunchStatus.err(`Expected ${sha256} but got ${digest}`);

            throw new Error("Invalid checksum");
          }
          await new Promise<void>((resolve, reject) => {
            const file = fs.createWriteStream(path);
            file.on("finish", () => {
              file.close();
              resolve();
            });
            file.on("error", (err) => {
              file.close();
              reject(err);
            });
            file.write(data);
          });
          await new Promise<void>((resolve, reject) => {
            LaunchStatus.log("Extracting JRE...");

            extract(path, javaLocation, {
              $bin: sevenBin.path7za,
            }).on("end", () => {
              resolve();
            });
          });
          await new Promise<void>((resolve, reject) => {
            fs.unlink(path, (err) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });
          });
          LaunchStatus.log("Java Installed");
        })
        .catch((err: AxiosError) => {
          LaunchStatus.log("Java Install Failed");
          console.error(err);
        });
    } else if (os.platform() === "darwin") {
      const url =
        "https://github.com/adoptium/temurin8-binaries/releases/download/jdk8u322-b06/OpenJDK8U-jre_x64_mac_hotspot_8u322b06.tar.gz";
      const sha256 =
        "42d4ada88e39b0f222ffdcf3c833f442af22852687992997eca82c573e65b86f";
      const path = `${javaLocation}/jre.tar.gz`;
      LaunchStatus.log("Downloading MacOS JRE...");

      await axios
        .get(url, { responseType: "arraybuffer" })
        .then(async (response) => {
          const data = response.data;
          const hash = crypto.createHash("sha256");
          hash.update(data);
          const digest = hash.digest("hex");

          if (sha256 !== digest) {
            LaunchStatus.log("Invalid checksum");
            LaunchStatus.err(`Expected ${sha256} but got ${digest}`);

            throw new Error("Invalid checksum");
          }
          await new Promise<void>((resolve, reject) => {
            const file = fs.createWriteStream(path);
            file.on("finish", () => {
              file.close();
              resolve();
            });
            file.on("error", (err) => {
              file.close();
              reject(err);
            });
            file.write(data);
          });
          await new Promise<void>((resolve, reject) => {
            LaunchStatus.log("Extracting JRE...");

            extract(path, javaLocation, {
              $bin: sevenBin.path7za,
            }).on("end", () => {
              resolve();
            });
          });
          await new Promise<void>((resolve, reject) => {
            fs.unlink(path, (err) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });
          });
          LaunchStatus.log("Java Installed");
        })
        .catch((err: AxiosError) => {
          LaunchStatus.log("Java Install Failed");
          console.error(err);
        });
    } else {
      LaunchStatus.log("Unsupported OS");
      console.error("Unsupported platform");
    }
  } catch (error) {
    LaunchStatus.err(error);
    return false;
  }
}

export default InstallJava;
