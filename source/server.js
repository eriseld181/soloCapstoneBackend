const express = require('express')
const cors = require('cors')
const listEndPoints = require('express-list-endpoints')
const mongoose = require('mongoose')



const server = express()
const port = process.env.PORT
server.use(express.json())

mongoose.connect(process.env.CONNECTION_DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
})
    .then(
        server.listen(port, () => {
            console.log("The server is running on port", port)
        })
    )
    .catch((error) => console.log(error))