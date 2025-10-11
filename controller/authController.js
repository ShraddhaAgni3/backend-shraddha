import { pool } from "../config/db.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();

export const registerUser = async (req, res) => {
  try {
    const {
      full_name,
      email,
      password,
      profession,
      interests,
      marital_status,
    } = req.body;

    // Basic validation
    if (
      !full_name ||
      !email ||
      !password ||
      !profession ||
      !interests ||
      !marital_status
    ) {
      return res
        .status(400)
        .json({ error: "Please fill all required fields." });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "User already exists." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const userQuery = `
      INSERT INTO users (email, password)
      VALUES ($1, $2)
      RETURNING id,email,created_at;
    `;

    const userValues = [
      email,
      hashedPassword
    ];

    const result = await pool.query(userQuery, userValues);

    console.log(result);

    const user_id = result.rows[0].id;

    const profileQuery = `INSERT INTO profiles (
    user_id,full_name,marital_status,
    profession,interests,is_submitted) 
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING id,user_id,full_name,marital_status,profession,interests,created_at`;

    const profileValues = [user_id,full_name,marital_status,profession,JSON.stringify(interests),true];
    const profileResult = await pool.query(profileQuery,profileValues);

    console.log(profileResult);
    const user = {profile_info : profileResult.rows[0]};
    user.email = result.rows[0].email;

    console.log(user);
    res.status(201).json({
      message: "User registered successfully!",
      user
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

export async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user by email
    const query = `
      SELECT id, email, password, full_name, profession, marital_status, created_at
      FROM users
      WHERE email = $1
    `;
    const { rows } = await pool.query(query, [email]);

    // If user not found
    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid email" });
    }

    const user = rows[0];

    // ✅ Compare entered password with hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid Password" });
    }

    // Create JWT payload
    const payload = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      profession: user.profession,
      marital_status: user.marital_status,
    };

    // Generate tokens
    const access_secret_key = process.env.ACCESS_SECRET_KEY;
    const refresh_secret_key = process.env.REFRESH_SECRET_KEY;

    const accessToken = jwt.sign(payload, access_secret_key, {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign(payload, refresh_secret_key, {
      expiresIn: "7d",
    });

    // Set cookies
    res.cookie("accessToken", accessToken, {
      maxAge: 1000 * 60 * 15,
      sameSite: "strict",
      httpOnly: true,
    });

    res.cookie("refreshToken", refreshToken, {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      sameSite: "strict",
      httpOnly: true,
    });

    // Remove password hash before sending response
    delete user.password;

    // Send success response
    return res.status(200).json({
      message: "Login successful",
      user,
    });
  } catch (err) {
    console.error("❌ loginUser error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

