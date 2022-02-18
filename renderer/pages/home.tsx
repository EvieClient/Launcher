import React from "react";
import Nav from "../components/nav";
import Launch from "../components/launch";

function Home() {
  const [currentTab, setCurrentTab] = React.useState<JSX.Element>();

  return (
    <React.Fragment>
      <div>
        <div>
          <Nav setCurrentTab={setCurrentTab} currentTab={currentTab} />
        </div>
        <main className="page lanidng-page">
          <Launch />
        </main>
        <br />
        <div>{currentTab}</div>
      </div>
    </React.Fragment>
  );
}

export default Home;
