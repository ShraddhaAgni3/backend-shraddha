// import { pool } from "../config/db.js";

// // Helper to find common elements between two arrays
// function intersect(arr1, arr2) {
//     return arr1.filter((x) => arr2.includes(x));
// }

// export const getUserMatches = async (req, res) => {
//     const userId = req.params.userId;

//     try {
//         // Get the main user
//         const userResult = await pool.query("SELECT * FROM profiles WHERE profiles.user_id = $1", [userId]);
//         const user = userResult.rows[0];
//         if (!user) return res.status(404).json({ message: "User not found" });

//         // Convert fields safely to arrays
//         const toArray = (field) => {
//             if (!field) return [];
//             if (Array.isArray(field)) return field;
//             try {
//                 return JSON.parse(field);
//             } catch {
//                 return [];
//             }
//         };

//         const interestsArr = toArray(user.interests);
//         const skillsArr = toArray(user.skills);
//         const hobbiesArr = toArray(user.hobbies);

//         // Fetch all other users
//         const allUsersResult = await pool.query("SELECT * FROM profiles WHERE user_id != $1", [userId]);
//         const allUsers = allUsersResult.rows;

//         // Calculate match scores
//         const matches = allUsers.map((u) => {
//             const uInterests = toArray(u.interests);
//             const uSkills = toArray(u.skills);
//             const uHobbies = toArray(u.hobbies);

//             let score = 0;

//             if (user.country && user.country === u.country) score += 3;
//             if (user.state && user.state === u.state) score += 2;
//             if (user.city && user.city === u.city) score += 2;
//             if (user.education && user.education === u.education) score += 2;
//             if (user.profession && user.profession === u.profession) score += 2;
//             if (user.company && user.company === u.company) score += 1;

//             if (intersect(interestsArr, uInterests).length > 0) score += 3;
//             if (intersect(skillsArr, uSkills).length > 0) score += 3;
//             if (intersect(hobbiesArr, uHobbies).length > 0) score += 2;

//             return { ...u, match_score: score };
//         });

//         // Sort by best match
//         matches.sort((a, b) => b.match_score - a.match_score);

//         // Return top 10
//         return res.status(200).json(matches)
//     } catch (err) {
//         console.error("Error in getUserMatches:", err);
//         return res.status(500).json({ message: "Server error" });
//     }
// };







// import { pool } from "../config/db.js";

// // Helper: safely convert JSON or arrays
// function toArray(field) {
//     if (!field) return [];
//     if (Array.isArray(field)) return field;
//     try {
//         return JSON.parse(field);
//     } catch {
//         return [];
//     }
// }

// // Helper: find common elements
// function intersect(arr1, arr2) {
//     return arr1.filter((x) => arr2.includes(x));
// }

// export const getUserMatches = async (req, res) => {
//     const userId = req.params.userId;

//     try {
//         // 1 Fetch the logged-in user's profile
//         const userResult = await pool.query(
//             `SELECT * FROM profiles WHERE user_id = $1`,
//             [userId]
//         );
//         const user = userResult.rows[0];
//         if (!user) return res.status(404).json({ message: "User not found" });

//         // 2 Parse relevant array/JSON fields
//         const userInterests = toArray(user.interests);
//         const userHobbies = toArray(user.hobbies);
//         const userSkills = toArray(user.skills);
//         const userLanguages = toArray(user.languages_spoken);
//         const userLoveLanguages = toArray(user.love_language_affection);

//         // 3 Fetch all other active user profiles
//         const allUsersResult = await pool.query(
//             `SELECT user_id, username, first_name, last_name, gender, age, city, state, country, profession, 
//               education, company, interests, hobbies, skills, languages_spoken, love_language_affection, 
//               relationship_goal, relationship_values, preference_of_closeness, 
//               approach_to_physical_closeness, pets_preference, religious_belief, 
//               smoking, drinking, image_url 
//        FROM profiles 
//        WHERE user_id != $1 AND is_active = true`,
//             [userId]
//         );

