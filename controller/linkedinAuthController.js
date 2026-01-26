import axios from 'axios';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

class LinkedInAuthController {
    // Generate LinkedIn login URL
    static generateAuthUrl(req, res) {
        try {
            const clientId = process.env.LINKEDIN_CLIENT_ID;
            const redirectUri = encodeURIComponent(process.env.LINKEDIN_REDIRECT_URI);
            const scope = encodeURIComponent('openid profile email');
            
            const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${Date.now()}`;
            
            res.json({
                success: true,
                authUrl,
                message: 'LinkedIn login URL generated'
            });
        } catch (error) {
            console.error('URL generation error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate LinkedIn URL'
            });
        }
    }

    // Handle LinkedIn callback
    static async handleCallback(req, res) {
        try {
            const { code } = req.query;
            
            if (!code) {
                return res.status(400).json({
                    success: false,
                    message: 'Authorization code missing'
                });
            }

            // 1. Exchange code for access token
            const tokenRes = await axios.post(
                'https://www.linkedin.com/oauth/v2/accessToken',
                new URLSearchParams({
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
                    client_id: process.env.LINKEDIN_CLIENT_ID,
                    client_secret: process.env.LINKEDIN_CLIENT_SECRET
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            const accessToken = tokenRes.data.access_token;

            // 2. Get user info from LinkedIn
            const userRes = await axios.get('https://api.linkedin.com/v2/userinfo', {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });

            const { email, given_name, family_name } = userRes.data;
            const fullName = `${given_name || ''} ${family_name || ''}`.trim();

            if (!email) {
                throw new Error('Email not provided by LinkedIn');
            }

            // 3. Database operations
            const userCheck = await pool.query(
                'SELECT * FROM users WHERE email = $1',
                [email]
            );

            let user;

            if (userCheck.rows.length > 0) {
                // Update existing user
                const updateResult = await pool.query(
                    `UPDATE users 
                     SET auth_provider = 'linkedin',
                         is_email_verified = true,
                         is_profile_completed = true,
                         updated_at = NOW()
                     WHERE email = $1 
                     RETURNING *`,
                    [email]
                );
                user = updateResult.rows[0];
            } else {
                // Create new user
                const insertResult = await pool.query(
                    `INSERT INTO users 
                     (email, name, auth_provider, is_email_verified, is_profile_completed, created_at, updated_at)
                     VALUES ($1, $2, 'linkedin', true, true, NOW(), NOW())
                     RETURNING *`,
                    [email, fullName]
                );
                user = insertResult.rows[0];
            }

            // 4. Generate JWT token
            const token = jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    authProvider: user.auth_provider
                },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            // 5. Send response
            res.json({
                success: true,
                message: 'LinkedIn login successful',
                token: token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name || fullName,
                    authProvider: user.auth_provider,
                    isEmailVerified: user.is_email_verified,
                    isProfileCompleted: user.is_profile_completed
                }
            });

        } catch (error) {
            console.error('LinkedIn auth error:', error.response?.data || error.message);
            res.status(500).json({
                success: false,
                message: 'LinkedIn authentication failed',
                error: error.message
            });
        }
    }
}

export default LinkedInAuthController;