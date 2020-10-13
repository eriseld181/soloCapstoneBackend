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

//Get all Projects
homeworkRouter.get("/", authorize, async (req, res, next) => {
  try {
    const query = q2m(req.query);

    const projects = await HomeworkSchema.find(
      query.criteria,
      query.options.fields
    )
      .populate("userId")

      .skip(query.options.skip)
      .limit(query.options.limit)

      .sort({
        dateOfCreation: -1,
      });

    res.send(projects);
  } catch (error) {
    console.log(error);
    next(error);
  }
});
//Post a new project
homeworkRouter.post(
  "/add",
  authorize,
  tutorOnlyMiddleware,
  async (req, res, next) => {
    try {
      const user = req.user._id;
      //when you do a post you add userId, to get user to project
      const newProject = new HomeworkSchema({ ...req.body, userId: user });
      await newProject.save();

      const attachUser = await userSchema.findByIdAndUpdate({ _id: user });

      const projects = attachUser.projects;
      projects.push(newProject._id);
      await attachUser.save({ validateBeforeSave: false });
      res.status(201).send(attachUser);
    } catch (error) {
      next(error);
    }
  }
);
//Get a single project
homeworkRouter.get("/:id", authorize, async (req, res, next) => {
  try {
    const id = req.params.id;
    const project = await HomeworkSchema.findById(id);

    if (project) {
      res.send(project);
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

//Edit a single project
homeworkRouter.put("/:id", authorize, async (req, res, next) => {
  try {
    const project = await HomeworkSchema.findByIdAndUpdate(
      req.params.id,
      req.body
    );

    if (project) {
      res.send(`The project with id ${req.params.id} is updated succesfully.`);
    } else {
      const error = new Error(`Project with id ${req.params.id} is not found.`);
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    next(error);
  }
});
//Delete a single project
homeworkRouter.delete("/:id", authorize, async (req, res, next) => {
  try {
    const project = await HomeworkSchema.findByIdAndDelete(req.params.id);
    if (project) {
      res.send(`Project with id ${req.params.id} is deleted succesfully.`);
    } else {
      const error = new Error(`Project with id ${req.params.id} not found`);
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    next(error);
  }
});

homeworkRouter.post(
  "/:id/uploadImage",
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
              const post = await HomeworkSchema.findByIdAndUpdate({
                _id: req.params.id,
              });
              post.projectPhoto = data.secure_url;
              await post.save();
              res.status(201).send("Image is added");
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
