import express from "express";
import { getProfile,updateProfile } from "../controller/profileController.js";
import { validateAccessToken } from "../middleware/verfiytoken.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Profile Routes
//router.post("/api/createProfile",createProfile);
router.put("/api/editProfile",validateAccessToken,upload.single("photo"),updateProfile);
router.get("/api/me",validateAccessToken,getProfile);


// Profile update with image upload
// router.put("/update", validateAccessToken, upload.single("photo"), updateProfile);

// // Get profile
// router.get("/me", validateAccessToken, getProfile);

export default router;




// import upload from "../middlewares/upload.js";
// import { validateAccessToken } from "../middlewares/auth.js";



// Profile update with image upload
router.put("/update", validateAccessToken, upload.single("photo"), updateProfile);

// Get profile
router.get("/me", validateAccessToken, getProfile);


