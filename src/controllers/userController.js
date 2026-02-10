const asyncHandler = require('express-async-handler')
const {StatusCodes} = require('http-status-codes')
const User = require('../models/User')

//@desc - Register a new user
//@route - POST /api/users/register
//@Access - Public

const registerUser = asyncHandler(async(req,res)=>{
    const {name, email, password} = req.body
    const userExists = await User.findOne({email})
    if(userExists){
         res.status(StatusCodes.BAD_REQUEST)
        throw new Error('User already exists')
    }
    const newUser = await User.create({
        name, email, password
    })
    if(newUser){
         res.status(StatusCodes.CREATED).json({
            _id:newUser._id,
            name:newUser.name,
            email:newUser.email,
            isAdmin: newUser.isAdmin,
            profilePicture: newUser.profilePicture
        })
    }else{
         res.status(StatusCodes.BAD_REQUEST)
    }
})

module.exports = {registerUser}