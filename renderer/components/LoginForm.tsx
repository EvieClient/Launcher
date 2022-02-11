import electron from "electron";
import React from "react";

function LoginForm() {
  return (
    <>
      <div className="p-5 bg-zinc-800 my-44 flex flex-col rounded-xl drop-shadow-2xl">
        <h1 className="text-3xl font-medium">Login</h1>

        <a
          onClick={() => {
            const ipcRenderer = electron.ipcRenderer;
            ipcRenderer.send("sign-in-via-microsoft", true);
          }}
        >
          <img
            className=""
            src="images/ms-symbollockup_signin_light.svg"
            alt="sign in with microsoft"
          />
        </a>
      </div>
    </>
  );
}

export default LoginForm;
