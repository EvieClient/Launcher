import React from "react";
import Head from "next/head";
import Nav from "../components/nav";
import Launch from "../components/launch";
import News from "../components/news";

const posts = [
  {
    id: 1,
    title: "Example Post",
    imageURL:
      "https://images.unsplash.com/photo-1643575102128-0d6b42fbdda1?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1632&q=80",
    description: "This is an example post.",
    date: "2020-01-01",
  },
];

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
