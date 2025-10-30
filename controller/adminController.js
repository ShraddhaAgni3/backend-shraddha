import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { pool } from "../config/db.js";
import { sendNotification } from "../server.js";
dotenv.config();

// ---------------- Admin Login ----------------
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query("SELECT * FROM admins WHERE email=$1", [email]);
    const admin = result.rows[0];

    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      process.env.ACCESS_SECRET_KEY,
      { expiresIn: "2h" }
    );

    return res.status(200).json({
      status: "success",
      message: "Admin logged in successfully",
      token,
      admin: {
        id: admin.id,
        full_name: admin.full_name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

// //  Approve User
// export const approveUser=async(req,res)=>{
//   const approvedUser=req.body;
  
//     const updateQuery=`UPDATE users SET status='Approve', approved_by=$1, updated_at=NOW() WHERE id=$2 RETURNING *`;
//     const values=[approvedUser.approved_by,approvedUser.id];
//     try{
//       const result=await pool.query(updateQuery,values);
//       if(result.rows.length===0){
//         return res.status(404).json({message:"User not found"});
//       }
//       const {reason, ...userWithoutReason}=result.rows[0];
//       return res.status(200).json({
//         status: "success",
//         message: "User approved successfully",
//         user: userWithoutReason,
//       });
//     }catch(error){
//       console.error("Error approving user:",error);
//       return res.status(500).json({message:"Internal server error"});
//     }
  
// }
// //  Put User On Hold
// export const onHoldUser = async (req, res) => {
//   try {
//     const { user_id, reason } = req.body;

//     // 🔸 Validate required field
//     if (!user_id) {
//       return res.status(400).json({
//         message: "user_id is required",
//       });
//     }

//     // 🔸 Update user status to on_hold
//     const updateQuery = `
//       UPDATE users
//       SET status = 'On Hold',
//           reason = $1,
//           updated_at = NOW()
//       WHERE id = $2::integer
//       RETURNING id, status, reason, updated_at
//     `;

//     // Only two parameters match $1 and $2
//     const values = [reason || null, user_id];

//     const result = await pool.query(updateQuery, values);

//     // 🔸 Handle if user not found
//     if (result.rows.length === 0) {
//       return res.status(404).json({
//         message: "User not found",
//       });
//     }

//     // 🔸 Success response
//     return res.status(200).json({
      
//       message: "User placed on hold",
//       user: result.rows[0],
//     });
//   } catch (error) {
//     console.error("Error placing user on hold:", error);
//     return res.status(500).json({
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };

// //  Deactivate User
// export const deactivateUser = async (req, res) => {

//   try {
//     const { user_id, reason } = req.body;

//     // 🔹 Validate required fields
//     if (!user_id) {
//       return res.status(400).json({
//         message: "user_id is required",
//       });
//     }

//     // 🔹 Update user status to 'deactivate'
//     const updateQuery = `
//       UPDATE users
//       SET status = 'Deactivate',
//           reason = $1
//       WHERE id = $2::integer
//       RETURNING id, status, reason
//     `;

//     const values = [reason || null, user_id];
//     const result = await pool.query(updateQuery, values);

//     // 🔹 If no user found
//     if (result.rows.length === 0) {
//       return res.status(404).json({
//         message: "User not found",
//       });
//     }

//     // 🔹 Success response
//     return res.status(200).json({
//       status: "success",
//       message: "User deactivate successfully",
//       user: result.rows[0],
//     });
//   } catch (error) {
//     console.error("Error deactivating user:", error);
//     return res.status(500).json({
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };





//  Approve User
export const approveUser = async (req, res) => {
  const approvedUser = req.body;

  const updateQuery = `UPDATE users SET status='Approve', approved_by=$1, updated_at=NOW() WHERE id=$2 RETURNING *`;
  const values = [approvedUser.approved_by, approvedUser.id];
  try {
    const result = await pool.query(updateQuery, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const { reason, ...userWithoutReason } = result.rows[0];

    // ✅ Send notification
    await sendNotification(
      approvedUser.id,
      "Account Approved",
      "Your account has been approved by the admin."
    );

    return res.status(200).json({
      status: "success",
      message: "User approved successfully",
      user: userWithoutReason,
    });
  } catch (error) {
    console.error("Error approving user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//  Put User On Hold
export const onHoldUser = async (req, res) => {
  try {
    const { user_id, reason } = req.body;
    if (!user_id) {
      return res.status(400).json({ message: "user_id is required" });
    }

    const updateQuery = `
      UPDATE users
      SET status = 'On Hold',
          reason = $1,
          updated_at = NOW()
      WHERE id = $2::integer
      RETURNING id, status, reason, updated_at
    `;
    const values = [reason || null, user_id];
    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Send notification
    await sendNotification(
      user_id,
      "Account On Hold",
      `Your account has been put on hold. Reason: ${reason || "Not specified"}`
    );

    return res.status(200).json({
      message: "User placed on hold",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Error placing user on hold:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

//  Deactivate User
export const deactivateUser = async (req, res) => {
  try {
    const { user_id, reason } = req.body;
    if (!user_id) {
      return res.status(400).json({ message: "user_id is required" });
    }

    const updateQuery = `
      UPDATE users
      SET status = 'Deactivate',
          reason = $1
      WHERE id = $2::integer
      RETURNING id, status, reason
    `;
    const values = [reason || null, user_id];
    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Send notification
    await sendNotification(
      user_id,
      "Account Deactivated",
      `Your account has been deactivated. Reason: ${reason || "Not specified"}`
    );

    return res.status(200).json({
      status: "success",
      message: "User deactivate successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Error deactivating user:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};








// ✅ controllers/adminController.js
export const getAllUsers = async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id,
        u.email,
        u.password,
        u.status,
        u.created_at,
        u.updated_at,
        p.full_name,
        p.profession
      FROM users u
      LEFT JOIN profiles p
      ON u.id = p.user_id
      ORDER BY u.created_at DESC;
    `;

    const { rows: usersList } = await pool.query(query);

    const users = usersList.map((user) => ({
      id: user.id,
      full_name: user.full_name || null,
      email: user.email,
      password: user.password,
      profession: user.profession || null,
      status: user.status ? user.status.toLowerCase() : "in process",
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    }));

    return res.status(200).json({
      status: "success",
      message: "Users fetched successfully",
      users,
    });

  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};




// ✅ Get Specific User Details by ID
export const getAllUserDetails = async (req, res) => {
  try {
    const { id } = req.params; // URL se user id
    if (!id) {
      return res.status(400).json({
        status: "error",
        message: "User ID is required",
      });
    }

    const query = `
      SELECT 
        u.id AS user_id,
        u.email,
        u.password,
        u.status AS current_status,
        u.created_at AS registration_date,
        p.full_name,
        p.phone,
        p.gender,
        p.marital_status,
        p.address,
        p.profession,
        p.skills,
        p.interests,
        p.about,
        p.city,
        p.headline,
        p.dob,
        p.age,
        p.education,
        p.company,
        p.experience,
        p.is_submitted,
        p.updated_at
      FROM users u
      LEFT JOIN profiles p
      ON u.id = p.user_id
      WHERE u.id = $1
      ORDER BY u.created_at DESC;
    `;

    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Detailed user profile fetched successfully",
      user: rows[0],
    });

  } catch (error) {
    console.error("Error fetching user details:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch detailed profiles",
      error: error.message,
    });
  }
};












// // export const saveAdmin = async (req,res) => {

// // let data = req.body;

// // data.password = await bcrypt.hash(data.password, 10);

// // const values =Object.values(data) ;

// // await pool.query('INSERT INTO admins (full_name, email, password, role) VALUES ($1, $2, $3, $4)',values);
// // }

