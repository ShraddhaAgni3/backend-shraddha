import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from "socket.io";
import { pool } from "./config/db.js"; // ✅ Use your existing DB connection
import bodyParser from 'body-parser';

// ✅ Import routes
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
// Admin imports
import adminRoutes from "./routes/adminRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js"; 
import uploadRoutes from "./routes/uploadRoutes.js"; 
import { testConnection } from "./config/db.js";
// Chat imports
import chatRoutes from "./routes/chatRoutes.js"; 
import cartRoutes from "./routes/cart.js";
// Plans imports
import customerPlansRoutes from "./routes/customerPlans.js";
import adminPlansRoutes from "./routes/adminPlans.js";

// Payment imports
import paymentRoutes from "./routes/paymentRoutes.js";
import { stripeWebhook } from "./controller/paymentController.js";

import userMatchesRoute from './routes/userMatchesRoute.js';
// Blog imports
import blogRoutes from "./routes/blog.routes.js";

import userProfileRoute from "./routes/usersRoute.js";
import recentActivitiesRoute from "./routes/recentAtivitiesRoute.js";

import adminConfigRoutes from "./routes/adminConfigRoutes.js";  
//Importing configuration route
import configRoutes from "./routes/configRoutes.js";

import planRoutes from "./routes/planRoutes.js";
// Load environment variables
import reportRoutes from "./routes/reportRoutes.js";
import adminReportRoutes from "./routes/adminreportRoutes.js";
//import { create } from "domain";

import linkedinRoutes from './routes/linkedinRoutes.js';
dotenv.config();

const app = express();
testConnection();

// -------------------- Stripe Webhook Route ------------------------
app.post(
  "/payments/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Serve static files from "uploads" directory
//app.use("/uploads", express.static("uploads"));

app.use(cors({
    origin: ['http://localhost:5173', 'https://backend-shraddha.onrender.com', 'https://frontend-shraddha.onrender.com'],
    credentials: true
}));


const server = http.createServer(app);

export const onlineUsers = new Map();

export const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// WebRTC Signalling  (replace the existing io.on("connection") block in server.js)
// ─────────────────────────────────────────────────────────────────────────────

const rooms = {}; // roomId → Set<socketId>

io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  
  // ── 1. Track online users by their app userId ──────────────────────────
  socket.on("register_user", (userId) => {
    if (!userId) return;
    onlineUsers.set(String(userId), socket.id);
    socket.userId = String(userId);          // attach to socket for cleanup
    console.log(`📌 Registered user ${userId} → socket ${socket.id}`);
  });

  // ── 2. Join a call room (max 2 peers) ─────────────────────────────────
  socket.on("join-room", (roomId) => {
    if (!roomId) return;

    if (!rooms[roomId]) rooms[roomId] = new Set();

    if (rooms[roomId].size >= 2) {
      socket.emit("room-full");
      return;
    }

    rooms[roomId].add(socket.id);
    socket.join(roomId);
    socket.currentRoom = roomId;   // store for disconnect cleanup

    // Tell the *other* peer (if present) to start the offer flow
    const others = [...rooms[roomId]].filter((id) => id !== socket.id);
    if (others.length > 0) {
      io.to(others[0]).emit("ready", socket.id);
    }

    console.log(`🚪 Room ${roomId}:`, [...rooms[roomId]]);
  });

  // ── 3. Forwarding: offer / answer / ice-candidate ──────────────────────
  socket.on("offer", ({ roomId, offer }) => {
    if (!roomId || !offer) return;
    socket.to(roomId).emit("offer", offer);
  });

  socket.on("answer", ({ roomId, answer }) => {
    if (!roomId || !answer) return;
    socket.to(roomId).emit("answer", answer);
  });

  socket.on("ice-candidate", ({ roomId, candidate }) => {
    if (!roomId || !candidate) return;
    socket.to(roomId).emit("ice-candidate", { candidate });
  });

  // ── 4. Disconnect cleanup ──────────────────────────────────────────────
  socket.on("disconnect", () => {
    // Remove from online map
    if (socket.userId) onlineUsers.delete(socket.userId);

    // Notify room peers and clean up room
    const roomId = socket.currentRoom;
    if (roomId && rooms[roomId]) {
      rooms[roomId].delete(socket.id);
      socket.to(roomId).emit("user-left");

      // Delete empty rooms
      if (rooms[roomId].size === 0) delete rooms[roomId];
    }

    console.log("🔴 Disconnected:", socket.id);
  });
});
//  Function to send notification
export const sendNotification = async (userId, title, message,) => {
  try {
    // Save in notifications table
    await pool.query(
      `INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)`,
      [userId, title, message]
    );

    // Send via Socket.IO if user is online
    const socketId = onlineUsers.get(String(userId));
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


// Payment routes 
app.use("/payments", paymentRoutes);

app.use("/api", uploadRoutes);
app.use("/",chatRoutes); // new chat routes

//Configuration Routes:-
app.use("/api/admin/configurations", configRoutes);
// Routes
app.use("/api/cart", cartRoutes);
app.use("/api/plans", customerPlansRoutes);
app.use("/api/admin/plans", adminPlansRoutes);
// User Matches Route
app.use('/api/my_matches', userMatchesRoute);

// Blog routes
app.use("/api/blogs", blogRoutes);

// User Profile Routes
app.use("/api/users", userProfileRoute);

app.use("/api/view", recentActivitiesRoute);

// COnfiguration setting for member_approval
app.use("/api/settings", adminConfigRoutes);

// Plan status route
app.use("/api", planRoutes);

// Admin Reports Route
app.use("/api/admin/reports", reportRoutes);

app.use("/api/admin/users/handle",adminReportRoutes);
// LinkedIn Auth Routes
app.use('/api/linkedin', linkedinRoutes);


//app.use(express.urlencoded({ extended: true })); 
const port = process.env.PORT || 3435;
server.listen(port, () => console.log(`🚀 Server running on localhost:${port}`));

export { app };
