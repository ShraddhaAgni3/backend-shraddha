import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";
import { io,onlineUsers,sendNotification } from "../server.js"; 
import { pool } from "../config/db.js";
import { searchUsers } from "../config/db.js";
import cloudinary from "../config/cloudinaryConfig.js";
import { createNotification } from "./notificationController.js";
import {  getRecentChats as dbGetRecentChats } from "../config/db.js";
dotenv.config();

// ✅ Initialize Supabase

// ---------------- Health Check ----------------
export const healthCheck = (req, res) => {
  return res.json({ status: "Server running ✅" });
};
  export const uploadFile = async (req, res) => {
  try {
    // ✅ Multer will give us req.file (buffer included)
    if (!req.file) {
      return res.status(400).json({ error: "No file received" });
    }

    const contentType = req.file.mimetype;

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "chat_uploads",
        resource_type: "auto",
        public_id: uuidv4(),
      },
      (error, uploadResult) => {
        if (error) {
          console.error("Cloudinary error:", error);
          return res.status(500).json({ error: "Upload failed" });
        }

        // ✅ Return Cloudinary URL to frontend
        return res.json({
          message: "File uploaded successfully ✅",
          url: uploadResult.secure_url,
        });
      }
    );

    // ✅ Send buffer to Cloudinary
    stream.end(req.file.buffer);

  } catch (err) {
    console.error("Upload Error:", err);
    return res.status(500).json({ error: "Upload failed" });
  }
};

// ---------------- Get All Users ----------------
export const getAllUsers = async (req, res) => {
  try {
    const searchTerm = req.query.search || "";

    if (!searchTerm.trim()) {
      return res.status(200).json([]);
    }

    const users = await searchUsers(searchTerm);

    return res.status(200).json(users);

  } catch (err) {
    console.error("❌ Error searching users:", err);
    res.status(500).json({ error: "Server error while searching users" });
  }
};


export const getMessagesForUser = async (req, res) => {
  try {
    const { userId } = req.params; // chat partner ID
    const { myUserId } = req.query; // logged-in user ID

    // ✅ 1️⃣ Validation
    if (!userId || !myUserId) {
      return res.status(400).json({ error: "Missing userId or myUserId" });
    }

    // ✅ 2️⃣ Fetch all messages between two users (sorted oldest → newest)
    const { rows } = await pool.query(
      `SELECT * FROM messages
       WHERE (sender_id = $1 AND receiver_id = $2)
          OR (sender_id = $2 AND receiver_id = $1)
       ORDER BY created_at ASC`,
      [myUserId, userId]
    );

    // ✅ 3️⃣ Mark all unread messages as read (for logged-in user)
    await pool.query(
      `UPDATE messages
       SET is_read = TRUE
       WHERE receiver_id = $1 
         AND sender_id = $2 
         AND is_read = FALSE`,
      [myUserId, userId]
    );

    // ✅ 4️⃣ Return messages (frontend can now display updated messages)
    return res.status(200).json(rows);

  } catch (error) {
    console.error("Error fetching messages:", error.message);
    return res.status(500).json({ error: "Failed to fetch messages" });
  }
}; 
    // 🟢 Send a new message + create notification
