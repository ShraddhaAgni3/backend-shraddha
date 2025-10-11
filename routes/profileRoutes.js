import express from "express";
import { updateProfile } from "../controller/profileController.js";

const router = express.Router();

//router.post("/api/createProfile",createProfile);
router.put("/api/editProfile",updateProfile);

export default router;