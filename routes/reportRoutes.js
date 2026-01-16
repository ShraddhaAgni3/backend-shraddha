import { Router } from "express";
import { getAdminReport } from "../controller/reportController.js";
const router = Router();

router.get("/", getAdminReport);


export default router;
