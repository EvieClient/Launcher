import electron from "electron";
import { useState } from "react";
function Launch() {
  const [status, setStatus] = useState("");

  electron.ipcRenderer?.on("launch-status", (event, arg) => {
    setStatus(arg);
  });

  return (
    <section className="p-36 bg-[url('/images/puryan.png')]  bg-center">
      <div className="flex flex-col items-center justify-center">
        <a
          onClick={() => {
            const ipcRenderer = electron.ipcRenderer;
            ipcRenderer.send("launch-game");
          }}
          className="hover:scale-110 transition-all duration-200 ease-in-out hover:drop-shadow-2xl"
        >
          <button
            id="button"
            type="submit"
            className="transition-all duration-500 ease-in-out bg-blue-600 shadow-xl hover:bg-blue-400 hover:shadow-lg hover:shadow-indigo-500 text-white font-bold rounded-full p-4 w-48"
          >
            Launch EvieClient
          </button>
        </a>

        <span className="text-transparent font-extrabold text-2xl bg-clip-text bg-gradient-to-tr from-[#8400ff] to-[#ff00d4] drop-shadow hover:text-[#f07] hover:text-3xl transition-all">
          {status}
        </span>
      </div>
    </section>
  );
}

export default Launch;
