import dotenv from "dotenv";
if(process.env.NODE_ENV !== "production"){
  dotenv.config(); 
}
console.log(process.env.MONGO_URL);

import express from "express";
import mongoose from "mongoose";
import { createServer } from "node:http";
import { Server } from "socket.io";
import cors from "cors";
import { connectToSocket } from "./controller/socketManager.js";
import userRoutes from "./routes/user.routes.js"

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", (process.env.PORT || 8000));
app.use(cors());
app.use(express.json({limit:"40kb"}));
app.use(express.urlencoded({limit : "40kb", extended: true}));

app.use('/api/v1/users', userRoutes);

const Start = async () => {
    app.set("mongo_user")
    const connectionDB = await mongoose.connect(process.env.MONGO_URL);
    console.log(`mongo connected DB host ${connectionDB.connection.host}`)
  server.listen(app.get("port"), () => {
    console.log("listen on port 8000");
  });
};
Start();
