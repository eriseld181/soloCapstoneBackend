const express = require('express')
const q2m = require('query-to-mongo')
const passport = require("passport")
const { authenticate, checkRefreshToken } = require("./authentication")
const UserModel = require('./schema')
const userRouter = express.Router()
const { authorize, tutorOnlyMiddleware } = require("../middlewares/authorize")
//Register a new user
userRouter.post("/register", async (req, res, next) => {
    try {
        const newUser = new UserModel(req.body)
        console.log("newUser:", newUser)
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
        console.log("this is user", user)

        const token = await authenticate(user)
        res.cookie("accessToken", token, {
            secure: true,
            httpOnly: true,
            sameSite: "none",
        })
        res.cookie("refreshToken", checkRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
        })


        res.send({ token, checkRefreshToken })
    } catch (error) {
        next(error)
    }
})
//logout from this platform...

userRouter.post("/logout", authorize, async (req, res, next) => {
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
            const tokens = await checkRefreshToken(oldRefreshToken)

            res.cookie("accessToken", tokens.token, {
                httpOnly: true,
            })
            res.cookie("refreshToken", tokens.refreshToken, {
                httpOnly: true,
                path: "/users/refreshToken",
            })
            res.send()
        } catch (error) {
            console.log(error)
            const err = new Error(error)
            err.httpStatusCode = 403
            next(err)
        }
    }
})

//Get all Tutors and Students
userRouter.get("/", authorize, async (req, res, next) => {
    try {
        const query = q2m(req.query)

        const users = await UserModel.find(query.criteria, query.options.fields)
            .skip(query.options.skip)
            .limit(query.options.limit)
            .sort(query.options.sort)
        console.log(users)
        res.send({
            users,
            total: users.length,
        })
    } catch (error) {
        console.log(error)
        next(error)
    }
})

userRouter.get("/:username", authorize, async (req, res, next) => {
    try {
        console.log(req.params.username)
        if (req.user.username === req.params.username) {
            res.send(req.user)
            console.log(req.user)
        }
        else {
            next("You have no rights!")
            console.log("invalid username")
        }

        next("While reading users list a problem occurred!")
    } catch (error) {

    }
})



module.exports = userRouter