import React from "react";
import type { AppProps } from "next/app";

import "../styles/globals.css";
import Head from "next/head";
import TransitionLayout from "../components/Layout";
import electron from "electron";
import { useRouter } from "next/router";

function MyApp({ Component, pageProps }: AppProps) {
  const ipcRenderer = electron.ipcRenderer;
  const router = useRouter();

  ipcRenderer?.on("go-home", () => {
    router.push("/home");
  });
  return (
    <React.Fragment>
      <TransitionLayout>
        <Head>
          <title>Evie Client</title>
        </Head>
        <Component {...pageProps} />
      </TransitionLayout>
    </React.Fragment>
  );
}

export default MyApp;
