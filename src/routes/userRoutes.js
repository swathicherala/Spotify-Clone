const express = require('express')
const {registerUser, loginUser, getUserProfile, updateUserProfile, toggleLikeSong, toggleFollowArtist, toggleFollowPlaylist} = require('../controllers/userController')
const upload = require('../middlewares/upload')
const {protect} = require('../middlewares/auth')
const userRouter = express.Router()

//Public routes
userRouter.post('/register', registerUser)
userRouter.post('/login', loginUser)

//Private routes
userRouter.get('/profile', protect, getUserProfile)
userRouter.put('/profile', protect, upload.single('profilePicture'), updateUserProfile)
userRouter.put('/like-song/:id', protect, toggleLikeSong)
userRouter.put('/follow-artist/:id', protect, toggleFollowArtist)
userRouter.put('/follow-playlist/:id', protect, toggleFollowPlaylist)

module.exports = userRouter