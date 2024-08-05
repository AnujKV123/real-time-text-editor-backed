
import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"

const userSchema = new Schema({
    username:{
        type: String,
        require: true,
        unique: true,
        lowcase: true,
        trim: true,
        index: true
    },
    email:{
        type: String,
        require: true,
        unique: true,
        lowcase: true,
        trim: true
    },
    fullname:{
        type: String,
        require: true,
        trim: true,
        index: true
    },
    avatar:{
        type: String, // cloudinary url
        require: true,
    },
    subscription_plan:{
        type: String, 
        require: true,
    },
    // watchHistory: [
    //     {
    //         type: Schema.Types.ObjectId,
    //         ref: "Video"
    //     }
    // ],
    password: {
        type: String,
        require: [true, 'Password is required']
    },
    refreshToken: {
        type: String,

    }
}, {timestamps: true})


userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorreact = async function(password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)