export const getAllMessages = async (req, res) => {
  try {
    const { sender_id, receiver_id, content, attachment_url } = req.body;

    // ✅ 1️⃣ Validation
    if (!sender_id || !receiver_id || (!content && !attachment_url)) {
      return res.status(400).json({
        error:
          "sender_id, receiver_id and at least one of content or attachment_url are required",
      });
    }

    // ✅ 2️⃣ Insert new message (is_read default = false)
    const { rows } = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, content, attachment_url, is_read)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [sender_id, receiver_id, content, attachment_url, false]
    );

    const savedMessage = rows[0];

    // ✅ 3️⃣ Emit new message to all connected sockets (real-time chat)
    io.emit("new_message", savedMessage);

    // ✅ 4️⃣ If receiver is online, send real-time message notification
    const receiverSocketId = onlineUsers.get(receiver_id);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("message_notification", {
        from: sender_id,
        message: content || "📎 Attachment",
        timestamp: savedMessage.created_at,
      });
    }

    // ✅ 5️⃣ Insert persistent notification in DB (for bell icon)
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
       VALUES ($1, $2, $3, $4, FALSE, NOW())`,
      [
        receiver_id,
        "New Message 💬",
        `User ${sender_id} sent you a new message.`,
        "Message", // type of notification
      ]
    );

    // ✅ 6️⃣ Return saved message
    return res.status(201).json(savedMessage);

  } catch (error) {
    console.error("Error saving message:", error.message);
    return res.status(500).json({ error: "Failed to save message" });
  }
};
 
// ---------------- Add Reaction ----------------
export const addReaction = async (req, res) => {
  const { message_id, user_id, emoji } = req.body;

  if (!message_id || !user_id || !emoji) {
    return res.status(400).json({
      error: "message_id, user_id, and emoji are required",
    });
  }

  try {
    // 1️⃣ Save or update the reaction
    const { rows } = await pool.query(
      `INSERT INTO reactions (message_id, user_id, emoji)
       VALUES ($1, $2, $3)
       ON CONFLICT (message_id, user_id)
       DO UPDATE SET emoji = EXCLUDED.emoji
       RETURNING *`,
      [message_id, user_id, emoji]
    );

    const reaction = rows[0];

    // 2️⃣ Get sender and receiver info from message
    const msgQuery = await pool.query(
      `SELECT sender_id, receiver_id FROM messages WHERE id = $1`,
      [message_id]
    );

    if (msgQuery.rows.length === 0)
      return res.status(404).json({ error: "Message not found" });

    const message = msgQuery.rows[0];
    const receiverId =
      message.sender_id === user_id ? message.receiver_id : message.sender_id;

    // 3️⃣ Create notification (DB + bell icon)
    await createNotification(
      receiverId,
      "New Reaction 💬",
      `User ${user_id} reacted with "${emoji}" on your message.`,
      "reaction"
    );

    // 4️⃣ Send real-time notification if receiver online
    const socketId = onlineUsers.get(receiverId);
    if (socketId) {
      io.to(socketId).emit("new_notification", {
        title: "New Reaction 💬",
        message: `User ${user_id} reacted with "${emoji}" on your message.`,
        reaction,
      });

      // optional: also send reaction update
      io.to(socketId).emit("new_reaction", reaction);
    }

    console.log(`💬 Reaction added by user ${user_id}: ${emoji}`);
    return res.json({ success: true, reaction });
  } catch (error) {
    console.error("❌ Error saving reaction:", error.message);
    return res.status(500).json({ error: "Failed to save reaction" });
  }
};

// ---------------- Get All Reactions ----------------
export const getAllReactions = async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM reactions ORDER BY timestamp DESC"
    );
    return res.json(rows);
  } catch (error) {
    console.error("❌ Error fetching reactions:", error.message);
    return res.status(500).json({ error: "Failed to fetch reactions" });
  }
};


// ---------------- Get Recent Chats ----------------
export const getRecentChats = async (req, res) => {
  try {
    const { myUserId } = req.params;

    if (!myUserId) {
      return res.status(400).json({ error: "Missing myUserId" });
    }

    const chats = await dbGetRecentChats(myUserId);

    return res.status(200).json(chats);
  } catch (err) {
    console.error("❌ Error loading recent chats:", err);
    return res.status(500).json({ error: "Failed to load recent chats" });
  }
};

// ---------------- Delete Message ----------------
export const deleteMessage = async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.query.userId;

    if (!messageId || !userId) {
      return res.status(400).json({ error: "Missing messageId or userId" });
    }

    // Check if message exists
    const msg = await pool.query(
      "SELECT * FROM messages WHERE id = $1",
      [messageId]
    );

    if (msg.rows.length === 0) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Only sender can delete
    if (String(msg.rows[0].sender_id) !== String(userId)) {
      return res.status(403).json({ error: "Not allowed to delete this message" });
    }

    // Delete the message
    const deleted = await pool.query(
      "DELETE FROM messages WHERE id = $1 RETURNING *",
      [messageId]
    );

    // Emit real-time delete event
    io.emit("message_deleted", { id: messageId });

    return res.status(200).json({
      success: true,
      deleted: deleted.rows[0],
    });

  } catch (err) {
    console.error("Delete message error:", err);
    return res.status(500).json({ error: "Failed to delete message" });
  }
};






















