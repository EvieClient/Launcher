import chalk from "chalk";
import { mainWindow } from "../../background";

export class Logger {
  prefix: string;
  constructor(prefix: string) {
    this.prefix = prefix;
  }
  info(message: any) {
    console.log(
      chalk.white("[") +
        chalk.blueBright("INFO") +
        chalk.whiteBright("/") +
        chalk.greenBright(this.prefix) +
        chalk.white("]") +
        chalk.reset(),
      message
    );
  }
  err(message: any) {
    console.log(
      chalk.white("[") +
        chalk.redBright("ERROR") +
        chalk.whiteBright("/") +
        chalk.greenBright(this.prefix) +
        chalk.white("]") +
        chalk.reset(),
      message
    );
  }
  launchStatus(message: any) {
    console.log(
      chalk.white("[") +
        chalk.blueBright("LAUNCHSTATUS") +
        chalk.whiteBright("/") +
        chalk.greenBright(this.prefix) +
        chalk.white("]") +
        chalk.reset(),
      message
    );
    mainWindow.webContents.send("launch-status", message);
  }
}
