
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { server } from "./socket/index.js";

dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    server.on("error", (error) => {
      console.log("ERROR", error);
      throw error;
    });

    server.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at port: ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log("MONGODB connection failed !!! ", error);
  });


