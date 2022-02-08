import os from "os";
import { javaLocation } from "../handlers/launchGame";
import downloadArchive from "./downloadArchive";
import * as LaunchStatus from "./log/LaunchStatus";

async function InstallJava() {
  try {
    // MacOS JRE https://github.com/adoptium/temurin8-binaries/releases/download/jdk8u322-b06/OpenJDK8U-jre_x64_mac_hotspot_8u322b06.tar.gz  | SHA256 42d4ada88e39b0f222ffdcf3c833f442af22852687992997eca82c573e65b86f
    // Win   JRE https://github.com/adoptium/temurin8-binaries/releases/download/jdk8u322-b06/OpenJDK8U-jre_x64_windows_hotspot_8u322b06.zip | SHA256 d270fc127296784307d76052d7acbd65c7e5dbf48c1cbdddabe3923c56ec60a0
    if (os.platform() === "win32") {
      const url =
        "https://github.com/adoptium/temurin8-binaries/releases/download/jdk8u322-b06/OpenJDK8U-jre_x64_windows_hotspot_8u322b06.zip";
      const sha256 =
        "d270fc127296784307d76052d7acbd65c7e5dbf48c1cbdddabe3923c56ec60a0";
      const path = `${javaLocation}/jre`;
      LaunchStatus.log("Downloading Windows JRE...");
      await downloadArchive(url, sha256, path);
    } else if (os.platform() === "darwin") {
      const url =
        "https://github.com/adoptium/temurin8-binaries/releases/download/jdk8u322-b06/OpenJDK8U-jre_x64_mac_hotspot_8u322b06.tar.gz";
      const sha256 =
        "42d4ada88e39b0f222ffdcf3c833f442af22852687992997eca82c573e65b86f";
      const path = `${javaLocation}/jre`;
      LaunchStatus.log("Downloading MacOS JRE...");
      await downloadArchive(url, sha256, path);
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
