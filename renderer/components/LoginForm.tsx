import { Transition, Dialog } from "@headlessui/react";
import { BadgeCheckIcon } from "@heroicons/react/outline";
import electron from "electron";
import { useState, useRef, Fragment } from "react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const onLoginPress = () => {
    console.log("Login pressed");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
  };

  const onCodeSubmit = () => {
    const ipcRenderer = electron.ipcRenderer;
    ipcRenderer.send("code", code);
  };

  const [waitingForMicrosoftToken, setWaitingForMicrosoftToken] =
    useState(false);

  while (waitingForMicrosoftToken) {
    return (
      <>
        <div className="p-5 bg-zinc-800 my-44 flex flex-col rounded-xl drop-shadow-2xl">
          <h1 className="text-3xl font-medium">Login</h1>

          <input
            type="code"
            placeholder="code"
            id="code"
            className="p-2 w-96 mx-2 mt-6 bg-blue-200 text-black rounded-md placeholder-gray-600"
            onChange={(e) => setCode(e.target.value)}
            value={code}
          />

          <button
            className="p-5 bg-blue-500 mt-6 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
            onClick={onCodeSubmit}
          >
            Login via Microsoft
          </button>
          <button
            className="p-5 bg-blue-500 mt-6 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
            onClick={() => setWaitingForMicrosoftToken(false)}
          >
            Back
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="p-5 bg-zinc-800 my-44 flex flex-col rounded-xl drop-shadow-2xl">
        <h1 className="text-3xl font-medium">Login</h1>

        <input
          type="email"
          placeholder="email"
          id="email"
          className="p-2 w-96 mx-2 mt-6 bg-blue-200 text-black rounded-md placeholder-gray-600"
          onChange={(e) => setEmail(e.target.value)}
          value={email}
        />
        <input
          type="password"
          placeholder="password"
          id="password"
          className="p-2 w-96 mx-2 mt-6 bg-blue-200 text-black rounded-md placeholder-gray-600"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          className="p-5 bg-blue-500 mt-6 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
          onClick={onLoginPress}
        >
          Login via Mojang
        </button>
        <br />
        <a
          onClick={() => {
            const ipcRenderer = electron.ipcRenderer;
            ipcRenderer.send("sign-in-via-microsoft");
            setWaitingForMicrosoftToken(true);
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
