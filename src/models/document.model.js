import {Schema, model} from "mongoose";

const documentSchema = new Schema({
  _id: String,
  data: Object,
  document_name: String,
  user_email: String,
  shared_with: [{
    email: String,
    full_name: String
  }],
}, {timestamps: true})

const Document = model("Document", documentSchema)
export default Document
