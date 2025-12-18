import express from "express";
import { searchProfiles } from "../controller/searchController.js";
import { validateAccessToken } from "../middleware/verfiytoken.js";
const router = express.Router();    

router.use(validateAccessToken);
router.get("/search", searchProfiles); // Search Profiles by Query Parameter

export default router;