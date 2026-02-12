const asyncHandler = require('express-async-handler')
const {StatusCodes} = require('http-status-codes')
const User = require('../models/User')
const Song = require('../models/Song')
const Artist = require('../models/Artist')
const Playlist = require('../models/Playlist')
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
//@route - GET /api/users/login
//@Access - Private
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

//@desc - Get user profile
//@route - POST /api/users/login
//@Access - Public
const getUserProfile = asyncHandler(async (req,res)=>{
    //Find the User
    const user = await User.findById(req.user._id).select("-password")
    .populate('likedSongs', 'title artist duration')
    .populate('likedAlbums', 'title artist coverImage')
    .populate('followedArtists', 'name image')
    .populate('followedPlayLists', 'name creator coverImage')
    if(user){
        res.status(StatusCodes.OK).json(user)
    }else{
        res.status(StatusCodes.NOT_FOUND)
        throw new Error('User Not Found')
    }
})

// updateUserProfile
//@desc - Login a new user
//@route - PUT /api/users/profile
//@Access - Private
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

// toggleLikeSong
//@desc - Like/unlike a song
//@route - PUT /api/users/like-song/:id
//@Access - Private
const toggleLikeSong = asyncHandler(async (req,res)=>{
    const songId = req.params.id
    const user = await User.findById(req.user._id)
    if(!user){
        res.status(StatusCode.NOT_FOUND)
        throw new Error("User not found ")
    }
    const song = await Song.findById(songId)
    if(!song){
        res.status(StatusCodes.NOT_FOUND)
        throw new Error("Song not found ")
    }
    //Check if song is already liked
    const songIndex = user.likedSongs.indexOf(songId)
    if(songIndex === -1){
        //Add song to liked songs
        user.likedSongs.push(songId)

        //Increase the song likes count
        song.likes += 1
        await song.save()
    }else{
        //Remove songs from liked songs
        user.likedSongs.splice(songIndex, 1)
        //Decrement song's like count (ensure it doesn't go below 0)
        if(song.likes > 0){
            song.likes -= 1
        }
    }
    await Promise.all([user.save(), song.save()]) // Save both user and song together
    res.status(StatusCodes.OK).json({
        likedSongs: user.likedSongs,
        message: songIndex === -1 ? "Song added to liked songs" : "Song removed from liked songs"
    })
})

// toggleFollowArtist
//@desc - Follow/unfollow an artist
//@route - PUT /api/users/follow-artist/:id
//@Access - Private
const toggleFollowArtist = asyncHandler(async (req,res)=>{
    const artistId = req.params.id
    const user = await User.findById(req.user._id)
    if(!user){
        res.status(StatusCodes.NOT_FOUND)
        throw new Error("User not found")
    }

    //Find the artist
    const artist = await Artist.findById(artistId)
    if(!artist){
        res.status(StatusCodes.NOT_FOUND)
        throw new Error("Artist not found")
    }

    //Check if artist is already followed
    const artistIndex = user.followedArtists.indexOf(artistId)
    if(artistIndex === -1){
        user.followedArtists.push(artistId)
        artist.followers += 1
    }else{
        //Remove artist to followed artist
        user.followedArtists.splice(artistIndex, 1)
        //Decrement followers like count (ensure it doesn't go below 0)
        if(artist.followers > 0){
            artist.followers -= 1
        }
    }
    await Promise.all([user.save(), artist.save()])
    res.status(StatusCodes.OK).json({
        followedArtist: user.followedArtists,
        message: artistIndex === -1 ? "Artist followed" : "Artist unfollowed"
    })
})

//  toggleFollowPlaylist
//@desc - Like/unlike a song
//@route - PUT /api/users/like-song/:id
//@Access - Private
const toggleFollowPlaylist = asyncHandler(async (req,res)=>{
    const playlistId = req.params.id
    const user = await User.findById(req.user._id)
    if(!user){
        res.status(StatusCodes.NOT_FOUND)
        throw new Error("User not found")
    }

    //Find the playlist
    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        res.status(StatusCodes.NOT_FOUND)
        throw new Error("Playlist not found")
    }

    //Check if playlist is already followed
    const playlistIndex = user.followedPlayLists.indexOf(playlistId)
    if(playlistIndex === -1){
        user.followedPlayLists.push(playlistId)
        playlist.followers += 1
    }else{
        //Remove playlist to followed playlist
        user.followedPlayLists.splice(playlistIndex, 1)
        //Decrement followers like count (ensure it doesn't go below 0)
        if(playlist.followers > 0){
            playlist.followers -= 1
        }
    }
    await Promise.all([user.save(), playlist.save()])
    res.status(StatusCodes.OK).json({
        followedPlayLists: user.followedPlayLists,
        message: playlistIndex === -1 ? "Playlist followed" : "Playlist unfollowed"
    })
})
//! getUser
const getUser = asyncHandler(async (req,res)=>{})

module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    toggleLikeSong,
    toggleFollowArtist,
    toggleFollowPlaylist
}