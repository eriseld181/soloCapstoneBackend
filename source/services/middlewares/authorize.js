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
    if (req.user && req.user.role === "tutor") next()
    else {
        const error = new Error("You cannot perform this action, only tutor can!")
        error.httpStatusCode = 403
        next(error)
    }
}
module.exports = { authorize, tutorOnlyMiddleware }