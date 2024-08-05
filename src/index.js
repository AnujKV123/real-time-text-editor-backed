// const mongoose = require("mongoose")
// const Document = require("./Document")

// mongoose.connect("mongodb://127.0.0.1:27017/real_time_editor_db").catch((err)=>{
//   console.log(err)
//   })

  import dotenv from "dotenv"
  import connectDB from "./db/index.js";
  import { app } from "./app.js";
  import { server } from "./socket/index.js";
  
  dotenv.config({
      path: './.env'
  })
  
  connectDB()
  .then(()=>{
      server.on("error", (error)=>{
          console.log("ERROR", error)
          throw error
      })
      
      server.listen(process.env.PORT || 8000, ()=>{
          console.log(`Server is running at port: ${process.env.PORT}`)
      })
  })
  .catch((error)=>{
      console.log("MONGODB connection failed !!! ", error)
  })
  

// const io = require("socket.io")(3001, {
//   cors: {
//     origin: "http://localhost:3000",
//     methods: ["GET", "POST"],
//   },
// })

// const defaultValue = ""

// io.on("connection", socket => {
//   socket.on("get-document", async documentId => {
//     const document = await findOrCreateDocument(documentId)
//     socket.join(documentId)
//     socket.emit("load-document", document.data)

//     socket.on("send-changes", delta => {
//       socket.broadcast.to(documentId).emit("receive-changes", delta)
//     })

//     socket.on("save-document", async data => {
//       await Document.findByIdAndUpdate(documentId, { data })
//     })
//   })
// })

// async function findOrCreateDocument(id) {
//   if (id == null) return

//   const document = await Document.findById(id)
//   if (document) return document
//   return await Document.create({ _id: id, data: defaultValue })
// }
