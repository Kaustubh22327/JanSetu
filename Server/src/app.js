import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";

const app = express();



app.use(cors({
  origin: process.env.CORS || "http://localhost:5173", 
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static("public"));
app.use(cookieParser());

import userRouter from "./routes/userRoute.js"
import adminRouter from "./routes/adminRoute.js"

app.use("/api/v1/users", userRouter);
app.use("/api/v1/admin", adminRouter);

export default app;