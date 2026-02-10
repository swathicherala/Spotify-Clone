const mongoose = require('mongoose')

const songsSchema = new mongoose.Schema({
    title:{
        type:String,
        required:[true,'Song title is required'],
        trim: true
    },
    artist:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Artist",
        required: [true, 'Artist is required']
    },
    album:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Album"
    },
    duration:{
        type:Number,
        required:[true,'Song duration is required']
    },
    audioUrl:{
        type:String,
        required:[true,'Audio url is required']
    },
    coverImage:{
        type:String,
        default:"https://media.istockphoto.com/id/1155368162/photo/beautiful-young-hipster-woman-with-curly-hair-with-red-guitar-in-neon-lights-rock-musician-is.jpg?s=2048x2048&w=is&k=20&c=VVh0Pwj2MNN5UwSfdZ1fo8QeKkdFqXs3TjsNEvYGNM8="
    },
    releaseDate: [{
        type: Date,
        default: Date.now()
    }],
    genre:{
        type:String,
        trim: true
    },
    plays:{
        type:Number,
        default:0
    },
    likes:{
        type:Number,
        default:0
    },
    featuredArtists: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Artist"
    }],
    isExplicit: {
        type: Boolean,
        default: false
    }
},{timestamps:true})

const Song = mongoose.model("Song", songsSchema)
module.exports = Song