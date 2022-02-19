import axios, { AxiosResponse } from "axios";
import { EvieClient } from "../handlers/launchGame";
import fs from "fs";
import * as yauzl from "yauzl";
import crypto from "crypto";
import { Logger } from "./log/info";
const fsPromises = fs.promises;

const logger = new Logger("downloadArchive");

export default async function downloadArchive(
  url: string,
  sha256: string,
  path: string
) {
  const res: AxiosResponse = await axios.get(url, {
    responseType: "stream",
    onDownloadProgress: (progress: ProgressEvent) => {
      logger.launchStatus(
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
    logger.launchStatus(`SHA256 mismatch: ${fileHash} !== ${sha256}`);
    await fsPromises.unlink(tempFile);
    throw new Error(`SHA256 mismatch: ${fileHash} !== ${sha256}`);
  }

  await new Promise<void>((resolve, reject) => {
    logger.launchStatus("Extracting file...");
    yauzl.open(tempFile, { lazyEntries: true }, (err, zipfile) => {
      if (err) {
        reject(err);
        return;
      }
      zipfile.readEntry();
      zipfile.on("entry", async (entry: yauzl.Entry) => {
        if (/\/$/.test(entry.fileName)) {
          // directory file names end with '/'
          await fsPromises.mkdir(`${path}/${entry.fileName}`, {
            recursive: true,
          });
          zipfile.readEntry();
        } else {
          // file entry
          const file = fs.createWriteStream(`${path}/${entry.fileName}`);
          zipfile.openReadStream(entry, (err, readStream) => {
            if (err) {
              reject(err);
              return;
            }
            readStream.pipe(file);
          });
          zipfile.readEntry();
        }
      });
      zipfile.once("end", () => {
        logger.launchStatus("Extraction complete.");
        resolve();
      });
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
