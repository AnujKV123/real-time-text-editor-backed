import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", 
    required: true,
  },
  type: {
    type: String,
    enum: [
      "COLLAB_REQUEST",       
      "COLLAB_ACCEPTED",       
      "COLLAB_REMOVED",        
      "DOC_EDITED",           
      "SESSION_STARTED",       
      "SESSION_ENDED",         
    ],
    required: true,
  },
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Document",
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Who triggered the notification
  },
  message: {
    type: String, // Optional custom message
  },
  isRead: {
    type: Boolean,
    default: false,
  },
}, {timestamps: true});

export const Notification = mongoose.model("Notification", notificationSchema);