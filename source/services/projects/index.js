const express = require("express");
const q2m = require("query-to-mongo");
const userSchema = require("../users/schema");
const ProjectSchema = require("./schema");
const {
  authorize,
  studentOnlyMiddleware,
} = require("../middlewares/authorize");
const projectRouter = express.Router();

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
projectRouter.get("/", authorize, async (req, res, next) => {
  try {
    const query = q2m(req.query);
    const projects = await ProjectSchema.find(
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
projectRouter.post("/add", authorize, async (req, res, next) => {
  try {
    const user = req.user._id;
    //when you do a post you add userId, to get user to project
    const newProject = new ProjectSchema({ ...req.body, userId: user });
    await newProject.save();

    const attachUser = await userSchema.findByIdAndUpdate({ _id: user });

    const projects = attachUser.projects;
    projects.push(newProject._id);
    await attachUser.save({ validateBeforeSave: false });
    res.status(201).send(newProject);
  } catch (error) {
    next(error);
  }
});
//Get a single project
projectRouter.get("/:id", authorize, async (req, res, next) => {
  try {
    const id = req.params.id;
    const project = await ProjectSchema.findById(id).sort({
      createdAt: -1,
    });

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
projectRouter.put("/:id", authorize, async (req, res, next) => {
  try {
    const project = await ProjectSchema.findByIdAndUpdate(
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
projectRouter.delete("/:id", authorize, async (req, res, next) => {
  try {
    const project = await ProjectSchema.findByIdAndDelete(req.params.id);
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

projectRouter.post(
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
              const user = await ProjectSchema.findOne({
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
module.exports = projectRouter;
