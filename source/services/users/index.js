const express = require('express')
const q2m = require('query-to-mongo')


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
module.exports = userRouter