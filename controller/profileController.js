import { pool } from "../config/db.js";
// 🟢 Update Profile and Email
// export const updateProfile = async (req, res) => {
//   try {
//     const {
//       email,
//       first_name,
//       last_name,
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
//       state, // ✅ added
//       country,
//       pincode,
//       company_type,
//       position,
//       hobbies,
//       prompts, // ✅ added for questions and answers
//     } = req.body;
//     console.log("Body:", req.body);

//     if (!email || !first_name || !last_name || !dob || !age) {
//       return res
//         .status(400)
//         .json({
//           message: "Email, First name, Last name, DOB and Age are required",
//         });
//     }

//     const { id } = req.user;
//     const imageUrl = req.file ? req.file.path : null;

//     console.log("File:", req.file);

//     const updateProfileQuery = `
//       UPDATE profiles
//       SET
//         first_name = $1,
//         last_name = $2,
//         phone = $3,
//         gender = $4,
//         marital_status = $5,
//         address = $6,
//         profession = $7,
//         skills = $8,
//         interests = $9,
//         about = $10,
//         city = $11,
//         state = $12,              -- ✅ added
//         country = $13,
//         pincode = $14,
//         headline = $15,
//         dob = $16,
//         age = $17,
//         education = $18,
//         company = $19,
//         company_type = $20,       -- ✅ added
//         experience = $21,
//         position = $22,
//         hobbies = $23,                -- ✅ added
//         image_url = COALESCE($24, image_url),
//         updated_at = NOW(),
//         is_submitted = true
//       WHERE user_id = $25

//       RETURNING *;
//     `;

//     const profileValues = [
//       first_name,
//       last_name,
//       phone,
//       gender,
//       marital_status,
//       address,
//       profession,
//       JSON.stringify(skills),
//       JSON.stringify(interests),
//       about,
//       city,
//       state, // ✅ added
//       country,
//       pincode,
//       headline,
//       dob,
//       age,
//       education,
//       company,
//       company_type, // ✅ added
//       experience,
//       position,
//       JSON.stringify(hobbies),
//       imageUrl,
//       id,
//     ];

//     const profileResult = await pool.query(updateProfileQuery, profileValues);

//     if (!profileResult.rows.length) {
//       return res.status(404).json({ message: "Profile not found" });
//     }
//  //
//     let savedPrompts = [];
//     if (prompts && Object.keys(prompts || {}).length > 0) {
//       savedPrompts = await saveOrUpdateProfilePrompts(
//         profileResult.rows[0].id,
//         prompts
//       );
//     }
// //

//     const updateUserQuery = `
//       UPDATE users
//       SET email = $1, updated_at = NOW()
//       WHERE id = $2
//       RETURNING id, email;
//     `;
//     const userResult = await pool.query(updateUserQuery, [email, id]);

//     if (!userResult.rows.length) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const {
//       dob: removedDob,
//       age: removedAge,
//       ...safeProfile
//     } = profileResult.rows[0];

