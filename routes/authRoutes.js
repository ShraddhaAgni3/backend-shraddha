import express from "express";
import { loginUser } from "../controller/authController.js";

const router = express.Router();

router.post("/api/login",loginUser);

export default router;