
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import Document from "../models/document.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const updateDocumentName = asyncHandler(async (req, res) => {
    console.log("req::", req.body)
    const {id, documentName} = req.body;

    if(!id || !documentName){
        throw new ApiError(400, "document id and document name is required")
    }

    const document = await Document.findByIdAndUpdate(id, {document_name: documentName})

    return res
    .status(200)
    .json(
        new ApiResponse(200, document, "Document name updated successfully")
    )
})

const CreateDocument = asyncHandler(async (req, res) => {
    
    const {id, documentName, content, user_email} = req.body;

    if(!id || !documentName || !content || !user_email){
        throw new ApiError(400, "document id, document name, content, and user_email is required")
    }

    const document = await Document.create({ _id: id, data: content, user_email: user_email, document_name: documentName})

    return res
    .status(200)
    .json(
        new ApiResponse(200, document, "Document created successfully")
    )
})

const isVerifiedUser = asyncHandler(async (req, res) => {
    
    const {subscription_plan, user_email} = req.body;

    if(!subscription_plan || !user_email){
        throw new ApiError(400, "subscription plan and user email is required")
    }

    const document = await Document.aggregate([
        {
          $match:
            /**
             * query: The query in MQL.
             */
            {
              user_email: user_email
            }
        },
        {
          $group:
            /**
             * _id: The id of the group.
             * fieldN: The first field name.
             */
            {
              _id: "$user_email",
              documentCount: {
                $sum: 1
              }
            }
        },
      ]);
    console.log("document::", document, user_email)
    if(document && document[0].documentCount <10 && subscription_plan === "Free"){
        console.log("document::", document, "inner")
        return res
        .status(200)
        .json(
            new ApiResponse(200, true, "user is verified")
        )
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, false, "user is unverified")
    )
})

export{
    updateDocumentName,
    CreateDocument,
    isVerifiedUser
}