import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import Document from "../models/document.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import Invitation from "../models/invitation.model.js";

const createDocument = asyncHandler(async (req, res) => {
  const { name, type, content = "", owner, collaborators = [] } = req.body;
  if (!name || !type) {
    throw new ApiError(400, "name and type is required");
  }

  if (!["text", "code", "canvas"].includes(type)) {
    throw new ApiError(400, "Invalid type");
  }

  const ownner = await User.findOne({ email: owner });
  if (!ownner) {
    throw new ApiError(400, "Owner does not exist");
  }

  const document = await Document.create({
    name,
    type,
    content,
    owner: ownner._id,
    collaborators,
  });
  const response = {
    _id: document._id,
    name: document.name,
    type: document.type,
  };
  return res
    .status(201)
    .json(new ApiResponse(201, response, "Document created successfully"));
});

const deleteDocument = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id) {
    throw new ApiError(400, "Document ID is required");
  }

  // Delete the document
  const document = await Document.findByIdAndDelete(id);

  if (!document) {
    throw new ApiError(404, "Document not found");
  }

  // Delete associated invitations
  const result = await Invitation.deleteMany({ document: id });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        deletedDocumentId: id,
        deletedInvitationsCount: result.deletedCount,
      },
      "Document and associated invitations deleted successfully"
    )
  );
});


const updateDocument = asyncHandler(async (req, res) => {
  const { content, documentId, chat } = req.body;

  if (!content || !documentId) {
    throw new ApiError(400, "content and sessionId is required");
  }

  const document = await Document.findById(documentId);

  if (!document) {
    throw new ApiError(404, "Document not found");
  }

  if (chat) {
    document.chat = chat;
  }
  document.content = content;

  await document.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Document updated successfully"));
});

const getDocuments = asyncHandler(async (req, res) => {
  const { email } = req.user;
  const { page, limit, search } = req.query;

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const userId = user._id;
  const currentPage = Math.max(1, parseInt(page));
  const itemsPerPage = Math.min(100, parseInt(limit));
  const skip = (currentPage - 1) * itemsPerPage;

  const filter = {
    name: { $regex: search, $options: "i" },
    withTeam: false,
    $or: [{ owner: userId }, { "collaborators.user": userId }],
  };

  const aggregation = [
    { $match: filter },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerInfo",
      },
    },
    { $unwind: "$ownerInfo" },
    {
      $project: {
        _id: 1,
        name: 1,
        type: 1,
        updatedAt: 1,
        owner: "$ownerInfo.username", // 👈 include username instead of full user object
        ownerId: "$ownerInfo._id",
      },
    },
    { $sort: { updatedAt: -1 } },
    { $skip: skip },
    { $limit: itemsPerPage },
  ];

  const countAggregation = [{ $match: filter }, { $count: "total" }];

  // Query and count in parallel
  const [documents, countResult] = await Promise.all([
    Document.aggregate(aggregation),
    Document.aggregate(countAggregation),
  ]);

  const total = countResult[0]?.total || 0;
  const totalPages = Math.ceil(total / itemsPerPage);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        total,
        page: currentPage,
        limit: itemsPerPage,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
        data: documents,
      },
      "Documents fetched successfully"
    )
  );
});

const getDocumentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const document = await Document.findById(id);
  if (!document) {
    throw new ApiError(404, "Document not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, document, "Document fetched successfully"));
});

const verifyUser = asyncHandler(async (req, res) => {
  const { userId, documentId } = req.body;
  if (!userId || !documentId) {
    throw new ApiError(400, "userId and documentId is required");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const document = await Document.findById(documentId);
  if (!document) {
    throw new ApiError(404, "Document not found");
  }
  if (
    document.owner.toString() !== user._id.toString() &&
    !document.collaborators.some(
      (c) => c.user.toString() === user._id.toString()
    )
  ) {
    throw new ApiError(403, "You do not have permission to access this document");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {content: document.content, chat: document.chat}, "user verified successfully"));
});

export {
  createDocument,
  deleteDocument,
  updateDocument,
  getDocuments,
  getDocumentById,
  verifyUser,
};
