const express = require('express')
const {createArtist} = require('../controllers/artistController')
const upload = require('../middlewares/upload')
const {protect, isAdmin} = require('../middlewares/auth')
const artistRouter = express.Router()

//Public routes
// artistRouter.post('/register', createArtist)
// artistRouter.post('/login', loginUser)

//Admin
artistRouter.post('/', protect, isAdmin, upload.single('image'), createArtist)
// userRouter.put('/profile', protect, upload.single('profilePicture'), updateUserProfile)

module.exports = artistRouter