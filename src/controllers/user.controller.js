
import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose";



const generateAccessTokenAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}
        
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) =>{
    
    // get user details fromfrontend
    const {username, email, fullname, password, subscription_plan} = req.body
    console.log("email", email)
    
    // validation - not empty
    if(
        [username, email, fullname, password, subscription_plan].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }

    // check if user already exists: username, email
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if(existedUser){
        throw new ApiError(409, "User with email or username already exist")
    }

    // check for images, check for avatar
    // const avatarLocalPath = req.files?.avatar[0]?.path;
    let avatarLocalPath;
    if(req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0){
        avatarLocalPath = req.files.avatar[0].path;
    }

    // if(!avatarLocalPath){
    //     throw new ApiError(400, "avatar file is required")
    // }

    // upload them to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    // if(!avatar){
    //     throw new ApiError(400, "avatar file is required")
    // }

    // create user object - create entry in DB
    const user = await User.create({
        fullname,
        avatar: avatar?.url || "",
        email,
        password,
        subscription_plan,
        username: username
    })
    // remove password and refresh token field from the response
    const createdUser = await User.findById(user._id).select("-password -refreshToken")


    // check for user creation
    if(!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }
    // return response 
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registerd Successfully")
    )


})

const loginUser = asyncHandler(async (req, res) =>{
    // get data -> req.body
    const {email, username, password} = req.body

    // username or email
    if(!(username || email)){
        throw new ApiError(400, "username or email is required")
    }
    // find the user
    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "User does not exist")
    }
    // password check
    const isPasswordValid = await user.isPasswordCorreact(password)
    if(!isPasswordValid){
        throw new ApiError(401, "Invalid user credentials")
    }
    // access and refresh token
    const {accessToken, refreshToken} = await generateAccessTokenAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    // send cookie
    const options = {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
    }
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "user loogedIn successfully"
        )
    )

})

const logoutUser = asyncHandler(async (req, res) =>{
    // console.log("req:::", req)
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully!"))
})

const refreshAccessToken = asyncHandler( async(req, res)=>{

    try {
        const incommingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
        if(!incommingRefreshToken){
            throw new ApiError(401, "unauthorized request")
        }
    
        const decodedToken = jwt.verify(
            incommingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401, "Invalid refresh token")
        }
        
        if(incommingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "refresh token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessTokenAndRefreshToken(user._id)
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken:newRefreshToken},
                "Access token refreshed"
    
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler( async(req, res) =>{
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorreact = await user.isPasswordCorreact(oldPassword)

    if(!isPasswordCorreact){
        throw new ApiError(400, "invalid old password")
    }
    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "password changed successfully"))

})

const updateAccountDetails = asyncHandler(async(req, res) =>{
    const {fullname, email}=  req.body
    if(!(fullname || email)){
        throw new ApiError(400, "all fields are required")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req, res)=>{
    console.log("avatarLocalPath::", req.file)
    const avatarLocalPath = req.file?.path
    console.log("avatarLocalPath::", avatarLocalPath)

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if(!avatar.url){
        throw new ApiError(400, "Error while uploading on avatar");
    } 

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            },
        },
        {new: true}
    ).select("-password")

    return res.status(200)
    .json(
        new ApiResponse(200, user, "Avatar updated successfully")
    )
})



const getDocuments = asyncHandler(async(req, res) =>{
    const {fullname, email}=  req.body
    if(!(fullname || email)){
        throw new ApiError(400, "all fields are required")
    }
    const userDocuments = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "documents",
                localField: "email",
                foreignField: "user_email",
                as: "userDocuments"
            }
        },
        {
            $unwind: {
                path: "$userDocuments"
            }
        },
        {
            $project: {
                _id: 0,
                "userDocuments._id": 1,
                "userDocuments.document_name": 1
            }
        },
        {
            $replaceRoot:
              /**
               * replacementDocument: A document or string.
               */
              {
                newRoot: "$userDocuments"
              }
        }
      ])

    return res
    .status(200)
    .json(new ApiResponse(200, userDocuments, "user documents fetched successfully"))
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    updateAccountDetails,
    updateUserAvatar,
    getDocuments,
}