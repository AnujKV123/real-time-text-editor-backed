
import { Router } from "express";
import { 
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    updateAccountDetails, 
    updateUserAvatar,  
    getDocuments, 
} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
        upload.fields([
            {
                name: "avatar",
                maxCount: 1
            },
            // {
            //     name: "coverimage",
            //     maxCount: 1
            // }
        ]),
        registerUser
    )

router.route("/login").post(loginUser)

// secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(changeCurrentPassword) 
router.route("/update-account").patch(verifyJWT, updateAccountDetails)
router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/get-user-documents").post(verifyJWT, getDocuments)

export default router