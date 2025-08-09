import mongoose, {Schema} from "mongoose";

const documentSchema = new Schema({
  // _id: String,
  name: {
    type: String,
    require: true,
    trim: true,
  },

  type: {
    type: String,
    enum: ['text', 'code', 'canvas'],
    required: true,
  },

  chat: {
    type: Array,
    default: [],
  },

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  activeSession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CollabSession',
  },

  withTeam: {
    type:Boolean,
    default: false,
  },

  lastSession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CollabSession',
  },

  collaborators: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    invitedAt: { type: Date, default: Date.now },
    acceptedAt: { type: Date },
  }],

  content: {
    type: String,
    default: '',
  },

}, {timestamps: true})

const Document = mongoose.model("Document", documentSchema)
export default Document
