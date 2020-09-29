const express = require('express')
const q2m = require('query-to-mongo')

const { authenticate, refreshToken1 } = require("./authentication")
const UserModel = require('./schema')
const userRouter = express.Router()
const { authorize, studentOnlyMiddleware } = require("../middlewares/authorize")

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
userRouter.get("/:username", authorize, async (req, res, next) => {
    try {

        if (req.user.username === req.params.username) {
            const user = await UserModel.findOne({ username: req.params.username }).populate("projects")
            res.send(user)

        }
        else {
            next("You have no rights!")
            console.log("invalid username")
        }

        next("While reading users list a problem occurred!")
    } catch (error) {

    }
})
//Edit a single person
userRouter.put("/:username", async (req, res, next) => {
    try {
        const updates = Object.keys(req.body)

        try {
            updates.forEach((update) => (req.user[update] = req.body[update]))
            await req.user.save()
            res.send(req.user)
        } catch (error) {
            res.status(400).send(error)
            console.log(error)
        }
    } catch (error) {
        next(error)
    }
})
//Delete a single person
userRouter.delete("/:username", async (req, res, next) => {
    try {
        const username = req.params.username

        await req.user.remove()
        res.send(`${username} has been deleted succesfully`)

    } catch (error) {
        next(error)
    }
})
//==========================================================================
//Register a new user
userRouter.post("/register", async (req, res, next) => {
    try {
        const newUser = new UserModel(req.body)

        const { _id } = await newUser.save()
        res.status(201).send(_id)
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

module.exports = userRouter