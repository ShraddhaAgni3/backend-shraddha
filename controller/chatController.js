import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";
import { io,onlineUsers } from "../server.js"; 
import { pool } from "../config/db.js";
import { searchUsers } from "../config/db.js";

dotenv.config();

// ✅ Initialize Supabase

// ---------------- Health Check ----------------
export const healthCheck = (req, res) => {
  return res.json({ status: "Server running ✅" });
};

// ---------------- Upload File ----------------
export const uploadFile = async (req, res) => {
  try {
    const chunks = [];

    // Collect raw binary data
    req.on("data", (chunk) => chunks.push(chunk));

    req.on("end", async () => {
      const buffer = Buffer.concat(chunks);

      const contentType = req.headers["content-type"] || "application/octet-stream";
      const extension = contentType.split("/")[1] || "bin";
      const filename = `${uuidv4()}.${extension}`;

      // ✅ Insert file into PostgreSQL as BYTEA
      const result = await pool.query(
        `INSERT INTO uploads (filename, mime_type, data)
         VALUES ($1, $2, $3)
         RETURNING id, filename, mime_type, created_at`,
        [filename, contentType, buffer]
      );

      return res.json({
        message: "File uploaded successfully ✅",
        file: result.rows[0]
      });
    });

  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ error: "File upload failed" });
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
    const { userId } = req.params; // URL param (receiver)
    //const myUserId = 6; // logged in user (sender)
    //const myUserId = req.query.myUserId; // logged in user (sender) from query param
    const { myUserId } = req.query;
    if (!userId || !myUserId) {
      return res.status(400).json({ error: "Missing userId or myUserId" });
    }

    const { rows } = await pool.query(
      `SELECT * FROM messages 
       WHERE (sender_id = $1 AND receiver_id = $2)
          OR (sender_id = $2 AND receiver_id = $1)
       ORDER BY created_at ASC`,
      [myUserId, userId]
    );

    return res.json(rows);
  } catch (error) {
    console.error("Error fetching messages:", error.message);
    return res.status(500).json({ error: "Failed to fetch messages" });
  }
};

// ---------------- Get All Messages ----------------
export const getAllMessages = async (req, res) => {
  try {
    const { sender_id, receiver_id, content, attachment_url } = req.body;

    if (!sender_id || !receiver_id || (!content && !attachment_url)) {
      return res.status(400).json({
        error: "sender_id, receiver_id and at least one of content or attachment_url are required"
      });
    }

    const { rows } = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, content, attachment_url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [sender_id, receiver_id, content, attachment_url]
    );

    const savedMessage = rows[0];

    // ✅ Send message to all connected clients
    io.emit("new_message", savedMessage);

    return res.json(savedMessage);
  } catch (error) {
    console.error("Error saving message:", error.message);
    return res.status(500).json({ error: "Failed to save message" });
  }
};



// ---------------- Add Reaction ----------------
export const addReaction = async (req, res) => {
  const { message_id, user_id, emoji } = req.body;
  if (!message_id || !user_id || !emoji)
    return res.status(400).json({ error: "message_id, user_id, emoji required" });

  try {
    const { rows } = await pool.query(
      `INSERT INTO reactions (message_id, user_id, emoji)
       VALUES ($1, $2, $3)
       ON CONFLICT (message_id, user_id)
       DO UPDATE SET emoji = EXCLUDED.emoji
       RETURNING *`,
      [message_id, user_id, emoji]
    );

    const reaction = rows[0];
    io.emit("new_reaction", reaction);
    return res.json(reaction);
  } catch (error) {
    console.error("Error saving reaction:", error.message);
    return res.status(500).json({ error: "Failed to save reaction" });
  }
};

// ---------------- Get All Reactions ----------------
export const getAllReactions = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM reactions ORDER BY timestamp DESC");
    return res.json(rows);
  } catch (error) {
    console.error("Error fetching reactions:", error.message);
    return res.status(500).json({ error: "Failed to fetch reactions" });
  }
};

