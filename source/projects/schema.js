const { Schema } = require("mongoose");
const mongoose = require("mongoose");

const projectSchema = new Schema({
  projectName: { type: String, required: true },
  projectDescription: { type: String, default: "" },
  projectLink: { type: String, default: "" },
  projectPhoto: {
    type: String,
    default:
      "https://res.cloudinary.com/social4marketing/image/upload/v1602529806/E-TECH/projects_n7jnhy.png",
  },
  userId: { type: Schema.Types.ObjectId, ref: "users" },
  dateOfCreation: { type: Date, default: Date.now },
  dateOfEditing: { type: Date, default: Date.now },
});
projectSchema.post("validate", function (error, doc, next) {
  if (error) {
    error.httpStatusCode = 400;
    next(error);
  } else {
    next();
  }
});

projectSchema.post("save", function (error, doc, next) {
  if (error.name === "MongoError" && error.code === 505) {
    next(
      new Error(
        "there is a dublicate key error (eriseld made this on project Schema"
      )
    );
  } else {
    next();
  }
});

projectModel = mongoose.model("projects", projectSchema);
module.exports = projectModel;
