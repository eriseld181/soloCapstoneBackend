const express = require("express");
const q2m = require("query-to-mongo");
const userSchema = require("../users/schema");
const HomeworkSchema = require("./schema");
const { authorize, tutorOnlyMiddleware } = require("../middlewares/authorize");
const homeworkRouter = express.Router();

const streamifier = require("streamifier");

const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const upload = multer();
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});
//Get all Homeworks
homeworkRouter.get("/", authorize, async (req, res, next) => {
  try {
    const query = q2m(req.query);

    const homework = await HomeworkSchema.find(
      query.criteria,
      query.options.fields
    )
      .populate("userId")

      .skip(query.options.skip)
      .limit(query.options.limit)

      .sort({
        createdAt: -1,
      });

    res.send(homework);
  } catch (error) {
    console.log(error);
    next(error);
  }
});
//Post a new homework
homeworkRouter.post(
  "/add",
  authorize,
  tutorOnlyMiddleware,
  async (req, res, next) => {
    try {
      const user = req.user._id;
      //when you do a post you add userId, to get user to homeworks
      const newHomework = new HomeworkSchema({ ...req.body, userId: user });

      await newHomework.save();

      const attachUser = await userSchema.findByIdAndUpdate({ _id: user });
      const homeworks = attachUser.homeworks;

      homeworks.push(newHomework._id);
      await attachUser.save({ validateBeforeSave: false });
      res.status(201).send(newHomework);
    } catch (error) {
      next(error);
    }
  }
);
//Get a single homework
homeworkRouter.get("/:id", authorize, async (req, res, next) => {
  try {
    const id = req.params.id;
    const homework = await HomeworkSchema.findById(id);

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
homeworkRouter.put(
  "/:id",
  authorize,
  tutorOnlyMiddleware,
  async (req, res, next) => {
    try {
      const homework = await HomeworkSchema.findByIdAndUpdate(
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
homeworkRouter.delete(
  "/:id",
  authorize,
  tutorOnlyMiddleware,
  async (req, res, next) => {
    try {
      const homework = await HomeworkSchema.findByIdAndDelete(req.params.id);
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

homeworkRouter.post(
  "/:id/uploadImage",
  authorize,
  upload.single("image"),
  async (req, res, next) => {
    try {
      if (req.file) {
        const cloud_upload = cloudinary.uploader.upload_stream(
          {
            folder: "E-TECH-HOMEWORKS",
          },
          async (err, data) => {
            if (!err) {
              const user = await HomeworkSchema.findOne({
                _id: req.params.id,
              });
              if (user) {
                user.image = data.secure_url;
                await user.save();
              }

              res.status(201).send("Homework-Image is added succesfully...");
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
module.exports = homeworkRouter;
