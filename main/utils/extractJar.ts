import { ChildProcess, exec } from "node:child_process";

/*
 * Helper function to extract a jar file to the specified directory using the jar xf command tool from the java folder.
 * When the jar file is extracted, the function fires a callback function called "end" to indicate that the extraction is complete.
 * @param {string} jarFilePath - The path to the jar file to extract.
 * @param {string} destinationPath - The path to the directory to extract the jar file to.
 * @param {function} end - The callback function to fire when the extraction is complete.
 */
export async function extractJar(
  jarFilePath: string,
  extraArgs: string,
  end: () => void
): Promise<void> {
  // when theres a space in the directory path, it needs to be escaped with a backslash
  const escapedJarFilePath = jarFilePath.replace(/ /g, "\\ ");

  let command: string = `jar xf ${escapedJarFilePath} ${extraArgs}`;
  let child: ChildProcess = exec(
    command,
    (error: Error, stdout: string, stderr: string) => {
      if (error) {
        console.log("Error Extracting Jar: " + error);
      }
      end();
      return;
    }
  );
}
