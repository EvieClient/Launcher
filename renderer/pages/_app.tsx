import React from "react";
import type { AppProps } from "next/app";

import "../styles/globals.css";
import Head from "next/head";
import TransitionLayout from "../components/Layout";

function MyApp({ Component, pageProps }: AppProps) {
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
