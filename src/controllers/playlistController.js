const asyncHandler = require('express-async-handler')
const {StatusCodes} = require('http-status-codes')
const Artist = require('../models/Artist')
const Playlist = require('../models/Playlist')
const Song = require('../models/Song')
const User = require('../models/User')
const uploadToCloudinary = require('../utils/cloudinaryUpload')

//@desc - Create a new Playlist
//@route - POST /api/playlists 
//@Access - Private/admin
const createPlaylist = asyncHandler(async(req,res)=>{
    const {name, description, isPublic} = req.body
    //Validations 
    if(!name || !description){
        res.status(StatusCodes.BAD_REQUEST)
        throw new Error('Name and description are required')
    }
    if(name.length < 3 || name.length > 50){
        res.status(StatusCodes.BAD_REQUEST)
        throw new Error("Name must be between 3 and 50 characters")
    }
    if(description.length < 10 || description.length > 200){
        res.status(StatusCodes.BAD_REQUEST)
        throw new Error("Name must be between 10 and 200 characters")
    }
    //Check if playlist already exists
    const existingPlaylist = await Playlist.findOne({
        name,
        creator: req.user._id
    })

    if(existingPlaylist){
        throw new Error('A playlist with this name already exists')
    }

    //Upload playlist cover image if provided
    let coverImageUrl = ''
    if(req.files){
        const result = await uploadToCloudinary(req.files.path, "spotify/playlists")
        coverImageUrl = result.secure_url
    }

    //Create the playlist
    const playlist = await Playlist.create({
        name,
        description,
        creator: req.user._id,
        coverImage: coverImageUrl || undefined,
        isPublic: isPublic === "true"
    })
    res.status(StatusCodes.CREATED).json(playlist)
})

//@desc - Get all playlist with filtering and pagination
//@route - GET /api/playlists?search=summer&page=1&limit=1
//@Access - Public
const getPlaylists = asyncHandler(async (req,res)=>{
   const {search, page=1, limit=10} = req.query
   //Build filter Object
   const filter = {isPublic:true} //Only public playlists
   if(search){
    filter.$or = [
        {name: {$regex: search, $options: "i"}},
        {description: {$regex: search, $options: "i"}}
    ]
   }
   //Count total playlists with filter
   const count = await Playlist.countDocuments(filter)
   //Pagination
   const skip = (parseInt(page) - 1) * parseInt(limit)
   //Get playlists
   const playlists = await Playlist.find(filter)
   .sort({followers:-1})
   .limit(parseInt(limit))
   .skip(skip)
   .populate("creator", "name profilePicture")
   .populate("collaborators", "name profilePicture")

   res.status(StatusCodes.OK).json({
    playlists,
    page: parseInt(page),
    pages: Math.ceil(count / parseInt(limit)),
    totalPlaylists: count 
   })
})

//@desc - Get user's playlist
//@route - GET /api/playlists/user/me
//@Access - Private
const getUserPlaylist = asyncHandler(async(req,res)=>{
    const playlist = await Playlist.find({
        $or:[{creator: req.user._id},{collaborators: req.user._id}]
    }).sort({createdAt: -1})
    .populate("creator", "name profilePicture")
    res.status(StatusCodes.OK).json(playlist)
})

//@desc - Get playlist by id
//@route - GET /api/playlists/:id
//@Access - Private
const getUserPlaylistById = asyncHandler(async(req,res)=>{
    const playlist = await Playlist.findById(req.params.id)
    .populate("creator", "name profilePicture")
    .populate("collaborators", "name profilePicture")

    if(!playlist){
        res.status(StatusCodes.NOT_FOUND)
        throw new Error("Playlist not found")
    }

    //Check if the playlist is private and current user is not the creator or collaborator
    if(!playlist.isPublic && !(req.user && (playlist.creator.equals(req.user._id) || playlist.collaborators.some((collab)=>collab.equals(req.user._id))))){
        res.status(StatusCodes.FORBIDDEN)
        throw new Error("This playlist is private")
    }
    res.status(StatusCodes.OK).json(playlist)
})

//@desc - Update playlist
//@route - PUT /api/playlists/:id
//@Access - Private
const updatePlaylist = asyncHandler(async(req,res)=>{
    const {name,description,isPublic} = req.body
    const playlist = await Playlist.findById(req.params.id)
    if(!playlist){
        res.status(StatusCodes.NOT_FOUND)
        throw new Error('Playlist not found')
    }

    //Check if current user is creator or collaborator
    if(!playlist.creator.equals(req.user._id) && !playlist.collaborators.some((collab)=>collab.equals(req.user._id))){
        res.status(StatusCodes.FORBIDDEN)
        throw new Error("Playlist not found")
    }

    //Update the playlists fields
    playlist.name = name || playlist.name
    playlist.description = description || playlist.description
    if(playlist.creator.equals(req.user._id)){
        playlist.isPublic = isPublic !== undefined ? isPublic === "true" : playlist.isPublic
    }

    //Update cover image if provided
    if(req.files){
        const result = await uploadToCloudinary(req.files.path, "spotify/playlists")
        playlist.coverImage = result.secure_url
    }
    const updatedPlaylist = await playlist.save()
    res.status(StatusCodes.OK).json(updatedPlaylist)
})

//@desc - Delete playlist
//@route - DELETE /api/playlists/:id
//@Access - Private
const deletePlaylist = asyncHandler(async(req,res)=>{
    const playlist = await Playlist.findById(req.params.id)
    if(!playlist){
        res.status(StatusCodes.NOT_FOUND)
        throw new Error('Playlist not found')
    }

    //Only creator can delete it's own playlist
    if(!playlist.creator.equals(req.user._id)){
        res.status(StatusCodes.FORBIDDEN)
        throw new Error("Not authorized to delete the playlist")
    }

    await playlist.deleteOne()
    res.status(StatusCodes.OK).json({message: "Playlist removed"})
})

