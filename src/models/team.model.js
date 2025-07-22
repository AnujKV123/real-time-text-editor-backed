import mongoose, {Schema} from "mongoose";

const teamSchena = new Schema({
    _id: String,
    name: {
        type: String,
        require: true,
        trim: true,
    },
    members: [{
        email: String,
        status: String
    }],
    documents: [{
        document_id: String,
        document_name: String
    }],
    owner: {
        type: String,
        require: true,
        trim: true
    }

}, {timestamps: true})

export const Team = mongoose.model("Team", teamSchena)