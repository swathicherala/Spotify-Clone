const express = require('express')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
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

const PORT = process.env.PORT || 5000
app.listen(PORT,()=>{
    console.log(`Server is running at ${PORT}`)
})