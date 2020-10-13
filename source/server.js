const express = require("express");
const cors = require("cors");
const { join } = require("path");
const listEndPoints = require("express-list-endpoints");
const mongoose = require("mongoose");
const userRouter = require("./services/users");
const HomeworkRouter = require("./services/homeworks");
const projectRouter = require("./services/projects");
const cookieParser = require("cookie-parser");

const {
  badRequest,
  notAuthorized,
  forbidden,
  notFound,
  generalError,
} = require("../errorHandlers");

const server = express();
const whitelist = ["http://localhost:3000"];
const corsOptions = {
  origin: (origin, callback) => {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};
server.use(cookieParser());
const port = process.env.PORT;

server.use(cors(corsOptions));
const staticFolderPath = join(__dirname, "../public");
server.use(express.static(staticFolderPath));
server.use(express.json());

server.use("/api/users", userRouter);
server.use("/api/projects", projectRouter);
server.use("/api/homeworks", HomeworkRouter);

//error handlers
server.use(badRequest);
server.use(notAuthorized);
server.use(forbidden);
server.use(notFound);
server.use(generalError);

console.log(listEndPoints(server));
mongoose
  .connect(process.env.CONNECTION_DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })

  .then(
    server.listen(port, () => {
      console.log("The server is running on port", port);
    })
  )
  .catch((error) => console.log(error));
