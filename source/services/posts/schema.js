const { Schema } = require("mongoose");
const mongoose = require("mongoose");

const postSchema = new Schema({
  myTitle: { type: String, required: true },
  image: {
    type: String,
    default:
      "https://res.cloudinary.com/social4marketing/image/upload/v1603135673/E-TECH-POSTS/publication_cijnwd.png",
  },
  userId: { type: Schema.Types.ObjectId, ref: "users" },
});
postSchema.post("validate", function (error, doc, next) {
  if (error) {
    error.httpStatusCode = 400;
    next(error);
  } else {
    next();
  }
});

postSchema.post("save", function (error, doc, next) {
  if (error.name === "MongoError" && error.code === 505) {
    next(
      new Error(
        "there is a dublicate key error (eriseld made this on post Schema"
      )
    );
  } else {
    next();
  }
});

postModel = mongoose.model("posts", postSchema);
module.exports = postModel;
