const mongoose = require('mongoose')

const playlistsSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true,'Playlist name is required'],
        trim: true
    },
    description:{
        type: String,
        trim: true
    },
    
    coverImage:{
        type:String,
        default:"https://media.istockphoto.com/id/1155368162/photo/beautiful-young-hipster-woman-with-curly-hair-with-red-guitar-in-neon-lights-rock-musician-is.jpg?s=2048x2048&w=is&k=20&c=VVh0Pwj2MNN5UwSfdZ1fo8QeKkdFqXs3TjsNEvYGNM8="
    },
    creator:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required:[true,'Creator is required'],
    },
     songs: [{
       type: mongoose.Schema.Types.ObjectId,
       ref: "Song"
    }],
    isPublic: {
        type: Boolean,
        default: false
    },
    followers:{
        type:Number,
        default: 0
    },
    collaborators: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]
},{timestamps:true})

const Playlist = mongoose.model("Playlist", playlistsSchema)
module.exports = Playlist