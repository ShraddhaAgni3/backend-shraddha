import express from "express";
import { getNotifications, markAsRead, markNotificationsAsRead } from "../controller/notificationController.js";

const router = express.Router();

// 📩 Get all notifications for a user
router.get("/:user_id", getNotifications);

// ✅ Mark a notification as read
router.put("/read/:id", markAsRead);



// 🟢 GET → All unread message notifications
//router.get("/unread/:userId", getUnreadMessageNotifications);

// 🟢 GET → Unread count (for badge)
//router.get("/count/:userId", getUnreadCount);
router.put("/read/messages/:userId", markNotificationsAsRead);
export default router;

