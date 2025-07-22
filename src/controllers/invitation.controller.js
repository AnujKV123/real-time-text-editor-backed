import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Invitation from "../models/invitation.model.js";
import mongoose from "mongoose";
import Document from "../models/document.model.js";
import { io } from "../socket/index.js";

const statusArray = ["accepted", "rejected"];

const createInvitation = asyncHandler(async (req, res) => {
  const { toUsers, documentId, fromUserId } = req.body;

  if (
    !fromUserId ||
    !Array.isArray(toUsers) ||
    toUsers.length === 0 ||
    !documentId
  ) {
    throw new ApiError(400, "fromUserId, toUsers, and documentId are required");
  }

  // Step 1: Check for self-invitation
  if (toUsers.includes(fromUserId)) {
    throw new ApiError(400, "You cannot invite yourself");
  }

  // Step 2: Check for existing invitations in a single query
  const existingInvites = await Invitation.find({
    from: fromUserId,
    document: documentId,
    to: { $in: toUsers },
    status: { $in: ["pending", "accepted"] },
  });

  if (existingInvites.length > 0) {
    const alreadyInvitedUserIds = existingInvites.map((invite) =>
      invite.to.toString()
    );
    throw new ApiError(
      400,
      `Invitation already exists for user(s): ${alreadyInvitedUserIds.join(
        ", "
      )}`
    );
  }

  // Step 3: Send invitations
  const invitesToCreate = toUsers.map((toUserId) => ({
    from: fromUserId,
    to: toUserId,
    document: documentId,
  }));

  await Invitation.insertMany(invitesToCreate);

  toUsers.forEach((toUserId) => {
    io.to(toUserId).emit("invitation:received", {
      from: fromUserId,
      documentId,
    });
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Invitations created successfully"));
});

const handleInvite = asyncHandler(async (req, res) => {
  const { id, status } = req.body;
  if (!id || !status) {
    throw new ApiError(400, "id and status is required");
  }

  if (!statusArray.includes(status)) {
    throw new ApiError(400, "Invalid status");
  }

  const invitation = await Invitation.findById(id);
  if (!invitation) {
    throw new ApiError(400, "Invitation not found");
  }

  if (invitation.status !== "pending") {
    throw new ApiError(400, `This invitation is already ${invitation.status}`);
  }

  if (status === "accepted") {
    const collaboratorEntry = {
      user: invitation.to,
      invitedAt: invitation.createdAt,
      acceptedAt: new Date(),
    };

    await Document.findByIdAndUpdate(
      invitation.document,
      {
        $addToSet: { collaborators: collaboratorEntry },
        $set: { updatedAt: new Date() },
      },
      { new: true }
    );

    io.to(invitation.to.toString()).emit("invitation:accepted_DOC", {
      documentId: invitation.document,
      to: invitation.to,
    });
    
  }

  invitation.status = status;
  await invitation.save();

  return res
    .status(200)
    .json(new ApiResponse(200, null, `Invitation ${status} successfully`));
});

const getInvitations = asyncHandler(async (req, res) => {
  const { Id } = req.body;
  console.log("Id::", Id);
  if (!Id) {
    throw new ApiError(400, "User Id is required");
  }

  const userId = new mongoose.Types.ObjectId(Id); // ✅ Convert string to ObjectId
  const invitations = await Invitation.aggregate([
    {
      $match: {
        to: userId,
        status: "pending",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "from",
        foreignField: "_id",
        as: "fromUser",
      },
    },
    {
      $unwind: "$fromUser",
    },
    {
      $lookup: {
        from: "documents",
        localField: "document",
        foreignField: "_id",
        as: "documentDetails",
      },
    },
    {
      $unwind: "$documentDetails",
    },
    {
      $project: {
        _id: 1,
        status: 1,
        createdAt: 1,
        fromUser: {
          _id: "$fromUser._id",
          username: "$fromUser.username",
          email: "$fromUser.email",
          avatar: "$fromUser.avatar",
        },
        document: {
          _id: "$documentDetails._id",
          title: "$documentDetails.name",
          owner: "$documentDetails.owner",
          updatedAt: "$documentDetails.updatedAt",
        },
      },
    },
    {
      $sort: { createdAt: -1 },
    },
  ]);
  return res
    .status(200)
    .json(
      new ApiResponse(200, invitations, "Invitations fetched successfully")
    );
});

export { createInvitation, handleInvite, getInvitations };
