import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";
import { io } from "../server.js"; 
import { pool } from "../config/db.js";

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
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", async () => {
      const buffer = Buffer.concat(chunks);
      const filename = `${uuidv4()}`;
      const contentType = req.headers["content-type"] || "application/octet-stream";
      const fileExt = contentType.split("/")[1] || "bin";
      const path = `${filename}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(process.env.SUPABASE_BUCKET_NAME)
        .upload(path, buffer, { contentType });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from(process.env.SUPABASE_BUCKET_NAME)
        .getPublicUrl(path);

      return res.json({ url: data.publicUrl });
    });
  } catch (error) {
    console.error("Supabase upload error:", error.message);
    return res.status(500).json({ error: "File upload failed" });
  }
};

// ---------------- Get All Users ----------------
export const getAllUsers = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT id, email FROM users ORDER BY id DESC");
    return res.json(rows);
  } catch (error) {
    console.error("Error fetching users:", error.message);
    return res.status(500).json({ error: "Failed to fetch users" });
  }
};

// ---------------- Get Messages For Specific User ----------------
export const getMessagesForUser = async (req, res) => {
  const userId = 1
  const myUserId = 2
  if (!myUserId) return res.status(400).json({ error: "Missing myUserId" });

  try {
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
    const { rows } = await pool.query("SELECT * FROM messages ORDER BY created_at DESC");
    //console.log(rows);
    
    return res.json(rows);
  } catch (error) {
    console.error("Error fetching all messages:", error.message);
    return res.status(500).json({ error: "Failed to fetch all messages" });
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

