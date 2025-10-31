// import { pool } from "../config/db.js";

// // Update Profile and Email
// export const updateProfile = async (req, res) => {
//   try {
//     const {
//       email, full_name, headline, phone, dob, age, education,
//       company, experience, gender, marital_status, address,
//       profession, skills, interests, about, city
//     } = req.body;

//     if (!email || !full_name || !dob || !age) {
//       return res.status(400).json({ message: "Email, Full name, DOB and Age are required" });
//     }

//     const { id } = req.user;

//     const imageUrl = req.file ? req.file.path : null;

//     const updateProfileQuery = `
//       UPDATE profiles
//       SET 
//         full_name = $1,
//         phone = $2,
//         gender = $3,
//         marital_status = $4,
//         address = $5,
//         profession = $6,
//         skills = $7,
//         interests = $8,
//         about = $9,
//         city = $10,
//         headline = $11,
//         dob = $12,
//         age = $13,
//         education = $14,
//         company = $15,
//         experience = $16,
//         updated_at = NOW(),
//         is_submitted = true,
//       WHERE user_id = $17,
//       image_url = COALESCE($18, image_url),
//       RETURNING *;
//     `;

//     const profileValues = [
//       full_name,
//       phone,
//       gender,
//       marital_status,
//       address,
//       profession,
//       JSON.stringify(skills),
//       JSON.stringify(interests),
//       about,
//       city,
//       headline,
//       dob,
//       age,
//       education,
//       company,
//       experience,
//       imageUrl,
//       id
//     ];

//     const profileResult = await pool.query(updateProfileQuery, profileValues);

//     if (profileResult.rows.length === 0) {
//       return res.status(404).json({ message: "Profile not found" });
//     }

//     const updateUserQuery = `
//       UPDATE users
//       SET email = $1, updated_at = NOW()
//       WHERE id = $2
//       RETURNING id, email;
//     `;
//     const userResult = await pool.query(updateUserQuery, [email, id]);

//     if (userResult.rows.length === 0) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Exclude DOB and age if you want
//     const { dob: removedDob, age: removedAge, ...safeProfile } = profileResult.rows[0];

//     return res.status(200).json({
//       message: "Profile and email updated successfully",
//       user: userResult.rows[0],
//       profile: safeProfile
//     });

//   } catch (error) {
//     console.error("Error updating profile and email:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };


// // Get Profile
// export const getProfile = async (req, res) => {
//   try {
//     const { id } = req.user; // middleware se mila (validateAccessToken)
//     console.log("Fetching profile for user id:", id);

//     // 1️⃣ Check if user exists in users table
//     const userQuery = `
//       SELECT id, email
//       FROM users
//       WHERE id = $1
//     `;
//     const userResult = await pool.query(userQuery, [id]);
//     if (userResult.rows.length === 0) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // 2️⃣ Fetch profile details from profiles table using user_id
//     const profileQuery = `
//       SELECT 
//         full_name,
//         phone,
//         gender,
//         marital_status,
//         address,
//         profession,
//         skills,
//         interests,
//         about,
//         city,
//         headline,
//         dob,
//         age,
//         education,
//         company,
//         experience,
//         image_url,
//         is_submitted,
//         updated_at
//       FROM profiles
//       WHERE user_id = $1
//     `;
//     const profileResult = await pool.query(profileQuery, [id]);
         
//     const user = userResult.rows[0];
//     console.log("User found:", user,);
//     const profile = profileResult.rows.length > 0 ? profileResult.rows[0] : {};

//     // 3️⃣ Merge user + profile details
//     const combinedData = {
//       user_id: user.id,
//       email: user.email,
//       full_name: profile.full_name || null,
//       profession: profile.profession || null,
//       phone: profile.phone || null,
//       gender: profile.gender || null,
//       marital_status: profile.marital_status || null,
//       address: profile.address || null,
//       skills: profile.skills || null,
//       interests: profile.interests || null,
//       about: profile.about || null,
//       city: profile.city || null,
//       headline: profile.headline || null,
//       dob: profile.dob || null,
//       age: profile.age || null,
//       education: profile.education || null,
//       company: profile.company || null,
//       experience: profile.experience || null,
//       is_submitted: profile.is_submitted || false,
//       updated_at: profile.updated_at || null,
//       image_url: profile.image_url || null,

