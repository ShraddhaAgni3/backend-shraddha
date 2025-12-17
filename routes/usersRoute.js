import express from 'express';
import { userProfile} from '../controller/usersController.js';
const router = express.Router();

//router.get("/", allUsersProfiles);
router.get("/:userId", userProfile);


export default router;