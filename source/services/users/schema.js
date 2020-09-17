const { Schema } = require('mongoose')
const mongoose = require('mongoose')
const myValidator = require('validator')

userSchema = new Schema(
    {

        firstName: {
            type: String, required: true
        },
        lastName: {
            type: String, required: true
        },
        headline: {
            type: String
        },
        about: {
            type: String
        },
        projects: [{
            type: Schema.objectId
        }],
        password: {
            type: String, minlength: 8
        },
        email: {
            type: String, required: true, lowercase: true, unique: true,
            validate: {
                validator: async (value) => {
                    if (!myValidator.isEmail(value))
                        throw new Error("This email is already used or is invalid, please enter a valid email")
                }
            }
        },
        role: {
            type: String, enum: ["tutor", "student"], required: true,
        },

    },
    { timestamps: true }
)
//using this function we make sure not to return the uneccesary fields
userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()
    delete userObject.password
    delete userObject.__v
    return userObject
}
userSchema