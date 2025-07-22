import mongoose, {Schema} from "mongoose";

const inviteSchema = new Schema({
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    document: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
        required: true,
    },

    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending',
    },
    
}, {timestamps: true})

const Invitation = mongoose.model("Invitation", inviteSchema)
export default Invitation