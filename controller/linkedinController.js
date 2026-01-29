import axios from 'axios';
import jwt from 'jsonwebtoken';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

class LinkedInAuthController {
    // 1. Frontend ke liye LinkedIn Login URL generate karna
    static generateAuthUrl(req, res) {
        try {
            const clientId = process.env.LINKEDIN_CLIENT_ID;
            const redirectUri = encodeURIComponent(process.env.LINKEDIN_REDIRECT_URI);
            const scope = encodeURIComponent('openid profile email');
            const state = Math.random().toString(36).substring(7);

            const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
            
            res.json({ url: authUrl });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // 2. LinkedIn se wapas aane par User ko Website mein login karwana
    static async handleCallback(req, res) {
        try {
            const { code } = req.query;
            if (!code) return res.status(400).json({ success: false, message: "Code missing" });

            // Step A: Token exchange
            const tokenResponse = await axios.post(
                'https://www.linkedin.com/oauth/v2/accessToken',
                new URLSearchParams({
                    grant_type: 'authorization_code',
                    code: code,
                    client_id: process.env.LINKEDIN_CLIENT_ID,
                    client_secret: process.env.LINKEDIN_CLIENT_SECRET,
                    redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
                }).toString(),
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );

            const accessToken = tokenResponse.data.access_token;

            // Step B: Get LinkedIn User Info
            const userResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            const { name, email } = userResponse.data;

            // ✅ Step C: Database Query (Using your columns: auth_provider, is_email_verified)
            let userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
            let user;

            if (userResult.rows.length === 0) {
                // Naya user: INSERT
                const insertResult = await pool.query(
                    `INSERT INTO users (name, email, auth_provider, is_email_verified, created_at) 
                     VALUES ($1, $2, 'linkedin', TRUE, NOW()) 
                     RETURNING *`,
                    [name, email]
                );
                user = insertResult.rows[0];
            } else {
                // Purana user: UPDATE status to linkedin
                const updateResult = await pool.query(
                    `UPDATE users 
                     SET auth_provider='linkedin', is_email_verified=TRUE, updated_at=NOW() 
                     WHERE email=$1 
                     RETURNING *`,
                    [email]
                );
                user = updateResult.rows[0];
            }

            // ✅ Step D: Website JWT Token banayein
            const websiteToken = jwt.sign(
                { id: user.id, email: user.email },
                process.env.JWT_SECRET || 'secret123',
                { expiresIn: '7d' }
            );

            res.json({
                success: true,
                token: websiteToken,
                user: { id: user.id, name: user.name, email: user.email }
            });

        } catch (error) {
            console.error("❌ Auth Error:", error.response?.data || error.message);
            res.status(500).json({ success: false, message: "Authentication failed" });
        }
    }
}

export default LinkedInAuthController;
