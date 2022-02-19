import React from "react";
import electron from "electron";
import { Tooltip } from "@mui/material";

function Staff() {
  React.useEffect(() => {
    electron.ipcRenderer?.send("fetch-versions");
  }, []);
  return (
    <div className="container mx-auto sm:px-4">
      <br />

      <div className="flex items-center">
        <span className="text-center text-xs">secret staff menu lol</span>
      </div>
    </div>
  );
}
export default Staff;
