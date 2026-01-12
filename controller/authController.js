import { pool } from "../config/db.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { sendNotification } from "../server.js";
//import { sendEmail } from "../emailService.js";

dotenv.config();

// New code register
export const registerUser = async (req, res) => {
  try {
    let {
      first_name, // ✅ Changed from full_name
      last_name, // ✅ New field
      email,
      password,
      profession,
      username,
      about_me,
    } = req.body;

    // 🔹 Basic validation - UPDATED
    if (
      !first_name ||
      !last_name ||
      !email ||
      !password ||
      !profession ||
      !username ||
      !about_me
    ) {
      // return res.status(400).json({
      //   error:
      //     "Please fill all required fields including first name, last name, username, and about me.",
      // });
    }

    //
    // const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    // if (!usernameRegex.test(username)) {
    //   return res.status(400).json({
    //     error:
    //       "Username must be 3-30 characters and contain only letters, numbers, and underscores.",
    //   });
    // }
    //

    // Normalize username (Instagram behavior)
    username = username.trim().toLowerCase();

    // Reserved usernames (cannot be used)
    const reservedUsernames = [
      "admin",
      "support",
      "root",
      "system",
      "api",
      "help",
      "contact",
      "about",
    ];

    if (reservedUsernames.includes(username)) {
      return res.status(400).json({
        error: "This username is reserved. Please choose another.",
      });
    }

    // Instagram-style username regex
    const usernameRegex = /^(?!.*\.\.)(?!\.)(?!.*\.$)[a-z0-9._]{3,30}$/;

    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        error:
          "Username must be 3–30 characters, lowercase, and can contain letters, numbers, dots (.), or underscores (_). Dots cannot be consecutive or at the start/end.",
      });
    }

    // 🔹 Check if user already exists
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "User already exists." });
    }
    //

    // Check if username already taken
    const existingUsername = await pool.query(
      "SELECT 1 FROM profiles WHERE username = $1",
      [username]
    );
    if (existingUsername.rowCount > 0) {
      return res
        .status(400)
        .json({ error: "Username already taken. Please choose another." });
    }
    //

    // 🔹 Fetch approval configuration
    const configResult = await pool.query(
      "SELECT member_approval FROM configurations LIMIT 1"
    );
    const approval = configResult.rows[0]?.member_approval ?? 0;

    // 🔹 Decide user status based on configuration
    const userStatus = Number(approval) === 1 ? "Approve" : "In Process";

    // 🔹 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔹 Insert user
    const userQuery = `
      INSERT INTO users (email, password, status)
      VALUES ($1, $2, $3)
      RETURNING id, email, status, created_at;
    `;
    const userValues = [email, hashedPassword, userStatus];
    const result = await pool.query(userQuery, userValues);
    const user_id = result.rows[0].id;

    // 🔹 Insert profile - UPDATED
    const profileQuery = `
      INSERT INTO profiles (
        user_id, first_name, last_name,username,about_me,
        profession,is_submitted
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, user_id, first_name,last_name,username,about_me,profession,created_at;
    `;
    const profileValues = [
      user_id,
      first_name, // ✅ New
      last_name, // ✅ New
      username,
      about_me,
      profession,
      true,
    ];
    const profileResult = await pool.query(profileQuery, profileValues);

    const user = {
      email: result.rows[0].email,
      status: result.rows[0].status,
      profile_info: profileResult.rows[0], // ✅ Automatically includes first_name, last_name
    };

    // 🔹 Create payload for tokens - UPDATED
    // const payload = {
    //   user_id,
    //   email: user.email,
    //   first_name: profileResult.rows[0].first_name, // ✅ Changed
    //   last_name: profileResult.rows[0].last_name, // ✅ New
    //   profession: profileResult.rows[0].profession,
    //   username: profileResult.rows[0].username,
    //   about_me: profileResult.rows[0].about_me,
    //   status: user.status,
    // };

    // const access_secret_key = process.env.ACCESS_SECRET_KEY;
    // const refresh_secret_key = process.env.REFRESH_SECRET_KEY;

    // const accessToken = jwt.sign(payload, access_secret_key, {
    //   expiresIn: "15m",
    // });
    // const refreshToken = jwt.sign(payload, refresh_secret_key, {
    //   expiresIn: "7d",
    // });

    // 🔹 Send user notification
    await sendNotification(
      user_id,
      "Registration Successful",
      Number(approval) === 1
        ? "You have been auto-approved. Welcome!"
        : "You have successfully registered. Please wait for admin approval."
    );

    // ✅ Send final response
    res.status(201).json({
      message: "User registered successfully!",
      user,
      // accessToken,
      // refreshToken,
    });
  } catch (error) {
    console.error("Error registering user:", error);

    if (error.code === "23505") {
      return res
        .status(400)
        .json({ error: "Username already taken. Please choose another." });
    }

    res.status(500).json({ error: "Internal server error." });
  }
};

// // for login User-----------------------------------------**

export async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const userQuery = `SELECT id, email, password, status FROM users WHERE email = $1`;
    const { rows } = await pool.query(userQuery, [email]);

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid email" });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid Password" });
    }

    const profileQuery = `
      SELECT id, user_id, first_name, last_name, profession, username, about_me
      FROM profiles
      WHERE user_id = $1
    `;
    const result = await pool.query(profileQuery, [user.id]);
    const user_profile = result.rows[0];

    if (!user_profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    user_profile.email = user.email;

    const payload = {
      id: user.id,
      user_id: user_profile.user_id,
      email: user_profile.email,
      phone: user_profile.phone,
      first_name: user_profile.first_name, // full_name -> first_name
      last_name: user_profile.last_name, //  New field
      profession: user_profile.profession,
      username: user_profile.username,
      about_me: user_profile.about_me,
      status: user.status,
    };

    const access_secret_key = process.env.ACCESS_SECRET_KEY;
    const refresh_secret_key = process.env.REFRESH_SECRET_KEY;

    const accessToken = jwt.sign(payload, access_secret_key, {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign(payload, refresh_secret_key, {
      expiresIn: "7d",
    });

    return res.status(200).json({
      message: "Login successful",
      user_profile: {
        ...user_profile,
        // ✅ first_name and last_name automatically included
      },
      status: user.status,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error("❌ loginUser error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

// Forgot Password

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (!user.rows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    await sendEmail({
      to: email,
      subject: "Password Reset Request",
      html: `
        <p>You requested a password reset.</p>
        <p>Click the link below to reset your password (valid for 15 minutes):</p>
        <a href="${resetLink}" target="_blank">${resetLink}</a>
      `,
    });

    res.json({ message: "Password reset link sent to your email." });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query("UPDATE users SET password = $1 WHERE email = $2", [
      hashedPassword,
      email,
    ]);

    res.json({ message: "Password reset successful." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(400).json({ error: "Invalid or expired token." });
  }
};
