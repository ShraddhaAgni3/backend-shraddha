import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";
import { io,onlineUsers,sendNotification } from "../server.js"; 
import { pool } from "../config/db.js";
import { searchUsers } from "../config/db.js";
import cloudinary from "../config/cloudinaryConfig.js";
dotenv.config();

// ✅ Initialize Supabase

// ---------------- Health Check ----------------
export const healthCheck = (req, res) => {
  return res.json({ status: "Server running ✅" });
};

//---------------- Upload File ----------------
// export const uploadFile = async (req, res) => {
//   try {
//     const chunks = [];

//     // Collect raw binary data
//     req.on("data", (chunk) => chunks.push(chunk));

//     req.on("end", async () => {
//       const buffer = Buffer.concat(chunks);

//       const contentType = req.headers["content-type"] || "application/octet-stream";
//       const extension = contentType.split("/")[1] || "bin";
//       const filename = `${uuidv4()}.${extension}`;


//       // ✅ Insert file into PostgreSQL as BYTEA
//       const result = await pool.query(
//         `INSERT INTO uploads (filename, mime_type, data)
//          VALUES ($1, $2, $3)
//          RETURNING id, filename, mime_type, created_at`,
//         [filename, contentType, buffer]
//       );
//         //  const fileId = result.rows[0].id;
//       return res.json({
//         message: "File uploaded successfully ✅",
//         file: result.rows[0]
//      //  url: `${process.env.BASE_URL}/api/chat/file/${fileId}`
//       });
//     });

//   } catch (error) {
//     console.error("Upload error:", error);
//     return res.status(500).json({ error: "File upload failed" });
//   }
// };
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

// export const uploadFile = async (req, res) => {
//   try {
//     const chunks = [];

//     req.on("data", (chunk) => chunks.push(chunk));

//     req.on("end", async () => {
//       const buffer = Buffer.concat(chunks);

//       const contentType = req.headers["content-type"] || "application/octet-stream";
//       const extension = contentType.split("/")[1] || "bin";
//       const filename = `${uuidv4()}.${extension}`;

//       const result = await pool.query(
//         `INSERT INTO uploads (filename, mime_type, data)
//          VALUES ($1, $2, $3)
//          RETURNING id, filename, mime_type, created_at`,
//         [filename, contentType, buffer]
//       );

//       const fileId = result.rows[0].id;

//       return res.json({
//         message: "File uploaded successfully ✅",
//         url: `${process.env.BASE_URL}/api/chat/file/${fileId}`
//       });
//     });

//   } catch (error) {
//     console.error("Upload error:", error);
//     return res.status(500).json({ error: "File upload failed" });
//   }
// };

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



// export const getMessagesForUser = async (req, res) => {
//   try {
//     const { userId } = req.params; // URL param (receiver)
//    // const myUserId = 6; // logged in user (sender)
//     //const myUserId = req.query.myUserId; // logged in user (sender) from query param
//     const { myUserId } = req.query;
//     if (!userId || !myUserId) {
//       return res.status(400).json({ error: "Missing userId or myUserId" });
//     }

//     const { rows } = await pool.query(
//       `SELECT * FROM messages 
//        WHERE (sender_id = $1 AND receiver_id = $2)
//           OR (sender_id = $2 AND receiver_id = $1)
//        ORDER BY created_at ASC`,
//       [myUserId, userId]
//     );

//          // ✅ 2️⃣ Mark message notifications as read for current user
//     await pool.query(
//       `UPDATE message_notifications
//        SET is_read = TRUE
//        WHERE receiver_id = $1 AND sender_id = $2 AND is_read = FALSE`,
//       [myUserId, userId]
//     );

//     return res.json(rows);
    
//   } catch (error) {
//     console.error("Error fetching messages:", error.message);
//     return res.status(500).json({ error: "Failed to fetch messages" });
//   }
// };

// // ---------------- Get All Messages ----------------
// export const getAllMessages = async (req, res) => {
//   try {
//     const { sender_id, receiver_id, content, attachment_url } = req.body;

//     if (!sender_id || !receiver_id || (!content && !attachment_url)) {
//       return res.status(400).json({
//         error: "sender_id, receiver_id and at least one of content or attachment_url are required"
//       });
//     }

//     const { rows } = await pool.query(
//       `INSERT INTO messages (sender_id, receiver_id, content, attachment_url)
//        VALUES ($1, $2, $3, $4)
//        RETURNING *`,
//       [sender_id, receiver_id, content, attachment_url]
//     );

//     const savedMessage = rows[0];

