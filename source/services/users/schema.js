const { Schema } = require("mongoose");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const myValidator = require("validator");

userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      validate: {
        validator: async (value) => {
          if (!myValidator.isEmail(value))
            throw new Error(
              "This email is already used or is invalid, please enter a valid email"
            );
        },
      },
    },
    password: { type: String, minlength: 8 },
    firstname: { type: String, required: true },
    username: { type: String, default: "" },
    lastname: { type: String, required: true },
    github: { type: String, default: "https://github.com/" },
    linkedin: { type: String, default: "https://www.linkedin.com/in/" },
    portfolio: { type: String, default: "http://localhost:3000/profile" },
    about: { type: String, default: "" },
    profilePhoto: {
      type: String,
      default:
        "https://res.cloudinary.com/social4marketing/image/upload/v1602353297/E-TECH/defaultprofilephoto_f67v5k.png",
    },
    grades: { type: Number, default: 0, min: 0, max: 10 },
    registerdate: { type: Date, default: Date.now },
    role: {
      type: String,
      enum: ["tutor", "student"],
      required: true,
      default: "student",
    },
    userPhoto: {
      type: String,
      default:
        "https://toppng.com/uploads/preview/chf-project-blue-icon-quotes-11563133106x9u8mp8qop.png",
    },
   projects: [{ type: Schema.Types.ObjectId, ref: "projects" }],
    refreshTokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

//using this function we make sure not to return the uneccesary fields
userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();
  delete userObject.password;
  delete userObject.__v;
  return userObject;
};
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await UserModel.findOne({ email });

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    const error = new Error("Unable to login, please try again!");
    error.httpStatusCode = 401;
    throw error;
  }
  return user;
};
userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

userSchema.post("validate", function (error, doc, next) {
  if (error) {
    error.httpStatusCode = 400;
    next(error);
  } else {
    next();
  }
});
userSchema.post("save", function (error, doc, next) {
  if (error.name === "MongoError" && error.code === 11000) {
    error.httpStatusCode = 400;
    next(error);
  } else {
    next();
  }
});

const UserModel = mongoose.model("users", userSchema);
module.exports = UserModel;