//     return res.status(200).json({
//       message: "Profile and email updated successfully",
//       user: userResult.rows[0],
//       profile: safeProfile,
//    //   prompts: savedPrompts
//     });
//   } catch (error) {
//     console.error("Error updating profile and email:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

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
      state,
      country,
      pincode,
      company_type,
      position,
      hobbies,
      professional_identity,
      interested_in,
      relationship_goal,
      children_preference,
      education_institution_name,
      languages_spoken,
      zodiac_sign,
      self_expression,
      freetime_style,
      health_activity_level,
      pets_preference,
      religious_belief,
      smoking,
      drinking,
      work_environment,
      interaction_style,
      work_rhythm,
      career_decision_style,
      work_demand_response,
      love_language_affection,
      preference_of_closeness,
      approach_to_physical_closeness,
      relationship_values,
      values_in_others,
      relationship_pace,
      height_ft,
      height_in,
      life_rhythms,
      ways_i_spend_time,
      prompts,
      about_me,
    } = req.body;

    if (!email || !first_name || !last_name || !dob || !age) {
      return res.status(400).json({
        message: "Email, First name, Last name, DOB and Age are required",
      });
    }

    const  userId  = req.user.id
    const imageUrl = req.file ? req.file.path : null;

    // HEIGHT LOGIC (ONLY ONE COLUMN)
    // =========================
    let height;

    if (height_ft !== undefined || height_in !== undefined) {
      if (height_ft === undefined || height_in === undefined) {
        return res.status(400).json({
          message: "Both height_ft and height_in are required",
        });
      }

      const ft = Number(height_ft);
      const inch = Number(height_in);

      if (Number.isNaN(ft) || Number.isNaN(inch) || inch < 0 || inch > 11) {
        return res.status(400).json({ message: "Invalid height" });
      }

      height = ft * 12 + inch;
    }

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
        state = $12,
        country = $13,
        pincode = $14,
        headline = $15,
        dob = $16,
        age = $17,
        education = $18,
        company = $19,
        company_type = $20,
        experience = $21,
        position = $22,
        hobbies = $23,
        professional_identity = $24,
        interested_in = $25,
        relationship_goal = $26,
        children_preference = $27,
        education_institution_name = $28,
        languages_spoken = $29,
        zodiac_sign = $30,
        self_expression = $31,
        freetime_style = $32,
        health_activity_level = $33,
        pets_preference = $34,
        religious_belief = $35,
        smoking = $36,
        drinking = $37,
        work_environment = $38,
        interaction_style = $39,
        work_rhythm = $40,
        career_decision_style = $41,
        work_demand_response = $42,
        love_language_affection = $43,
        preference_of_closeness = $44,
        approach_to_physical_closeness = $45,
        relationship_values = $46,
        values_in_others = $47,
        relationship_pace = $48,
        height = $49,
        life_rhythms = $50,
        about_me = $51,
        ways_i_spend_time = $52,
        image_url = COALESCE($53, image_url),
        updated_at = NOW(),
        is_submitted = true
      WHERE user_id = $54
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
      JSON.stringify(skills || {}),
      JSON.stringify(interests || {}),
      about,
      city,
      state,
      country,
      pincode,
      headline,
      dob,
      age,
      education,
      company,
      company_type,
      experience,
      position,
      JSON.stringify(hobbies || {}),
      professional_identity,
      interested_in,
      relationship_goal,
      children_preference,
      education_institution_name,
      languages_spoken, // text[] — pass as array
      zodiac_sign,
      self_expression,
      freetime_style,
      health_activity_level,
      pets_preference,
      religious_belief,
      smoking,
      drinking,
      work_environment,
      interaction_style,
      work_rhythm,
      career_decision_style,
      work_demand_response,
      love_language_affection, // enum — pass as enum string
      preference_of_closeness,
      approach_to_physical_closeness,
      relationship_values,
      values_in_others,
      relationship_pace,
      height,
      JSON.stringify(life_rhythms || {}),
      about_me,
      JSON.stringify(ways_i_spend_time || {}),
      imageUrl,
      userId,
    ];
    // console.log("height,",height);
    const profileResult = await pool.query(updateProfileQuery, profileValues);

    if (!profileResult.rows.length) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // let savedPrompts = [];
    // if (prompts && Object.keys(prompts || {}).length > 0) {
    //   savedPrompts = await saveOrUpdateProfilePrompts(
    //     profileResult.rows[0].id,
    //     prompts
    //   );
    // }

    let savedPrompts = [];
    if (
      prompts &&
      typeof prompts === "object" &&
      Object.keys(prompts).length > 0
    ) {
      savedPrompts = await saveOrUpdateProfilePrompts(
        profileResult.rows[0].id,
        prompts,
      );
    }

    const updateUserQuery = `
      UPDATE users
      SET email = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, email;
    `;
    const userResult = await pool.query(updateUserQuery, [email, userId]);

    if (!userResult.rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    // Optionally remove sensitive or unwanted fields from response
    const {
      dob: removedDob,
      age: removedAge,
      ...safeProfile
    } = profileResult.rows[0];

    const profileWithPrompts = {
      ...safeProfile,
      prompts: savedPrompts.reduce((acc, cur) => {
        acc[cur.question_key] = cur.answer;
        return acc;
      }, {}),
    };

    return res.status(200).json({
      message: "Profile and email updated successfully",
      user: userResult.rows[0],
      profile: profileWithPrompts,
      // prompts: savedPrompts, // Uncomment if you want to return saved prompts
    });
  } catch (error) {
    console.error("Error updating profile and email:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// // 🟢 Get Profile
// export const getProfile = async (req, res) => {
//   try {
//     const { id } = req.user;

//     const userQuery = `
//       SELECT id, email
//       FROM users
//       WHERE id = $1
//     `;
//     const userResult = await pool.query(userQuery, [id]);

//     if (!userResult.rows.length) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const profileQuery = `
//       SELECT
//         first_name,
//         last_name,
//         phone,
//         gender,
//         marital_status,
//         address,
//         profession,
//         skills,
//         interests,
//         hobbies,
//         about,
//         city,
//         country,
//         pincode,
//         headline,
//         dob,
//         age,
//         education,
//         company,
//         experience,
//         image_url,
//         is_submitted,
//         state,
//         company_type,
//         position,
//         updated_at
//       FROM profiles
//       WHERE user_id = $1
//     `;

//     const profileResult = await pool.query(profileQuery, [id]);

//     const user = userResult.rows[0];
//     const profile = profileResult.rows.length ? profileResult.rows[0] : {};

//     const combinedData = {
//       user_id: user.id,
//       email: user.email,
//       first_name: profile.first_name || null,
//       last_name: profile.last_name || null,
//       profession: profile.profession || null,
//       phone: profile.phone || null,
//       gender: profile.gender || null,
//       marital_status: profile.marital_status || null,
//       address: profile.address || null,
//       country: profile.country || null,
//       pincode: profile.pincode || null,
//       skills: profile.skills || null,
//       interests: profile.interests || null,
//       hobbies: profile.hobbies || null,
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
//       state: profile.state || null,
//       company_type: profile.company_type || null,
//       position: profile.position || null,
//     };

//     res.status(200).json({
//       message: "Profile fetched successfully",
//       data: combinedData,
//     });
//   } catch (error) {
//     console.error("Error fetching profile:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// 🟢 Get Profile
export const getProfile = async (req, res) => {
  try {
    const  userId  = req.user.id;

    const userQuery = `
      SELECT id, email
      FROM users
      WHERE id = $1
    `;
    const userResult = await pool.query(userQuery, [userId]);

    if (!userResult.rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    const profileQuery = `
      SELECT 
        id,
        first_name,
        last_name,
        phone,
        gender,
        marital_status,
        address,
        profession,
        skills,
        interests,
        hobbies,
        about,
        city,
        state,
        country,
        pincode,
        headline,
        dob,
        age,
        education,
        company,
        company_type,
        experience,
        position,
        professional_identity,
        interested_in,
        relationship_goal,
        children_preference,
        education_institution_name,
        languages_spoken,
        zodiac_sign,
        self_expression,
        freetime_style,
        health_activity_level,
        pets_preference,
        religious_belief,
        smoking,
        drinking,
        work_environment,
        interaction_style,
        work_rhythm,
        career_decision_style,
        work_demand_response,
        love_language_affection,
        preference_of_closeness,
        approach_to_physical_closeness,
        relationship_values,
        values_in_others,
        relationship_pace,
        height,
        life_rhythms,
        username,
        about_me,
        ways_i_spend_time,
        image_url,
        is_submitted,
        updated_at
      FROM profiles
      WHERE user_id = $1
    `;

    const profileResult = await pool.query(profileQuery, [userId]);

    const user = userResult.rows[0];
    const profile = profileResult.rows.length ? profileResult.rows[0] : {};

    // pull profile prompts (questions and answers)
    let prompts = {};

    if (profile && profile.id) {
      const promptsQuery = `
        SELECT question_key, answer
        FROM profile_prompts
        WHERE profile_id = $1
      `;

      const promptsResult = await pool.query(promptsQuery, [profile.id]);

      for (const row of promptsResult.rows) {
        prompts[row.question_key] = row.answer;
      }
    }

    const combinedData = {
      id: profile.id,
      user_id: user.id,
      email: user.email,
      first_name: profile.first_name || null,
      last_name: profile.last_name || null,
      profession: profile.profession || null,
      phone: profile.phone || null,
      gender: profile.gender || null,
      marital_status: profile.marital_status || null,
      address: profile.address || null,
      city: profile.city || null,
      state: profile.state || null,
      country: profile.country || null,
      pincode: profile.pincode || null,
      skills: profile.skills || null,
      interests: profile.interests || null,
      hobbies: profile.hobbies || null,
      about: profile.about || null,
      headline: profile.headline || null,
      dob: profile.dob || null,
      age: profile.age || null,
      education: profile.education || null,
      company: profile.company || null,
      company_type: profile.company_type || null,
      experience: profile.experience || null,
      position: profile.position || null,
      professional_identity: profile.professional_identity || null,
      interested_in: profile.interested_in || null,
      relationship_goal: profile.relationship_goal || null,
      children_preference: profile.children_preference || null,
      education_institution_name: profile.education_institution_name || null,
      languages_spoken: profile.languages_spoken || null,
      zodiac_sign: profile.zodiac_sign || null,
      self_expression: profile.self_expression || null,
      freetime_style: profile.freetime_style || null,
      health_activity_level: profile.health_activity_level || null,
      pets_preference: profile.pets_preference || null,
      religious_belief: profile.religious_belief || null,
      smoking: profile.smoking || null,
      drinking: profile.drinking || null,
      work_environment: profile.work_environment || null,
      interaction_style: profile.interaction_style || null,
      work_rhythm: profile.work_rhythm || null,
      career_decision_style: profile.career_decision_style || null,
      work_demand_response: profile.work_demand_response || null,
      love_language_affection: profile.love_language_affection || null,
      preference_of_closeness: profile.preference_of_closeness || null,
      approach_to_physical_closeness:
        profile.approach_to_physical_closeness || null,
      relationship_values: profile.relationship_values || null,
      values_in_others: profile.values_in_others || null,
      relationship_pace: profile.relationship_pace || null,
      height: profile.height || null,
      life_rhythms: profile.life_rhythms || null,
      ways_i_spend_time: profile.ways_i_spend_time || null,
      username: profile.username || null,
      about_me: profile.about_me || null,
      image_url: profile.image_url || null,
      is_submitted: profile.is_submitted || false,
      updated_at: profile.updated_at || null,
    };
    console.log("my profile data:", combinedData);
    res.status(200).json({
      message: "Profile fetched successfully",
      data: combinedData,
      prompts: prompts,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 🟢 Save or Update Profile Prompts (Questions and Answers)
//
// const saveOrUpdateProfilePrompts = async (profileId, prompts) => {
//   if (
//     !prompts ||
//     !prompts["question-key"] ||
//     typeof prompts["question-key"] !== "object"
//   ) {
//     return;
//   }

//   const promptEntries = prompts["question-key"]; // Avoid variable name conflict

//   const query = `
//     INSERT INTO profile_prompts (profile_id, question_key, answer)
//     VALUES ($1, $2, $3)
//     ON CONFLICT (profile_id, question_key)
//     DO UPDATE SET
//       answer = EXCLUDED.answer,
//       updated_at = NOW()
//       RETURNING profile_id, question_key, answer;
//   `;

//   const results = [];

//   for (const [question_key, answer] of Object.entries(promptEntries)) {
//     const { rows } = await pool.query(query, [
//       profileId,
//       question_key,
//       answer,
//     ]);
//     results.push(rows[0]);
//   }

//   return results;
const saveOrUpdateProfilePrompts = async (profileId, prompts) => {
  if (!prompts || typeof prompts !== "object") return [];

  const query = `
    INSERT INTO profile_prompts (profile_id, question_key, answer)
    VALUES ($1, $2, $3)
    ON CONFLICT (profile_id, question_key)
    DO UPDATE SET 
      answer = EXCLUDED.answer,
      updated_at = NOW()
    RETURNING profile_id, question_key, answer;
  `;

  const results = [];

  for (const [question_key, answer] of Object.entries(prompts)) {
    const { rows } = await pool.query(query, [profileId, question_key, answer]);
    results.push(rows[0]);
  }

  return results;
};

/* Example of prompts object:

"little_about_you": {
    "question-key" : {
         "small_habit": "I journal daily",
         "life_goal": "Build a peaceful life",
         "home_moment": "Sunday mornings with family"
    }
  }  */
