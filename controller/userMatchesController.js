import { pool } from "../config/db.js";

// Helper to find common elements between two arrays
function intersect(arr1, arr2) {
    return arr1.filter((x) => arr2.includes(x));
}

export const getUserMatches = async (req, res) => {
    const userId = req.params.userId;

    try {
        // Get the main user
        const userResult = await pool.query("SELECT * FROM profiles WHERE profiles.user_id = $1", [userId]);
        const user = userResult.rows[0];
        if (!user) return res.status(404).json({ message: "User not found" });

        // Convert fields safely to arrays
        const toArray = (field) => {
            if (!field) return [];
            if (Array.isArray(field)) return field;
            try {
                return JSON.parse(field);
            } catch {
                return [];
            }
        };

        const interestsArr = toArray(user.interests);
        const skillsArr = toArray(user.skills);
        const hobbiesArr = toArray(user.hobbies);

        // Fetch all other users
        const allUsersResult = await pool.query("SELECT * FROM profiles WHERE user_id != $1", [userId]);
        const allUsers = allUsersResult.rows;

        // Calculate match scores
        const matches = allUsers.map((u) => {
            const uInterests = toArray(u.interests);
            const uSkills = toArray(u.skills);
            const uHobbies = toArray(u.hobbies);

            let score = 0;

            if (user.country && user.country === u.country) score += 3;
            if (user.state && user.state === u.state) score += 2;
            if (user.city && user.city === u.city) score += 2;
            if (user.education && user.education === u.education) score += 2;
            if (user.profession && user.profession === u.profession) score += 2;
            if (user.company && user.company === u.company) score += 1;

            if (intersect(interestsArr, uInterests).length > 0) score += 3;
            if (intersect(skillsArr, uSkills).length > 0) score += 3;
            if (intersect(hobbiesArr, uHobbies).length > 0) score += 2;

            return { ...u, match_score: score };
        });

        // Sort by best match
        matches.sort((a, b) => b.match_score - a.match_score);

        // Return top 10
        return res.status(200).json(matches.slice(0, 10));
    } catch (err) {
        console.error("Error in getUserMatches:", err);
        return res.status(500).json({ message: "Server error" });
    }
};