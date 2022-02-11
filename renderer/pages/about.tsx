import React from "react";
import Nav from "../components/nav";
import Launch from "../components/launch";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import electron from "electron";

function Info(props: { title: string; description: string }) {
  return (
    <div className="pr-4 pl-4">
      <Box sx={{ minWidth: 275 }}>
        <Card variant="outlined">
          {
            <React.Fragment>
              <CardContent>
                <Typography variant="h5" align="center" component="div">
                  {props.title}
                </Typography>
                <Typography align="center" variant="body2">
                  {props.description}
                </Typography>
              </CardContent>
            </React.Fragment>
          }
        </Card>
      </Box>
    </div>
  );
}

type EvieVersions = {
  version: string;
  electronVersion: string;
  chromeVersion: string;
};

function Home() {
  const [versionInfo, setVersionInfo] = React.useState<EvieVersions>(null);

  electron.ipcRenderer?.on("fetch-versions-reply", (event, arg) => {
    setVersionInfo(arg);
  });

  React.useEffect(() => {
    electron.ipcRenderer?.send("fetch-versions");
  }, []);
  return (
    <React.Fragment>
      <div>
        <div>
          <Nav />
        </div>
        <main className="page lanidng-page">
          <Launch />
        </main>
        <div>
          <div className="container mx-auto sm:px-4">
            <br />
            <div className="flex items-center">
              <Info
                title="Evie Launcher Version"
                description={`${versionInfo?.version}`}
              />
              <Info
                title="Electron Version"
                description={`${versionInfo?.electronVersion}`}
              />
              <Info
                title="Chrome Version"
                description={`${versionInfo?.chromeVersion}`}
              />
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

export default Home;
