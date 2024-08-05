import express from 'express';
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'], 
}))

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static("public"))
app.use(cookieParser())
// app.use(bodyParser.json({limit: '50mb'}));
// app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
// app.use(express.json());

// router import
import userRouter from "./routes/user.routes.js"

import documentRouter from "./routes/document.routes.js"

// routes declaration
app.use("/api/v1/users", userRouter)

app.use("/api/v1/documents", documentRouter)

export {app}