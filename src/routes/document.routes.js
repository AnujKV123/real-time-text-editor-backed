import { Router } from "express";
import {
  createDocument,
  deleteDocument,
  updateDocument,
  getDocuments,
  getDocumentById,
  verifyUser,
} from "../controllers/document.controller.js";
import { verifyToken } from "../middlewares/AuthMiddleware.js";

const router = Router();

router.route("/create-document").post(verifyToken, createDocument);
router.route("/delete-document").post(verifyToken, deleteDocument);
router.route("/update-document").patch(verifyToken, updateDocument);
router.route("/get-documents").post(verifyToken, getDocuments);
router.route("/get-document-by-id").post(verifyToken, getDocumentById);
router.route("/verify-user").post(verifyToken, verifyUser);

export default router;
