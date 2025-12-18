import express from 'express';
import { recentActivitiesAddNewViewer, recentViewers, getUnreadMessagesCount} from '../controller/recentActivitiesController.js';
import { validateAccessToken } from '../middleware/verfiytoken.js';

const router = express.Router();

router.use(validateAccessToken);

router.post("/viewers/:viewedId", recentActivitiesAddNewViewer);
router.get("/:userId/recentViewers", recentViewers);
router.get("/:userId/unreadMessages", getUnreadMessagesCount);

export default router;