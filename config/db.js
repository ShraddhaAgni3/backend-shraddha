// // db.js
// import pkg from "pg";
// import dotenv from "dotenv";

// dotenv.config();
// const { Pool } = pkg;

// // ✅ Connection string
// const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

// if (!connectionString) {
//   console.error("❌ Please set SUPABASE_DB_URL or DATABASE_URL in .env");
// }

// // ✅ Create PostgreSQL pool
// export const pool = new Pool({
//   connectionString,
//   ssl: { rejectUnauthorized: false },
// });

// // ✅ Test Connection
// export const testConnection = async () => {
//   try {
//     const result = await pool.query("SELECT NOW()");
//     console.log("✅ Connected to PostgreSQL. Current time:", result.rows[0].now);
//   } catch (err) {
//     console.error("❌ Database connection error:", err.message);
//   }
// };

// // ✅ Search Users by Email
// export const searchUsers = async (searchTerm) => {
//   const q = `
//     SELECT
//       id,
//       INITCAP(SPLIT_PART(email, '@', 1)) AS name,  -- Extract name part from email
//       email
//     FROM users
//     WHERE email ILIKE $1
//     ORDER BY email
//     LIMIT 50;
//   `;
//   const val = [`%${searchTerm}%`];
//   const { rows } = await pool.query(q, val);
//   return rows;
// };

// // ✅ Get Conversation Between Two Users
// export const getConversation = async (userA, userB) => {
//   const q = `
//     SELECT id, sender_id, receiver_id, content, attachment_url, created_at
//     FROM messages
//     WHERE (sender_id = $1 AND receiver_id = $2)
//        OR (sender_id = $2 AND receiver_id = $1)
//     ORDER BY created_at ASC;
//   `;
//   const { rows } = await pool.query(q, [userA, userB]);
//   return rows;
// };

// // ✅ Create Message
// export const createMessage = async (senderId, receiverId, content, attachmentUrl = null) => {
//   const q = `
//     INSERT INTO messages (sender_id, receiver_id, content, attachment_url)
//     VALUES ($1, $2, $3, $4)
//     RETURNING id, sender_id, receiver_id, content, attachment_url, created_at;
//   `;
//   const { rows } = await pool.query(q, [senderId, receiverId, content, attachmentUrl]);
//   return rows[0];
// };

// // ✅ Add or Update Reaction
// export const addOrUpdateReaction = async (messageId, userId, emoji) => {
//   const q = `
//     INSERT INTO reactions (message_id, user_id, emoji)
//     VALUES ($1, $2, $3)
//     ON CONFLICT (message_id, user_id)
//     DO UPDATE SET emoji = EXCLUDED.emoji, timestamp = CURRENT_TIMESTAMP
//     RETURNING id, message_id, user_id, emoji, timestamp;
//   `;
//   const { rows } = await pool.query(q, [messageId, userId, emoji]);
//   return rows[0];
// };

// // ✅ Get All Reactions in a Conversation
// export const getReactionsForConversation = async (userA, userB) => {
//   const q = `
//     SELECT r.id, r.message_id, r.user_id, r.emoji
//     FROM reactions r
//     JOIN messages m ON m.id = r.message_id
//     WHERE (m.sender_id = $1 AND m.receiver_id = $2)
//        OR (m.sender_id = $2 AND m.receiver_id = $1);
//   `;
//   const { rows } = await pool.query(q, [userA, userB]);
//   return rows;
// };



// db.js
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

// ✅ Connection string
const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ Please set SUPABASE_DB_URL or DATABASE_URL in .env");
}

// ✅ Create PostgreSQL pool
export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

// ✅ Test Connection
export const testConnection = async () => {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("✅ Connected to PostgreSQL. Current time:", result.rows[0].now);
  } catch (err) {
    console.error("❌ Database connection error:", err.message);
  }
};

// ✅ Search Users by Email
export const searchUsers = async (searchTerm) => {
  const q = `
    SELECT
      id,
      INITCAP(SPLIT_PART(email, '@', 1)) AS name,  -- Extract name part from email
      email
    FROM users
    WHERE email ILIKE $1
    ORDER BY email
    LIMIT 50;
  `;
  const val = ["%"+ searchTerm +"%"];
  const { rows } = await pool.query(q, val);
  return rows;
};

// ✅ Get Conversation Between Two Users
export const getConversation = async (userA, userB) => {
  const q = `
    SELECT id, sender_id, receiver_id, content, attachment_url, created_at
    FROM messages
    WHERE (sender_id = $1 AND receiver_id = $2)
       OR (sender_id = $2 AND receiver_id = $1)
    ORDER BY created_at ASC;
  `;
  const { rows } = await pool.query(q, [userA, userB]);
  return rows;
};

// ✅ Create Message
export const createMessage = async (senderId, receiverId, content, attachmentUrl = null) => {
  const q = `
    INSERT INTO messages (sender_id, receiver_id, content, attachment_url)
    VALUES ($1, $2, $3, $4)
    RETURNING id, sender_id, receiver_id, content, attachment_url, created_at;
  `;
  const { rows } = await pool.query(q, [senderId, receiverId, content, attachmentUrl]);
  return rows[0];
};

// ✅ Add or Update Reaction
export const addOrUpdateReaction = async (messageId, userId, emoji) => {
  const q = `
    INSERT INTO reactions (message_id, user_id, emoji)
    VALUES ($1, $2, $3)
    ON CONFLICT (message_id, user_id)
    DO UPDATE SET emoji = EXCLUDED.emoji, timestamp = CURRENT_TIMESTAMP
    RETURNING id, message_id, user_id, emoji, timestamp;
  `;
  const { rows } = await pool.query(q, [messageId, userId, emoji]);
  return rows[0];
};

// ✅ Get All Reactions in a Conversation
export const getReactionsForConversation = async (userA, userB) => {
  const q = `
    SELECT r.id, r.message_id, r.user_id, r.emoji
    FROM reactions r
    JOIN messages m ON m.id = r.message_id
    WHERE (m.sender_id = $1 AND m.receiver_id = $2)
       OR (m.sender_id = $2 AND m.receiver_id = $1);
  `;
  const { rows } = await pool.query(q, [userA, userB]);
  return rows;
};
