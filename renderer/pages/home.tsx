import React from "react";
import Head from "next/head";
import Nav from "../components/nav";
import Launch from "../components/launch";
import News from "../components/news";

function Home() {
  return (
    <React.Fragment>
      <Head>
        <title>EvieLauncher</title>
      </Head>
      <div>
        <div>
          <Nav />
        </div>
        <main className="page lanidng-page">
          <Launch />
        </main>
        <div>
          <div className="container mx-auto sm:px-4">
            <h2
              style={{
                marginTop: "52px",
                marginLeft: "34px",
                fontFamily: '"Open Sans", sans-serif',
                fontSize: "22px",
                fontWeight: 800,
                lineHeight: "32px",
                color: "rgb(0,0,0)",
              }}
            />
            <div className="news">
              <p
                style={{
                  marginLeft: "34px",
                  color: "rgba(255,255,255,0.5)",
                  fontSize: "14px",
                }}
              />
            </div>
            <div className="flex flex-wrap ">
              <News />
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

export default Home;
