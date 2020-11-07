const { Schema } = require("mongoose");
const mongoose = require("mongoose");

const homeworkSchema = new Schema(
  {
    myTitle: { type: String, required: true },
    description: { type: String, default: "" },
    image: {
      type: String,
      // default:
      //   "https://res.cloudinary.com/social4marketing/image/upload/v1603135582/E-TECH-HOMEWORKS/homeworks_pl1pad.png",
    },

    userId: { type: Schema.Types.ObjectId, ref: "users" },
  },
  { timestamps: true }
);
homeworkSchema.post("validate", function (error, doc, next) {
  if (error) {
    error.httpStatusCode = 400;
    next(error);
  } else {
    next();
  }
});

homeworkSchema.post("save", function (error, doc, next) {
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

homeworkModel = mongoose.model("homework", homeworkSchema);
module.exports = homeworkModel;
