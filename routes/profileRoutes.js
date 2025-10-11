import express from "express";
import { updateProfile } from "../controller/profileController.js";
import { validateAccessToken } from "../middleware/verfiytoken.js";

const router = express.Router();

//router.post("/api/createProfile",createProfile);
router.put("/api/editProfile",validateAccessToken,updateProfile);

export default router;