//@desc - Add songs to playlist
//@route - PUT /api/playlists/:id/add-song
//@Access - Private
const addSongToPlaylist = asyncHandler(async(req,res)=>{
    const {songIds} = req.body
    if(!songIds || !Array.isArray(songIds)){
        res.status(StatusCodes.BAD_REQUEST)
        throw new Error("Song IDs are required")
    }
    //Find the playlist
    const playlist = await Playlist.findById(req.params.id)
    if(!playlist){
        res.status(StatusCodes.NOT_FOUND)
        throw new Error('Playlist not found')
    }

    //Check if the current user is a creator or collaborator
    if(!playlist.creator.equals(req.user._id) && !playlist.collaborators.some((collab)=>collab.equals(req.user._id))){
        res.status(StatusCodes.FORBIDDEN)
        throw new Error("Not authorized tp modify this playlist")
    }
    //Add songs to playlist
    for(const songId of songIds){
        //check if song exist
        const song = await Song.findById
        if(!song){
            continue //Skip if song dosen't exist
        }
        //Check if song already in a playlist
        if(playlist.songs.includes(songId)){
            continue // Skip if song already in the playlist
        }
        //Add song to playlist
        playlist.songs.push(songId)
    }
    await playlist.save()
    res.status(StatusCodes.OK).json(playlist)
})

//@desc - Remove songs to playlist
//@route - PUT /api/playlists/:id/remove-song/:songId
//@Access - Private
const removeSongFromPlaylist = asyncHandler(async(req,res)=>{
    //Find the playlist
    const playlist = await Playlist.findById(req.params.id)
    if(!playlist){
        res.status(StatusCodes.NOT_FOUND)
        throw new Error('Playlist not found')
    }
     //Check if the current user is a creator or collaborator
    if(!playlist.creator.equals(req.user._id) && !playlist.collaborators.some((collab)=>collab.equals(req.user._id))){
        res.status(StatusCodes.FORBIDDEN)
        throw new Error("Not authorized tp modify this playlist")
    }
    const songId = req.params.songId

    //Check if song is in the playlist
    if(!playlist.songs.includes(songId)){
        res.status(StatusCodes.BAD_REQUEST)
        throw new Error("Song is not in the playlist")
    }

    playlist.songs = playlist.songs.filter((id)=>id.toString() !== songId)
    await playlist.save()
    res.status(StatusCodes.OK).json({message:"Song removed from the playlist"})
})

//@desc - Add collaborator to playlist
//@route - PUT /api/playlists/:id/add-collaborator
//@Access - Private
const addCollaborator = asyncHandler(async(req,res)=>{
    const userId = req.body.userId
    if(!userId){
        res.status(StatusCodes.BAD_REQUEST)
        throw new Error("User id is required")
    }

    //Check if user exists
    const user = await User.findById(userId)
    if(!user){
         res.status(StatusCodes.NOT_FOUND)
        throw new Error('User not found')
    }

    //Find the playlist
    const playlist = await Playlist.findById(req.params.id)
     if(!playlist){
         res.status(StatusCodes.NOT_FOUND)
        throw new Error('Playlist not found')
    }

    //Only creators can add collaborators
    if(!playlist.creator.equals(req.user._id)){
        res.status(StatusCodes.FORBIDDEN)
        throw new Error('Only the playlist creator can add collaborators')
    }

    //Check if user is already a collaborator
    if(playlist.collaborators.includes(userId)){
        res.status(StatusCodes.BAD_REQUEST)
        throw new Error('User is already a collaborator')
    }

    //Add user to collaborators
    playlist.collaborators.push(userId)
    res.status(StatusCodes.OK).json(playlist)
})

//@desc - Remove collaborator to playlist
//@route - PUT /api/playlists/:id/remove-collaborator
//@Access - Private
const removeCollaborator = asyncHandler(async(req,res)=>{
    const userId = req.body.userId
    if(!userId){
        res.status(StatusCodes.BAD_REQUEST)
        throw new Error("User id is required")
    }
    //Find the playlist
    const playlist = await Playlist.findById(req.params.id)
     if(!playlist){
         res.status(StatusCodes.NOT_FOUND)
        throw new Error('Playlist not found')
    }

    //Only creators can remove collaborators
    if(!playlist.creator.equals(req.user._id)){
        res.status(StatusCodes.FORBIDDEN)
        throw new Error('Only the playlist creator can remove collaborators')
    }

    //Check if user is a collaborator
    if(playlist.collaborators.includes(userId)){
        res.status(StatusCodes.BAD_REQUEST)
        throw new Error('User is not a collaborator')
    }

    //Remove user from collaborator
    playlist.collaborators = playlist.collaborators.filter((id)=> id.toString() !== userId)
    await playlist.save()
    res.status(StatusCodes.OK).json(playlist)
})

//@desc - Get featured playlist
//@route - PUT /api/playlists/featured?limit=5
//@Access - Private
const getFeaturedPlaylists = asyncHandler(async(req,res)=>{
    const {limit=5} = req.query
    const filter = {isPublic:true}
    const playlists = await Playlist.find(filter)
    .limit(parseInt(limit))
    .sort({followers: -1})
    .populate("creator", "name profilePicture")
    res.status(StatusCodes.OK).json(playlists)
})

module.exports = {
    createPlaylist,
    getPlaylists,
    getUserPlaylist,
    getUserPlaylistById,
    updatePlaylist,
    deletePlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
    addCollaborator,
    removeCollaborator,
    getFeaturedPlaylists
}