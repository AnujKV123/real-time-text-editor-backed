import mongoose, {Schema} from "mongoose";

const contactSchema = new Schema({
    _id: String,
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
    }
}, {timestamps: true})

const Contact = mongoose.model("Contact", contactSchema)
export default Contact