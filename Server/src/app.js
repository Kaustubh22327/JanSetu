import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

const app = express();



app.use(cors({
  origin: process.env.CORS || "http://localhost:5173", 
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static("public"));
app.use(cookieParser());

// Serve uploads directory for media files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

import userRouter from "./routes/userRoute.js"
import adminRouter from "./routes/adminRoute.js"
import feedRouter from "./routes/feedRoute.js"

app.use("/api/v1/users", userRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/feed", feedRouter);

export default app;