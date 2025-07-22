
import { Router } from "express";
import { 
    registerUser, 
    updateAccountDetails, 
    updateUserAvatar,  
    getUsers
} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyToken } from "../middlewares/AuthMiddleware.js";

const router = Router()

router.route("/register").post(verifyToken, registerUser)
router.route("/update-account").patch(verifyToken, updateAccountDetails)
router.route("/update-avatar").patch(verifyToken, upload.single("avatar"), updateUserAvatar)
router.route("/get-users").get(verifyToken, getUsers)

export default router