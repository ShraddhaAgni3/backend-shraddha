import express from "express";
import { uploadFile, getAllUsers, getMessagesForUser, getAllMessages, addReaction, getAllReactions,deleteMessage } from "../controller/chatController.js";
import { getRecentChats } from "../controller/chatController.js";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.get("/api/chats/recent/:myUserId", getRecentChats); // Get Recent Chats
router.post("/api/chat/upload", upload.single("file"), uploadFile);  // Upload File
router.get("/api/users", getAllUsers); // Get All Users
router.get("/api/messages/:userId", getMessagesForUser); // Get Messages for User
router.post("/api/messages", getAllMessages); // Get All Messages
router.post("/api/reactions", addReaction);  // Add Reaction
router.get("/api/reactions", getAllReactions); // Get All Reactions
router.delete("/api/messages/:id", deleteMessage); // Delete Message by ID

export default router;

