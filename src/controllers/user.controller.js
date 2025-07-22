
import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import Document from "../models/document.model.js";
import Invitation from "../models/invitation.model.js";
import mongoose from "mongoose";


const registerUser = asyncHandler(async (req, res) =>{
    
    // get user details fromfrontend
    const {username, email, role, provider, avatar_url=" "} = req.user
    
    // validation - not empty
    if(
        [email, role, provider].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }

    // check if user already exists: username, email
    const existedUser = await User.findOne({email: email.toLowerCase()})
    if(existedUser){
        res.status(200).json(
        new ApiResponse(200, existedUser, "User with email already exist")
        )
    }

    // // check for images, check for avatar
    // // const avatarLocalPath = req.files?.avatar[0]?.path;
    // let avatarLocalPath;
    // if(req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0){
    //     avatarLocalPath = req.files.avatar[0].path;
    // }

    // // upload them to cloudinary, avatar
    // const avatar = await uploadOnCloudinary(avatarLocalPath)

    // create user object - create entry in DB
    const user = await User.create({
        provider,
        avatar: avatar_url || " ",
        email,
        role,
        username: username || "unknown",
    })
    // remove password and refresh token field from the response
    const createdUser = await User.findById(user._id).select("-password")


    // check for user creation
    if(!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }
    // return response 
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registerd Successfully")
    )


})

const getUsers = asyncHandler(async (req, res) => {
    const { email, documentId, userId } = req.query;

    if (!email || email.trim() === "") {
        throw new ApiError(400, "email is required");
    }

    if (!documentId || !userId) {
        throw new ApiError(400, "documentId and userId are required");
    }

    // Fetch the document to get owner
    const document = await Document.findById(documentId).lean();
    if (!document) {
        throw new ApiError(404, "Document not found");
    }

    // Get list of already invited users (pending/accepted)
    const invitedUsers = await Invitation.find({
        document: documentId,
        status: { $in: ["pending", "accepted"] },
    }).distinct("to");

    // Search users matching email and exclude:
    // - document owner
    // - users already invited
    // - the current user (if needed)
    const users = await User.find(
        {
        email: { $regex: email, $options: "i" },
        _id: {
            $nin: [
            document.owner,
            ...invitedUsers,
            userId // optionally exclude self if not already owner
            ],
        },
        },
        "name email _id"
    )
        .limit(10)
        .lean();

    return res.status(200).json(
        new ApiResponse(200, users, "Users fetched successfully")
    );
    });


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

    const user  = await User.findOne({email: req.user.email})
    if(!user){
        throw new ApiError(400, "User not found");
    }
    user.avatar = avatar.url
    await user.save()

    return res.status(200)
    .json(
        new ApiResponse(200, user, "Avatar updated successfully")
    )
})

export {
    registerUser,
    updateAccountDetails,
    updateUserAvatar,
    getUsers
}