import { pool } from "../config/db.js";

export const updateProfile = async (req, res) => {
  try {
    const {
      user_id,
      email,        // new email to update in users table
      full_name,
      phone,
      gender,
      marital_status,
      address,
      profession,
      skills,
      interests,
      about,
      city
    } = req.body;

    // 1️⃣ Update users table
    const updateUserQuery = `
      UPDATE users
      SET email = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *;
    `;
    const userValues = [email, user_id];
    const userResult = await pool.query(updateUserQuery, userValues);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 2️⃣ Update profiles table
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
        is_submitted = $11,
        updated_at = NOW()
      WHERE user_id = $12
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
      true,
      user_id
    ];
    const profileResult = await pool.query(updateProfileQuery, profileValues);

    if (profileResult.rows.length === 0) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.status(200).json({
      message: 'Profile and email updated successfully',
      user: userResult.rows[0],
      profile: profileResult.rows[0]
    });

  } catch (error) {
    console.error('Error updating profile and email:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

