const mongoose = require('mongoose')

const artistSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true,'Artist name is required'],
        trim: true
    },
    bio:{
        type: String,
        trim: true
    },
    image:{
        type:String,
        default:"https://media.istockphoto.com/id/1155368162/photo/beautiful-young-hipster-woman-with-curly-hair-with-red-guitar-in-neon-lights-rock-musician-is.jpg?s=2048x2048&w=is&k=20&c=VVh0Pwj2MNN5UwSfdZ1fo8QeKkdFqXs3TjsNEvYGNM8="
    },
    genres: [{
        type: String,
        ref:"Song"
    }],
    followers:{
        type:Number,
        default: 0
    },
    albums: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Album"
    }],
    songs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Song"
    }],
    isVerified: {
        type: Boolean,
        default: false
    }
},{timestamps:true})

const Artist = mongoose.model("Artist", artistSchema)
module.exports = Artist