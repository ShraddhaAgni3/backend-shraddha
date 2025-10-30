//import { pool } from "../db.js";
import { pool } from "../config/db.js";
// 🔹 Get all notifications for a user
export const getNotifications = async (req, res) => {
  try {
    const { user_id } = req.params;

    const result = await pool.query(
      "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC",
      [user_id]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 🔹 Mark a notification as read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      "UPDATE notifications SET is_read = TRUE WHERE id = $1",
      [id]
    );

    res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 🔹 Create a new notification (used by backend code like register/approve)
export const createNotification = async (user_id, title, message) => {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, is_read, created_at)
       VALUES ($1, $2, $3, FALSE, NOW())`,
      [user_id, title, message]
    );
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};
