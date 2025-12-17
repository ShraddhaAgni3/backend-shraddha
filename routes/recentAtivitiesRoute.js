import express from 'express';
import { recentActivitiesAddNewViewer, recentViewers, getUnreadMessagesCount } from '../controller/recentActivitiesController.js';

import { isLoggedIn } from '../middleware/isLoggedIn.js';

const router = express.Router();

router.post("/viewers/:viewerId", isLoggedIn, recentActivitiesAddNewViewer);
router.get("/:userId/recentViewers", recentViewers);
router.get("/:userId/unreadMessages", getUnreadMessagesCount);

export default router;