//       // ✅ 2️⃣ Ab message_notification table me entry daalo
//     await pool.query(
//       `INSERT INTO message(sender_id, receiver_id, message)
//        VALUES ($1, $2, $3)`,
//       [sender_id, receiver_id, content || "📎 Attachment"]
//     );

//     // ✅ Send message to all connected clients
//     io.emit("new_message", savedMessage);

//       // ✅ 4️⃣ (Optional) Agar receiver online hai to unko notification bhej do
//     const receiverSocketId = onlineUsers.get(receiver_id);
//     if (receiverSocketId) {
//       io.to(receiverSocketId).emit("message_notification", {
//         from: sender_id,
//         message: content || "📎 Attachment",
//         timestamp: savedMessage.created_at
//       });
//     }

//     return res.json(savedMessage);
//   } catch (error) {
//     console.error("Error saving message:", error.message);
//     return res.status(500).json({ error: "Failed to save message" });
//   }
// };

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

    // ✅ 4️⃣ If receiver is online, send direct notification
    const receiverSocketId = onlineUsers.get(receiver_id);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("message_notification", {
        from: sender_id,
        message: content || "📎 Attachment",
        timestamp: savedMessage.created_at,
      });
    }

    // ✅ 5️⃣ Send success response
    return res.status(201).json(savedMessage);

  } catch (error) {
    console.error("Error saving message:", error.message);
    return res.status(500).json({ error: "Failed to save message" });
  }
};

// // ---------------- Add Reaction ----------------
// export const addReaction = async (req, res) => {
//   const { message_id, user_id, emoji } = req.body;
//   if (!message_id || !user_id || !emoji)
//     return res.status(400).json({ error: "message_id, user_id, emoji required" });

//   try {
//     const { rows } = await pool.query(
//       `INSERT INTO reactions (message_id, user_id, emoji)
//        VALUES ($1, $2, $3)
//        ON CONFLICT (message_id, user_id)
//        DO UPDATE SET emoji = EXCLUDED.emoji
//        RETURNING *`,
//       [message_id, user_id, emoji]
//     );

//     const reaction = rows[0];
//     io.emit("new_reaction", reaction);
//     return res.json(reaction);
//   } catch (error) {
//     console.error("Error saving reaction:", error.message);
//     return res.status(500).json({ error: "Failed to save reaction" });
//   }
// };

// // ---------------- Get All Reactions ----------------
// export const getAllReactions = async (req, res) => {
//   try {
//     const { rows } = await pool.query("SELECT * FROM reactions ORDER BY timestamp DESC");
//     return res.json(rows);
//   } catch (error) {
//     console.error("Error fetching reactions:", error.message);
//     return res.status(500).json({ error: "Failed to fetch reactions" });
//   }
// };

   



// ---------------- Add Reaction ----------------
export const addReaction = async (req, res) => {
  const { message_id, user_id, emoji } = req.body;

  if (!message_id || !user_id || !emoji) {
    return res
      .status(400)
      .json({ error: "message_id, user_id, and emoji are required" });
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

    // Receiver = the opposite user of who reacted
    const receiverId =
      message.sender_id === user_id ? message.receiver_id : message.sender_id;

       await sendNotification(
      receiverId,
      "New Reaction 💬",
      `User ${user_id} reacted with "${emoji}" on your message.`
    );

    // 3️⃣ Insert notification in DB
    const notifTitle = "New Reaction 💬";
    const notifMsg = `User ${user_id} reacted with "${emoji}" on your message.`;

    await pool.query(
      `INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)`,
      [receiverId, notifTitle, notifMsg]
    );

    // 4️⃣ Send real-time notification if receiver is online
    const socketId = onlineUsers.get(receiverId);
    if (socketId) {
      io.to(socketId).emit("new_notification", {
        title: notifTitle,
        message: notifMsg,
        reaction,
      });
    }

    // 5️⃣ Also broadcast updated reaction (optional for UI updates)
    io.emit("new_reaction", reaction);

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


































// export const downloadFile = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const result = await pool.query(
//       "SELECT filename, mime_type, data FROM uploads WHERE id = $1",
//       [id]
//     );

//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: "File not found" });
//     }

//     const file = result.rows[0];

//     res.setHeader("Content-Type", file.mime_type);
//     res.setHeader("Content-Disposition", `inline; filename="${file.filename}"`);

//     return res.send(file.data);
//   } catch (err) {
//     console.error("Download error:", err);
//     return res.status(500).json({ error: "Failed to fetch file" });
//   }
// };


