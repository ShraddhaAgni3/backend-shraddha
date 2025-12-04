import { pool } from "../config/db.js";
// 🟢 Update Profile and Email
export const updateProfile = async (req, res) => {
  try {
    const {
      email,
      first_name,
      last_name,
      headline,
      phone,
      dob,
      age,
      education,
      company,
      experience,
      gender,
      marital_status,
      address,
      profession,
      skills,
      interests,
      about,
      city,
      state,          // ✅ added
      country,
      pincode,
      company_type,
      position,
                      // ✅ added
     } = req.body;
     console.log("Body:", req.body);


    if (!email || !first_name || !last_name || !dob || !age) {
      return res.status(400).json({ message: "Email, First name, Last name, DOB and Age are required" });
    }

    const { id } = req.user;
    const imageUrl = req.file ? req.file.path : null;

    console.log("File:", req.file);


    const updateProfileQuery = `
      UPDATE profiles
      SET 
        first_name = $1,
        last_name = $2,
        phone = $3,
        gender = $4,
        marital_status = $5,
        address = $6,
        profession = $7,
        skills = $8,
        interests = $9,
        about = $10,
        city = $11,
        state = $12,              -- ✅ added
        country = $13,
        pincode = $14,
        headline = $15,
        dob = $16,
        age = $17,
        education = $18,
        company = $19,
        company_type = $20,       -- ✅ added
        experience = $21,
        position = $22,           -- ✅ added
        image_url = COALESCE($23, image_url),
        updated_at = NOW(),
        is_submitted = true
      WHERE user_id = $24
      
      RETURNING *;
    `;

    const profileValues = [
      first_name,
      last_name,
      phone,
      gender,
      marital_status,
      address,
      profession,
      JSON.stringify(skills),
      JSON.stringify(interests),
      about,
      city,
      state,             // ✅ added
      country,
      pincode,
      headline,
      dob,
      age,
      education,
      company,
      company_type,      // ✅ added
      experience,
      position,
      imageUrl,
      id
    ];

    const profileResult = await pool.query(updateProfileQuery, profileValues);

    if (!profileResult.rows.length) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const updateUserQuery = `
      UPDATE users
      SET email = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, email;
    `;
    const userResult = await pool.query(updateUserQuery, [email, id]);

    if (!userResult.rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

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
    const { id } = req.user;

    const userQuery = `
      SELECT id, email
      FROM users
      WHERE id = $1
    `;
    const userResult = await pool.query(userQuery, [id]);

    if (!userResult.rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    const profileQuery = `
      SELECT 
        first_name,
        last_name,
        phone,
        gender,
        marital_status,
        address,
        profession,
        skills,
        interests,
        about,
        city,
        country,
        pincode,
        headline,
        dob,
        age,
        education,
        company,
        experience,
        image_url,
        is_submitted,
        state,
        company_type,
        position,
        updated_at
      FROM profiles
      WHERE user_id = $1
    `;

    const profileResult = await pool.query(profileQuery, [id]);

    const user = userResult.rows[0];
    const profile = profileResult.rows.length ? profileResult.rows[0] : {};

    const combinedData = {
      user_id: user.id,
      email: user.email,
      first_name: profile.first_name || null,
      last_name: profile.last_name || null,
      profession: profile.profession || null,
      phone: profile.phone || null,
      gender: profile.gender || null,
      marital_status: profile.marital_status || null,
      address: profile.address || null,
      country: profile.country || null,
      pincode: profile.pincode || null,
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
      state: profile.state || null,
      company_type: profile.company_type || null,
      position: profile.position || null,
    };

    res.status(200).json({
      message: "Profile fetched successfully",
      data: combinedData,
    });

  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
