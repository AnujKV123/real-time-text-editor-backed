
import { Router } from "express";
import { updateDocumentName, CreateDocument, isVerifiedUser } from "../controllers/document.contraoller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router()


router.route("/update-document-name").post(verifyJWT, updateDocumentName)
router.route("/create-document").post(verifyJWT, CreateDocument)
router.route("/verify-user").post(verifyJWT, isVerifiedUser)


export default router;