//         const allUsers = allUsersResult.rows;

//         // 4 Calculate match scores
//         const matches = allUsers.map((u) => {
//             const uInterests = toArray(u.interests);
//             const uHobbies = toArray(u.hobbies);
//             const uSkills = toArray(u.skills);
//             const uLanguages = toArray(u.languages_spoken);
//             const uLoveLanguages = toArray(u.love_language_affection);

//             let score = 0;

//             // 🌍 Location match (name-based only)
//             if (user.country && user.country === u.country) score += 2;
//             if (user.state && user.state === u.state) score += 2;
//             if (user.city && user.city === u.city) score += 2;

//             // 💼 Professional & Education compatibility
//             if (user.profession && user.profession === u.profession) score += 3;
//             if (user.education && user.education === u.education) score += 2;
//             if (user.company && user.company === u.company) score += 1;
//             if (intersect(userSkills, uSkills).length > 0) score += 2;

//             // 💬 Interests & Hobbies
//             if (intersect(userInterests, uInterests).length > 0) score += 3;
//             if (intersect(userHobbies, uHobbies).length > 0) score += 2;
//             if (intersect(userLanguages, uLanguages).length > 0) score += 1;
//             if (intersect(userLoveLanguages, uLoveLanguages).length > 0) score += 1;

//             // ❤️ Relationship & Lifestyle preferences
//             if (
//                 user.relationship_goal &&
//                 user.relationship_goal === u.relationship_goal
//             )
//                 score += 2;
//             if (
//                 user.relationship_values &&
//                 user.relationship_values === u.relationship_values
//             )
//                 score += 2;
//             if (
//                 user.preference_of_closeness &&
//                 user.preference_of_closeness === u.preference_of_closeness
//             )
//                 score += 1;
//             if (
//                 user.approach_to_physical_closeness &&
//                 user.approach_to_physical_closeness === u.approach_to_physical_closeness
//             )
//                 score += 1;
//             if (user.religious_belief && user.religious_belief === u.religious_belief)
//                 score += 1;
//             if (user.pets_preference && user.pets_preference === u.pets_preference)
//                 score += 1;
//             if (user.smoking && user.smoking === u.smoking) score += 1;
//             if (user.drinking && user.drinking === u.drinking) score += 1;

//             // Return summarized match info
//             return {
//                 user_id: u.user_id,
//                 username: u.username,
//                 full_name:
//                     u.first_name && u.last_name
//                         ? `${u.first_name} ${u.last_name}`
//                         : u.username,
//                 gender: u.gender,
//                 age: u.age,
//                 city: u.city,
//                 state: u.state,
//                 country: u.country,
//                 profession: u.profession,
//                 education: u.education,
//                 image_url: u.image_url,
//                 match_score: score,
//             };
//         });

//         // 5 Keep only relevant matches (score ≥ 7)
//         const relevantMatches = matches.filter((m) => m.match_score >= 7);

//         // 6 Sort descending by match score
//         relevantMatches.sort((a, b) => b.match_score - a.match_score);

//         // 7 Return final suggestions
//         return res.status(200).json({
//             totalRelevantMatches: relevantMatches.length,
//             suggestedMatches: relevantMatches,
//         });
//     } catch (err) {
//         console.error("Error in getUserMatches:", err);
//         return res.status(500).json({ message: "Server error" });
//     }
// };





import { pool } from "../config/db.js";

/* ---------- Helpers ---------- */

