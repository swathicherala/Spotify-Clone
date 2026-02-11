const asyncHandler = require('express-async-handler')
const {StatusCodes} = require('http-status-codes')
const Artist = require('../models/Artist')
const Album = require('../models/Album')
const Song = require('../models/Song')
const uploadToCloudinary = require('../utils/cloudinaryUpload')

//@desc - Create a new Artist
//@route - POST /api/artist 
//@Access - Private

const createArtist = asyncHandler(async (req,res)=>{
    const {name, bio, genres} = req.body
    if(!name || !bio || !genres){
        res.status(StatusCodes.BAD_REQUEST)
        throw new Error("Name, bio, genres are required")
    }

    //Check if artist already exists
    const existsArtist = await Artist.findOne({name})
    if(existsArtist){
        res.status(StatusCodes.BAD_REQUEST)
        throw new Error("Artist already exists")
    }

    //upload artist image if provided
    let imageUrl = ""
    if(req.file){
        const result = await uploadToCloudinary(req.file.path, "spotify/artists")
        imageUrl = result.secure_url
    }

    //Create the artist
    const artist = await Artist.create({
        name,
        bio,
        genres,
        isVerified:true,
        image: imageUrl
    })
    res.status(StatusCodes.CREATED).json(artist)
})

module.exports = { 
    createArtist, 
}