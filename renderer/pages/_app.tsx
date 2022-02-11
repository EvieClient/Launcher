import React from "react";
import type { AppProps } from "next/app";

import "../styles/globals.css";
import Head from "next/head";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <React.Fragment>
      <Head>
        <title>Evie Client</title>
      </Head>
      <Component {...pageProps} />
    </React.Fragment>
  );
}

export default MyApp;
