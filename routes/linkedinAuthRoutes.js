import express from 'express';
import LinkedInAuthController from '../controller/linkedinAuthController.js';
const router = express.Router();
// 1. Get LinkedIn login URL
router.get('/auth-url', LinkedInAuthController.generateAuthUrl);

// 2. Handle LinkedIn callback
router.get('/callback', LinkedInAuthController.handleCallback);

export default router;