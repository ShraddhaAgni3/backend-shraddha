import express from "express";
import { uploadFile, getAllUsers, getMessagesForUser, getAllMessages, addReaction, getAllReactions,deleteMessage} from "../controller/chatController.js";
import { getRecentChats } from "../controller/chatController.js";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();


router.get("/api/chats/recent/:myUserId", getRecentChats);         
router.post("/api/chat/upload" ,upload.single("file"), uploadFile);   //
router.get("/api/users", getAllUsers); // Get All Users
router.get("/api/messages/:userId", getMessagesForUser); 
router.post("/api/messages", getAllMessages); // 
router.post("/api/reactions",addReaction);    //
router.get("/api/reactions", getAllReactions);        
router.delete("/api/messages/:id", deleteMessage); 

// ---------------- Get Chat Messages ----------------


 
export default router;

