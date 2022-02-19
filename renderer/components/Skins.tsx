import React from "react";
import electron from "electron";
import { Tooltip } from "@mui/material";

function Skins() {
  React.useEffect(() => {
    electron.ipcRenderer?.send("fetch-versions");
  }, []);
  return (
    <div className="container mx-auto sm:px-4">
      <br />

      <div className="flex items-center">
        <Tooltip
          title="im a single dev and i should really start working more on the actual client and not the launcher ¯\_(ツ)_/¯.. but expect a skin editor, skin preset manager, and skin market to order custom skins from designers here soon."
          arrow
        >
          <span className="text-center text-5xl">soon!</span>
        </Tooltip>
      </div>
    </div>
  );
}
export default Skins;
