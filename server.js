import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from "socket.io";
import { pool } from "./config/db.js";
import bodyParser from 'body-parser';

import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js"; 
import uploadRoutes from "./routes/uploadRoutes.js"; 
import { testConnection } from "./config/db.js";
import chatRoutes from "./routes/chatRoutes.js"; 
import cartRoutes from "./routes/cart.js";
import customerPlansRoutes from "./routes/customerPlans.js";
import adminPlansRoutes from "./routes/adminPlans.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import { stripeWebhook } from "./controller/paymentController.js";
import userMatchesRoute from './routes/userMatchesRoute.js';
import blogRoutes from "./routes/blog.routes.js";
import userProfileRoute from "./routes/usersRoute.js";
import recentActivitiesRoute from "./routes/recentAtivitiesRoute.js";
import adminConfigRoutes from "./routes/adminConfigRoutes.js";  
import configRoutes from "./routes/configRoutes.js";
import planRoutes from "./routes/planRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import adminReportRoutes from "./routes/adminreportRoutes.js";
import linkedinRoutes from './routes/linkedinRoutes.js';

dotenv.config();

const app = express();
testConnection();

// Stripe Webhook (must be before express.json())
app.post(
  "/payments/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: ['http://localhost:5173', 'https://backend-shraddha.onrender.com', 'https://frontend-shraddha.onrender.com'],
  credentials: true
}));

const server = http.createServer(app);

// onlineUsers: userId (string) → socket.id
export const onlineUsers = new Map();

export const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// ─────────────────────────────────────────────────────────────
// Socket.IO — WebRTC Signalling + Notifications
// ─────────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log("🟢 Connected:", socket.id);

  // ── Register user (called once on login / page load) ────────────────────
  // FIX: Only one place should register — handled here, not duplicated
  socket.on("register_user", (userId) => {
    if (!userId) return;
    const uid = String(userId);
    onlineUsers.set(uid, socket.id);
    socket.userId = uid;
    console.log(`📌 Registered user ${uid} → socket ${socket.id}`);
  });

  // ── CALL: Caller sends offer directly to callee by userId ────────────────
  socket.on("call-user", ({ targetUserId, offer, callType, from }) => {
    const targetSocketId = onlineUsers.get(String(targetUserId));
    if (!targetSocketId) {
      socket.emit("call-failed", { reason: "User is offline" });
      return;
    }
    // Store who called whom so we can route ICE candidates correctly
    socket.callTarget = String(targetUserId);

    io.to(targetSocketId).emit("incoming-call", {
      offer,
      from: String(from),
      callType,
      // roomId is derived deterministically on both sides — no need to pass it
    });
    console.log(`📞 call-user: ${from} → ${targetUserId}`);
  });

  // ── CALL: Callee sends answer back to caller ─────────────────────────────
  socket.on("call-accepted", ({ answer, to }) => {
    const targetSocketId = onlineUsers.get(String(to));
    if (targetSocketId) {
      io.to(targetSocketId).emit("call-accepted", { answer });
    }
  });

  // ── CALL: Callee rejects ─────────────────────────────────────────────────
  socket.on("call-rejected", ({ to }) => {
    const targetSocketId = onlineUsers.get(String(to));
    if (targetSocketId) {
      io.to(targetSocketId).emit("call-rejected");
    }
  });

  // ── CALL: Either side ends call ──────────────────────────────────────────
  socket.on("call-ended", ({ to }) => {
    const targetSocketId = onlineUsers.get(String(to));
    if (targetSocketId) {
      io.to(targetSocketId).emit("call-ended");
    }
  });

  // ── ICE CANDIDATES: route directly by userId, NOT by roomId ─────────────
  // FIX ROOT CAUSE 4: The old code used socket.to(roomId) which required
  // both sockets to have joined a room. In direct-call flow they never do.
  // Route by userId via onlineUsers map instead.
  socket.on("ice-candidate", ({ targetUserId, candidate }) => {
    if (!targetUserId || !candidate) return;
    const targetSocketId = onlineUsers.get(String(targetUserId));
    if (targetSocketId) {
      io.to(targetSocketId).emit("ice-candidate", { candidate });
    }
  });

  // ── Disconnect cleanup ───────────────────────────────────────────────────
  socket.on("disconnect", () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      console.log(`🔴 User ${socket.userId} disconnected`);
    }
  });
});

// ── Notification helper ──────────────────────────────────────────────────────
export const sendNotification = async (userId, title, message) => {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)`,
      [userId, title, message]
    );
    const socketId = onlineUsers.get(String(userId));
    if (socketId) {
      io.to(socketId).emit("new_notification", { title, message });
    }
    console.log(`🔔 Notification → user ${userId}: ${title}`);
  } catch (err) {
    console.error("❌ sendNotification error:", err);
  }
};

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/", authRoutes);
app.use("/", profileRoutes);
app.use("/", adminRoutes);
app.use("/", searchRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/payments", paymentRoutes);
app.use("/api", uploadRoutes);
app.use("/", chatRoutes);
app.use("/api/admin/configurations", configRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/plans", customerPlansRoutes);
app.use("/api/admin/plans", adminPlansRoutes);
app.use('/api/my_matches', userMatchesRoute);
app.use("/api/blogs", blogRoutes);
app.use("/api/users", userProfileRoute);
app.use("/api/view", recentActivitiesRoute);
app.use("/api/settings", adminConfigRoutes);
app.use("/api", planRoutes);
app.use("/api/admin/reports", reportRoutes);
app.use("/api/admin/users/handle", adminReportRoutes);
app.use('/api/linkedin', linkedinRoutes);

const port = process.env.PORT || 3435;
server.listen(port, () => console.log(`🚀 Server running on port ${port}`));

export { app };