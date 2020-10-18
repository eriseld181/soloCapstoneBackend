const { Schema } = require("mongoose");
const mongoose = require("mongoose");

const noteSchema = new Schema({
  noteTitle: { type: String, required: true },
  noteDescription: { type: String, default: "Add a description here..." },

  notePhoto: {
    type: String,
  },
  userId: { type: Schema.Types.ObjectId, ref: "users" },
  dateOfCreation: { type: Date, default: Date.now },
  dateOfEditing: { type: Date, default: Date.now },
});
noteSchema.post("validate", function (error, doc, next) {
  if (error) {
    error.httpStatusCode = 400;
    next(error);
  } else {
    next();
  }
});

noteSchema.post("save", function (error, doc, next) {
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

projectModel = mongoose.model("notes", noteSchema);
module.exports = projectModel;
