import React from "react";
import Head from "next/head";
import Link from "next/link";
import Nav from "../components/nav";
import Launch from "../components/launch";
import News from "../components/news";
import LoginForm from "../components/LoginForm";
import { useRouter } from "next/dist/client/router";
import electron from "electron";

function Login() {
  const router = useRouter();
  const ipcRenderer = electron.ipcRenderer;

  ipcRenderer.on("signedin", (event, code) => {
    router.push("/home");
  });
  return (
    <React.Fragment>
      <Head>
        <title>EvieLauncher</title>
      </Head>
      <div>
        <div>
          <Nav />
        </div>
        <div className="flex flex-col items-center justify-center h-screen bg-[url('/images/signin.png')] bg-cover">
          <LoginForm />
        </div>
      </div>
    </React.Fragment>
  );
}

export default Login;
