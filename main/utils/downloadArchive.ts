import axios, { AxiosResponse } from "axios";
import { EvieClient } from "../handlers/launchGame";
import * as LaunchStatus from "./log/LaunchStatus";
import fs from "fs";
import crypto from "crypto";
import sevenBin from "7zip-bin";
import { extract } from "node-7z";
const fsPromises = fs.promises;

export default async function downloadArchive(
  url: string,
  sha256: string,
  path: string
) {
  const res: AxiosResponse = await axios.get(url, {
    responseType: "stream",
    onDownloadProgress: (progress: ProgressEvent) => {
      LaunchStatus.log(
        `Downloading ${Math.round((progress.loaded / progress.total) * 100)}%`
      );
    },
  });
  const tempFile = `${EvieClient}/temp/dl/${Date.now()}.archive`;
  await fsPromises.mkdir(`${EvieClient}/temp/dl`, { recursive: true });

  const file = fs.createWriteStream(tempFile);
  res.data.pipe(file);
  await new Promise((resolve, reject) => {
    file.on("finish", resolve);
    file.on("error", reject);
  });
  file.close();

  const hash = crypto.createHash("sha256");
  const fileStream = fs.createReadStream(tempFile);
  fileStream.on("data", (data) => hash.update(data));
  await new Promise((resolve, reject) => {
    fileStream.on("end", resolve);
    fileStream.on("error", reject);
  });
  const fileHash = hash.digest("hex");
  if (fileHash !== sha256) {
    LaunchStatus.err(`SHA256 mismatch: ${fileHash} !== ${sha256}`);
    await fsPromises.unlink(tempFile);
    throw new Error(`SHA256 mismatch: ${fileHash} !== ${sha256}`);
  }

  await new Promise<void>((resolve, reject) => {
    LaunchStatus.log("Extracting file...");
    extract(tempFile, path, {
      $bin: sevenBin.path7za,
    }).on("end", () => {
      resolve();
    });
  });
  await new Promise<void>((resolve, reject) => {
    fs.unlink(tempFile, (err) => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
}
