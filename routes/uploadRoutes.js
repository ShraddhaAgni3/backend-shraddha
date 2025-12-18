import express from "express";
import upload from "../middleware/upload.js";
import { removeProfilePicture, saveProfileImage, uploadImage } from "../controller/uploadController.js";
import { validateAccessToken } from "../middleware/verfiytoken.js";

const router = express.Router();

router.use(validateAccessToken);
router.post("/upload", upload.single("image"), uploadImage); // Upload Image
router.post("/saveProfileImage", saveProfileImage); // Save Profile Image
router.post("/remove/profile-picture", removeProfilePicture); // Remove Profile Picture

export default router;
