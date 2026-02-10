const mongoose = require('mongoose')

const albumSchema = new mongoose.Schema({
    title:{
        type:String,
        required:[true,'Album title is required'],
        trim: true
    },
    artist:{
        type: mongoose.Schema.Types.ObjectId,
        required:[true,'Artist is required'],
        ref: "Artist"
    },
    releasedDate:{
        type: Date,
        default:Date.now()
    },
    coverImage:{
        type:String,
        default:"https://media.istockphoto.com/id/1466761319/photo/six-parts-of-musician-hands-playing-musical-instrument-music-background.jpg?s=612x612&w=0&k=20&c=SE9esLPhz-toczeLKUDXVsx3oS8xfHUIEckJmjfupoo="
    },
    songs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Song"
    }],
    genre:{
        type:String,
        trim: true
    },
    likes: {
        type: Number,
        default: 0
    },
    description: {
        type: String,
        trim:true
    },
    isExplicit: {
        type: Boolean,
        default:false
    }
},{timestamps:true})

const Album = mongoose.model("Album", albumSchema)
module.exports = Album