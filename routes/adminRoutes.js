// routes/adminRoutes.js
import express from "express";
import { adminLogin, approveUser, deactivateUser, onHoldUser } from "../controller/adminController.js";
import { verifyAdminToken } from "../middleware/verifyAdminToken.js";

const router = express.Router();

// Admin Routes
router.post("/api/admin/login", adminLogin);
router.post("/api/admin/approveUser", verifyAdminToken, approveUser);
router.post("/api/admin/on-hold", verifyAdminToken, onHoldUser);
router.post("/api/admin/deactivate", verifyAdminToken, deactivateUser);

export default router;
