const express = require('express')
const mongoose = require('mongoose')
const userRouter = require('./src/routes/userRoutes')
const artistRouter = require('./src/routes/artistRoutes')
const albumRouter = require('./src/routes/albumRoutes')
const songRouter = require('./src/routes/songRoutes')
const playlistRouter = require('./src/routes/playlistRoutes')
const dotenv = require('dotenv')
const { StatusCodes } = require('http-status-codes')
//Load environment variables
dotenv.config()

//Initialize express
const app = express()

//Connect to Database
mongoose.connect(process.env.MONGO_URL)
.then(()=>{
    console.log('Mongodb Connected')
}).catch((err)=>{
    console.log('Error connecting to database',err)
})
//Pass incoming data
app.use(express.json())
//Routes
app.use('/api/users', userRouter)
app.use('/api/artists', artistRouter)
app.use('/api/albums', albumRouter)
app.use('/api/songs', songRouter)
app.use('/api/playlists', playlistRouter)

//Error handling Middleware
app.use((req,res,next)=>{
    const error = new Error('Not Found')
    error.status = StatusCodes.NOT_FOUND
    next(error)
})

//Global error handling middleware
app.use((err,req,res,next)=>{
    res.status(err.status || StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: err.message || 'Internal Server Error',
        status:'error'
    })
})

const PORT = process.env.PORT || 5000
app.listen(PORT,()=>{
    console.log(`Server is running at ${PORT}`)
})