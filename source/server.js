const express = require("express");
const cors = require("cors");
const { join } = require("path");
const listEndPoints = require("express-list-endpoints");
const mongoose = require("mongoose");
const userRouter = require("./services/users");
const HomeworkRouter = require("./services/homeworks");
const postRouter = require("./services/posts");
const projectRouter = require("./services/projects");
const NotesRouter = require("./services/notes");
const cookieParser = require("cookie-parser");

const {
  badRequest,
  notAuthorized,
  forbidden,
  notFound,
  generalError,
} = require("../errorHandlers");

const server = express();
const whitelist = process.env.Client_website || process.env.Local_client_url;
// const whitelist = process.env.Client_website;
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
server.use("/api/notes", NotesRouter);
server.use("/api/posts", postRouter);
server.set("trust proxy", 1);
//error handlers
server.use(badRequest);
server.use(notAuthorized);
server.use(forbidden);
server.use(notFound);
server.use(generalError);

console.log(listEndPoints(server));
mongoose
  .connect(
    process.env.MONGODB_URI,

    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    }
  )

  .then(
    server.listen(port || 3000, () => {
      console.log("The server is running on port", port);
    })
  )
  .catch((error) => console.log(error));
