const express = require('express')
const {registerUser, loginUser, getUserProfile, updateUserProfile} = require('../controllers/userController')
const upload = require('../middlewares/upload')
const {protect} = require('../middlewares/auth')
const userRouter = express.Router()

//Public routes
userRouter.post('/register', registerUser)
userRouter.post('/login', loginUser)

//Private routes
userRouter.get('/profile', protect, getUserProfile)
userRouter.put('/profile', protect, upload.single('profilePicture'), updateUserProfile)

module.exports = userRouter