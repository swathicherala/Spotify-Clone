const asyncHandler = require('express-async-handler')
const {StatusCodes} = require('http-status-codes')
const User = require('../models/User')
const uploadToCloudinary = require('../utils/cloudinaryUpload')
const generateToken = require('../utils/generateToken')

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

//@desc - Login a new user
//@route - POST /api/users/login
//@Access - Public
const loginUser = asyncHandler(async(req,res)=>{
    const {email, password} = req.body
    //Find user
    const user = await User.findOne({email})
    //Check if user exists and password matches
    if(user && (await user.matchPassword(password))){
        res.status(StatusCodes.OK).json({
            _id: user._id,
            email: user.email,
            isAdmin: user.isAdmin,
            profilePicture: user.profilePicture,
            token: generateToken(user._id)
        })
    }else{
        res.status(StatusCodes.UNAUTHORIZED)
        throw new Error('Invalid email or password')
    }
})

// Get User Profile
const getUserProfile = asyncHandler(async (req,res)=>{
    //Find the User
    const user = await User.findById(req.user._id).select("-password")
    if(user){
        res.status(StatusCodes.OK).json(user)
    }else{
        res.status(StatusCodes.NOT_FOUND)
        throw new Error('User Not Found')
    }
})
// updateUserProfile
const updateUserProfile = asyncHandler(async (req,res)=>{
    const user = await User.findById(req.user._id)
    const {name,email, password} = req.body
    if(user){
        user.name = name || user.name
        user.email = email || user.email
        //Check is the password is updated 
        if(password){
            user.password = password
        }
        
        //Upload profile picture is provided
        if(req.file){
            const result = await uploadToCloudinary(req.file.path, "spotify/users")
            user.profilePicture = result.secure_url
        }
        const updatedUser = await user.save()
        res.status(StatusCodes.OK).json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            profilePicture: updatedUser.profilePicture,
            isAdmin: updatedUser.isAdmin,
        })
    }else{
        res.status(StatusCodes.NOT_FOUND)
        throw new Error("User Not Found")
    }
    
})
//! toggleLikeSong
const toggleLikeSong = asyncHandler(async (req,res)=>{})
//! toggleFollowArtist
const toggleFollowArtist = asyncHandler(async (req,res)=>{})
//! toggleFollowPlaylist
const toggleFollowPlaylist = asyncHandler(async (req,res)=>{})
//! getUser
const getUser = asyncHandler(async (req,res)=>{})

module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile
}