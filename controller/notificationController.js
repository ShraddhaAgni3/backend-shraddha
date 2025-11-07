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




// ✅ Mark all unread notifications as read for a user
export const markNotificationsAsRead = async (req, res) => {
  try {
    const { userId } = req.params; // jis user ne notification dekha

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    // ✅ Update all unread notifications to read (is_read = TRUE)
    const result = await pool.query(
      `UPDATE messages
       SET is_read = TRUE
       WHERE receiver_id = $1 AND is_read = FALSE
       RETURNING *`,
      [userId]
    );

    return res.json({
      message: "All unread notifications marked as read",
      updated: result.rowCount,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error marking notifications as read:", error.message);
    return res.status(500).json({ error: "Failed to mark notifications as read" });
  }
};


// ✅ Fetch unread notifications
export const getUnreadMessageNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    const { rows } = await pool.query(
      `SELECT * FROM messages
       WHERE receiver_id = $1 AND is_read = FALSE
       ORDER BY created_at DESC`,
      [userId]
    );
      console.log("user",rows);
    return res.json(rows);
    
  } catch (error) {
    console.error("Error fetching unread notifications:", error.message);
    return res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

// ✅ Get unread count (for badge)
export const getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.params;

    const { rows } = await pool.query(
      `SELECT COUNT(*) FROM messages
       WHERE receiver_id = $1 AND is_read = FALSE`,
      [userId]
    );

    return res.json({ unread_count: parseInt(rows[0].count) });
  } catch (error) {
    console.error("Error fetching unread count:", error.message);
    return res.status(500).json({ error: "Failed to fetch unread count" });
  }
};
