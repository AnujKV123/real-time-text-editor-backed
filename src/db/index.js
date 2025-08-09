import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import { User } from "../models/user.model.js";


// note :- database always in another continent
const connectDB = async ()=> {
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}${DB_NAME}`)
        console.log(`\n MongoDB connected !! DB Host: ${connectionInstance.connection.host}`)

        // Note : uncomment this if you want to sync indexes
        await User.syncIndexes();
        console.log("Indexes synced for User collection");

    }catch(error){
        console.log("MONGODB connection error ", error);
        process.exit(1)
    }
}

export default connectDB;