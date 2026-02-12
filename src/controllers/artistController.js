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

//@desc - Get all Artists with filtering and pagination
//@route - GET /api/artist?genre=Rock&search=pink&page=1&limit=10
//@Access - Public

const getArtists = asyncHandler(async (req,res)=>{
   const {genre, search, page=1, limit=10} = req.query
   //Build filter Object
   const filter = {}
   if(genre) filter.genres = {$in:[genre]}
   if(search){
    filter.$or = [
        {name: {$regex: search, $options: "i"}},
        {bio: {$regex: search, $options: "i"}}
    ]
   }

   //Count total artists with filter
   const count = await Artist.countDocuments(filter)
   //Pagination
   const skip = (parseInt(page) - 1) * parseInt(limit)
   //Get artist
   const artists = await Artist.find(filter)
   .sort({followers:-1})
   .limit(parseInt(limit))
   .skip(skip)

   res.status(StatusCodes.OK).json({
    artists,
    page: parseInt(page),
    pages: Math.ceil(count / parseInt(limit)),
    totalArtists: count 
   })
})

//@desc - Get artist by id 
//@route - GET /api/artists/id
//@Access - Public

const getArtistsById = asyncHandler(async(req,res)=>{
    const artist = await Artist.findById(req.params.id)
    if(artist){
        res.status(StatusCodes.OK).json(artist)
    }else{
        res.status(StatusCodes.NOT_FOUND)
        throw new Error("Artist not found")
    }
})

//@desc - Update Artist Details 
//@route - PUT /api/artists/id
//@Access - Private/Admin

const updateArtist = asyncHandler(async(req,res)=>{
    const {name, bio, genres, isVerified} = req.body
    const artist = await Artist.findById(req.params.id)
    if(!artist){
        res.status(StatusCodes.NOT_FOUND)
        throw new Error('Artist not found')
    }
    //Update Artist details
    artist.name = name || artist.name
    artist.bio = bio || artist.bio
    artist.genres = genres || artist.genres
    artist.isVerified = isVerified !== undefined ? isVerified === "true" : artist.isVerified

    //Update image if provided
    if(req.file){
       const result = await uploadToCloudinary(req.file.path, "spotify/artists")
       artist.image = result.secure_url
    }
    //reSave
    const updateArtist = await artist.save()
    res.status(StatusCodes.OK).json(updateArtist)
})

//@desc - Delete Artist 
//@route - DELETE /api/artists/id
//@Access - Private/Admin

const deleteArtist = asyncHandler(async(req,res)=>{
    const artist = await Artist.findById(req.params.id)
    if(!artist){
        res.status(StatusCodes.NOT_FOUND)
        throw new Error("Artist not found")
    }
    //Delete all songs by artist
    await Song.deleteMany({ artist: artist._id})

    //Delete all albums by artist
    await Album.deleteMany({ artist: artist._id})
    await artist.deleteOne()
    res.status(StatusCodes.OK).json({message:"Artist removed"})
})

//@desc - Get top 10 artists by followers
//@route - GET /api/artists/top
//@Access - Public

const getTopArtists = asyncHandler(async(req,res)=>{
    const {limit} = req.query
    const artists = await Artist.find()
    .sort({followers: -1})
    .limit(parseInt(limit))
    
    res.status(StatusCodes.OK).json(artists)
})

//@desc - Get Artist's top songs
//@route - GET /api/artists/:id/top-songs?limit=5
//@Access - Public

const getArtistTopSongs = asyncHandler(async(req,res)=>{
    const {limit} = req.query
    const songs = await Song.find()
    .sort({plays: -1})
    .limit(parseInt(limit))
    .populate('album','title coverImage')

    if(songs.length > 0){
      res.status(StatusCodes.OK).json(artists)
    }else{
        res.status(StatusCodes.NOT_FOUND)
        throw new Error('No songs found for this album')
    }

})

module.exports = { 
    createArtist, 
    getArtists,
    getArtistsById,
    updateArtist,
    deleteArtist,
    getTopArtists,
    getArtistTopSongs
}