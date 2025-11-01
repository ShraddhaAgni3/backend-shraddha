import express from "express";
//import { cloudinary } from "../config/cloudinaryConfig.js";
import {pool} from "../config/db.js";  
import { v2 as cloudinary } from "cloudinary";
//import db from "../config/db.js";
//import db from "../db.js";  // ✅ Add this line at the top

export  const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Cloudinary URL is automatically available in req.file.path
    return res.status(200).json({
      message: "Image uploaded successfully",
      imageUrl: req.file.path,
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// // Upload Profile Image
// export const uploadProfile = async (req, res) => {
//   try {
//     const { user_id } = req.body;

//     if (!req.file) {
//       return res.status(400).json({ message: "Please upload an image file" });
//     }

//     // Upload file buffer to Cloudinary
//     const uploadStream = cloudinary.uploader.upload_stream(
//       { folder: "profile_pics" },
//       async (error, result) => {
//         if (error) {
//           console.error("Cloudinary Upload Error:", error);
//           return res.status(500).json({ message: "Cloudinary upload failed" });
//         }

//         const imageUrl = result.secure_url;

//         // Save URL to database
//         const query = `
//           UPDATE users
//           SET image_url = $1, updated_at = NOW()
//           WHERE id = $2
//           RETURNING id, full_name, image_url;
//         `;
//         const values = [imageUrl, user_id];

//         const dbResult = await pool.query(query, values);

//         res.status(200).json({
//           message: "Profile image uploaded successfully",
//           user: dbResult.rows[0],
//         });
//       }
//     );

//     // Convert buffer to readable stream and pipe to Cloudinary
//     streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
//   } catch (error) {
//     console.error("Error in uploadProfile:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// export const uploadProfileImage = async (req, res) => {
//   try {
//     const { user_id } = req.body; // profile id to update

//     if (!req.file) {
//       return res.status(400).json({ message: "Please upload an image file" });
//     }

//     // Upload image to Cloudinary using stream
//     const uploadStream = cloudinary.uploader.upload_stream(
//       { folder: "profiles" },
//       async (error, result) => {
//         if (error) {
//           console.error("Cloudinary upload error:", error);
//           return res.status(500).json({ message: "Failed to upload image" });
//         }

//         const imageUrl = result.secure_url;

//         // Save image_url into profiles table
//         const query = `
//           UPDATE profiles
//           SET image_url = $1, updated_at = NOW()
//           WHERE id = $2
//           RETURNING id, name, image_url;
//         `;
//         const values = [imageUrl, user_id];

//         const dbRes = await pool.query(query, values);

//         if (dbRes.rows.length === 0) {
//           return res.status(404).json({ message: "Profile not found" });
//         }

//         res.status(200).json({
//           message: "Profile image uploaded successfully",
//           profile: dbRes.rows[0],
//         });
//       }
//     );

//     // Convert multer buffer into a readable stream for Cloudinary
//     streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
//   } catch (err) {
//     console.error("Error uploading profile image:", err);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };



// export const uploadProfile = async (req, res) => {
//   try {
//     const {
//       email,
//       full_name,
//       headline,
//       phone,
//       dob,
//       age,
//       education,
//       company,
//       experience,
//       gender,
//       marital_status,
//       address,
//       profession,
//       skills,
//       interests,
//       about,
//       city,
//       imageUrl // this comes from the Cloudinary upload
//     } = req.body;

//     // validation check
//     if (!email || !full_name || !dob || !age || !imageUrl) {
//       return res.status(400).json({ message: "Required fields missing" });
//     }

//     // SQL query to insert into profiles table
//     const insertQuery = `
//       INSERT INTO profiles (
//         email, full_name, headline, phone, dob, age, education, company,
//         experience, gender, marital_status, address, profession, skills,
//         interests, about, city, image_url, created_at
//       )
//       VALUES (
//         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
//         $11, $12, $13, $14, $15, $16, $17, $18, NOW()
//       )
//       RETURNING *;
//     `;

//     const values = [
//       email,
//       full_name,
//       headline,
//       phone,
//       dob,
//       age,
//       education,
//       company,
//       experience,
//       gender,
//       marital_status,
//       address,
//       profession,
//       skills,
//       interests,
//       about,
//       city,
//       imageUrl,
//     ];

//     const result = await pool.query(insertQuery, values);

//     res.status(201).json({
//       message: "Profile created successfully",
//       profile: result.rows[0],
//     });
//   } catch (error) {
//     console.error("Error inserting profile:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

// export const saveProfileImage = async (req, res) => {
//   try {
//     const { user_id, imageUrl } = req.body;

//     if (!user_id || !imageUrl) {
//       return res.status(400).json({ message: "user_id and imageUrl are required" });
//     }

//     // Check if profile exists
//     const checkQuery = `SELECT * FROM profiles WHERE user_id = $1`;
//     const checkResult = await pool.query(checkQuery, [user_id]);

//     if (checkResult.rows.length === 0) {
//       // If profile not found → insert new
//       const insertQuery = `
//         INSERT INTO profiles (user_id, image_url, created_at)
//         VALUES ($1, $2, NOW())
//         RETURNING *;
//       `;
//       const insertResult = await pool.query(insertQuery, [user_id, imageUrl]);
//       return res.status(201).json({
//         message: "Profile created and image URL saved successfully!",
//         profiles: insertResult.rows[0],
//       });
//     } else {
//       // If profile exists → update
//       const updateQuery = `
//         UPDATE profiles
//         SET image_url = $1, updated_at = NOW()
//         WHERE user_id = $2
//         RETURNING *;
//       `;
//       const updateResult = await pool.query(updateQuery, [imageUrl, user_id]);
//       return res.status(200).json({
//         message: "Profile image updated successfully!",
//         profiles: updateResult.rows[0],
//       });
//     }
//   } catch (error) {
//     console.error("Error saving image URL:", error);
//     res.status(500).json({ message: "Internal Server Error", error });
//   }
// };

// ✅ Update profile image and return full profile data
export const saveProfileImage = async (req, res) => {
  try {
    const { user_id, imageUrl } = req.body;

    if (!user_id || !imageUrl) {
      return res.status(400).json({ message: "user_id and imageUrl are required" });
    }

    // Step 1: Update image_url
    const updateQuery = `
      UPDATE profiles
      SET image_url = $1, updated_at = NOW()
      WHERE user_id = $2
      RETURNING id;
    `;
    const updateResult = await pool.query(updateQuery, [imageUrl, user_id]);

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // Step 2: Fetch full profile after update
    const fetchQuery = `
      SELECT *
      FROM profiles
      WHERE user_id = $1;
    `;
    const fetchResult = await pool.query(fetchQuery, [user_id]);

    res.status(200).json({
      message: "Profile image updated successfully!",
      profiles: fetchResult.rows[0], // ✅ full profile data
    });
  } catch (error) {
    console.error("Error saving image URL:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};




// ✅ Cloudinary config (agar pehle se nahi kiya)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Controller: Remove Profile Picture
export const removeProfilePicture = async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Step 1️⃣ - Get current image URL from DB
    const { rows } = await pool.query(
      "SELECT image_url FROM profiles WHERE user_id = $1",
      [user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const imageUrl = rows[0].image_url;

    if (!imageUrl) {
      return res.status(400).json({ message: "No profile picture to remove" });
    }

    // Step 2️⃣ - Extract Cloudinary public_id from image URL
    // Example: https://res.cloudinary.com/demo/image/upload/v1234567/abcxyz.jpg
    const parts = imageUrl.split("/");
    const publicIdWithExt = parts[parts.length - 1]; // abcxyz.jpg
    const publicId = publicIdWithExt.split(".")[0]; // abcxyz

    // Step 3️⃣ - Delete image from Cloudinary
    await cloudinary.uploader.destroy(publicId);

    // Step 4️⃣ - Update DB and remove image URL
    await pool.query(
      "UPDATE profiles SET image_url = NULL WHERE user_id = $1 RETURNING *",
      [user_id]
    );

    // Step 5️⃣ - Return success response
    res.status(200).json({
      
      message: "Profile picture removed successfully",
      image_url: null,
    });
  } catch (error) {
    console.error("❌ Error removing profile picture:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
