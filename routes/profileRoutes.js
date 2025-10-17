import express from "express";
import { getProfile,updateProfile } from "../controller/profileController.js";
import { validateAccessToken } from "../middleware/verfiytoken.js";

const router = express.Router();

//router.post("/api/createProfile",createProfile);
router.put("/api/editProfile",validateAccessToken,updateProfile);
router.get("/api/me",validateAccessToken,getProfile);
export default router;