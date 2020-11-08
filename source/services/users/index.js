const express = require("express");
const q2m = require("query-to-mongo");

const { authenticate, refreshToken1 } = require("./authentication");
const UserModel = require("./schema");
const projectModel = require("../projects/schema");
const postModel = require("../posts/schema");
const noteModel = require("../notes/schema");
const homeworkModel = require("../homeworks/schema");
const userRouter = express.Router();
const { authorize, tutorOnlyMiddleware } = require("../middlewares/authorize");

const streamifier = require("streamifier");

const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const upload = multer();
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

//Get all Tutors and Students
userRouter.get("/", authorize, async (req, res, next) => {
  try {
    const query = q2m(req.query);

    const users = await UserModel.find(query.criteria, query.options.fields)
      .populate("projects")
      .skip(query.options.skip)
      .limit(query.options.limit)
      .sort(query.options.sort);

    res.send({
      users,
      total: users.length,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
});
userRouter.get("/me", authorize, async (req, res, next) => {
  try {
    // res.cookie("active", "activeValue");
    res.send(req.user);
  } catch (error) {
    next("While reading users list a problem occurred!");
  }
});
// userRouter.get("/me/projects", authorize, async (req, res, next) => {
//   try {
//     const user = await UserModel.find({ userId: req.user._id }).populate(
//       "projects"
//     );
//     if (req.user._id === user.userId) {
//       res.send(user);
//     } else {
//       console.log(user);
//     }
//   } catch (error) {
//     next("While reading users list a problem occurred!");
//   }
// });

//Get single a Username
userRouter.get("/:id", authorize, async (req, res, next) => {
  try {
    res.send(req.user);
  } catch (error) {
    next("While reading users list a problem occurred!");
  }
});
userRouter.get("/me/projects", authorize, async (req, res, next) => {
  try {
    const projects = await projectModel.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });

    res.send(projects);
  } catch (error) {
    next("While reading project list a problem occurred!");
  }
});

userRouter.get("/me/posts", authorize, async (req, res, next) => {
  try {
    const posts = await postModel
      .find({ userId: req.user._id })
      .populate("userId")
      .sort({
        createdAt: -1,
      });

    res.send(posts);
  } catch (error) {
    next("While reading posts list a problem occurred!");
  }
});
userRouter.get("/me/notes", authorize, async (req, res, next) => {
  try {
    const posts = await noteModel
      .find({ userId: req.user._id })
      .populate("userId")
      .sort({
        createdAt: -1,
      });

    res.send(posts);
  } catch (error) {
    next("While reading notes list a problem occurred!");
  }
});
userRouter.get("/me/homeworks", authorize, async (req, res, next) => {
  try {
    const posts = await homeworkModel
      .find({ userId: req.user._id })
      .populate("userId")
      .sort({
        createdAt: -1,
      });

    res.send(posts);
  } catch (error) {
    next("While reading homework list a problem occurred!");
  }
});

//Edit a single person
userRouter.put("/:id", authorize, async (req, res, next) => {
  if (req.user._id.equals(req.params.id)) {
    try {
      if (req.user.role !== "tutor" && req.body.role) {
        res.send("You cannot edit the role, only tutor can.");
      } else {
      }
      const updates = Object.keys(req.body);

      try {
        updates.forEach((update) => (req.user[update] = req.body[update]));
        await req.user.save();
        res.send(req.user);
      } catch (e) {
        res.status(400).send(e);
      }
    } catch (error) {
      next(error);
    }
  } else {
    console.log("no");
    res.send(401);
  }
});
//Delete a single person
userRouter.delete("/:id", async (req, res, next) => {
  if (req.user._id === req.params.id) {
    try {
      await req.user.remove();
      res.send("Deleted");
    } catch (error) {
      next(error);
    }
  } else {
    console.log("no");
    res.send(401);
  }
});
//==========================================================================
//Register a new user
userRouter.post("/register", async (req, res, next) => {
  try {
    const newUser = new UserModel(req.body);
    const userName =
      newUser.firstname.charAt(0).toUpperCase() + newUser.firstname.slice(1);
    const { _id } = await newUser.save();
    res
      .status(201)
      .send(
        `Welcome ${userName} to E-Tech, you have been registered successfully with id: ${_id}`
      );
  } catch (error) {
    next(error);
  }
});
//login with actual user
userRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findByCredentials(email, password);
    const token = await authenticate(user);
    console.log(token);
    res.cookie("accessToken", token.token, {
      secure: true,
      httpOnly: true,
      sameSite: "none",
    });
    res.cookie("refreshToken", token.refreshToken, {
      httpOnly: true,
      secure: true,
      path: "/refreshToken",
      sameSite: "none",
    });
    res.cookie("activeL", "activeValue", {
      secure: true,
      httpOnly: true,
      sameSite: "none",
    });

    res.send("ok");
  } catch (error) {
    next(error);
  }
});
//logout from this platform...
userRouter.post("/logout", authorize, async (req, res, next) => {
  try {
    // req.user.refreshTokens = req.user.refreshTokens.filter(
    //   (t) => t.token !== req.token
    // );

    await req.user.save();

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.clearCookie("activeL");
    res.send("cookie was deleted");
    // res.clearCookie("name", { path: "/" });
  } catch (err) {
    next(err);
  }
});
//we will triger this in front-end
userRouter.post("/refreshToken", async (req, res, next) => {
  const oldRefreshToken = req.cookies.refreshToken;
  if (!oldRefreshToken) {
    const error = new Error("Refresh token missing");
    error.httpStatusCode = 403;
    next(error);
  } else {
    try {
      const tokens = await refreshToken1(oldRefreshToken);

      res.cookie("accessToken", tokens.token, {
        httpOnly: true,
        path: "/",
      });
      res.cookie("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        path: "/refreshToken",
      });
      res.send("ok");
    } catch (error) {
      console.log(error);
      const err = new Error(error);
      err.httpStatusCode = 403;
      next(err);
    }
  }
});

userRouter.post(
  "/uploadImage",
  authorize,
  upload.single("image"),
  async (req, res, next) => {
    try {
      if (req.file) {
        const cloud_upload = cloudinary.uploader.upload_stream(
          {
            folder: "E-TECH",
          },
          async (err, data) => {
            if (!err) {
              req.user.profilePhoto = data.secure_url;
              await req.user.save({ validateBeforeSave: false });
              res.status(201).send("Image is uploaded");
            }
          }
        );

        streamifier.createReadStream(req.file.buffer).pipe(cloud_upload);
      } else {
        const err = new Error();
        err.httpStatusCode = 400;
        err.message = " image is missing";
        next(err);
      }
    } catch (error) {
      next(error);
      console.log(error);
    }
  }
);

module.exports = userRouter;
