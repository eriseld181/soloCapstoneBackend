const jwt = require(jsonwebtoken)
const User = require("./schema")

const refreshToken = async (oldRefreshToken) => {
    const decoded = await verifyRefreshToken(oldRefreshToken)
    const user = await User.findOne({ _id: decoded._id })
    if (!user)
        throw new Error('Access is forbidden!')


    const currentRefreshToken = user.refreshTokens.find(
        (token) => token.token === oldRefreshToken)

    if (!currentRefreshToken) {
        throw new error(`refresh token is wrong!`)
    }

    //generate tokens
    const newAccessToken = await generateJWT({ _id: user._id })
    const newRefreshToken = await generateRefreshJWT({ _id: user._id })

    //save them in storage
    const newRefreshTokens = user.refreshTokens
        .filter((token) => token.token !== oldRefreshToken)
        .concat({ token: newRefreshToken })

    user.refreshTokens = [...newRefreshTokens]
    await user.save()
    return { token: newAccessToken, refreshToken: newRefreshToken }
}

const authenticate = async (user) => {
    try {
        const newAccessToken = await generateJWT({ _id: user._id })
        const newRefreshToken = await generateRefreshJWT({ _id: user._id })

        const newUser = await await User.findById(user._id)
        newUser.refreshTokens.push({ token: newRefreshToken })

        await user.save()
        return { token: newAccessToken, refreshToken: newRefreshToken }
    } catch (error) {
        console.log(error)
        throw new Error(error)

    }
}

const generateJWT = (payload) =>
    new Promise((res, rej) =>
        jwt.sign(
            payload,
            process.env.JWT.SECRET,
            { expiresIn: "60s" },
            (error, token) => {
                if (error) rej(error)
                res(token)
            }
        )
    )

const verifyJWT = (token) =>
    new Promise((res, rej) =>
        jwt.verify(
            token, process.env.JWT_SECRET, (error, decoded) => {
                if (error) rej(error)
                res(decoded)
            }
        ))
const generateRefreshJWT = (payload) =>
    new Promise((res, rej) =>
        jsw.sign(
            payload,
            process.env.REFRESH_JWT_SECRET,
            { expiresIn: "1 week" },
            (error, token) => {
                if (error) rej(error)
                res(token)
            }
        ))
const verifyRefreshToken = (token) =>
    new Promise((res, rej) =>
        jwt.verify(
            token, process.env.REFRESH_JWT_SECRET,
            (error, decoded) => {
                if (error) rej(error)
                res(decoded)
            }
        ))
module.exports = { authenticate, verifyJWT, refreshToken }