//     };
//          console.log("error",  combinedData);
//     // 4️⃣ Send response
//     res.status(200).json({
//       message: "Profile fetched successfully",
//       data: combinedData,
//     });

//   } catch (error) {
//     console.error("Error fetching profile:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };


import { pool } from "../config/db.js";

// 🟢 Update Profile and Email
export const updateProfile = async (req, res) => {
  try {
    const {
      email, full_name, headline, phone, dob, age, education,
      company, experience, gender, marital_status, address,
      profession, skills, interests, about, city
    } = req.body;

    if (!email || !full_name || !dob || !age) {
      return res.status(400).json({ message: "Email, Full name, DOB and Age are required" });
    }

    const { id } = req.user; // user_id from auth middleware
    const imageUrl = req.file ? req.file.path : null; // Cloudinary image URL (if uploaded)

    // ✅ Fixed SQL query (correct placement of image_url)
    const updateProfileQuery = `
      UPDATE profiles
      SET 
        full_name = $1,
        phone = $2,
        gender = $3,
        marital_status = $4,
        address = $5,
        profession = $6,
        skills = $7,
        interests = $8,
        about = $9,
        city = $10,
        headline = $11,
        dob = $12,
        age = $13,
        education = $14,
        company = $15,
        experience = $16,
        image_url = COALESCE($17, image_url),
        updated_at = NOW(),
        is_submitted = true
      WHERE user_id = $18
      RETURNING *;
    `;

    const profileValues = [
      full_name,
      phone,
      gender,
      marital_status,
      address,
      profession,
      JSON.stringify(skills),
      JSON.stringify(interests),
      about,
      city,
      headline,
      dob,
      age,
      education,
      company,
      experience,
      imageUrl, // $17
      id        // $18
    ];

    const profileResult = await pool.query(updateProfileQuery, profileValues);

    if (profileResult.rows.length === 0) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // 🟢 Update Email in users table
    const updateUserQuery = `
      UPDATE users
      SET email = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, email;
    `;
    const userResult = await pool.query(updateUserQuery, [email, id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Optionally exclude dob and age from response
    const { dob: removedDob, age: removedAge, ...safeProfile } = profileResult.rows[0];

    return res.status(200).json({
      message: "Profile and email updated successfully",
      user: userResult.rows[0],
      profile: safeProfile
    });

  } catch (error) {
    console.error("Error updating profile and email:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 🟢 Get Profile
export const getProfile = async (req, res) => {
  try {
    const { id } = req.user; // from auth middleware
    console.log("Fetching profile for user id:", id);

    // 1️⃣ Fetch user data
    const userQuery = `
      SELECT id, email
      FROM users
      WHERE id = $1
    `;
    const userResult = await pool.query(userQuery, [id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2️⃣ Fetch profile data
    const profileQuery = `
      SELECT 
        full_name,
        phone,
        gender,
        marital_status,
        address,
        profession,
        skills,
        interests,
        about,
        city,
        headline,
        dob,
        age,
        education,
        company,
        experience,
        image_url,
        is_submitted,
        updated_at
      FROM profiles
      WHERE user_id = $1
    `;
    const profileResult = await pool.query(profileQuery, [id]);

    const user = userResult.rows[0];
    const profile = profileResult.rows.length > 0 ? profileResult.rows[0] : {};

    // 3️⃣ Combine user + profile data
    const combinedData = {
      user_id: user.id,
      email: user.email,
      full_name: profile.full_name || null,
      profession: profile.profession || null,
      phone: profile.phone || null,
      gender: profile.gender || null,
      marital_status: profile.marital_status || null,
      address: profile.address || null,
      skills: profile.skills || null,
      interests: profile.interests || null,
      about: profile.about || null,
      city: profile.city || null,
      headline: profile.headline || null,
      dob: profile.dob || null,
      age: profile.age || null,
      education: profile.education || null,
      company: profile.company || null,
      experience: profile.experience || null,
      is_submitted: profile.is_submitted || false,
      updated_at: profile.updated_at || null,
      image_url: profile.image_url || null,
    };

    console.log("Profile fetched:", combinedData);

    // 4️⃣ Send final response
    res.status(200).json({
      message: "Profile fetched successfully",
      data: combinedData,
    });

  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
