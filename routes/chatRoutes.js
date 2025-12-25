import express from "express";
import { uploadFile, getAllUsers, getMessagesForUser, getAllMessages, addReaction, getAllReactions,deleteMessage} from "../controller/chatController.js";
import { getRecentChats } from "../controller/chatController.js";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();


router.get("/api/chats/recent/:myUserId", getRecentChats); // Get Recent Chats           /(2)
router.post("/api/chat/upload", upload.single("file"), uploadFile);  // Upload File
router.get("/api/users", getAllUsers); // Get All Users
router.get("/api/messages/:userId", getMessagesForUser); // Get Messages for User  ////  /(1)
router.post("/api/messages", getAllMessages); // Get All Messages
router.post("/api/reactions", addReaction);  // Add Reaction
router.get("/api/reactions", getAllReactions); // Get All Reactions         /(3)
router.delete("/api/messages/:id", deleteMessage); // Delete Message by ID

// ---------------- Get Chat Messages ----------------


 
export default router;

