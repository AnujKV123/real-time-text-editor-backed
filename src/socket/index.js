import http from "http"
import { Server } from "socket.io"
import { app } from "../app.js";
import Document from "../models/document.model.js"

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN, // replace with your frontend's domain
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type'],
      credentials: true
    }
});


const defaultValue = ""
const defaultDocName = "document";

io.on("connection", socket => {
  socket.on("get-document", async (documentId, user_email, user_fullname) => {
    const document = await findOrCreateDocument(documentId, user_email, user_fullname)
    socket.join(documentId)
    socket.emit("load-document", document)
  

    socket.on("send-changes", async delta => {
      socket.broadcast.to(documentId).emit("receive-changes", delta)

      const document = await Document.findById(documentId)
      socket.broadcast.to(documentId).emit("load-shared-with", document.shared_with)
    })

    socket.on("save-document", async (data, user_email, user_fullname) => {
      await Document.findByIdAndUpdate(documentId, { data })
      const document = await Document.findById(documentId)
      if (document){
        const alreadyExist = document.shared_with.find(user => user.email === user_email)
        if(!alreadyExist){
          await Document.updateOne(
            { _id: documentId },{ 
              $push: 
              { shared_with: {
                email: user_email, 
                full_name: user_fullname 
              } 
            } 
          })
        }
        const updated_document = await Document.findById(documentId)
        socket.broadcast.to(documentId).emit("load-shared-with", updated_document.shared_with)
        console.log("saved", "bhai ho gyi brodcast", updated_document.shared_with)
      }
    })
  })
})

async function findOrCreateDocument(id, user_email, user_fullname) {
  if (id == null) return
  const document = await Document.findById(id)
  if (document){
    const alreadyExist = document.shared_with.find(user => user.email === user_email)
    // if(!(document.user_email === user_email) && !alreadyExist){
    if(!alreadyExist){
      await Document.updateOne(
        { _id: document._id },{ 
          $push: 
            { shared_with: {
              email: user_email, 
              full_name: user_fullname 
            } 
          } 
        })
    }
    return await Document.findById(id)
  }
  return await Document.create({ _id: id, data: defaultValue, user_email: user_email, document_name: defaultDocName})
}

export {server}