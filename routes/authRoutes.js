import express from "express";
import { forgotPassword, loginUser,registerUser,resetPassword } from "../controller/authController.js";
import { validateRefreshToken } from "../middleware/verfiytoken.js";


const router = express.Router();

// Auth Routes
router.post("/api/register",registerUser);
router.post("/api/login",loginUser);
router.post("/api/forgotpassword",forgotPassword);
router.post("/api/reset-password/:token",resetPassword);
router.get("/api/refreshtoken",validateRefreshToken);
export default router;