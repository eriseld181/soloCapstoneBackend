const express = require("express");
const q2m = require("query-to-mongo");
const userSchema = require("../users/schema");
const postModel = require("./schema");
const { authorize, tutorOnlyMiddleware } = require("../middlewares/authorize");
const postRouter = express.Router();
const streamifier = require("streamifier");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const upload = multer();
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});
//Get all posts
postRouter.get("/", authorize, async (req, res, next) => {
  try {
    const query = q2m(req.query);

    const post = await postModel
      .find(query.criteria, query.options.fields)
      .populate("userId")

      .skip(query.options.skip)
      .limit(query.options.limit)

      .sort({
        dateOfCreation: -1,
      });
    // const data = await post.filter((item) => item._id != req.user.posts._id);

    res.send(post);
  } catch (error) {
    console.log(error);
    next(error);
  }
});
//Post a new post
postRouter.post("/add", authorize, async (req, res, next) => {
  try {
    const user = req.user._id;
    //when you do a post you add userId, to get user to homeworks
    const newPost = new postModel({ ...req.body, userId: user });

    await newPost.save();

    const attachUser = await userSchema.findByIdAndUpdate({ _id: user });
    const posts = attachUser.posts;

    posts.push(newPost._id);
    await attachUser.save({ validateBeforeSave: false });
    res.status(201).send(newPost);
  } catch (error) {
    next(error);
  }
});
//Get a single homework
postRouter.get("/:id", authorize, async (req, res, next) => {
  try {
    const id = req.params.id;
    const homework = await postModel.findById(id);

    if (homework) {
      res.send(homework);
    } else {
      const error = new Error();
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

//Edit a single homework
postRouter.put(
  "/:id",
  authorize,

  async (req, res, next) => {
    try {
      const homework = await postModel.findByIdAndUpdate(
        req.params.id,
        req.body
      );

      if (homework) {
        res.send(
          `The homework with id ${req.params.id} is updated succesfully.`
        );
      } else {
        const error = new Error(
          `Homework with id ${req.params.id} is not found.`
        );
        error.httpStatusCode = 404;
        next(error);
      }
    } catch (error) {
      next(error);
    }
  }
);
//Delete a single Homework
postRouter.delete(
  "/:id",
  authorize,

  async (req, res, next) => {
    try {
      const homework = await postModel.findByIdAndDelete(req.params.id);
      if (homework) {
        res.send(`homework with id ${req.params.id} is deleted succesfully.`);
      } else {
        const error = new Error(`Homework with id ${req.params.id} not found`);
        error.httpStatusCode = 404;
        next(error);
      }
    } catch (error) {
      next(error);
    }
  }
);

postRouter.post(
  "/:id/uploadImage",
  authorize,
  upload.single("image"),
  async (req, res, next) => {
    try {
      if (req.file) {
        const cloud_upload = cloudinary.uploader.upload_stream(
          {
            folder: "E-TECH-POSTS",
          },
          async (err, data) => {
            if (!err) {
              const user = await postModel.findOne({
                // image: data.secure_url,
                _id: req.params.id,
              });
              if (user) {
                user.image = data.secure_url;
                await user.save();
              }

              res.status(201).send("Post-Image is uploaded succesfully...");
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
module.exports = postRouter;
