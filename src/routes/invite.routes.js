import { Router } from "express";
import { verifyToken } from "../middlewares/AuthMiddleware.js";
import { createInvitation, getInvitations, handleInvite } from "../controllers/invitation.controller.js";

const router = Router();

router.route("/send-invite").post(verifyToken, createInvitation)
router.route("/get-invitations").post(verifyToken, getInvitations)
router.route("/get-invitations").post(verifyToken, getInvitations)
router.route("/handle-invite").post(verifyToken, handleInvite)

export default router