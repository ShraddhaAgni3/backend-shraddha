// import express from "express";
// import dotenv from "dotenv";
// import cors from "cors";
// import authRoutes from "./routes/authRoutes.js"
// import { testConnection } from "./config/db.js";
// import cookieParser from "cookie-parser";
// import profileRoutes from "./routes/profileRoutes.js";
// import adminRoutes from "./routes/adminRoutes.js"
// import searchRoutes from "./routes/searchRoutes.js";
// const app = express();
// dotenv.config();

// testConnection();

// app.use(cors());
// app.use(express.json());
// app.use(cookieParser());

// // Routes
// app.use("/",authRoutes);
// app.use("/",profileRoutes);
// app.use("/",adminRoutes)

// app.use("/",searchRoutes); // Added search routes

// const port = process.env.PORT;

// app.listen(port,()=>console.log(`localhost:${port}`));


import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from "socket.io";
import { pool } from "./config/db.js"; // ✅ Use your existing DB connection

// ✅ Import routes
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js"; // new
import uploadRoutes from "./routes/uploadRoutes.js"; // new
import { testConnection } from "./config/db.js";
import chatRoutes from "./routes/chatRoutes.js"; // new
dotenv.config();
const app = express();
testConnection();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

//  Create HTTP + Socket.IO server
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

//  Track online users (userId → socketId)
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log(" User connected:", socket.id);

  // When frontend registers userId with socket
  socket.on("register_user", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(` User ${userId} registered for notifications`);
  });

  socket.on("disconnect", () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    console.log(" User disconnected:", socket.id);
  });
});

//  Function to send notification
export const sendNotification = async (userId, title, message) => {
  try {
    // Save in notifications table
    await pool.query(
      `INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)`,
      [userId, title, message]
    );

    // Send via Socket.IO if user is online
    const socketId = onlineUsers.get(userId);
    if (socketId) {
      io.to(socketId).emit("new_notification", { title, message });
    }

    console.log(` Notification sent to user ${userId}: ${title}`);
  } catch (err) {
    console.error(" Error sending notification:", err);
  }
};

//  Existing routes — unchanged
app.use("/", authRoutes);
app.use("/", profileRoutes);
app.use("/", adminRoutes);
app.use("/", searchRoutes);
app.use("/api/notifications",notificationRoutes); // new route for fetching notifications 

app.use("/api", uploadRoutes);
app.use("/",chatRoutes); // new chat routes
app.use(express.urlencoded({ extended: true })); 
const port = process.env.PORT || 3435;
server.listen(port, () => console.log(`🚀 Server running on localhost:${port}`));

export { app, io };
