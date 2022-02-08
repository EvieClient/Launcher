import electron from "electron";
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<string>
) {
  const code = req.query.code;
  console.log("i got a code lol");

  electron.ipcRenderer.send("microsoft-code", code);
  res.status(200).send("all good :)");
}
