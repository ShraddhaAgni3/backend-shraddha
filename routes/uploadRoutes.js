import express from "express";
import upload from "../middleware/upload.js";
import { saveProfileImage, uploadImage } from "../controller/uploadController.js";
const router = express.Router();

router.post("/upload", upload.single("image"), uploadImage);

//router.post("/upload/profile", upload.single("image"),uploadProfile);

router.post("/saveProfileImage", saveProfileImage);
export default router;
