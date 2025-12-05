import express from "express";
import { searchProfiles } from "../controller/searchController.js";
const router = express.Router();    

router.get("/search", searchProfiles); // Search Profiles by Query Parameter

export default router;