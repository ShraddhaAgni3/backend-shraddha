// import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";
// import dotenv from "dotenv";
// import { pool } from "../config/db.js";

// dotenv.config();

// // ---------------- Admin Login ----------------
// export const adminLogin = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const result = await pool.query("SELECT * FROM admins WHERE email=$1", [email]);
//     const admin = result.rows[0];

//     if (!admin) return res.status(404).json({ message: "Admin not found" });

//     const isMatch = await bcrypt.compare(password, admin.password);
//     if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

//     const token = jwt.sign(
//       { id: admin.id, email: admin.email, role: admin.role },
//       process.env.ADMIN_ACCESS_SECRET_KEY,
//       { expiresIn: "2h" }
//     );

//     return res.status(200).json({
//       status: "success",
//       message: "Admin logged in successfully",
//       token,
//       admin: {
//         id: admin.id,
//         full_name: admin.full_name,
//         email: admin.email,
//         role: admin.role,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Login failed", error: error.message });
//   }
// };

 





































// // export const saveAdmin = async (req,res) => {

// // let data = req.body;

// // data.password = await bcrypt.hash(data.password, 10);

// // const values =Object.values(data) ;

// // await pool.query('INSERT INTO admins (full_name, email, password, role) VALUES ($1, $2, $3, $4)',values);
// // }

