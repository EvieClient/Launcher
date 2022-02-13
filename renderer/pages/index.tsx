import React from "react";
import type { AppProps } from "next/app";
import Head from "next/head";
import electron from "electron";
import { UserInfo } from "../../types";
import Loading from "../components/Loading";
import TransitionLayout from "../components/Layout";
import { useRouter } from "next/dist/client/router";

function EvieClient({ Component, pageProps }: AppProps) {
  const ipcRenderer = electron.ipcRenderer;
  const router = useRouter();

  ipcRenderer?.on("fetch-user-info-reply", (event, userInfo: UserInfo) => {
    if (userInfo.valid) {
      setStatus(
        <>
          Welcome back, <span className="font-semibold">{userInfo.name}</span>
        </>
      );
      setUserInfo(userInfo);
      setTimeout(() => {
        router.push("/home");
        setLoading(false);
      }, 1500);
    } else {
      setStatus(
        <>
          Welcome to <span className="font-semibold">EvieClient</span>
        </>
      );
      setTimeout(() => {
        router.push("/login");
        setLoading(false);
      }, 1500);
    }
  });

  const [userInfo, setUserInfo] = React.useState<UserInfo>(null);
  const [loading, setLoading] = React.useState(true);
  const [status, setStatus] = React.useState(<>Loading...</>);

  React.useEffect(() => {
    ipcRenderer.send("fetch-user-info");
  }, []);

  return (
    <React.Fragment>
      <TransitionLayout>
        <Head>
          <title>Evie Client</title>
        </Head>
        {loading ? <Loading text={status} /> : <Component {...pageProps} />}
      </TransitionLayout>
    </React.Fragment>
  );
}

export default EvieClient;
