const jwt = require("jsonwebtoken")
const userModel = require("../users/schema")
const { verifyJWT } = require("../users/authentication")

const authorize = async (req, res, next) => {
    try {
        const token = req.cookies.accessToken

        const decoded = await verifyJWT(token)

        const user = await userModel.findOne({ _id: decoded._id })

        if (!user) { throw new Error() }

        req.token = token
        req.user = user

        next()
    } catch (e) {
        console.log(e)
        const error = new Error("Please authenticate!")
        error.httpStatusCode = 401
        next(error)

    }
}
const tutorOnlyMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies.accessToken

        const decoded = await verifyJWT(token)

        const user = await userModel.findOne({ _id: decoded._id })


        if (!user) { throw new Error() }
        else {
            // console.log("user", req.user)
            console.log("user 2", user.role)
            if (user && user.role === "tutor") {
                req.token = token
                req.user = user
                next()
            }
            else {
                const error = new Error("You cannot perform this action, only tutor can!")
                error.httpStatusCode = 403
                next(error)
            }
        }
    } catch (e) {
        console.log(e)
        const error = new Error("Please authenticate!")
        error.httpStatusCode = 401
        next(error)

    }
}

const adminOnlyMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies.accessToken

        const decoded = await verifyJWT(token)

        const user = await userModel.findOne({ _id: decoded._id })


        if (!user) { throw new Error() }
        else {
            // console.log("user", req.user)
            console.log("user 2", user.role)
            if (user && user.role === "admin") {
                req.token = token
                req.user = user
                next()
            }
            else {
                const error = new Error("You cannot perform this action, only Admin can!")
                error.httpStatusCode = 403
                next(error)
            }
        }
    } catch (e) {
        console.log(e)
        const error = new Error("Please authenticate!")
        error.httpStatusCode = 401
        next(error)

    }
}



module.exports = { authorize, tutorOnlyMiddleware, adminOnlyMiddleware }


