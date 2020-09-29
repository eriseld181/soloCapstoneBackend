const express = require('express')
const q2m = require('query-to-mongo')
const userSchema = require('../users/schema')
const ProjectSchema = require('./schema')
const { authorize, studentOnlyMiddleware } = require("../middlewares/authorize")
const projectRouter = express.Router()

//Get all Projects
projectRouter.get("/", async (req, res, next) => {
    try {
        const query = q2m(req.query)

        const projects = await ProjectSchema.find(query.criteria, query.options.fields)

            .skip(query.options.skip)
            .limit(query.options.limit)
            .sort(query.options.sort)

        res.send({
            projects,
            total: projects.length,
        })
    } catch (error) {
        console.log(error)
        next(error)
    }
})
//Post a new project
projectRouter.post("/add", authorize, async (req, res, next) => {
    try {
        console.log(req.user.id)
        const user = req.user.id
        const newProject = new ProjectSchema(req.body)
        await newProject.save()

        const attachUser = await userSchema.findByIdAndUpdate({ _id: user })

        const projects = attachUser.projects
        projects.push(newProject._id)
        await attachUser.save({ validateBeforeSave: false })
        res.status(201).send(attachUser)
    } catch (error) {
        next(error)

    }
})

//Get a single project
projectRouter.put("/:id", async (req, res, next) => {
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


module.exports = projectRouter