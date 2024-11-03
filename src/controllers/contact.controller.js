import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import Contact from "../models/contact.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const createContact = asyncHandler(async (req, res) => {    
    const {_id, name, email, message} = req.body;
    if(!_id || !name || !email || !message){        
        throw new ApiError(400, "_id, name, email, and message is required")
    }    
    const contact = await Contact.create({_id, name, email, message})
    return res
    .status(200)
    .json(
        new ApiResponse(200, "Contact created successfully")
    )
})

export {createContact}