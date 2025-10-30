import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js"
import { testConnection } from "./config/db.js";
import cookieParser from "cookie-parser";
import profileRoutes from "./routes/profileRoutes.js";
import adminRoutes from "./routes/adminRoutes.js"
import searchRoutes from "./routes/searchRoutes.js";
const app = express();
dotenv.config();

testConnection();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/",authRoutes);
app.use("/",profileRoutes);
app.use("/",adminRoutes)

app.use("/",searchRoutes); // Added search routes

const port = process.env.PORT;

app.listen(port,()=>console.log(`localhost:${port}`));