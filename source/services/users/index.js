const express = require('express')
const q2m = require('query-to-mongo')

const { authenticate, refreshToken1 } = require("./authentication")
const UserModel = require('./schema')
const userRouter = express.Router()
const { authorize, studentOnlyMiddleware } = require("../middlewares/authorize")

const streamifier = require("streamifier")

const cloudinary = require("cloudinary").v2
const multer = require("multer")
const upload = multer()
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
})

//Get all Tutors and Students
userRouter.get("/", async (req, res, next) => {
    try {
        const query = q2m(req.query)

        const users = await UserModel.find(query.criteria, query.options.fields).populate("projects")
            .skip(query.options.skip)
            .limit(query.options.limit)
            .sort(query.options.sort)

        res.send({
            users,
            total: users.length,
        })
    } catch (error) {
        console.log(error)
        next(error)
    }
})
//Get single a Username
userRouter.get("/:id", authorize, async (req, res, next) => {

    try {
        console.log(req.user)
        res.send(req.user)
    } catch (error) {
        next("While reading users list a problem occurred!")
    }

})
//Edit a single person
userRouter.put("/:id", authorize, async (req, res, next) => {
    if (req.user._id === req.params.id) {
        try {
            const updates = Object.keys(req.body)

            try {
                updates.forEach((update) => (req.user[update] = req.body[update]))
                await req.user.save()
                res.send(req.user)
            } catch (e) {
                res.status(400).send(e)
            }
        } catch (error) {
            next(error)
        }
    } else {
        console.log("no")
        res.send(401)
    }

})
//Delete a single person
userRouter.delete("/:id", authorize, async (req, res, next) => {
    if (req.user._id === req.params.id) {
        try {
            await req.user.remove()
            res.send("Deleted")
        } catch (error) {
            next(error)
        }
    } else {
        console.log("no")
        res.send(401)
    }
})
//==========================================================================
//Register a new user
userRouter.post("/register", async (req, res, next) => {
    try {
        const newUser = new UserModel(req.body)
        const userName = newUser.firstname.charAt(0).toUpperCase() + newUser.firstname.slice(1)
        const { _id } = await newUser.save()
        res.status(201).send(`Welcome ${userName} to E-Tech, you have been registered successfully with id: ${_id}`)
    } catch (error) {
        next(error)

    }
})
//login with actual user
userRouter.post("/login", async (req, res, next) => {
    try {
        const { email, password } = req.body

        const user = await UserModel.findByCredentials(email, password)


        const token = await authenticate(user)
        res.cookie("accessToken", token, {
            secure: true,
            httpOnly: true,
            sameSite: true,
        })

        res.cookie("refreshToken", refreshToken1, {
            httpOnly: true,
            secure: true,
            path: "/refreshToken",
            sameSite: true,
        })


        res.send({ token, refreshToken1 })
    } catch (error) {
        next(error)
    }
})
//logout from this platform...
userRouter.post("/logout", async (req, res, next) => {
    try {
        req.user.refreshTokens = req.user.refreshTokens.filter(
            (t) => t.token !== req.token
        )
        await req.user.save()
        res.send()
    } catch (err) {
        next(err)
    }
})
//we will triger this in front-end
userRouter.post("/refreshToken", async (req, res, next) => {
    const oldRefreshToken = req.cookies.refreshToken
    if (!oldRefreshToken) {
        const error = new Error("Refresh token missing")
        error.httpStatusCode = 403
        next(error)

    } else {
        try {
            const tokens = await refreshToken1(oldRefreshToken)

            res.cookie("accessToken", tokens.token, {
                httpOnly: true,
            })
            res.cookie("refreshToken", tokens.refreshToken, {
                httpOnly: true,
                path: "/refreshToken",
            })
            res.send("ok")
        } catch (error) {
            console.log(error)
            const err = new Error(error)
            err.httpStatusCode = 403
            next(err)
        }
    }
})

userRouter.post("/:id/uploadImage", authorize, upload.single("image"), async (req, res, next) => {
    try {
        const id = req.params.id
        const user = await UserModel.findById(id)
        if (user) {
            res.send(user)
        } else {
            const error = new Error()
            error.httpStatusCode = 404
            next(error)
        }
    } catch (error) {
        console.log(error)
        next("While reading user list a problem occurred!")
        if (req.file) {
            const cloud_upload = cloudinary.uploader.upload_stream(
                {
                    folder: 'E-TECH'
                },
                async (err, data) => {
                    if (!err) {
                        console.log(req.user.profilePhoto)
                        req.user.profilePhoto = data.secure_url
                        await req.user.save({ validateBeforeSave: false })
                        res.status(201).send("image is added")
                    }
                }
            )

            streamifier.createReadStream(req.file.buffer).pipe(cloud_upload)

        } else {
            const err = new Error()
            err.httpStatusCode = 400
            err.message = ' image is missing';
            next(err)
        }
    }
})


module.exports = userRouter