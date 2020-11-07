const { Schema } = require("mongoose");
const mongoose = require("mongoose");

const projectSchema = new Schema(
  {
    myTitle: { type: String, required: true },
    description: { type: String, default: "" },
    link: { type: String, default: "" },
    image: {
      type: String,
    },
    userId: { type: Schema.Types.ObjectId, ref: "users" },
    dateOfCreation: { type: Date, default: Date.now },
    dateOfEditing: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
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
