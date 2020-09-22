const express = require('express')
const q2m = require('query-to-mongo')
const passport = require("passport")
const { authenticate, refreshToken } = require("./authentication")
const UserModel = require('./schema')
const userRouter = express.Router()

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

        const { token, refreshToken } = await authenticate(user)
        console.log("this is token", token, refreshToken)
        res.cookie("accessToken", token, {
            path: "/",
            httpOnly: true,
            sameSite: true,
        })
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            sameSite: true,
        })
        res.send({ token, refreshToken })
    } catch (error) {
        console.log(error)
        next(error)
    }
})


//Get all Tutors and Students
userRouter.get("/", async (req, res, next) => {
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

userRouter.get("/me", async (req, res, next) => {
    try {
        res.send(req.user)
        console.log(req.user)
        next("While reading users list a problem occurred!")
    } catch (error) {

    }
})

module.exports = userRouter