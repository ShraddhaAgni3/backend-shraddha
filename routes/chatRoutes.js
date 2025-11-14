import express from "express";
import { uploadFile, getAllUsers, getMessagesForUser, getAllMessages, addReaction, getAllReactions } from "../controller/chatController.js";


import multer from "multer";
const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();
// Chat / File / Reaction Routes
router.post("/api/chat/upload", upload.single("file"), uploadFile);
router.get("/api/users", getAllUsers); //
router.get("/api/messages/:userId", getMessagesForUser); //
router.post("/api/messages", getAllMessages); //
router.post("/api/reactions", addReaction);
router.get("/api/reactions", getAllReactions);//

export default router;

