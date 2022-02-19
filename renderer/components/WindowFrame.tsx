import {
  ChevronDoubleDownIcon,
  ChevronDownIcon,
  XCircleIcon,
  XIcon,
} from "@heroicons/react/outline";
import { Tooltip } from "@mui/material";
import electron from "electron";
function WindowFrame() {
  return (
    <div className="drag w-full h-7 bg-gray-900">
      <div className="flex justify-end items-center">
        <a
          className="no-drag"
          onClick={() => {
            electron.ipcRenderer.send("minimize-window");
          }}
        >
          <Tooltip title="Minimize" arrow>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <ChevronDownIcon />
            </svg>
          </Tooltip>
        </a>
        <a
          className="no-drag"
          onClick={() => {
            window.close();
          }}
        >
          <Tooltip title="Close" arrow>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <XIcon />
            </svg>
          </Tooltip>
        </a>
      </div>
    </div>
  );
}

export default WindowFrame;
