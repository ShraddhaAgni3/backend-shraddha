import express from "express";
import { getAllPlans} from "../controller/customerPlansController.js";
import { validateAccessToken } from "../middleware/verfiytoken.js";
const router = express.Router();

router.use(validateAccessToken);
// for Customer only See routes
router.get("/", getAllPlans);    // List all plans
export default router;
