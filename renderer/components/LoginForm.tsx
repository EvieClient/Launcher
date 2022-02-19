import electron from "electron";
import React from "react";

function LoginForm() {
  return (
    <>
      <div className="p-5 bg-zinc-800 my-44 flex flex-col rounded-xl drop-shadow-2xl">
        <img
          src="/images/logo.png"
          alt="Logo"
          width={200}
          height={200}
          className="mx-auto"
        />
        <a
          onClick={() => {
            const ipcRenderer = electron.ipcRenderer;
            ipcRenderer.send("sign-in-via-microsoft", false);
          }}
        >
          <img
            className="transition-all duration-500 ease-in-out shadow-xl hover:shadow-lg hover:shadow-indigo-500 text-white font-bold rounded-full w-48"
            src="images/ms-symbollockup_signin_light.svg"
            alt="sign in with microsoft"
          />
        </a>
      </div>
    </>
  );
}

export default LoginForm;
