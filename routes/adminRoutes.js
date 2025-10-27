// routes/adminRoutes.js
import express from "express";
import { adminLogin, approveUser, deactivateUser, getAllUsers, onHoldUser } from "../controller/adminController.js";
import { verifyAdminToken } from "../middleware/verifyAdminToken.js";
import { validateAccessToken } from "../middleware/verfiytoken.js";

const router = express.Router();

// Admin Routes
router.post("/api/admin/login", adminLogin);
router.post("/api/admin/approveUser", verifyAdminToken, approveUser);
router.post("/api/admin/on-hold", verifyAdminToken, onHoldUser);
router.post("/api/admin/deactivate", verifyAdminToken, deactivateUser);
router.get("/api/admin/users", validateAccessToken, getAllUsers);

export default router;
