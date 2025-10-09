import { pool } from "../config/db.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config()

export async function loginUser(req, res) {
  try {
    const { email, password } = req.body;
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email and password
    const query = `
      SELECT id, email, created_at
      FROM users_users
      WHERE email = $1 AND password_hash = $2
    `;
    const values = [email, password];
    //console.log(email + " : "+password);
    const {rows} = await pool.query(query, values);

     if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
     const payload = {
      id:rows[0].id,
      email:rows[0].email
     }
     

   const access_secret_key =process.env.ACCESS_SECRET_KEY
    const refresh_secret_key =process.env.REFRESH_SECRET_KEY

    const generateAccessToken = jwt.sign(payload, access_secret_key , { expiresIn:"15m" });
    const generateRefreshToken = jwt.sign(payload,refresh_secret_key,{expiresIn:"7d"})

    res.cookie("accessToken",generateAccessToken,{
      maxAge:1000*60*15,
      sameSite:"strict",
      httpOnly:true
    })


    res.cookie("refreshToken",generateRefreshToken,{
      maxAge:1000*60*60*24*7,
      sameSite:"strict",
      httpOnly:true
    })
   const user = rows[0];

    return res.status(200).json({
      message: 'Login successful',
      user
    });
  } catch (err) {
    console.log('❌ loginUser error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}