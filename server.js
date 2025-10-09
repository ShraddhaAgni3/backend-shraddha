import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js"
import { testConnection } from "./config/db.js";


const app = express();
dotenv.config();

testConnection();

app.use(cors());
app.use(express.json());

app.use("/",authRoutes);


const port = process.env.PORT;

app.listen(port,()=>console.log(`localhost:${port}`));