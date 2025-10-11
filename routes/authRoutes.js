import express from "express";
import { loginUser,registerUser } from "../controller/authController.js";

const router = express.Router();

router.post("/api/register",registerUser);
router.post("/api/login",loginUser);

export default router;