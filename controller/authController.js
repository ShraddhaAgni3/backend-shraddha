import { pool } from "../config/db.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { transporter } from "../mailer.js";
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
      !profession
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

    const userValues = [email, hashedPassword];

    const result = await pool.query(userQuery, userValues);

    console.log(result);

    const user_id = result.rows[0].id;

    const profileQuery = `INSERT INTO profiles (
    user_id,full_name,marital_status,
    profession,interests,is_submitted) 
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING id,user_id,full_name,marital_status,profession,interests,created_at`;

    const profileValues = [
      user_id,
      full_name,
      marital_status,
      profession,
      JSON.stringify(interests),
      true,
    ];
    const profileResult = await pool.query(profileQuery, profileValues);

    console.log(profileResult);
    const user = { profile_info: profileResult.rows[0] };
    user.email = result.rows[0].email;

    console.log(user);
    res.status(201).json({
      message: "User registered successfully!",
      user,
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
    const userQuery = `
      SELECT id, email, password
      FROM users
      WHERE email = $1
    `;
    const { rows } = await pool.query(userQuery, [email]);

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

    const profileQuery = `SELECT id,full_name,phone,gender,marital_status,
                        address , profession, skills, interests, about, city
                        FROM profiles WHERE user_id = $1`;

    const result = await pool.query(profileQuery,[user.id]);     
    
    const user_profile = result.rows[0];

    user_profile.email = user.email;

    // Create JWT payload
    const payload = {
      id: user_profile.id,
      user_id: user_profile.user_id,
      email: user_profile.email,
      phone: user_profile.phone,
      full_name: user_profile.full_name,
      profession: user_profile.profession,
      marital_status: user_profile.marital_status,
      address: user_profile.address,
      skills: user_profile.skills,
      interests: user_profile.interests,
      about: user_profile.about,
      city: user_profile.city
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
    // res.cookie("accessToken", accessToken, {
    //   maxAge: 1000 * 60 * 15,
    //   sameSite: "strict",
    //   httpOnly: true,
    // });

    // res.cookie("refreshToken", refreshToken, {
    //   maxAge: 1000 * 60 * 60 * 24 * 7,
    //   sameSite: "strict",
    //   httpOnly: true,
    // });

    // Send success response
    return res.status(200).json({
      message: "Login successful",
      user_profile,
      accessToken,
      refreshToken
    });
  } catch (err) {
    console.error("❌ loginUser error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}





export const forgotPassword=async (req, res) => {
   try {
    const { email } = req.body;
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (!user.rows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    // generate reset token (valid for 15 mins)
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "15m" });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      html: `
        <p>You requested to reset your password.</p>
        <p>Click below link to reset your password (valid for 15 minutes):</p>
        <a href="${resetLink}" target="_blank">${resetLink}</a>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "Password reset link sent to your email." });
  } catch (error) {
    console.error("Error sending reset link:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const resetPassword=async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query("UPDATE users SET password = $1 WHERE email = $2", [hashedPassword, email]);

    res.json({ message: "Password reset successful." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(400).json({ error: "Invalid or expired token." });
  }
};

