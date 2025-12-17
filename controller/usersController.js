import { pool } from '../config/db.js';

//Get All Users with Profile Table:-
// export const allUsersProfiles = async (req, res) => {
//     let q = `SELECT u.*, p.* FROM users AS u 
//         INNER JOIN profiles AS p
//         ON u.id = p.user_id`;
//     let result = await pool.query(q);
//     console.log(result.rows);
//     res.json(result.rows);

// };

// export const allUsersProfiles = async (req, res) => {
//     try {
//         let q = `SELECT u.* , p.* FROM users AS u 
//                  INNER JOIN profiles AS p
//                  ON u.id = p.user_id`;

//         let result = await pool.query(q);
//         console.log(result.rows);
//         res.json(result.rows);
//     } catch (err) {
//         console.error("Error fetching users with profiles:", err.message);
//         res.status(500).json({ message: err.message });
//     }
// };

//Get specific Users and Profile table:
export const userProfile = async (req, res) => {
    let { userId } = req.params;
    let q = `SELECT u.*, p.*
        FROM users AS u
        INNER JOIN profiles AS p
        ON u.id = p.user_id
        WHERE u.id = $1;
    `;

    let result = await pool.query(q, [userId]);
    let user = result.rows[0];
    if (!user) {
        res.json({ message: "User is not exitings" });
    };
    res.json(user);
};