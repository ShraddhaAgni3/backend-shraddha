import express from 'express';
import { getUserMatches } from '../controller/userMatchesController.js';
import { validateAccessToken } from '../middleware/verfiytoken.js';

const router = express.Router();

router.use(validateAccessToken);
router.get("/:userId", getUserMatches); //-

export default router;