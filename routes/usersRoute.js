import express from 'express';
import { userProfile} from '../controller/usersController.js';
import { validateAccessToken } from '../middleware/verfiytoken.js';
const router = express.Router();

//router.get("/", allUsersProfiles);
router.use(validateAccessToken);
router.get("/:userId", userProfile); //-


export default router;