import express from "express";
import events from "node:events";
import * as bgStatus from "./log/bgStatus";

export const eventEmitter = new events.EventEmitter();
// init express router
const app = express();
// listen on port 9998 with the router
app.listen(9998, () => {
  bgStatus.express("listening on port 9998");
});
// setup express to recive requests for /auth/microsoft with a query param of code
app.get("/auth/microsoft", async (req, res) => {
  // get the code from the query param
  const code = req.query.code;
  bgStatus.express(`Reqeust recived for /auth/microsoft`);
  // verify the code is a string
  if (typeof code !== "string") {
    res
      .status(400)
      .send("code is not a string, maybe don't reverse engineer this ok thx?");
    return;
  }
  // verify the code is not empty
  if (code.length === 0) {
    res
      .status(400)
      .send("code is empty, maybe don't reverse engineer this ok thx?");
    return;
  }

  eventEmitter.emit("microsoft-code", code);

  res.redirect("/allgood");
});

app.get("/allgood", (req, res) => {
  bgStatus.express(`Reqeust recived for /allgood`);
  res.send("all good :) close this tab");
});

export const bgExpressServer = {
  events: eventEmitter,
  app: app,
};
