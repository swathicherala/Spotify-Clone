const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true,'Name is required'],
        trim: true
    },
    email:{
        type:String,
        required:[true,'Email is required'],
        trim: true
    },
    password:{
        type:String,
        required:[true,'Password is required'],
        minLength: [6, 'Password must at least 6 characters']
    },
    profilePicture:{
        type:String,
        default:"https://media.istockphoto.com/id/1437816897/photo/business-woman-manager-or-human-resources-portrait-for-career-success-company-we-are-hiring.jpg?s=612x612&w=0&k=20&c=tyLvtzutRh22j9GqSGI33Z4HpIwv9vL_MZw_xOE19NQ="
    },
    isAdmin:{
        type:Boolean,
        default:false
    },
    likedSongs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Song"
    }],
    likedAlbums: [{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Album"
    }],
    followedArtists: [{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Artist"
    }],
    followedPlayedLists: [{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Playlist"
    }]
},{timestamps:true})

//Method to compare password with the hashed password
userSchema.methods.matchPassword = async function(enteredPassword){
    return await bcrypt.compare(enteredPassword, this.password)
}

//Hash password before saving
userSchema.pre('save', async function(){
    //Only hash the password if it's modified
    if(!this.isModified("password")){
        return
    }
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
})

const User = mongoose.model("User", userSchema)
module.exports = User