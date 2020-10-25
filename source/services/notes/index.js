const express = require("express");
const q2m = require("query-to-mongo");
const userSchema = require("../users/schema");
const noteSchema = require("./schema");
const {
  authorize,
  studentOnlyMiddleware,
} = require("../middlewares/authorize");
const noteRouter = express.Router();
const streamifier = require("streamifier");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const upload = multer();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

//Get all user notes
noteRouter.get("/", authorize, async (req, res, next) => {
  try {
    const query = q2m(req.query);

    const notes = await noteSchema
      .find(query.criteria, query.options.fields)
      .populate("userId")

      .skip(query.options.skip)
      .limit(query.options.limit)

      .sort({
        dateOfCreation: -1,
      });

    res.send(notes);
  } catch (error) {
    console.log(error);
    next(error);
  }
});
//Post a new note
noteRouter.post("/add", authorize, async (req, res, next) => {
  try {
    const user = req.user._id;
    //when you do a post you add userId, to get user to project
    const newNote = new noteSchema({ ...req.body, userId: user });
    await newNote.save();

    const attachUser = await userSchema.findByIdAndUpdate({ _id: user });

    const notes = attachUser.notes;
    notes.push(newNote._id);
    await attachUser.save({ validateBeforeSave: false });
    res.status(201).send(attachUser);
  } catch (error) {
    next(error);
  }
});
//Get a single note
noteRouter.get("/:id", authorize, async (req, res, next) => {
  try {
    const id = req.params.id;
    const note = await noteSchema.findById(id);

    if (note) {
      res.send(note);
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

//Edit a single note
noteRouter.put("/:id", authorize, async (req, res, next) => {
  try {
    const note = await noteSchema.findByIdAndUpdate(req.params.id, req.body);

    if (note) {
      res.send(`The note with id ${req.params.id} is updated succesfully.`);
    } else {
      const error = new Error(`Note with id ${req.params.id} is not found.`);
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    next(error);
  }
});
//Delete a single note
noteRouter.delete("/:id", authorize, async (req, res, next) => {
  try {
    const note = await noteSchema.findByIdAndDelete(req.params.id);
    if (note) {
      res.send(`Note with id ${req.params.id} is deleted succesfully.`);
    } else {
      const error = new Error(`Note with id ${req.params.id} not found`);
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    next(error);
  }
});

noteRouter.post(
  "/:id/uploadImage",
  authorize,
  upload.single("image"),
  async (req, res, next) => {
    try {
      if (req.file) {
        const cloud_upload = cloudinary.uploader.upload_stream(
          {
            folder: "E-TECH-NOTES",
          },
          async (err, data) => {
            if (!err) {
              await noteSchema.findOneAndUpdate({
                _id: req.params.id,
                image: data.secure_url,
              });
              res.status(201).send("Note-Image is uploaded Sucessfully...");
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
module.exports = noteRouter;