// Safely convert JSON / arrays / objects to arrays
function toArray(field) {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    if (typeof field === "object" && field !== null) return Object.values(field);
    try {
        const parsed = JSON.parse(field);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

// Safely find common elements between two arrays
function intersect(arr1, arr2) {
    if (!Array.isArray(arr1) || !Array.isArray(arr2)) return [];
    return arr1.filter((x) => arr2.includes(x));
}

/* ---------- Controller ---------- */

export const getUserMatches = async (req, res) => {
    const userId = req.params.userId;

    try {
        // 1️⃣ Fetch logged-in user profile
        const userResult = await pool.query(
            `SELECT * FROM profiles WHERE user_id = $1`,
            [userId]
        );
        const user = userResult.rows[0];
        if (!user) return res.status(404).json({ message: "User not found" });

        // 2️⃣ Parse array/JSON fields
        const userInterests = toArray(user.interests);
        const userHobbies = toArray(user.hobbies);
        const userSkills = toArray(user.skills);
        const userLanguages = toArray(user.languages_spoken);
        const userLoveLanguages = toArray(user.love_language_affection);

        // 3️⃣ Fetch all other active profiles
        const allUsersResult = await pool.query(
            `SELECT user_id, username, first_name, last_name, gender, age, city, state, country,
              profession, education, company, interests, hobbies, skills,
              languages_spoken, love_language_affection, relationship_goal, relationship_values,
              preference_of_closeness, approach_to_physical_closeness, pets_preference,
              religious_belief, smoking, drinking, image_url
       FROM profiles
       WHERE user_id != $1 AND is_active = true`,
            [userId]
        );

        const allUsers = allUsersResult.rows;

        // 4️⃣ Calculate match scores
        const matches = allUsers.map((u) => {
            const uInterests = toArray(u.interests);
            const uHobbies = toArray(u.hobbies);
            const uSkills = toArray(u.skills);
            const uLanguages = toArray(u.languages_spoken);
            const uLoveLanguages = toArray(u.love_language_affection);

            let score = 0;

            /* 🌍 Location */
            if (user.country && user.country === u.country) score += 2;
            if (user.state && user.state === u.state) score += 2;
            if (user.city && user.city === u.city) score += 2;

            /* 💼 Professional / Education */
            if (user.profession && user.profession === u.profession) score += 3;
            if (user.education && user.education === u.education) score += 2;
            if (user.company && user.company === u.company) score += 1;
            if (intersect(userSkills, uSkills).length > 0) score += 2;

            /* 💬 Interests / Hobbies */
            if (intersect(userInterests, uInterests).length > 0) score += 3;
            if (intersect(userHobbies, uHobbies).length > 0) score += 2;
            if (intersect(userLanguages, uLanguages).length > 0) score += 1;
            if (intersect(userLoveLanguages, uLoveLanguages).length > 0) score += 1;

            /* ❤️ Relationship & Lifestyle */
            if (user.relationship_goal && user.relationship_goal === u.relationship_goal)
                score += 2;
            if (user.relationship_values && user.relationship_values === u.relationship_values)
                score += 2;
            if (user.preference_of_closeness && user.preference_of_closeness === u.preference_of_closeness)
                score += 1;
            if (user.approach_to_physical_closeness && user.approach_to_physical_closeness === u.approach_to_physical_closeness)
                score += 1;
            if (user.religious_belief && user.religious_belief === u.religious_belief)
                score += 1;
            if (user.pets_preference && user.pets_preference === u.pets_preference)
                score += 1;
            if (user.smoking && user.smoking === u.smoking) score += 1;
            if (user.drinking && user.drinking === u.drinking) score += 1;

            return {
                user_id: u.user_id,
                username: u.username,
                full_name:
                    u.first_name && u.last_name
                        ? `${u.first_name} ${u.last_name}`
                        : u.username,
                gender: u.gender,
                age: u.age,
                city: u.city,
                state: u.state,
                country: u.country,
                profession: u.profession,
                education: u.education,
                image_url: u.image_url,
                match_score: score,
            };
        });

        // 5️⃣ Filter relevant matches (score ≥ 7)
        const relevantMatches = matches.filter((m) => m.match_score >= 5);

        // 6️⃣ Sort by score descending
        relevantMatches.sort((a, b) => b.match_score - a.match_score);

        // 7️⃣ Return results
        return res.status(200).json(
            relevantMatches
        );
    } catch (err) {
        console.error("Error in getUserMatches:", err);
        return res.status(500).json({ message: "Server error" });
    }
};