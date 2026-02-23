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



//  Create HTTP + Socket.IO server
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin:"*", 
    methods: ["GET", "POST"],
    credentials: true,
  },
   transports: ["websocket"],
});
  console.log("✅ Socket connected");
// Track online users
const onlineUsers = new Map();
const activeCalls = new Map();
// key: callerId
// value: { to, answered: false, timeout }
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // REGISTER USER
  socket.on("register_user", (userId) => {
    onlineUsers.set(userId.toString(), socket.id);
    console.log("User registered:", userId);
  });
// ====== SHRADDHA CODE STARTED ======
  // CALL USER
 socket.on("call-user", async (data) => {
  if (!data?.to) return;

  const callerId = data.from.toString();
  const receiverId = data.to.toString();

  const targetSocket = onlineUsers.get(receiverId);

  // Save call state
  const timeout = setTimeout(async () => {
    const call = activeCalls.get(callerId);

    if (call && !call.answered) {
      // MISSED CALL for receiver
      await sendNotification(
        receiverId,
        "Missed Call",
        `Missed call from User ${callerId}`
      );

      // OUTGOING CALL for caller
      await sendNotification(
        callerId,
        "Outgoing call",
        `Outgoing call to User ${receiverId}`
      );

      activeCalls.delete(callerId);
    }
  }, 20000); // 20 seconds ring time

  activeCalls.set(callerId, {
    to: receiverId,
    answered: false,
    timeout
  });

  // Incoming call notification
  await sendNotification(
    receiverId,
    "Incoming Call",
    `Incoming call from User ${callerId}`
  );

  if (targetSocket) {
    io.to(targetSocket).emit("incoming-call", {
      offer: data.offer,
      from: callerId,
      callType: data.callType
    });
  }
});

  // ANSWER CALL
socket.on("answer-call", (data) => {
  const callerId = data.to.toString(); // this is caller
  const callData = activeCalls.get(callerId);

  if (callData) {
    callData.answered = true;
    clearTimeout(callData.timeout);
    activeCalls.delete(callerId);
  }

  const callerSocket = onlineUsers.get(callerId);

  if (callerSocket) {
    io.to(callerSocket).emit("call-answered", {
      answer: data.answer
    });
  }
});

  // ICE CANDIDATE
  socket.on("ice-candidate", (data) => {
   if (!data?.to) {
  console.log("❌ Missing target user in socket event:", data);
  return;
}

const targetSocket = onlineUsers.get(data.to.toString());

    if (targetSocket) {
      io.to(targetSocket).emit("ice-candidate", data.candidate);
    }
  });

  // END CALL
  socket.on("end-call", async (data) => {
  if (!data?.to) return;

  const receiverId = data.to.toString();
  const targetSocket = onlineUsers.get(receiverId);

  if (targetSocket) {
    io.to(targetSocket).emit("call-ended");
  }

  // Clear active call
  for (const [callerId, callData] of activeCalls.entries()) {
    if (callData.to === receiverId) {
      clearTimeout(callData.timeout);
      activeCalls.delete(callerId);
      break;
    }
  }
});
// ====== SHRADDHA CODE end ======
  // DISCONNECT
  socket.on("disconnect", () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    console.log("User disconnected:", socket.id);
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

export { app, io, onlineUsers };

