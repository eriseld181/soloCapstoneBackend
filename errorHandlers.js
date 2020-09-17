const badRequest = (error, req, res, next) => {
    if (error.httpStatusCode === 400) {
        res.status(400).send(error.message)
    }
    next(error)
}
const notAuthorized = (error, req, res, next) => {
    if (error.httpStatusCode === 401) {
        res.status(401).send(error.message || "You are not authorized, please contact admin!")
    }
    next(error)
}
const forbidden = (error, req, res, next) => {
    if (error.httpStatusCode === 403) {
        res.status(403).send(error.message || "You are forbidden, please contact admin!")
    } next(error)
}
const notFound = (error, req, res, next) => {
    if (error.httpStatusCode === 404) {
        res.status(500).send(error.message || "Resource not found,please contact admin!")

    } next(error)
}
const generalError = (error, req, res, next) => {
    if (!res.headersSent) {
        res.status(error.httpStatusCode || 500).send(error.message)
    }
}
module.exports = {
    badRequest,
    notAuthorized,
    forbidden,
    notFound,
    generalError
}